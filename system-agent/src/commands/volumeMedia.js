import { exec } from 'child_process';
import { promisify } from 'util';
const execAsync = promisify(exec);

/** Windows: try nircmd, then PowerShell key simulation where possible */
const winSetVolume = async (vol) => {
  try {
    await execAsync(`nircmd setsysvolume ${Math.round(vol * 655.35)}`);
    return;
  } catch {
    // PowerShell fallback via Windows Core Audio (no nircmd)
    const script = `
      $vol = ${vol} / 100;
      Add-Type -TypeDefinition @'
using System.Runtime.InteropServices;
[Guid("5CDF2C82-841E-4546-9722-0CF74078229A"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
interface IAudioEndpointVolume {
  int NotImpl1(); int NotImpl2();
  int GetChannelCount(out int pcChannels);
  int SetMasterVolumeLevel(float fLevelDB, System.Guid pguidEventContext);
  int SetMasterVolumeLevelScalar(float fLevel, System.Guid pguidEventContext);
  int GetMasterVolumeLevel(out float pfLevelDB);
  int GetMasterVolumeLevelScalar(out float pfLevel);
}
[Guid("D666063F-1587-4E43-81F1-B948E807363F"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
interface IMMDevice {
  int Activate(ref System.Guid iid, int dwClsCtx, IntPtr pActivationParams, out IAudioEndpointVolume ppInterface);
}
[Guid("A95664D2-9614-4F35-A746-DE8DB63617E6"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
interface IMMDeviceEnumerator {
  int NotImpl1();
  int GetDefaultAudioEndpoint(int dataFlow, int role, out IMMDevice ppDevice);
}
[ComImport, Guid("BCDE0395-E52F-467C-8E3D-C4579291692E")] class MMDeviceEnumeratorComObject { }
public class Audio {
  public static void SetVolume(float level) {
    var enumerator = (IMMDeviceEnumerator)(new MMDeviceEnumeratorComObject());
    IMMDevice device;
    enumerator.GetDefaultAudioEndpoint(0, 0, out device);
    IAudioEndpointVolume ep;
    var iid = typeof(IAudioEndpointVolume).GUID;
    device.Activate(ref iid, 0, IntPtr.Zero, out ep);
    ep.SetMasterVolumeLevelScalar(level, System.Guid.Empty);
  }
}
'@ -ErrorAction SilentlyContinue
      try { [Audio]::SetVolume([float]$vol) } catch { throw "Volume control failed. Install nircmd[](https://www.nirsoft.net/utils/nircmd.html) for reliable Windows volume." }
    `;
    await execAsync(`powershell -NoProfile -Command ${JSON.stringify(script)}`, {
      timeout: 15000,
      maxBuffer: 1024 * 1024,
    });
  }
};

const winMediaKey = async (vk) => {
  // vk: 0xB3 play/pause, 0xB0 next, 0xB1 prev
  try {
    await execAsync(`nircmd sendkeypress ${vk}`);
  } catch {
    const code = parseInt(vk, 16);
    const script = `
      Add-Type -TypeDefinition 'using System; using System.Runtime.InteropServices; public class K { [DllImport("user32.dll")] public static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, UIntPtr dwExtraInfo); }';
      [K]::keybd_event(${code}, 0, 0, [UIntPtr]::Zero);
      [K]::keybd_event(${code}, 0, 2, [UIntPtr]::Zero);
    `;
    await execAsync(`powershell -NoProfile -Command ${JSON.stringify(script)}`);
  }
};

export const setVolume = async ({ level }) => {
  const vol = Math.max(0, Math.min(100, Number(level)));
  if (isNaN(vol)) throw new Error('level must be a number 0-100');

  if (process.platform === 'win32') {
    await winSetVolume(vol);
  } else if (process.platform === 'darwin') {
    await execAsync(`osascript -e "set volume output volume ${vol}"`);
  } else {
    await execAsync(`pactl set-sink-volume @DEFAULT_SINK@ ${vol}%`);
  }
  return `Volume set to ${vol}%`;
};

export const mute = async () => {
  if (process.platform === 'win32') {
    try {
      await execAsync('nircmd mutesysvolume 1');
    } catch {
      await execAsync(
        `powershell -NoProfile -Command "(New-Object -ComObject WScript.Shell).SendKeys([char]173)"`
      ).catch(() => {
        throw new Error('Mute failed. Install nircmd for reliable mute on Windows.');
      });
    }
  } else if (process.platform === 'darwin') {
    await execAsync('osascript -e "set volume output muted true"');
  } else {
    await execAsync('pactl set-sink-mute @DEFAULT_SINK@ 1');
  }
  return 'Muted';
};

export const unmute = async () => {
  if (process.platform === 'win32') {
    try {
      await execAsync('nircmd mutesysvolume 0');
    } catch {
      await execAsync(
        `powershell -NoProfile -Command "(New-Object -ComObject WScript.Shell).SendKeys([char]173)"`
      ).catch(() => {
        throw new Error('Unmute failed. Install nircmd for reliable unmute on Windows.');
      });
    }
  } else if (process.platform === 'darwin') {
    await execAsync('osascript -e "set volume output muted false"');
  } else {
    await execAsync('pactl set-sink-mute @DEFAULT_SINK@ 0');
  }
  return 'Unmuted';
};

export const mediaPlayPause = async () => {
  if (process.platform === 'darwin') {
    await execAsync('osascript -e "tell application \\"System Events\\" to key code 16"');
  } else if (process.platform === 'win32') {
    await winMediaKey('0xB3');
  } else {
    await execAsync('playerctl play-pause');
  }
  return 'Play/Pause toggled';
};

export const mediaNext = async () => {
  if (process.platform === 'darwin') {
    await execAsync('osascript -e "tell application \\"System Events\\" to key code 19"');
  } else if (process.platform === 'win32') {
    await winMediaKey('0xB0');
  } else {
    await execAsync('playerctl next');
  }
  return 'Next track';
};

export const mediaPrevious = async () => {
  if (process.platform === 'darwin') {
    await execAsync('osascript -e "tell application \\"System Events\\" to key code 18"');
  } else if (process.platform === 'win32') {
    await winMediaKey('0xB1');
  } else {
    await execAsync('playerctl previous');
  }
  return 'Previous track';
};