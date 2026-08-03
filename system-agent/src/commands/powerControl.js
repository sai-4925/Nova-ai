// src/commands/powerControl.js
// -----------------------------------------------------------------------
// Delayed shutdown/restart with a cancel window - the actual safety net
// for voice-triggered power commands (see systemNode.js's design note:
// this replaces a conversational "are you sure?" confirmation with a
// physical, OS-level delay the user can interrupt).
//
// HONEST PLATFORM LIMITATIONS:
//   - Windows: `shutdown /t <seconds>` supports second-level granularity
//     and `shutdown /a` cleanly aborts it - this works well.
//   - macOS: `shutdown` only supports MINUTE granularity (no seconds),
//     and typically requires sudo. If the companion isn't run with
//     passwordless sudo configured, this WILL fail - that's a genuine
//     macOS constraint, not something this code can work around.
//   - Linux: similar - many desktop distros grant logged-in users
//     shutdown rights via polkit/systemd-logind (so it may just work),
//     but on a locked-down or server install it may need sudo too.
// -----------------------------------------------------------------------

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const buildShutdownCommand = (delaySeconds) => {
  const delayMinutes = Math.max(1, Math.round(delaySeconds / 60));
  if (process.platform === 'win32') return `shutdown /s /t ${delaySeconds}`;
  if (process.platform === 'darwin') return `sudo shutdown -h +${delayMinutes}`;
  return `sudo shutdown -h +${delayMinutes}`; // linux
};

const buildRestartCommand = (delaySeconds) => {
  const delayMinutes = Math.max(1, Math.round(delaySeconds / 60));
  if (process.platform === 'win32') return `shutdown /r /t ${delaySeconds}`;
  if (process.platform === 'darwin') return `sudo shutdown -r +${delayMinutes}`;
  return `sudo shutdown -r +${delayMinutes}`; // linux
};

const buildCancelCommand = () => {
  if (process.platform === 'win32') return 'shutdown /a';
  return 'sudo shutdown -c'; // macOS/Linux
};

/**
 * @param {{ delaySeconds: number }} params
 */
export const scheduleShutdown = async ({ delaySeconds }) => {
  try {
    await execAsync(buildShutdownCommand(delaySeconds));
    return `Shutting down in ${delaySeconds} seconds. Say "cancel shutdown" or run the cancel command on this PC to stop it.`;
  } catch (error) {
    throw new Error(`Could not schedule shutdown - this may need admin/sudo privileges: ${error.message}`);
  }
};

/**
 * @param {{ delaySeconds: number }} params
 */
export const scheduleRestart = async ({ delaySeconds }) => {
  try {
    await execAsync(buildRestartCommand(delaySeconds));
    return `Restarting in ${delaySeconds} seconds. Say "cancel shutdown" or run the cancel command on this PC to stop it.`;
  } catch (error) {
    throw new Error(`Could not schedule restart - this may need admin/sudo privileges: ${error.message}`);
  }
};

export const cancelScheduledPowerAction = async () => {
  try {
    await execAsync(buildCancelCommand());
    return 'Scheduled shutdown/restart cancelled.';
  } catch (error) {
    throw new Error(`Could not cancel - there may not have been anything scheduled: ${error.message}`);
  }
};
