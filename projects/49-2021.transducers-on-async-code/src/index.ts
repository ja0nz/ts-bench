import { h1 } from "@thi.ng/hiccup-html";
import { $compile } from "@thi.ng/rdom";
import { tw } from "twind";
import { exposeGlobal } from "@thi.ng/expose";
import { choices, filter, frequencies, push, take, transduce } from "@thi.ng/transducers";
import { promisify } from "@thi.ng/compose";
import { count20 } from "./simpleIteratorObject";

const iter = count20[Symbol.iterator](); // Init

// Normal iterator
function* count3() {
    yield 1;
    yield 2;
    yield 3;
}
const take2 = transduce(take(2), push(), count3())
console.log("iterator", take2)




async function* getResources() {
    yield fetch('http://localhost:3000')
    // fallback
    yield fetch('http://localhost:3000')
}

for await (const res of getResources()) {
    console.log(res)
    if (res.status === 404) continue;
    /* else go on */
}

//const thisfunction = await transduce(filter(res => res.status === 404), push(), getResources())



// Async context?
// The best would be wrapping it into a rstream channel

// Test Setting
let someAsync = (err, data) => { console.log(data); };
let prom = promisify(someAsync);
exposeGlobal("prom", prom)


function* acount3() {
    let promise = new Promise((r, rr) => r("done"));
    yield promise;
    yield* 2;
    yield* 3;
}
//const b = transduce(take(2), push(), acount3())
//console.log("async iterator", a)
exposeGlobal("a", acount3)


// Async normal iterator
//
//
//
const greeter = h1(
    { class: tw`font-bold text(center 5xl white sm:gray-800 md:pink-700)` },
    "Hello👋project",
);
const app = document.querySelector<HTMLDivElement>('#app')!

$compile(greeter).mount(app);


// Test out EventMap
function addListener<T extends keyof EventMap>(id: T, listener: (e: EventMap[T]) => void) { }

interface EventMap {
    click: MouseEvent;
    input: InputEvent;
    focus: FocusEvent;
}

addListener("click", (e) => { })

// Test out anon Type

const unis: UserUniforms = {
    shiftR: ["vec2", [0.1, 0]],
    shiftG: ["vec2", [0.05, 0]],
    shiftB: ["vec2", [0.02, 0]]
}

type UType = "vec2" | "vec3" | "vec4" | "float";
type UserUniforms =
    Record<string, [UType, number | number[]]>;

type UserUniformTypes<T extends UserUniforms> = {
    [k in keyof T]: T[k][0]
}

type X = UserUniformTypes<{ a: ["vec2", []] }>
