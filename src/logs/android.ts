import type { Shell, LogLevel, LogSource, Framework } from '../types.js';
import { filterByLevel, filterBySource, trimLines, parseLastDuration } from './filter.js';

interface LogcatBuildOptions {
  pid?: string;
  lastSeconds: number;
}

export function buildLogcatArgs(deviceId: string, opts: LogcatBuildOptions): string[] {
  const args = ['-s', deviceId, 'logcat', '-d'];

  if (opts.pid) {
    args.push(`--pid=${opts.pid}`);
  }

  const since = new Date(Date.now() - opts.lastSeconds * 1000);
  const formatted = since.toLocaleString('en-US', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).replace(',', '');
  args.push('-T', formatted);

  return args;
}

interface CollectOptions {
  app: string;
  level: LogLevel;
  source: LogSource;
  framework?: Framework;
  lines: number;
  last: string;
}

export async function collectAndroidLogs(
  shell: Shell,
  deviceId: string,
  opts: CollectOptions,
): Promise<string[]> {
  const lastSeconds = parseLastDuration(opts.last);

  let pid: string | undefined;
  try {
    const { stdout } = await shell.exec('adb', ['-s', deviceId, 'shell', 'pidof', opts.app], { timeout: 5000 });
    pid = stdout.trim() || undefined;
  } catch {
    pid = undefined;
  }

  if (!pid) {
    process.stderr.write('App is not running. Showing crash-related logs.\n');
  }

  const args = buildLogcatArgs(deviceId, { pid, lastSeconds });
  const { stdout } = await shell.exec('adb', args, { timeout: 15000 });

  let lines = stdout.split('\n').filter((l) => l.trim() !== '');

  if (!pid) {
    lines = lines.filter((l) =>
      l.includes(opts.app) ||
      l.includes('AndroidRuntime') ||
      l.includes('FATAL EXCEPTION')
    );
  }

  lines = filterByLevel(lines, opts.level, 'android');
  lines = filterBySource(lines, opts.source, 'android', opts.framework);
  return trimLines(lines, opts.lines);
}
