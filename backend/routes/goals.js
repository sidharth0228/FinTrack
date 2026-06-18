const express = require('express');
const router = express.Router();
const Goal = require('../models/Goal');
const Expense = require('../models/Expense');
const authMiddleware = require('../middleware/authMiddleware');

// @route   GET /api/goals
// @desc    Get user's goals
router.get('/', authMiddleware, async (req, res) => {
    try {
        const goals = await Goal.find({ userId: req.user.id });
        res.json(goals);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/goals
// @desc    Create a new goal
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { name, targetAmount, savedAmount, deadline } = req.body;
        const newGoal = new Goal({
            userId: req.user.id,
            name,
            targetAmount,
            savedAmount: savedAmount || 0,
            deadline
        });
        const goal = await newGoal.save();
        res.json(goal);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   PUT /api/goals/:id
// @desc    Update a goal (e.g., update savedAmount)
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const { name, targetAmount, savedAmount, deadline } = req.body;
        let goal = await Goal.findById(req.params.id);
        if (!goal) {
            return res.status(404).json({ message: 'Goal not found' });
        }

        // Check ownership
        if (goal.userId.toString() !== req.user.id) {
            return res.status(401).json({ message: 'User not authorized' });
        }

        goal = await Goal.findByIdAndUpdate(req.params.id, { $set: { name, targetAmount, savedAmount, deadline } }, { new: true });
        res.json(goal);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE /api/goals/:id
// @desc    Delete a goal and its contributions
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const goal = await Goal.findById(req.params.id);
        if (!goal) {
            return res.status(404).json({ message: 'Goal not found' });
        }

        // Check ownership
        if (goal.userId.toString() !== req.user.id) {
            return res.status(401).json({ message: 'User not authorized' });
        }

        await Goal.findByIdAndDelete(req.params.id);
        
        // Cascading delete for contributions
        await Expense.deleteMany({ userId: req.user.id, category: 'Goals', goalId: req.params.id });
        
        res.json({ message: 'Goal and associated contributions deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
