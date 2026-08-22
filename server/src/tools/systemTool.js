// tools/systemTool.js
// -----------------------------------------------------------------------
// Factory-bound to userId. Every action targets a SPECIFIC user's own
// machine via their companion WebSocket.
// -----------------------------------------------------------------------

import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { sendCommandToCompanion } from '../services/systemAgentService.js';

/** @param {string} userId */
export const openAppTool = (userId) =>
  tool(
    async ({ appName, url, profile, search }) =>
      sendCommandToCompanion(userId, 'open_app', { appName, url, profile, search }),
    {
      name: 'open_application',
      description:
        "Opens an application (e.g. Chrome, VS Code) or folder on the user's own computer. For Chrome you can also open a URL, run a Google search, or pick a profile.",
      schema: z.object({
        appName: z.string().describe('Name of the app or folder, e.g. "chrome", "vscode", "downloads"'),
        url: z.string().optional().describe('Optional URL to open (mainly useful with Chrome)'),
        profile: z.string().optional().describe('Chrome profile directory name, e.g. "Default", "Profile 1"'),
        search: z.string().optional().describe('Optional Google search query to open in Chrome'),
      }),
    }
  );

export const takeScreenshotTool = (userId) =>
  tool(async () => sendCommandToCompanion(userId, 'take_screenshot', {}), {
    name: 'take_screenshot',
    description: "Takes a screenshot of the user's own computer screen.",
    schema: z.object({}),
  });

export const shutdownTool = (userId) =>
  tool(async () => sendCommandToCompanion(userId, 'shutdown', { delaySeconds: 60 }), {
    name: 'shutdown_computer',
    description: "Schedules the user's own computer to shut down after a short delay (60 seconds).",
    schema: z.object({}),
  });

export const restartTool = (userId) =>
  tool(async () => sendCommandToCompanion(userId, 'restart', { delaySeconds: 60 }), {
    name: 'restart_computer',
    description: "Schedules the user's own computer to restart after a short delay (60 seconds).",
    schema: z.object({}),
  });

export const cancelPowerActionTool = (userId) =>
  tool(async () => sendCommandToCompanion(userId, 'cancel_power_action', {}), {
    name: 'cancel_power_action',
    description: "Cancels a previously scheduled shutdown or restart on the user's own computer.",
    schema: z.object({}),
  });

export const createDirectoryTool = (userId) =>
  tool(async ({ path }) => sendCommandToCompanion(userId, 'create_directory', { path }), {
    name: 'create_directory',
    description: "Creates a directory (folder) on the user's own computer.",
    schema: z.object({
      path: z.string().describe('Full path or path relative to home'),
    }),
  });

export const createFileTool = (userId) =>
  tool(async ({ path, content }) => sendCommandToCompanion(userId, 'create_file', { path, content }), {
    name: 'create_file',
    description: "Creates a text file on the user's own computer.",
    schema: z.object({
      path: z.string().describe('Full path or path relative to home'),
      content: z.string().optional().describe('Optional text content'),
    }),
  });

export const typeTextTool = (userId) =>
  tool(async ({ text }) => sendCommandToCompanion(userId, 'type_text', { text }), {
    name: 'type_text',
    description: "Types text on the user's computer at the current cursor focus.",
    schema: z.object({ text: z.string().describe('Text to type') }),
  });

export const pressHotkeyTool = (userId) =>
  tool(async ({ keys }) => sendCommandToCompanion(userId, 'press_hotkey', { keys }), {
    name: 'press_hotkey',
    description: 'Presses a keyboard shortcut. Use nut.js key names: LeftControl, LeftAlt, LeftShift, Enter, Tab, A, S, etc.',
    schema: z.object({ keys: z.array(z.string()).describe('e.g. ["LeftControl","S"]') }),
  });

export const clickAtTool = (userId) =>
  tool(
    async ({ x, y, button }) =>
      sendCommandToCompanion(userId, 'click_at', { x, y, button: button || 'left' }),
    {
      name: 'click_at',
      description: "Clicks at screen coordinates on the user's computer.",
      schema: z.object({
        x: z.number(),
        y: z.number(),
        button: z.enum(['left', 'right']).optional(),
      }),
    }
  );

// ---------- NEW TOOLS ----------

export const runCommandTool = (userId) =>
  tool(
    async ({ command, cwd, timeoutMs }) =>
      sendCommandToCompanion(userId, 'run_command', { command, cwd, timeoutMs }),
    {
      name: 'run_command',
      description: 'Runs an arbitrary shell command on the user computer (only available when companion is in fullControl mode).',
      schema: z.object({
        command: z.string().describe('Shell command to run'),
        cwd: z.string().optional().describe('Optional working directory'),
        timeoutMs: z.number().optional().describe('Timeout in ms (default 30000)'),
      }),
    }
  );

export const listProcessesTool = (userId) =>
  tool(
    async ({ filter }) => sendCommandToCompanion(userId, 'list_processes', { filter }),
    {
      name: 'list_processes',
      description: 'Lists running processes on the user computer. Optionally filter by name.',
      schema: z.object({
        filter: z.string().optional().describe('Optional process name filter'),
      }),
    }
  );

