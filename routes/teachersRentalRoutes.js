const express = require('express');
const router = express.Router();

const {
    createTeacherRental,
    updateTeacherRental,
    deleteTeacherRental, getTeacherRental } = require('../controllers/teachersRentalController');
// TODO: PROTECT ALL ROUTES
const { protect, restrictTo } = require('../controllers/authController');

router.route('/')
    .post(createTeacherRental);

router.route('/:id')
    .get(getTeacherRental)
    .patch(updateTeacherRental)
    .delete(deleteTeacherRental)

module.exports = router;
