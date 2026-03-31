import { describe, it, expect, vi } from 'vitest';
import { buildLogShowArgs, collectIosLogs } from '../../../src/logs/ios.js';

describe('buildLogShowArgs', () => {
  it('builds args with app predicate', () => {
    const args = buildLogShowArgs('ABC-123', { app: 'com.example.MyApp', last: '5m' });
    expect(args).toContain('spawn');
    expect(args).toContain('ABC-123');
    expect(args).toContain('log');
    expect(args).toContain('show');
    expect(args).toContain('--style');
    expect(args).toContain('compact');
    expect(args.some(a => a.includes('--last'))).toBe(true);
  });

  it('includes predicate with process name', () => {
    const args = buildLogShowArgs('ABC-123', { app: 'com.example.MyApp', last: '2m' });
    const predicateIdx = args.indexOf('--predicate');
    expect(predicateIdx).toBeGreaterThan(-1);
    expect(args[predicateIdx + 1]).toContain('MyApp');
  });
});

describe('collectIosLogs', () => {
  it('returns filtered log lines', async () => {
    const mockShell = {
      exec: vi.fn().mockResolvedValue({
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

  it('widens to crash logs when no output', async () => {
    const mockShell = {
      exec: vi.fn()
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
