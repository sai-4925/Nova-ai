// tools/systemTool.js
// -----------------------------------------------------------------------
// Factory-bound to userId - same trusted pattern as reminderTool.js/
// calendarTool.js. Every action here targets a SPECIFIC user's own
// machine (via their companion's WebSocket connection), so userId must
// come from trusted state, never an LLM-fillable field.
// -----------------------------------------------------------------------

import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { sendCommandToCompanion } from '../services/systemAgentService.js';

/** @param {string} userId */
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
        appName: z
          .string()
          .describe('Name of the app or folder, e.g. "chrome", "vscode", "downloads"'),
        url: z
          .string()
          .optional()
          .describe('Optional URL to open (mainly useful with Chrome)'),
        profile: z
          .string()
          .optional()
          .describe('Chrome profile directory name, e.g. "Default", "Profile 1"'),
        search: z
          .string()
          .optional()
          .describe('Optional Google search query to open in Chrome'),
      }),
    }
  );
/** @param {string} userId */
export const takeScreenshotTool = (userId) =>
  tool(async () => sendCommandToCompanion(userId, 'take_screenshot', {}), {
    name: 'take_screenshot',
    description: "Takes a screenshot of the user's own computer screen.",
    schema: z.object({}),
  });

/** @param {string} userId */
export const shutdownTool = (userId) =>
  tool(async () => sendCommandToCompanion(userId, 'shutdown', { delaySeconds: 60 }), {
    name: 'shutdown_computer',
    description:
      "Schedules the user's own computer to shut down after a short delay (60 seconds), giving them a window to cancel.",
    schema: z.object({}),
  });

/** @param {string} userId */
export const restartTool = (userId) =>
  tool(async () => sendCommandToCompanion(userId, 'restart', { delaySeconds: 60 }), {
    name: 'restart_computer',
    description:
      "Schedules the user's own computer to restart after a short delay (60 seconds), giving them a window to cancel.",
    schema: z.object({}),
  });

/** @param {string} userId */
export const cancelPowerActionTool = (userId) =>
  tool(async () => sendCommandToCompanion(userId, 'cancel_power_action', {}), {
    name: 'cancel_power_action',
    description: "Cancels a previously scheduled shutdown or restart on the user's own computer.",
    schema: z.object({}),
  });
/** @param {string} userId */
export const createDirectoryTool = (userId) =>
  tool(async ({ path }) => sendCommandToCompanion(userId, 'create_directory', { path }), {
    name: 'create_directory',
    description: "Creates a directory (folder) on the user's own computer. Parent folders are created automatically.",
    schema: z.object({
      path: z.string().describe('Full path or path relative to home, e.g. "Desktop/MyFolder" or "C:\\\\Users\\\\You\\\\Desktop\\\\MyFolder"'),
    }),
  });

/** @param {string} userId */
export const createFileTool = (userId) =>
  tool(async ({ path, content }) => sendCommandToCompanion(userId, 'create_file', { path, content }), {
    name: 'create_file',
    description: "Creates a text file on the user's own computer. Parent folders are created automatically.",
    schema: z.object({
      path: z.string().describe('Full path or path relative to home, e.g. "Desktop/notes.txt"'),
      content: z.string().optional().describe('Optional text content to write into the file'),
    }),
  });
export const typeTextTool = (userId) =>
  tool(async ({ text }) => sendCommandToCompanion(userId, 'type_text', { text }), {
    name: 'type_text',
    description: "Types text on the user's computer at the current cursor focus.",
    schema: z.object({
      text: z.string().describe('Text to type'),
    }),
  });

export const pressHotkeyTool = (userId) =>
  tool(
    async ({ keys }) => sendCommandToCompanion(userId, 'press_hotkey', { keys }),
    {
      name: 'press_hotkey',
      description:
        'Presses a keyboard shortcut on the user computer. Use nut.js key names: LeftControl, LeftAlt, LeftShift, Enter, Tab, A, S, etc.',
      schema: z.object({
        keys: z.array(z.string()).describe('e.g. ["LeftControl","S"]'),
      }),
    }
  );

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