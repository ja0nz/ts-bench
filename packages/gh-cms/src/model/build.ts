import { comp, filter, flatten, groupByObj, iterator, map, mapcat, multiplexObj, push, reduce, sideEffect, trace, transduce } from "@thi.ng/transducers";
import { get_GHGM_ID, getGHGM_data_date, getGHGM_data_id, GitHubGrayMatter as GHW, CustomGrayMatter, get_GHGM_body, Issue, Repository, getGHGM_data_tags } from "./api";
import grayMatter from "gray-matter";
import type { Fn, IObjectOf } from "@thi.ng/api";
import { getInRepo } from "./io/queryRepo";



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


export function genWorkMap(far: Repository): Fn<GHW[], any> {
    const farLabels = getInRepo(far, "labels")?.nodes ?? [];
    const farMilestones = getInRepo(far, "milestones")?.nodes ?? [];
    return (rows: GHW[]) => transduce(
        multiplexObj({
            missingLabels: comp(
                mapcat(getGHGM_data_tags),
                //filter(),
                trace()
            )
        }),
        push(),
        rows
    )
}
