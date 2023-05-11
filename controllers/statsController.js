const Class = require('../modals/classModal');
const Student = require('../modals/studentsModal');
const Rental = require('../modals/rentalsModal');
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

exports.lastCreatedRentals = catchAsync(async (req, res, next) => {
    const rentals = await Rental.find().sort('-CreatedAt').limit(10);
    res
        .status(200)
        .json(
            {
                status: "Success",
                data: {
                    rentals
                }
            }
        )
    ;
})

exports.topStudents = catchAsync(async (req, res, next) => {
    let students = await Student.find({rentals: {$elemMatch: {academicYear: req.params.academicYear}}});
    const result = [];
    students = students.slice(0,10);
    students.forEach(student => {
        student.rentals.forEach((rent, index) => {
            if (rent.academicYear === req.params.academicYear) {
                const { _id, name, registrationNumber, fine } = student;
                const stu = {_id, name, registrationNumber, fine, numberOfRentals: rent.rentalHistory.length};
                result.push(stu);
            }else {
                student.rentals.splice(index, 1);
            }
        })
    })
    result.sort((a, b) => {
        if (a.numberOfRentals < b.numberOfRentals) {
            return -1
        } else if (a.numberOfRentals > b.numberOfRentals) {
            return 1
        } else {
            return 0
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
