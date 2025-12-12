//----------------------------------------------------------------------------------------------------
// Copyright (c) 2025                    Hiisi Digital                    ort@hiisi.digital
// SPDX-License-Identifier: MPL-2.0      https://mozilla.org/MPL/2.0      contact@hiisi.digital
//----------------------------------------------------------------------------------------------------

/**
 * @module types
 *
 * Core type definitions for onlywhen.
 */

// =============================================================================
// Platform & Runtime Types
// =============================================================================

/**
 * Supported JavaScript runtime environments.
 */
export type RuntimeName = "deno" | "node" | "bun" | "browser" | "unknown";

/**
 * Supported operating system / platform identifiers.
 */
export type Platform = "darwin" | "linux" | "windows" | "unknown";

/**
 * Supported CPU architecture identifiers.
 */
export type Architecture = "x86_64" | "aarch64" | "arm" | "x86" | "unknown";

// =============================================================================
// Decorator Types
// =============================================================================

/**
 * A class decorator that can modify or replace a class constructor.
 */
export type ClassDecorator = <T extends new (...args: unknown[]) => unknown>(
  target: T,
) => T | void;

/**
 * A method decorator that can modify or replace a method.
 */
export type MethodDecorator = <T>(
  target: object,
  propertyKey: string | symbol,
  descriptor: TypedPropertyDescriptor<T>,
) => TypedPropertyDescriptor<T> | void;

/**
 * Combined decorator type that works on both classes and methods.
 */
export type CfgDecorator = ClassDecorator & MethodDecorator;

// =============================================================================
// Feature Flags
// =============================================================================

/**
 * Configuration for feature flags, typically from deno.json or package.json.
 */
export interface FeatureConfig {
  /** Array of enabled feature names */
  readonly features?: readonly string[];
}

// =============================================================================
// Match Handler Types
// =============================================================================

/**
 * Handlers for runtime-specific code execution.
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
 * Async handlers for runtime-specific code execution.
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
 * The main configuration interface combining detection, combinators,
 * features, and decorator functionality.
 */
export interface Cfg {
  // -------------------------------------------------------------------------
  // Callable (decorator)
  // -------------------------------------------------------------------------

  /**
   * When called as a function, returns a decorator that conditionally
   * enables the decorated class or method.
   *
   * @param condition - The condition to evaluate
   * @returns A decorator that enables/disables based on the condition
   */
  (condition: boolean): CfgDecorator;

  // -------------------------------------------------------------------------
  // Platform Detection
  // -------------------------------------------------------------------------

  /** True when running on macOS */
  readonly darwin: boolean;

  /** True when running on Linux */
  readonly linux: boolean;

  /** True when running on Windows */
  readonly windows: boolean;

  // -------------------------------------------------------------------------
  // Runtime Detection
  // -------------------------------------------------------------------------

  /** True when running in Deno */
  readonly deno: boolean;

  /** True when running in Node.js */
  readonly node: boolean;

  /** True when running in Bun */
  readonly bun: boolean;

  /** True when running in a browser */
  readonly browser: boolean;

  // -------------------------------------------------------------------------
  // Architecture Detection
  // -------------------------------------------------------------------------

  /** True when running on x86_64 architecture */
  readonly x64: boolean;

  /** True when running on aarch64 / ARM64 / Apple Silicon */
  readonly arm64: boolean;

  // -------------------------------------------------------------------------
  // Combinators
  // -------------------------------------------------------------------------

  /**
   * Returns true if all conditions are true.
   *
   * @param conditions - Variable number of boolean conditions
   * @returns True if all conditions are true
   */
  all(...conditions: boolean[]): boolean;

  /**
   * Returns true if any condition is true.
   *
   * @param conditions - Variable number of boolean conditions
   * @returns True if at least one condition is true
   */
  any(...conditions: boolean[]): boolean;

  /**
   * Negates a condition.
   *
   * @param condition - The condition to negate
   * @returns The negated condition
   */
  not(condition: boolean): boolean;

  // -------------------------------------------------------------------------
  // Feature Flags
  // -------------------------------------------------------------------------

  /**
   * Checks if a feature flag is enabled.
   *
   * @param name - The name of the feature to check
   * @returns True if the feature is enabled
   */
  feature(name: string): boolean;

  /**
   * Set of all enabled feature names.
   */
  readonly features: ReadonlySet<string>;
}
