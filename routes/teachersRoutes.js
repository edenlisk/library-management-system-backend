const express = require('express');
const router = express.Router();
const {
    createTeacher,
    deleteTeacher,
    updateTeacher,
    getTeacherRentals,
    getAllTeachers,
    getTeacher } = require('../controllers/teachersController');

// TODO: PROTECT ALL ROUTES
const { restrictTo, protect, teacherLogin } = require('../controllers/authController');


router.route('/')
    .get(getAllTeachers)
    .post(createTeacher)

router.route('/login')
    .post(teacherLogin)

router.route('/teachers-rentals/:teacherId')
    .get(getTeacherRentals)

router.route('/:teacherId')
    .get(getTeacher)
    .patch(updateTeacher)
    .delete(deleteTeacher)


module.exports = router;
