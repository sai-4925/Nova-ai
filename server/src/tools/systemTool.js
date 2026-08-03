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
export const openAppTool = (userId) =>
  tool(async ({ appName }) => sendCommandToCompanion(userId, 'open_app', { appName }), {
    name: 'open_application',
    description: "Opens an application (e.g. Chrome, VS Code) or folder on the user's own computer.",
    schema: z.object({
      appName: z.string().describe('Name of the app or folder to open, e.g. "chrome", "vscode", "downloads folder"'),
    }),
  });

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
