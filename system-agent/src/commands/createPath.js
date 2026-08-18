// src/commands/createPath.js
import { mkdir, writeFile } from 'fs/promises';
import { homedir } from 'os';
import path from 'path';

/**
 * Resolve a user-given path.
 * - Absolute paths are kept as-is
 * - Relative paths are resolved against the user's home directory
 */
const resolvePath = (rawPath) => {
  if (!rawPath || typeof rawPath !== 'string') {
    throw new Error('Path is required');
  }
  const trimmed = rawPath.trim();
  if (path.isAbsolute(trimmed)) return trimmed;
  return path.join(homedir(), trimmed);
};

/**
 * Create a directory (and any missing parents).
 * @param {{ path: string }} params
 */
export const createDirectory = async ({ path: rawPath }) => {
  const fullPath = resolvePath(rawPath);
  await mkdir(fullPath, { recursive: true });
  return `Created directory: ${fullPath}`;
};

/**
 * Create a file with optional content.
 * Parent directories are created automatically if they don't exist.
 * @param {{ path: string, content?: string }} params
 */
export const createFile = async ({ path: rawPath, content = '' }) => {
  const fullPath = resolvePath(rawPath);
  await mkdir(path.dirname(fullPath), { recursive: true });
  await writeFile(fullPath, content, 'utf8');
  return `Created file: ${fullPath}`;
};