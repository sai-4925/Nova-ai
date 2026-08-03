// routes/calendarRoutes.js
// -----------------------------------------------------------------------
// All routes require the user to already be logged into NOVA (protect
// middleware) - the OAuth callback relies on the session cookie still
// being sent on Google's redirect back to us (a top-level GET
// navigation, which browsers allow even with SameSite=Lax cookies).
// -----------------------------------------------------------------------

import { Router } from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  getGoogleAuthUrl,
  googleOAuthCallback,
  listEvents,
  createEvent,
  removeEvent,
} from '../controllers/calendarController.js';

const router = Router();

router.use(protect);

router.get('/oauth/connect', getGoogleAuthUrl);
router.get('/oauth/callback', googleOAuthCallback);

router.get('/events', listEvents);
router.post('/events', createEvent);
router.delete('/events/:googleEventId', removeEvent);

export default router;
