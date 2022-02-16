import type { Fn0, FnAnyT } from "@thi.ng/api"
import { defGetter, defGetterUnsafe } from "@thi.ng/paths"
import { comp, flatten, sideEffect, map, filter, transduce, push } from "@thi.ng/transducers"
import type { PurgeOpts } from "../cmd/purge"
import type { Logger } from "../logger"
import type { Milestone, Label, Issue } from "./api"
import { deleteLabel, deleteMilestone } from "./io/net"

type PIn = Label | Milestone

export function purge(opts: PurgeOpts, logger: Logger): FnAnyT<PIn[], Fn0<Promise<any>>[]> {
    return (...rows) => {
        return transduce(
            comp(
                // throw all out which have an related issue
                filter((x: PIn) => {
                    const i: Issue[] | undefined = defGetter<PIn, "issues", "nodes">(["issues", "nodes"])(x);
                    return i && i.length ? false : true;
                }),
                sideEffect((x: PIn) => {
                    // number only exits on Milestones hence unsafe
                    const num = defGetterUnsafe<PIn>(["number"])(x)
                    if (opts.dryRun) logger.info(`DRY; Subject to removal, ${num ? "Milestone" : "Label"} ${logger.pp(x as object)}`)
                }),
                map((x: PIn) => ({
                    id: defGetter<PIn, "id">(["id"])(x),
                    number: defGetterUnsafe<number | undefined>(["number"])(x) // ok to be unsafe here
                })),
                map(x => x.number === undefined
                    ? deleteLabel(opts.repoUrl, x.id)
                    : deleteMilestone(opts.repoUrl, x.number)
                )
            ),
            push(),
            flatten<PIn[], PIn>(rows)
        )
    }
}
