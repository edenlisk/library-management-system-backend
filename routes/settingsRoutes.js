const express = require('express');
const router = express.Router();
const { getSettings, createSettings, updateSettings } = require('../controllers/settingsController');

router.route('/')
    .get(getSettings)
    .post(createSettings)
    .patch(updateSettings)

module.exports = router;