const express = require('express')
const router = express.Router();
const { createAcademicYear, getAcademicYear, updateAcademicYear, getAcademicYears } = require('../controllers/academicYearController');


router.route('/')
    .get(getAcademicYears)
    .post(createAcademicYear)

router.route('/:academicYear')
    .get(getAcademicYear)


module.exports = router;
