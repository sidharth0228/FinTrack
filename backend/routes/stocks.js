const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const stocksController = require('../controllers/stocksController');

router.post('/sync', authMiddleware, stocksController.syncPortfolio);
router.get('/', authMiddleware, stocksController.getPortfolio);
router.get('/ai-report', authMiddleware, stocksController.getAIReport);

// Manual Asset Endpoints
router.post('/manual-stock', authMiddleware, stocksController.addManualStock);
router.put('/manual-stock/:id', authMiddleware, stocksController.updateManualStock);
router.delete('/manual-stock/:id', authMiddleware, stocksController.deleteManualStock);

router.post('/mutual-fund', authMiddleware, stocksController.addMutualFund);
router.put('/mutual-fund/:id', authMiddleware, stocksController.updateMutualFund);
router.delete('/mutual-fund/:id', authMiddleware, stocksController.deleteMutualFund);

router.post('/property', authMiddleware, stocksController.addProperty);
router.put('/property/:id', authMiddleware, stocksController.updateProperty);
router.delete('/property/:id', authMiddleware, stocksController.deleteProperty);

module.exports = router;
