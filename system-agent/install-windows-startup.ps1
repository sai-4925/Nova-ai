$ErrorActionPreference = 'Stop'
$agentDirectory = Split-Path -Parent $MyInvocation.MyCommand.Path
$startupDirectory = [Environment]::GetFolderPath('Startup')
$shortcutPath = Join-Path $startupDirectory 'NOVA System Agent.lnk'
$shell = New-Object -ComObject WScript.Shell
$shortcut = $shell.CreateShortcut($shortcutPath)
$shortcut.TargetPath = Join-Path $agentDirectory 'start-nova-agent.bat'
$shortcut.WorkingDirectory = $agentDirectory
$shortcut.WindowStyle = 7
$shortcut.Description = 'Start the NOVA System Agent companion at login'
$shortcut.Save()
Write-Host "Installed startup shortcut: $shortcutPath"