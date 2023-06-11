const TeachersRental = require('../modals/teachersRentalModal');
const Book = require('../modals/bookModel');
const Settings = require('../modals/settingsModel');
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
    const settings = await Settings.findOne().limit(1);
    const book = await Book.findOne({_id: req.body.book_id});
    if (!book) return next(new AppError("This book does not exist!", 401));
    const {bookName, _id, author, academicLevel, categoryName, language, availableCopy, numberOfBooks} = book;
    const limitPercentage = Math.round(numberOfBooks * settings.limitPercentage / 100);
    if (limitPercentage >= availableCopy) return next(new AppError(`Sorry, ${bookName} is in low availability`))
    const {bookIds} = req.body;
    if (Array.isArray(bookIds)) {
        if (bookIds.length > availableCopy) return next(new AppError(`No enough books, there are only ${availableCopy} copies`, 401));
        for (const bookId of bookIds) {
            await TeachersRental.create(
                {
                    nameOfBook: bookName,
                    author,
                    academicLevel,
                    language,
                    categoryName,
                    book_id: _id,
                    bookId: bookId.trim(),
                    teacherId: req.body.teacherId,
                    issueDate: req.body.issueDate,
                    dueDate: req.body.dueDate,
                    rentalFor: req.body.rentalFor
                }
            )
        }
    } else {
        await TeachersRental.create(
            {
                nameOfBook: bookName,
                author,
                academicLevel,
                language,
                categoryName,
                book_id: _id,
                bookId: bookIds,
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
    if (!updatedTeacherRental) return next(new AppError("Rental no longer exists", 401));
    if (updatedTeacherRental.returned === true) return next(new AppError("Rental cannot be updated when returned", 401));
    if (req.body.nameOfBook) updatedTeacherRental.nameOfBook = req.body.nameOfBook;
    if (req.body.dueDate) updatedTeacherRental.dueDate = req.body.dueDate;
    if (req.body.returned === true) updatedTeacherRental.returned = true;
    if (req.body.returned === false) updatedTeacherRental.returned = false;
    if (req.body.active === true) updatedTeacherRental.active = true;
    if (req.body.active === false) updatedTeacherRental.active = false;
    if (req.body.returnDate) updatedTeacherRental.returnDate = req.body.returnDate;
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
    await TeachersRental.deleteOne({_id: req.params.id});
    res
        .status(204)
        .json(
            {
                status: "Success"
            }
        )
    ;
})
