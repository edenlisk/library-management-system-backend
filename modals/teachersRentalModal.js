const mongoose = require('mongoose');
const teachersRentalSchema = new mongoose.Schema(
    {
        nameOfBook: {
            type: String,
            required: [true, "Please provide name of the book"]
        },
        issueDate: {
            type: Date,
            default: () => new Date()
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
        try {
            const Teacher = require('../modals/teachersModal');
            await Teacher.updateOne(
                { _id: this.teacherID },
                { $push: { rentals: this._id } }
            )
        } catch (e) {
            next(e);
        }
    }
    next();
});

teachersRentalSchema.pre('deleteOne', async function(next) {
    try {
        const Teacher = require('../modals/teachersModal');
        const { _conditions } = this;
        await Teacher.updateOne({ rentals: _conditions._id }, { $pull: { rentals: _conditions._id } });
        // const teacherRental = await TeachersRentalModal.find({ _id: _conditions._id });
        // const teacherID = teacherRental.teacherID;
        next();
    } catch (e) {
        next(e)
    }
})

const TeachersRentalModal = mongoose.model('TeachersRental', teachersRentalSchema);
module.exports = TeachersRentalModal;
