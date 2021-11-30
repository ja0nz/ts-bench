import { h1 } from "@thi.ng/hiccup-html";
import { $compile } from "@thi.ng/rdom";
import { tw } from "twind";

/**
 * Just playing with imports/exports
 */
import * as basket from './basket'
window.basket = basket

/**
 * Run import in an (async) iterator
 */
async function* run_import_iterator() {
    const { c_init } = await import("./chain/c");
    console.log("chain", c_init);
    const appAsync = document.querySelector<HTMLDivElement>('#appAsync')!
    appAsync.innerHTML = `${c_init}`;
    yield c_init;
    // some else
    return;
}
window.seq = run_import_iterator;

/**
 * Generate module on runtime
 */
import { blob, importable } from './runtimeModule/index'
const mod = await import(importable);
console.log(mod)


const greeter = h1(
    { class: tw`font-bold text(center 5xl white sm:gray-800 md:pink-700)` },
    "Hello👋project",
);
const app = document.querySelector<HTMLDivElement>('#app')!

$compile(greeter).mount(app);
