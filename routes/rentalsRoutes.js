const express = require('express');
const router = express.Router();
const { getAllRentals, getRental, createRental, deleteRental, updateRental } = require('../controllers/rentalsController');
// TODO: PROTECT ALL ROUTES
const { protect } = require('../controllers/authController');

router.route('/')
    .get(getAllRentals)
    .post(createRental)

router.route('/:id')
    .get(getRental)
    .patch(updateRental)
    .delete(deleteRental)


module.exports = router;
