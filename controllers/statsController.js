const Class = require('../modals/classModal');
const Category = require('../modals/categoryModel');
const TeachersRental = require('../modals/teachersRentalModal');
const Student = require('../modals/studentsModal');
const Rental = require('../modals/rentalsModal');
const Book = require('../modals/bookModel');
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
    const rawRentals = await Rental.find().sort('-CreatedAt').select({nameOfBook: 1, bookId: 1, categoryName: 1, issueDate: 1, studentId: 1, dueDate: 1}).limit(10).populate({path: 'studentId'});
    const rentals = [];
    if (rawRentals) {
        rawRentals.forEach(rent => {
            const { nameOfBook, categoryName, issueDate, bookId, studentId, dueDate } = rent;
            rentals.push({bookId, nameOfBook, categoryName, studentName: studentId.name, dueDate: dueDate.toISOString().split('T')[0], issueDate: issueDate.toISOString().split('T')[0]});
        })
    }
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

exports.topBooks = catchAsync(async (req, res, next) => {
    const topBooks = await Book.find({})
        .select({edition: 0, language: 0, numberOfBooks: 0})
        .sort({numberOfRentals: -1})
        .limit(10)
    ;


    res
        .status(200)
        .json(
            {
                status: 'Success',
                data: {
                    topBooks
                }
            }
        )
    ;
})

exports.numberOfRentalsByCategory = catchAsync(async (req, res, next) => {
    // const numberOfRentalsPerCategory = await Book.aggregate(
    //     [
    //         {
    //             $group: {
    //                 _id: '$categoryName',
    //                 rentalCount: { $sum: '$numberOfRentals' }
    //             }
    //         }
    //     ]
    // )
    //
    // res
    //     .status(200)
    //     .json(
    //         {
    //             status: "Success",
    //             data: {
    //                 numberOfRentalsPerCategory
    //             }
    //         }
    //     )

    const numberOfRentalsPerCategory = await Book.aggregate(
        [
            {
                $group: {
                    _id: {
                        categoryName: '$categoryName',
                        academicLevel: '$academicLevel',
                    },
                    rentalCount: { $sum: '$numberOfRentals' },
                    bookCount: { $sum: '$numberOfBooks' },
                },
            },
            {
                $project: {
                    categoryName: '$_id.categoryName',
                    academicLevel: '$_id.academicLevel',
                    rentalCount: 1,
                    bookCount: 1,
                    _id: 0,
                },
            },
        ]
    )
    const templateObj = {
            id: "Senior Two",
            data: [
                {
                    x: 'math',
                    y: 20
                },
                {
                    x: 'physics',
                    y: 34
                },
                {
                    x: 'history',
                    y: 54
                },
                {
                    x: 'geography',
                    y: 46
                },
                {
                    x: 'literature',
                    y: 74
                },
                {
                    x: 'chemistry',
                    y: 34
                },
                {
                    x: 'english',
                    y: 59
                },
                {
                    x: 'novel',
                    y: 52
                },
                {
                    x: 'swahili',
                    y: 42
                },
                {
                    x: 'french',
                    y: 30
                },
                {
                    x: "comp science",
                    y: 38
                },
                {
                    x: "ent",
                    y: 46
                }
            ]
    }
    const levels = {"s1": "Senior One", "s2": "Senior Two", "s3": "Senior Three", "s4": "Senior Four", "s5": "Senior Five", "s6": "Senior Six"}
    const categories = [
        {
            "x": "mathematics",
            "y": 0
        },
        {
            "x": "computer science",
            "y": 0
        },
        {
            "x": "english",
            "y": 0
        },
        {
            "x": "biology",
            "y": 0
        },
        {
            "x": "history",
            "y": 0
        },
        {
            "x": "novel",
            "y": 0
        },
        {
            "x": "geography",
            "y": 0
        },
        {
            "x": "kinyarwanda",
            "y": 0
        },
        {
            "x": "french",
            "y": 0
        },
        {
            "x": "swahili",
            "y": 0
        },
        {
            "x": "general studies",
            "y": 0
        },
        {
            "x": "entrepr",
            "y": 0
        },
        {
            "x": "chemistry",
            "y": 0
        },
        {
            "x": "economics",
            "y": 0
        },
        {
            "x": "other",
            "y": 0
        },
    ]
    let result = {};
    const sortResult = (data) => {
        data.forEach(datum => {
            result[datum.academicLevel] = data.filter(dt => dt.academicLevel === datum.academicLevel);
        })
    }
    sortResult(numberOfRentalsPerCategory);
    const resultIds = Object.keys(result);
    const numberOfRentalsByCategory = [];
    resultIds.forEach(id => {
        if (id !== "other") {
            let data = [];
            result[id].forEach(elem => {
                const item = {
                    x: elem.categoryName,
                    y: elem.rentalCount
                }
                data.push(item)
            })
            categories.forEach(category => {
                if (!data.some(item => item.x === category.x)) {
                    data.push(category)
                }
            })
            const record = {
                "id": levels[id],
                data
            }
            numberOfRentalsByCategory.push(record)
        }
    })


    res
        .status(200)
        .json(
            {
                status: "Success",
                data: {
                    numberOfRentalsByCategory
                }
            }
        )
    ;
})

