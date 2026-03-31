import { describe, it, expect, vi } from 'vitest';
import { buildLogcatArgs, collectAndroidLogs } from '../../../src/logs/android.js';
import type { Shell } from '../../../src/types.js';

describe('buildLogcatArgs', () => {
  it('builds args with PID', () => {
    const args = buildLogcatArgs('emulator-5554', { pid: '12345', lastSeconds: 60 });
    expect(args).toContain('-s');
    expect(args).toContain('emulator-5554');
    expect(args).toContain('--pid=12345');
    expect(args).toContain('-d');
  });

  it('builds args without PID (crashed app)', () => {
    const args = buildLogcatArgs('emulator-5554', { lastSeconds: 60 });
    expect(args).toContain('-d');
    expect(args.some(a => a.startsWith('--pid'))).toBe(false);
  });

  it('includes time filter', () => {
    const args = buildLogcatArgs('emulator-5554', { pid: '123', lastSeconds: 120 });
    const tFlag = args.findIndex(a => a === '-T');
    expect(tFlag).toBeGreaterThan(-1);
  });
});

describe('collectAndroidLogs', () => {
  it('returns filtered log lines', async () => {
    const mockShell: Shell = {
      exec: vi.fn()
        .mockResolvedValueOnce({ stdout: '12345\n', stderr: '' })
        .mockResolvedValueOnce({
          stdout: 'I/MyApp: hello world\nD/MyApp: debug line\n',
          stderr: '',
        }),
    };

    const lines = await collectAndroidLogs(mockShell, 'emulator-5554', {
      app: 'com.example.app',
      level: 'verbose',
      source: 'all',
      lines: 200,
      last: '5m',
    });

    expect(lines.length).toBeGreaterThan(0);
    expect(lines[0]).toContain('MyApp');
  });

  it('handles crashed app (no PID)', async () => {
    const mockShell: Shell = {
      exec: vi.fn()
        .mockResolvedValueOnce({ stdout: '', stderr: '' })
        .mockResolvedValueOnce({
          stdout: 'E/AndroidRuntime: FATAL EXCEPTION: main\nE/AndroidRuntime: java.lang.NullPointerException\n',
          stderr: '',
        }),
    };

    const lines = await collectAndroidLogs(mockShell, 'emulator-5554', {
      app: 'com.example.app',
      level: 'verbose',
      source: 'all',
      lines: 200,
      last: '5m',
    });

    expect(lines.some(l => l.includes('FATAL EXCEPTION'))).toBe(true);
  });
});
