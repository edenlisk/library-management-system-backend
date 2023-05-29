const TeachersRental = require('../modals/teachersRentalModal');
const Book = require('../modals/bookModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.getTeacherRentals = catchAsync(async (req, res, next) => {
    const rentals = await TeachersRental.find({});
    res
        .status(200)
        .json(
            {
                status: 'Success',
                data: {
                    rentals
                }
            }
        )
    ;
})

exports.getTeacherRental = catchAsync(async (req, res, next) => {
    const rental = await TeachersRental.findOne({_id: req.params.id});
    if (!rental) return next(new AppError("Rental does not exits", 401));
    res
        .status(200)
        .json(
            {
                status: 'Success',
                data: {
                    rental
                }
            }
        )
    ;
})

exports.createTeacherRental = catchAsync(async (req, res, next) => {
    const book = await Book.findOne({_id: req.body.book_id});
    if (!book) return next(new AppError("This book does not exist!", 400));
    const { bookName, _id, author, academicLevel, categoryName, language } = book;
    const { bookIds } = req.body;
    for (const bookId of bookIds) {
        await TeachersRental.create(
            {
                nameOfBook: bookName,
                author,
                academicLevel,
                language,
                categoryName,
                book_id: _id,
                bookId: bookId,
                teacherId: req.body.teacherId,
                issueDate: req.body.issueDate,
                dueDate: req.body.dueDate,
                rentalFor: req.body.rentalFor
            }
        )
    }

    res
        .status(201)
        .json(
            {
                status: "Success",
            }
        )
    ;
})

exports.updateTeacherRental = catchAsync(async (req, res, next) => {
    const updatedTeacherRental = await TeachersRental.findById(req.params.id);
    if (!updatedTeacherRental) return next(new AppError("Rental no longer exists"), 401);
    if (req.body.nameOfBook) updatedTeacherRental.nameOfBook = req.body.nameOfBook;
    if (req.body.numberOfBooks) updatedTeacherRental.numberOfBooks = req.body.numberOfBooks;
    if (req.body.rentalFor) updatedTeacherRental.rentalFor = req.body.rentalFor;
    if (req.body.returned) updatedTeacherRental.returned = req.body.returned;
    if (req.body.active) updatedTeacherRental.active = req.body.active;
    await updatedTeacherRental.save({validateModifiedOnly: true});
    res
        .status(201)
        .json(
            {
                status: "Success",
                data: {
                    updatedTeacherRental
                }
            }
        )
})

exports.deleteTeacherRental = catchAsync(async (req, res, next) => {
    await TeachersRental.deleteOne({ _id: req.params.id });
    res
        .status(204)
        .json(
            {
                status: "Success"
            }
        )
    ;
})
