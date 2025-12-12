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

// =============================================================================
// Detection Types
// =============================================================================

/**
 * Supported JavaScript runtime environments.
 *
 * - `deno` - Deno runtime
 * - `node` - Node.js runtime
 * - `bun` - Bun runtime
 * - `browser` - Browser environment
 * - `unknown` - Unrecognized environment
 */
export type RuntimeName = "deno" | "node" | "bun" | "browser" | "unknown";

/**
 * Supported operating system identifiers.
 *
 * - `darwin` - macOS
 * - `linux` - Linux
 * - `windows` - Windows
 * - `unknown` - Unrecognized platform
 */
export type Platform = "darwin" | "linux" | "windows" | "unknown";

/**
 * Supported CPU architecture identifiers.
 *
 * - `x86_64` - 64-bit x86 (AMD64)
 * - `aarch64` - 64-bit ARM (ARM64, Apple Silicon)
 * - `arm` - 32-bit ARM
 * - `x86` - 32-bit x86 (i386/i686)
 * - `unknown` - Unrecognized architecture
 */
export type Architecture = "x86_64" | "aarch64" | "arm" | "x86" | "unknown";

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
// Decorator Types
// =============================================================================

/**
 * A class decorator that can modify or replace a class constructor.
 *
 * @typeParam T - The constructor type being decorated
 */
export type ClassDecorator = <T extends new (...args: unknown[]) => unknown>(
  target: T,
) => T | void;

/**
 * A method decorator that can modify or replace a method descriptor.
 *
 * @typeParam T - The method type being decorated
 */
export type MethodDecorator = <T>(
  target: object,
  propertyKey: string | symbol,
  descriptor: TypedPropertyDescriptor<T>,
) => TypedPropertyDescriptor<T> | void;

/**
 * Combined decorator type that works on both classes and methods.
 *
 * This intersection type allows the same decorator to be applied
 * to either a class or a method, with appropriate behavior for each.
 */
export type CfgDecorator = ClassDecorator & MethodDecorator;

// =============================================================================
// Feature Flag Types
// =============================================================================

/**
 * Configuration object shape for feature flags.
 *
 * This interface describes the expected structure in `deno.json` or `package.json`
 * for defining feature flags.
 *
 * @example
 * ```json
 * {
 *   "features": ["experimental", "legacy_compat"]
 * }
 * ```
 */
export interface FeatureConfig {
  /** Array of enabled feature names */
  readonly features?: readonly string[];
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

// =============================================================================
// Main Cfg Interface
// =============================================================================

/**
 * The main `onlywhen` interface.
 *
 * This interface describes the full API of the `onlywhen` object:
 * - Callable as a decorator factory
 * - Boolean properties for platform/runtime/architecture detection
 * - Combinator methods (`all`, `any`, `not`)
 * - Feature flag methods and properties
 *
 * @example
 * ```ts
 * // As boolean checks
 * if (onlywhen.darwin) { ... }
 *
 * // As decorator
 * @onlywhen(onlywhen.deno)
 * class DenoOnly { ... }
 *
 * // With combinators
 * if (onlywhen.all(onlywhen.node, onlywhen.linux)) { ... }
 * ```
 */
export interface Cfg {
  // ---------------------------------------------------------------------------
  // Callable (decorator factory)
  // ---------------------------------------------------------------------------

  /**
   * Creates a decorator that conditionally enables the decorated class or method.
   *
   * When the condition is `false`:
   * - Class decorators return an inert class with no-op methods
   * - Method decorators replace the method with a no-op
   *
   * @param condition - The condition to evaluate
   * @returns A decorator that enables/disables based on the condition
   */
  (condition: boolean): CfgDecorator;

  // ---------------------------------------------------------------------------
  // Platform Detection
  // ---------------------------------------------------------------------------

  /** `true` when running on macOS */
  readonly darwin: boolean;

  /** `true` when running on Linux */
  readonly linux: boolean;

  /** `true` when running on Windows */
  readonly windows: boolean;

  // ---------------------------------------------------------------------------
  // Runtime Detection
  // ---------------------------------------------------------------------------

  /** `true` when running in Deno */
  readonly deno: boolean;

  /** `true` when running in Node.js */
  readonly node: boolean;

  /** `true` when running in Bun */
  readonly bun: boolean;

  /** `true` when running in a browser */
  readonly browser: boolean;

  // ---------------------------------------------------------------------------
  // Architecture Detection
  // ---------------------------------------------------------------------------

  /** `true` when running on x86_64 (AMD64) architecture */
  readonly x64: boolean;

  /** `true` when running on aarch64 (ARM64 / Apple Silicon) architecture */
  readonly arm64: boolean;

  // ---------------------------------------------------------------------------
  // Combinators
  // ---------------------------------------------------------------------------

  /**
   * Returns `true` if all conditions are `true`.
   *
   * Equivalent to Rust's `#[cfg(all(...))]`.
   *
   * @param conditions - Boolean conditions to check
   * @returns `true` if all conditions are `true`
   */
  all(...conditions: boolean[]): boolean;

  /**
   * Returns `true` if any condition is `true`.
   *
   * Equivalent to Rust's `#[cfg(any(...))]`.
   *
   * @param conditions - Boolean conditions to check
   * @returns `true` if at least one condition is `true`
   */
  any(...conditions: boolean[]): boolean;

  /**
   * Negates a condition.
   *
   * Equivalent to Rust's `#[cfg(not(...))]`.
   *
   * @param condition - The condition to negate
   * @returns The negated boolean value
   */
  not(condition: boolean): boolean;

  // ---------------------------------------------------------------------------
  // Feature Flags
  // ---------------------------------------------------------------------------

  /**
   * Checks if a feature flag is enabled.
   *
   * Features are loaded from `deno.json` or `package.json` at startup,
   * and can be enabled/disabled at runtime.
   *
   * @param name - The feature name to check
   * @returns `true` if the feature is enabled
   */
  feature(name: string): boolean;

  /**
   * The set of all currently enabled feature names.
   */
  readonly features: ReadonlySet<string>;
}
