// services/systemAgentService.js
// -----------------------------------------------------------------------
// Pairing token management + a thin re-export of the relay's command
// function - kept as its own service (rather than importing the socket
// module directly everywhere) so controllers/tools have one clear entry
// point, matching every other service's shape in this codebase.
// -----------------------------------------------------------------------

import { randomBytes } from 'crypto';
import { User } from '../models/User.js';
import { sendCommandToCompanion, isCompanionConnected } from '../config/systemAgentSocket.js';

/**
 * Generates (or regenerates) a user's companion pairing token. Called
 * once when the user first sets up the companion app, or again if they
 * ever need to re-pair (e.g. suspected token leak, or setting up on a
 * new machine).
 * @param {string} userId
 */
export const generatePairingToken = async (userId) => {
  const token = randomBytes(24).toString('hex');
  await User.findByIdAndUpdate(userId, { systemAgentToken: token });
  return token;
};

export const getCompanionStatus = (userId) => ({ connected: isCompanionConnected(userId) });

export { sendCommandToCompanion };
