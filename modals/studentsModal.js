const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Class = require('../modals/classModal');
const Rental = require('../modals/rentalsModal');
const Book = require('../modals/bookModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

const studentSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Student must have a name'],
            validate: {
                validator: (elem) => {
                    return /^[a-zA-Z]+(?:\s[a-zA-Z]+)*$/.test(elem)
                },
                message: "Invalid name, can't contain special characters"
            }
        },
        academicYear: {
            type: String,
            required: true,
            validate: {
                validator: (elem) => {
                    return /^\d{4}-\d{4}$/.test(elem);
                },
                message: 'Invalid academic year'
            }
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
                        required: true
                        // unique: false
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
            }]
        },
        registrationNumber: {
            type: String,
            required: [true, 'Student must have registration number'],
            unique: true,
            immutable: true,
            validate: {
                validator: (elem) => {
                    return /^[a-zA-Z0-9]+$/.test(elem)
                },
                message: "Invalid registration number, it can't contain spaces and special characters"
            }
        },
        fine: {
            type: Number,
            default: () => 0,
            validate: {
                validator: function (value) {
                    return value >= 0;
                },
                message: "Fine can't be negative"
            }
        },
        password: {
            type: String,
            minLength: 5,
            select: false,
            required: [true, "Please provide password"]
        },
        messages: {
            type: [
                {
                    subject: String,
                    message: String
                }
            ],
            default: () => {
                return [];
            }
        }
    },
    {
        indexes: [{unique: true, fields: ['registrationNumber']}],
    }
)


// TODO 7: DELETE STUDENT ????
studentSchema.methods.removeStudent = async function (req) {

    await Class.updateOne(
        {_id: req.params.classId, students: req.params.studentId},
        {$pull: {students: req.params.studentId}},
        {new: true}
    );

    const rentals = await Rental.find({studentId: req.params.studentId, academicYear: req.params.academicYear});
    if (rentals) {
        for (const rental of rentals) {
            const {book_id} = rental;
            await Book.updateOne({_id: book_id}, {$inc: {numberOfRentals: -1}}, {runValidators: true})
        }
    }

    await Rental.deleteMany(
        {studentId: req.params.studentId, academicYear: req.params.academicYear.trim()}
    )

    const student = this;
    student.classIds.forEach((item, index) => {
        if (item.academicYear) {
            if (item.academicYear === req.params.academicYear) {
                student.classIds.splice(index, 1);
            }
        }
    })

    student.rentals.forEach((rent, index) => {
        if (rent.academicYear) {
            if (rent.academicYear === req.params.academicYear) {
                student.rentals.splice(index, 1);
            }
        }
    })
}


// 'rentals.$.rentalHistory': {academicYear: req.body.academicYear}}
studentSchema.pre('save', async function (next) {
    if (this.isNew) {
        const targetClass = await Class.updateOne(
            {_id: this.currentClassId, academicYear: this.academicYear.trim()},
            {$push: {students: this._id}},
            {new: true, runValidators: true}
        )
        if (!targetClass) return next(new AppError("Class does not exists!", 401));
        this.classIds.push({academicYear: this.academicYear, classId: this.currentClassId});
        this.password = await bcrypt.hash(this.password, 12);
        this.messages = [];
        this.academicYear = undefined;
        this.currentClassId = undefined;
    }
    if (this.isModified('password') && !this.isNew) {
        this.password = await bcrypt.hash(this.password, 12);
    }
    next();
})

studentSchema.sendFineReductionMessage = (deductedAmount) => {
    const message = `Your fine has been deducted by ${deductedAmount} Rwf.`;
    this.messages.push({subject: "Fine Reduction", message});
}

studentSchema.sendFineIncreaseMessage = (increaseAmount) => {
    const message = `
        Your fine has been increased by ${increaseAmount} Rwf.
        If you think it's unfair, please kindly consider reaching out the librarian for more info.
    `;
    this.messages.push({subject: "Fine Increase", message});
}

studentSchema.methods.verifyPassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
}


studentSchema.pre('insertMany', async function (next, docs, options) {
    const {classId} = options.request.params;
    const targetClass = await Class.findOne({_id: classId});
    for (let i = 0; i < docs.length; i++) {
        const student = await studentsModal.findOne({registrationNumber: docs[i].registrationNumber});
        if (student) {
            // console.log(docs[i]._id);
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

studentSchema.pre('insertOne', async function (next) {

})

const studentsModal = mongoose.model('Student', studentSchema);
module.exports = studentsModal;

