import {
  comp,
  reducer,
  partition,
  filter,
  flatten,
  groupByObj,
  map,
  mapcat,
  multiplex,
  multiplexObj,
  push,
  sideEffect,
  transduce,
  last,
  interleave,
  scan,
  maxCompare,
  distinct,
} from '@thi.ng/transducers';
import {
  get_CMS_id,
  get_parsed_date,
  get_parsed_id,
  GH_CMS,
  CustomGrayMatter,
  get_CMS_parsed,
  Issue,
  Repository,
  get_parsed_tags,
  get_parsed_route,
  get_CMS_rid,
  set_tags,
  set_route,
  get_parsed_data,
  get_CMS_state,
  get_parsed_title,
  get_parsed_state,
  set_CMS_id,
  set_CMS_state,
  set_title,
  Effect,
} from './api';
import grayMatter from 'gray-matter';
import type { Fn, FnAnyT, IObjectOf } from '@thi.ng/api';
import { getInRepo } from './io/queryRepo';
import {
  modifyState,
  createIssue,
  createLabel,
  createMilestone,
} from './io/net';
import type { Logger } from '../logger';
import type { BuildOpts } from '../cmd/build';

type WrapIssue = { issue: Issue };
export function postBuild(
  opts: BuildOpts,
  logger: Logger,
  build: IObjectOf<WrapIssue>[]
): Fn<GH_CMS[], Effect[]> {
  // id, title, state
  const farBuild: Issue[] = transduce(
    comp(
      mapcat<IObjectOf<WrapIssue>, WrapIssue>((b) => Object.values(b)),
      map((b) => b.issue)
    ),
    push(),
    build
  );
  return (rows: GH_CMS[]) =>
    transduce(
      comp(
        // fill in missing/regenerated values
        // matching by titles may be not enough - only ID is uniqe. But I don't want to parse the doc again
        // and go through all the loops
        map((i: GH_CMS) => {
          const match = farBuild.filter((x) => x.title === get_parsed_title(i));
          if (match.length) {
            // new id
            i = set_CMS_id(i, match[0].id);
            // new state
            i = set_CMS_state(i, match[0].state);
          }
          return i;
        }),
        // filter rows which need preBuild
        filter((r: GH_CMS) => {
          const p = get_parsed_state(r);
          const i = get_CMS_state(r);
          if (p === true && i === 'OPEN') return false;
          if (p === false && i === 'CLOSED') return false;
          return true;
        }),
        sideEffect((i: GH_CMS) => {
          const action = get_parsed_state(i) ? 'Draft' : 'Publish';
          if (opts.dryRun)
            logger.info(`DRY; ${action} issue title: ${get_parsed_title(i)}`);
        }),
        map((i) => [
          get_CMS_id(i),
          get_parsed_state(i) === false ? 'CLOSED' : 'OPEN',
        ]),
        map(([id, state]) => modifyState(opts.repoUrl, id, state))
      ),
      push(),
      rows
    );
}

export function build(
  opts: BuildOpts,
  logger: Logger,
  far: Repository
): Fn<GH_CMS[], Effect[]> {
  const farLabels = getInRepo(far, 'labels')?.nodes ?? [];
  const farMilestones = getInRepo(far, 'milestones')?.nodes ?? [];
  return (rows: GH_CMS[]) =>
    transduce(
      comp(
        sideEffect((i: GH_CMS) => {
          const nI = get_CMS_id(i);
          if (opts.dryRun)
            logger.info(
              `DRY; ${nI ? 'Update' : 'Create'} issue: ${logger.pp(
                get_parsed_data(i)
              )}`
            );
        }),
        // labels -> ids
        map<GH_CMS, GH_CMS>((i) => {
          const lIDs = transduce(
            comp(
              mapcat((x) => farLabels.filter((y) => y.name === x)),
              map((x) => x.id)
            ),
            push(),
            get_parsed_tags(i) ?? []
          );
          const nT = set_tags(i, lIDs);
          return nT;
        }),
        // milestone -> id
        map<GH_CMS, GH_CMS>((i) => {
          const lIDs = transduce(
            comp(
              mapcat((x) => farMilestones.filter((y) => y.title === x)),
              map((x) => x.id)
            ),
            last(),
            [get_parsed_route(i)]
          );
          const nT = set_route(i, lIDs ?? "");
          return nT;
        }),
        // state
        map<GH_CMS, GH_CMS>((i) => {
          const pState = get_parsed_state(i) === false ? 'CLOSED' : 'OPEN';
          const nT = set_CMS_state(i, pState);
          return nT;
        }),
        sideEffect((i: GH_CMS) => {
          const nI = get_CMS_id(i);
          if (opts.dryRun)
            logger.info(
              `DRY; ${nI ? 'Update' : 'Create'} issue: ${logger.pp(
                get_parsed_data(i)
              )}`
            );
        }),
        map((i) => createIssue(opts.repoUrl, i))
      ),
      push(),
      rows
    );
}

