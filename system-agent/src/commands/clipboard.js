import { exec } from 'child_process';
import { promisify } from 'util';
import { spawn } from 'child_process';
const execAsync = promisify(exec);

const runProcess = (command, args, input) =>
  new Promise((resolve, reject) => {
    const child = spawn(command, args, { windowsHide: true });
    let stderr = '';
    child.stderr.on('data', (chunk) => {
      stderr += chunk;
    });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(stderr.trim() || `${command} exited with code ${code}`));
    });
    if (input !== undefined) child.stdin.end(input);
  });

export const getClipboard = async () => {
  if (process.platform === 'darwin') {
    const { stdout } = await execAsync('pbpaste');
    return stdout || '(empty)';
  }
  if (process.platform === 'win32') {
    const { stdout } = await execAsync('powershell -command "Get-Clipboard"');
    return stdout.trim() || '(empty)';
  }
  // Linux
  const { stdout } = await execAsync('xclip -selection clipboard -o || xsel --clipboard --output');
  return stdout || '(empty)';
};

export const setClipboard = async ({ text }) => {
  if (typeof text !== 'string') throw new Error('text is required');
  if (process.platform === 'darwin') {
    await execAsync(`echo ${JSON.stringify(text)} | pbcopy`);
  } else if (process.platform === 'win32') {
    await runProcess('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', 'Set-Clipboard -Value ([Console]::In.ReadToEnd())'], text);
  } else {
    await runProcess('xclip', ['-selection', 'clipboard'], text);
  }
  return 'Clipboard updated';
};