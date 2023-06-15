const mongoose = require('mongoose');
const AppError = require('../utils/appError');
const Book = require('../modals/bookModel');
const Settings = require('../modals/settingsModel');

const rentalSchema = new mongoose.Schema(
    {
        nameOfBook: {
            type: String,
            required: [true, "Rental must have a name of the book"]
        },
        studentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Student',
            immutable: false,
            required: true
        },
        author: {
          type: String
        },
        bookId: {
            type: String,
            required: [true, "Please provide bookId"]
        },
        book_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Book',
            immutable: true
        },
        issueDate: {
            type: Date,
            immutable: true,
            required: [true, "Please provide issue date of rental"]
        },
        dueDate: {
            type: Date,
            required: true
        },
        returnDate: {
          type: Date,
          default: () => null
        },
        academicLevel: {
          type: String
        },
        categoryName: String,
        returned: {
            type: Boolean,
            default: () => false
        },
        language: {
          type: String
        },
        academicYear: {
            type: String,
            required: true
        },
        active: {
            type: Boolean,
            default: () => true
        },
        nextActiveDate: {
            type: Date
        }
    },
    {timestamps: true}
);


rentalSchema.pre('save', async function(next) {
    const studentsModal = require('../modals/studentsModal');
    if (this.isNew) {
        // TODO 4: if student is not allowed to lend a book while he has not returned previous rentals
        // here I need to check if there is unreturned rentals, if there is any, deny new rental
        // if not allow new rental.
        const student = await studentsModal.findOneAndUpdate(
            {_id: this.studentId, rentals: {$elemMatch: {academicYear: this.academicYear}}},
            {$push: {'rentals.$.rentalHistory': this._id}},
            {runValidators: true}
        )
        await Book.findOneAndUpdate(
            {_id: this.book_id},
            {$inc: {numberOfRentals: 1, availableCopy: -1 }},
            {new: true}
        )
        if (!student) return next(new AppError("Student or academic Year does not exists!", 400));
    }

    if (this.isModified('dueDate') && !this.isNew) {
        const message = `
            You have successfully extended due date for the book with the following details: \n
            BookId: ${this.bookId} \n
            Book name: ${this.nameOfBook} \n
            Issue date: ${this.issueDate} \n
            Due date: ${this.dueDate} \n
            Book category: ${this.categoryName} \n
            Language: ${this.language}  \n \n
            done at: ${new Date().toLocaleDateString()}.
        `;
        await studentsModal.findByIdAndUpdate(this.studentId, {$push: {messages: {subject: "Extended rental due date", message}}});
    }

    if (this.isModified('returned') && !this.isNew) {
        if (this.returned === true) {
            await Book.findOneAndUpdate(
                {_id: this.book_id},
                {$inc: {availableCopy: 1}},
                {new: true}
            )
            const message = `
                You have successfully returned the book with the following details: \n
                BookId: ${this.bookId} \n
                Book name: ${this.nameOfBook} \n
                Issue date: ${this.issueDate} \n
                Due date: ${this.dueDate} \n
                Return date: ${this.returnDate} \n
                Book category: ${this.categoryName} \n
                Language: ${this.language} \n \n
                done at: ${new Date().toLocaleDateString()}.
            `;
            await studentsModal.findByIdAndUpdate(this.studentId, {$push: {messages: {subject: "Returned Rental notification", message}}});
            this.active = null;
            this.nextActiveDate = null;
        }
    }
    if (this.isModified('active') && !this.isModified('returned') && !this.isNew) {
        if (this.active === false && this.returned === false) {
            const settings = await Settings.findOne().limit(1);
            const today = new Date();
            today.setDate(today.getDate() + settings.inactivityDays);
            this.nextActiveDate = new Date(today).toISOString().split('T')[0];
            const message = `
                ⚠ The book with the following details is marked as lost: \n
                BookId: ${this.bookId} \n
                Book name: ${this.nameOfBook} \n
                Issue date: ${this.issueDate} \n
                Book category: ${this.categoryName} \n
                Academic Level: ${this.academicLevel} \n
                Language: ${this.language} \n \n \n \n
                Please if you have this book or any useful information, kindly consider reaching out librarian. \n
                Thank you in advance \n \n
                done at: ${new Date().toLocaleDateString()}.
            `;
            await studentsModal.updateMany({classIds: {$elemMatch: {academicYear: this.academicYear}}}, {$push: {messages: {subject: "Lost Book Notification", message}}});
        }
    }
    next();
})

rentalSchema.pre('deleteOne', async function(next) {
    const studentsModal = require('../modals/studentsModal');
    const { _conditions } = this;
    const rental = await rentalModal.findOne({_id: _conditions._id});
    const studentId = rental.studentId;
    if (!studentId) return next(new AppError("Rental does not exits!", 400));
    if (rental.returned === false) return next(new AppError("Rental cannot be deleted while not returned", 400));
    await studentsModal.updateOne(
        { _id: studentId, rentals: {$elemMatch: {academicYear: rental.academicYear}} },
        { $pull: { 'rentals.$.rentalHistory': rental._id }}
    )
    await Book.updateOne(
        {_id: rental.book_id},
        {$inc: { numberOfRentals: -1 }}
    )
    next();
})
const rentalModal = mongoose.model('Rental', rentalSchema);
module.exports = rentalModal;
