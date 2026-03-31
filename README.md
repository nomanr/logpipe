# logpeek

Peek into mobile device logs from AI coding agents.

logpeek gives coding agents like Claude Code, Cursor, and Gemini CLI direct access to Android and iOS device logs.

<p>
  <a href="https://www.npmjs.com/package/logpeek"><img src="https://img.shields.io/npm/v/logpeek?style=flat-square&color=e8a23e&label=npm" alt="npm version" /></a>
  &nbsp;
  <a href="https://github.com/nomanr/logpeek/blob/main/LICENSE"><img src="https://img.shields.io/npm/l/logpeek?style=flat-square&color=c49344" alt="license" /></a>
  &nbsp;
  <a href="https://www.npmjs.com/package/logpeek"><img src="https://img.shields.io/npm/dm/logpeek?style=flat-square&color=b8860b" alt="downloads" /></a>
  &nbsp;
  <img src="https://img.shields.io/badge/iOS%20%7C%20Android-e8a23e?style=flat-square&label=platform" alt="platform" />
</p>

https://github.com/nomanr/logpeek/releases/download/v0.0.1/demo.mp4

## What you can do

Ask your agent things like:

- **"Why is my app crashing on launch?"** — agent pulls crash logs, finds the stack trace, and fixes the issue
- **"Show me the last 30 seconds of error logs"** — narrow time window, error-level filtering
- **"What's happening in the React Native JS layer?"** — isolate framework-specific logs from native noise
- **"Check the network logs for failures"** — grep through logs for specific patterns
- **"My app is slow, what's going on?"** — pull verbose logs and spot the bottleneck

## Quick Start

### 1. Install

```bash
npm install -g logpeek
```

### 2. Connect your agent

<details open>
<summary><strong>Claude Code</strong></summary>

```bash
npx logpeek init
```

Registers logpeek as a Claude Code plugin. Restart Claude Code after.

</details>

<details>
<summary><strong>Other agents</strong></summary>

Any agent that runs shell commands can use logpeek. Add this to your agent's system prompt:

```
You have access to `logpeek` for collecting mobile device logs:
- logpeek --app com.example.app                       # collect logs (last 5m)
- logpeek --app com.example.app --level error          # errors only
- logpeek --app com.example.app -f react-native        # React Native logs only
- logpeek --app com.example.app --grep "network"       # search logs
- logpeek --app com.example.app --last 30s             # narrow time window
- logpeek devices                                      # list connected devices
```

</details>

### 3. Verify

```bash
npx logpeek doctor
```

Checks that `adb` (Android) and `xcrun` (iOS) are available and ready.

## Commands

```bash
# Collect logs (default command)
logpeek --app com.example.app
logpeek                                          # interactive device & app picker

# List connected devices
logpeek devices

# Check prerequisites
logpeek doctor

# Register Claude Code plugin
logpeek init
```

## Flags

| Flag | Short | Default | Description |
|------|-------|---------|-------------|
| `--app <id>` | `-a` | interactive | Bundle ID (iOS) or package name (Android) |
| `--device <id>` | `-d` | auto | Device ID or name |
| `--platform <type>` | `-p` | auto | `android` or `ios` |
| `--level <level>` | `-l` | `verbose` | Minimum log level: `verbose`, `debug`, `info`, `warn`, `error` |
| `--source <type>` | `-s` | `all` | Log source: `all`, `native`, `framework` |
| `--framework <type>` | `-f` | — | `react-native` or `flutter`. Automatically sets `--source framework`. |
| `--last <duration>` | `-t` | `5m` | Time window (e.g., `30s`, `1m`, `5m`, `1h`) |
| `--lines <n>` | `-n` | `200` | Max lines to output |
| `--grep <pattern>` | `-g` | — | Case-insensitive text filter |
| `--verbose` | | — | Debug logging |
| `--quiet` | | — | Suppress output except errors |

## Examples

```bash
# All logs from last 5 minutes
logpeek --app com.example.app

# Errors only, last 30 seconds
logpeek --app com.example.app --level error --last 30s

# React Native JS logs only (-f implies --source framework)
logpeek --app com.example.app -f react-native

# Search for network-related errors
logpeek --app com.example.app --grep "network" --level error

# Target a specific device
logpeek --app com.example.app -d "iPhone 16"

# Combine framework filter with grep
logpeek --app com.example.app -f react-native --grep "inventory" --level error

# Widen the window for intermittent issues
logpeek --app com.example.app --last 30m -n 500
```

## Log Output

Logs are automatically formatted for readability:

```
15:47:37 INF [Network] GET /api/cart → 200 OK (142ms)
15:47:37 INF [Network] GET /api/user/profile → 401 Unauthorized
15:47:37 WRN [Auth] Session token expired, refreshing...
15:47:37 INF [Network] POST /api/auth/refresh → 200 OK (203ms)
15:47:39 ERR [Inventory] Failed to verify stock: Connection timeout after 5000ms
15:47:39 INF [Performance] JS thread: 58.2fps | UI thread: 60.0fps
```

Raw platform timestamps and process metadata are stripped. Level indicators (`INF`, `WRN`, `ERR`, `DBG`) and categories are preserved.

## How It Works

**Android**: Uses `adb logcat` with PID filtering. If the app has crashed (no PID), automatically includes `AndroidRuntime` and `FATAL EXCEPTION` logs.

**iOS**: Uses `xcrun simctl spawn <udid> log show` with process/subsystem predicates. Falls back to `ReportCrash` and `SpringBoard` logs for crash debugging.

**Filtering**: Logs pass through a pipeline — format → level filter → source filter → grep filter → line limit. Filters combine with AND logic.

**Device discovery**: Automatically detects booted Android emulators (`adb devices`) and iOS simulators (`xcrun simctl list`). If multiple devices are found, an interactive picker is shown.

## Framework Support

| Framework | Android | iOS |
|-----------|---------|-----|
| React Native | `ReactNativeJS` tag | `com.facebook.react.runtime.JavaScript` |
| Flutter | `flutter` tag | `flutter` subsystem |
| Native | Full logcat | Full unified log |

## Platform Support

| Platform | Emulator/Simulator | Physical Device |
|----------|-------------------|-----------------|
| Android  | Supported         | Not yet         |
| iOS      | Supported (macOS only) | Not yet    |

## Requirements

- **Node.js** >= 18
- **Android**: `adb` available, emulator booted
- **iOS**: macOS with `xcrun simctl`, simulator booted

## Development

```bash
npm install
npm run dev          # watch mode
npm test             # run tests
npm run build        # production build
```

## License

[MIT](LICENSE)
