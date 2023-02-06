import { h1 } from "@thi.ng/hiccup-html";
import { $compile } from "@thi.ng/rdom";
import {
  comp,
  map,
  push,
  reduced,
  scan,
  trace,
  transduce,
} from "@thi.ng/transducers";
import { tw } from "twind";

const greeter = h1(
  { class: tw`font-bold text(center 5xl white sm:gray-800 md:pink-700)` },
  "Hello👋project",
);
const app = document.querySelector<HTMLDivElement>("#app")!;

$compile(greeter).mount(app);

// #1
const sampledata = [1, 2, 3, 4, 5];
const agg = transduce(
  comp(
    trace("in"),
    scan(push()),
    trace("out"),
  ),
  push(),
  sampledata,
);
console.log(agg);

// #2
const isred = transduce(
  comp(
    map(x => x > 3 ? reduced(x) : x),
    trace(),
  ),
  push(),
  sampledata,
);
console.log(isred);
