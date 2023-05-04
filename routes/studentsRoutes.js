const express = require('express');
const router = express.Router();
const { getAllStudents, createStudent, deleteStudent, getStudent, updateStudent } = require('../controllers/studentsController');
const { numRentalsPerStudent } = require('../controllers/statsController');
// TODO: PROTECT ALL ROUTES
const { restrictTo, protect } = require('../controllers/authController');
const { generateStudentReport } = require('../utils/generatePdf');

router.route('/')
    .get(getAllStudents)
    .post(createStudent)

router.route('/report/:id')
    .get(generateStudentReport)

router.route('/stats')
    .get(numRentalsPerStudent)

router.route('/:id')
    .get(getStudent)
    .patch(updateStudent)
    .delete(deleteStudent)

module.exports = router;
