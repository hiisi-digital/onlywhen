//----------------------------------------------------------------------------------------------------
// Copyright (c) 2025                    Hiisi Digital                    ort@hiisi.digital
// SPDX-License-Identifier: MPL-2.0      https://mozilla.org/MPL/2.0      contact@hiisi.digital
//----------------------------------------------------------------------------------------------------

/**
 * @module transform/constants
 *
 * Constants for the static analysis transform.
 * Defines known property names, module specifiers, and mappings.
 */

import type { PropertyMapping, TargetArch, TargetPlatform, TargetRuntime } from "./types.ts";

// =============================================================================
// Module Specifiers
// =============================================================================

/**
 * Default module specifiers that identify the onlywhen import.
 * The transform will look for imports from these modules.
 */
export const DEFAULT_MODULE_SPECIFIERS: readonly string[] = [
  // JSR
  "@hiisi/onlywhen",
  "jsr:@hiisi/onlywhen",
  // npm
  "onlywhen",
  // Relative imports (for internal use)
  "./mod.ts",
  "../mod.ts",
] as const;

/**
 * The default export name we're looking for.
 */
export const DEFAULT_EXPORT_NAME = "onlywhen";

/**
 * Namespace export names for ergonomic imports.
 * These are exported as `platform`, `runtime`, `arch` from the main module.
 */
export const NAMESPACE_EXPORTS = {
  /** Platform namespace - `platform.darwin`, `platform.linux`, `platform.windows` */
  platform: {
    darwin: "darwin",
    linux: "linux",
    windows: "windows",
  } as Record<string, TargetPlatform>,
  /** Runtime namespace - `runtime.deno`, `runtime.node`, `runtime.bun`, `runtime.browser` */
  runtime: {
    deno: "deno",
    node: "node",
    bun: "bun",
    browser: "browser",
  } as Record<string, TargetRuntime>,
  /** Architecture namespace - `arch.x64`, `arch.arm64` */
  arch: {
    x64: "x64",
    arm64: "arm64",
  } as Record<string, TargetArch>,
} as const;

/**
 * Combinator function names that can be imported directly.
 * e.g., `import { all, any, not } from "@hiisi/onlywhen"`
 */
export const COMBINATOR_EXPORT_NAMES: ReadonlySet<string> = new Set([
  "all",
  "any",
  "not",
]);

// =============================================================================
// Property Mappings
// =============================================================================

/**
 * Platform property names and their corresponding target values.
 */
export const PLATFORM_PROPERTIES: Record<string, TargetPlatform> = {
  darwin: "darwin",
  linux: "linux",
  windows: "windows",
} as const;

/**
 * Runtime property names and their corresponding target values.
 */
export const RUNTIME_PROPERTIES: Record<string, TargetRuntime> = {
  deno: "deno",
  node: "node",
  bun: "bun",
  browser: "browser",
} as const;

/**
 * Architecture property names and their corresponding target values.
 */
export const ARCH_PROPERTIES: Record<string, TargetArch> = {
  x64: "x64",
  arm64: "arm64",
} as const;

/**
 * Combined property mapping for easy lookup.
 */
export const PROPERTY_MAPPING: PropertyMapping = {
  platform: PLATFORM_PROPERTIES,
  runtime: RUNTIME_PROPERTIES,
  arch: ARCH_PROPERTIES,
} as const;

/**
 * Set of all known boolean property names.
 * Used for quick lookup to determine if a property access should be considered.
 */
export const KNOWN_BOOLEAN_PROPERTIES: ReadonlySet<string> = new Set([
  ...Object.keys(PLATFORM_PROPERTIES),
  ...Object.keys(RUNTIME_PROPERTIES),
  ...Object.keys(ARCH_PROPERTIES),
]);

// =============================================================================
// Combinator Names
// =============================================================================

/**
 * Names of combinator methods that can be statically evaluated.
 */
export const COMBINATOR_METHODS: ReadonlySet<string> = new Set([
  "all",
  "any",
  "not",
]);

// =============================================================================
// Feature Method
// =============================================================================

/**
 * The method name for feature flag checks.
 */
export const FEATURE_METHOD = "feature";
