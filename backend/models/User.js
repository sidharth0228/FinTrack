const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    baseExpectedIncome: {
        type: Number,
        default: 100000
    },
    dailyNewspaperEnabled: {
        type: Boolean,
        default: true
    },
    emergencyAlertsEnabled: {
        type: Boolean,
        default: true
    },
    newspaperEmailAddress: {
        type: String
    },
    lastNewspaperSentAt: {
        type: Date
    }
});

module.exports = mongoose.model('User', userSchema);
