import { spawn } from 'node:child_process';
import { platform } from 'node:os';

const isWin = platform() === 'win32';
const isMac = platform() === 'darwin';

function run(cmd, args) {
  try {
    const child = spawn(cmd, args, { stdio: 'ignore', detached: true, windowsHide: true });
    child.unref();
  } catch {
    // best-effort: never let notification crash the timer
  }
}

// Console beep. Cross-platform fallback chain.
export function beep() {
  if (isWin) {
    // Two short beeps, then one long.
    run('powershell.exe', [
      '-NoProfile',
      '-Command',
      '[Console]::Beep(880,200); Start-Sleep -Milliseconds 120; [Console]::Beep(660,200); Start-Sleep -Milliseconds 120; [Console]::Beep(1320,400)',
    ]);
  } else {
    process.stdout.write('\x07');
  }
}

// Desktop notification. Windows uses BurntToast if present, else falls back to msg.exe.
// macOS uses osascript. Linux uses notify-send. All fire-and-forget.
export function notify({ title, body }) {
  if (isWin) {
    const script = `
      $ErrorActionPreference = 'SilentlyContinue'
      if (Get-Module -ListAvailable -Name BurntToast) {
        Import-Module BurntToast
        New-BurntToastNotification -Text '${escapePs(title)}','${escapePs(body)}'
      } else {
        Add-Type -AssemblyName System.Windows.Forms
        $n = New-Object System.Windows.Forms.NotifyIcon
        $n.Icon = [System.Drawing.SystemIcons]::Information
        $n.Visible = $true
        $n.ShowBalloonTip(5000, '${escapePs(title)}', '${escapePs(body)}', [System.Windows.Forms.ToolTipIcon]::Info)
        Start-Sleep -Seconds 6
        $n.Dispose()
      }
    `;
    run('powershell.exe', ['-NoProfile', '-Command', script]);
  } else if (isMac) {
    run('osascript', ['-e', `display notification "${escapeShell(body)}" with title "${escapeShell(title)}"`]);
  } else {
    run('notify-send', [title, body]);
  }
}

function escapePs(s) {
  return String(s).replace(/'/g, "''");
}

function escapeShell(s) {
  return String(s).replace(/"/g, '\\"');
}
