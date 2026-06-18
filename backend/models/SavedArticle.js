const mongoose = require('mongoose');

const savedArticleSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true }, // Keep for compatibility
    headline: { type: String, required: true },
    summary: { type: String, required: true },
    source: { type: String, default: 'FinTrack Daily' },
    url: { type: String },
    datePublished: { type: Date, default: Date.now },
    dateBookmarked: { type: Date, default: Date.now },
    articleId: { type: String },
    date: { type: Date, default: Date.now } // Keep for compatibility
});

module.exports = mongoose.model('SavedArticle', savedArticleSchema);
