import { ConsoleLogger, LogLevel } from "@thi.ng/logger";
import { inspect } from "node:util";
import type { AppConfig } from "./config.js";

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
      this.log(LogLevel.INFO, isDry ? ["[dryrun]", ...args] : args);
  }

  important(...args: any[]) {
    this.level <= LogLevel.NONE && this.log(LogLevel.INFO, args);
  }

  pp(arg: object) {
    return inspect(arg, { colors: this.config.isColor });
  }

  protected log(level: LogLevel, args: any[]) {
    let msg = `[${LogLevel[level]}] ${this.config.id}: ${args.join(" ")}\n`;
    const theme = this.config.theme;
    switch (level) {
      case LogLevel.INFO:
        msg = theme.lightYellow(msg);
        break;
      case LogLevel.WARN:
        msg = theme.lightRed(msg);
        break;
      case LogLevel.SEVERE:
        msg = theme.red(msg);
        break;
      default:
    }
    process.stderr.write(msg);
  }
}
