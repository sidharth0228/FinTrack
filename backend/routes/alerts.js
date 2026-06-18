const express = require('express');
const router = express.Router();
const Alert = require('../models/Alert');
const authMiddleware = require('../middleware/authMiddleware');

// @route   GET /api/alerts
// @desc    Get user's active alerts (non-dismissed)
router.get('/', authMiddleware, async (req, res) => {
    try {
        const alerts = await Alert.find({ userId: req.user.id, isDismissed: false }).sort({ date: -1 });
        res.json(alerts);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/alerts
// @desc    Create a custom alert
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { text } = req.body;
        if (!text) {
            return res.status(400).json({ message: 'Alert text is required' });
        }

        const newAlert = new Alert({
            userId: req.user.id,
            text
        });

        const savedAlert = await newAlert.save();
        res.status(201).json(savedAlert);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   PUT /api/alerts/:id/read
// @desc    Mark an alert as read
router.put('/:id/read', authMiddleware, async (req, res) => {
    try {
        const alert = await Alert.findOne({ _id: req.params.id, userId: req.user.id });
        if (!alert) {
            return res.status(404).json({ message: 'Alert not found' });
        }

        alert.isRead = true;
        await alert.save();
        res.json(alert);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   PUT /api/alerts/:id/dismiss
// @desc    Dismiss an alert
router.put('/:id/dismiss', authMiddleware, async (req, res) => {
    try {
        const alert = await Alert.findOne({ _id: req.params.id, userId: req.user.id });
        if (!alert) {
            return res.status(404).json({ message: 'Alert not found' });
        }

        alert.isDismissed = true;
        await alert.save();
        res.json(alert);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE /api/alerts/:id
// @desc    Permanently delete an alert
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const alert = await Alert.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
        if (!alert) {
            return res.status(404).json({ message: 'Alert not found' });
        }
        res.json({ message: 'Alert deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
