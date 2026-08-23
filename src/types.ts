//----------------------------------------------------------------------------------------------------
// Copyright (c) 2025                    Hiisi Digital                    ort@hiisi.digital
// SPDX-License-Identifier: MPL-2.0      https://mozilla.org/MPL/2.0      contact@hiisi.digital
//----------------------------------------------------------------------------------------------------

/**
 * @module types
 *
 * Core type definitions for onlywhen.
 *
 * This module contains all public types used throughout the library.
 * Types are organized into logical groups: detection, decorators, features, and match.
 */

import type {
  Architecture as TgtsArchitecture,
  Platform as TgtsPlatform,
  RuntimeName as TgtsRuntimeName,
} from "@hiisi/tgts";

// =============================================================================
// Detection Types
// =============================================================================

/**
 * The runtime, platform and architecture vocabulary.
 *
 * Taken from `@hiisi/tgts`, which owns it. This module used to declare its own
 * and the two disagreed: it said `x86_64` and `aarch64` where tgts says `x64`
 * and `arm64`, for the same two architectures, with no conversion between them
 * that anything outside tgts could reach.
 *
 * It also disagreed with itself. The property names on {@link ArchNamespace}
 * have always been `x64` and `arm64`, matching tgts, while the type alias said
 * otherwise. Adopting tgts fixes both at once.
 *
 * `unknown` is added on top because detection can fail and tgts, being a
 * catalogue of real targets, has no name for that.
 */
export type RuntimeName = TgtsRuntimeName | "unknown";

/** The operating system, from tgts, plus the case where detection failed. */
export type Platform = TgtsPlatform | "unknown";

/** The cpu architecture, from tgts, plus the case where detection failed. */
export type Architecture = TgtsArchitecture | "unknown";

// =============================================================================
// Namespace Types (for ergonomic imports)
// =============================================================================

/**
 * Platform detection namespace object.
 *
 * Provides cleaner access to platform booleans:
 * `platform.darwin`, `platform.linux`, `platform.windows`
 */
export interface PlatformNamespace {
  /** `true` when running on macOS */
  readonly darwin: boolean;
  /** `true` when running on Linux */
  readonly linux: boolean;
  /** `true` when running on Windows */
  readonly windows: boolean;
}

/**
 * Runtime detection namespace object.
 *
 * Provides cleaner access to runtime booleans:
 * `runtime.deno`, `runtime.node`, `runtime.bun`, `runtime.browser`
 */
export interface RuntimeNamespace {
  /** `true` when running in Deno */
  readonly deno: boolean;
  /** `true` when running in Node.js */
  readonly node: boolean;
  /** `true` when running in Bun */
  readonly bun: boolean;
  /** `true` when running in a browser */
  readonly browser: boolean;
}

/**
 * Architecture detection namespace object.
 *
 * Provides cleaner access to architecture booleans:
 * `arch.x64`, `arch.arm64`
 */
export interface ArchNamespace {
  /** `true` when running on x86_64 (AMD64) architecture */
  readonly x64: boolean;
  /** `true` when running on aarch64 (ARM64 / Apple Silicon) architecture */
  readonly arm64: boolean;
}

// =============================================================================
// Match Handler Types
// =============================================================================

/**
 * Handlers for runtime-specific synchronous code execution.
 *
 * Provide handler functions for each runtime you want to support.
 * The `default` handler is called if no runtime matches.
 *
 * @typeParam T - The return type of the handlers
 *
 * @example
 * ```ts
 * const handlers: MatchHandlers<string> = {
 *   deno: () => Deno.readTextFileSync("file.txt"),
 *   node: () => fs.readFileSync("file.txt", "utf-8"),
 *   default: () => "",
 * };
 * ```
 */
export interface MatchHandlers<T> {
  /** Handler for Deno runtime */
  deno?: () => T;
  /** Handler for Node.js runtime */
  node?: () => T;
  /** Handler for Bun runtime */
  bun?: () => T;
  /** Handler for browser environment */
  browser?: () => T;
  /** Default handler if no runtime matches */
  default?: () => T;
}

/**
 * The same, with the default branch required.
 *
 * A `match` given one of these always produces a value, and its overload says so. The
 * distinction exists because the alternative is that every caller who wrote a default
 * still gets `T | undefined` back and has to assert their way out of a case they already
 * handled.
 */
export interface ExhaustiveMatchHandlers<T> extends MatchHandlers<T> {
  /** Runs when no runtime-specific handler matched. */
  default: () => T;
}

/**
 * Handlers for runtime-specific asynchronous code execution.
 *
 * Provide async handler functions for each runtime you want to support.
 * The `default` handler is called if no runtime matches.
 *
 * @typeParam T - The resolved type of the handler promises
 *
 * @example
 * ```ts
 * const handlers: AsyncMatchHandlers<string> = {
 *   deno: async () => await Deno.readTextFile("file.txt"),
 *   node: async () => await fs.promises.readFile("file.txt", "utf-8"),
 *   default: async () => "",
 * };
 * ```
 */
export interface AsyncMatchHandlers<T> {
  /** Handler for Deno runtime */
  deno?: () => Promise<T>;
  /** Handler for Node.js runtime */
  node?: () => Promise<T>;
  /** Handler for Bun runtime */
  bun?: () => Promise<T>;
  /** Handler for browser environment */
  browser?: () => Promise<T>;
  /** Default handler if no runtime matches */
  default?: () => Promise<T>;
}

/**
 * The same, with the default branch required.
 *
 * See {@link ExhaustiveMatchHandlers}; this is that, awaited.
 */
export interface ExhaustiveAsyncMatchHandlers<T> extends AsyncMatchHandlers<T> {
  /** Runs when no runtime-specific handler matched. */
  default: () => Promise<T>;
}
