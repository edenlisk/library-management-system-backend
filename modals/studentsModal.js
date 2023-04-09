const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Student must have a name']
        },
        class: {
            type: String,
            required: [true, 'Student must belong to a class']
        },
        rentals: {
            type: [String],
            default: []
        },
        registrationNumber: {
            type: Number,
            required: [true, 'Student must have registration number']
        }
    }
)

module.exports = mongoose.model('Student', studentSchema);
