const express = require('express');
const router = express.Router();
const { generateNotificationReport } = require('../utils/generatePdf');
const {protect, restrictTo} = require('../controllers/authController');
const {
    weeklyStats,
    topBooks,
    topStudents,
    lastCreatedRentals,
    numberOfBooks,
    notification,
    numberOfRentalsByCategory,
    totalStats,
    allRentals, numberOfRentalsBySubcategory } = require('../controllers/statsController');

router.route('/top-students/:academicYear')
    .get(topStudents)

router.route('/last-created')
    .get(lastCreatedRentals)

router.route('/weekly-stats')
    .get(weeklyStats)

router.route('/books')
    .get(numberOfBooks)

router.route('/stats-categories')
    .get(numberOfRentalsByCategory)

router.route('/top-books')
    .get(topBooks)

router.route('/notification')
    .get(notification)

router.route('/stats-subcategories')
    .get(numberOfRentalsBySubcategory)

router.route('/all-rentals/:academicYear')
    .get(allRentals);

router.route('/total-revenue')
    .get(totalStats)

router.route('/notification-report')
    .post(generateNotificationReport);


module.exports = router;
