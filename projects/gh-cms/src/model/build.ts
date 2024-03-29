import type { graphql } from "@octokit/graphql/dist-types/types";
import type { Fn } from "@thi.ng/api";
import { comp as c } from "@thi.ng/compose";
import { DGraph } from "@thi.ng/dgraph";
import { assert } from "@thi.ng/errors";
import { defGetter } from "@thi.ng/paths";
import {
  assocMap,
  cat,
  comp,
  distinct,
  filter,
  flatten,
  isReduced,
  iterator,
  last,
  map,
  mapcat,
  multiplex,
  partition,
  push,
  Reduced,
  reducer,
  scan,
  step,
  str,
  transduce,
} from "@thi.ng/transducers";
import {
  Combined,
  CreateIssue,
  CreateIssueQL,
  CreateLabel,
  CreateLabelQL,
  CreateMilestone,
  getBodyI,
  getCreateI,
  getEndCursor,
  getHasNextPage,
  getIdI,
  getIdL,
  getLabelsI,
  getMilestoneI,
  getNameL,
  getNodes,
  getR,
  getStateI,
  getTitleI,
  getTitleM,
  getUpdateI,
  Issue,
  Label,
  Milestone,
  mutateI,
  mutateL,
  mutateRestM,
  queryBodyI,
  queryI,
  queryL,
  queryM,
  queryMilestoneI,
  queryNameL,
  queryR,
  queryStateI,
  queryTitleI,
  queryTitleM,
  R1,
  R2,
  UpdateIssue,
  UpdateIssueQL,
} from "gh-cms-ql";
import grayMatter, { GrayMatterFile } from "gray-matter";
import type { ActionObject, DGraphFields, MDActionMap, MDENV } from "../api.js";
import type { BuildContent, Either, OctoR, PreBuildContent } from "./api";

const indexdIdentifier = /(?<=\[)(\d+?)(?=])/g;
const getFrontMatterValue = (
  key: string,
): Fn<GrayMatterFile<string>, unknown> => defGetter(["data", key]);

/*
 * IN: { "MD2ID": string, ... }
 * OUT: DGraph<string> (MD2TITLE, MD2TITLE[2], draft)
 */
export function buildDag(env: typeof MDENV): DGraph<DGraphFields> {
  const g = new DGraph<DGraphFields>();

  type Row = [string, string];
  const out: IterableIterator<Row> = iterator(
    comp(
      mapcat<Row, Row>(([k, v]) => v.split(",").map((v1) => [k, v1])),
      mapcat(([k, v]) => {
        const indexs = v.match(indexdIdentifier);
        const returnValue: Row[] = [];
        if (indexs !== null) {
          assert(indexs.length < 2, `Only one index level allowed: ${v}`);
          const [v1] = v.split("[");
          returnValue.push([v, v1]);
        }

        returnValue.push([k, v]);
        return returnValue;
      }),
    ),
    Object.entries(env),
  );
  for (const row of out) {
    g.addDependency(...row);
  }

  return g;
}

const knownKeys: Record<string, Partial<ActionObject>> = {
  MD2TITLE: {
    qlToken: queryTitleI,
    issue2valueFn: getTitleI,
  },
  MD2LABELS: {
    qlToken: queryL()(queryNameL),
    issue2valueFn: getLabelsI,
  },
  MD2MILESTONE: {
    qlToken: queryMilestoneI,
    issue2valueFn: c(
      (m: Milestone | undefined) => m && getTitleM(m),
      getMilestoneI,
    ),
  },
  MD2STATE: {
    qlToken: queryStateI,
    issue2valueFn: getStateI,
  },
};

