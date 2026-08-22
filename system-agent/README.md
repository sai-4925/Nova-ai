# NOVA System Agent Companion

This is a **separate, standalone app** you run on your own computer - never on your cloud NOVA backend (Render, etc.). It connects outward to the backend and lets Nova act on that computer.

## Why this exists (read this before setting it up)

Your NOVA backend runs in the cloud. A cloud server has no way to reach into your home network and control your laptop — there's no "dial in" direction that works. This companion app solves that the same way an SSH reverse tunnel does: it runs on your PC and opens an **outbound** connection to your backend, which your backend then uses to send it commands. It never listens for incoming connections from the internet.

## Setup

1. **Get a pairing token.** While logged into the NOVA web app, call:
   ```
   POST https://<your-backend>/api/system/pairing-token
   ```
   (with your session cookie) — this returns a token tied to your account.

2. **Configure this app.** Copy `config.example.json` to `config.json` and fill in:
   ```json
   {
     "backendWsUrl": "wss://<your-backend>/ws/system-agent",
     "pairingToken": "<the token from step 1>"
   }
   ```

3. **Install and run:**
   ```bash
   npm install
   npm start
   ```
   You should see `Connected. Registering...` in the terminal. The companion reconnects automatically if the network drops.

## Available actions

The companion supports opening apps and files, screenshots, keyboard and mouse input, creating files and folders, volume and media controls, clipboard access, window control, file search, system information, desktop notifications, and scheduled shutdown or restart.

`run_command`, `list_processes`, and `kill_process` require `"fullControl": true` in `config.json`. Keep it `false` unless those actions are needed. All actions execute on the computer where this companion is running.

## Platform notes — please read

- **Shutdown/restart require admin/sudo on macOS and Linux.** Windows' `shutdown` command works for a normal user; macOS and Linux generally require elevated privileges. If you want voice-triggered shutdown to work without a password prompt, you'll need to configure passwordless sudo for the `shutdown` command specifically — that's a system configuration choice for you to make deliberately, not something this app does automatically.
- **Screenshots on Linux** need one of `gnome-screenshot`, `scrot`, or ImageMagick (`import`) installed. macOS and Windows use built-in tools, no install needed.
- **Safety window:** shutdown/restart are scheduled with a 60-second delay, not executed instantly. Say "cancel shutdown" to Nova, or run the platform's cancel command yourself (`shutdown /a` on Windows, `sudo shutdown -c` on macOS/Linux), to stop it.

## Running this permanently

### Windows

From PowerShell in this directory, run:

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\install-windows-startup.ps1
```

This creates a hidden-window shortcut in the current user's Startup folder. Remove `NOVA System Agent.lnk` from that folder to disable automatic startup.

### macOS

Copy `macos-launch-agent.plist.example` to `~/Library/LaunchAgents/com.nova.system-agent.plist`, replace the two `REPLACE_*` values, then run:

```bash
launchctl load ~/Library/LaunchAgents/com.nova.system-agent.plist
```

### Linux

Copy `linux-systemd-user.service.example` to `~/.config/systemd/user/nova-system-agent.service`, replace `REPLACE_AGENT_DIRECTORY`, then run:

```bash
systemctl --user daemon-reload
systemctl --user enable --now nova-system-agent.service
```
- **Windows volume / media:** For the most reliable control, install [nircmd](https://www.nirsoft.net/utils/nircmd.html) and put `nircmd.exe` on your PATH. Without it, the companion falls back to PowerShell (volume and media keys still work on most systems, but mute can be flaky).
- **Linux extras:** Volume needs `pactl` (PulseAudio/PipeWire). Media needs `playerctl`. Window focus/close needs `wmctrl`. Clipboard needs `xclip` or `xsel`. Notifications need `notify-send` (libnotify).
- **fullControl:** Only set `"fullControl": true` in `config.json` if you need `run_command` / process kill. Those can run arbitrary shell commands on this machine.