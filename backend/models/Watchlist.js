import mongoose from 'mongoose';

const watchlistSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    symbol: { type: String, required: true },
    name: { type: String, required: true },
    notes: { type: String, default: '' },
    isFutureBuy: { type: Boolean, default: false },
    date: { type: Date, default: Date.now }
});

export default mongoose.model('Watchlist', watchlistSchema);
