const Teacher = require('../modals/teachersModal');
const APIFeatures = require('../utils/apiFeatures');
const AppError = require('../utils/appError');
const TeachersRental = require('../modals/teachersRentalModal');
const catchAsync = require('../utils/catchAsync');


exports.getAllTeachers = catchAsync(async (req, res, next) => {
    // const result = new APIFeatures(Teacher.find().populate('teachersRentals'), req.query)
    //     .filter()
    //     .sort()
    //     .limitFields()
    //     .paginate()
    // ;
    // const teachers = await result.mongooseQuery;

    const teachers = await Teacher.aggregate(
        [
            {
                $lookup: {
                    from: 'teachersrentals',
                    localField: '_id',
                    foreignField: 'teachersId',
                    as: 'teachersRentals'
                }
            },
            {
                $project: {
                   name: 1,
                   registrationNumber: 1,
                   numberOfRentals: { $size: '$teachersRentals' }
                }
            }
        ]
    )


    res
        .status(200)
        .json(
            {
                status: "Success",
                results: teachers.length,
                data: {
                    teachers
                }
            }
        )
    ;
})

exports.createTeacher = catchAsync(async (req, res, next) => {
    const newTeacher = await Teacher.create(
        {
            name: req.body.name,
            registrationNumber: req.body.registrationNumber,
            rentals: []
        }
    );
    res
        .status(201)
        .json(
            {
                status: "Success",
                data: {
                    newTeacher
                }
            }
        )

})

exports.getTeacher = catchAsync(async (req, res, next) => {
    const teacher = await Teacher.findOne({_id: req.params.teacherId}).select({rentals: 0});
    if (!teacher) return next(new AppError("Teacher no longer exists!", 400));
    res
        .status(200)
        .json(
            {
                status: "Success",
                data: {
                    teacher
                }
            }
        )
    ;
})

exports.getTeacherRentals = catchAsync(async (req, res, next) => {
    const teacherRentals = await TeachersRental.find({teacherId: req.params.teacherId})
    // if (!teacherRentals) return next(new AppError("Teacher no longer exists!", 400));
    res
        .status(200)
        .json(
            {
                status: "Success",
                data: {
                    teacherRentals
                }
            }
        )
})

exports.updateTeacher = catchAsync(async (req, res, next) => {
    const updatedTeacher = await Teacher.findById(req.params.teacherId);
    if (!updatedTeacher) return next(new AppError("Teacher no longer exists!", 400));
    if (req.body.name) updatedTeacher.name = req.body.name;
    await updatedTeacher.save({validateModifiedOnly: true});
    res
        .status(200)
        .json(
            {
                status: "Success",
                data: {
                    updatedTeacher
                }
            }
        )
    ;
})

exports.deleteTeacher = catchAsync(async (req, res, next) => {
    await Teacher.deleteOne({_id: req.params.teacherId });
    res
        .status(204)
        .json(
            {
                status: "Success"
            }
        )
    ;
})
