const Teacher = require('../modals/teachersModal');
const APIFeatures = require('../utils/apiFeatures');
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
    const newTeacher = new Teacher(
        {
            name: req.body.name,
            registrationNumber: req.body.registrationNumber
        }
    );
    await newTeacher.save();
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
    const teacher = await Teacher.findById(req.params.id);
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
})

exports.updateTeacher = catchAsync(async (req, res, next) => {
    const updatedTeacher = await Teacher.findById(req.params.id);
    if (req.body.name) updatedTeacher.name = req.body.name;
    // if (req.body.registrationNumber) updatedTeacher.registrationNumber = req.body.registrationNumber;
    await updatedTeacher.save();
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
    await Teacher.deleteOne({_id: req.params.id });
    res
        .status(204)
        .json(
            {
                status: "Success"
            }
        )
    ;
})
