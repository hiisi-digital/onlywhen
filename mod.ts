//----------------------------------------------------------------------------------------------------
// Copyright (c) 2025                    Hiisi Digital                    ort@hiisi.digital
// SPDX-License-Identifier: MPL-2.0      https://mozilla.org/MPL/2.0      contact@hiisi.digital
//----------------------------------------------------------------------------------------------------

/**
 * @module onlywhen
 *
 * Conditional code based on platform, runtime, or feature flags.
 *
 * `onlywhen` picks up on platform, runtime, and architecture. You can combine them,
 * branch on them, or use them as decorators. Simple enough that tooling can inline
 * them (static analysis pass in the works).
 *
 * @example Boolean checks
 * ```ts
 * import { onlywhen } from "@hiisi/onlywhen";
 *
 * if (onlywhen.darwin) {
 *   macSpecificCode();
 * }
 * ```
 *
 * @example Short-circuit
 * ```ts
 * onlywhen.deno && denoCode();
 * ```
 *
 * @example Combinators
 * ```ts
 * if (onlywhen.all(onlywhen.node, onlywhen.linux)) {
 *   nodeOnLinuxCode();
 * }
 * ```
 *
 * @example Decorators
 * ```ts
 * @onlywhen(onlywhen.darwin)
 * class MacOnly {}
 * ```
 *
 * @example Ergonomic imports (Rust-like syntax)
 * ```ts
 * import { onlywhen, platform, runtime, arch, all } from "@hiisi/onlywhen";
 *
 * // Much cleaner than onlywhen.all(onlywhen.linux, onlywhen.x64)
 * @onlywhen(all(platform.linux, arch.x64))
 * class LinuxX64Only {}
 *
 * if (runtime.node) {
 *   nodeSpecificCode();
 * }
 * ```
 */

// =============================================================================
// Main Export
// =============================================================================

export { onlywhen } from "./src/cfg.ts";

// =============================================================================
// Detection - Namespace Objects (primary API)
// =============================================================================

// Namespace objects for cleaner, Rust-like ergonomics:
//   platform.darwin, platform.linux, platform.windows
//   runtime.deno, runtime.node, runtime.bun, runtime.browser
//   arch.x64, arch.arm64
export { arch, platform, runtime } from "./src/detection.ts";

// =============================================================================
// Detection - String Values
// =============================================================================

// String values for when you need the actual detected value
export { archName, platformName } from "./src/detection.ts";

// =============================================================================
// Detection - Individual Booleans (legacy, prefer namespace objects)
// =============================================================================

export {
  getRuntimeName,
  isArm64,
  isBrowser,
  isBun,
  isDarwin,
  isDeno,
  isLinux,
  isNode,
  isWindows,
  isX64,
} from "./src/detection.ts";

// =============================================================================
// Combinators
// =============================================================================

export { all, any, not } from "./src/combinators.ts";

// =============================================================================
// Features
// =============================================================================

export {
  disableFeature,
  enabledFeatures,
  enableFeature,
  feature,
  getAllFeatures,
  hasFeature,
} from "./src/features.ts";

// =============================================================================
// Decorators
// =============================================================================

export { createCfgDecorator } from "./src/decorators.ts";

// =============================================================================
// Match
// =============================================================================

export { match, matchAsync } from "./src/match.ts";

// =============================================================================
// Types
// =============================================================================

export type {
  Architecture,
  ArchNamespace,
  AsyncMatchHandlers,
  Cfg,
  CfgDecorator,
  ClassDecorator,
  FeatureConfig,
  MatchHandlers,
  MethodDecorator,
  Platform,
  PlatformNamespace,
  RuntimeName,
  RuntimeNamespace,
} from "./src/types.ts";
