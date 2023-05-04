const TeachersRental = require('../modals/teachersRentalModal');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');


exports.createTeacherRental = catchAsync(async (req, res, next) => {
    const teacherRental = await TeachersRental.create(
        {
            nameOfBook: req.body.nameOfBook,
            teacherID: req.body.teacherID,
            numberOfBooks: req.body.numberOfBooks,
            issueDate: req.body.issueDate,
            rentalFor: req.body.rentalFor,
            returned: false,
        }
    )
    res
        .status(201)
        .json(
            {
                status: "Success",
                data: {
                    teacherRental
                }
            }
        )
    ;
})

exports.updateTeacherRental = catchAsync(async (req, res, next) => {
    const updatedTeacherRental = await TeachersRental.findById(req.params.id);
    if (!updatedTeacherRental) next(new AppError("Rental no longer exists"), 401);
    if (req.body.nameOfBook) updatedTeacherRental.nameOfBook = req.body.nameOfBook;
    if (req.body.rentalFor) updatedTeacherRental.rentalFor = req.body.rentalFor;
    if (req.body.returned) updatedTeacherRental.returned = req.body.returned;
    await updatedTeacherRental.save();
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
