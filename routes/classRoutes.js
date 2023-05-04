const express = require('express');
const router = express.Router();
const { getAllClasses, createClass, deleteClass, getClass, updateClass } = require('../controllers/classController');
const { numStudentsPerClass } = require('../controllers/statsController')
// TODO: PROTECT ALL ROUTES
const { protect } = require('../controllers/authController');
const { generateClassReport } = require('../utils/generatePdf');

router.route('/')
    .get(getAllClasses)
    .post(createClass)

router.route('/report/:id')
    .get(generateClassReport)

router.route('/stats')
    .get(numStudentsPerClass)

router.route('/:id')
    .get(getClass)
    .patch(updateClass)
    .delete(deleteClass)

module.exports = router;