function stepTree(
  acc: MDActionMap,
  key: DGraphFields,
  g: DGraph<DGraphFields>,
): ActionObject[] | ActionObject {
  // May be MD2ID, MD2ID[2], id, or Reduced
  type ActionFieldsReduced = DGraphFields | Reduced<ActionObject>;
  type ActionReduced = Reduced<ActionObject> | ActionObject[];
  return step(
    comp(
      // Trace('1. traversing ROOT value (gray matter):'),
      map<DGraphFields, ActionFieldsReduced>((k) => {
        if (g.isRoot(k)) {
          return new Reduced({
            gm2valueFn: getFrontMatterValue(k),
            gmToken: k,
            qlToken: queryBodyI,
            issue2valueFn: getBodyI,
          });
        }
        return k;
      }),
      // Trace("2. expand dependencies:"),
      mapcat<ActionFieldsReduced, ActionFieldsReduced>((x) => {
        if (isReduced(x)) return [x];
        return g.immediateDependencies(x);
      }),
      // Trace("2.1. map dependencies to nodes:"),
      map<ActionFieldsReduced, ActionReduced>((x) => {
        if (isReduced(x)) return x;
        return acc.get(x) ?? [];
      }),
      // Trace("3. Known keys (set in .env):"),
      mapcat<ActionReduced, ActionReduced>((node) => {
        if (isReduced(node)) return [node];
        if (knownKeys[key]) {
          return node.map(
            (n) =>
              new Reduced({
                ...n,
                qlToken: knownKeys[key].qlToken ?? "",
                issue2valueFn: knownKeys[key].issue2valueFn ??
                  ((x: unknown) => x),
              }),
          );
        }
        return [node];
      }),
      // Trace('4. Indexed keys[0]:'),
      mapcat<ActionReduced, ActionReduced>((node) => {
        if (isReduced(node)) return [node];
        const k = key.match(indexdIdentifier);
        const getIndex = (n: number): Fn<unknown, string> => (x: unknown) => {
          if (Array.isArray(x)) return x[n];
          if (typeof x === "string") return x.split(",")[n];
          return x;
        };

        if (k) {
          const k0 = Number(k[0]);
          return node.length === 1
            ? node.map(
              (n: ActionObject) =>
                new Reduced({
                  ...n,
                  gm2valueFn: c(getIndex(k0), n.gm2valueFn),
                }),
            )
            : [node[k0]].map(
              (n: ActionObject) =>
                new Reduced({
                  ...n,
                  issue2valueFn: c(getIndex(k0), n.issue2valueFn),
                }),
            );
        }

        return [node];
      }),
      // Trace('5. LEAF values just copy:'),
      mapcat<ActionReduced, Reduced<ActionObject>>((node) => {
        if (isReduced(node)) return [node];
        return node.map((n) => new Reduced(n));
      }),
      // Trace("6. All values Reduced; extract/deref!"),
      map((node) => node.deref()),
      // Trace("7. Finished!"),
      // trace('---------------------'),
    ),
  )(key);
}

/*
 * IN: DGraph<string>
 * OUT: Map<string, ActionObj[]>
 */
export function dag2MDActionMap(g: DGraph<DGraphFields>): MDActionMap {
  return last<MDActionMap>(
    scan(
      reducer(
        () => new Map<DGraphFields, ActionObject[]>(),
        (acc, key: DGraphFields) => {
          const actionObject = stepTree(acc, key, g);
          return acc.set(
            key,
            Array.isArray(actionObject) ? actionObject : [actionObject],
          );
        },
      ),
      new Map(),
      g,
    ),
  );
}

/*
 * A function that helps to page through GitHub Issues
 */
type GHCursor = string;
export function queryIPager(
  ...actionObject: Array<ActionObject[] | undefined>
): Fn<GHCursor, string> {
  const join = transduce(
    comp(
      filter(Array.isArray),
      cat<ActionObject>(),
      map((x: ActionObject) => x.qlToken),
    ),
    str("\n"),
    actionObject,
  );
  return (s: GHCursor) => c(queryR, queryI(s))(join);
}

export function queryLPager(): Fn<GHCursor, string> {
  return (s: GHCursor) => c(queryR, queryL(s))(queryNameL);
}

export function queryMPager(): Fn<GHCursor, string> {
  return (s: GHCursor) => c(queryR, queryM(s))(queryTitleM);
}

export async function fetchExhaust<T extends Combined>(
  client: graphql,
  query: Fn<GHCursor, string>,
  getter: Fn<R1<T>, R2<T>>,
): Promise<Array<T[keyof T]>> {
  const nodes: Array<T[keyof T]> = [];
  let cursor: GHCursor = "";
  while (true) {
    const ql = await client(query(cursor));
    const qPayLoad = c(getter, getR)(ql);
    nodes.push(...(getNodes<T>(qPayLoad) as Array<T[keyof T]>));
    if (getHasNextPage<T>(qPayLoad)) {
      cursor = getEndCursor<T>(qPayLoad);
      continue;
    }

    break;
  }

  return nodes;
}

/*
 * Parse remote or local issues
 * depending on the number of actionObjects the output rows differ
 * in size and shape. Therefore unkown[] typed.
 */
