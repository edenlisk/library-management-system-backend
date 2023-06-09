const fs = require('fs');
const multer = require('multer');
const Student = require('../modals/studentsModal');
const Class = require('../modals/classModal');
const csvtojson = require('csvtojson');
const APIFeatures = require('../utils/apiFeatures');
const { capitalizeSentence } = require('../utils/helpFunctions');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');


exports.getAllStudents = catchAsync(async (req, res, next) => {
    const result = new APIFeatures(Student.find({classIds: {$elemMatch: {academicYear: req.params.academicYear}}}).select('+rentals').populate(
        {
            path: 'rentals',
            populate: {
                path: 'rentalHistory',
                model: 'Rental'
            }
        }), req.query)
        .filter()
        .sort()
        .limitFields()
        .paginate()
    ;
    const students = await result.mongooseQuery;
    res
        .status(200)
        .json(
            {
                status: "Success",
                results: students.length,
                data: {
                    students
                }
            }
        )
    ;
})

exports.getStudent = catchAsync(async (req, res, next) => {
    const student = await Student.findOne({_id: req.params.studentId}).select({rentals: 0});
    if (!student) return next(new AppError("Student no longer exists!", 401));
    res
        .status(200)
        .json(
            {
                status: "Success",
                data: {
                    student
                }
            }
        )
    ;
})

exports.updateStudent = catchAsync(async (req, res, next) => {
    const updatedStudent = await Student.findById(req.params.studentId).select({name: 1, password: 1, fine: 1, messages: 1})
    if (!updatedStudent) return next(new AppError("Student does not exists!", 400));
    if (req.body.name) updatedStudent.name = req.body.name;
    if (req.body.password) updatedStudent.password = req.body.password;
    if (req.body.fine) updatedStudent.fine = parseInt(updatedStudent.fine) + parseInt(req.body.fine);
    if (parseInt(req.body.fine) < 0) {
        await updatedStudent.sendFineReductionMessage(parseInt(req.body.fine) * -1);
    } else if (parseInt(req.body.fine) > 0) {
        await updatedStudent.sendFineIncreaseMessage(parseInt(req.body.fine));
    }
    await updatedStudent.save({validateModifiedOnly: true});
    updatedStudent.password = undefined;
    // TODO 2: CREATE `post` middleware to update class when student is created, DELETED or updated.
    res
        .status(200)
        .json(
            {
                status: "Success",
                data: {
                    updatedStudent
                }
            }
        )
    ;
})

exports.deleteStudent = catchAsync(async (req, res, next) => {
    const student = await Student.findOne({_id: req.params.studentId});
    if (!student) return next(new AppError("Student does not exists!", 400));
    await student.removeStudent(req);
    await student.save({validateModifiedOnly: true});
    res
        .status(204)
        .json(
            {
                status: "Success"
            }
        )
    ;
})

exports.createStudent = catchAsync(async (req, res, next) => {
    const isRegValid = /^[a-zA-Z0-9]+$/.test(req.body.registrationNumber);
    if (isRegValid !== true) return next(new AppError("Invalid Registration number, It can't contain special characters and spaces", 401));

    const student = await Student.findOne({$and: [{registrationNumber: req.body.registrationNumber.trim()}]});
    const targetClass = await Class.findOne({_id: req.params.classId, academicYear: req.params.academicYear.trim()});
    const checkExisting = (data) => {
        return data.some(obj => obj.academicYear === targetClass.academicYear.trim())
    }
    if (student) {
        if (!targetClass) {
            next(new AppError(`Class you're trying to insert student does not exists`, 400));
        } else {
            // student.classIds.some(obj => obj.academicYear === targetClass.academicYear) ||
            if (student.classIds.some(obj => obj.academicYear === targetClass.academicYear)) {
                return next(new AppError(`Student with registration number: ${student.registrationNumber} already exists in this class`, 400));
            } else {
                if (student.name.toLowerCase().includes(req.body.name.slice(0, 4).toLowerCase())) {
                    student.classIds.push({academicYear: targetClass.academicYear.trim(), classId: targetClass._id});
                    student.rentals.push({academicYear: targetClass.academicYear.trim(), rentalHistory: []});
                    targetClass.students.push(student._id);
                    await student.save({validateModifiedOnly: true});
                    await targetClass.save({validateModifiedOnly: true});
                } else {
                    return next(new AppError(`This registration number: ${student.registrationNumber} is already occupied by ${student.name}`));
                }
            }
        }
        res
            .status(201)
            .json(
                {
                    status: "Success",
                    data: {
                        student
                    }
                }
            )
        ;
    } else {
        if (!targetClass) return next(new AppError("Class does not exists!", 400));
        const newStudent = await Student.create(
            {
                name: req.body.name,
                currentClassId: req.params.classId,
                academicYear: req.params.academicYear,
                rentals: [{academicYear: req.params.academicYear, rentalHistory: []}],
                registrationNumber: req.body.registrationNumber,
                password: req.body.registrationNumber
            }
        );
        res
            .status(201)
            .json(
                {
                    status: "Success",
                    data: {
                        newStudent
                    }
                }
            )
        ;
    }


})

