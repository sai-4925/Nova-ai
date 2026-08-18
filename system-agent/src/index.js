// src/index.js
// -----------------------------------------------------------------------
// The companion app's entry point. Run this on YOUR OWN computer (never
// on the cloud backend) - it connects OUTBOUND to your deployed NOVA
// backend and stays connected, executing commands Nova sends down that
// connection. See server/src/config/systemAgentSocket.js for the other
// side of this connection.
//
// Reconnects automatically with backoff if the connection drops (sleep/
// wake, network blip, backend redeploy) - this is meant to run
// continuously in the background, not be restarted manually each time.
// -----------------------------------------------------------------------

import { WebSocket } from 'ws';
import { readFileSync } from 'fs';
import { openApp } from './commands/openApp.js';
import { takeScreenshot } from './commands/screenshot.js';
import { scheduleShutdown, scheduleRestart, cancelScheduledPowerAction } from './commands/powerControl.js';
import { createDirectory, createFile } from './commands/createPath.js';  
import { typeText, pressHotkey, clickAt } from './commands/inputControl.js';
const config = JSON.parse(readFileSync(new URL('../config.json', import.meta.url)));

const COMMAND_HANDLERS = {
  open_app: openApp,
  take_screenshot: takeScreenshot,
  shutdown: scheduleShutdown,
  restart: scheduleRestart,
  cancel_power_action: cancelScheduledPowerAction,
  create_directory: createDirectory,   
  create_file: createFile,
  type_text: typeText,                 
  press_hotkey: pressHotkey,           
  click_at: clickAt,                   
};

let reconnectDelayMs = 2000;
const MAX_RECONNECT_DELAY_MS = 30000;

const connect = () => {
  console.log(`Connecting to ${config.backendWsUrl}...`);
  const ws = new WebSocket(config.backendWsUrl);

  ws.on('open', () => {
    console.log('Connected. Registering...');
    reconnectDelayMs = 2000; // reset backoff on a successful connection
    ws.send(JSON.stringify({ type: 'register', token: config.pairingToken }));
  });

  ws.on('message', async (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      return;
    }

    if (msg.type !== 'command') return;

    const handler = COMMAND_HANDLERS[msg.action];
    if (!handler) {
      ws.send(JSON.stringify({ type: 'response', requestId: msg.requestId, error: `Unknown action: ${msg.action}` }));
      return;
    }

    try {
      const result = await handler(msg.params || {});
      ws.send(JSON.stringify({ type: 'response', requestId: msg.requestId, result }));
    } catch (error) {
      ws.send(JSON.stringify({ type: 'response', requestId: msg.requestId, error: error.message }));
    }
  });

  ws.on('close', (code, reason) => {
    console.log(`Disconnected (${code} ${reason}). Reconnecting in ${reconnectDelayMs / 1000}s...`);
    setTimeout(connect, reconnectDelayMs);
    reconnectDelayMs = Math.min(reconnectDelayMs * 1.5, MAX_RECONNECT_DELAY_MS);
  });

  ws.on('error', (error) => {
    console.error('Connection error:', error.message);
    // 'close' fires after 'error' for the same socket, so reconnection
    // is already handled there - no separate retry needed here.
  });
};

console.log('NOVA System Agent companion starting...');
connect();
