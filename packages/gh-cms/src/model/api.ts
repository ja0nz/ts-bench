import { defGetter, defSetterUnsafe } from "@thi.ng/paths";
import { comp } from "@thi.ng/compose";
import type { GrayMatterFile } from "gray-matter";
import { GH_MD2LABEL, GH_MD2MILESTONE } from "../api";

/*
 * This is a wrapper around the parsed GrayMatter file
 * used to store GH information alongside the parsed content
 */
export interface GitHubGrayMatter {
    repoID: string;
    issueID: string;
    raw: string;
    parsed: CustomGrayMatter;
}
export const get_GHGM_IID = defGetter<GitHubGrayMatter, "issueID">(["issueID"]);
export const get_GHGM_RID = defGetter<GitHubGrayMatter, "repoID">(["repoID"]);
export const get_GHGM_raw = defGetter<GitHubGrayMatter, "raw">(["raw"]);
export const get_GHGM_parsed = defGetter<GitHubGrayMatter, "parsed">(["parsed"]);

/*
 * GrayMatterFile is poorly typed
 * - missing a variable "isEmpty"
 * - data badly typed
 */
export interface CustomGrayMatter extends GrayMatterFile<string> {
    isEmpty: boolean;
    data: FrontMatterSpec;
}
export const getGHGM_content = comp(
    defGetter<CustomGrayMatter, "content">(["content"]),
    get_GHGM_parsed
);
export const getGHGM_data = comp(
    defGetter<CustomGrayMatter, "data">(["data"]),
    get_GHGM_parsed
);

/*
 *
 */
export interface FrontMatterSpec {
    id: string,
    date: Date,
    title: string,
    tags?: string[],
    route?: string
}
export const getGHGM_data_id = comp(
    defGetter<FrontMatterSpec, "id">(["id"]),
    getGHGM_data
)
export const getGHGM_data_date = comp(
    defGetter<FrontMatterSpec, "date">(["date"]),
    getGHGM_data
)
export const getGHGM_data_title = comp(
    defGetter<FrontMatterSpec, "title">(["title"]),
    getGHGM_data
)

export const getGHGM_data_tags = comp(
    defGetter<FrontMatterSpec, any>([GH_MD2LABEL ?? "tags"]),
    getGHGM_data
)
export const setGHGM_data_tags =
    defSetterUnsafe(["body", "data", GH_MD2LABEL ?? "tags"])

export const getGHGM_data_route = comp(
    defGetter<FrontMatterSpec, any>([GH_MD2MILESTONE ?? "route"]),
    getGHGM_data
)
export const setGHGM_data_route =
    defSetterUnsafe(["body", "data", GH_MD2MILESTONE ?? "route"])

/*
 * GraphQL
 */
export interface Issue {
    id: string;
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
        nodes: Issue[]
    }
}
export interface Labels {
    labels: {
        nodes: Label[]
    }
}
export interface Milestones {
    milestones: {
        nodes: Milestone[]
    }
}
export interface RepoID {
    id: string
}

type Response = RepoID & Issues & Labels & Milestones

export interface Repository {
    repository: {
        [k in keyof Partial<Response>]: Response[k]
    }
}
