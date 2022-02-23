import { suite } from "@thi.ng/bench";
// import { } from "../src";

suite([
    { title: "", fn: () => {}, opts: {} },
], {
    iter: 1000,
    warmup: 100,
    size: 1,
});
