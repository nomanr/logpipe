import type { Shell, LogLevel, LogSource, Framework } from '../types.js';
import { filterByLevel, filterBySource, trimLines } from './filter.js';

function extractProcessName(bundleId: string): string {
  const parts = bundleId.split('.');
  return parts[parts.length - 1];
}

interface LogShowBuildOptions {
  app: string;
  last: string;
}

export function buildLogShowArgs(udid: string, opts: LogShowBuildOptions): string[] {
  const processName = extractProcessName(opts.app);
  const predicate = `process == "${processName}" OR subsystem == "${opts.app}"`;

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
  const args = buildLogShowArgs(udid, { app: opts.app, last: opts.last });
  const { stdout } = await shell.exec('xcrun', args, { timeout: 30000 });

  let lines = stdout.split('\n').filter((l) => l.trim() !== '');

  if (lines.length === 0) {
    process.stderr.write('App is not running. Showing crash-related logs.\n');
    const crashArgs = buildCrashLogShowArgs(udid, opts.last);
    const crashResult = await shell.exec('xcrun', crashArgs, { timeout: 30000 });
    lines = crashResult.stdout.split('\n').filter((l) => l.trim() !== '');
  }

  lines = filterByLevel(lines, opts.level, 'ios');
  lines = filterBySource(lines, opts.source, 'ios', opts.framework);
  return trimLines(lines, opts.lines);
}
