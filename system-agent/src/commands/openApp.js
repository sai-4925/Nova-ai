// src/commands/openApp.js
// -----------------------------------------------------------------------
// Cross-platform app/folder opening. Maps a few common names to the
// right OS-specific command. Supports Chrome profile + URL/search.
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
 * @param {{ appName: string, url?: string, profile?: string, search?: string }} params
 * @returns {Promise<string>}
 */
export const openApp = async ({ appName, url, profile, search }) => {
  const platform = process.platform;
  const normalised = (appName || '').trim().toLowerCase();

  // Build final URL if user asked to search
  let finalUrl = url;
  if (search && !finalUrl) {
    finalUrl = `https://www.google.com/search?q=${encodeURIComponent(search)}`;
  }

  // Special Chrome handling (profile + URL)
  const isChrome = normalised === 'chrome' || normalised === 'google chrome';

  if (isChrome) {
    try {
      if (platform === 'win32') {
        // start chrome [--profile-directory="Profile 1"] ["url"]
        let cmd = 'start "" chrome';
        if (profile) cmd += ` --profile-directory="${profile}"`;
        if (finalUrl) cmd += ` "${finalUrl}"`;
        await execAsync(cmd);
      } else if (platform === 'darwin') {
        // open -a "Google Chrome" [--args --profile-directory=...] [url]
        let cmd = 'open -a "Google Chrome"';
        if (profile || finalUrl) {
          cmd += ' --args';
          if (profile) cmd += ` --profile-directory="${profile}"`;
          if (finalUrl) cmd += ` "${finalUrl}"`;
        } else if (finalUrl) {
          cmd += ` "${finalUrl}"`;
        }
        await execAsync(cmd);
      } else {
        // Linux
        let cmd = 'google-chrome';
        if (profile) cmd += ` --profile-directory="${profile}"`;
        if (finalUrl) cmd += ` "${finalUrl}"`;
        await execAsync(cmd);
      }

      const parts = [];
      if (profile) parts.push(`profile: ${profile}`);
      if (search) parts.push(`search: "${search}"`);
      else if (finalUrl) parts.push(`url: ${finalUrl}`);
      return `Opened Chrome${parts.length ? ` (${parts.join(', ')})` : ''}.`;
    } catch (error) {
      throw new Error(`Could not open Chrome: ${error.message}`);
    }
  }

  // Normal apps / folders / URLs
  const knownCommand = KNOWN_APPS[platform]?.[normalised];
  const command =
    knownCommand ||
    (platform === 'darwin'
      ? `open "${appName}"`
      : platform === 'win32'
        ? `start "" "${appName}"`
        : `xdg-open "${appName}"`);

  try {
    await execAsync(command);
    return `Opened ${appName}.`;
  } catch (error) {
    throw new Error(`Could not open "${appName}" - is it installed and on your PATH? (${error.message})`);
  }
};