const mongoose = require('mongoose');
const AppError = require('../utils/appError');
const Book = require('../modals/bookModel');

const rentalSchema = new mongoose.Schema(
    {
        nameOfBook: {
            type: String,
            required: [true, "Rental must have a name of the book"]
        },
        studentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Student'
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
          type: Date
        },
        academicLevel: {
          type: String
        },
        categoryName: String,
        returned: {
            type: Boolean,
            default: false
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
            default: true
        },
        nextActiveDate: {
            type: Date
        }
    }, {timestamps: true});


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
            {$inc: {numberOfRentals: 1}},
            {new: true}
        )
        if (!student) return next(new AppError("Student or academic Year does not exists!", 400));
    }
    if (this.isModified('returned') && !this.isNew) {
        if (this.returned === true) {
            this.active = undefined;
            this.nextActiveDate = undefined;
        }
    }
    if (this.isModified('active') && !this.isNew) {
        if (this.active === false && this.returned === false) {
            const today = new Date();
            today.setDate(today.getDate() + 90);
            this.nextActiveDate = new Date(today).toISOString().split('T')[0];
        }
    }
    next();
})

rentalSchema.pre('deleteOne', async function(next) {
    const studentsModal = require('../modals/studentsModal');
    const { _conditions } = this;
    const rental = await rentalModal.findOne(_conditions);
    const studentId = rental.studentId;
    if (!studentId) return next(new AppError("Rental does not exits!", 400));
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
