@echo off
setlocal
cd /d "%~dp0"
if not exist "config.json" (
  echo Missing system-agent\config.json. Copy config.example.json and configure it first.
  exit /b 1
)
node src\index.js