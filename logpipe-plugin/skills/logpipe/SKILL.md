---
name: logpipe
description: Collect device logs from Android emulators and iOS simulators for debugging mobile apps (React Native, Flutter, native)
---

# logpipe

Use logpipe to collect device logs when debugging mobile app issues -- crashes, errors, unexpected behavior.

## When to use

- The app crashed or threw an exception
- A feature is not working as expected
- You need to see what the app logged during a specific action
- After a failed driftx comparison or interaction, to understand why

## Commands

### Collect logs (default command)

```bash
npx logpipe --app <bundle-id-or-package-name> [options]
```

| Flag | Default | Description |
|------|---------|-------------|
| `--app` | required | Bundle ID (iOS) or package name (Android) |
| `--source` | `all` | `all`, `native`, or `framework` |
| `--framework` | auto | `react-native` or `flutter` |
| `-d, --device` | auto | Device ID or name |
| `--platform` | auto | `android` or `ios` |
| `--lines` | `200` | Max lines to output |
| `--level` | `verbose` | `verbose`, `debug`, `info`, `warn`, `error` |
| `--last` | `5m` | Time window: `30s`, `1m`, `5m`, `1h` |
| `--grep` | none | Filter logs containing this text (case-insensitive) |

### Examples

```bash
# Get all logs from the last 5 minutes
npx logpipe --app com.example.myapp

# Get only error-level logs
npx logpipe --app com.example.myapp --level error

# Get React Native JS console logs only
npx logpipe --app com.example.myapp --source framework --framework react-native

# Get logs from specific iOS simulator
npx logpipe --app com.example.myapp --device "iPhone 16"

# Get last 1 minute of logs
npx logpipe --app com.example.myapp --last 1m

# Filter logs containing "network"
npx logpipe --app com.example.myapp --grep "network"

# Combine: errors mentioning "timeout" in last 2 minutes
npx logpipe --app com.example.myapp --level error --grep "timeout" --last 2m
```

### Other commands

```bash
npx logpipe devices    # List booted devices
npx logpipe doctor     # Check prerequisites (adb, xcrun)
```

## Tips

- If the app crashed, logpipe automatically widens the search to include crash reporters
- On Android, React Native `console.log` output appears under the `ReactNativeJS` tag
- Use `--level error` to quickly find crashes and exceptions
- Use `--last 1m` to narrow the window after reproducing a bug
