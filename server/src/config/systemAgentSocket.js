// config/systemAgentSocket.js
// -----------------------------------------------------------------------
// THE key piece that makes the System Agent architecturally possible:
// the local companion app (running on the user's PC) opens an OUTBOUND
// WebSocket connection to this deployed backend - never the reverse.
// A cloud server has no way to dial into a home network/laptop; the
// only direction that reliably works is the local machine reaching OUT
// to a public server, exactly like an SSH reverse tunnel.
//
// Registry: userId -> live WebSocket connection. When systemAgentService
// needs to run a command for a user, it looks up their connection here,
// sends the command down that EXISTING socket, and waits for a
// correlated response by requestId.
// -----------------------------------------------------------------------

import { WebSocketServer } from 'ws';
import { User } from '../models/User.js';
import { logger } from '../utils/logger.js';

const connections = new Map(); // userId (string) -> WebSocket
const pendingRequests = new Map(); // requestId -> { resolve, reject, timeoutHandle }

const REQUEST_TIMEOUT_MS = 20000; // companion actions (open app, screenshot) should respond quickly
const RUN_COMMAND_TIMEOUT_MS = 60000;

/**
 * Attaches the WebSocket server to the existing HTTP server (the same
 * one Express listens on) - NOT a separate port, so it works cleanly
 * behind Render's single-port model.
 * @param {import('http').Server} httpServer
 */
export const initSystemAgentRelay = (httpServer) => {
  const wss = new WebSocketServer({ server: httpServer, path: '/ws/system-agent' });

  wss.on('connection', (ws) => {
    let registeredUserId = null;

    ws.on('message', async (raw) => {
      let msg;
      try {
        msg = JSON.parse(raw.toString());
      } catch {
        return; // ignore malformed frames rather than crashing the connection
      }

      if (msg.type === 'register') {
        // The companion authenticates with the per-user pairing token
        // (Module 19's User.systemAgentToken), NOT the web app's JWT -
        // the JWT rotates/expires on every login, which would disconnect
        // the companion constantly; the pairing token is meant to be
        // copied once and stay stable.
        try {
          const user = await User.findOne({ systemAgentToken: msg.token }).select('_id');
          if (!user) {
            ws.close(4001, 'Invalid pairing token');
            return;
          }
          registeredUserId = user._id.toString();
          connections.set(registeredUserId, ws);
          logger.info(`System Agent companion connected for user ${registeredUserId}`);
        } catch (error) {
          // A transient DB issue here should close the connection
          // cleanly (the companion will reconnect and retry) rather
          // than leaving an unhandled rejection from this async handler.
          logger.error(`System Agent registration failed: ${error.message}`);
          ws.close(1011, 'Registration failed - please retry');
        }
        return;
      }

      if (msg.type === 'response' && msg.requestId) {
        const pending = pendingRequests.get(msg.requestId);
        if (pending) {
          clearTimeout(pending.timeoutHandle);
          if (msg.error) pending.reject(new Error(msg.error));
          else pending.resolve(msg.result);
          pendingRequests.delete(msg.requestId);
        }
      }
    });

    ws.on('close', () => {
      if (registeredUserId) {
        connections.delete(registeredUserId);
        logger.info(`System Agent companion disconnected for user ${registeredUserId}`);
      }
    });
  });

  logger.info('System Agent WebSocket relay listening at /ws/system-agent');
};

export const isCompanionConnected = (userId) => connections.has(userId.toString());

/**
 * Sends a command to a specific user's connected companion app and
 * waits for its response, correlated by a unique requestId.
 * @param {string} userId
 * @param {string} action - e.g. 'open_app', 'take_screenshot', 'shutdown', 'restart'
 * @param {object} params
 * @returns {Promise<string>} the companion's result message
 */
export const sendCommandToCompanion = (userId, action, params = {}) => {
  const ws = connections.get(userId.toString());
  if (!ws) {
    return Promise.reject(
      new Error(
        "Your System Agent companion app isn't connected. Make sure it's running on your computer and paired with your account."
      )
    );
  }

  const requestId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const timeoutMs = action === 'run_command' ? RUN_COMMAND_TIMEOUT_MS : REQUEST_TIMEOUT_MS;

  return new Promise((resolve, reject) => {
    const timeoutHandle = setTimeout(() => {
      pendingRequests.delete(requestId);
      reject(new Error('The companion app took too long to respond.'));
    }, timeoutMs);

    pendingRequests.set(requestId, { resolve, reject, timeoutHandle });
    ws.send(JSON.stringify({ type: 'command', requestId, action, params }));
  });
};
