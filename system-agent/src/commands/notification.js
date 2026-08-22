import { exec } from 'child_process';
import { promisify } from 'util';
const execAsync = promisify(exec);

export const showNotification = async ({ title = 'Nova', body }) => {
  if (!body) throw new Error('body is required');
  if (process.platform === 'darwin') {
    await execAsync(`osascript -e 'display notification "${body}" with title "${title}"'`);
  } else if (process.platform === 'win32') {
    // PowerShell toast (Windows 10+)
    const script = `
      [Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null
      $template = [Windows.UI.Notifications.ToastNotificationManager]::GetTemplateContent([Windows.UI.Notifications.ToastTemplateType]::ToastText02)
      $textNodes = $template.GetElementsByTagName("text")
      $textNodes.Item(0).AppendChild($template.CreateTextNode("${title}")) | Out-Null
      $textNodes.Item(1).AppendChild($template.CreateTextNode("${body}")) | Out-Null
      $toast = [Windows.UI.Notifications.ToastNotification]::new($template)
      [Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier("Nova").Show($toast)
    `;
    await execAsync(`powershell -command "${script.replace(/"/g, '\\"')}"`);
  } else {
    await execAsync(`notify-send "${title}" "${body}"`);
  }
  return 'Notification shown';
};