export function parseIssues(
  iXs: Array<Issue | GrayMatterFile<string>>,
  ...actionObject: Array<ActionObject[] | undefined>
): unknown[][] {
  // --- iXs (issues)
  return transduce(
    map(
      (issue) =>
        // --- aXs (actions)
        transduce(
          comp(
            filter(Array.isArray),
            map(
              (aXs: ActionObject[]) =>
                // --- each action
                map((a: ActionObject) => {
                  const pValue = a.issue2valueFn(issue) ?? a.gm2valueFn(issue);
                  // Try to rule out if issue is in body
                  if (
                    a.qlToken === "body" &&
                    typeof pValue === "string" &&
                    grayMatter.test(pValue)
                  ) {
                    return a.gm2valueFn(grayMatter(pValue));
                  }

                  return pValue;
                }, aXs),
              // -- end each action
            ),
            map((a) => [...a]), // Flat iterator
            mapcat((a) => (a.length > 1 ? [a.join(",")] : a)), // Join if combined value (= must be string)
          ),
          push(),
          actionObject,
        ),
      // -- end aXs
    ),
    push(),
    iXs,
  );
  // -- end iXs
}

/*
 * Just a little helper to pull in the remote ID to parsedIssues
 * A lot of unknown here. Is on purpose as various datatypes (string, date, number,...)
 * can be used for decode the specific variable
 */
export function patchedIssued2Map(
  patchedIdFar: IterableIterator<[unknown[], string]>,
) {
  type I = IterableIterator<[[unknown, unknown, ...unknown[]], string]>;
  type O = [unknown, unknown[]];
  return transduce(
    map<I, O>(([[id, date], rId]) => [id, [date, rId]]),
    assocMap<unknown, unknown[]>(),
    patchedIdFar as any,
  );
}

export function labelsMilestones2Map<T extends Label | Milestone>(
  labelMilestoneNodes: T[],
): Map<string, string> {
  return transduce(
    comp(
      map<T, [string, string]>((x) => {
        const id = getIdL(x);
        const key = getNameL(x) ?? getTitleM(x);
        assert(key !== undefined, `Can't fetch name|title of ${id}`);
        return [key!, id];
      }),
    ),
    assocMap(),
    labelMilestoneNodes,
  );
}

export function nearFarMerge(near: any, far: any): BuildContent[] {
  // A bit of a hack
  const { isNaN } = Number;
  const isValidDate = (dateLike: any): boolean =>
    dateLike instanceof Date && !isNaN(dateLike as any);
  const isoDate = (x: unknown) => String((x as Date)?.toISOString?.() ?? x);

  return transduce(
    comp(
      // Flatten out zipped content
      // Interleave remote GH issue id
      map(([[id, date, ...r1], ...r2]) => {
        // 'Null' from no remote id
        if (!far.has(id)) return [null, id, date, ...r1, ...r2];
        const [_, rId] = far.get(id);
        // Prepend remote id
        return [rId, id, date, ...r1, ...r2];
      }),
      // Filter content for rows without update
      filter(([_, id, date]) => {
        // 1. no far equivalent == new content
        if (!far.has(id)) return true;

        // 2. no near date means push anyway - no dropping here
        const nearDate = new Date(isNaN(date) ? date : Number(date));
        if (!isValidDate(nearDate)) return true;

        // 3. no far date means push anyway - after this far has a date
        const [dateFar] = far.get(id);
        const farDate = new Date(isNaN(dateFar) ? dateFar : Number(dateFar));
        if (!isValidDate(farDate)) return true;

        // 4. if modified content push it
        if (nearDate > farDate) return true;
        return false;
      }),
      // 5. Flip row to object
      map(([rId, id, date, title, labels, milestone, state, ...body]) => ({
        rId,
        id,
        date,
        title,
        labels,
        milestone,
        state,
        body,
      })),
      // 5. Labels and Milestones to string (GH issue format):
      // transform dates to ISO strings because String(date) is not portable
      map(({ labels, milestone, ...r }) => ({
        ...r,
        labels: (Array.isArray(labels) ? labels : [labels]).map(isoDate),
        milestone: isoDate(milestone),
      })),
    ),
    push(),
    near,
  );
}

/*
 * Generate sideEffects
 * - labels and milestones
 */
