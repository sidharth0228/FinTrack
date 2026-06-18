import express from 'express';
const router = express.Router();
import authMiddleware from '../middleware/authMiddleware.js';
import stocksController from '../controllers/stocksController.js';

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

export default router;
