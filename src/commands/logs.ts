import type { Shell, LogOptions } from '../types.js';
import { DeviceDiscovery } from '../devices/discovery.js';
import { collectAndroidLogs } from '../logs/android.js';
import { collectIosLogs } from '../logs/ios.js';
import { pickDevice } from './device-picker.js';

export async function runLogs(shell: Shell, opts: LogOptions): Promise<void> {
  const discovery = new DeviceDiscovery(shell);
  const devices = await discovery.list();
  const booted = devices.filter((d) => d.state === 'booted');

  if (booted.length === 0) {
    throw new Error('No booted devices found. Start an emulator or simulator first.');
  }

  let filtered = booted;
  if (opts.platform) {
    filtered = booted.filter((d) => d.platform === opts.platform);
    if (filtered.length === 0) {
      throw new Error(`No booted ${opts.platform} devices found.`);
    }
  }

  let device;
  if (opts.device) {
    device = filtered.find((d) => d.id === opts.device || d.name === opts.device);
    if (!device) throw new Error(`Device not found: ${opts.device}`);
  } else {
    device = await pickDevice(filtered);
  }

  const collectOpts = {
    app: opts.app,
    level: opts.level,
    source: opts.source,
    framework: opts.framework,
    lines: opts.lines,
    last: opts.last,
  };

  let lines: string[];
  if (device.platform === 'android') {
    lines = await collectAndroidLogs(shell, device.id, collectOpts);
  } else {
    lines = await collectIosLogs(shell, device.id, collectOpts);
  }

  if (lines.length === 0) {
    process.stderr.write(`No logs found for ${opts.app} in the last ${opts.last}.\n`);
    return;
  }

  process.stdout.write(lines.join('\n') + '\n');
}
