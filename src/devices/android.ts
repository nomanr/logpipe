import type { DeviceInfo, Shell } from '../types.js';

export function parseAdbDevices(output: string): DeviceInfo[] {
  const devices: DeviceInfo[] = [];
  const lines = output.split('\n');

  for (const line of lines) {
    if (line.startsWith('List of devices') || line.trim() === '') continue;

    const match = line.match(/^(\S+)\s+(device|offline|unauthorized)(.*)$/);
    if (!match) continue;

    const [, id, rawState, rest] = match;
    const modelMatch = rest.match(/model:(\S+)/);
    const transportMatch = rest.match(/transport_id:(\S+)/);

    const state: DeviceInfo['state'] =
      rawState === 'device' ? 'booted' :
      rawState === 'offline' ? 'offline' : 'unauthorized';

    devices.push({
      id,
      name: modelMatch?.[1] ?? id,
      platform: 'android',
      osVersion: '',
      state,
      transport: transportMatch?.[1],
    });
  }

  return devices;
}

export async function discoverAndroidDevices(shell: Shell): Promise<DeviceInfo[]> {
  const { stdout } = await shell.exec('adb', ['devices', '-l']);
  return parseAdbDevices(stdout);
}
