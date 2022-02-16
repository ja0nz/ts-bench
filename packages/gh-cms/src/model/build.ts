import { comp, filter, flatten, groupByObj, iterator, map, mapcat, multiplex, multiplexObj, push, sideEffect, trace, transduce, last } from "@thi.ng/transducers";
import { get_GHGM_IID, getGHGM_data_date, getGHGM_data_id, GitHubGrayMatter as GHW, CustomGrayMatter, get_GHGM_parsed, Issue, Repository, getGHGM_data_tags, getGHGM_data_route, get_GHGM_RID, setGHGM_data_tags, setGHGM_data_route, getGHGM_data } from "./api";
import grayMatter from "gray-matter";
import type { Fn, Fn0, FnAnyT, IObjectOf, Tuple } from "@thi.ng/api";
import { getInRepo } from "./io/queryRepo";
import { createIssue, createLabel, createMilestone } from "./io/net";
import type { Logger } from "../logger";
import type { BuildOpts } from "../cmd/build";

export function build(opts: BuildOpts, logger: Logger, far: Repository): Fn<GHW[], Fn0<Promise<any>>[]> {
    const farLabels = getInRepo(far, "labels")?.nodes ?? [];
    const farMilestones = getInRepo(far, "milestones")?.nodes ?? [];
    return (rows: GHW[]) => transduce(
        comp(
            sideEffect((i: GHW) => {
                const nI = get_GHGM_IID(i)
                if (opts.dryRun) logger.info(`DRY; ${nI ? "Update" : "Create"} issue: ${logger.pp(getGHGM_data(i))}`)
            }),
            // labels
            map<GHW, GHW>(i => {
                const lIDs = transduce(
                    comp(
                        mapcat(x => farLabels.filter(y => y.name === x)),
                        map(x => x.id)
                    ),
                    push(),
                    getGHGM_data_tags(i))
                const nT = setGHGM_data_tags(i, lIDs)
                return nT;
            }),
            // milestones
            map<GHW, GHW>(i => {
                const lIDs = transduce(
                    comp(
                        mapcat(x => farMilestones.filter(y => y.title === x)),
                        map(x => x.id)
                    ),
                    last(),
                    [getGHGM_data_route(i)])
                const nT = setGHGM_data_route(i, lIDs)
                return nT;
            }),
            map(i => createIssue(opts.repoUrl, i))
        ),
        push(),
        rows
    )
}

export function preBuild(opts: BuildOpts, logger: Logger, far: Repository): Fn<GHW[], Fn0<Promise<any>>[]> {
    const farLabels = getInRepo(far, "labels")?.nodes ?? [];
    const farMilestones = getInRepo(far, "milestones")?.nodes ?? [];
    return (rows: GHW[]) => transduce(
        comp(
            multiplex(
                comp(
                    mapcat<GHW, Tuple<string, 2>>(x => [get_GHGM_RID(x), getGHGM_data_tags(x)]), // wanted tags
                    filter(([_, tag]: Tuple<string, 2>) =>
                        farLabels.filter(x => x.name === tag).length ? false : true
                    ),
                    sideEffect((x: Tuple<string, 2>) => {
                        if (opts.dryRun) logger.info(`DRY; Create missing label: ${x[1]}`)
                    }),
                    //trace("label"),
                    map(([rID, tag]: Tuple<string, 2>) =>
                        createLabel(opts.repoUrl, rID, tag)
                    )),
                comp(
                    map<GHW, string>(getGHGM_data_route), // wanted milestone
                    filter((t: string) =>
                        farMilestones.filter(x => x.title === t).length ? false : true
                    ),
                    sideEffect((x: string) => {
                        if (opts.dryRun) logger.info(`DRY; Create missing milestone: ${x}`)
                    }),
                    //trace("milestone"),
                    map((x: string) => createMilestone(opts.repoUrl, x)),
                )
            ),
            flatten(),
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
                ghxs.reduce((prev, cur) => get_GHGM_IID(cur) || prev, "")
            ),
            // extract repoID (GH issues) over presorted common group
            repoID: map((ghxs: GHW[]) =>
                ghxs.reduce((prev, cur) => get_GHGM_RID(cur) || prev, "")
            ),
            // latest raw message
            raw: map((ghxs: GHW[]) =>
                ghxs.reduce((prev, cur) => (getGHGM_data_date(cur) > getGHGM_data_date(prev) ? cur : prev)).raw
            ),
            // latest message body
            parsed: map((ghxs: GHW[]) =>
                ghxs.reduce((prev, cur) => (getGHGM_data_date(cur) > getGHGM_data_date(prev) ? cur : prev)).parsed
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
                if (ghxs.length === 1 && get_GHGM_IID(ghxs[0])) return false;
                return true;
            }),
            // remote.date >= local.date -> skip
            filter((ghxs: GHW[]) => {
                const remote = ghxs.filter(x => get_GHGM_IID(x));
                const local = ghxs.filter(x => !get_GHGM_IID(x));
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


export function parseContentRows(far: Repository): FnAnyT<Issue[][], IObjectOf<GHW[]>> {
    const repoID = getInRepo(far, "id") ?? "";
    return (...rows: Issue[][]) =>
        transduce(
            comp(
                filter((x: Issue) => !!x.body ?? false),
                map((x: Issue) => ({
                    issueID: x.id,
                    repoID: repoID,
                    raw: x.body,
                    parsed: grayMatter(x.body as string) as CustomGrayMatter
                })),
                filter((x: GHW) => !get_GHGM_parsed(x).isEmpty)
            ),
            groupByObj({ key: getGHGM_data_id }),
            flatten(rows)
        )
}
