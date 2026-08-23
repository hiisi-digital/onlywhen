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
import type {
  AsyncMatchHandlers,
  ExhaustiveAsyncMatchHandlers,
  ExhaustiveMatchHandlers,
  MatchHandlers,
} from "./types.ts";

// =============================================================================
// Synchronous Match
// =============================================================================

/**
 * Executes different functions based on the current runtime.
 *
 * Checks runtimes in order: Deno, Bun, Node, Browser, then default.
 * Returns `undefined` if no handler matches and no default is provided.
 *
 * With a `default` branch the result is `T`, because one of the branches always runs.
 * Without one it is `T | undefined`, because none may. That distinction is the two
 * overloads below: a single signature returning `T | undefined` made every caller who had
 * already written a default assert their way out of a case they had handled.
 *
 * @typeParam T - The return type of the handlers
 * @param handlers - Object containing runtime-specific handler functions
 * @returns The result of the matched handler
 *
 * @example
 * ```ts
 * declare const Bun: { file(p: string): { text(): Promise<string> } };
 * const content: Promise<string> = match({
 *   deno: () => Deno.readTextFile("file.txt"),
 *   bun: () => Bun.file("file.txt").text(),
 *   default: () => { throw new Error("Unsupported runtime"); },
 * });
 * ```
 */
/**
 * Which handler this runtime is owed, most specific first.
 *
 * The choosing is the whole of what `match` and `matchAsync` do; the calling
 * differs by an `await`. Written out in both, the order of specificity existed
 * twice, and a runtime added to one would have been missing from the other
 * with nothing to say so.
 */
function pick<H>(handlers: {
  deno?: H;
  bun?: H;
  node?: H;
  browser?: H;
  default?: H;
}): H | undefined {
  if (isDeno && handlers.deno !== undefined) return handlers.deno;
  if (isBun && handlers.bun !== undefined) return handlers.bun;
  if (isNode && handlers.node !== undefined) return handlers.node;
  if (isBrowser && handlers.browser !== undefined) return handlers.browser;
  return handlers.default;
}

/**
 * Run the handler this runtime is owed.
 *
 * @typeParam T - What the handlers return
 * @param handlers - One function per runtime, plus an optional default
 * @returns The handler's result, or `undefined` when none applies
 */
export function match<T>(handlers: ExhaustiveMatchHandlers<T>): T;
export function match<T>(handlers: MatchHandlers<T>): T | undefined;
export function match<T>(handlers: MatchHandlers<T>): T | undefined {
  return pick(handlers)?.();
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
export function matchAsync<T>(
  handlers: ExhaustiveAsyncMatchHandlers<T>,
): Promise<T>;
export function matchAsync<T>(
  handlers: AsyncMatchHandlers<T>,
): Promise<T | undefined>;
export async function matchAsync<T>(
  handlers: AsyncMatchHandlers<T>,
): Promise<T | undefined> {
  const handler = pick(handlers);
  return handler === undefined ? undefined : await handler();
}