exports.topStudents = catchAsync(async (req, res, next) => {
    let students = await Student.find({rentals: {$elemMatch: {academicYear: req.params.academicYear}}})
            .populate(
                {
                    path: 'rentals',
                    populate: {
                        path: 'rentalHistory',
                        model: 'Rental'
                    }
                }
            )
    ;
    const result = [];
    students = students.slice(0, 9);
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
    // const currentDate = new Date(); // Get the current date
    // const currentDay = currentDate.getDay(); // Get the current day of the week (0-6, where 0 is Sunday)
    //
    // // Calculate the start and end dates of the previous week
    // const startOfPreviousWeek = new Date(currentDate);
    // startOfPreviousWeek.setDate(currentDate.getDate() - currentDay - 6); // Subtract the current day and add 6 more days
    // const endOfPreviousWeek = new Date(startOfPreviousWeek);
    // endOfPreviousWeek.setDate(startOfPreviousWeek.getDate() + 6); // Add 6 days to get the end of the week
    //
    // const rawRentals = await Rental.find();
    // const rentals = rawRentals.filter(rent => rent.issueDate.toISOString().split('T')[0] >= startOfPreviousWeek.toISOString().split('T')[0])
    // const rentalsByDay = {};
    // const weekDay = ["Sun", "Mon", "Tue", "Wed", "Thur", "Fri", "Sat"];
    // for (let i = 0; i < 7; i++) {
    //     const startDate = new Date(startOfPreviousWeek);
    //     startDate.setDate(startOfPreviousWeek.getDate() + i);
    //     const day = startDate.getDay();
    //     rentalsByDay[weekDay[day]] = 0;
    // }
    // rentals.forEach(rent => {
    //     const day = rent.issueDate.getDay();
    //     rentalsByDay[weekDay[day]]++
    // })
    // const fullNames = {"Sun":"Sunday", "Mon":"Monday", "Tue":"Tuesday", "Wed":"Wednesday", "Thur":"Thursday", "Fri":"Friday", "Sat":"Saturday"}
    // const getFullName = (day) => {
    //     return fullNames[day];
    // }
    // const rentalsByDayKeys = Object.keys(rentalsByDay);
    // const populatedDoc = (rentalsData) => {
    //     rentalsData.forEach(rent => {
    //         const rental = {
    //             "id": fullNames[rent],
    //             "color": '',
    //             "data": {
    //
    //             }
    //         }
    //     })
    // }
    // console.log(rentalsByDay);
    // Retrieve rentals where the book is not returned or return date is after due date
    // const overdueRentals = await Rental.find({ returned: false, returnDate: undefined });
    // // Calculate and update fines for each student
    // for (const rental of overdueRentals) {
    //     let { studentId, dueDate } = rental;
    //     dueDate = dueDate.toISOString().split('T')[0];
    //     const currentDate = new Date().toISOString().split('T')[0];
    //     currentDate >= dueDate ? await Student.findByIdAndUpdate(studentId, {$inc: {fine: 100}}) : await Student.findByIdAndUpdate(studentId, {$inc: {fine: 0}});
    // }

    // const weekStats = [
    //     {
    //         "id": "Mon",
    //         "color": "hsl(149, 70%, 50%)",
    //         "data": [
    //             {
    //                 "x": "History",
    //                 "y": 2
    //             },
    //             {
    //                 "x": "Geography",
    //                 "y": 20
    //             },
    //             {
    //                 "x": "Mathematics",
    //                 "y": 48
    //             },
    //             {
    //                 "x": "Physics",
    //                 "y": 84
    //             },
    //             {
    //                 "x": "Computer Science",
    //                 "y": 16
    //             },
    //             {
    //                 "x": "English",
    //                 "y": 40
    //             }
    //         ]
    //     },
    //     {
    //         "id": "Tue",
    //         "color": "hsl(249, 70%, 50%)",
    //         "data": [
    //             {
    //                 "x": "History",
    //                 "y": 46
    //             },
    //             {
    //                 "x": "Geography",
    //                 "y": 19
    //             },
    //             {
    //                 "x": "Mathematics",
    //                 "y": 26
    //             },
    //             {
    //                 "x": "Physics",
    //                 "y": 31
    //             },
    //             {
    //                 "x": "Computer Science",
    //                 "y": 22
    //             },
    //             {
    //                 "x": "English",
    //                 "y": 40
    //             }
    //         ]
    //     },
    //     {
    //         "id": "Wed",
    //         "color": "hsl(327, 70%, 50%)",
    //         "data": [
    //             {
    //                 "x": "History",
    //                 "y": 17
    //             },
    //             {
    //                 "x": "Geography",
    //                 "y": 50
    //             },
    //             {
    //                 "x": "Mathematics",
    //                 "y": 49
    //             },
    //             {
    //                 "x": "Physics",
    //                 "y": 73
    //             },
    //             {
    //                 "x": "Computer Science",
    //                 "y": 53
    //             },
    //             {
    //                 "x": "English",
    //                 "y": 62
    //             }
    //         ]
    //     },
    //     {
    //         "id": "Thur",
    //         "color": "hsl(284, 70%, 50%)",
    //         "data": [
    //             {
    //                 "x": "History",
    //                 "y": 40
    //             },
    //             {
    //                 "x": "Geography",
    //                 "y": 34
    //             },
    //             {
    //                 "x": "Mathematics",
    //                 "y": 21
    //             },
    //             {
    //                 "x": "Physics",
    //                 "y": 32
    //             },
    //             {
    //                 "x": "Computer Science",
    //                 "y": 80
    //             },
    //             {
    //                 "x": "English",
    //                 "y": 61
    //             }
    //         ]
    //     },
    //     {
    //         "id": "Fri",
    //         "color": "hsl(163, 70%, 50%)",
    //         "data": [
    //             {
    //                 "x": "History",
    //                 "y": 62
    //             },
    //             {
    //                 "x": "Geography",
    //                 "y": 60
    //             },
    //             {
    //                 "x": "Mathematics",
    //                 "y": 48
    //             },
    //             {
    //                 "x": "Physics",
    //                 "y": 21
    //             },
    //             {
    //                 "x": "Computer Science",
    //                 "y": 52
    //             },
    //             {
    //                 "x": "English",
    //                 "y": 29
    //             }
    //         ]
    //     }
    // ];
    // res
    //     .status(200)
    //     .json(
    //         {
    //             status: "Success",
    //             data: {
    //                 weekStats
    //             }
    //         }
    //     )
    // ;


    const currentDate = new Date(); // Get the current date
    const currentDay = currentDate.getDay(); // Get the current day of the week (0-6, where 0 is Sunday)

    // Calculate the start and end dates of the previous week
    const startOfPreviousWeek = new Date(currentDate);
    startOfPreviousWeek.setDate(currentDate.getDate() - currentDay - 7); // Subtract the current day and add 6 more days
    const endOfPreviousWeek = new Date(startOfPreviousWeek);
    endOfPreviousWeek.setDate(startOfPreviousWeek.getDate() + 6); // Add 6 days to get the end of the week
    const issuedRentalsStudents = await Rental.countDocuments(
        {
            issueDate: {
                $gt: startOfPreviousWeek.toISOString().split('T')[0],
                $lt: endOfPreviousWeek.toISOString().split('T')[0]
            }
        }
    );
    const returnedRentalsStudents = await Rental.countDocuments(
        {
            returnDate: {
                $gt: startOfPreviousWeek.toISOString().split('T')[0],
                $lt: endOfPreviousWeek.toISOString().split('T')[0]
            }
        }
    )

    const issuedRentalsTeachers = await TeachersRental.countDocuments({
        issueDate: {
            $gt: startOfPreviousWeek.toISOString().split('T')[0],
            $lt: endOfPreviousWeek.toISOString().split('T')[0]
        }
    })
    const returnedRentalsTeachers = await TeachersRental.countDocuments({
        returnDate: {
            $gt: startOfPreviousWeek.toISOString().split('T')[0],
            $lt: endOfPreviousWeek.toISOString().split('T')[0]
        }
    })

    const response = [
        {
            "id": 'issued',
            "label": "Issued Books",
            "value": issuedRentalsStudents + issuedRentalsTeachers
        },
        {
            "id": 'returned',
            "label": 'Returned Books',
            "value": returnedRentalsStudents + returnedRentalsTeachers
        }
    ]

    res
        .status(200)
        .json(
            {
                status: "Success",
                data: {
                    response
                }
            }
        )

})

