const Rental = require('../modals/rentalsModal');

exports.getAllRentals = async (req, res) => {
    try {
        const rentals = await Rental.find();
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
    } catch (e) {
        res
            .status(403)
            .json(
                {
                    status: "Failed",
                    message: e.message
                }
            )
    }

}

exports.createRental = async (req, res) => {
    try {
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
    } catch (e) {
        res
            .status(403)
            .json(
                {
                    status: "Failed",
                    message: e.message
                }
            )
    }
}

exports.getRental = async (req, res) => {
    try {
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
    } catch (e) {
        res
            .status(403)
            .json(
                {
                    status: "Failed",
                    message: e.message
                }
            )
    }
}

exports.updateRental = async (req, res) => {
    try {
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
    } catch (e) {
        res
            .status(403)
            .json(
                {
                    status: "Failed",
                    message: e.message
                }
            )
    }
}

exports.deleteRental = async (req, res) => {
    try {
        await Rental.deleteOne({ _id: req.params.id });
        res
            .status(204)
            .json(
                {
                    status: "Success"
                }
            )
    } catch (e) {
        res
            .status(403)
            .json(
                {
                    status: "Failed",
                    message: e.message
                }
            )
    }
    // TODO 3: UPDATE STUDENT WHEN RENTAL IS CREATED, UPDATED OR DELETED
}