export const killProcessTool = (userId) =>
  tool(
    async ({ name, pid }) => sendCommandToCompanion(userId, 'kill_process', { name, pid }),
    {
      name: 'kill_process',
      description: 'Kills a process by name or PID (only available in fullControl mode).',
      schema: z.object({
        name: z.string().optional().describe('Process name'),
        pid: z.number().optional().describe('Process ID'),
      }),
    }
  );

export const setVolumeTool = (userId) =>
  tool(
    async ({ level }) => sendCommandToCompanion(userId, 'set_volume', { level }),
    {
      name: 'set_volume',
      description: 'Sets system volume (0-100).',
      schema: z.object({ level: z.number().min(0).max(100) }),
    }
  );

export const muteTool = (userId) =>
  tool(async () => sendCommandToCompanion(userId, 'mute', {}), {
    name: 'mute',
    description: 'Mutes system audio.',
    schema: z.object({}),
  });

export const unmuteTool = (userId) =>
  tool(async () => sendCommandToCompanion(userId, 'unmute', {}), {
    name: 'unmute',
    description: 'Unmutes system audio.',
    schema: z.object({}),
  });

export const mediaPlayPauseTool = (userId) =>
  tool(async () => sendCommandToCompanion(userId, 'media_play_pause', {}), {
    name: 'media_play_pause',
    description: 'Toggles play/pause on the current media player.',
    schema: z.object({}),
  });

export const mediaNextTool = (userId) =>
  tool(async () => sendCommandToCompanion(userId, 'media_next', {}), {
    name: 'media_next',
    description: 'Skips to the next media track.',
    schema: z.object({}),
  });

export const mediaPreviousTool = (userId) =>
  tool(async () => sendCommandToCompanion(userId, 'media_previous', {}), {
    name: 'media_previous',
    description: 'Goes to the previous media track.',
    schema: z.object({}),
  });

export const getClipboardTool = (userId) =>
  tool(async () => sendCommandToCompanion(userId, 'get_clipboard', {}), {
    name: 'get_clipboard',
    description: "Reads the current clipboard text from the user's computer.",
    schema: z.object({}),
  });

export const setClipboardTool = (userId) =>
  tool(
    async ({ text }) => sendCommandToCompanion(userId, 'set_clipboard', { text }),
    {
      name: 'set_clipboard',
      description: "Sets the clipboard text on the user's computer.",
      schema: z.object({ text: z.string() }),
    }
  );

export const listDirTool = (userId) =>
  tool(
    async ({ dirPath }) => sendCommandToCompanion(userId, 'list_dir', { dirPath }),
    {
      name: 'list_dir',
      description: 'Lists files and folders in a directory on the user computer.',
      schema: z.object({
        dirPath: z.string().optional().describe('Directory path (default current or home)'),
      }),
    }
  );

export const openFileTool = (userId) =>
  tool(
    async ({ filePath }) => sendCommandToCompanion(userId, 'open_file', { filePath }),
    {
      name: 'open_file',
      description: 'Opens a file with the default application on the user computer.',
      schema: z.object({ filePath: z.string() }),
    }
  );

export const searchFilesTool = (userId) =>
  tool(
    async ({ query, dirPath, max }) =>
      sendCommandToCompanion(userId, 'search_files', { query, dirPath, max }),
    {
      name: 'search_files',
      description: 'Searches for files by name on the user computer.',
      schema: z.object({
        query: z.string().describe('Filename search query'),
        dirPath: z.string().optional(),
        max: z.number().optional(),
      }),
    }
  );

export const focusWindowTool = (userId) =>
  tool(
    async ({ title }) => sendCommandToCompanion(userId, 'focus_window', { title }),
    {
      name: 'focus_window',
      description: 'Brings a window to the front by title (partial match).',
      schema: z.object({ title: z.string() }),
    }
  );

export const minimizeWindowTool = (userId) =>
  tool(
    async ({ title }) => sendCommandToCompanion(userId, 'minimize_window', { title }),
    {
      name: 'minimize_window',
      description: 'Minimizes a window by title.',
      schema: z.object({ title: z.string() }),
    }
  );

export const closeWindowTool = (userId) =>
  tool(
    async ({ title }) => sendCommandToCompanion(userId, 'close_window', { title }),
    {
      name: 'close_window',
      description: 'Closes / quits a window or app by title.',
      schema: z.object({ title: z.string() }),
    }
  );

export const getSystemInfoTool = (userId) =>
  tool(async () => sendCommandToCompanion(userId, 'get_system_info', {}), {
    name: 'get_system_info',
    description: 'Returns basic system info (platform, memory, uptime, battery if available).',
    schema: z.object({}),
  });

export const showNotificationTool = (userId) =>
  tool(
    async ({ title, body }) => sendCommandToCompanion(userId, 'show_notification', { title, body }),
    {
      name: 'show_notification',
      description: 'Shows a desktop notification on the user computer.',
      schema: z.object({
        title: z.string().optional(),
        body: z.string().describe('Notification body text'),
      }),
    }
  );