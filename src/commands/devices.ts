import type { Shell } from '../types.js';
import { DeviceDiscovery } from '../devices/discovery.js';

export async function runDevices(shell: Shell): Promise<void> {
  const discovery = new DeviceDiscovery(shell);
  const devices = await discovery.list();
  const booted = devices.filter((d) => d.state === 'booted');

  if (booted.length === 0) {
    console.log('No booted devices found.');
    return;
  }

  for (const d of booted) {
    console.log(`${d.name}  (${d.platform}, ${d.osVersion || 'unknown'}, ${d.id})`);
  }
}
