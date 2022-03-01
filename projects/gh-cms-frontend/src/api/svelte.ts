import type { RequestEvent } from "@sveltejs/kit/types/internal";
import { defGetter } from "@thi.ng/paths";
import { comp } from "@thi.ng/compose";

type Params = Record<string, string>;

export const get_req_p = defGetter<RequestEvent, 'params'>(['params']);
export const get_req_p_ca = comp(
    defGetter<Params, 'catchall'>(['catchall']),
    get_req_p
);
