const Rental = require('../modals/rentalsModal');
const APIFeatures = require('../utils/apiFeatures');
const catchAsync = require('../utils/catchAsync');

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
    // const targetStudent = await Student.findById(req.body.studentRegistrationNumber);
    const newRental = new Rental(req.body);
    await newRental.save();
    // targetStudent.rentals.push(newRental._id);
    // await targetStudent.save();
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
})

exports.getRental = catchAsync(async (req, res, next) => {
    const rental = await Rental.findById(req.params.id);
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
    const updatedRental = await Rental.findById(req.params.id);
    if (req.body.nameOfBook) updatedRental.nameOfBook = req.body.nameOfBook;
    // if (req.body.RegistrationNumber) updatedRental.RegistrationNumber = req.body.RegistrationNumber;
    if (req.body.bookId) updatedRental.bookId = req.body.bookId;
    if (req.body.author) updatedRental.author = req.body.author;
    if (req.body.issueDate) updatedRental.issueDate = req.body.issueDate;
    if (req.body.dueDate) updatedRental.dueDate = req.body.dueDate;
    if (req.body.nameOfLender) updatedRental.nameOfLender = req.body.nameOfLender;
    await updatedRental.save();
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
})

exports.deleteRental = catchAsync(async (req, res, next) => {
    await Rental.deleteOne({ _id: req.params.id });
    res
        .status(204)
        .json(
            {
                status: "Success"
            }
        )
    ;
    // TODO 3: UPDATE STUDENT WHEN RENTAL IS CREATED, UPDATED OR DELETED
})


