const express = require('express');
const router = express.Router();
const { getAllClasses, createClass, deleteClass, getClass, updateClass } = require('../controllers/classController');

router.route('/')
    .get(getAllClasses)
    .post(createClass)

router.route('/:id')
    .get(getClass)
    .patch(updateClass)
    .delete(deleteClass)

module.exports = router;
