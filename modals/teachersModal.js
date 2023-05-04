const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Teacher must have a name"]
        },
        registrationNumber: {
            type: String,
            unique: true,
            required: [true, "Teacher must have registration number"],
            immutable: true
        },
        rentals: {
            type: [mongoose.Schema.Types.ObjectId],
            ref: 'TeachersRental'
        }
    }
)

teacherSchema.pre('deleteOne', async function(next) {
    try {
        const TeachersRentalModal = require('../modals/teachersRentalModal');
        const { _conditions } = this;
        await TeachersRentalModal.deleteMany({ teacherID: _conditions._id });
        next();
    } catch (e) {
        next(e);
    }
})

module.exports = mongoose.model('Teacher', teacherSchema);
