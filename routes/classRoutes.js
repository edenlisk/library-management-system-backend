const express = require('express');
const router = express.Router();
const {
    getAllClasses,
    createClass,
    deleteClass,
    getClass,
    updateClass,
    getClassesByAcademicYear,
    importClasses,
    uploadAcademicYearClasses } = require('../controllers/classController');
const { numStudentsPerClass } = require('../controllers/statsController')
// TODO: PROTECT ALL ROUTES
const { getStudentsByClass } = require('../controllers/studentsController');
const { protect } = require('../controllers/authController');
const { generateClassReport } = require('../utils/generatePdf');

router.route('/')
    .get(getAllClasses)

router.route('/report/:classId')
    .post(generateClassReport)

router.route('/stats')
    .get(numStudentsPerClass)

router.route('/class/:classId')
    .get(getClass)
    .patch(updateClass)
    .delete(deleteClass)

router.route('/:academicYear')
    .get(getClassesByAcademicYear)
    .post(createClass)

router.route('/upload/:academicYear')
    .post(uploadAcademicYearClasses, importClasses)


module.exports = router;
