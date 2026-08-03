// routes/reminderRoutes.js
import { Router } from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { createReminder, listReminders, deleteReminder } from '../controllers/reminderController.js';

const router = Router();

router.use(protect);

router.post('/', createReminder);
router.get('/', listReminders);
router.delete('/:id', deleteReminder);

export default router;