export function preBuild(
  opts: BuildOpts,
  logger: Logger,
  far: Repository
): Fn<GH_CMS[], Effect[]> {
  const farLabels = getInRepo(far, 'labels')?.nodes ?? [];
  const farMilestones = getInRepo(far, 'milestones')?.nodes ?? [];
  return (rows: GH_CMS[]) =>
    transduce(
      comp(
        multiplex<GH_CMS, Effect, Effect>(
          comp(
            // flat out tags
            mapcat<GH_CMS, string>((x: GH_CMS) => {
              const parsedTags = get_parsed_tags(x);
              if (parsedTags === undefined) return [];
              return [...interleave(get_CMS_rid(x), parsedTags)];
            }),
            partition<string>(2),
            filter(([_, tag]: string[]) =>
              farLabels.filter((x) => x.name === tag).length ? false : true
            ),
            distinct({ key: x => x[1] }),
            sideEffect((x: string[]) => {
              if (opts.dryRun)
                logger.info(`DRY; Create missing label: ${x[1]}`);
            }),
            map(([rID, tag]: string[]) => createLabel(opts.repoUrl, rID, tag))
          ),
          comp(
            // wanted milestone
            mapcat<GH_CMS, string>((x: GH_CMS) => {
              const mileStone = get_parsed_route(x);
              if (mileStone == undefined) return [];
              return [mileStone];
            }),
            filter((t: string) =>
              farMilestones.filter((x) => x.title === t).length ? false : true
            ),
            sideEffect((x: string) => {
              if (opts.dryRun)
                logger.info(`DRY; Create missing milestone: ${x}`);
            }),
            map((x: string) => createMilestone(opts.repoUrl, x))
          )
        ),
        flatten<Effect[]>(),
        filter((x) => x !== undefined),
      ),
      push(),
      rows
    );
}

function reduceToLatest(xs: GH_CMS[]): GH_CMS {
  return transduce(
    comp(
      multiplexObj<GH_CMS, { id: string; rest: GH_CMS }>({
        id: comp(
          map(get_CMS_id),
          scan(
            reducer(
              () => '',
              (acc, x) => (acc ? acc : x)
            )
          )
        ),
        rest: scan(
          maxCompare(
            () => ({ parsed: { data: { date: new Date(0) } } }),
            (a, b) => (get_parsed_date(a) > get_parsed_date(b) ? 1 : -1)
          )
        ),
      }),
      // fold to single GH_CMS
      map((x: { id: string; rest: GH_CMS }) => set_CMS_id(x.rest, x.id))
    ),
    last(),
    xs
  );
}

export function latestContentRows(entries: IObjectOf<GH_CMS[]>): GH_CMS[] {
  return transduce(
    comp(
      // if remote entry has no matching local id -> skip
      filter((ghxs: GH_CMS[]) => {
        if (ghxs.length === 1 && get_CMS_id(ghxs[0])) return false;
        return true;
      }),
      // remote.date >= local.date -> skip
      filter((ghxs: GH_CMS[]) => {
        const remote = ghxs.filter((x) => get_CMS_id(x));
        const local = ghxs.filter((x) => !get_CMS_id(x));
        // Cond1: if no remote content continue
        if (!remote.length) return true;
        //-
        const newer = local.filter(
          (x) => get_parsed_date(x) > get_parsed_date(remote[0])
        );
        // Cond2: if local is newer than remote continue
        if (newer.length) return true;
        //-
        const undef = local.filter(
          (x) =>
            (get_parsed_date(x) === undefined) ||
            (get_parsed_date(remote[0]) === undefined)
        );
        // Cond3: if local or remote has no date at all
        if (undef.length) return true;
        //-
        return false;
      }),
      map(reduceToLatest),
      // if title is not set use id
      map((gh: GH_CMS) => {
        const title = get_parsed_title(gh);
        if (title === undefined || title.length === 0)
          return set_title(gh, get_parsed_id(gh));
        return gh;
      })
    ),
    push(),
    Object.values(entries)
  );
}

export function parseContentRows(
  far: Repository
): FnAnyT<Issue[], IObjectOf<GH_CMS[]>> {
  const repoID = getInRepo(far, 'id') ?? '';
  return (...rows) =>
    transduce(
      comp(
        filter((x: Issue) => !!x.body ?? false),
        map<Issue, GH_CMS>((x: Issue) => ({
          issue: { ...x, rid: repoID },
          raw: x.body ?? '',
          parsed: grayMatter(x.body as string) as CustomGrayMatter,
        })),
        filter((x: GH_CMS) => !get_CMS_parsed(x).isEmpty)
      ),
      groupByObj({ key: get_parsed_id }),
      flatten(rows)
    );
}
