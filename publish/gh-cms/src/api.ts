import type { Fn } from '@thi.ng/api';
import type { Args } from '@thi.ng/args';
import { defGetter } from '@thi.ng/paths';
import { dirname, isAbsolute, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { AppConfig } from './config.js';
import { readJSON } from './io/fs.js';
import type { Logger } from './logger';
import type Process from 'node:process';
import { assert } from '@thi.ng/errors';

let _dirname: string;
try {
  _dirname = __dirname;
} catch (e) {
  // ES6 compat
  _dirname = dirname(fileURLToPath(import.meta.url));
}

// enums
export const INSTALL_DIR = resolve(join(_dirname, '..'));
export const PKG = readJSON(join(INSTALL_DIR, 'package.json'));
export const REQUIRED = '<required>';
export const CMD_HEADER = `
       .⠴⠿⠋      │
    ⠹⣶⣄:         │
       :⣠⣶⠿⠋     │ ${PKG.name} ${PKG.version}
    ___:___      │
   |_______|     │ ${PKG.description}
    |     |      │
     \\___/       │
`;

// process.env
const getEnv = (env: string) =>
  defGetter<typeof Process, 'env'>(['env'])(process)[env];
export function ensureEnv(id: string, env: string, val: string) {
  assert(val !== REQUIRED, `missing required '${id}' or '${env}'`);
}

const CP = getEnv('CONTENT_PATH') ?? '';
export const CONTENT_PATH = !isAbsolute(CP) ? join(process.cwd(), CP) : CP;
export const LOG_LEVEL = getEnv('LOG_LEVEL');
export const REPO_URL = getEnv('REPO_URL');
export const NO_COLOR = getEnv('NO_COLOR');
export const GH_TOKEN = getEnv('GH_TOKEN'); // github.com -> Settings -> Developer Settings -> Personal access tokens -> token for public repo

// MD2X variables
export const MDENV = {
  MD2ID: getEnv('MD2ID') ?? 'id',
  MD2DATE: getEnv('MD2DATE') ?? 'date',
  MD2TITLE: getEnv('MD2TITLE') ?? 'title',
  MD2LABELS: getEnv('MD2LABELS') ?? 'labels',
  MD2MILESTONE: getEnv('MD2MILESTONE') ?? 'milestone',
  MD2STATE: getEnv('MD2STATE') ?? 'state'
}
/*
 * ActionObj type
 * qlToken -> comp(qlTokenI(), qlTokenR, repoQ)(qlToken)
 * gm2valueFn -> GH_CMS / GrayMatter only! -> value
 * gmToken -> keys that needs to be present
 * issue2valueFn -> parsedIssue -> value
 */
export type ActionObj = {
  issue2valueFn: Fn<any, any>;
  gm2valueFn: Fn<any, any>;
  qlToken: string;
  gmToken: string;
};
export type DGraphFields = string | keyof typeof MDENV;
export type MDActionMap = Map<DGraphFields, ActionObj[]>

// process.argv
const argv = defGetter<typeof Process, 'argv'>(['argv'])(process);
const getArgv = (no: number) => argv.slice(2)[no];
export const MAIN_CMD = getArgv(0);
export const REST_CMDS: string[] = argv.slice(1);

// interfaces
export interface CLIOpts {
  /**
   * Respository URL to fetch/write issues
   */
  repoUrl: string;
}

export interface CommandSpec<T extends CLIOpts> {
  /**
   * Actual command implementation
   */
  fn: Fn<CommandCtx<T>, Promise<void>>;
  /**
   * Command specific CLI arg specs
   */
  opts: Args<T>;
  /**
   * Usage string for command overview.
   */
  usage: string;
}

export interface CommandCtx<T extends CLIOpts> {
  /**
   * The 'main' command to run, seperated into fn, opts and docstring
   */
  cmd: CommandSpec<T>;
  /**
   * The config defined upfront
   */
  config: AppConfig;
  /**
   * The logger defined upfront
   */
  logger: Logger;
  /**
   * Parsed cmd line arguments like --dry-run, etc
   */
  opts: T;
  /**
   * Leftovers after parsing, not really needed passed anyway
   */
  rest: string[];
}

export interface DryRunOpts {
  dryRun: boolean;
}
