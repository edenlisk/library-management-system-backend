const Class = require('../modals/classModal');
const APIFeatures = require('../utils/apiFeatures');
const catchAsync = require('../utils/catchAsync');

exports.getAllClasses = catchAsync(async (req, res, next) => {
    const result = new APIFeatures(Class.find().populate('students'), req.query)
        .filter()
        .sort()
        .limitFields()
        .paginate()
    ;
    const classes = await result.mongooseQuery;
    res
        .status(200)
        .json(
            {
                status: "Success",
                result: classes.length,
                data: {
                    classes
                }
            }
        )
})

exports.createClass = catchAsync(async (req, res, next) => {
    const newClass = await Class.create(req.body);
    res
        .status(201)
        .json(
            {
                status: "Success",
                data: {
                    newClass
                }
            }
        )
})

exports.getClass = catchAsync(async (req, res, next) => {
    const selectedClass = await Class.findById(req.params.id).populate('students');
    res
        .status(200)
        .json(
            {
                status: "Success",
                data: {
                    selectedClass
                }
            }
        )
})

exports.updateClass = catchAsync(async (req, res, next) => {
    const updatedClass = await Class.findById(req.params.id);
    if (req.body.name) updatedClass.name = req.body.name;
    if (req.body.category) updatedClass.category = req.body.category;
    if (req.body.students) updatedClass.students = req.body.students;
    if (req.body.academicYear) updatedClass.academicYear = req.body.academicYear;
    await updatedClass.save();
    res
        .status(200)
        .json(
            {
                status: "Success",
                data: {
                    updatedClass
                }
            }
        )
})

exports.deleteClass = catchAsync(async (req, res, next) => {
        await Class.deleteOne({ _id: req.params.id });
        res
            .status(204)
            .json(
                {
                    status: "Success",
                    message: "Class deleted successfully"
                }
            )
    }
)
