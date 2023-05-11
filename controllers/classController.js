const Class = require('../modals/classModal');
const multer = require('multer');
const AcademicYear = require('../modals/academicYear');
const csvtojson = require('csvtojson');
const APIFeatures = require('../utils/apiFeatures');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.getAllClasses = catchAsync(async (req, res, next) => {
    const result = new APIFeatures(Class.find(), req.query)
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
    ;
})

exports.createClass = catchAsync(async (req, res, next) => {
    const newClass = await Class.create(
        {
            name: req.body.name,
            category: req.body.category,
            academicYear: req.params.academicYear
        }
    );
    newClass.nameId = undefined;
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
    const selectedClass = await Class.findById(req.params.classId).populate('students');
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
    const updatedClass = await Class.findById(req.params.classId);
    if (req.body.name) updatedClass.name = req.body.name;
    if (req.body.category) updatedClass.category = req.body.category;
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
    await Class.deleteOne({ _id: req.params.classId });
    res
        .status(204)
        .json(
            {
                status: "Success",
                message: "Class deleted successfully"
            }
        )
    ;
});

exports.getClassesByAcademicYear = catchAsync(async (req, res, next) => {
    const classes = await Class.aggregate(
        [
            {
                $match: {academicYear: req.params.academicYear}
            },
            {
                $project: {
                    _id: 1,
                    name: 1,
                    category: 1,
                    academicYear: 1,
                    numberOfStudents: { $size: "$students" }
                }
            }
        ]
    )
    res
        .status(200)
        .json(
            {
                status: "Success",
                data: {
                    classes
                }
            }
        )
    ;
})

exports.importClasses = catchAsync(async (req, res, next) => {
    const schoolYear = await AcademicYear.findOne({academicYear: req.params.academicYear});
    if (!schoolYear) {
        next(new AppError("Academic Year does not exists"))
    } else {
        // const newSchoolYear = await AcademicYear.create({academicYear: req.params.academicYear});
        const classes = await csvtojson().fromFile(`${__dirname}/../public/data/${req.file.filename}`);
        if (!classes) next(new AppError("No classes found in this file", 401));
        const newClasses = await Class.insertMany(classes, {ordered: false});
        newClasses.forEach((cls, index) => {
            if (schoolYear.classes.includes(cls) || cls.academicYear === schoolYear.academicYear) {
                newClasses.splice(index, 1);
            }
            schoolYear.classes.push(cls._id);
        })
        await schoolYear.save({validateModifiedOnly: true});
        const populatedDoc = await schoolYear.populate('classes');
        res
            .status(200)
            .json(
                {
                    status: "Success",
                    data: {
                        populatedDoc
                    }
                }
            )
        ;
    }
})


const multerStorage = multer.diskStorage(
    {
        destination: function(req, file, cb) {
            cb(null, 'public/data');
        },
        filename: function(req, file, cb) {
            const extension = file.mimetype.split('/')[1];
            cb(null, `classes-${req.params.academicYear}-${new Date.now().toString()}.${extension}`);
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


exports.uploadAcademicYearClasses = upload.single('classes');
