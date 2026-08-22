// agents/nodes/systemNode.js
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
  // NEW
  runCommandTool,
  listProcessesTool,
  killProcessTool,
  setVolumeTool,
  muteTool,
  unmuteTool,
  mediaPlayPauseTool,
  mediaNextTool,
  mediaPreviousTool,
  getClipboardTool,
  setClipboardTool,
  listDirTool,
  openFileTool,
  searchFilesTool,
  focusWindowTool,
  minimizeWindowTool,
  closeWindowTool,
  getSystemInfoTool,
  showNotificationTool,
} from '../../tools/systemTool.js';
import { logger } from '../../utils/logger.js';

export const systemNode = async (state) => {
  const params = state.routeParams || {};
  const { action, appName } = params;

  try {
    let output;

    switch (action) {
      case 'open_app':
        if (!appName) output = 'Which application or folder would you like me to open?';
        else {
          output = await openAppTool(state.userId).invoke({
            appName,
            url: params.url,
            profile: params.profile,
            search: params.search,
          });
        }
        break;

      case 'take_screenshot':
        output = await takeScreenshotTool(state.userId).invoke({});
        break;

      case 'shutdown':
        output = await shutdownTool(state.userId).invoke({});
        break;

      case 'restart':
        output = await restartTool(state.userId).invoke({});
        break;

      case 'cancel_power_action':
        output = await cancelPowerActionTool(state.userId).invoke({});
        break;

      case 'create_directory':
        if (!params.path) output = 'Which folder should I create? Please give me a path.';
        else output = await createDirectoryTool(state.userId).invoke({ path: params.path });
        break;

      case 'create_file':
        if (!params.path) output = 'Which file should I create? Please give me a path.';
        else {
          output = await createFileTool(state.userId).invoke({
            path: params.path,
            content: params.content || '',
          });
        }
        break;

      case 'type_text':
        if (!params.text) output = 'What should I type?';
        else output = await typeTextTool(state.userId).invoke({ text: params.text });
        break;

      case 'press_hotkey':
        if (!params.keys) output = 'Which keys should I press?';
        else output = await pressHotkeyTool(state.userId).invoke({ keys: params.keys });
        break;

      case 'click_at': {
        const { x, y, button } = params;
        if (typeof x !== 'number' || typeof y !== 'number') {
          output = 'Where should I click? Give x and y.';
        } else {
          output = await clickAtTool(state.userId).invoke({ x, y, button });
        }
        break;
      }

      // ---------- NEW ACTIONS ----------
      case 'run_command':
        if (!params.command) output = 'What command should I run?';
        else {
          output = await runCommandTool(state.userId).invoke({
            command: params.command,
            cwd: params.cwd,
            timeoutMs: params.timeoutMs,
          });
        }
        break;

      case 'list_processes':
        output = await listProcessesTool(state.userId).invoke({ filter: params.filter });
        break;

      case 'kill_process':
        if (!params.name && !params.pid) output = 'Provide a process name or PID to kill.';
        else output = await killProcessTool(state.userId).invoke({ name: params.name, pid: params.pid });
        break;

      case 'set_volume':
        if (typeof params.level !== 'number') output = 'What volume level (0-100)?';
        else output = await setVolumeTool(state.userId).invoke({ level: params.level });
        break;

      case 'mute':
        output = await muteTool(state.userId).invoke({});
        break;

      case 'unmute':
        output = await unmuteTool(state.userId).invoke({});
        break;

      case 'media_play_pause':
        output = await mediaPlayPauseTool(state.userId).invoke({});
        break;

      case 'media_next':
        output = await mediaNextTool(state.userId).invoke({});
        break;

      case 'media_previous':
        output = await mediaPreviousTool(state.userId).invoke({});
        break;

      case 'get_clipboard':
        output = await getClipboardTool(state.userId).invoke({});
        break;

      case 'set_clipboard':
        if (!params.text) output = 'What text should I put on the clipboard?';
        else output = await setClipboardTool(state.userId).invoke({ text: params.text });
        break;

      case 'list_dir':
        output = await listDirTool(state.userId).invoke({ dirPath: params.dirPath || params.path });
        break;

      case 'open_file':
        if (!params.filePath && !params.path) output = 'Which file should I open?';
        else output = await openFileTool(state.userId).invoke({ filePath: params.filePath || params.path });
        break;

      case 'search_files':
        if (!params.query) output = 'What file name should I search for?';
        else {
          output = await searchFilesTool(state.userId).invoke({
            query: params.query,
            dirPath: params.dirPath,
            max: params.max,
          });
        }
        break;

      case 'focus_window':
        if (!params.title) output = 'Which window title should I focus?';
        else output = await focusWindowTool(state.userId).invoke({ title: params.title });
        break;

      case 'minimize_window':
        if (!params.title) output = 'Which window title should I minimize?';
        else output = await minimizeWindowTool(state.userId).invoke({ title: params.title });
        break;

      case 'close_window':
        if (!params.title) output = 'Which window title should I close?';
        else output = await closeWindowTool(state.userId).invoke({ title: params.title });
        break;

      case 'get_system_info':
        output = await getSystemInfoTool(state.userId).invoke({});
        break;

      case 'show_notification':
        if (!params.body) output = 'What should the notification say?';
        else {
          output = await showNotificationTool(state.userId).invoke({
            title: params.title,
            body: params.body,
          });
        }
        break;

      default:
        output =
          'I can open apps, take screenshots, control volume/media, manage files, windows, clipboard, processes, run commands (if fullControl is on), show notifications, or shut down/restart. What would you like?';
    }

    return {
      toolResults: [{ tool: 'system', input: params, output }],
      needsAnotherTool: false,
    };
  } catch (error) {
    logger.error(`System Node failed: ${error.message}`);
    return {
      toolResults: [
        {
          tool: 'system',
          input: params,
          output: error.message || 'I had trouble with that system request.',
        },
      ],
      needsAnotherTool: false,
    };
  }
};