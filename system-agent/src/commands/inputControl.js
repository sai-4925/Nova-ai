import { mouse, keyboard, Key, Button, straightTo, Point } from '@nut-tree-fork/nut-js';

// Optional: slightly slower = more reliable
mouse.config.autoDelayMs = 50;
keyboard.config.autoDelayMs = 30;

/**
 * Type text wherever the cursor is focused.
 */
export const typeText = async ({ text }) => {
  if (!text) throw new Error('text is required');
  await keyboard.type(text);
  return `Typed: ${text}`;
};

/**
 * Press a hotkey combo, e.g. keys: ["LeftControl", "S"]
 */
export const pressHotkey = async ({ keys }) => {
  if (!Array.isArray(keys) || keys.length === 0) {
    throw new Error('keys array is required, e.g. ["LeftControl","S"]');
  }

  const mapped = keys.map((k) => {
    if (Key[k] !== undefined) return Key[k];
    throw new Error(`Unknown key: ${k}. Use nut.js Key names like LeftControl, Enter, A`);
  });

  await keyboard.pressKey(...mapped);
  await keyboard.releaseKey(...mapped);
  return `Pressed hotkey: ${keys.join('+')}`;
};

/**
 * Click at screen coordinates.
 */
export const clickAt = async ({ x, y, button = 'left' }) => {
  if (typeof x !== 'number' || typeof y !== 'number') {
    throw new Error('x and y numbers are required');
  }
  await mouse.move(straightTo(new Point(x, y)));
  if (button === 'right') await mouse.click(Button.RIGHT);
  else await mouse.click(Button.LEFT);
  return `Clicked ${button} at (${x}, ${y})`;
};