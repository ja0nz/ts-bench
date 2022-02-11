import { Args, string } from "@thi.ng/args";
import type { LogLevelName } from "@thi.ng/logger";
import {
  defFormatPresets,
  FMT_ANSI16,
  FMT_NONE,
  FormatPresets,
  StringFormat
} from "@thi.ng/text-format";
import { PKG, CLIOpts, LOG_LEVEL, REPO_URL, NO_COLOR, REQUIRED } from "./api";

/**
 * Config module:
 * - Defines the universal 'common' input interface
 * - Theming & output coloring
 * - loglevel
 * - setting the id == PKG.name
 */
export class AppConfig {
  id: string;
  logLevel: LogLevelName;
  fmt!: StringFormat;
  theme!: FormatPresets;
  specs: Args<CLIOpts>;

  constructor() {
    this.id = PKG.name;
    this.logLevel = <LogLevelName>LOG_LEVEL || "INFO";
    this.specs = {
      repoUrl: string({
        alias: "u",
        hint: "URL",
        default: REPO_URL || REQUIRED,
        desc: "'https://github.com/x/x' URL to push issues",
        group: "common"
      })
    };
    this.setFormat(NO_COLOR ? FMT_NONE : FMT_ANSI16);
  }

  get isColor() {
    return this.fmt !== FMT_NONE;
  }

  setFormat(fmt: StringFormat) {
    this.fmt = fmt;
    this.theme = defFormatPresets(fmt);
  }
}
