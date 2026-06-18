import express from 'express';
const router = express.Router();
import Loan from '../models/Loan.js';
import CreditCard from '../models/CreditCard.js';
import Budget from '../models/Budget.js';
import authMiddleware from '../middleware/authMiddleware.js';

// Helper to calculate debt/loan details using mathematical formulas
const calculateDebtDetails = (principal, rate, tenureMonths, interestType) => {
    const P = parseFloat(principal);
    const R = parseFloat(rate);
    const n = parseInt(tenureMonths);

    let totalInterestPayable = 0;
    let totalAmountPayable = 0;
    let monthlyEMI = 0;

    if (R === 0) {
        totalAmountPayable = P;
        totalInterestPayable = 0;
        monthlyEMI = P / n;
    } else {
        const t_years = n / 12;
        const r_monthly = (R / 100) / 12;

        if (interestType === 'Simple') {
            totalInterestPayable = P * (R / 100) * t_years;
            totalAmountPayable = P + totalInterestPayable;
            monthlyEMI = totalAmountPayable / n;
        } else {
            // Compound Amortization Monthly EMI formula
            monthlyEMI = P * r_monthly * Math.pow(1 + r_monthly, n) / (Math.pow(1 + r_monthly, n) - 1);
            totalAmountPayable = monthlyEMI * n;
            totalInterestPayable = totalAmountPayable - P;
        }
    }

    return {
        totalInterestPayable: parseFloat(totalInterestPayable.toFixed(2)),
        totalAmountPayable: parseFloat(totalAmountPayable.toFixed(2)),
        monthlyEMI: parseFloat(monthlyEMI.toFixed(2))
    };
};

// Helper to generate dynamic amortization breakdown schedule
const generateAmortizationSchedule = (P, R, n, monthlyEMI, interestType) => {
    let balance = P;
    const r_monthly = (R / 100) / 12;
    const schedule = [];

    for (let i = 1; i <= n; i++) {
        let interestPortion = 0;
        let principalPortion = 0;

        if (R === 0) {
            interestPortion = 0;
            principalPortion = monthlyEMI;
        } else if (interestType === 'Simple') {
            const totalInterest = P * (R / 100) * (n / 12);
            interestPortion = totalInterest / n;
            principalPortion = monthlyEMI - interestPortion;
        } else {
            interestPortion = balance * r_monthly;
            principalPortion = monthlyEMI - interestPortion;
        }

        if (principalPortion > balance) {
            principalPortion = balance;
        }

        balance = Math.max(0, balance - principalPortion);

        schedule.push({
            month: i,
            beginningBalance: parseFloat((balance + principalPortion).toFixed(2)),
            payment: parseFloat((principalPortion + interestPortion).toFixed(2)),
            interestPortion: parseFloat(interestPortion.toFixed(2)),
            principalPortion: parseFloat(principalPortion.toFixed(2)),
            endingBalance: parseFloat(balance.toFixed(2))
        });
    }
    return schedule;
};

// Helper to check if a loan/debt is active
const isLoanActive = (loan) => {
    return loan.remainingAmount > 0;
};

