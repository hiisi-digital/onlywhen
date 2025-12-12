//----------------------------------------------------------------------------------------------------
// Copyright (c) 2025                    Hiisi Digital                    ort@hiisi.digital
// SPDX-License-Identifier: MPL-2.0      https://mozilla.org/MPL/2.0      contact@hiisi.digital
//----------------------------------------------------------------------------------------------------

/**
 * @module transform/types
 *
 * Type definitions for the static analysis transform.
 */

// =============================================================================
// Target Configuration
// =============================================================================

/**
 * Platform targets for static analysis.
 * When specified, `onlywhen.darwin` etc. will be replaced with `true`/`false`.
 */
export type TargetPlatform = "darwin" | "linux" | "windows";

/**
 * Runtime targets for static analysis.
 * When specified, `onlywhen.deno` etc. will be replaced with `true`/`false`.
 */
export type TargetRuntime = "deno" | "node" | "bun" | "browser";

/**
 * Architecture targets for static analysis.
 * When specified, `onlywhen.x64` etc. will be replaced with `true`/`false`.
 */
export type TargetArch = "x64" | "arm64";

/**
 * Configuration for static analysis transformation.
 *
 * Properties that are not specified will not be transformed,
 * leaving the runtime checks in place.
 *
 * @example
 * ```ts
 * // Transform for macOS + Node.js on ARM64
 * const config: TargetConfig = {
 *   platform: "darwin",
 *   runtime: "node",
 *   arch: "arm64",
 *   features: ["experimental"],
 * };
 * ```
 */
export interface TargetConfig {
  /**
   * Target platform. When set:
   * - `onlywhen.darwin` becomes `true` if platform is "darwin", `false` otherwise
   * - `onlywhen.linux` becomes `true` if platform is "linux", `false` otherwise
   * - `onlywhen.windows` becomes `true` if platform is "windows", `false` otherwise
   *
   * When undefined, platform checks are left as runtime checks.
   */
  platform?: TargetPlatform;

  /**
   * Target runtime. When set:
   * - `onlywhen.deno` becomes `true` if runtime is "deno", `false` otherwise
   * - `onlywhen.node` becomes `true` if runtime is "node", `false` otherwise
   * - `onlywhen.bun` becomes `true` if runtime is "bun", `false` otherwise
   * - `onlywhen.browser` becomes `true` if runtime is "browser", `false` otherwise
   *
   * When undefined, runtime checks are left as runtime checks.
   */
  runtime?: TargetRuntime;

  /**
   * Target architecture. When set:
   * - `onlywhen.x64` becomes `true` if arch is "x64", `false` otherwise
   * - `onlywhen.arm64` becomes `true` if arch is "arm64", `false` otherwise
   *
   * When undefined, architecture checks are left as runtime checks.
   */
  arch?: TargetArch;

  /**
   * Enabled feature flags. When set:
   * - `onlywhen.feature("name")` becomes `true` if name is in features array
   * - `onlywhen.feature("name")` becomes `false` if name is not in features array
   *
   * When undefined, feature checks are left as runtime checks.
   */
  features?: string[];
}

// =============================================================================
// Transform Options
// =============================================================================

/**
 * Options for the transform function.
 */
export interface TransformOptions {
  /**
   * The module specifiers that identify the onlywhen import.
   * Defaults to common specifiers like "@hiisi/onlywhen", "onlywhen", etc.
   */
  moduleSpecifiers?: string[];

  /**
   * Whether to generate source maps.
   * @default false
   */
  sourceMap?: boolean;

  /**
   * Original filename (used for source maps and error messages).
   */
  filename?: string;
}

// =============================================================================
// Transform Result
// =============================================================================

/**
 * Result of a transform operation.
 */
export interface TransformResult {
  /**
   * The transformed source code.
   */
  code: string;

  /**
   * Number of transformations applied.
   */
  transformCount: number;

  /**
   * Detailed list of transformations (for debugging/logging).
   */
  transformations: TransformInfo[];

  /**
   * Source map (if requested in options).
   */
  sourceMap?: string;
}

/**
 * Information about a single transformation.
 */
export interface TransformInfo {
  /**
   * Type of transformation.
   */
  type: "property" | "combinator" | "feature" | "decorator";

  /**
   * Original expression (e.g., "onlywhen.darwin").
   */
  original: string;

  /**
   * Replacement value or description.
   */
  replacement: string;

  /**
   * Line number in source (1-indexed).
   */
  line: number;

  /**
   * Column number in source (0-indexed).
   */
  column: number;
}

// =============================================================================
// Internal Types
// =============================================================================

/**
 * Mapping of property names to their category.
 * Used internally to determine what kind of property is being accessed.
 */
export interface PropertyMapping {
  platform: Record<string, TargetPlatform>;
  runtime: Record<string, TargetRuntime>;
  arch: Record<string, TargetArch>;
}