exports.numberOfBooks = catchAsync(async (req, res, next) => {
    const books = await Book.find({})
            .select({edition: 0, author: 0, language: 0})
    ;
    res
        .status(200)
        .json(
            {
                status: "Success",
                data: {
                    books
                }
            }
        )
    ;
})

exports.notification = catchAsync(async (req, res, next) => {
    const today = new Date();
    const currentDate = new Date();
    const startDate = new Date(currentDate.setDate(currentDate.getDate() - currentDate.getDay() + 1)).toISOString().split('T')[0];
    today.setDate(today.getDate() + 1);
    const notificationDate = new Date(new Date(today).toISOString().split('T')[0]);
    const teachersRentals = await TeachersRental.find(
        {
            dueDate: {
                $gt: startDate,
                $lte: notificationDate
            },
            returned: false,
            active: true
        }
    );
    const rentals = await Rental.find(
        {
            dueDate: {
                $gt: startDate,
                $lte: notificationDate
            },
            returned: false,
            active: true
        }
    ).populate('studentId')
    const notify = [];
    if (rentals) {
        for (const rental of rentals) {
            const { name, classIds } = rental.studentId;
            const filteredClass = classIds.filter(cls => cls.academicYear === rental.academicYear);
            const {name:className} = await Class.findOne(filteredClass[0].classId);
            const { _id, nameOfBook, author, bookId, categoryName, issueDate, dueDate, academicLevel } = rental;
            const rent = {
                _id,
                nameOfBook,
                author,
                bookId,
                issueDate: issueDate.toISOString().split('T')[0],
                dueDate: dueDate.toISOString().split('T')[0],
                academicLevel,
                categoryName,
                rentalFor:name,
                className,
                model: 'student'
            }
            notify.push(rent);
        }
    }
    if (teachersRentals) {
        for (const rental of teachersRentals) {
            const { _id, nameOfBook, author, bookId, rentalFor, categoryName, issueDate, dueDate, academicLevel } = rental;
            const rent = {
                _id,
                nameOfBook,
                author,
                bookId,
                issueDate: issueDate.toISOString().split('T')[0],
                dueDate: dueDate.toISOString().split('T')[0],
                academicLevel,
                categoryName,
                rentalFor: rentalFor || null,
                className: null,
                model: 'teacher'
            }
            notify.push(rent);
        }
    }
    res
        .status(200)
        .json(
            {
                status: "Success",
                result: notify.length,
                data: {
                    notify
                }
            }
        )
    ;
})

