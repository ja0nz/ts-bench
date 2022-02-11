import { h1 } from "@thi.ng/hiccup-html";
import { $compile } from "@thi.ng/rdom";
import { add, comp, count, map, mapcat, max, multiplex, partition, push, reduce, trace, transduce } from "@thi.ng/transducers";
import { tw } from "twind";
import { iterator } from "@thi.ng/iterators";

const greeter = h1(
    { class: tw`font-bold text(center 5xl white sm:gray-800 md:pink-700)` },
    "Hello👋project",
);
const app = document.querySelector<HTMLDivElement>('#app')!

$compile(greeter).mount(app);


const b = [1, 2, 3]
const c = [4, 5, 6]
console.log([...iterator(b)])
console.log(
    transduce(
        map(x => x + 10),
        push(),
        iterator(b), iterator(c)
    )
)

//console.log(reduce(count(), 0, [1, 2]))

const a = transduce(
    comp(
        mapcat(a => a),
        partition(2),
        //trace("after part1"),
        multiplex(
            map(id => id),
            comp(
                mapcat(a => a),
                partition(2),
                //        trace("after part2"),
            )
        ),
        map(([one, two]) => { console.log(one, two); return one })
    ),
    push(),
    [["one", "shot"]]
    //[["one", "shot", "two", "shot"]]
)

//console.log(a);
