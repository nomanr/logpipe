import { describe, it, expect } from 'vitest';
import { parseAdbDevices } from '../../../src/devices/android.js';

describe('parseAdbDevices', () => {
  it('parses booted emulator', () => {
    const output = `List of devices attached
emulator-5554          device product:sdk_gphone64_arm64 model:sdk_gphone64_arm64 transport_id:1

`;
    const devices = parseAdbDevices(output);
    expect(devices).toHaveLength(1);
    expect(devices[0]).toMatchObject({
      id: 'emulator-5554',
      platform: 'android',
      state: 'booted',
    });
  });

  it('handles empty output', () => {
    const output = `List of devices attached

`;
    expect(parseAdbDevices(output)).toHaveLength(0);
  });

  it('parses offline device', () => {
    const output = `List of devices attached
emulator-5554          offline transport_id:1

`;
    const devices = parseAdbDevices(output);
    expect(devices[0].state).toBe('offline');
  });
});
