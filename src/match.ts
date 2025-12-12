//----------------------------------------------------------------------------------------------------
// Copyright (c) 2025                    Hiisi Digital                    ort@hiisi.digital
// SPDX-License-Identifier: MPL-2.0      https://mozilla.org/MPL/2.0      contact@hiisi.digital
//----------------------------------------------------------------------------------------------------

/**
 * @module match
 *
 * Runtime-specific code execution via pattern matching.
 *
 * Provides `match()` and `matchAsync()` for executing different code
 * depending on the current runtime environment.
 */

import { isBrowser, isBun, isDeno, isNode } from "./detection.ts";
import type { AsyncMatchHandlers, MatchHandlers } from "./types.ts";

// =============================================================================
// Synchronous Match
// =============================================================================

/**
 * Executes different functions based on the current runtime.
 *
 * Checks runtimes in order: Deno, Bun, Node, Browser, then default.
 * Returns `undefined` if no handler matches and no default is provided.
 *
 * @typeParam T - The return type of the handlers
 * @param handlers - Object containing runtime-specific handler functions
 * @returns The result of the matched handler, or undefined if no match
 *
 * @example
 * ```ts
 * const content = match({
 *   deno: () => Deno.readTextFileSync("file.txt"),
 *   node: () => require("fs").readFileSync("file.txt", "utf-8"),
 *   bun: () => Bun.file("file.txt").text(),
 *   default: () => { throw new Error("Unsupported runtime"); },
 * });
 * ```
 */
export function match<T>(handlers: MatchHandlers<T>): T | undefined {
  // Check each runtime in order of specificity
  if (isDeno && handlers.deno !== undefined) {
    return handlers.deno();
  }

  if (isBun && handlers.bun !== undefined) {
    return handlers.bun();
  }

  if (isNode && handlers.node !== undefined) {
    return handlers.node();
  }

  if (isBrowser && handlers.browser !== undefined) {
    return handlers.browser();
  }

  // Fall back to default handler
  if (handlers.default !== undefined) {
    return handlers.default();
  }

  return undefined;
}

// =============================================================================
// Asynchronous Match
// =============================================================================

/**
 * Async version of `match()` for handlers that return promises.
 *
 * Checks runtimes in order: Deno, Bun, Node, Browser, then default.
 * Returns `undefined` if no handler matches and no default is provided.
 *
 * @typeParam T - The resolved type of the handler promises
 * @param handlers - Object containing async runtime-specific handler functions
 * @returns A promise resolving to the result of the matched handler
 *
 * @example
 * ```ts
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
  // Check each runtime in order of specificity
  if (isDeno && handlers.deno !== undefined) {
    return await handlers.deno();
  }

  if (isBun && handlers.bun !== undefined) {
    return await handlers.bun();
  }

  if (isNode && handlers.node !== undefined) {
    return await handlers.node();
  }

  if (isBrowser && handlers.browser !== undefined) {
    return await handlers.browser();
  }

  // Fall back to default handler
  if (handlers.default !== undefined) {
    return await handlers.default();
  }

  return undefined;
}
