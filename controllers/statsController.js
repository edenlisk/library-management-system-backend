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
        if (a.numberOfRentals > b.numberOfRentals) {
            return -1
        } else if (a.numberOfRentals < b.numberOfRentals) {
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

exports.weeklyStats = catchAsync(async (req, res, next) => {
    const currentDate = new Date(); // Get the current date
    const currentDay = currentDate.getDay(); // Get the current day of the week (0-6, where 0 is Sunday)

    // Calculate the start and end dates of the previous week
    const startOfPreviousWeek = new Date(currentDate);
    startOfPreviousWeek.setDate(currentDate.getDate() - currentDay - 6); // Subtract the current day and add 6 more days
    const endOfPreviousWeek = new Date(startOfPreviousWeek);
    endOfPreviousWeek.setDate(startOfPreviousWeek.getDate() + 6); // Add 6 days to get the end of the week

    const rawRentals = await Rental.find();
    const rentals = rawRentals.filter(rent => rent.issueDate.toISOString().split('T')[0] >= startOfPreviousWeek.toISOString().split('T')[0])
    const rentalsByDay = {};
    const weekDay = ["Sun", "Mon", "Tue", "Wed", "Thur", "Fri", "Sat"];
    for (let i = 0; i < 7; i++) {
        const startDate = new Date(startOfPreviousWeek);
        startDate.setDate(startOfPreviousWeek.getDate() + i);
        const day = startDate.getDay();
        rentalsByDay[weekDay[day]] = 0;
    }
    rentals.forEach(rent => {
        const day = rent.issueDate.getDay();
        rentalsByDay[weekDay[day]]++
    })
    const fullNames = {"Sun":"Sunday", "Mon":"Monday", "Tue":"Tuesday", "Wed":"Wednesday", "Thur":"Thursday", "Fri":"Friday", "Sat":"Saturday"}
    const getFullName = (day) => {
        return fullNames[day];
    }
    const rentalsByDayKeys = Object.keys(rentalsByDay);
    const populatedDoc = (rentalsData) => {
        rentalsData.forEach(rent => {
            const rental = {
                "id": fullNames[rent],
                "color": '',
                "data": {

                }
            }
        })
    }
    console.log(rentalsByDay);
})
