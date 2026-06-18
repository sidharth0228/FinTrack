import express from 'express';
const router = express.Router();
import SavedArticle from '../models/SavedArticle.js';
import authMiddleware from '../middleware/authMiddleware.js';

// @route   GET /api/newspaper/saved
// @desc    Get user's bookmarked newspaper articles
router.get('/', authMiddleware, async (req, res) => {
    try {
        const articles = await SavedArticle.find({ userId: req.user.id }).sort({ dateBookmarked: -1 });
        res.json(articles);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/newspaper/saved
// @desc    Bookmark a newspaper article
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { title, headline, summary, source, datePublished, dateBookmarked, articleId, url } = req.body;
        const activeHeadline = headline || title;
        if (!activeHeadline || !summary) {
            return res.status(400).json({ message: 'Headline/Title and summary are required' });
        }

        const newArticle = new SavedArticle({
            userId: req.user.id,
            title: activeHeadline,
            headline: activeHeadline,
            summary,
            source: source || 'FinTrack Daily',
            url: url || '',
            datePublished: datePublished ? new Date(datePublished) : new Date(),
            dateBookmarked: dateBookmarked ? new Date(dateBookmarked) : new Date(),
            articleId: articleId || '',
            date: dateBookmarked ? new Date(dateBookmarked) : new Date()
        });

        const savedArticle = await newArticle.save();
        res.status(201).json(savedArticle);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE /api/newspaper/saved/:id
// @desc    Remove a bookmarked article
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const article = await SavedArticle.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
        if (!article) {
            return res.status(404).json({ message: 'Saved article not found' });
        }
        res.json({ message: 'Bookmarked article removed' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

export default router;
