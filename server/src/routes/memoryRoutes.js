// routes/memoryRoutes.js
import { Router } from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { getMemories, removeMemory } from '../controllers/memoryController.js';

const router = Router();

router.use(protect);

router.get('/', getMemories);
router.delete('/:id', removeMemory);

export default router;
