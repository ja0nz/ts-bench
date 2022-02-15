import { comp, cat, filter, flatten, groupByObj, iterator, map, mapcat, multiplex, multiplexObj, push, reduce, sideEffect, sideEffect, trace, transduce } from "@thi.ng/transducers";
import { get_GHGM_ID, getGHGM_data_date, getGHGM_data_id, GitHubGrayMatter as GHW, CustomGrayMatter, get_GHGM_body, Issue, Repository, getGHGM_data_tags, Label, getGHGM_data_route } from "./api";
import grayMatter from "gray-matter";
import type { Fn, Fn0, IObjectOf } from "@thi.ng/api";
import { getInRepo } from "./io/queryRepo";
import { createLabel, createMilestone } from "./io/mutateRepo";
import type { Logger } from "../logger";
import type { BuildOpts } from "../cmd/build";

/*
 *
     TODO
     - [X] compare them by 'date'
     - diff labels && are created
     - diff milestones && are created
     - new content: push to issues
     - mod content: modify issue by ID
 *
 */


export function build(opts: BuildOpts, logger: Logger, far: Repository): Fn<GHW[], Fn0<Promise<any>>[]> {
    const farLabels = getInRepo(far, "labels")?.nodes ?? [];
    const farMilestones = getInRepo(far, "milestones")?.nodes ?? [];
    const repoID = getInRepo(far, "id") ?? "";
    return (rows: GHW[]) => transduce(
        comp(
            map(x => x),
        ),
        push(),
        rows
    )
}

export function preBuild(opts: BuildOpts, logger: Logger, far: Repository): Fn<GHW[], Fn0<Promise<any>>[]> {
    const farLabels = getInRepo(far, "labels")?.nodes ?? [];
    const farMilestones = getInRepo(far, "milestones")?.nodes ?? [];
    const repoID = getInRepo(far, "id") ?? "";
    return (rows: GHW[]) => transduce(
        comp(
            multiplex(
                comp(
                    mapcat<GHW, string>(getGHGM_data_tags), // wanted tags
                    filter((t: string) => {
                        const i = farLabels.filter(x => x.name !== t)
                        return i.length ? true : false;
                    }),
                    sideEffect((x: string) => {
                        if (opts.dryRun) logger.info(`DRY; Create missing label: ${x}`)
                    }),
                    trace("label"),
                    map((x: string) => createLabel(opts.repoUrl, repoID, x)),
                ),
                comp(
                    map<GHW, string>(getGHGM_data_route), // wanted milestone
                    filter((t: string) => {
                        const i = farMilestones.filter(x => x.title !== t)
                        return i.length ? true : false;
                    }),
                    sideEffect((x: string) => {
                        if (opts.dryRun) logger.info(`DRY; Create missing milestone: ${x}`)
                    }),
                    trace("milestone"),
                    map((x: string) => createMilestone(opts.repoUrl, x)),
                )
            ),
            cat(),
            filter(Boolean)
        ),
        push(),
        rows
    )
}

export function latestContentRows(entries: IterableIterator<GHW[]>): GHW[] {
    return transduce(
        // map/reduce a new GHWrappedGrayMatterFile
        multiplexObj({
            // extract issueID (GH issues) over presorted common group
            issueID: map((ghxs: GHW[]) =>
                ghxs.reduce((prev, cur) => get_GHGM_ID(cur) || prev, "")
            ),
            // latest message body
            body: map((ghxs: GHW[]) =>
                ghxs.reduce((prev, cur) => (getGHGM_data_date(cur) > getGHGM_data_date(prev) ? cur : prev)).body
            )
        }),
        push(),
        entries
    );
}

export function preFilter(entries: IObjectOf<GHW[]>): IterableIterator<GHW[]> {
    return iterator(
        comp(
            // if remote entry has no matching local id -> skip
            filter((ghxs: GHW[]) => {
                if (ghxs.length === 1 && get_GHGM_ID(ghxs[0])) return false;
                return true;
            }),
            // remote.date >= local.date -> skip
            filter((ghxs: GHW[]) => {
                const remote = ghxs.filter(x => get_GHGM_ID(x));
                const local = ghxs.filter(x => !get_GHGM_ID(x));
                // Cond1: if no remote content continue
                if (!remote.length) return true;
                const newer = local.filter(x => getGHGM_data_date(x) > getGHGM_data_date(remote[0]));
                // Cond2: if local is newer than remote continue
                if (newer.length) return true;
                return false;
            }),
        ),
        Object.values(entries)
    )
}


export function parseContentRows(...rows: Issue[][]): IObjectOf<GHW[]> {
    return transduce(
        comp(
            filter((x: Issue) => !!x.body ?? false),
            map((x: Issue) => ({
                id: x.id,
                body: grayMatter(x.body as string) as CustomGrayMatter
            })),
            filter((x: GHW) => !get_GHGM_body(x).isEmpty)
        ),
        groupByObj({ key: getGHGM_data_id }),
        flatten(rows)
    )
}

