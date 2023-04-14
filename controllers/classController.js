const Class = require('../modals/classModal');

exports.getAllClasses = async (req, res) => {
    try {
        const classes = await Class.find().populate('students');
        res
            .status(200)
            .json(
                {
                    status: "Success",
                    result: classes.length,
                    data: {
                        classes
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

exports.createClass = async (req, res) => {
    try {
        const newClass = await Class.create(req.body);
        res
            .status(201)
            .json(
                {
                    status: "Success",
                    data: {
                        newClass
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

exports.getClass = async (req, res) => {
    try {
        const selectedClass = await Class.findById(req.params.id).populate('students');
        res
            .status(200)
            .json(
                {
                    status: "Success",
                    data: {
                        selectedClass
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

exports.updateClass = async (req, res) => {
    try {
        const updatedClass = await Class.findById(req.params.id);
        if (req.body.name) updatedClass.name = req.body.name;
        if (req.body.category) updatedClass.category = req.body.category;
        if (req.body.students) updatedClass.students = req.body.students;
        if (req.body.academicYear) updatedClass.academicYear = req.body.academicYear;
        await updatedClass.save();
        res
            .status(200)
            .json(
                {
                    status: "Success",
                    data: {
                        updatedClass
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

exports.deleteClass = async (req, res) => {
    try {
        await Class.deleteOne({ _id: req.params.id });
        res
            .status(204)
            .json(
                {
                    status: "Success",
                    message: "Class deleted successfully"
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
