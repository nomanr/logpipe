export interface DeviceInfo {
  id: string;
  name: string;
  platform: 'android' | 'ios';
  osVersion: string;
  state: 'booted' | 'offline' | 'unauthorized';
  transport?: string;
}

export interface Shell {
  exec(
    cmd: string,
    args: string[],
    options?: { timeout?: number },
  ): Promise<{ stdout: string; stderr: string }>;
}

export interface PrerequisiteCheck {
  name: string;
  required: boolean;
  available: boolean;
  version?: string;
  error?: string;
  fix?: string;
}

export type LogLevel = 'verbose' | 'debug' | 'info' | 'warn' | 'error';
export type LogSource = 'all' | 'native' | 'framework';
export type Framework = 'react-native' | 'flutter';

export interface LogOptions {
  app: string;
  device?: string;
  platform?: 'android' | 'ios';
  source: LogSource;
  framework?: Framework;
  level: LogLevel;
  lines: number;
  last: string;
}
