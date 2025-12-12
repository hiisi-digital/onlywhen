//----------------------------------------------------------------------------------------------------
// Copyright (c) 2025                    Hiisi Digital                    ort@hiisi.digital
// SPDX-License-Identifier: MPL-2.0      https://mozilla.org/MPL/2.0      contact@hiisi.digital
//----------------------------------------------------------------------------------------------------

/**
 * @module src/mod
 *
 * Internal module exports for onlywhen.
 *
 * Re-exports all functionality from submodules for use by the root mod.ts.
 */

// =============================================================================
// Main Export
// =============================================================================

export { onlywhen } from "./cfg.ts";

// =============================================================================
// Detection
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
} from "./detection.ts";

// =============================================================================
// Combinators
// =============================================================================

export { all, any, not } from "./combinators.ts";

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
} from "./features.ts";

// =============================================================================
// Decorators
// =============================================================================

export { createCfgDecorator } from "./decorators.ts";

// =============================================================================
// Match
// =============================================================================

export { match, matchAsync } from "./match.ts";

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
} from "./types.ts";
