const express = require('express');
const router = express.Router();
const { getAllLibrarians, getLibrarian, deleteLibrarian, updateLibrarian, uploadProfilePhoto } = require('../controllers/libraryController');
// TODO: PROTECT ALL ROUTES EXCEPT LOGIN AND SIGNUP
const { signup, login, restrictTo, protect, forgotPassword, resetPassword, logout } = require('../controllers/authController');

router.route('/')
    .get(getAllLibrarians)
    // .post(createLibrarian)

router.route('/signup')
    .post(signup)

router.route('/login')
    .post(login)

router.route('/logout')
    .post(logout)

router.route('/forgotPassword')
    .post(forgotPassword)

router.route('/resetPassword/:token')
    .patch(resetPassword)

router.route('/:id')
    .get(getLibrarian)
    .patch(uploadProfilePhoto, updateLibrarian)
    .delete( deleteLibrarian)

module.exports = router;
