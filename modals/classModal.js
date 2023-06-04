const mongoose = require('mongoose');
const academicYear = require('./academicYear');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

const classSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            // unique: true,
            required: [true, 'Class must have a name'],
            validate: {
                validator: (elem) => {
                    return /^[a-zA-Z]+(?:\s[a-zA-Z]+)*$/.test(elem)
                },
                message: "Invalid name, can't contain special characters"
            }
        },
        category: {
            type: String,
            required: true
        },
        students: {
            type: [{
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Student',
            }]
        },
        academicYear: {
            type: String,
            required: true,
            validate: {
                validator: (elem) => {
                    return /^\d{4}-\d{4}$/.test(elem);
                },
                message: 'Invalid academic year'
            },
            immutable: true
        },
        nameAcademicYear: {
            type: String,
            default: function (){
                return `${this.name}${this.academicYear}`
            },
            immutable: true,
            unique: true,
            select: false
        }
    }
);

classSchema.pre('save', async function (next) {
    if (this.isNew) {
        this.name = this.name.toUpperCase();
        const targetSchoolYear = await academicYear.findOneAndUpdate(
            {academicYear: this.academicYear},
            {$push: {classes: this._id}},
            {new: true}
        )
        if (!targetSchoolYear) next(new AppError(`academic Year ${this.academicYear} does not exists!`, 400));
    }
    next();
})

classSchema.pre('deleteOne', async function (next) {
    const studentModal = require('../modals/studentsModal');
    const rentalsModal = require('../modals/rentalsModal');
    const { _conditions } = this;
    const targetClass = await classModel.findById(_conditions._id);
    // const matchStudents = await studentModal.find(
    //     {  classIds: {$elemMatch: {academicYear: targetClass.academicYear, classId: targetClass._id}}}
    // );
    const students = await studentModal.find(
        {classIds: {$elemMatch: {academicYear: targetClass.academicYear, classId: targetClass._id}}}
    );
    // make sure the following statement works fine
    await studentModal.updateMany(
        {  classIds: {$elemMatch: {academicYear: targetClass.academicYear, classId: targetClass._id}}},
        {$pull: {classIds: {academicYear: targetClass.academicYear, classId: targetClass._id}}}
    );

    for (const student of students) {
        student.rentals.forEach((rent, index) => {
            if (rent.academicYear === targetClass.academicYear) {
                student.rentals.splice(index, 1);
            }
        })
    }

    let studentsIdentifiers = [];
    students.forEach((stu) => {
        studentsIdentifiers.push(stu._id);
    })
    await rentalsModal.deleteMany(
        { studentId: {$in: studentsIdentifiers}, academicYear: targetClass.academicYear }
    )
    next();
    // await studentModal.deleteMany({ class: _conditions._id });
})


// 1. retrieve all students in the class
// 2. get their registration number
// 3. delete rentals with that registration numbers

const classModel = mongoose.model('Class', classSchema);
module.exports = classModel;
