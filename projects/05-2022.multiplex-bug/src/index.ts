import { h1 } from "@thi.ng/hiccup-html";
import { $compile } from "@thi.ng/rdom";
import { add, cat, comp, count, filter, interleave, last, map, mapcat, max, maxCompare, multiplex, multiplexObj, partition, push, reduce, reducer, scan, trace, transduce } from "@thi.ng/transducers";
import { tw } from "twind";
import { iterator } from "@thi.ng/iterators";
import type { IObjectOf } from "@thi.ng/api/object";

const greeter = h1(
    { class: tw`font-bold text(center 5xl white sm:gray-800 md:pink-700)` },
    "Hello👋project",
);
const app = document.querySelector<HTMLDivElement>('#app')!

$compile(greeter).mount(app);


const data = [
    { id: "99", date: new Date(), content: "old" },
    { id: "", date: new Date(9999999999999), content: "new" }
]

const x = transduce(
    comp(
        multiplexObj({
            id: comp(
                map(x => x.id),
                scan(max())
            ),
            content: scan(maxCompare(
                () => ({ date: new Date(0) }),
                (a, b) => { return a.date > b.date ? 1 : -1 }
            ))
        }),
        map(x => ({ ...x.content, id: x.id }))
        //trace("run"),
    ),
    last(),
    data
)
console.log(x)

const data1 = [[1, 2, 3, 4], [5, 6, 7, 8]]

const y = transduce(
    comp(cat(), trace()), push(), data1
)
