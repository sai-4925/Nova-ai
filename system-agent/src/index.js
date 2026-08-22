// src/index.js  – FULLY EXPANDED
import { WebSocket } from 'ws';
import { readFileSync, existsSync } from 'fs';
import { openApp } from './commands/openApp.js';
import { takeScreenshot } from './commands/screenshot.js';
import { scheduleShutdown, scheduleRestart, cancelScheduledPowerAction } from './commands/powerControl.js';
import { createDirectory, createFile } from './commands/createPath.js';
import { typeText, pressHotkey, clickAt } from './commands/inputControl.js';

// NEW COMMANDS
import { runCommand } from './commands/shell.js';
import { listProcesses, killProcess } from './commands/process.js';
import { setVolume, mute, unmute, mediaPlayPause, mediaNext, mediaPrevious } from './commands/volumeMedia.js';
import { getClipboard, setClipboard } from './commands/clipboard.js';
import { listDir, openFile, searchFiles } from './commands/fileSystem.js';
import { focusWindow, minimizeWindow, closeWindow } from './commands/windowControl.js';
import { getSystemInfo } from './commands/systemInfo.js';
import { showNotification } from './commands/notification.js';

const configPath = new URL('../config.json', import.meta.url);
if (!existsSync(configPath)) {
  console.error('config.json not found. Copy config.example.json → config.json and fill it in.');
  process.exit(1);
}
const config = JSON.parse(readFileSync(configPath));

const FULL_MODE = config.fullControl === true; // must be explicitly enabled

const SAFE_HANDLERS = {
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

  // Always safe
  set_volume: setVolume,
  mute: mute,
  unmute: unmute,
  media_play_pause: mediaPlayPause,
  media_next: mediaNext,
  media_previous: mediaPrevious,
  get_clipboard: getClipboard,
  set_clipboard: setClipboard,
  list_dir: listDir,
  open_file: openFile,
  search_files: searchFiles,
  focus_window: focusWindow,
  minimize_window: minimizeWindow,
  close_window: closeWindow,
  get_system_info: getSystemInfo,
  show_notification: showNotification,
};

const FULL_ONLY_HANDLERS = {
  run_command: runCommand,
  list_processes: listProcesses,
  kill_process: killProcess,
};

const COMMAND_HANDLERS = {
  ...SAFE_HANDLERS,
  ...(FULL_MODE ? FULL_ONLY_HANDLERS : {}),
};

let reconnectDelayMs = 2000;
const MAX_RECONNECT_DELAY_MS = 30000;

const connect = () => {
  console.log(`Connecting to ${config.backendWsUrl}...`);
  console.log(`Mode: ${FULL_MODE ? 'FULL CONTROL' : 'SAFE (restricted)'}`);
  const ws = new WebSocket(config.backendWsUrl);

  ws.on('open', () => {
    console.log('Connected. Registering...');
    reconnectDelayMs = 2000;
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
      const reason = FULL_MODE
        ? `Unknown action: ${msg.action}`
        : `Action "${msg.action}" is only available in fullControl mode. Set "fullControl": true in config.json`;
      ws.send(JSON.stringify({ type: 'response', requestId: msg.requestId, error: reason }));
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
  });
};

console.log('NOVA System Agent companion starting...');
connect();