export function formatLines(lines: string[], platform: 'android' | 'ios'): string[] {
  return platform === 'ios' ? formatIosLines(lines) : formatAndroidLines(lines);
}

function formatIosLines(lines: string[]): string[] {
  // iOS compact format:
  // 2026-03-31 15:35:10.222 Df Expo Go[67415:1551548] [com.apple.UIKit:BackgroundTask] Message here
  // 2026-03-31 15:35:10.222 Ef Expo Go[67415:1551548] Message here
  const iosCompactRegex = /^\d{4}-\d{2}-\d{2}\s+(\d{2}:\d{2}:\d{2})\.\d+\s+(\w+)\s+.+?\[[\d:]+\]\s+(?:\[([^\]]+)\]\s+)?(.+)$/;

  return lines.map((line) => {
    // Try to extract RN JS log from raw unformatted lines first
    // "2026-03-31 15:47:40.793 E  Expo Go[67415:155901f] 2026-03-31 15:47:40.800 [info][tid:com.facebook.react.runtime.JavaScript] ..."
    const rawRnRegex = /^\d{4}-\d{2}-\d{2}\s+(\d{2}:\d{2}:\d{2})\.\d+\s+\w+\s+.+?\[[\d\w:]+\]\s+\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}\.\d+\s+\[(\w+)\]\[tid:com\.facebook\.react\.runtime\.JavaScript\]\s*(.+)$/;
    const rawRnMatch = line.match(rawRnRegex);
    if (rawRnMatch) {
      const rnLevel = rnLevelLabel(rawRnMatch[2]);
      return `${rawRnMatch[1]} ${rnLevel} ${rawRnMatch[3].trim()}`;
    }

    const m = line.match(iosCompactRegex);
    if (!m) return line;

    const time = m[1];
    const levelCode = m[2];
    const category = m[3] || '';
    let message = m[4].trim();

    // Clean up React Native JS log lines embedded in formatted output
    const rnJsRegex = /^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}\.\d+\s+\[(\w+)\]\[tid:com\.facebook\.react\.runtime\.JavaScript\]\s*(.+)$/;
    const rnMatch = message.match(rnJsRegex);
    if (rnMatch) {
      const rnLevel = rnLevelLabel(rnMatch[1]);
      return `${time} ${rnLevel} ${rnMatch[2].trim()}`;
    }

    const level = iosLevelLabel(levelCode);
    const tag = category ? shortenCategory(category) : '';
    const prefix = tag ? `${time} ${level} [${tag}]` : `${time} ${level}`;

    return `${prefix} ${message}`;
  });
}

function formatAndroidLines(lines: string[]): string[] {
  // Android logcat format:
  // 03-31 15:35:10.222  1234  5678 I ActivityManager: Message here
  // or: I/Tag(1234): Message here
  const logcatRegex = /^\d{2}-\d{2}\s+(\d{2}:\d{2}:\d{2})\.\d+\s+\d+\s+\d+\s+([VDIWEF])\s+(\S+?)\s*:\s*(.+)$/;
  const logcatAltRegex = /^([VDIWEF])\/(\S+?)\(\s*\d+\):\s*(.+)$/;

  return lines.map((line) => {
    const m = line.match(logcatRegex);
    if (m) {
      const level = androidLevelLabel(m[2]);
      return `${m[1]} ${level} [${m[3]}] ${m[4].trim()}`;
    }

    const m2 = line.match(logcatAltRegex);
    if (m2) {
      const level = androidLevelLabel(m2[1]);
      return `${level} [${m2[2]}] ${m2[3].trim()}`;
    }

    return line;
  });
}

function iosLevelLabel(code: string): string {
  const first = code.charAt(0).toUpperCase();
  switch (first) {
    case 'D': return 'DBG';
    case 'I': return 'INF';
    case 'N': return 'INF';
    case 'E': return 'ERR';
    case 'F': return 'FLT';
    case 'W': return 'WRN';
    default: return 'INF';
  }
}

function androidLevelLabel(code: string): string {
  switch (code) {
    case 'V': return 'VRB';
    case 'D': return 'DBG';
    case 'I': return 'INF';
    case 'W': return 'WRN';
    case 'E': return 'ERR';
    case 'F': return 'FLT';
    default: return 'INF';
  }
}

function rnLevelLabel(level: string): string {
  switch (level.toLowerCase()) {
    case 'error': return 'ERR';
    case 'warn': return 'WRN';
    case 'info': return 'INF';
    case 'debug': return 'DBG';
    case 'log': return 'LOG';
    default: return 'LOG';
  }
}

function shortenCategory(category: string): string {
  // "com.apple.UIKit:BackgroundTask" → "UIKit:BackgroundTask"
  // "com.apple.network.connection" → "network.connection"
  return category
    .replace(/^com\.apple\./, '')
    .replace(/^com\./, '');
}
