const Rental = require('../modals/rentalsModal');
const Student = require('../modals/studentsModal');
const Book = require('../modals/bookModel');
const Class = require('../modals/classModal');
const Settings = require('../modals/settingsModel');
const TeachersRental = require('../modals/teachersRentalModal');
const APIFeatures = require('../utils/apiFeatures');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.getAllRentals = catchAsync(async (req, res, next) => {
    const result = new APIFeatures(Rental.find(), req.query)
        .filter()
        .sort()
        .limitFields()
        .paginate()
    ;
    const rentals = await result.mongooseQuery;
    res
        .status(200)
        .json(
            {
                status: "Success",
                results: rentals.length,
                data: {
                    rentals
                }
            }
        )
    ;
})

exports.allRentals = catchAsync(async (req, res, next) => {
    const startDate = req.params.startDate ? new Date(req.params.startDate) : new Date(new Date().toISOString().split('T')[0]);
    const endDate = req.params.endDate ? new Date(req.params.endDate) : new Date(new Date().toISOString().split('T')[0]);
    const rentals = await Rental.find({returned: false});
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

exports.createRental = catchAsync(async (req, res, next) => {
    const book = await Book.findOne({_id: req.body.book_id});
    const settings = await Settings.findOne().limit(1);
    if (!book) return next(new AppError("This Book does not exist!", 401));
    const {bookName, _id, author, academicLevel, categoryName, language, availableCopy, numberOfBooks} = book;
    const limitPercentage = Math.round(numberOfBooks * settings.limitPercentage / 100);
    if (limitPercentage >= availableCopy) return next(new AppError(`Sorry, You've reached the maximum number of rentals for this book.`));
    const student = await Rental.findOne({studentId: req.params.studentId, book_id: _id, returned: false});
    if (student) return next(new AppError("Student already has this book", 401));
    const newRental = new Rental(
        {
            nameOfBook: bookName,
            author,
            academicLevel,
            language,
            categoryName,
            book_id: _id,
            bookId: req.body.bookId.trim(),
            issueDate: req.body.issueDate,
            dueDate: req.body.dueDate,
            studentId: req.params.studentId,
            academicYear: req.params.academicYear
        }
    );
    await newRental.save({validateModifiedOnly: true});
    res
        .status(200)
        .json(
            {
                status: "Success",
                data: {
                    newRental
                }
            }
        )
    ;
})

exports.getRental = catchAsync(async (req, res, next) => {
    const rental = await Rental.findById(req.params.rentalId);
    rental.createdAt = undefined;
    rental.updatedAt = undefined;
    rental.academicYear = undefined;
    res
        .status(200)
        .json(
            {
                status: "Success",
                data: {
                    rental
                }
            }
        )
    ;
})

exports.updateRental = catchAsync(async (req, res, next) => {
    const updatedRental = await Rental.findById(req.params.rentalId);
    if (!updatedRental) return next(new AppError("This rental does not exists!", 401));
    if (updatedRental.returned === true) return next(new AppError("Rental cannot be updated when returned", 401));
    if (req.body.nameOfBook) updatedRental.nameOfBook = req.body.nameOfBook;
    if (req.body.dueDate) updatedRental.dueDate = req.body.dueDate;
    if (req.body.returnDate) updatedRental.returnDate = req.body.returnDate;
    if (req.body.returned === true) updatedRental.returned = true;
    if (req.body.returned === false) updatedRental.returned = false;
    if (req.body.bookId) updatedRental.bookId = req.body.bookId;
    if (req.body.active === true) updatedRental.active = true;
    if (req.body.active === false) updatedRental.active = false;
    await updatedRental.save({validateModifiedOnly: true});
    res
        .status(200)
        .json(
            {
                status: "Success",
                data: {
                    updatedRental
                }
            }
        )
    ;
})

exports.deleteRental = catchAsync(async (req, res, next) => {
    await Rental.deleteOne({_id: req.params.rentalId});
    res
        .status(204)
        .json(
            {
                status: "Success"
            }
        )
    ;
})

exports.getRentalsByStudent = catchAsync(async (req, res, next) => {
    // const studentRentals = await Student.findOne(
    //     {_id: req.params.studentId, rentals: {$elemMatch: {academicYear: req.params.academicYear}}}
    // ).populate(
    //     {
    //         path: 'rentals',
    //         populate: {
    //             path: 'rentalHistory',
    //             model: 'Rental'
    //         }
    //     }
    // ).select({rentals: 1});

    const rentalHistory = await Rental.find({studentId: req.params.studentId, rentals: {$elemMatch: {academicYear: req.params.academicYear}}});

    // if (!studentRentals) return next(new AppError("Student does not exists", 400));
    //
    // const rentals = studentRentals.rentals.filter(rent => rent.academicYear === req.params.academicYear);
    // const {rentalHistory} = rentals[0];
    res
        .status(200)
        .json(
            {
                status: "Success",
                data: {
                    rentalHistory
                }
            }
        )
    ;
})

exports.getAllStudentRentals = catchAsync(async (req, res, next) => {
    const rentals = await Rental.find({studentId: req.params.studentId}).sort('-createdAt');
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

exports.inactiveRentals = catchAsync(async (req, res, next) => {
    const rawRentals = await Rental.find({active: false, returned: false})
        .populate('studentId');
    const rawTeachersRentals = await TeachersRental.find({active: false, returned: false});
    const rentals = [];
    if (rawRentals) {
        for (const rental of rawRentals) {
            const {name, classIds} = rental.studentId;
            const filteredClass = classIds.filter(cls => cls.academicYear === rental.academicYear);
            const {name: className} = await Class.findOne(filteredClass[0].classId);
            const {
                _id,
                nameOfBook,
                author,
                bookId,
                categoryName,
                issueDate,
                dueDate,
                academicLevel,
                language,
                academicYear,
                book_id
            } = rental;
            const rent = {
                _id,
                nameOfBook,
                author,
                bookId,
                issueDate: issueDate.toISOString().split('T')[0],
                dueDate: dueDate.toISOString().split('T')[0],
                academicLevel,
                categoryName,
                language,
                academicYear,
                rentalFor: name,
                className,
                model: 'student'
            }
            rentals.push(rent);
        }
    }
    if (rawTeachersRentals) {
        for (const rental of rawTeachersRentals) {
            const {
                _id,
                nameOfBook,
                author,
                bookId,
                rentalFor,
                categoryName,
                issueDate,
                dueDate,
                academicLevel,
                language,
                academicYear,
                book_id
            } = rental;
            const rent = {
                _id,
                nameOfBook,
                author,
                bookId,
                issueDate: issueDate.toISOString().split('T')[0],
                dueDate: dueDate.toISOString().split('T')[0],
                academicLevel,
                categoryName,
                language,
                academicYear,
                rentalFor,
                className: "",
                model: 'teacher'
            }
            rentals.push(rent);
        }
    }

    res
        .status(200)
        .json(
            {
                status: 'Success',
                result: rentals.length,
                data: {
                    rentals
                }
            }
        )
    ;
})