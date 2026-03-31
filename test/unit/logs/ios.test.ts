import { describe, it, expect, vi } from 'vitest';
import { buildLogShowArgs, collectIosLogs, resolveProcessName } from '../../../src/logs/ios.js';
import type { Shell } from '../../../src/types.js';

describe('resolveProcessName', () => {
  it('extracts CFBundleExecutable from simctl listapps', async () => {
    const appsJson = JSON.stringify({ 'com.example.MyApp': { CFBundleExecutable: 'MyAppExec' } });
    const shell: Shell = {
      exec: vi.fn().mockResolvedValue({ stdout: appsJson, stderr: '' }),
    };
    expect(await resolveProcessName(shell, 'ABC-123', 'com.example.MyApp')).toBe('MyAppExec');
  });

  it('falls back to last segment of bundle ID', async () => {
    const shell: Shell = {
      exec: vi.fn().mockRejectedValue(new Error('fail')),
    };
    expect(await resolveProcessName(shell, 'ABC-123', 'com.example.MyApp')).toBe('MyApp');
  });
});

describe('buildLogShowArgs', () => {
  it('builds args with process name predicate', () => {
    const args = buildLogShowArgs('ABC-123', { processName: 'MyAppExec', bundleId: 'com.example.MyApp', last: '5m' });
    expect(args).toContain('spawn');
    expect(args).toContain('ABC-123');
    expect(args).toContain('log');
    expect(args).toContain('show');
    expect(args).toContain('--style');
    expect(args).toContain('compact');
    const predicateIdx = args.indexOf('--predicate');
    expect(args[predicateIdx + 1]).toContain('MyAppExec');
    expect(args[predicateIdx + 1]).toContain('com.example.MyApp');
  });
});

describe('collectIosLogs', () => {
  it('returns filtered log lines', async () => {
    const appsJson = JSON.stringify({ 'com.example.MyApp': { CFBundleExecutable: 'MyApp' } });
    const mockShell = {
      exec: vi.fn()
        .mockResolvedValueOnce({ stdout: appsJson, stderr: '' })
        .mockResolvedValueOnce({
          stdout: '2026-03-31 10:00:00 Default com.example.MyApp: hello\n2026-03-31 10:00:01 Info com.example.MyApp: world\n',
          stderr: '',
        }),
    };

    const lines = await collectIosLogs(mockShell, 'ABC-123', {
      app: 'com.example.MyApp',
      level: 'verbose',
      source: 'all',
      lines: 200,
      last: '5m',
    });

    expect(lines.length).toBe(2);
  });

  it('strips log show header lines', async () => {
    const appsJson = JSON.stringify({ 'com.example.MyApp': { CFBundleExecutable: 'MyApp' } });
    const mockShell = {
      exec: vi.fn()
        .mockResolvedValueOnce({ stdout: appsJson, stderr: '' })
        .mockResolvedValueOnce({
          stdout: 'Timestamp               Ty Process[PID:TID]\n2026-03-31 10:00:00 Default com.example.MyApp: hello\n',
          stderr: '',
        }),
    };

    const lines = await collectIosLogs(mockShell, 'ABC-123', {
      app: 'com.example.MyApp',
      level: 'verbose',
      source: 'all',
      lines: 200,
      last: '5m',
    });

    expect(lines.length).toBe(1);
    expect(lines[0]).toContain('hello');
  });

  it('treats header-only output as empty (triggers crash fallback)', async () => {
    const appsJson = JSON.stringify({ 'com.example.MyApp': { CFBundleExecutable: 'MyApp' } });
    const mockShell = {
      exec: vi.fn()
        .mockResolvedValueOnce({ stdout: appsJson, stderr: '' })
        .mockResolvedValueOnce({ stdout: 'Timestamp               Ty Process[PID:TID]\n', stderr: '' })
        .mockResolvedValueOnce({ stdout: 'ReportCrash: com.example.MyApp crashed\n', stderr: '' }),
    };

    const lines = await collectIosLogs(mockShell, 'ABC-123', {
      app: 'com.example.MyApp',
      level: 'verbose',
      source: 'all',
      lines: 200,
      last: '5m',
    });

    expect(lines.some(l => l.includes('crashed'))).toBe(true);
  });

  it('widens to crash logs when no output', async () => {
    const appsJson = JSON.stringify({ 'com.example.MyApp': { CFBundleExecutable: 'MyApp' } });
    const mockShell = {
      exec: vi.fn()
        .mockResolvedValueOnce({ stdout: appsJson, stderr: '' })
        .mockResolvedValueOnce({ stdout: '', stderr: '' })
        .mockResolvedValueOnce({
          stdout: 'ReportCrash: com.example.MyApp crashed\n',
          stderr: '',
        }),
    };

    const lines = await collectIosLogs(mockShell, 'ABC-123', {
      app: 'com.example.MyApp',
      level: 'verbose',
      source: 'all',
      lines: 200,
      last: '5m',
    });

    expect(lines.some(l => l.includes('crashed'))).toBe(true);
  });
});
