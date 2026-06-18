import mongoose from 'mongoose';

const stockSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    symbol: { type: String, required: true },
    name: { type: String, required: true },
    quantity: { type: Number, default: 0 },
    purchasePrice: { type: Number, required: true },
    currentPrice: { type: Number, required: true },
    sector: { type: String, default: 'Other' },
    date: { type: Date, default: Date.now }
});

export default mongoose.model('Stock', stockSchema);
