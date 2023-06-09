const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema(
    {
        fineAmount: {
            type: Number,
            validate: {
                validator: function (elem) {
                    return elem >= 0
                },
                message: 'Fine amount cannot be negative'
            },
            default: () => 100
        },
        graceDays: {
            type: Number,
            validate: {
                validator: function (elem) {
                    return elem >= 0
                },
                message: 'Grace days cannot be negative'
            },
            default: () => 0
        },
        inactivityDays: {
            type: Number,
            validate: {
                validator: function (elem) {
                    return elem >= 0
                },
                message: 'Please enter number greater than 0'
            },
            default: () => 90
        },
        fixedAmount: {
            type: Number,
            validate: {
                validator: function (elem) {
                    return elem >= 0
                },
                message: 'This cannot be negative'
            },
            default: () => 5000
        },
        limitPercentage: {
            type: Number,
            validate: {
                validator: (elem) => {
                    return elem >= 0
                },
                message: "This rental percentage limit can't be negative"
            },
            default: () => 30
        },
        fineCalculation: {
            type: Boolean,
            default: () => true
        }
    }
)

module.exports = mongoose.model('Settings', settingsSchema);