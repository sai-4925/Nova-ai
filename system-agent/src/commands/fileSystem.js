import { readdir } from 'fs/promises';
import path from 'path';
import { homedir } from 'os';
import { spawn } from 'child_process';

export const listDir = async ({ dirPath = '.' } = {}) => {
  if (typeof dirPath !== 'string') throw new Error('dirPath must be a string');
  const resolved = path.resolve(dirPath.replace(/^~/, homedir()));
  const entries = await readdir(resolved, { withFileTypes: true });
  const result = [];
  for (const e of entries.slice(0, 50)) {
    result.push(`${e.isDirectory() ? '[DIR]' : '[FILE]'} ${e.name}`);
  }
  return result.join('\n') || 'Empty directory';
};

export const openFile = async ({ filePath }) => {
  if (typeof filePath !== 'string' || !filePath.trim()) throw new Error('filePath is required');
  const resolved = path.resolve(filePath.replace(/^~/, homedir()));
  const command = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'explorer.exe' : 'xdg-open';
  const child = spawn(command, [resolved], { detached: true, stdio: 'ignore', windowsHide: true });
  child.unref();
  return `Opened ${resolved}`;
};

export const searchFiles = async ({ query, dirPath = homedir(), max = 20 }) => {
  if (typeof query !== 'string' || !query.trim()) throw new Error('query is required');
  if (typeof dirPath !== 'string') throw new Error('dirPath must be a string');
  const result = [];
  const maximum = Math.max(1, Math.min(100, Number(max) || 20));
  const search = async (currentPath) => {
    if (result.length >= maximum) return;
    let entries;
    try {
      entries = await readdir(currentPath, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const entryPath = path.join(currentPath, entry.name);
      if (entry.name.toLowerCase().includes(query.toLowerCase())) result.push(entryPath);
      if (entry.isDirectory()) await search(entryPath);
      if (result.length >= maximum) return;
    }
  };
  await search(path.resolve(dirPath.replace(/^~/, homedir())));
  return result.join('\n') || 'No files found';
};