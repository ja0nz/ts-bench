import { h1 } from "@thi.ng/hiccup-html";
import { $compile } from "@thi.ng/rdom";
import { tw } from "twind";

const greeter = h1(
  { class: tw`font-bold text(center 5xl white sm:gray-800 md:pink-700)` },
  "Hello👋--placeholder--",
);
const app = document.querySelector<HTMLDivElement>("#app")!;

await $compile(greeter).mount(app);
