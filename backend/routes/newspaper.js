const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const newspaperController = require('../controllers/newspaperController');

// @route   GET /api/newspaper
// @desc    Get dynamic financial newspaper content for the user's portfolio
router.get('/', authMiddleware, newspaperController.getNewspaper);

// @route   POST /api/newspaper/refresh
// @desc    Force a manual refresh of the newspaper
router.post('/refresh', authMiddleware, newspaperController.refreshNewspaper);

module.exports = router;
