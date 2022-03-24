import type { IObjectOf } from '@thi.ng/api';
import type { CommandSpec } from './api';
import { buildCmd } from './cmd/build';
import { purgeCmd } from './cmd/purge';

/**
 * Command registry module:
 * - simple key,value registry for available main commands
 */
export class CommandRegistry {
  registry: IObjectOf<CommandSpec<any>> = {
    build: buildCmd,
    purge: purgeCmd,
  };
}
