const express = require('express');
const router = express.Router();
const { weeklyStats, topStudents, lastCreatedRentals } = require('../controllers/statsController');

router.route('/top-students/:academicYear')
    .get(topStudents)

router.route('/last-created')
    .get(lastCreatedRentals)

router.route('/weekly-stats')
    .get(weeklyStats)


module.exports = router;
