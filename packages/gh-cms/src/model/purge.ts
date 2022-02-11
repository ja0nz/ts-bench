import type { Fn0, FnAnyT } from "@thi.ng/api"
import { defGetter, defGetterUnsafe } from "@thi.ng/paths"
import { comp, trace, flatten, sideEffect, map, filter, transduce, push } from "@thi.ng/transducers"
import type { PurgeOpts } from "../cmd/purge"
import type { Logger } from "../logger"
import type { Milestone, Label, Issue } from "./api"
import { deleteLabel, mutateStrRepo } from "./io/mutateRepo"
import { qlrequest, rerequest } from "./io/net"

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
                map(x => ({
                    id: defGetter<PIn, "id">(["id"])(x),
                    number: defGetterUnsafe<number | undefined>(["number"])(x) // ok to be unsafe here
                })),
                map(x => x.number === undefined
                    ? deleteLabel(x.id) // label
                    : { milestone_number: x.number } // milestone
                ),
                map(x => typeof x === 'string'
                    ? () => qlrequest(opts.repoUrl)(mutateStrRepo(x)) // label
                    : () => rerequest(opts.repoUrl)( // milestone
                        'DELETE /repos/{owner}/{repo}/milestones/{milestone_number}',
                        x as any
                    )
                )),
            push(),
            flatten<PIn[], PIn>(rows)
        )
    }
}
