import type { DeviceInfo, Shell } from '../types.js';
import { discoverAndroidDevices } from './android.js';
import { discoverIosDevices } from './ios.js';
import { getLogger } from '../logger.js';

export class DeviceDiscovery {
  private shell: Shell;

  constructor(shell: Shell) {
    this.shell = shell;
  }

  async list(): Promise<DeviceInfo[]> {
    const results: DeviceInfo[] = [];
    const logger = getLogger();

    try {
      const android = await discoverAndroidDevices(this.shell);
      results.push(...android);
    } catch (err) {
      logger.debug({ err }, 'Android discovery failed');
    }

    try {
      const ios = await discoverIosDevices(this.shell);
      results.push(...ios);
    } catch (err) {
      logger.debug({ err }, 'iOS discovery failed');
    }

    return results;
  }
}
