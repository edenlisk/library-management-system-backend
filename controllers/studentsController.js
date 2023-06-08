const Student = require('../modals/studentsModal');
const Class = require('../modals/classModal');
const csvtojson = require('csvtojson');
const multer = require('multer');
const APIFeatures = require('../utils/apiFeatures');
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
    if (!student) return next(new AppError("Student no longer exists!", 400));
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
    const updatedStudent = await Student.findById(req.params.studentId);
    if (!updatedStudent) next(new AppError("Student does not exists!", 400));
    if (req.body.name) updatedStudent.name = req.body.name;
    if (req.body.fine) updatedStudent.fine = parseInt(updatedStudent.fine) + parseInt(req.body.fine);
    await updatedStudent.save({validateModifiedOnly: true});
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
    if (!student) next(new AppError("Student does not exists!", 400));
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
            if (targetClass.students.includes(student._id) || checkExisting(student.classIds)) {
                return next(new AppError(`There is already a student with this registration number`, 400));
            } else {
                student.classIds.push({academicYear: targetClass.academicYear.trim(), classId: targetClass._id});
                student.rentals.push({academicYear: targetClass.academicYear.trim(), rentalHistory: []});
                targetClass.students.push(student._id);
                await student.save({validateModifiedOnly: true});
                await targetClass.save({validateModifiedOnly: true});
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
                registrationNumber: req.body.registrationNumber
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
    // const firstAggregate = [
    //     {
    //         $match: { }
    //     },
    //     {
    //         $unwind: "$rentals"
    //     },
    //     {
    //         $group: {
    //             _id: {
    //                 academicYear: "$rentals.academicYear",
    //                 registrationNumber: "$registrationNumber"
    //             },
    //             rentalCount: {
    //                 $sum: {
    //                     $size: "$rentals.rentalHistory"
    //                 }
    //             }
    //         }
    //     },
    //     {
    //         $group: {
    //             _id: "$_id.academicYear",
    //             studentCount: {
    //                 $sum: 1
    //             },
    //             rentalCount: {
    //                 $sum: "$rentalCount"
    //             }
    //         }
    //     },
    //     {
    //         $project: {
    //             academicYear: "$_id",
    //             studentCount: 1,
    //             rentalCount: 1,
    //             _id: 0
    //         }
    //     }
    // ]
    // const secondAggregation = [
    //     {
    //         $match: {classIds: {$elemMatch: {classId: req.params.classId}}}
    //     },
    //     {
    //         $project: {
    //             _id: 1,
    //             name: 1,
    //             fine: 1,
    //             registrationNumber: 1,
    //             numberOfRentals: { $size: "rentals.$.rentalHistory" }
    //         }
    //     }
    // ]
    const students = await Student.find({
        classIds: {$elemMatch: {classId: req.params.classId}},
        rentals: {$elemMatch: {academicYear: req.params.academicYear}}
    });
    const result = [];
    students.forEach(stu => {
        if (stu.rentals) {
            stu.rentals.forEach(rent => {
                if (rent.academicYear === req.params.academicYear) {
                    const {_id, name, registrationNumber, fine} = stu;
                    const std = {_id, name, registrationNumber, fine, numberOfRentals: rent.rentalHistory.length};
                    result.push(std);
                }
            })
        }
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
        const students = await csvtojson().fromFile(`${__dirname}/../public/data/${req.file.filename}`);
        if (!students) return next(new AppError("No data found in this file", 400));
        for (const student of students) {
            const rep = {};
            rep.name = student.name;
            const targetStudent = await Student.findOne({registrationNumber: student.registrationNumber});
            if (targetStudent) {
                if (targetClass.students.includes(targetStudent._id)) {
                    rep.issues = `belongs in this class or other class`;
                    rep.status = 'Not added';
                    report.push(rep);
                    const index = students.indexOf(targetStudent);
                    students.splice(index, 1);
                    // continue
                    // students.splice(i, 1);
                } else {
                    targetClass.students.push(targetStudent._id);
                    targetStudent.classIds.push({academicYear: targetClass.academicYear, classId: targetClass._id});
                    targetStudent.rentals.push({academicYear: targetClass.academicYear, rentalHistory: []});
                    await targetStudent.save({validateModifiedOnly: true});
                    await targetClass.save({validateModifiedOnly: true});
                    rep.issues = ``;
                    rep.status = "added successfully";
                    report.push(rep);
                    const index = students.indexOf(targetStudent);
                    students.splice(index, 1);
                }
            } else {
                const isRegValid = /^[a-zA-Z0-9]+$/.test(student.registrationNumber);
                const isNameValid = /^[a-zA-Z]+(?:\s[a-zA-Z]+)*$/.test(student.name);
                if (isRegValid !== true) {
                    rep.issues = `Invalid registration number, it can't contain special characters and spaces`;
                    rep.status = "Not added";
                    report.push(rep);
                } else if (isNameValid !== true) {
                    rep.issues = `Invalid name, it can't contain special characters`;
                    rep.status = "Not Added";
                    report.push(rep);
                } else {
                    await Student.create(
                        {
                            name: student.name,
                            academicYear: targetClass.academicYear,
                            currentClassId: targetClass._id,
                            rentals: [{academicYear: targetClass.academicYear, rentalHistory: []}],
                            registrationNumber: student.registrationNumber
                        }
                    )
                    rep.issues = ``;
                    rep.status = 'added successfully';
                    report.push(rep);
                }
            }
        }
        // const newClass = await Class.findOne({_id: req.params.classId});
        res
            .status(200)
            .json(
                {
                    status: "Success",
                    data: {
                        report
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
