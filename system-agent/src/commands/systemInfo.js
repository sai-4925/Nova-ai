import os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';
const execAsync = promisify(exec);

export const getSystemInfo = async () => {
  const info = {
    platform: process.platform,
    arch: os.arch(),
    hostname: os.hostname(),
    uptimeMinutes: Math.round(os.uptime() / 60),
    totalMemGB: (os.totalmem() / 1024 / 1024 / 1024).toFixed(1),
    freeMemGB: (os.freemem() / 1024 / 1024 / 1024).toFixed(1),
    cpus: os.cpus().length,
  };

  try {
    if (process.platform === 'darwin') {
      const { stdout } = await execAsync('pmset -g batt');
      info.battery = stdout.trim();
    } else if (process.platform === 'linux') {
      const { stdout } = await execAsync('cat /sys/class/power_supply/BAT0/capacity 2>/dev/null || echo N/A');
      info.battery = stdout.trim() + '%';
    }
  } catch {}

  return JSON.stringify(info, null, 2);
};