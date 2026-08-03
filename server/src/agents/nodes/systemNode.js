// agents/nodes/systemNode.js
// -----------------------------------------------------------------------
// FULLY IMPLEMENTED. Mirrors the other action-dispatch nodes' shape.
//
// SAFETY NOTE: shutdown/restart deliberately do NOT ask for a separate
// conversational confirmation turn ("are you sure?") - building reliable
// multi-turn confirmation state into a stateless graph node adds real
// complexity for a thinner safety net than the alternative: the
// companion app schedules the action with a 60-second OS-level delay
// AND a cancel command (see systemTool.js), so a misheard voice command
// still gives the user a physical window to stop it - closer to the
// actual risk (accidental trigger) than a chat confirmation would be.
// -----------------------------------------------------------------------

import { openAppTool, takeScreenshotTool, shutdownTool, restartTool, cancelPowerActionTool } from '../../tools/systemTool.js';
import { logger } from '../../utils/logger.js';

export const systemNode = async (state) => {
  const { action, appName } = state.routeParams || {};

  try {
    let output;

    if (action === 'open_app') {
      if (!appName) {
        output = 'Which application or folder would you like me to open?';
      } else {
        output = await openAppTool(state.userId).invoke({ appName });
      }
    } else if (action === 'take_screenshot') {
      output = await takeScreenshotTool(state.userId).invoke({});
    } else if (action === 'shutdown') {
      output = await shutdownTool(state.userId).invoke({});
    } else if (action === 'restart') {
      output = await restartTool(state.userId).invoke({});
    } else if (action === 'cancel_power_action') {
      output = await cancelPowerActionTool(state.userId).invoke({});
    } else {
      output = 'I can open an app, take a screenshot, or shut down/restart your computer - which would you like to do?';
    }

    return { toolResults: [{ tool: 'system', input: state.routeParams, output }], needsAnotherTool: false };
  } catch (error) {
    logger.error(`System Node failed: ${error.message}`);
    return {
      toolResults: [
        { tool: 'system', input: state.routeParams, output: error.message || 'I had trouble with that system request.' },
      ],
      needsAnotherTool: false,
    };
  }
};
