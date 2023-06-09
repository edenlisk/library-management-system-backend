const mongoose = require('mongoose');
const Book = require('../modals/bookModel');
const Student = require('../modals/studentsModal');
const academicYear = require('../modals/academicYear');
const AppError = require('../utils/appError');

const teachersRentalSchema = new mongoose.Schema(
    {
        nameOfBook: {
            type: String,
            required: [true, "Please provide name of the book"]
        },
        bookId: {
            type: String,
            required: true
        },
        author: {
          type: String,
        },
        book_id: {
          immutable: true,
          type: String,
          required: true
        },
        issueDate: {
            type: Date,
            required: [true, 'Please provide issue date of rental']
        },
        dueDate: {
            type: Date,
            required: [true, 'Please provide due date of rental']
        },
        categoryName: {
            type: String
        },
        returnDate: {
          type: Date,
          default: () => null
        },
        academicLevel: {
            type: String
        },
        language: {
          type: String,
        },
        active: {
          type: Boolean,
          default: () => true
        },
        rentalFor: {
            type: String,
            required: [true, 'Enter the render']
        },
        teacherId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Teacher',
            required: true,
            immutable: true
        },
        returned: {
            type: Boolean,
            default: () => false
        }
    }
)

teachersRentalSchema.pre('save', async function (next) {
    const Teacher = require('../modals/teachersModal');
    if (this.isNew) {
        const Teacher = require('../modals/teachersModal');
        const teacher = await Teacher.findOne({_id: this.teacherId})
        if (!teacher) next(new AppError("teacher does not exists", 400));
        teacher.rentals.push(this._id);
        await teacher.save({validateModifiedOnly: true, validateBeforeSave: false});
        await Book.findOneAndUpdate(
            {_id: this.book_id},
            {$inc: {numberOfRentals: 1, availableCopy: -1}}
        )
        if (!teacher) return next(new AppError("Teacher does not exists", 400));
    }
    if (this.isModified('returned') && !this.isNew) {
        if (this.returned === true) {
            await Book.findOneAndUpdate(
                {_id: this.book_id},
                {$inc: {availableCopy: 1}},
                {new: true}
            )
            const message = `You have successfully returned the book with the following details:
                BookId: ${this.bookId}
                Book name: ${this.nameOfBook}
                Issue date: ${this.issueDate.toISOString().split('T')[0]}
                Due date: ${this.dueDate.toISOString().split('T')[0]}
                Return date: ${this.returnDate.toISOString().split('T')[0]}
                Book category: ${this.categoryName}
                Language: ${this.language} \n
                done at: ${new Date().toLocaleDateString()}.
            `;
            await Teacher.findByIdAndUpdate(this.teacherId, {$push: {messages: {subject: "Returned Rental notification", message}}});
            this.active = null;
        }
    }
    if (this.isModified('dueDate') && !this.isNew) {
        const message = `You have successfully extended due date for the book with the following details:
            BookId: ${this.bookId}
            Book name: ${this.nameOfBook}
            Issue date: ${this.issueDate.toISOString().split('T')[0]}
            Due date: ${this.dueDate.toISOString().split('T')[0]}
            Book category: ${this.categoryName}
            Language: ${this.language}  \n
            done at: ${new Date().toLocaleDateString()}.
        `;
        await Teacher.findByIdAndUpdate(this.teacherId, {$push: {messages: {subject: "Extended rental due date", message}}});
    }
    if (this.isModified('active') && !this.isModified('returned') && !this.isNew) {
        if (this.active === false && this.returned === false) {
            const message = `⚠ The book with the following details is marked as lost:
                BookId: ${this.bookId}
                Book name: ${this.nameOfBook}
                Issue date: ${this.issueDate.toISOString().split('T')[0]}
                Book category: ${this.categoryName}
                Academic Level: ${this.academicLevel}
                Language: ${this.language} \n \n \n
                Please if you have this book or any useful information, kindly consider reaching out the librarian to fix the issue. \n
                Thank you in advance \n 
                done at: ${new Date().toLocaleDateString()}.
            `;
            await Teacher.findByIdAndUpdate(this.teacherId, {
                $push: {
                    messages: {
                        subject: "Lost Book Notification",
                        message
                    }
                }
            })
            const schoolYearPrefix = this.issueDate.toISOString().split('T')[0].split('-')[0];
            const schoolYearSuffix = parseInt(schoolYearPrefix) + 1;
            const schoolYear = `${schoolYearPrefix}-${schoolYearSuffix}`;
            await Student.updateMany({classIds: {$elemMatch: {academicYear: schoolYear}}} , {
                $push: {
                    messages: {
                        subject: "Lost Book Notification",
                        message
                    }
                }
            });
        }
    }
    next();
})

teachersRentalSchema.pre('deleteOne', async function(next) {
    const Teacher = require('../modals/teachersModal');
    const { _conditions } = this;
    const rental = await TeachersRentalModal.findOne({_id: _conditions._id});
    if (!rental) return next(new AppError("This rental no longer exists!", 400));
    if (rental.returned === false) return next(new AppError("Rental cannot be deleted while not returned", 400));
    await Teacher.updateOne(
        { rentals: _conditions._id },
        { $pull: { rentals: _conditions._id } }
    );
    await Book.updateOne(
        {_id: rental.book_id},
        {$inc: { numberOfRentals: -1 }}
    );
    next();
})

const TeachersRentalModal = mongoose.model('TeachersRental', teachersRentalSchema);
module.exports = TeachersRentalModal;
