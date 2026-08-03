// controllers/systemController.js
// -----------------------------------------------------------------------
// Lets the dashboard show a "Connect your computer" flow: generate a
// pairing token, show it to the user once, they paste it into the
// companion app's local config file, then this endpoint can confirm
// whether the companion actually connected.
// -----------------------------------------------------------------------

import { generatePairingToken, getCompanionStatus } from '../services/systemAgentService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';

// POST /api/system/pairing-token
export const createPairingToken = asyncHandler(async (req, res) => {
  const token = await generatePairingToken(req.user._id);
  new ApiResponse(200, { token }, 'Paste this token into your companion app\'s config, then restart it').send(res);
});

// GET /api/system/status
export const getStatus = asyncHandler(async (req, res) => {
  const status = getCompanionStatus(req.user._id);
  new ApiResponse(200, status).send(res);
});
