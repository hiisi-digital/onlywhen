//----------------------------------------------------------------------------------------------------
// Copyright (c) 2025                    Hiisi Digital                    ort@hiisi.digital
// SPDX-License-Identifier: MPL-2.0      https://mozilla.org/MPL/2.0      contact@hiisi.digital
//----------------------------------------------------------------------------------------------------

/**
 * @module transform
 *
 * Static analysis and transformation for onlywhen.
 *
 * This module provides build-time transformation of onlywhen expressions
 * to boolean literals, enabling dead code elimination by bundlers.
 *
 * @example
 * ```ts
 * import { transform } from "@hiisi/onlywhen/transform";
 *
 * const result = await transform(
 *   `if (onlywhen.darwin) { macCode(); }`,
 *   { platform: "darwin" }
 * );
 * // result.code: `if (true) { macCode(); }`
 * ```
 */

// =============================================================================
// Main API
// =============================================================================

export { ensureTypeScript, transform, transformSync } from "./transformer.ts";

// =============================================================================
// Types
// =============================================================================

export type {
  TargetArch,
  TargetConfig,
  TargetPlatform,
  TargetRuntime,
  TransformInfo,
  TransformOptions,
  TransformResult,
} from "./types.ts";

// =============================================================================
// Constants (for advanced usage)
// =============================================================================

export {
  ARCH_PROPERTIES,
  COMBINATOR_METHODS,
  DEFAULT_EXPORT_NAME,
  DEFAULT_MODULE_SPECIFIERS,
  FEATURE_METHOD,
  KNOWN_BOOLEAN_PROPERTIES,
  PLATFORM_PROPERTIES,
  RUNTIME_PROPERTIES,
} from "./constants.ts";
