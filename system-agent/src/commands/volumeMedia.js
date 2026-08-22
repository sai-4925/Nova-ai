import { exec } from 'child_process';
import { promisify } from 'util';
const execAsync = promisify(exec);

export const setVolume = async ({ level }) => {
  const vol = Math.max(0, Math.min(100, Number(level)));
  if (isNaN(vol)) throw new Error('level must be a number 0-100');

  if (process.platform === 'win32') {
    // Uses nircmd if available, otherwise PowerShell
    try {
      await execAsync(`nircmd setsysvolume ${Math.round(vol * 655.35)}`);
    } catch {
      // Fallback – limited
      throw new Error('Install nircmd for reliable volume control on Windows, or use mute/unmute.');
    }
  } else if (process.platform === 'darwin') {
    await execAsync(`osascript -e "set volume output volume ${vol}"`);
  } else {
    await execAsync(`pactl set-sink-volume @DEFAULT_SINK@ ${vol}%`);
  }
  return `Volume set to ${vol}%`;
};

export const mute = async () => {
  if (process.platform === 'win32') await execAsync('nircmd mutesysvolume 1').catch(() => {});
  else if (process.platform === 'darwin') await execAsync('osascript -e "set volume output muted true"');
  else await execAsync('pactl set-sink-mute @DEFAULT_SINK@ 1');
  return 'Muted';
};

export const unmute = async () => {
  if (process.platform === 'win32') await execAsync('nircmd mutesysvolume 0').catch(() => {});
  else if (process.platform === 'darwin') await execAsync('osascript -e "set volume output muted false"');
  else await execAsync('pactl set-sink-mute @DEFAULT_SINK@ 0');
  return 'Unmuted';
};

export const mediaPlayPause = async () => {
  if (process.platform === 'darwin') await execAsync('osascript -e "tell application \\"System Events\\" to key code 16"'); // play
  else if (process.platform === 'win32') await execAsync('nircmd sendkeypress 0xB3').catch(() => {});
  else await execAsync('playerctl play-pause');
  return 'Play/Pause toggled';
};

export const mediaNext = async () => {
  if (process.platform === 'darwin') await execAsync('osascript -e "tell application \\"System Events\\" to key code 19"');
  else if (process.platform === 'win32') await execAsync('nircmd sendkeypress 0xB0').catch(() => {});
  else await execAsync('playerctl next');
  return 'Next track';
};

export const mediaPrevious = async () => {
  if (process.platform === 'darwin') await execAsync('osascript -e "tell application \\"System Events\\" to key code 18"');
  else if (process.platform === 'win32') await execAsync('nircmd sendkeypress 0xB1').catch(() => {});
  else await execAsync('playerctl previous');
  return 'Previous track';
};