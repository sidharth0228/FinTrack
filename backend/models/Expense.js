import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    goalId: {
        type: String,
        default: null
    },
    date: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.model('Expense', expenseSchema);
