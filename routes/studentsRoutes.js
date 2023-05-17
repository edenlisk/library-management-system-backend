const express = require('express');
const router = express.Router();
const {
    getAllStudents,
    createStudent,
    deleteStudent,
    getStudent,
    updateStudent,
    getStudentsByClass,
    importStudents,
    uploadClassStudents } = require('../controllers/studentsController');
const { topStudents } = require('../controllers/statsController');
// TODO: PROTECT ALL ROUTES
const { restrictTo, protect } = require('../controllers/authController');
const { generateStudentReport } = require('../utils/generatePdf');

router.route('/stats/:academicYear')
    .get(topStudents)

router.route('/:studentId')
    .get(getStudent)
    .patch(updateStudent)

router.route('/all-students/:academicYear')
    .get(getAllStudents)

router.route('/report/:academicYear/:studentId')
    .post(generateStudentReport)


router.route('/upload/:classId')
    .post(uploadClassStudents, importStudents)

router.route('/:academicYear/:classId')
    .get(getStudentsByClass)
    .post(createStudent)




router.route('/:academicYear/:classId/:studentId')
    .delete(deleteStudent)

module.exports = router;
