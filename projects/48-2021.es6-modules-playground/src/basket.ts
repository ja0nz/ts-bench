const dImportObj =
  (obj: { [key: string]: unknown }) => (props: object = {}) => {
    const ALL = "*";
    return Object.fromEntries(
      Object.entries(props).map(([k, v]) => k === ALL ? [v, obj] : [v, obj[k]]),
    );
  };
// IMPORT
// 1
// import defaultBanana from "./fruits/banana";
// const defaultBanana = (await import("./fruits/banana"))["default"];
/// defaultBanana
const { defaultBanana } = dImportObj(await import("./fruits/banana"))({
  default: "defaultBanana",
});
console.log("1", defaultBanana);
// 2
// import * as applemod from "./fruits/apple";
// const applemod = await import("./fruits/apple");
/// * as applemod
const { applemod } = dImportObj(await import("./fruits/apple"))({
  "*": "applemod",
});
console.log("2", applemod);
// 3
// import { yellowBanana } from "./fruits/banana";
// const yellowBanana = (await import("./fruits/banana"))["yellowBanana"];
// const { yellowBanana } = await import("./fruits/banana");
/// { yellowBanana }
const { yellowBanana } = dImportObj(await import("./fruits/banana"))({
  yellowBanana: "yellowBanana",
});
console.log("3", yellowBanana);
// 4
// import { yellowBanana as yB } from "./fruits/banana";
// const yB = (await import("./fruits/banana"))["yellowBanana"];
/// { yellowBanana as yB }
const { yB } = dImportObj(await import("./fruits/banana"))({
  yellowBanana: "yB",
});
console.log("4", yB);
// 5
// import { bigOrange, smallOrange } from "./fruits/orange";
// const { bigOrange, smallOrange } = await import("./fruits/orange");
/// { bigOrange, smallOrange }
const { bigOrange, smallOrange } = dImportObj(await import("./fruits/orange"))({
  bigOrange: "bigOrange",
  smallOrange: "smallOrange",
});
console.log("5", bigOrange, smallOrange);
// 6
// import defaultOrange, { otherOrange } from "./fruits/orange";
/// defaultOrange, { otherOrange }
const { defaultOrange, otherOrange } = dImportObj(
  await import("./fruits/orange"),
)({
  default: "defaultOrange",
  otherOrange: "otherOrange",
});
console.log("6", defaultOrange, otherOrange);
// 7
// import defaultOrange1, * as orangemod from "./fruits/orange";
/// defaultOrange1, * as orangemod
const { defaultOrange1, orangemod } = dImportObj(
  await import("./fruits/orange"),
)({
  default: "defaultOrange1",
  "*": "orangemod",
});
console.log("7", defaultOrange1, orangemod);
// 8
// import "./fruits/badApple"
dImportObj(await import("./fruits/badApple"))();

// REEXPORT
// 1
// import defaultBanana from "./fruits/banana";
// export { default } from "./fruits/banana";
// 2
// import * as applemod from "./fruits/apple";
export * from "./fruits/apple";
// 3
// import { yellowBanana } from "./fruits/banana";
export { yellowBanana } from "./fruits/banana";
// 4
// import { yellowBanana as yB } from "./fruits/banana";
export { yellowBanana as yB } from "./fruits/banana";
// 5
// import { bigOrange, smallOrange } from "./fruits/orange";
export { bigOrange, smallOrange } from "./fruits/orange";
// 6
// import defaultOrange, { otherOrange } from "./fruits/orange";
// export { default, otherOrange } from "./fruits/orange";
// 7
// import defaultOrange1, * as orangemod from "./fruits/orange";
export { default } from "./fruits/orange";
export * as orangemod from "./fruits/orange";
