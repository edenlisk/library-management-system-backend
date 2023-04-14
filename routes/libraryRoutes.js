const express = require('express');
const router = express.Router();
const { getAllLibrarians, getLibrarian, deleteLibrarian, createLibrarian, updateLibrarian } = require('../controllers/libraryController');

router.route('/')
    .get(getAllLibrarians)
    .post(createLibrarian)

router.route('/:id')
    .get(getLibrarian)
    .patch(updateLibrarian)
    .delete(deleteLibrarian)

module.exports = router;
