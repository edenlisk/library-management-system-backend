const mongoose = require('mongoose');
const Book = require('../modals/bookModel');

const teacherSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Teacher must have a name"],
            validate: {
                validator: (elem) => {
                    return /^[a-zA-Z]+(?:\s[a-zA-Z]+)*$/.text(elem)
                },
                message: "Invalid name, can't contain special characters"
            }
        },
        registrationNumber: {
            type: String,
            unique: true,
            required: [true, "Teacher must have registration number"],
            immutable: true,
            validate: {
                validator: (elem) => {
                    return /^[a-zA-Z0-9]+$/.test(elem)
                },
                message: "Invalid registration number, it can't contain spaces and special characters"
            }
        },
        rentals: {
            type: [
                {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'TeachersRental'
                }
            ],
            default: () => []
        }
    },
    {
        indexes: [{ unique: true, fields: ['registrationNumber'] }],
    }
)

teacherSchema.pre('deleteOne', async function(next) {
    try {
        const TeachersRentalModal = require('../modals/teachersRentalModal');
        const { _conditions } = this;
        const rentals = await TeachersRentalModal.find({teacherId: _conditions._id});
        await TeachersRentalModal.deleteMany({ teacherID: _conditions._id });
        if (rentals) {
            for (const rental of rentals) {
                const { book_id } = rental;
                await Book.updateOne(
                    { _id: book_id },
                    { $inc: { numberOfRentals: -1 } },
                    { runValidators: true }
                )
            }
        }
        next();
    } catch (e) {
        next(e);
    }
})

module.exports = mongoose.model('Teacher', teacherSchema);
