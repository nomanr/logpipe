---
name: logpeek
description: Collect device logs from Android emulators and iOS simulators for debugging mobile apps (React Native, Flutter, native). Use when the user reports a crash, error, unexpected behavior, or when you need to understand what happened on the device during an action.
---

# logpeek -- Device Logs for Mobile Apps

## When to Use

- App crashed or threw an exception
- Feature is not working as expected
- Need to see what the app logged during a specific action
- Debugging network errors, state issues, or silent failures
- User reports "it doesn't work" without details

## Setup

```bash
npm install -g logpeek
```

**Prerequisites** (run `logpeek doctor` to verify):
- **Android**: `adb` available, emulator booted
- **iOS**: `xcrun simctl` available, simulator booted (macOS only)

Simulators/emulators only. No physical device support yet.

## Commands

| Command | Usage | Description |
|---------|-------|-------------|
| `logs` (default) | `logpeek --app <id> [options]` | Collect and display device logs |
| `devices` | `logpeek devices` | List booted simulators/emulators |
| `doctor` | `logpeek doctor` | Check prerequisites (node, adb, xcrun) |
| `init` | `logpeek init` | Register as Claude Code plugin |

## Log Collection Flags

| Flag | Short | Default | Description |
|------|-------|---------|-------------|
| `--app <id>` | `-a` | auto-pick | Bundle ID (iOS) or package name (Android). If omitted, lists installed apps. |
| `--source <type>` | `-s` | `all` | `all` (everything), `native` (platform only), `framework` (React Native/Flutter tags) |
| `--framework <type>` | `-f` | none | `react-native` or `flutter`. Automatically sets `--source framework`. |
| `--device <id>` | `-d` | auto-detected | Device ID or name |
| `--platform <type>` | `-p` | auto-detected | `android` or `ios` |
| `--lines <n>` | `-n` | `200` | Max lines to output |
| `--level <level>` | `-l` | `verbose` | Minimum log level: `verbose`, `debug`, `info`, `warn`, `error` |
| `--last <duration>` | `-t` | `5m` | Time window: `30s`, `1m`, `5m`, `10m`, `1h` |
| `--grep <pattern>` | `-g` | none | Filter logs containing this text (case-insensitive) |

## Examples

```bash
# Get all logs from the last 5 minutes
logpeek --app com.example.myapp

# Get only error-level logs
logpeek --app com.example.myapp --level error

# Search for specific text in logs
logpeek --app com.example.myapp --grep "network"

# Combine: errors mentioning "timeout" in last 2 minutes
logpeek --app com.example.myapp --level error --grep "timeout" --last 2m

# Get React Native JS console logs only (-f implies --source framework)
logpeek --app com.example.myapp -f react-native

# Get Flutter framework logs only
logpeek --app com.example.myapp -f flutter

# Get logs from specific iOS simulator
logpeek --app com.example.myapp -d "iPhone 16"

# Get last 30 seconds after reproducing a bug
logpeek --app com.example.myapp --last 30s

# Widen the window for intermittent issues
logpeek --app com.example.myapp --last 30m -n 500
```

## How It Works

### Log Formatting

Logs are automatically formatted for readability. Raw platform logs are cleaned up to a consistent format:

```
15:47:37 INF [Network] GET /api/cart → 200 OK (142ms)
15:47:37 WRN [Auth] Session token expired, refreshing...
15:47:39 ERR [Inventory] Connection timeout after 5000ms
```

Format: `<time> <level> [<category>] <message>`

### Android

- Queries `adb logcat` ring buffer with `-d` (dump and exit)
- Filters by app PID via `adb shell pidof <package>`
- Time window via logcat's `-T` flag
- If app crashed (no PID), automatically widens filter to include `AndroidRuntime` and `FATAL EXCEPTION` tags

### iOS Simulator

- Queries unified logging via `xcrun simctl spawn <udid> log show`
- Resolves actual process name from `CFBundleExecutable` (not bundle ID)
- Filters by predicate: `process == "<name>" OR subsystem == "<bundleId>"`
- If no logs found, widens to include `ReportCrash` and `SpringBoard` for crash data
- Strips `log show` header lines automatically

### React Native JS Logs

- On Android, `console.log` output appears in logcat under the `ReactNativeJS` tag
- On iOS, `console.log` appears under `com.facebook.react.runtime.JavaScript` in the new React Native runtime, or `ReactNativeJS` in older versions
- Use `-f react-native` to isolate framework logs

### Flutter Logs

- On Android, Flutter logs appear under the `flutter` tag
- On iOS, Flutter logs appear under the app process in unified logging
- Use `-f flutter` to isolate framework logs

## Source Filtering

| `--source` | What it captures |
|------------|-----------------|
| `all` (default) | Everything from the app process |
| `native` | Platform-only logs (excludes framework tags) |
| `framework` | Framework-specific: `ReactNativeJS` / `com.facebook.react.runtime.JavaScript` (RN), `flutter` (Flutter) |

When `--framework` is provided, `--source framework` is set automatically. You don't need to pass both.

## Debugging Workflow

### Step 1: Reproduce the issue

Have the user or agent trigger the bug on the device.

### Step 2: Grab logs

```bash
logpeek --app <bundle-id> --last 1m
```

Use `--last 1m` right after reproducing to minimize noise.

### Step 3: Narrow down

If too many results, filter:
- `--level error` for crashes and exceptions
- `--grep "keyword"` for specific errors
- `-f react-native` for framework-level issues
- `-s native` for platform-level issues

### Step 4: Act on findings

Use log output to identify the root cause. Common patterns:
- `FATAL EXCEPTION` / `java.lang.NullPointerException` -- Android crash
- `ReportCrash` -- iOS crash
- `ReactNativeJS` errors -- JS-side exceptions
- Network timeouts, auth failures -- API issues

## Platform Support

| Platform | Support |
|----------|---------|
| macOS | Android emulators + iOS simulators |
| Windows | Android emulators only |
| Linux | Android emulators only |

iOS simulator support requires macOS and Xcode Command Line Tools.

## Error Handling

- No booted device -> "Start an emulator or simulator first"
- adb not found -> "Install Android SDK Platform-Tools"
- xcrun not found (macOS) -> "Install Xcode Command Line Tools: xcode-select --install"
- No tools found (Windows/Linux) -> "Install adb"
- App not running -> automatically shows crash-related logs
- No logs found -> "No logs found for <app> in the last <duration>"
- Empty log buffer -> suggest widening `--last` window
