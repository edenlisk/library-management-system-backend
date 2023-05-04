const express = require('express');
const router = express.Router();

const {
    createTeacherRental,
    updateTeacherRental,
    deleteTeacherRental } = require('../controllers/teachersRentalController');
// TODO: PROTECT ALL ROUTES
const { protect } = require('../controllers/authController');

router.route('/')
    .post(createTeacherRental);

router.route('/:id')
    .patch(updateTeacherRental)
    .delete(deleteTeacherRental)

module.exports = router;
