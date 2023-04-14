const mongoose = require('mongoose');

const classSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            unique: true,
            required: [true, 'Class must have a name']
        },
        category: {
            type: String,
            required: true
        },
        students: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Student'
        }],
        academicYear: {
            type: String,
            required: true
        }
    }
);

classSchema.pre('deleteOne', async function (next) {
    const studentModal = require('../modals/studentsModal');
    const rentalsModal = require('../modals/rentalsModal');
    try {
        const { _conditions } = this;
        const students = await studentModal.find({ class: _conditions._id });
        let studentsIdentifiers = [];
        students.forEach((stu) => {
            studentsIdentifiers.push(stu.registrationNumber);
        })
        await rentalsModal.deleteMany({ registrationNumber: { $in: studentsIdentifiers } })
        await studentModal.deleteMany({ class: _conditions._id });
    } catch (e) {
        next(e);
    }
})

// 1. retrieve all students in the class
// 2. get their registration number
// 3. delete rentals with that registration numbers


module.exports = mongoose.model('Class', classSchema);
