// routes/chatRoutes.js
// -----------------------------------------------------------------------
// Every chat route requires authentication - applied once at the
// router level via router.use(protect) rather than repeating it on
// each individual route.
// -----------------------------------------------------------------------

import { Router } from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  createConversation,
  listConversations,
  getMessages,
  removeConversation,
  sendMessage,
} from '../controllers/chatController.js';

const router = Router();

router.use(protect);

router.post('/conversations', createConversation);
router.get('/conversations', listConversations);
router.get('/conversations/:id/messages', getMessages);
router.delete('/conversations/:id', removeConversation);
router.post('/conversations/:id/messages', sendMessage); // SSE streaming endpoint

export default router;
