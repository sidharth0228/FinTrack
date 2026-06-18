const mongoose = require('mongoose');

const LoanSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    loanName: {
        type: String,
        required: true
    },
    totalAmount: {
        type: Number,
        required: true
    },
    remainingAmount: {
        type: Number,
        required: true
    },
    interestRate: {
        type: Number,
        required: true
    },
    monthlyEMI: {
        type: Number,
        required: true
    },
    tenure: {
        type: Number, // in months
        required: true
    },
    startDate: {
        type: Date,
        default: Date.now
    },
    interestType: {
        type: String,
        default: 'Simple'
    },
    emiFrequency: {
        type: String,
        default: 'Monthly'
    },
    totalInterestPayable: {
        type: Number,
        default: 0
    },
    totalAmountPayable: {
        type: Number,
        default: 0
    },
    interestBreakdown: {
        type: String,
        default: ''
    },
    paymentsHistory: [{
        date: { type: Date, default: Date.now },
        amountPaid: { type: Number, required: true },
        remainingBalance: { type: Number, required: true },
        interestPortion: { type: Number, required: true },
        principalPortion: { type: Number, required: true }
    }]
});

module.exports = mongoose.model('Loan', LoanSchema);