export function preBuildModel(
  rows: BuildContent[],
  lM: Map<string, string>,
  mM: Map<string, string>,
): Array<Either<PreBuildContent>> {
  return transduce(
    // @ts-expect-error
    comp(
      multiplex(
        comp(
          // Labels
          mapcat(({ labels }) => (Array.isArray(labels) ? labels : [labels])),
          filter((l) => l !== "undefined" && !lM.has(l)), // String(undefined)
          distinct(),
          map<string, Either<["label", CreateLabelQL]>>((l) => [
            ({ logger }) => {
              logger.info(`DRY; Create missing label: ${l}`);
            },
            async ({ repoQ, repoId }) => {
              const ql: CreateLabel = {
                type: "label",
                action: "create",
                id: repoId,
                name: l,
              };
              return repoQ(mutateL(ql), ql).then((x) => ["label", x]);
            },
          ]),
        ),
        comp(
          // Milestones
          map(({ milestone }) => milestone),
          filter((m) => m !== "undefined" && !mM.has(m)), // String(undefined)
          distinct(),
          map<string, Either<["milestone", OctoR]>>((m) => [
            ({ logger }) => {
              logger.info(`DRY; Create missing milestone: ${m}`);
            },
            async ({ repoR }) =>
              repoR(
                ...mutateRestM({
                  type: "milestone",
                  action: "create",
                  title: m,
                } as CreateMilestone),
              ).then((x) => ["milestone", x]),
          ]),
        ),
      ),
      cat(), // Flatting to remove undefined (labels or milestones)
      filter((x) => x !== undefined),
      flatten(), // Completely flatten
      partition(2), // Repartition by 2
    ),
    push(),
    rows,
  );
}

/*
 * Generate sideEffects
 * - issues
 */
export function buildModel(
  rows: any[],
  lM: Map<string, string>,
  mM: Map<string, string>,
): Array<Either<CreateIssueQL | UpdateIssueQL>> {
  return transduce(
    comp(
      map<BuildContent, Either<CreateIssueQL | UpdateIssueQL>>(
        ({ rId, title, labels, milestone, body }) => {
          const action = rId ? "update" : "create";
          const data: UpdateIssue | CreateIssue = {
            type: "issue",
            id: rId ?? "NEW",
            action,
            title,
            body: body.join(""),
            labelIds: labels
              .filter((l) => l !== "undefined")
              .map((l) => lM.get(l) ?? `NEW:${l}`),
            milestoneId: [milestone]
              .filter((m) => m !== "undefined")
              .map((m) => mM.get(m) ?? `NEW:${m}`)
              .join(""),
          };
          return [
            ({ logger }) => {
              logger.info(`DRY; ${action} issue: ${logger.pp(data)}`);
            },
            async ({ repoQ, repoId }) => {
              const ql = { ...data, id: rId ?? repoId };
              return repoQ(mutateI(ql), ql);
            },
          ];
        },
      ),
    ),
    push(),
    rows,
  );
}

export function issues2Map(
  issues: Array<CreateIssueQL | UpdateIssueQL>,
): Map<string, Issue> {
  return transduce(
    comp(
      map(
        (x) => getCreateI(x as CreateIssueQL) ?? getUpdateI(x as UpdateIssueQL),
      ),
      map<Issue, [string, Issue]>((x) => {
        const title = getTitleI(x);
        assert(title !== undefined, `Can't get title ${x}`);
        return [title!, x];
      }),
    ),
    assocMap<string, Issue>(),
    issues,
  );
}

/*
 * Generate sideEffects
 * - issues
 */
export function postBuildModel(
  rows: BuildContent[],
  buildMap: Map<string, Issue>,
): Array<Either<UpdateIssueQL>> {
  return transduce(
    comp(
      filter(({ title, state }) => {
        const t = buildMap.get(title);
        const ghState = t ? getStateI(t) : t;
        assert(
          ghState !== undefined,
          `PostBuild: Something is not right with issue ${title}`,
        );
        return state !== ghState!;
      }),
      map<BuildContent, BuildContent>(({ title, ...r }) => {
        const t = buildMap.get(title);
        const rId = t ? getIdI(t) : t;
        assert(
          rId !== undefined,
          `PostBuild: Something is not right with issue ${title}`,
        );
        return { title, ...r, rId };
      }),
      map<BuildContent, Either<UpdateIssueQL>>(({ rId, state }) => {
        const ql: UpdateIssue = {
          type: "issue",
          action: "update",
          id: rId!,
          state,
        };
        return [
          ({ logger }) => {
            logger.info(`DRY; Can't run dry postbuild without building -_-`);
          },
          async ({ repoQ }) => {
            return repoQ(mutateI(ql), ql);
          },
        ];
      }),
    ),
    push(),
    rows,
  );
}
