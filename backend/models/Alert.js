const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true },
    isCritical: { type: Boolean, default: false },
    isRead: { type: Boolean, default: false },
    isDismissed: { type: Boolean, default: false },
    date: { type: Date, default: Date.now }
});

// Post-save hook to automatically trigger emergency alerts emails
alertSchema.post('save', async function(doc) {
    if (doc.isCritical && !doc.isDismissed) {
        try {
            const EmergencyAlertEmailService = require('../services/EmergencyAlertEmailService');
            // Trigger emergency email async
            await EmergencyAlertEmailService.sendEmergencyAlertEmail(doc.userId, doc);
        } catch (err) {
            console.error('Failed to trigger emergency alert email hook:', err);
        }
    }
});

module.exports = mongoose.model('Alert', alertSchema);
