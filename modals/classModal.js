const mongoose = require('mongoose');
const academicYear = require('./academicYear');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

const classSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            // unique: true,
            required: [true, 'Class must have a name']
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
            required: true
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
        const targetSchoolYear = await academicYear.findOneAndUpdate(
            {academicYear: this.academicYear},
            {$push: {classes: this._id}},
            {new: true}
        )
        if (!targetSchoolYear) next(new AppError("Target academic Year does not exists!", 400));
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
