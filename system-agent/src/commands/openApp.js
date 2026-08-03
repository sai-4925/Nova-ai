// src/commands/openApp.js
// -----------------------------------------------------------------------
// Cross-platform app/folder opening. Maps a few common names to the
// right OS-specific command - genuinely best-effort, since "every app
// name on every OS" isn't fully solvable without a proper app registry.
// Unknown names fall through to the OS's generic "open" mechanism,
// which works surprisingly often for folder paths and URLs.
// -----------------------------------------------------------------------

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const KNOWN_APPS = {
  darwin: {
    chrome: 'open -a "Google Chrome"',
    'google chrome': 'open -a "Google Chrome"',
    vscode: 'open -a "Visual Studio Code"',
    'visual studio code': 'open -a "Visual Studio Code"',
    'vs code': 'open -a "Visual Studio Code"',
  },
  win32: {
    chrome: 'start chrome',
    'google chrome': 'start chrome',
    vscode: 'code',
    'visual studio code': 'code',
    'vs code': 'code',
  },
  linux: {
    chrome: 'google-chrome',
    'google chrome': 'google-chrome',
    vscode: 'code',
    'visual studio code': 'code',
    'vs code': 'code',
  },
};

/**
 * @param {{ appName: string }} params
 * @returns {Promise<string>} a human-readable result for the response message
 */
export const openApp = async ({ appName }) => {
  const platform = process.platform; // 'darwin' | 'win32' | 'linux'
  const normalised = appName.trim().toLowerCase();
  const knownCommand = KNOWN_APPS[platform]?.[normalised];

  // Fallback: treat anything unrecognised as a path/URL/folder and use
  // the OS's generic opener - covers "open my downloads folder" etc.
  const command =
    knownCommand ||
    (platform === 'darwin' ? `open "${appName}"` : platform === 'win32' ? `start "" "${appName}"` : `xdg-open "${appName}"`);

  try {
    await execAsync(command);
    return `Opened ${appName}.`;
  } catch (error) {
    throw new Error(`Could not open "${appName}" - is it installed and on your PATH? (${error.message})`);
  }
};
