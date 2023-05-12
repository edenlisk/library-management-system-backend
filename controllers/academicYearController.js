const catchAsync = require('../utils/catchAsync');
const academicYear = require('../modals/academicYear');


exports.createAcademicYear = catchAsync(async (req, res, next) => {
    const newSchoolYear = await academicYear.create(
        {
            academicYear: req.body.academicYear
        }
    )
    res
        .status(201)
        .json(
            {
                status: "Success",
                data: {
                    newSchoolYear
                }
            }
        )
    ;
})

exports.updateAcademicYear = catchAsync(async (req, res, next) => {
    const targetSchoolYear = await academicYear.findById(req.params.id);
    if (req.body.archive) targetSchoolYear.archive = req.body.archive;
    await targetSchoolYear.save({validateModifiedOnly: true});
    res
        .status(202)
        .json(
            {
                status: "Success",
                data: {
                    targetSchoolYear
                }
            }
        )
    ;
})

exports.getAcademicYear = catchAsync(async (req, res, next) => {
    const schoolYear = await academicYear.findOne({academicYear: req.params.academicYear}).populate('classes');
    res
        .status(200)
        .json(
            {
                status: "Success",
                data: {
                    schoolYear
                }
            }
        )
    ;
})

exports.getAcademicYears = catchAsync(async (req, res, next) => {
    const schoolYears = await academicYear.aggregate(
        [
            {
                $match: {  }
            },
            // {
            //     $addFields: {
            //         numberOfClasses: {$size: '$classes'}
            //     }
            // },
            {
                $project: {
                    _id: 1,
                    academicYear: 1,
                    numberOfClasses: {$size: '$classes'}
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
                    schoolYears
                }
            }
        )
    ;
})
