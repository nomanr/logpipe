import type { Shell } from '../types.js';

export interface InstalledApp {
  id: string;
  name?: string;
}

export async function listAndroidApps(shell: Shell, deviceId: string): Promise<InstalledApp[]> {
  const { stdout } = await shell.exec('adb', ['-s', deviceId, 'shell', 'pm', 'list', 'packages', '-3'], { timeout: 10000 });
  return stdout
    .split('\n')
    .map((line) => line.replace('package:', '').trim())
    .filter((id) => id !== '')
    .map((id) => ({ id }));
}

export async function listIosApps(shell: Shell, udid: string): Promise<InstalledApp[]> {
  try {
    const { stdout } = await shell.exec(
      'bash',
      ['-c', `xcrun simctl listapps ${udid} | plutil -convert json -o - -`],
      { timeout: 10000 },
    );
    const parsed = JSON.parse(stdout);
    return Object.entries(parsed)
      .filter(([id]) => !id.startsWith('com.apple.'))
      .map(([id, info]) => ({
        id,
        name: (info as Record<string, string>).CFBundleDisplayName ?? (info as Record<string, string>).CFBundleName,
      }));
  } catch {
    return [];
  }
}
