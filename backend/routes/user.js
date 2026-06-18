const express = require('express');
const router = express.Router();
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');

// @route   PATCH /api/user/income
// @desc    Update user's base expected income
router.patch('/income', authMiddleware, async (req, res) => {
    try {
        const { income } = req.body;
        console.log(`Received income update request: ${income} for user: ${req.user.id}`);
        
        if (income === undefined || isNaN(income)) {
            return res.status(400).json({ message: 'Invalid income value' });
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.baseExpectedIncome = parseFloat(income);
        await user.save();
        console.log(`Successfully updated income to ${user.baseExpectedIncome} for ${user.email}`);

        res.json({ 
            message: 'Income updated successfully', 
            baseExpectedIncome: user.baseExpectedIncome 
        });
    } catch (err) {
        console.error('Update Income Error:', err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   GET /api/user/profile
// @desc    Get user profile including income
router.get('/profile', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (err) {
        console.error('Get Profile Error:', err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   GET /api/user/settings
// @desc    Get user notification settings
router.get('/settings', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json({
            dailyNewspaperEnabled: user.dailyNewspaperEnabled,
            emergencyAlertsEnabled: user.emergencyAlertsEnabled,
            newspaperEmailAddress: user.newspaperEmailAddress || user.email
        });
    } catch (err) {
        console.error('Get Settings Error:', err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   PUT /api/user/settings
// @desc    Update user notification settings
router.put('/settings', authMiddleware, async (req, res) => {
    try {
        const { dailyNewspaperEnabled, emergencyAlertsEnabled, newspaperEmailAddress } = req.body;
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (dailyNewspaperEnabled !== undefined) user.dailyNewspaperEnabled = dailyNewspaperEnabled;
        if (emergencyAlertsEnabled !== undefined) user.emergencyAlertsEnabled = emergencyAlertsEnabled;
        if (newspaperEmailAddress !== undefined) user.newspaperEmailAddress = newspaperEmailAddress;

        await user.save();
        res.json({
            message: 'Settings updated successfully',
            dailyNewspaperEnabled: user.dailyNewspaperEnabled,
            emergencyAlertsEnabled: user.emergencyAlertsEnabled,
            newspaperEmailAddress: user.newspaperEmailAddress
        });
    } catch (err) {
        console.error('Update Settings Error:', err);
        res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;
