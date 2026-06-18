import express from 'express';
const router = express.Router();
import authMiddleware from '../middleware/authMiddleware.js';
import newspaperController from '../controllers/newspaperController.js';

// @route   GET /api/newspaper
// @desc    Get dynamic financial newspaper content for the user's portfolio
router.get('/', authMiddleware, newspaperController.getNewspaper);

// @route   POST /api/newspaper/refresh
// @desc    Force a manual refresh of the newspaper
router.post('/refresh', authMiddleware, newspaperController.refreshNewspaper);

export default router;
