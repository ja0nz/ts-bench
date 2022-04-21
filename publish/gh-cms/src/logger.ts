import { ConsoleLogger, LogLevel } from '@thi.ng/logger';
import { inspect } from 'node:util';
import type { AppConfig } from './config.js';

/**
 * Logger module:
 * - format log message depending on theme and conditions
 */
export class Logger extends ConsoleLogger {
  constructor(protected config: AppConfig) {
    super(config.id, LogLevel[config.logLevel]);
  }

  dry(isDry: boolean, ...args: any[]) {
    this.level <= LogLevel.INFO &&
      this.log('INFO', isDry ? ['[dryrun]', ...args] : args);
  }

  important(...args: any[]) {
    this.level <= LogLevel.NONE && this.log('INFO', args);
  }

  pp(arg: object) {
    return inspect(arg, { colors: this.config.isColor  })
  }

  protected log(level: string, args: any[]) {
    let msg = `[${level}] ${this.config.id}: ${args.join(' ')}\n`;
    const theme = this.config.theme;
    switch (level) {
      case 'INFO':
        msg = theme.lightYellow(msg);
        break;
      case 'WARN':
        msg = theme.lightRed(msg);
        break;
      case 'SEVERE':
        msg = theme.red(msg);
        break;
      default:
    }
    process.stderr.write(msg);
  }
}
