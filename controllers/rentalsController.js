const Rental = require('../modals/rentalsModal');
const Student = require('../modals/studentsModal');
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
    const newRental = new Rental(
        {
            nameOfBook: req.body.nameOfBook,
            studentId: req.params.studentId,
            bookId: req.body.bookId,
            issueDate: req.body.issueDate,
            dueDate: req.body.dueDate,
            category: req.body.category,
            // nameOfLender: req.body.nameOfBook,
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
    if (req.body.nameOfBook) updatedRental.nameOfBook = req.body.nameOfBook;
    // if (req.body.bookId) updatedRental.bookId = req.body.bookId;
    // if (req.body.category) updatedRental.category = req.body.category;
    // if (req.body.author) updatedRental.author = req.body.author;
    if (req.body.dueDate) updatedRental.dueDate = req.body.dueDate;
    if (req.body.returned) updatedRental.returned = req.body.returned;
    // if (req.body.nameOfLender) updatedRental.nameOfLender = req.body.nameOfLender;
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
