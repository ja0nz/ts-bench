// Copyright (c) Example Company. All rights reserved. Licensed under the MIT license.

/**
 * A library for building widgets.
 *
 * @remarks
 * The `all-documentation-lib` defines the {@link IWidget} interface and {@link Widget} class,
 * which are used to build widgets.
 *
 * @packageDocumentation
 */

/**
 * Interface implemented by all widgets.
 * @public
 */
export interface IWidget {
    /**
     * Draws the widget on the screen.
     */
    render(): void;
}

/**
 * This is the answer to all
 * @beta
 */
export const answer = 44;
