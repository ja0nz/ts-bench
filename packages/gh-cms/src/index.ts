#!/usr/bin/env node

import { defSystem } from "@thi.ng/system";
import { config } from "dotenv";
import { CommandRegistry } from "./commands";
import { AppConfig } from "./config";
import { AppContext } from "./context";
import { Logger } from "./logger";
import { ArgParser } from "./parser";

config();
interface App {
  config: AppConfig;
  logger: Logger;
  commands: CommandRegistry;
  args: ArgParser;
  ctx: AppContext<any>;
}

(async () => {
  // main app
  const APP = defSystem<App>({
    config: {
      factory: () => new AppConfig()
    },
    logger: {
      factory: ({ config }) => new Logger(config),
      deps: ["config"]
    },
    commands: {
      factory: () => new CommandRegistry()
    },
    args: {
      factory: ({ logger, config, commands }) => new ArgParser(logger, config, commands),
      deps: ["config", "logger", "commands"]
    },
    ctx: {
      factory: ({ logger, config, args }) =>
        new AppContext(config, logger, args),
      deps: ["config", "logger", "args"],
    },
  });
  try {
    await APP.start();
  } catch (e) {
    APP.components.logger.severe((<Error>e).message);
    // console.log(e);
  }
})();
