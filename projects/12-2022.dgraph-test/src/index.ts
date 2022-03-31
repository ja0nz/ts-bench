import {h1} from '@thi.ng/hiccup-html';
import {$compile} from '@thi.ng/rdom';
import { DGraph } from '@thi.ng/dgraph';
import {tw} from 'twind';

const greeter = h1(
	{class: tw`font-bold text(center 5xl white sm:gray-800 md:pink-700)`},
	'Hello👋12-2022.dgraph-test',
);
const app = document.querySelector<HTMLDivElement>('#app')!;

await $compile(greeter).mount(app);

// https://docs.thi.ng/umbrella/dgraph/

const cl = console.log;
// const g = new DGraph();

// // dependencies from a -> b
// cl("deps", "1 -> 3 -> 4 | 1 -> 2 ")
// cl("where: 4 is root; 1 is leave")
// cl("addDependency(node, dep)")
// cl("addDependency(1,2)", g.addDependency(1, 2));
// g.addDependency(3, 4);
// g.addDependency(1, 3);

// // mutiple arrows up 2 -> 4,x
// //g.addDependencies(2, [4])

// console.group("emit all")
// cl("spread/iterate", ...g)

// cl("sort", g.sort());
// console.groupEnd()

// console.group("traverse")
// cl("up/down next")
// cl("immediateDependencies(3)^", ...g.immediateDependencies(3))
// cl(3)
// cl("immediateDependents(3)v", ...g.immediateDependents(3))
// cl("up/down ALL")
// cl("transitiveDependencies(1)", ...g.transitiveDependencies(1))
// cl("transitiveDependents(4)", ...g.transitiveDependents(4))
// console.groupEnd()

// console.group("raw")
// cl("dependents", ...g.dependents)
// cl("dependencies", ...g.dependencies)

// cl("roots", ...g.roots())
// cl("nodes", ...g.nodes())
// cl("leaves", ...g.leaves())
// console.groupEnd()

// console.group("test if")
// cl("depends(3, 4)^", g.depends(3, 4))
// cl("dependent(4, 3)v", g.dependent(4, 3))

// cl("isLeaf(3) | 1=true", g.isLeaf(3))
// cl("isRoot(3) | 4=true", g.isRoot(3))
// console.groupEnd()

// console.group("add/remove")
// // add isolated nodes
// cl("addNode(99)", ...g.addNode(99))
// cl("removeNode(99)", ...g.removeNode(99))
// cl("removeNode(1) -> delete whole tree")
// cl("remove arrow, not delete nodes")
// cl("removeEdge(node, dep)", ...g.removeEdge(1,2))
// cl("removeNode(1)", ...g.removeNode(1))
// console.groupEnd()


// /* Test */
// console.group("Real")
// //id=title
// //title=t,r
// //date=mile
// //mile=d
// const r = new DGraph();

// // dependencies from a -> b
// r.addDependency("id", "title[0]");
// // generated
// r.addDependency("title[0]", "title");
// r.addDependencies("title", ["t[0]", "r"]);
// r.addDependency("mile", "d")
// r.addDependency("date", "mile");
// cl(...r.sort())
// cl(r)

// // mutiple arrows up 2 -> 4,x
// //g.addDependencies(2, [4])
// console.groupEnd()

import { buildDag, dagAction, stepTree } from "./build.js"

const route = "route"
const route1 = "route[1]"
const title = "title"
const date = "date"
const draft = "draft"
const MD2TITLE = "MD2TITLE"
const MD2MILESTONE = "MD2MILESTONE"
const MD2STATE = "MD2STATE"
const MD2TITLE1 = "MD2TITLE[0]"
const MD2DATE = "MD2DATE"
const MD2ID = "MD2ID"

const rMap = new Map();

const setter = (k, v)  => {
  if (Array.isArray(v)) {
    return rMap.set(k, v)
  } else {
    return rMap.set(k, [v])
  }
}

const getter = v => {
  if (Array.isArray(v)) {
    return v
  } else {
    return v
  }
}

