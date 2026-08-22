import { exec } from 'child_process';
import { promisify } from 'util';
const execAsync = promisify(exec);

export const runCommand = async ({ command, cwd, timeoutMs = 30000 }) => {
  if (!command || typeof command !== 'string') {
    throw new Error('command is required');
  }

  // Very basic protection – still only available in fullControl mode
  const dangerous = /rm\s+-rf\s+\/|format\s+|mkfs|dd\s+if=/i;
  if (dangerous.test(command)) {
    throw new Error('This command looks extremely dangerous and was blocked.');
  }

  try {
    const { stdout, stderr } = await execAsync(command, {
      cwd: cwd || undefined,
      timeout: timeoutMs,
      maxBuffer: 2 * 1024 * 1024,
    });
    return (stdout || stderr || 'Command executed with no output').trim();
  } catch (error) {
    throw new Error(`Command failed: ${error.message}`);
  }
};