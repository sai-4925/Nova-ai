import { exec } from 'child_process';
import { promisify } from 'util';
const execAsync = promisify(exec);

export const focusWindow = async ({ title }) => {
  if (!title) throw new Error('title is required');
  if (process.platform === 'darwin') {
    await execAsync(`osascript -e 'tell application "System Events" to set frontmost of first process whose name contains "${title}" to true'`);
  } else if (process.platform === 'win32') {
    await execAsync(`powershell -command "(New-Object -ComObject WScript.Shell).AppActivate('${title}')"`);
  } else {
    await execAsync(`wmctrl -a "${title}"`);
  }
  return `Focused window containing "${title}"`;
};

export const minimizeWindow = async ({ title }) => {
  // Best-effort
  if (process.platform === 'darwin') {
    await execAsync(`osascript -e 'tell application "System Events" to set visible of first process whose name contains "${title}" to false'`);
  } else if (process.platform === 'linux') {
    await execAsync(`wmctrl -r "${title}" -b add,hidden`);
  }
  return `Tried to minimize "${title}"`;
};

export const closeWindow = async ({ title }) => {
  if (process.platform === 'darwin') {
    await execAsync(`osascript -e 'tell application "${title}" to quit'`);
  } else if (process.platform === 'win32') {
    await execAsync(`taskkill /IM "${title}.exe" /F`).catch(() => {});
  } else {
    await execAsync(`wmctrl -c "${title}"`);
  }
  return `Closed / quit "${title}"`;
};