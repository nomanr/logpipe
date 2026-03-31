import { describe, it, expect } from 'vitest';
import { formatLines } from '../../../src/logs/format.js';

describe('formatLines - iOS', () => {
  it('formats iOS compact log lines', () => {
    const lines = [
      '2026-03-31 15:35:10.222 Df Expo Go[67415:1551548] [com.apple.UIKit:BackgroundTask] Ending background task',
    ];
    const result = formatLines(lines, 'ios');
    expect(result[0]).toBe('15:35:10 DBG [UIKit:BackgroundTask] Ending background task');
  });

  it('formats iOS lines without category', () => {
    const lines = [
      '2026-03-31 15:35:10.222 Ef Expo Go[67415:1551548] Something went wrong',
    ];
    const result = formatLines(lines, 'ios');
    expect(result[0]).toBe('15:35:10 ERR Something went wrong');
  });

  it('formats React Native JS logs from new runtime', () => {
    const lines = [
      '2026-03-31 15:47:37.100 Df Expo Go[67415:1551548] 2026-03-31 15:47:37.100 [info][tid:com.facebook.react.runtime.JavaScript] [Network] GET /api/cart → 200 OK (142ms)',
    ];
    const result = formatLines(lines, 'ios');
    expect(result[0]).toBe('15:47:37 INF [Network] GET /api/cart → 200 OK (142ms)');
  });

  it('formats RN JS warn logs', () => {
    const lines = [
      '2026-03-31 15:47:37.605 Df Expo Go[67415:1551548] 2026-03-31 15:47:37.605 [warn][tid:com.facebook.react.runtime.JavaScript] [Auth] Session token expired',
    ];
    const result = formatLines(lines, 'ios');
    expect(result[0]).toBe('15:47:37 WRN [Auth] Session token expired');
  });

  it('formats RN JS error logs', () => {
    const lines = [
      '2026-03-31 15:47:39.301 Df Expo Go[67415:1551548] 2026-03-31 15:47:39.301 [error][tid:com.facebook.react.runtime.JavaScript] [Network] GET /api/inventory/check → 500',
    ];
    const result = formatLines(lines, 'ios');
    expect(result[0]).toBe('15:47:39 ERR [Network] GET /api/inventory/check → 500');
  });

  it('handles raw unformatted RN lines', () => {
    const lines = [
      '2026-03-31 15:47:40.793 E  Expo Go[67415:155901f] 2026-03-31 15:47:40.800 [info][tid:com.facebook.react.runtime.JavaScript] [Push] Connected',
    ];
    const result = formatLines(lines, 'ios');
    expect(result[0]).toBe('15:47:40 INF [Push] Connected');
  });

  it('passes through unrecognized lines', () => {
    const lines = ['some random text'];
    const result = formatLines(lines, 'ios');
    expect(result[0]).toBe('some random text');
  });

  it('shortens com.apple categories', () => {
    const lines = [
      '2026-03-31 15:35:10.222 Df MyApp[123:456] [com.apple.network.connection] Connection reset',
    ];
    const result = formatLines(lines, 'ios');
    expect(result[0]).toBe('15:35:10 DBG [network.connection] Connection reset');
  });
});

describe('formatLines - Android', () => {
  it('formats standard logcat lines', () => {
    const lines = [
      '03-31 15:35:10.222  1234  5678 I ActivityManager: Starting activity',
    ];
    const result = formatLines(lines, 'android');
    expect(result[0]).toBe('15:35:10 INF [ActivityManager] Starting activity');
  });

  it('formats alternative logcat format', () => {
    const lines = [
      'I/ReactNativeJS( 1234): console.log output',
    ];
    const result = formatLines(lines, 'android');
    expect(result[0]).toBe('INF [ReactNativeJS] console.log output');
  });

  it('formats error level', () => {
    const lines = [
      'E/AndroidRuntime( 1234): FATAL EXCEPTION: main',
    ];
    const result = formatLines(lines, 'android');
    expect(result[0]).toBe('ERR [AndroidRuntime] FATAL EXCEPTION: main');
  });

  it('passes through unrecognized lines', () => {
    const lines = ['--------- beginning of crash'];
    const result = formatLines(lines, 'android');
    expect(result[0]).toBe('--------- beginning of crash');
  });
});