exports.getStudentsByClassDeprecated = catchAsync(async (req, res, next) => {
    const students = await Student.find({classId: req.params.id});
    console.log(students)
    res
        .status(200)
        .json(
            {
                status: "Success",
                data: {
                    students
                }
            }
        )
    ;
})

exports.getStudentsByClass = catchAsync(async (req, res, next) => {
    const students = await Student.find({
        classIds: {$elemMatch: {classId: req.params.classId}},
    });
    const result = [];
    students.forEach(stu => {
           stu.rentals.forEach(rent => {
               if (rent.academicYear === req.params.academicYear) {
                   const {_id, name, registrationNumber, fine} = stu;
                   const std = {_id, name, registrationNumber, fine, numberOfRentals: rent.rentalHistory.length};
                   result.push(std);
               }
           })
    })
    res
        .status(200)
        .json(
            {
                status: "Success",
                data: {
                    result
                }
            }
        )
    ;
})

exports.importStudents = catchAsync(async (req, res, next) => {
    const targetClass = await Class.findOne({_id: req.params.classId});
    const checkExisting = (data, target) => {
        if (data.length > 0) {
            return data.some(obj => obj.academicYear === target.academicYear)
        } else {
            return false;
        }
    }
    const report = [];
    if (!targetClass) {
        return next(new AppError("Class does not exists", 401));
    } else {
        if (!fs.existsSync(`${__dirname}/../public/data/${req.file.filename}`)) {
            return next(new AppError('File not found, please try again', 401));
        }
        const students = await csvtojson().fromFile(`${__dirname}/../public/data/${req.file.filename}`);
        if (!students) return next(new AppError("No data found in this file", 400));
        for (const student of students) {
            const rep = {};
            rep.name = student.name;
            const targetStudent = await Student.findOne({registrationNumber: student.registrationNumber});
            if (targetStudent) {
                if (targetStudent.classIds.some(obj => obj.academicYear === targetClass.academicYear)) {
                    console.log('student already exists')
                    const index = students.indexOf(student);
                    // students.splice(index, 1);
                } else {
                    if (targetStudent.name.toLowerCase().includes(student.name.slice(0, 4).toLowerCase())) {
                        targetStudent.classIds.push({academicYear: targetClass.academicYear, classId: targetClass._id});
                        targetClass.students.push(targetStudent._id);
                        targetStudent.rentals.push({academicYear: targetClass.academicYear, rentalHistory: []});
                        await targetClass.save({validateModifiedOnly: true});
                        await targetStudent.save({validateModifiedOnly: true});
                        const index = students.indexOf(student);
                        console.log('student exists in database but not in this class');
                        // students.splice(index, 1);
                    } else {
                        console.log(`This registration number: ${student.registrationNumber} is already occupied by ${student.name}`);
                    }
                }
            } else {
                const isRegValid = /^[a-zA-Z0-9]+$/.test(student.registrationNumber);
                const isNameValid = /^[a-zA-Z]+(?:\s[a-zA-Z]+)*$/.test(student.name);
                if (isRegValid !== true || isNameValid !== true) {
                    const index = students.indexOf(student);
                    console.log('invalid registration number or name');
                    // students.splice(index, 1);
                } else {
                    await Student.create(
                        {
                            name: capitalizeSentence(student.name),
                            registrationNumber: student.registrationNumber,
                            password: student.registrationNumber,
                            academicYear: targetClass.academicYear,
                            currentClassId: targetClass._id,
                            rentals: [{academicYear: targetClass.academicYear, rentalHistory: []}]
                        }
                    )
                }
            }
        }
        const newClass = await Class.findOne({_id: req.params.classId});
        res
            .status(200)
            .json(
                {
                    status: "Success",
                    data: {
                        newClass
                    }
                }
            )
        ;
    }
})

const multerStorage = multer.diskStorage(
    {
        destination: function (req, file, cb) {
            cb(null, 'public/data');
        },
        filename: function (req, file, cb) {
            const extension = file.mimetype.split('/')[1];
            cb(null, `students-${req.params.classId}-${new Date().getTime().toString()}.${extension}`);
        }
    }
)

const multerFilter = (req, file, cb) => {
    if (!file.mimetype.split('/')[0].startsWith('text')) {
        cb(new AppError("Not an CSV file, please upload only CSV", 400), false);
    } else {
        cb(null, true);
    }
}

const upload = multer(
    {
        storage: multerStorage,
        fileFilter: multerFilter
    }
)


exports.uploadClassStudents = upload.single('students');