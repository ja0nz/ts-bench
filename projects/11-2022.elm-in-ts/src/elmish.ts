// Helper type
type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (
  k: infer I,
) => void ? I
  : never;
type Sum = [string] | [string, unknown];

// Matching single nested type
type MatchSingle<T extends Sum, R> =
  // Three levels deep
  | UnionToIntersection<
    T extends [infer A, infer B]
      ? B extends [infer BA, infer BB] ? BB extends [infer CA, infer CB] ? {
            [K in A & string]: {
              [K2 in BA & string]: {
                [K3 in CA & string]: {
                  [K4 in `${K}_${K2}_${K3}`]: (x: CB) => R;
                };
              };
            };
          }[A & string][BA & string][CA & string]
        : BB extends [infer CA] ? {
            [K in A & string]: {
              [K2 in BA & string]: {
                [K3 in CA & string]: {
                  [K4 in `${K}_${K2}_${K3}`]: () => R;
                };
              };
            };
          }[A & string][BA & string][CA & string]
        : {
          [K in A & string]: {
            [K2 in BA & string]: {
              [K3 in `${K}_${K2}`]: (x: BB) => R;
            };
          };
        }[A & string][BA & string]
      : B extends [infer BA] ? {
          [K in A & string]: {
            [K2 in BA & string]: {
              [K3 in `${K}_${K2}`]: () => R;
            };
          };
        }[A & string][BA & string]
      : {
        [K in A & string]: (x: B) => R;
      }
      : T extends [infer A] ? {
          [K in A & string]: () => R;
        }
      : never
  >
  // Two levels deep
  | UnionToIntersection<
    T extends [infer A, infer B] ? B extends [infer BA, infer BB] ? {
          [K in A & string]: {
            [K2 in BA & string]: {
              [K3 in `${K}_${K2}`]: (x: BB) => R;
            };
          };
        }[A & string][BA & string]
      : B extends [infer BA] ? {
          [K in A & string]: {
            [K2 in BA & string]: {
              [K3 in `${K}_${K2}`]: () => R;
            };
          };
        }[A & string][BA & string]
      : {
        [K in A & string]: (x: B) => R;
      }
      : T extends [infer A] ? {
          [K in A & string]: () => R;
        }
      : never
  >
  // One level deep
  | UnionToIntersection<
    T extends [infer A, infer B] ? {
        [K in A & string]: (x: B) => R;
      }
      : T extends [infer A] ? {
          [K in A & string]: () => R;
        }
      : never
  >
  | {
    _: () => R; // Wildcard
  };

type Pattern<T extends Sum, _> = {
  [K in T[0] | "_"]: T extends [K, infer B] ? B : never;
};

// Matching tuple
type SumTuple = [Sum, Sum] | [Sum, Sum, Sum];
type MatchMulti<
  T extends SumTuple,
  R,
  Temporary extends Record<0 | 1 | 2, Pattern<Sum, R>> = {
    // @ts-expect-error - T[K] needs fix but not in prio
    [K in (keyof T & 0) | 1 | 2]: Pattern<T[K], R>;
  },
> = T extends [Sum, Sum, Sum] ? {
    [K in keyof Temporary[0] & string]: {
      [K1 in keyof Temporary[1] & string]: {
        [K2 in keyof Temporary[2] & string]:
          & {
            [K3 in `${K}, ${K1}, ${K2}`]: Temporary[0][K] extends never
              ? Temporary[1][K1] extends never
                ? Temporary[2][K2] extends never ? () => R
                : (x: Temporary[2][K2]) => R
              : Temporary[2][K2] extends never ? (x: Temporary[1][K1]) => R
              : (x: Temporary[1][K1], y: Temporary[2][K2]) => R
              : Temporary[1][K1] extends never
                ? Temporary[2][K2] extends never ? () => R
                : (x: Temporary[2][K2]) => R
              : Temporary[2][K2] extends never
                ? (x: Temporary[0][K], y: Temporary[1][K1]) => R
              : (
                x: Temporary[0][K],
                y: Temporary[1][K1],
                z: Temporary[2][K2],
              ) => R;
          }
          & {
            _: () => R;
          };
      };
    };
  }[keyof Temporary[0] & string][
    & keyof Temporary[1]
    & string
  ][keyof Temporary[2] & string]
  : {
    [K in keyof Temporary[0] & string]: {
      [K1 in keyof Temporary[1] & string]:
        & {
          [K2 in `${K}, ${K1}`]: Temporary[0][K] extends never
            ? Temporary[1][K1] extends never ? () => R
            : (x: Temporary[1][K1]) => R
            : Temporary[1][K1] extends never ? (x: Temporary[0][K]) => R
            : (x: Temporary[0][K], y: Temporary[1][K1]) => R;
        }
        & {
          _: () => R;
        };
    };
  }[keyof Temporary[0] & string][keyof Temporary[1] & string];

export type Match<T extends [Sum] | SumTuple, R> = T extends SumTuple
  ? MatchMulti<T, R>
  : T extends [Sum] ? MatchSingle<T[0], R>
  : never;

export const match = <V extends [Sum] | SumTuple>(...v: V) => {
  return {
    with(pattern: Match<V, any>) {
      const keys: string[] = [];
      const value: unknown[] = [];
      let act: unknown[];
      for (act of v) {
        const key = [];
        while (true) {
          const [k, ...v] = act;
          key.push(k);
          // TODO The tricky part
          // -> how to distinguish if a legit list/tuple value or an action
          // here just checking if an array and <= 2 - but may not be sufficient
          if (v.length > 0 && Array.isArray(v[0]) && v[0].length <= 2) {
            act = v[0]; // <- push next level on stack
            continue;
          }

          // Max depth reached
          keys.push(key.join("_")); // Combine keys
          value.push(...v);
          break;
        }
      }

      return (
        // @ts-ignore
        pattern[keys.join(", ")] ?? // TODO How to index type this 🤷‍♀️
          pattern._ ?? // Catch All
          (() => new Error("Wrong key or missing 'Catch All'"))
      ) // Error
        .apply(null, value);
    },
  };
};

export type Maybe<A> = ["Nothing"] | ["Just", A];
export type Result<A, B> = ["Ok", A] | ["Error", B];

export const fromNullable = <T>(x: T): Maybe<NonNullable<T>> =>
  x === null || x === undefined ? ["Nothing"] : ["Just", x as NonNullable<T>];
