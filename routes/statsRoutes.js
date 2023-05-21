const express = require('express');
const router = express.Router();
const { weeklyStats } = require('../controllers/statsController');

router.route('/top-students')

router.route('/weekly-stats')
    .get(weeklyStats)


module.exports = router;
