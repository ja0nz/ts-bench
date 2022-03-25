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

const g = new DGraph();
const cl = console.log;

// dependencies from a -> b
cl("deps", "1 -> 3 -> 4 | 1 -> 2 ")
cl("where: 4 is root; 1 is leave")
cl("addDependency(node, dep)")
cl("addDependency(1,2)", g.addDependency(1, 2));
g.addDependency(3, 4);
g.addDependency(1, 3);

// mutiple arrows up 2 -> 4,x
//g.addDependencies(2, [4])

console.group("emit all")
cl("spread/iterate", ...g)

cl("sort", g.sort());
console.groupEnd()

console.group("traverse")
cl("up/down next")
cl("immediateDependencies(3)^", ...g.immediateDependencies(3))
cl(3)
cl("immediateDependents(3)v", ...g.immediateDependents(3))
cl("up/down ALL")
cl("transitiveDependencies(1)", ...g.transitiveDependencies(1))
cl("transitiveDependents(4)", ...g.transitiveDependents(4))
console.groupEnd()

console.group("raw")
cl("dependents", ...g.dependents)
cl("dependencies", ...g.dependencies)

cl("roots", ...g.roots())
cl("nodes", ...g.nodes())
cl("leaves", ...g.leaves())
console.groupEnd()

console.group("test if")
cl("depends(3, 4)^", g.depends(3, 4))
cl("dependent(4, 3)v", g.dependent(4, 3))

cl("isLeaf(3) | 1=true", g.isLeaf(3))
cl("isRoot(3) | 4=true", g.isRoot(3))
console.groupEnd()

console.group("add/remove")
// add isolated nodes
cl("addNode(99)", ...g.addNode(99))
cl("removeNode(99)", ...g.removeNode(99))
cl("removeNode(1) -> delete whole tree")
cl("remove arrow, not delete nodes")
cl("removeEdge(node, dep)", ...g.removeEdge(1,2))
cl("removeNode(1)", ...g.removeNode(1))
console.groupEnd()


/* Test */
console.group("Real")
//id=title
//title=t,r
//date=mile
//mile=d
const r = new DGraph();

// dependencies from a -> b
r.addDependency("id", "title[0]");
// generated
r.addDependency("title[0]", "title");
r.addDependencies("title", ["t[0]", "r"]);
r.addDependency("mile", "d")
r.addDependency("date", "mile");
cl(...r.sort())
cl(r)

// mutiple arrows up 2 -> 4,x
//g.addDependencies(2, [4])


console.groupEnd()
