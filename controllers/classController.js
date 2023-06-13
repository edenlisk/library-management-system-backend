const fs = require('fs');
const multer = require('multer');
const Class = require('../modals/classModal');
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
    ;
})

exports.getClass = catchAsync(async (req, res, next) => {
    const selectedClass = await Class.findById(req.params.classId).select({students: 0, academicYear: 0});
    if (!selectedClass) return next(new AppError("Class does not exists!", 400));
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
    ;
})

exports.updateClass = catchAsync(async (req, res, next) => {
    const updatedClass = await Class.findById(req.params.classId);
    if (req.body.name) updatedClass.name = req.body.name;
    if (req.body.category) updatedClass.category = req.body.category;
    await updatedClass.save({validateModifiedOnly: true});
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
    // const classes = await Class.aggregate(
    //     [
    //         {
    //             $match: {academicYear: req.params.academicYear}
    //         },
    //         {
    //             $project: {
    //                 _id: 1,
    //                 name: 1,
    //                 category: 1,
    //                 academicYear: 1,
    //                 numberOfStudents: { $size: "$students" }
    //             }
    //         }
    //     ]
    // )

    const classes = await Class.aggregate(
        [
            {
                $match: {academicYear: req.params.academicYear}
            },
            {
                $addFields: {
                    numberOfStudents: {$size: '$students'}
                }
            },
            {
                $project: {
                    students: 0,
                    nameAcademicYear: 0
                }
            }
        ]
    )
    // if (!classes) next(new AppError(`${req.params.academicYear} does not exists`, 400))
    // const classes = await Class.find({academicYear: req.params.academicYear}).projection({numberOfStudents: {$size: 'students'}})
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
    if (/^\d{4}-\d{4}$/.test(req.params.academicYear) !== true) {
        return next(new AppError("Invalid academic year, It must be in this format YYYY-YYYY", 401));
    }
    const schoolYear = await AcademicYear.findOne({academicYear: req.params.academicYear});
    if (!schoolYear) {
        return next(new AppError("Academic Year does not exists", 401))
    } else {
        // const newSchoolYear = await AcademicYear.create({academicYear: req.params.academicYear});
        if (!fs.existsSync(`${__dirname}/../public/data/${req.file.filename}`)) {
            return next(new AppError('File not found, please try again', 401));
        }
        const classes = await csvtojson().fromFile(`${__dirname}/../public/data/${req.file.filename}`);
        if (!classes) next(new AppError("No classes found in this file", 401));
        for (const cl of classes) {
            const cls = await Class.findOne({name: cl.name, academicYear: req.params.academicYear});
            if (!cls) {
                const newClass = await Class.create(
                    {
                        name: cl.name,
                        category: cl.category,
                        students: [],
                        academicYear: req.params.academicYear
                    }
                );
                schoolYear.classes.push(newClass._id);
            }
        }
        // const newClasses = await Class.insertMany(classes, {ordered: false});
        // // || cls.academicYear === schoolYear.academicYear
        // newClasses.forEach((cls, index) => {
        //     if (schoolYear.classes.includes(cls._id)) {
        //         newClasses.splice(index, 1);
        //     }
        //     schoolYear.classes.push(cls._id);
        // })
        // await schoolYear.save({validateModifiedOnly: true});
        // const populatedDoc = await schoolYear.populate('classes');
        res
            .status(200)
            .json(
                {
                    status: "Success",
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
            cb(null, `classes-${req.params.academicYear}-${new Date().getTime().toString()}.${extension}`);
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
