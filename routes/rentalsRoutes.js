const express = require('express');
const router = express.Router();
const { getAllRentals,
    getRental,
    createRental,
    deleteRental,
    updateRental,
    getRentalsByStudent,
    inactiveRentals, allRentals } = require('../controllers/rentalsController');
// TODO: PROTECT ALL ROUTES
const { protect } = require('../controllers/authController');

router.route('/')
    .get(getAllRentals)

router.route('/inactive-rentals')
    .get(inactiveRentals)

router.route('/all-rentals/')
    .get(allRentals)

router.route('/:academicYear/:studentId')
    .get(getRentalsByStudent)
    .post(createRental)

router.route('/:rentalId')
    .get(getRental)
    .patch(updateRental)
    .delete(deleteRental)


module.exports = router;
