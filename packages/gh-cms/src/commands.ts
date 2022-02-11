import type { IObjectOf } from "@thi.ng/api";
import type { CommandSpec } from "./api";
import { BUILD } from "./cmd/build";
import { PURGE } from "./cmd/purge";

/**
 * Command registry module:
 * - simple key,value registry for available main commands
 */
export class CommandRegistry {
  registry: IObjectOf<CommandSpec<any>> = {
    build: BUILD,
    purge: PURGE
  };
}
