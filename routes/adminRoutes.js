const express = require('express');
const router = express.Router();
const { login, signup, adminSignup } = require('../controllers/authController');

router.route('/login')
    .post(login)

router.route('/signup')
    .post(adminSignup, signup)


module.exports = router;