// const rootN = stepTree(rMap, route, graph)
// setter(route, rootN)
// const rootwIndexN = stepTree(rMap, route1, graph)
// setter(route1, rootwIndexN)
// const titleN = stepTree(rMap, title, graph)
// setter(title, titleN)
// const dateN = stepTree(rMap, date, graph)
// setter(date, dateN)
// const draftN = stepTree(rMap, draft, graph)
// setter(draft, draftN)
// const MD2TITLEN = stepTree(rMap, MD2TITLE, graph)
// setter(MD2TITLE, MD2TITLEN)
// const MD2MSN = stepTree(rMap, MD2MILESTONE, graph)
// setter(MD2MILESTONE, MD2MSN)
// const MD2STATEN = stepTree(rMap, MD2STATE, graph)
// setter(MD2STATE, MD2STATEN)
// const MD2TITLE1N = stepTree(rMap, MD2TITLE1, graph)
// setter(MD2TITLE1, MD2TITLE1N)
// const MD2DATEN = stepTree(rMap, MD2DATE, graph)
// setter(MD2DATE, MD2DATEN)
// const MD2IDN = stepTree(rMap, MD2ID, graph)
// setter(MD2ID, MD2IDN)

// console.group("tree")
// // console.log(route, getter(rootN))
// console.log(route1, getter(rootwIndexN))
// // console.log(title, getter(titleN))
// // console.log(date, getter(dateN))
// // console.log(draft, getter(draftN))
// //console.log(MD2TITLE, getter(MD2TITLEN))
// // console.log(MD2MILESTONE, getter(MD2MSN))
// console.log(MD2STATE, getter(MD2STATEN))
// console.log(MD2TITLE1, getter(MD2TITLE1N))
// console.log(MD2DATE, getter(MD2DATEN))
// console.log(MD2ID, getter(MD2IDN))
// console.groupEnd()


export const env = {
  MD2ID: 'MD2TITLE[1],MD2STATE',
  MD2DATE: 'MD2MILESTONE',
  MD2TITLE: 'title,route[1]',
  MD2LABELS: 'tags',
  MD2MILESTONE: 'date',
  MD2STATE: 'draft',
};

const graph = buildDag()
console.log(...graph)

console.group("dagAction")
const a = dagAction(graph)
console.log(a)
console.log(JSON.stringify(a.get("MD2ID"), null, 2))
console.groupEnd()

//const act = dagAction(graph);
//cl(JSON.stringify(Object.fromEntries(act), null, 2));
//cl(act)

const fakeData = {
    parsed: {
        data: {
            title: 'Another Org example,another-post,11,p',
            author: ['Ja0nz'],
            summary: 'An awesome summary for an awesome topic. This should be around 200 words.',
            date: "2022-01-12T22:26:00.000Z",
            publishDate: "2022-01-11T23:00:00.000Z",
            tags: ["tagThis", "tagThat"],
            draft: false,
            no: 5,
            category: "tech",
            id: '5fb0dcea-dead-4f5f-ab66-1f60ea4951b2',
            route: 'another-post,another-title'
        }
    }
}
//@ts-ignore
// const get = (key: string) => cl(key, act.get(key).getFm.map(x => x(fakeData)))

// get('route')
// get('category')
// get('no')
// //get('route[1]')
// get('title')
// get('date')
// get('MD2TITLE')
// get('MD2TITLE[2]')
// get('draft')
// get('tags')
// get('MD2MILESTONE')
// get('MD2STATE')
// get('MD2LABELS')
// get('MD2DATE')
// get('MD2ID')

// cl('------------------------')

// //const access = comp(getNodes ,getI ,getR)
// cl(act.get('MD2ID').query)
// cl(act.get('MD2DATE').query)
// cl(act.get('MD2MILESTONE').query)

// cl('------------------------')


// const qNode = {
//   id: 'I_kwDOG-ZMMM5GOY49',
//   title: 'Another Org example,another-post,11,p',
//   state: 'CLOSED',
//   milestone: {
//       id: "MI_kwDOG-ZMMM4AdvWH",
//       title: "2022-01-12T22:26:00.000Z"
//   },
//   labels: {
//     "nodes": [
//       {
//         "id": "LA_kwDOG-ZMMM7r8ZiI",
//         "name": "zig"
//       }
//     ]
//   }
// }

// cl("getQ ID", act.get('MD2ID').getQ(qNode))
// cl("getQ DATE", act.get('MD2DATE').getQ(qNode))
// cl("--")
// cl("getQ Title", act.get('MD2TITLE').getQ(qNode))
// cl("getQ Labels", act.get('MD2LABELS').getQ(qNode))
// cl("getQ Milestone", act.get('MD2MILESTONE').getQ(qNode))
// cl("getQ State", act.get('MD2STATE').getQ(qNode))
