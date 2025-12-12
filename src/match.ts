//----------------------------------------------------------------------------------------------------
// Copyright (c) 2025                    Hiisi Digital                    ort@hiisi.digital
// SPDX-License-Identifier: MPL-2.0      https://mozilla.org/MPL/2.0      contact@hiisi.digital
//----------------------------------------------------------------------------------------------------

/**
 * @module match
 *
 * Runtime-specific code execution via pattern matching.
 * Provides the closest equivalent to Rust's cfg!() match patterns.
 */

import { isBrowser, isBun, isDeno, isNode } from "./detection.ts";
import type { AsyncMatchHandlers, MatchHandlers } from "./types.ts";

// =============================================================================
// Match Functions
// =============================================================================

/**
 * Executes different functions based on the current runtime.
 * This is the closest equivalent to Rust's `cfg!()` pattern matching.
 *
 * @param handlers - Object containing runtime-specific handler functions
 * @returns The result of the matched handler, or undefined if no match
 *
 * @example
 * ```ts
 * import { match } from "@hiisi/onlywhen";
 *
 * const result = match({
 *   deno: () => Deno.readTextFileSync("file.txt"),
 *   node: () => require("fs").readFileSync("file.txt", "utf-8"),
 *   bun: () => Bun.file("file.txt").text(),
 *   default: () => { throw new Error("Unsupported runtime"); },
 * });
 * ```
 */
export function match<T>(handlers: MatchHandlers<T>): T | undefined {
  if (isDeno && handlers.deno) {
    return handlers.deno();
  }
  if (isNode && handlers.node) {
    return handlers.node();
  }
  if (isBun && handlers.bun) {
    return handlers.bun();
  }
  if (isBrowser && handlers.browser) {
    return handlers.browser();
  }
  if (handlers.default) {
    return handlers.default();
  }
  return undefined;
}

/**
 * Async version of match() for handlers that return promises.
 *
 * @param handlers - Object containing async runtime-specific handler functions
 * @returns A promise resolving to the result of the matched handler
 *
 * @example
 * ```ts
 * import { matchAsync } from "@hiisi/onlywhen";
 *
 * const content = await matchAsync({
 *   deno: async () => await Deno.readTextFile("file.txt"),
 *   node: async () => {
 *     const fs = await import("fs/promises");
 *     return fs.readFile("file.txt", "utf-8");
 *   },
 *   bun: async () => await Bun.file("file.txt").text(),
 *   default: async () => { throw new Error("Unsupported runtime"); },
 * });
 * ```
 */
export async function matchAsync<T>(
  handlers: AsyncMatchHandlers<T>,
): Promise<T | undefined> {
  if (isDeno && handlers.deno) {
    return await handlers.deno();
  }
  if (isNode && handlers.node) {
    return await handlers.node();
  }
  if (isBun && handlers.bun) {
    return await handlers.bun();
  }
  if (isBrowser && handlers.browser) {
    return await handlers.browser();
  }
  if (handlers.default) {
    return await handlers.default();
  }
  return undefined;
}
