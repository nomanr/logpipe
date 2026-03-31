import type { LogLevel, LogSource, Framework } from '../types.js';

const ANDROID_LEVEL_ORDER: Record<string, number> = {
  V: 0, D: 1, I: 2, W: 3, E: 4, F: 5,
};

const LEVEL_TO_ANDROID: Record<LogLevel, string> = {
  verbose: 'V', debug: 'D', info: 'I', warn: 'W', error: 'E',
};

const FRAMEWORK_TAGS_ANDROID: Record<Framework, RegExp> = {
  'react-native': /\bReactNativeJS\b/,
  'flutter': /\bflutter\b/,
};

const ALL_FRAMEWORK_TAGS_ANDROID = [
  FRAMEWORK_TAGS_ANDROID['react-native'],
  FRAMEWORK_TAGS_ANDROID['flutter'],
];

export function parseLastDuration(last: string): number {
  const match = last.match(/^(\d+)(s|m|h)?$/);
  if (!match) return 5 * 60;
  const value = parseInt(match[1], 10);
  const unit = match[2] || 'm';
  switch (unit) {
    case 's': return value;
    case 'h': return value * 3600;
    default: return value * 60;
  }
}

export function filterByLevel(lines: string[], level: LogLevel, platform: 'android' | 'ios'): string[] {
  if (level === 'verbose') return lines;

  if (platform === 'android') {
    const minLevel = ANDROID_LEVEL_ORDER[LEVEL_TO_ANDROID[level]];
    return lines.filter((line) => {
      const match = line.match(/^([VDIWEF])\//);
      if (!match) return true;
      return (ANDROID_LEVEL_ORDER[match[1]] ?? 0) >= minLevel;
    });
  }

  const iosLevelMap: Record<LogLevel, string[]> = {
    verbose: [],
    debug: ['Debug', 'Info', 'Default', 'Warning', 'Error', 'Fault'],
    info: ['Info', 'Default', 'Warning', 'Error', 'Fault'],
    warn: ['Warning', 'Error', 'Fault'],
    error: ['Error', 'Fault'],
  };
  const allowed = iosLevelMap[level];
  if (allowed.length === 0) return lines;
  return lines.filter((line) => {
    const match = line.match(/\b(Debug|Info|Default|Warning|Error|Fault)\b/);
    if (!match) return true;
    return allowed.includes(match[1]);
  });
}

export function filterBySource(
  lines: string[],
  source: LogSource,
  platform: 'android' | 'ios',
  framework?: Framework,
): string[] {
  if (source === 'all') return lines;

  if (platform === 'android') {
    if (source === 'framework') {
      const pattern = framework
        ? FRAMEWORK_TAGS_ANDROID[framework]
        : new RegExp(ALL_FRAMEWORK_TAGS_ANDROID.map(r => r.source).join('|'));
      return lines.filter((line) => pattern.test(line));
    }
    return lines.filter((line) =>
      !ALL_FRAMEWORK_TAGS_ANDROID.some((p) => p.test(line))
    );
  }

  if (source === 'framework') {
    if (framework === 'react-native') {
      return lines.filter((line) => /\[ReactNativeJS\]|ReactNativeJS|com\.facebook\.react\.runtime\.JavaScript/.test(line));
    }
    if (framework === 'flutter') {
      return lines.filter((line) => /\bflutter\b/i.test(line));
    }
    return lines.filter((line) =>
      /\[ReactNativeJS\]|ReactNativeJS|com\.facebook\.react\.runtime\.JavaScript|\bflutter\b/i.test(line)
    );
  }

  return lines.filter((line) =>
    !/\[ReactNativeJS\]|ReactNativeJS|com\.facebook\.react\.runtime\.JavaScript|\bflutter\b/i.test(line)
  );
}

export function filterByGrep(lines: string[], grep: string | undefined): string[] {
  if (!grep) return lines;
  const lower = grep.toLowerCase();
  return lines.filter((line) => line.toLowerCase().includes(lower));
}

export function trimLines(lines: string[], max: number): string[] {
  if (lines.length <= max) return lines;
  return lines.slice(lines.length - max);
}
