const mongoose = require('mongoose');
const Class = require('../modals/classModal');
const Rental = require('../modals/rentalsModal');

const studentSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Student must have a name']
        },
        classId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Class',
        },
        className: {
            type: String,
            required: [true, "Please enter the student's class name" ]
        },
        rentals: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Rental'
        }],
        registrationNumber: {
            type: String,
            required: [true, 'Student must have registration number'],
            unique: true,
            immutable: true
        },
        fine: {
            type: Number,
            default: 0
        }
    },
    { timestamps: true }
)


const Schema = mongoose.Schema;

const schoolYearSchema = new Schema({
    name: { type: String, required: true, unique: true },
    classes: [{
        name: { type: String, required: true },
        students: [{
            name: { type: String, required: true },
            rentals: [{ type: Schema.Types.ObjectId, ref: 'Rental' }]
        }]
    }]
});


studentSchema.pre('deleteOne', async function(next) {
    try {
        const { _conditions } = this;
        const student = await studentsModal.findOne(_conditions);
        const classId = student.class;
        if (!classId) throw new Error("Student does not exist");
        await Class.updateOne({_id: classId }, { $pull: { students: student._id }})
        await Rental.deleteMany({ registrationNumber: student.registrationNumber })
    } catch (e) {
        next(e)
    }
    next();
})

studentSchema.pre('save', async function(next) {
    if (this.isNew) {
        try {
            const targetClass = await Class.findOne({ name: this.className });
            if (!targetClass) throw new Error("Class Does not exist")
            await Class.updateOne(
                { name: this.className },
                { $push: { students: this._id } }
            )
            this.class = targetClass._id;

        } catch (e) {
            next(e)
        }
    } else if (this.isModified('className')) {
        try {
            const targetClass = await Class.findOne({ name: this.className });
            if (!targetClass) throw new Error("Class Does not exist")
            this.class = targetClass._id;
        } catch (e) {
            next(e)
        }
    }
    next()
})


const studentsModal = mongoose.model('Student', studentSchema);
module.exports = studentsModal;

