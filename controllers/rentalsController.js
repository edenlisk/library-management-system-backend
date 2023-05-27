const Rental = require('../modals/rentalsModal');
const Student = require('../modals/studentsModal');
const Book = require('../modals/bookModel');
const Class = require('../modals/classModal');
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

exports.createRental = catchAsync(async (req, res, next) => {
    const book = await Book.findOne({_id: req.body.book_id});
    if (!book) return next(new AppError("This Book does not exist!", 400));
    const { bookName, _id, author, academicLevel, categoryName, language } = book;
    const student = await Rental.findOne({studentId: req.params.studentId, book_id: _id, returned: false});
    if (student) return next(new AppError("Student already has this book", 400));
    const newRental = new Rental(
        {
            nameOfBook: bookName,
            author,
            academicLevel,
            language,
            categoryName,
            book_id: _id,
            bookId: req.body.bookId,
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
    if (!updatedRental) return next(new AppError("This rental does not exists!", 400));
    if (req.body.dueDate) updatedRental.dueDate = req.body.dueDate;
    if (req.body.returnDate) updatedRental.returnDate = req.body.returnDate;
    if (req.body.returned) updatedRental.returned = req.body.returned;
    if (req.body.bookId) updatedRental.bookId = req.body.bookId;
    if (req.body.active) updatedRental.active = req.body.active;
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
    await Rental.deleteOne({ _id: req.params.rentalId });
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
    const studentRentals = await Student.findOne(
        {_id: req.params.studentId, rentals: {$elemMatch: {academicYear: req.params.academicYear}}}
    ).populate(
        {
            path: 'rentals',
            populate: {
                path: 'rentalHistory',
                model: 'Rental'
            }
        }
    ).select({rentals: 1});

    if (!studentRentals) return next(new AppError("Student does not exists", 400));

    const rentals = studentRentals.rentals.filter(rent => rent.academicYear === req.params.academicYear);
    const { rentalHistory } = rentals[0];
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

exports.inactiveRentals = catchAsync(async (req, res, next) => {
    const rawRentals = await Rental.find({active: false})
            .populate('studentId');
    const rentals = [];
    if (rawRentals) {
        for (const rental of rawRentals) {
            const { name, classIds } = rental.studentId;
            const filteredClass = classIds.filter(cls => cls.academicYear === rental.academicYear);
            const {name:className} = await Class.findOne(filteredClass[0].classId);
            const { _id, nameOfBook, author, bookId, categoryName, issueDate, dueDate, academicLevel, language, academicYear, book_id } = rental;
            const rent = {
                _id,
                nameOfBook,
                author,
                bookId,
                issueDate,
                dueDate,
                academicLevel,
                categoryName,
                language,
                academicYear,
                studentName:name,
                className
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