const mongoose = require('mongoose');

const rentalSchema = new mongoose.Schema(
    {
        nameOfBook: {
            type: String,
            required: [true, "Rental must have a name of the book"]
        },
        registrationNumber: {
            type: String,
            immutable: true,
            required: [true, "Please provide student registration number"]
        },
        bookId: {
            type: String,
            required: [true, "Please provide bookId"]
        },
        author: {
            type: String,
            required: [true, "Please provide book author"]
        },
        issueDate: {
            type: Date,
            default: new Date(),
            // required: [true, "Please provide issue date of rental"]
        },
        dueDate: {
            type: Date,
            default: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        },
        nameOfLender: {
            type: String,
            required: [true, "Please provide name of librarian"]
        },
        returned: {
            type: Boolean,
            default: false
        }
    });

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
        try {
            // TODO 4: if student is not allowed to lend a book while he has not returned previous rentals
            // here I need to check if there is unreturned rentals, if there is any, deny new rental
            // if not allow new rental.
            await studentsModal.updateOne(
                { registrationNumber: this.registrationNumber },
                { $push: { rentals: this._id } }
            );
        } catch (e) {
            next(e)
        }
    }
    next();
})

rentalSchema.pre('deleteOne', async function(next) {
    const studentsModal = require('../modals/studentsModal');
    try {
        const { _conditions } = this;
        const rental = await rentalModal.findOne(_conditions);
        const registrationNumber = rental.registrationNumber;
        if (!registrationNumber) throw new Error("Rental does not exists");
        await studentsModal.updateOne(
            { registrationNumber: registrationNumber },
            { $pull: { rentals: rental._id }}
        )
    } catch (e) {
        next(e);
    }
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
