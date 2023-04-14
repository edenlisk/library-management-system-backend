const Student = require('../modals/studentsModal');

exports.getAllStudents = async (req, res) => {
    try {
        const students = await Student.find();
        res
            .status(200)
            .json(
                {
                    status: "Success",
                    results: students.length,
                    data: {
                        students
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

// exports.createStudent = async (req, res) => {
//     try {
//         const targetClass = await Class.findOne({ name: req.body.className });
//         if (targetClass) {
//             const newStudent = new Student(
//                 {
//                     name: req.body.name,
//                     className: req.body.className,
//                     class: targetClass._id,
//                     rentals: [],
//                     registrationNumber: req.body.registrationNumber,
//                     fine: 0
//                 }
//             )
//             await newStudent.save();
//             await targetClass.students.push(newStudent._id);
//             await targetClass.save();
//             res
//                 .status(200)
//                 .json(
//                     {
//                         status: "Success",
//                         data: {
//                             newStudent
//                         }
//                     }
//                 )
//         } else {
//             throw new Error("Class is not available");
//         }
//
//     } catch (e) {
//         res
//             .status(403)
//             .json(
//                 {
//                     status: "Failed",
//                     message: e.message
//                 }
//             )
//     }
// }

exports.getStudent = async (req, res) => {
    try {
        const student = await Student.findById(req.params.id);
        res
            .status(200)
            .json(
                {
                    status: "Success",
                    data: {
                        student
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

exports.updateStudent = async (req, res) => {
    try {
        const updatedStudent = await Student.findById(req.params.id);
        if (req.body.name) updatedStudent.name = req.body.name;
        if (req.body.className) updatedStudent.className = req.body.className;
        // if (req.body.rentals) updatedStudent.rentals = req.body.rentals;
        if (req.body.registrationNumber) updatedStudent.registrationNumber = req.body.registrationNumber;
        if (req.body.fine) updatedStudent.fine = req.body.fine;
        await updatedStudent.save();
        // TODO 2: CREATE `post` middleware to update class when student is created, DELETED or updated.
        res
            .status(200)
            .json(
                {
                    status: "Success",
                    data: {
                        updatedStudent
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

exports.deleteStudent = async (req, res) => {
    try {
        await Student.deleteOne({_id: req.params.id });
        // await Student.findOneAndDelete({_id: req.params.id});
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

exports.createStudent = async (req, res) => {
    try {
        const newStudent = new Student(req.body);
        await newStudent.save();
        res
            .status(201)
            .json(
                {
                    status: "Success",
                    data: {
                        newStudent
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