// @route   GET /api/loans
// @desc    Get active loans/debts and credit cards for a user
router.get('/', authMiddleware, async (req, res) => {
    try {
        const allLoans = await Loan.find({ userId: req.user.id });
        const activeLoans = allLoans.filter(isLoanActive);
        const cards = await CreditCard.find({ userId: req.user.id });
        res.json({ loans: activeLoans, cards });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/loans/add
// @desc    Add a new debt and update Fixed Expenses budget
router.post('/add', authMiddleware, async (req, res) => {
    try {
        const { loanName, totalAmount, interestRate, tenure, interestType = 'Simple', emiFrequency = 'Monthly' } = req.body;
        
        if (!loanName || totalAmount === undefined || interestRate === undefined || tenure === undefined) {
            return res.status(400).json({ message: 'Debt Name, Principal Amount, Interest Rate, and Tenure are required.' });
        }

        const P = parseFloat(totalAmount);
        const R = parseFloat(interestRate);
        const n = parseInt(tenure);

        if (P <= 0) {
            return res.status(400).json({ message: 'Principal Amount must be greater than 0.' });
        }
        if (R < 0 || R > 100) {
            return res.status(400).json({ message: 'Interest Rate must be between 0% and 100%.' });
        }
        if (n <= 0) {
            return res.status(400).json({ message: 'Tenure must be greater than 0 months.' });
        }

        const calc = calculateDebtDetails(P, R, n, interestType);
        const schedule = generateAmortizationSchedule(P, R, n, calc.monthlyEMI, interestType);

        const newLoan = new Loan({
            userId: req.user.id,
            loanName,
            totalAmount: P,
            remainingAmount: calc.totalAmountPayable,
            interestRate: R,
            monthlyEMI: calc.monthlyEMI,
            tenure: n,
            interestType,
            emiFrequency,
            totalInterestPayable: calc.totalInterestPayable,
            totalAmountPayable: calc.totalAmountPayable,
            interestBreakdown: JSON.stringify(schedule),
            paymentsHistory: []
        });

        const loan = await newLoan.save();

        // Automatically update "Fixed Expenses" budget
        let fixedBudget = await Budget.findOne({ userId: req.user.id, category: 'Fixed Expenses' });
        if (fixedBudget) {
            fixedBudget.monthlyLimit += calc.monthlyEMI;
            await fixedBudget.save();
        } else {
            await new Budget({
                userId: req.user.id,
                category: 'Fixed Expenses',
                monthlyLimit: calc.monthlyEMI,
                type: 'Fixed'
            }).save();
        }

        res.json(loan);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/cards/add
// @desc    Add a new credit card
router.post('/cards/add', authMiddleware, async (req, res) => {
    try {
        const { cardName, totalDue, minimumPayment, dueDate, creditLimit } = req.body;
        
        if (!cardName || totalDue === undefined || minimumPayment === undefined || !dueDate || creditLimit === undefined) {
            return res.status(400).json({ message: 'All fields are required.' });
        }

        const limit = parseFloat(creditLimit);
        const due = parseFloat(totalDue);
        const min = parseFloat(minimumPayment);

        if (limit <= 0) {
            return res.status(400).json({ message: 'Credit Limit must be greater than 0.' });
        }
        if (due < 0) {
            return res.status(400).json({ message: 'Outstanding Balance cannot be negative.' });
        }
        if (min < 0) {
            return res.status(400).json({ message: 'Minimum Payment cannot be negative.' });
        }

        const newCard = new CreditCard({
            userId: req.user.id,
            cardName,
            creditLimit: limit,
            totalDue: due,
            minimumPayment: min,
            dueDate,
            amountPaid: 0
        });

        const card = await newCard.save();
        res.json(card);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/loans/:id/pay
// @desc    Manually record a payment (EMI or extra payment)
router.post('/:id/pay', authMiddleware, async (req, res) => {
    try {
        const { amount } = req.body;
        if (amount === undefined || amount <= 0) {
            return res.status(400).json({ message: 'Payment amount must be greater than 0.' });
        }

        const loan = await Loan.findOne({ _id: req.params.id, userId: req.user.id });
        if (!loan) {
            return res.status(404).json({ message: 'Debt record not found' });
        }

        const amountToPay = Math.min(amount, loan.remainingAmount);
        if (amountToPay <= 0) {
            return res.status(400).json({ message: 'This debt is already fully repaid.' });
        }

        // Calculate Interest vs Principal portion for this payment
        const paymentNum = loan.paymentsHistory.length + 1;
        const schedule = loan.interestBreakdown ? JSON.parse(loan.interestBreakdown) : [];
        const scheduleEntry = schedule.find(s => s.month === paymentNum);

        let interestPortion = 0;
        if (scheduleEntry) {
            // Pro-rate interest if payment is different from scheduled monthly EMI
            const expectedPayment = scheduleEntry.payment || loan.monthlyEMI;
            if (expectedPayment > 0) {
                interestPortion = Math.min(amountToPay, (scheduleEntry.interestPortion * (amountToPay / expectedPayment)));
            }
        }
        const principalPortion = amountToPay - interestPortion;

        loan.paymentsHistory.push({
            date: new Date(),
            amountPaid: amountToPay,
            remainingBalance: Math.max(0, loan.remainingAmount - amountToPay),
            interestPortion: parseFloat(interestPortion.toFixed(2)),
            principalPortion: parseFloat(principalPortion.toFixed(2))
        });

        loan.remainingAmount = Math.max(0, loan.remainingAmount - amountToPay);
        await loan.save();

        res.json({ message: 'Payment recorded successfully', loan });
    } catch (err) {
        console.error('Payment error:', err);
        res.status(500).send('Server Error');
    }
});

// @route   PUT /api/loans/:id/edit
// @desc    Edit debt with total paid till now and rebuild history
router.put('/:id/edit', authMiddleware, async (req, res) => {
    try {
        const { totalPaid } = req.body;
        if (totalPaid === undefined || totalPaid < 0) {
            return res.status(400).json({ message: 'Valid total amount paid is required' });
        }

        const loan = await Loan.findOne({ _id: req.params.id, userId: req.user.id });
        if (!loan) return res.status(404).json({ message: 'Debt record not found' });

        const validPaid = Math.min(totalPaid, loan.totalAmountPayable);
        
        // Rebuild historical payments based on the amortization breakdown
        const schedule = loan.interestBreakdown ? JSON.parse(loan.interestBreakdown) : [];
        const history = [];
        let currentRemaining = loan.totalAmountPayable;
        const paymentsCount = Math.floor(validPaid / loan.monthlyEMI);

        for (let i = 1; i <= paymentsCount; i++) {
            const entry = schedule.find(s => s.month === i);
            const payAmt = entry ? entry.payment : loan.monthlyEMI;
            const intPortion = entry ? entry.interestPortion : 0;
            const prinPortion = payAmt - intPortion;
            currentRemaining = Math.max(0, currentRemaining - payAmt);
            history.push({
                date: new Date(Date.now() - (paymentsCount - i) * 30 * 24 * 60 * 60 * 1000),
                amountPaid: payAmt,
                remainingBalance: currentRemaining,
                interestPortion: intPortion,
                principalPortion: prinPortion
            });
        }

        const remainder = validPaid - (paymentsCount * loan.monthlyEMI);
        if (remainder > 0) {
            const entry = schedule.find(s => s.month === paymentsCount + 1);
            const intPortion = entry ? Math.min(remainder, entry.interestPortion) : 0;
            const prinPortion = remainder - intPortion;
            currentRemaining = Math.max(0, currentRemaining - remainder);
            history.push({
                date: new Date(),
                amountPaid: remainder,
                remainingBalance: currentRemaining,
                interestPortion: intPortion,
                principalPortion: prinPortion
            });
        }

        loan.paymentsHistory = history;
        loan.remainingAmount = currentRemaining;
        await loan.save();

        res.json({ message: 'Debt updated successfully', loan });
    } catch (err) {
        console.error('Edit debt error:', err);
        res.status(500).send('Server Error');
    }
});

// @route   PUT /api/loans/cards/:id/edit
// @desc    Edit credit card details
router.put('/cards/:id/edit', authMiddleware, async (req, res) => {
    try {
        const { currentDue, amountPaid, creditLimit } = req.body;
        
        if (currentDue === undefined || amountPaid === undefined || creditLimit === undefined) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const limit = parseFloat(creditLimit);
        const due = parseFloat(currentDue);
        const paid = parseFloat(amountPaid);

        if (limit <= 0 || due < 0 || paid < 0) {
            return res.status(400).json({ message: 'Invalid values provided.' });
        }

        const card = await CreditCard.findOne({ _id: req.params.id, userId: req.user.id });
        if (!card) return res.status(404).json({ message: 'Credit card not found' });

        card.totalDue = due;
        card.amountPaid = paid;
        card.creditLimit = limit;
        await card.save();

        res.json({ message: 'Credit card edited successfully', card });
    } catch (err) {
        console.error('Edit card error:', err);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/loans/cards/:id/pay
// @desc    Pay specific amount towards credit card due
router.post('/cards/:id/pay', authMiddleware, async (req, res) => {
    try {
        const { amount } = req.body;
        
        if (!amount || amount <= 0) {
            return res.status(400).json({ message: 'Valid positive payment amount is required' });
        }

        const card = await CreditCard.findOne({ _id: req.params.id, userId: req.user.id });
        if (!card) return res.status(404).json({ message: 'Credit card not found' });

        if (amount > card.totalDue) {
            return res.status(400).json({ message: 'Payment amount cannot exceed outstanding balance' });
        }

        card.totalDue = Math.max(0, card.totalDue - amount);
        card.amountPaid = (card.amountPaid || 0) + amount;
        await card.save();

        res.json({ message: 'Payment recorded successfully', card });
    } catch (err) {
        console.error('Pay card error:', err);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE /api/loans/:id
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const loan = await Loan.findOne({ _id: req.params.id, userId: req.user.id });
        if (loan) {
            let fixedBudget = await Budget.findOne({ userId: req.user.id, category: 'Fixed Expenses' });
            if (fixedBudget) {
                fixedBudget.monthlyLimit = Math.max(0, fixedBudget.monthlyLimit - loan.monthlyEMI);
                await fixedBudget.save();
            }
            await Loan.findByIdAndDelete(req.params.id);
        }
        res.json({ message: 'Debt deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE /api/loans/cards/:id
router.delete('/cards/:id', authMiddleware, async (req, res) => {
    try {
        await CreditCard.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
        res.json({ message: 'Credit card deletion successful' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

export default router;
