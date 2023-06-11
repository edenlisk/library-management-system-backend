const Settings = require('../modals/settingsModel');
const catchAsync = require('../utils/catchAsync');

exports.getSettings = catchAsync(async (req, res, next) => {
    const settings = await Settings.findOne();
    res
        .status(200)
        .json(
            {
                status: "Success",
                data: {
                    settings
                }
            }
        )
    ;
})

exports.createSettings = catchAsync(async (req, res, next) => {
    const settings = await Settings.create({});
    res
        .status(200)
        .json(
            {
                status: "Success",
                data: {
                    settings
                }
            }
        )
    ;
})

exports.updateSettings = catchAsync(async (req, res, next) => {
    const settings = await Settings.findOne().limit(1);
    if (req.body.fineAmount || req.body.fineAmount === 0) settings.fineAmount = req.body.fineAmount;
    if (req.body.graceDays || req.body.graceDays === 0) settings.graceDays = req.body.graceDays;
    if (req.body.inactivityDays || req.body.inactivityDays === 0) settings.inactivityDays = req.body.inactivityDays;
    if (req.body.fixedAmount || req.body.fixedAmount === 0) settings.fixedAmount = req.body.fixedAmount;
    if (req.body.limitPercentage || req.body.limitPercentage === 0) settings.limitPercentage = req.body.limitPercentage;
    await settings.save({validateModifiedOnly: true});
    res
        .status(200)
        .json(
            {
                status: "Success",
                data: {
                    settings
                }
            }
        )
    ;
})