# NOVA System Agent Companion

This is a **separate, standalone app** you run on your own computer — never on your cloud NOVA backend (Render, etc.). It's what lets Nova open apps, take screenshots, and shut down/restart *your* machine, by connecting outward to your deployed backend.

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
   You should see `Connected. Registering...` in the terminal. Leave this running in the background — it reconnects automatically if your network drops or your laptop sleeps/wakes.

## Platform notes — please read

- **Shutdown/restart require admin/sudo on macOS and Linux.** Windows' `shutdown` command works for a normal user; macOS and Linux generally require elevated privileges. If you want voice-triggered shutdown to work without a password prompt, you'll need to configure passwordless sudo for the `shutdown` command specifically — that's a system configuration choice for you to make deliberately, not something this app does automatically.
- **Screenshots on Linux** need one of `gnome-screenshot`, `scrot`, or ImageMagick (`import`) installed. macOS and Windows use built-in tools, no install needed.
- **Safety window:** shutdown/restart are scheduled with a 60-second delay, not executed instantly. Say "cancel shutdown" to Nova, or run the platform's cancel command yourself (`shutdown /a` on Windows, `sudo shutdown -c` on macOS/Linux), to stop it.

## Running this permanently

For actual day-to-day use, you'll want this running automatically at login rather than manually via `npm start` each time — e.g., as a Windows Startup item, a macOS LaunchAgent, or a `systemd --user` service on Linux. That setup is platform-specific and outside this app's scope, but any "run this command at login" mechanism your OS provides will work.
