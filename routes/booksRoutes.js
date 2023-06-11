const express = require('express');
const router = express.Router();
const {
    getAllBooks,
    getBook,
    createBook,
    updateBook,
    uploadBooks,
    importBooks, lessBooks } = require('../controllers/bookController');


router.route('/')
    .get(getAllBooks)
    .post(createBook)

router.route('/less-books')
    .get(lessBooks)

router.route('/:bookId')
    .get(getBook)
    .patch(updateBook)


router.route('/upload')
    .post(uploadBooks, importBooks)


module.exports = router;