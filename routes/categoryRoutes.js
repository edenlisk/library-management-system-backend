const express = require('express');
const router = express.Router();
const {
    getAllCategories,
    getCategory,
    createCategory } = require('../controllers/categoryController');


router.route('/')
    .get(getAllCategories)
    .post(createCategory)

router.route('/:categoryId')
    .get(getCategory)

module.exports = router;