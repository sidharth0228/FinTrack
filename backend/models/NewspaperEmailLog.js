import mongoose from 'mongoose';

const newspaperEmailLogSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    recipient: { type: String, required: true },
    emailType: { type: String, enum: ['daily', 'emergency'], required: true },
    sendTime: { type: Date, default: Date.now },
    deliveryStatus: { type: String, enum: ['success', 'failed'], required: true },
    errorMessage: { type: String },
    attempts: { type: Number, default: 1 }
});

export default mongoose.model('NewspaperEmailLog', newspaperEmailLogSchema);
