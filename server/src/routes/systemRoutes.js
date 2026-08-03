// routes/systemRoutes.js
import { Router } from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { createPairingToken, getStatus } from '../controllers/systemController.js';

const router = Router();

router.use(protect);

router.post('/pairing-token', createPairingToken);
router.get('/status', getStatus);

export default router;
