import { seconds } from "@thi.ng/strings";
import { CLIOpts, CommandCtx, CommandSpec, ensureEnv } from "./api";
import type { AppConfig } from "./config";
import type { Logger } from "./logger";
import type { ArgParser } from "./parser";

/**
 * Ignition module:
 * - ensure <required> params are set
 * - dispatching previously selected fn with parser arguments
 * - measuring time consumption
 */
export class AppContext<T extends CLIOpts> implements CommandCtx<T> {
    cmd!: CommandSpec<T>;
    opts!: T;
    rest!: string[];

    constructor(
        public config: AppConfig,
        public logger: Logger,
        public args: ArgParser
    ) { }

    async start() {
        const ctx = this.args.ctx!;
        this.cmd = ctx.cmd!;
        this.rest = ctx.rest!;
        this.opts = ctx.opts!;
        // Guards
        ensureEnv("--repo-url", "env.REPO_URL", this.opts.repoUrl);
        // Perf start
        const t0 = Date.now();
        await this.cmd.fn(this);
        // Perf end
        this.logger.important(
            `completed in ${seconds((Date.now() - t0) / 1000)}`
        );
        return true;
    }
}
