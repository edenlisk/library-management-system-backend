const express = require('express');
const router = express.Router();
const {
    createTeacher,
    deleteTeacher,
    updateTeacher,
    getTeacher,
    getAllTeachers } = require('../controllers/teachersController');

// TODO: PROTECT ALL ROUTES
const { restrictTo, protect } = require('../controllers/authController');


router.route('/')
    .get(getAllTeachers)
    .post(createTeacher)

router.route('/:id')
    .get(getTeacher)
    .patch(updateTeacher)
    .delete(deleteTeacher)


module.exports = router;
