const mongoose = require('mongoose');
const Class = require('../modals/classModal');
const Rental = require('../modals/rentalsModal');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

const studentSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Student must have a name']
        },
        academicYear: {
            type: String,
            required: true
        },
        currentClassId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Class'
        },
        classIds: {
            type: [
                {
                    academicYear: {
                        type: String,
                        unique: false
                    },
                    classId: {
                        type: mongoose.Schema.Types.ObjectId,
                        ref: 'Class',
                    }
                }
            ]
        },
        rentals: {
            type: [{
                academicYear: {
                    type: String,
                    required: true,
                    // unique: true
                },
                rentalHistory: [
                    {
                        type: mongoose.Schema.Types.ObjectId,
                        ref: 'Rental'
                    }
                ],
            }],
            // default: () => {
            //     return [
            //         {
            //             academicYear: '2022-2023',
            //             rentalHistory: []
            //         }
            //     ]
            //
            // },
        },
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
    }
)


// TODO 7: DELETE STUDENT ????
studentSchema.methods.removeStudent = async function (req) {
    // const { _conditions } = this;
    // const student = await studentsModal.findOne(_conditions);
    // console.log(student)
    // if (!classId) next(new AppError("Student does not exists", 400));
    // await Class.updateMany({ students: _conditions._id }, { $pull: { students: _conditions._id }});
    // await Rental.deleteMany({ studentId: _conditions._id });
    await Class.updateOne(
        {_id: req.params.classId, students: req.params.studentId, academicYear: req.params.academicYear},
        {$pull: {students: req.params.studentId}}
    )
    await Rental.deleteMany(
        {studentId: req.params.studentId, academicYear: req.params.academicYear}
    )
    const student = this;
    student.classIds.forEach((cls, index) => {
        if (cls.academicYear === req.params.academicYear) {
            student.classIds.splice(index, 1)
        }
    });
    student.rentals.forEach((rent) => {
        if (rent.academicYear === req.params.academicYear) {
            student.rentals.rentalHistory = 0;
        }
    })

}


// 'rentals.$.rentalHistory': {academicYear: req.body.academicYear}}
studentSchema.pre('save', async function(next) {
    if (this.isNew) {
        const targetClass = await Class.updateOne(
            { _id: this.currentClassId, academicYear: this.academicYear },
            { $push: { students: this._id } },
            { new: true }
        )
        if (!targetClass) next(new AppError("Class does not exists!", 400));
        this.classIds.push({academicYear: this.academicYear, classId: this.currentClassId});
        this.academicYear = undefined;
        this.currentClassId = undefined;
    }
    next()
})

studentSchema.pre('insertMany', async function (next, docs, options) {
    const { classId } = options.request.params;
    const targetClass = await Class.findOne({_id: classId});
    for (let i = 0; i < docs.length; i++) {
        const student = await studentsModal.findOne({registrationNumber: docs[i].registrationNumber});
        if (student) {
            console.log(docs[i]._id);
            if (targetClass.students.includes(student._id) || student.classIds.some(obj => obj.classId === targetClass._id)) {
                docs.splice(i, 1);
            } else {
                targetClass.students.push(student._id);
                student.classIds.push({academicYear: targetClass.academicYear, classId: targetClass._id});
                await student.save({validateModifiedOnly: true});
                await targetClass.save({validateModifiedOnly: true});
                docs.splice(i, 1);
            }
        } else {
            docs[i].rentals = [{academicYear: targetClass.academicYear, rentalHistory: []}];
            docs[i].classIds = [{academicYear: targetClass.academicYear, classId: targetClass._id}];
            targetClass.students.push(docs[i]._id);
            await targetClass.save({validateModifiedOnly: true});
        }
    }
    next();
})

studentSchema.pre('insertOne', async function (next){

})

const studentsModal = mongoose.model('Student', studentSchema);
module.exports = studentsModal;

