import type { Shell, PrerequisiteCheck } from '../types.js';
import pc from 'picocolors';

interface PrerequisiteSpec {
  name: string;
  cmd: string;
  args: string[];
  required: boolean;
  versionParser: (stdout: string) => string;
  fix: string;
}

const PREREQUISITES: PrerequisiteSpec[] = [
  {
    name: 'node',
    cmd: 'node',
    args: ['--version'],
    required: true,
    versionParser: (stdout) => stdout.trim().replace(/^v/, ''),
    fix: 'Install Node.js >= 18 from https://nodejs.org',
  },
  {
    name: 'adb',
    cmd: 'adb',
    args: ['--version'],
    required: false,
    versionParser: (stdout) => {
      const match = stdout.match(/(\d+\.\d+\.\d+)/);
      return match?.[1] ?? 'unknown';
    },
    fix: 'Install Android SDK Platform-Tools: https://developer.android.com/studio',
  },
  {
    name: 'xcrun',
    cmd: 'xcrun',
    args: ['--version'],
    required: false,
    versionParser: (stdout) => stdout.trim(),
    fix: 'Install Xcode Command Line Tools: xcode-select --install',
  },
];

async function checkOne(spec: PrerequisiteSpec, shell: Shell): Promise<PrerequisiteCheck> {
  try {
    const { stdout } = await shell.exec(spec.cmd, spec.args, { timeout: 5000 });
    return { name: spec.name, required: spec.required, available: true, version: spec.versionParser(stdout) };
  } catch (err) {
    return { name: spec.name, required: spec.required, available: false, error: err instanceof Error ? err.message : String(err), fix: spec.fix };
  }
}

export async function runDoctor(shell: Shell): Promise<void> {
  const checks = await Promise.all(PREREQUISITES.map((spec) => checkOne(spec, shell)));

  for (const check of checks) {
    if (check.available) {
      console.log(`${pc.green('\u2713')} ${check.name} ${pc.dim(check.version ?? '')}`);
    } else {
      const icon = check.required ? pc.red('\u2717') : pc.yellow('!');
      console.log(`${icon} ${check.name} -- ${check.fix}`);
    }
  }
}
