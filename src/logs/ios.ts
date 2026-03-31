import type { Shell, LogLevel, LogSource, Framework } from '../types.js';
import { filterByLevel, filterBySource, trimLines } from './filter.js';

export async function resolveProcessName(shell: Shell, udid: string, bundleId: string): Promise<string> {
  try {
    const { stdout } = await shell.exec(
      'bash',
      ['-c', `xcrun simctl listapps ${udid} | plutil -convert json -o - -`],
      { timeout: 10000 },
    );
    const apps = JSON.parse(stdout);
    const app = apps[bundleId];
    if (app?.CFBundleExecutable) {
      return app.CFBundleExecutable;
    }
  } catch {}
  const parts = bundleId.split('.');
  return parts[parts.length - 1];
}

interface LogShowBuildOptions {
  processName: string;
  bundleId: string;
  last: string;
}

export function buildLogShowArgs(udid: string, opts: LogShowBuildOptions): string[] {
  const predicate = `process == "${opts.processName}" OR subsystem == "${opts.bundleId}"`;

  return [
    'simctl', 'spawn', udid,
    'log', 'show',
    '--predicate', predicate,
    '--last', opts.last,
    '--style', 'compact',
  ];
}

function buildCrashLogShowArgs(udid: string, last: string): string[] {
  const predicate = `process == "ReportCrash" OR process == "SpringBoard"`;
  return [
    'simctl', 'spawn', udid,
    'log', 'show',
    '--predicate', predicate,
    '--last', last,
    '--style', 'compact',
  ];
}

function stripLogShowHeaders(lines: string[]): string[] {
  return lines.filter((l) => {
    const trimmed = l.trim();
    if (trimmed === '') return false;
    if (trimmed.startsWith('Timestamp')) return false;
    if (/^-+$/.test(trimmed)) return false;
    return true;
  });
}

interface CollectOptions {
  app: string;
  level: LogLevel;
  source: LogSource;
  framework?: Framework;
  lines: number;
  last: string;
}

export async function collectIosLogs(
  shell: Shell,
  udid: string,
  opts: CollectOptions,
): Promise<string[]> {
  const processName = await resolveProcessName(shell, udid, opts.app);
  const args = buildLogShowArgs(udid, { processName, bundleId: opts.app, last: opts.last });
  const { stdout } = await shell.exec('xcrun', args, { timeout: 30000 });

  let lines = stripLogShowHeaders(stdout.split('\n'));

  if (lines.length === 0) {
    process.stderr.write('App is not running. Showing crash-related logs.\n');
    const crashArgs = buildCrashLogShowArgs(udid, opts.last);
    const crashResult = await shell.exec('xcrun', crashArgs, { timeout: 30000 });
    lines = stripLogShowHeaders(crashResult.stdout.split('\n'));
  }

  lines = filterByLevel(lines, opts.level, 'ios');
  lines = filterBySource(lines, opts.source, 'ios', opts.framework);
  return trimLines(lines, opts.lines);
}
