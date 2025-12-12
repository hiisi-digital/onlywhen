//----------------------------------------------------------------------------------------------------
// Copyright (c) 2025                    Hiisi Digital                    ort@hiisi.digital
// SPDX-License-Identifier: MPL-2.0      https://mozilla.org/MPL/2.0      contact@hiisi.digital
//----------------------------------------------------------------------------------------------------

/**
 * @module onlywhen
 *
 * Runtime configuration and conditional execution for JavaScript/TypeScript.
 * Inspired by Rust's `#[cfg()]` attribute.
 *
 * @example
 * ```ts
 * import { onlywhen } from "@hiisi/onlywhen";
 *
 * // Boolean checks
 * if (onlywhen.darwin) {
 *   macSpecificCode();
 * }
 *
 * // Short-circuit
 * onlywhen.deno && denoCode();
 *
 * // Combinators
 * if (onlywhen.all(onlywhen.node, onlywhen.linux)) {
 *   nodeOnLinuxCode();
 * }
 *
 * // Decorators
 * @onlywhen(onlywhen.darwin)
 * class MacOnly {}
 * ```
 */

// =============================================================================
// Main Export
// =============================================================================

export { onlywhen } from "./src/cfg.ts";

// =============================================================================
// Detection Utilities
// =============================================================================

export {
  arch,
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
  platform,
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
  AsyncMatchHandlers,
  Cfg,
  CfgDecorator,
  ClassDecorator,
  FeatureConfig,
  MatchHandlers,
  MethodDecorator,
  Platform,
  RuntimeName,
} from "./src/types.ts";
