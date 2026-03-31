import { describe, it, expect } from 'vitest';
import { parseSimctlDevices } from '../../../src/devices/ios.js';

describe('parseSimctlDevices', () => {
  it('parses booted simulator', () => {
    const output = JSON.stringify({
      devices: {
        'com.apple.CoreSimulator.SimRuntime.iOS-18-0': [
          { udid: 'ABC-123', name: 'iPhone 16', state: 'Booted', isAvailable: true },
        ],
      },
    });
    const devices = parseSimctlDevices(output);
    expect(devices).toHaveLength(1);
    expect(devices[0]).toMatchObject({
      id: 'ABC-123',
      name: 'iPhone 16',
      platform: 'ios',
      osVersion: '18.0',
      state: 'booted',
    });
  });

  it('skips unavailable simulators', () => {
    const output = JSON.stringify({
      devices: {
        'com.apple.CoreSimulator.SimRuntime.iOS-17-5': [
          { udid: 'X', name: 'iPhone 15', state: 'Shutdown', isAvailable: false },
        ],
      },
    });
    expect(parseSimctlDevices(output)).toHaveLength(0);
  });

  it('handles invalid JSON', () => {
    expect(parseSimctlDevices('not json')).toHaveLength(0);
  });
});
