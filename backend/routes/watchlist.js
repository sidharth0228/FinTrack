const express = require('express');
const router = express.Router();
const Watchlist = require('../models/Watchlist');
const authMiddleware = require('../middleware/authMiddleware');

// @route   GET /api/watchlist
// @desc    Get user's watchlist
router.get('/', authMiddleware, async (req, res) => {
    try {
        const watchlist = await Watchlist.find({ userId: req.user.id }).sort({ date: -1 });
        res.json(watchlist);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/watchlist
// @desc    Add an asset to watchlist
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { symbol, name, notes, isFutureBuy } = req.body;
        
        // Prevent duplicate symbols on watchlist
        let existing = await Watchlist.findOne({ userId: req.user.id, symbol });
        if (existing) {
            return res.status(400).json({ message: 'Asset already in watchlist' });
        }

        const newItem = new Watchlist({
            userId: req.user.id,
            symbol,
            name,
            notes: notes || '',
            isFutureBuy: isFutureBuy || false
        });

        const savedItem = await newItem.save();
        res.status(201).json(savedItem);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   PUT /api/watchlist/:id
// @desc    Update notes or future buy status of a watchlist item
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const { notes, isFutureBuy } = req.body;
        
        let item = await Watchlist.findOne({ _id: req.params.id, userId: req.user.id });
        if (!item) {
            return res.status(404).json({ message: 'Watchlist item not found' });
        }

        if (notes !== undefined) item.notes = notes;
        if (isFutureBuy !== undefined) item.isFutureBuy = isFutureBuy;

        await item.save();
        res.json(item);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE /api/watchlist/:id
// @desc    Remove an asset from watchlist
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const item = await Watchlist.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
        if (!item) {
            return res.status(404).json({ message: 'Watchlist item not found' });
        }
        res.json({ message: 'Watchlist item removed' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
