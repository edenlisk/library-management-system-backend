const mongoose = require('mongoose');
const AppError = require('../utils/appError');

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
        bookId: {
            type: String,
            required: [true, "Please provide bookId"]
        },
        // author: {
        //     type: String,
        //     required: [true, "Please provide book author"]
        // },
        issueDate: {
            type: String,
            immutable: true,
            required: [true, "Please provide issue date of rental"]
        },
        category: String,
        dueDate: {
            type: String,
            required: true
        },
        // nameOfLender: {
        //     type: String,
        //     required: [true, "Please provide name of librarian"]
        // },
        returned: {
            type: Boolean,
            default: false
        },
        academicYear: {
            type: String,
            required: true
        }
    }, {timestamps: true});

// rentalSchema.post('save', async function (next) {
//     await Student.updateOne(
//         { name: this.studentRegistrationNumber },
//         { $push: {rentals: this._id} }
//     );
//     next();
// })

rentalSchema.pre('save', async function(next) {
    const studentsModal = require('../modals/studentsModal');
    if (this.isNew) {
        // TODO 4: if student is not allowed to lend a book while he has not returned previous rentals
        // here I need to check if there is unreturned rentals, if there is any, deny new rental
        // if not allow new rental.
        // await studentsModal.updateOne(
        //     { _id: this.studentId },
        //     { $push: { rentals: this._id } }
        // );
        const student = await studentsModal.findOneAndUpdate(
            {_id: this.studentId, rentals: {$elemMatch: {academicYear: this.academicYear}}},
            {$push: {'rentals.$.rentalHistory': this._id}},
            {runValidators: true}
        )
        // const rentalFormat = {academicYear: this.academicYear, rentalHistory: []};
        if (!student) {
            next(new AppError("Student or academic Year does not exists!", 401));
            // await studentsModal.updateOne(
            //     {_id: this.studentId},
            //     {$push: {rentals: {academicYear: this.academicYear, rentalHistory: [this._id]} }}
            // )
        }
    }
    next();
})

rentalSchema.pre('deleteOne', async function(next) {
    const studentsModal = require('../modals/studentsModal');
    const { _conditions } = this;
    const rental = await rentalModal.findOne(_conditions);
    const studentId = rental.studentId;
    if (!studentId) next(new AppError("Rental does not exits!", 400));
    await studentsModal.updateOne(
        { _id: studentId, rentals: {$elemMatch: {academicYear: rental.academicYear}} },
        { $pull: { 'rentals.$.rentalHistory': rental._id }}
    )
    next();
})

// rentalSchema.methods.updateStudent = async function () {
//     await Student.updateOne(
//         { registrationNumber: this.RegistrationNumber },
//         { $push: { rentals: this._id } }
//     );
// }
const rentalModal = mongoose.model('Rental', rentalSchema);
module.exports = rentalModal;
