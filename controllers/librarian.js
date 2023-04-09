const Librarian = require('../modals/librarianModal');

exports.getAllLibrarians = async (req, res) => {
    try {
        const librarians = await Librarian.find({});
        res
            .status(200)
            .json(
                {
                    status: "Success",
                    result: librarians.length,
                    data: {
                        librarians
                    }
                }
            )
    } catch (err) {
        res
            .status(403)
            .json(
                {
                    status: "Failed",
                    message: err.message
                }
            )

    }
}

exports.createLibrarian = async (req, res) => {
    try {
        const newLibrarian = await Librarian.create(req.body);
        res
            .status(201)
            .json(
                {
                    status: "Success",
                    data: {
                        newLibrarian
                    }
                }
            )
    } catch (e) {
        res
            .status(500)
            .json(
                {
                    status: "Failed",
                    message: e.message
                }
            )
    }
}

exports.deleteLibrarian = async (req, res) => {
    try {
        await Librarian.findByIdAndDelete(req.params.id);
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
}

exports.getLibrarian = async (req, res) => {
    try {
        const librarian = await Librarian.findById(req.params.id);
        res
            .status(200)
            .json(
                {
                    status: "Success",
                    data: {
                        librarian
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

exports.updateLibrarian = async (req, res) => {
    try {
        const librarian = await Librarian.findById(req.params.id);
        if (req.body.name) librarian.name = req.body.name;
        if (req.body.email) librarian.email = req.body.email;
        if (req.body.username) librarian.username = req.body.username;
        if (req.body.password) librarian.password = req.body.password;
        await librarian.save();
        res
            .status(200)
            .json(
                {
                    status: "Success",
                    data: {
                        librarian
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
