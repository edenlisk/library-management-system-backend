const mongoose = require('mongoose');

const academicYearSchema = new mongoose.Schema(
    {
        academicYear: {
            type: String,
            required: true,
            unique: true,
            validate: {
                validator: (elem) => {
                    return /^\d{4}-\d{4}$/.test(elem);
                },
                message: 'Invalid academic year'
            }
        },
        classes: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Class'
            }
        ],
        archive: {
            type: Boolean,
            default: false
        }
    }
)


module.exports = mongoose.model('academicYear', academicYearSchema);
