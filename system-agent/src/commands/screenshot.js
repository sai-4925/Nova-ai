// src/commands/screenshot.js
// -----------------------------------------------------------------------
// Cross-platform screenshot capture:
//   - macOS: `screencapture` is built-in, no extra install needed
//   - Windows: no built-in CLI tool, so a small inline PowerShell script
//     uses System.Drawing to capture the screen (PowerShell itself IS
//     built into every modern Windows install)
//   - Linux: there's genuinely no universal built-in - this tries a few
//     common tools in order (gnome-screenshot, scrot, import from
//     ImageMagick) and gives an honest error naming what to install if
//     none are found, rather than pretending it always works
// -----------------------------------------------------------------------

import { exec } from 'child_process';
import { promisify } from 'util';
import { existsSync, mkdirSync } from 'fs';
import { homedir } from 'os';
import path from 'path';

const execAsync = promisify(exec);

const getOutputPath = () => {
  const dir = path.join(homedir(), 'NovaScreenshots');
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  return path.join(dir, `screenshot-${Date.now()}.png`);
};

const captureOnMac = async (outputPath) => {
  await execAsync(`screencapture -x "${outputPath}"`);
};

const captureOnWindows = async (outputPath) => {
  // Inline PowerShell using .NET's System.Drawing - no extra install
  // required since PowerShell ships with Windows itself.
  const script = `
    Add-Type -AssemblyName System.Windows.Forms,System.Drawing
    $bounds = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds
    $bitmap = New-Object System.Drawing.Bitmap $bounds.Width, $bounds.Height
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.CopyFromScreen($bounds.Location, [System.Drawing.Point]::Empty, $bounds.Size)
    $bitmap.Save('${outputPath.replace(/\\/g, '\\\\')}')
  `.trim();
  await execAsync(`powershell -NoProfile -Command "${script.replace(/"/g, '\\"')}"`);
};

const LINUX_TOOLS = [
  (out) => `gnome-screenshot -f "${out}"`,
  (out) => `scrot "${out}"`,
  (out) => `import -window root "${out}"`, // ImageMagick
];

const captureOnLinux = async (outputPath) => {
  let lastError;
  for (const buildCommand of LINUX_TOOLS) {
    try {
      await execAsync(buildCommand(outputPath));
      return;
    } catch (error) {
      lastError = error;
    }
  }
  throw new Error(
    `No screenshot tool found - install one of: gnome-screenshot, scrot, or imagemagick (${lastError?.message})`
  );
};

/**
 * @returns {Promise<string>} a human-readable result including the saved path
 */
export const takeScreenshot = async () => {
  const outputPath = getOutputPath();

  try {
    if (process.platform === 'darwin') await captureOnMac(outputPath);
    else if (process.platform === 'win32') await captureOnWindows(outputPath);
    else await captureOnLinux(outputPath);

    return `Screenshot saved to ${outputPath}.`;
  } catch (error) {
    throw new Error(`Could not take a screenshot: ${error.message}`);
  }
};
