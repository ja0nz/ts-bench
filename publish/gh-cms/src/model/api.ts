import { defGetter, defSetter, defSetterUnsafe } from '@thi.ng/paths';
import { comp } from '@thi.ng/compose';
import type { GrayMatterFile } from 'gray-matter';
import { MD2DATE, MD2ID, MD2LABELS, MD2MILESTONE, MD2STATE, MD2TITLE } from '../api';
import type { Fn, Fn0 } from '@thi.ng/api';

/*
 * GraphQL
 */
export interface Issue {
  id: string;
  state: string;
  title?: string;
  body?: string;
}
export interface Label {
  id: string;
  name: string;
  issues?: { nodes: Issue[] };
}

export interface Milestone {
  id: string;
  title: string;
  number: number;
  issues?: { nodes: Issue[] };
}
export interface Issues {
  issues: {
    nodes: Issue[];
  };
}
export interface Labels {
  labels: {
    nodes: Label[];
  };
}
export interface Milestones {
  milestones: {
    nodes: Milestone[];
  };
}
export interface RepoID {
  id: string;
}

type Response = RepoID & Issues & Labels & Milestones;

export interface Repository {
  repository: {
    [k in keyof Partial<Response>]: Response[k];
  };
}

export type Effect = Fn0<Promise<any>>;

/*
 * This is a wrapper around the parsed GrayMatter file
 * used to store GH information alongside the parsed content
 */
export interface GH_CMS {
  issue: Issue & { rid: string };
  parsed: CustomGrayMatter;
  raw: string;
}
export const get_CMS_id = defGetter<GH_CMS, 'issue', 'id'>(['issue', 'id']);
export const set_CMS_id = defSetter<GH_CMS, 'issue', 'id'>(['issue', 'id']);
export const get_CMS_rid = defGetter<GH_CMS, 'issue', 'rid'>(['issue', 'rid']);
export const get_CMS_state = defGetter<GH_CMS, 'issue', 'state'>([
  'issue',
  'state',
]);
export const set_CMS_state = defSetter<GH_CMS, 'issue', 'state'>([
  'issue',
  'state',
]);
export const get_CMS_raw = defGetter<GH_CMS, 'raw'>(['raw']);
export const get_CMS_parsed = defGetter<GH_CMS, 'parsed'>(['parsed']);

/*
 * GrayMatterFile is poorly typed
 * - missing a variable "isEmpty"
 * - data badly typed
 */
export interface CustomGrayMatter extends GrayMatterFile<string> {
  isEmpty: boolean;
  data: FrontMatterSpec;
}
export const get_parsed_content = comp(
  defGetter<CustomGrayMatter, 'content'>(['content']),
  get_CMS_parsed
);
export const get_parsed_data = comp(
  defGetter<CustomGrayMatter, 'data'>(['data']),
  get_CMS_parsed
);

/*
 *
 */
export interface FrontMatterSpec {
  id: string;
  date: Date;
  title: string;
  draft?: boolean;
  tags?: string[];
  route?: string;
}
export const getId = comp(
  defGetter<FrontMatterSpec, any>([MD2ID]),
  get_parsed_data
);
export const getDate = comp(
  defGetter<FrontMatterSpec, any>([MD2DATE]),
  get_parsed_data
);
export const getTitle = comp(
  defGetter<FrontMatterSpec, any>([MD2TITLE]),
  get_parsed_data
);
export const setTitle = defSetter<GH_CMS, 'parsed', 'data', any>([
  'parsed',
  'data',
  MD2TITLE,
]);

export const getLabels: Fn<GH_CMS, string[]> = comp(
  defGetter<FrontMatterSpec, any>([MD2LABELS]),
  get_parsed_data
);
export const setLabels = defSetterUnsafe([
  'parsed',
  'data',
  MD2LABELS,
]);

export const getMilestone: Fn<GH_CMS, string> = comp(
  defGetter<FrontMatterSpec, any>([MD2MILESTONE]),
  get_parsed_data
);
export const setMilestone = defSetterUnsafe([
  'parsed',
  'data',
  MD2MILESTONE,
]);

export const getState: Fn<GH_CMS, boolean> = comp(
  defGetter<FrontMatterSpec, any>([MD2STATE]),
  get_parsed_data
);
