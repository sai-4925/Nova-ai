import { exec } from 'child_process';
import { promisify } from 'util';
import { execFile } from 'child_process';
const execAsync = promisify(exec);
const execFileAsync = promisify(execFile);

export const listProcesses = async ({ filter = '' } = {}) => {
  let cmd;
  if (process.platform === 'win32') {
    cmd = 'tasklist /FO CSV /NH';
  } else {
    cmd = 'ps -eo pid,comm,args --no-headers';
  }

  const { stdout } = await execAsync(cmd);
  let lines = stdout.trim().split('\n');

  if (filter) {
    const lower = filter.toLowerCase();
    lines = lines.filter(l => l.toLowerCase().includes(lower));
  }

  return lines.slice(0, 40).join('\n') || 'No matching processes.';
};

export const killProcess = async ({ name, pid }) => {
  if (!name && !pid) throw new Error('Provide either name or pid');
  if (pid !== undefined && (!Number.isInteger(pid) || pid <= 0)) {
    throw new Error('pid must be a positive integer');
  }
  if (name !== undefined && (typeof name !== 'string' || !name.trim())) {
    throw new Error('name must be a non-empty string');
  }

  try {
    if (process.platform === 'win32') {
      if (pid) await execFileAsync('taskkill', ['/PID', String(pid), '/F']);
      else await execFileAsync('taskkill', ['/IM', name.trim(), '/F']);
    } else {
      if (pid) await execFileAsync('kill', ['-9', String(pid)]);
      else await execFileAsync('pkill', ['-f', name.trim()]);
    }
    return `Process ${name || pid} terminated.`;
  } catch (error) {
    throw new Error(`Could not kill process: ${error.message}`);
  }
};