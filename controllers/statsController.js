const Class = require('../modals/classModal');
const Student = require('../modals/studentsModal');
const catchAsync = require('../utils/catchAsync');


exports.numStudentsPerClass = catchAsync(async (req, res, next) => {
    const aggregateFirst = [
        {
            $lookup: {
                from: 'students',
                localField: 'name',
                foreignField: 'className',
                as: 'newStudents'
            }
        },
        {
            $project: {
                _id: 1,
                name: 1,
                numStudents: { $size: '$students' }
            }
        }
    ];
    const aggregateSecond = [
        {
            $lookup: {
                from: "students",
                localField: "_id",
                foreignField: "class",
                as: "newStudents"
            }
        },
        {
            $project: {
                _id: 1,
                name: 1,
                category: 1,
                academicYear: 1,
                numberOfStudents: { $size: "$students" }
            }
        },
        // {
        //     $group: {
        //         _id: "$_id",
        //         name: { $first: "$name" },
        //         category: { $first: "$category" },
        //         academicYear: { $first: "$academicYear" },
        //         numberOfStudents: { $sum: "$numberOfStudents" }
        //     }
        // }
    ]
    const numStudents = await Class.aggregate(aggregateSecond);
    res
        .status(200)
        .json(
            {
                status: "Success",
                data: {
                    numStudents
                }
            }
        )
    ;
})

exports.numRentalsPerStudent = catchAsync(async (req, res, next) => {
    const numRentals = await Student.aggregate(
        [
            {
                $lookup: {
                    from: "rentals",
                    localField: "_id",
                    foreignField: "registrationNumber",
                    as: "newRentals"
                }
            },
            // {
            //     $project: {
            //         _id: 1,
            //         name: 1,
            //         className: 1,
            //         registrationNumber: 1,
            //         numberOfRentals: { $size: "$rentals" }
            //     }
            // }
        ]
    )
    res
        .status(200)
        .json(
            {
                status: "Success",
                data: {
                    numRentals
                }
            }
        )
    ;
})
