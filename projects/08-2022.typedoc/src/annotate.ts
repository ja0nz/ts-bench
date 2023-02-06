// annotate.ts
/**
 * A doc comment describing a file must be placed before any code in the file. It should be annotated with the @module tag so that TypeDoc knows that it is intended to be documentation for the file itself.

 * Specify this is a module comment without renaming it (@module)
 * @module
 */

// Markdown
/**
 * This **comment** _supports_ [Markdown](https://marked.js.org/)
 */
export const markdown_answer = 42;

// Code Blocks
/**
 * Code blocks are great for examples
 *
 * ```typescript
 * // run typedoc --help for a list of supported languages
 * const instance = new MyClass();
 * ```
 */
export const code_blocks = 55;

/**
 * Standard links:
 * {@link Foo} or {@linkplain Foo} or [[Foo]]
 *
 * Links with text:
 * The {@link Foo | Foo interface}
 * The [[Foo | Foo interface]]
 *
 * Code links: (Puts Foo inside \<code> tags)
 * {@linkcode Foo} or [[`Foo`]]
 */
export class Bar implements Foo {
  member = true;
}

/** More details */
export interface Foo {
  member: boolean;
}

// Nested links
export interface RepoConfig {
  /**
   * Absolute local path/root dir
   */
  path: string;
}
export interface CLIOpts {
  /**
   * Same as {@link RepoConfig.path}
   */
  repoPath: string;
}

// Supported tags
/**
 * @param text  Comment for parameter ´text´.
 */
export function at_params(target: any, text: string): number {
  return 42;
}

/**
 * @typeParam T Comment for type `T`.
 */
export function at_typeparam<T>(target: T, text: string): number {
  return 42;
}

/**
 * Same as typeParam. I like typeParam more
 * @template T Templatetag for type `T`.
 */
export function at_typeparam_templateTag<T>(target: T, text: string): number {
  return 42;
}

/**
 * @returns Comment for special return value.
 */
export function at_return(target: any, text: string): number {
  return 42;
}

/**
 * @event
 */
export function at_event(target: any, text: string): number {
  return 42;
}

/**
 * @category Category Name
 */
export function at_category(target: any, text: string): number {
  return 42;
}

/**
 * If present on an object with string literal values, TypeDoc will convert the variable as an enumeration instead.
 * @enum
 */
export const At_Enum = {
  /**
   * Doc comments may be included here.
   */
  A: "a",
  B: "b",
} as const;
