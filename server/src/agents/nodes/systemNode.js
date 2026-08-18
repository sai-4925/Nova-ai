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

import {
  openAppTool,
  takeScreenshotTool,
  shutdownTool,
  restartTool,
  cancelPowerActionTool,
  createDirectoryTool,
  createFileTool,
  typeTextTool,
  pressHotkeyTool,
  clickAtTool,
} from '../../tools/systemTool.js';
import { logger } from '../../utils/logger.js';

export const systemNode = async (state) => {
  const { action, appName } = state.routeParams || {};

  try {
    let output;

    if (action === 'open_app') {
      if (!appName) {
        output = 'Which application or folder would you like me to open?';
      } else {
        output = await openAppTool(state.userId).invoke({
          appName,
          url: state.routeParams?.url,
          profile: state.routeParams?.profile,
          search: state.routeParams?.search,
        });
      }
    } else if (action === 'take_screenshot') {
      output = await takeScreenshotTool(state.userId).invoke({});
    } else if (action === 'shutdown') {
      output = await shutdownTool(state.userId).invoke({});
    } else if (action === 'restart') {
      output = await restartTool(state.userId).invoke({});
    } else if (action === 'cancel_power_action') {
      output = await cancelPowerActionTool(state.userId).invoke({});
    } else if (action === 'create_directory') {
      if (!state.routeParams?.path) {
        output = 'Which folder should I create? Please give me a path.';
      } else {
        output = await createDirectoryTool(state.userId).invoke({ path: state.routeParams.path });
      }
    } 
    else if (action === 'type_text') {
  if (!state.routeParams?.text) output = 'What should I type?';
  else output = await typeTextTool(state.userId).invoke({ text: state.routeParams.text });
}
else if (action === 'press_hotkey') {
  if (!state.routeParams?.keys) output = 'Which keys should I press?';
  else output = await pressHotkeyTool(state.userId).invoke({ keys: state.routeParams.keys });
}
else if (action === 'click_at') {
  const { x, y, button } = state.routeParams || {};
  if (typeof x !== 'number' || typeof y !== 'number') output = 'Where should I click? Give x and y.';
  else output = await clickAtTool(state.userId).invoke({ x, y, button });
}
    else if (action === 'create_file') {
      if (!state.routeParams?.path) {
        output = 'Which file should I create? Please give me a path.';
      } else {
        output = await createFileTool(state.userId).invoke({
          path: state.routeParams.path,
          content: state.routeParams.content || '',
        });
      }
    } else {
      output = 'I can open an app, take a screenshot, create folders/files, or shut down/restart your computer - which would you like to do?';
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