exports.totalStats = catchAsync(async (req, res, next) => {
    const revenues = await Student.aggregate(
        [
            {
                $match: {}
            },
            {
                $group: {
                    _id: null,
                    totalRevenue: {$sum: '$fine'}
                }
            },
            {
                $project: {
                    _id: 0
                }
            }
        ]
    )
    const books = await Book.aggregate(
        [
            {
                $match: {}
            },
            {
                $group: {
                    _id: null,
                    totalBooks: {$sum: '$numberOfBooks'}
                }
            },
            {
                $project: {
                    _id: 0
                }
            }
        ]
    )
    const lostBooks = await Rental.countDocuments({active: false, returned: false});
    const issuedBooksStudents = await Rental.countDocuments({returned: false});
    const issuedBooksTeachers = await TeachersRental.countDocuments({returned: false})
    const issuedBooks = issuedBooksStudents + issuedBooksTeachers;
    // const revenue = revenues[0];
    res
        .status(200)
        .json(
            {
                status: "Success",
                data: {
                    revenue: revenues[0].totalRevenue,
                    books: books[0].totalBooks,
                    issuedBooks,
                    lostBooks
                }
            }
        )
    ;
})

exports.allRentals = catchAsync(async (req, res, next) => {
    const studentsRentals = await Rental.find({returned: false}).populate('studentId');
    const teachersRentals = await TeachersRental.find({returned: false}).populate('teacherId');
    const allRentals = [];
    if (studentsRentals) {
        for (const rental of studentsRentals) {
            const { name, classIds } = rental.studentId;
            const filteredClass = classIds.filter(cls => cls.academicYear === rental.academicYear);
            const {name:className} = await Class.findOne(filteredClass[0].classId);
            const { _id, nameOfBook, author, bookId, categoryName, issueDate, dueDate, academicLevel } = rental;
            const rent = {
                _id,
                nameOfBook,
                author,
                bookId,
                issueDate: issueDate.toISOString().split('T')[0],
                dueDate: dueDate.toISOString().split('T')[0],
                academicLevel,
                categoryName,
                rentalFor:name,
                className,
                model: 'student'
            }
            allRentals.push(rent);
        }
    }
    if (teachersRentals) {
        for (const rental of teachersRentals) {
            const {name} = rental.teacherId;
            const { _id, nameOfBook, author, bookId, rentalFor, categoryName, issueDate, dueDate, academicLevel } = rental;
            const rent = {
                _id,
                nameOfBook,
                author,
                bookId,
                issueDate: issueDate.toISOString().split('T')[0],
                dueDate: dueDate.toISOString().split('T')[0],
                academicLevel,
                categoryName,
                rentalFor: rentalFor ? rentalFor : name,
                className: null,
                model: 'teacher'
            }
            allRentals.push(rent);
        }
    }

    res
        .status(200)
        .json(
            {
                status: "Success",
                data: {
                    allRentals
                }
            }
        )
    ;
})


