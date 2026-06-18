import mongoose from 'mongoose';

const newspaperRefreshSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    refreshedAt: {
        type: Date,
        default: Date.now
    },
    isManual: {
        type: Boolean,
        default: false
    },
    isEmergency: {
        type: Boolean,
        default: false
    },
    articleCount: {
        type: Number,
        default: 0
    },
    criticalAlertCount: {
        type: Number,
        default: 0
    },
    marketSnapshot: {
        type: Array,
        default: []
    },
    emergencyAlerts: [{
        text: { type: String, required: true },
        isCritical: { type: Boolean, default: false },
        isRead: { type: Boolean, default: false },
        isDismissed: { type: Boolean, default: false },
        date: { type: Date, default: Date.now }
    }],
    mainHeadline: {
        headline: { type: String },
        summary: { type: String },
        relatedHoldings: [{ type: String }],
        impactScore: { type: String },
        sentiment: { type: String },
        impactLevel: { type: String } // Low/Medium/High
    },
    holdingsNews: [{
        companyName: { type: String },
        headline: { type: String },
        summary: { type: String },
        impactScore: { type: String },
        sentiment: { type: String }, // Bullish/Bearish/Neutral
        impactLevel: { type: String } // Low/Medium/High
    }],
    watchlistNews: [{
        title: { type: String },
        desc: { type: String },
        sentiment: { type: String }, // Bullish/Bearish/Neutral
        impactLevel: { type: String } // Low/Medium/High
    }],
    futureBuyList: [{
        title: { type: String },
        desc: { type: String },
        sentiment: { type: String }, // Bullish/Bearish/Neutral
        impactLevel: { type: String } // Low/Medium/High
    }],
    sectorReport: [{
        name: { type: String },
        sentiment: { type: String },
        development: { type: String },
        movers: { type: String }
    }],
    aiAnalystDesk: {
        portfolioRisk: { type: String },
        emergingOpportunities: { type: String },
        hiddenRisks: { type: String },
        concentrationWarnings: { type: String },
        suggestedMonitoringAreas: { type: String }
    },
    marketOpinion: {
        type: String
    }
});

export default mongoose.model('NewspaperRefresh', newspaperRefreshSchema);
