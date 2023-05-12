const mongoose = require('mongoose');
const AppError = require('../utils/appError');

const teachersRentalSchema = new mongoose.Schema(
    {
        nameOfBook: {
            type: String,
            required: [true, "Please provide name of the book"]
        },
        numberOfBooks: {
          type: Number,
          required: [true, 'Please provide number of books']
        },
        issueDate: {
            type: Date,
            default: () => new Date()
        },
        dueDate: {
            type: Date,
            default: function () {
                return new Date(this.issueDate + 7 * 24 * 60 * 60 * 1000)
            }
        },
        rentalFor: {
            type: String,
            required: true
        },
        teacherID: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            immutable: true
        },
        returned: {
            type: Boolean,
            default: false
        }
    }
)

teachersRentalSchema.pre('save', async function (next) {
    if (this.isNew()) {
        const Teacher = require('../modals/teachersModal');
        const teacher = await Teacher.updateOne(
            { _id: this.teacherID },
            { $push: { rentals: this._id } },
            {new: true}
        )
        if (!teacher) next(new AppError("teacher does not exists", 400));
    }
    next();
});

teachersRentalSchema.pre('deleteOne', async function(next) {
    const Teacher = require('../modals/teachersModal');
    const { _conditions } = this;
    const teacher = await Teacher.updateOne(
        { rentals: _conditions._id },
        { $pull: { rentals: _conditions._id } },
        { new: true }
    );
    if (!teacher) next(new AppError("teacher does not exists", 400));
    next();
    // const teacherRental = await TeachersRentalModal.find({ _id: _conditions._id });
    // const teacherID = teacherRental.teacherID;
})

const TeachersRentalModal = mongoose.model('TeachersRental', teachersRentalSchema);
module.exports = TeachersRentalModal;
