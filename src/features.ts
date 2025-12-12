//----------------------------------------------------------------------------------------------------
// Copyright (c) 2025                    Hiisi Digital                    ort@hiisi.digital
// SPDX-License-Identifier: MPL-2.0      https://mozilla.org/MPL/2.0      contact@hiisi.digital
//----------------------------------------------------------------------------------------------------

/**
 * @module features
 *
 * Feature flag loading and management.
 * Loads features from deno.json or package.json.
 */

import { isBun, isDeno, isNode } from "./detection.ts";

// =============================================================================
// Types
// =============================================================================

interface ConfigWithFeatures {
  features?: string[];
}

// =============================================================================
// Feature Loading
// =============================================================================

/**
 * Attempts to read and parse a JSON config file.
 * Returns null if the file doesn't exist or can't be parsed.
 */
function tryReadConfig(path: string): ConfigWithFeatures | null {
  try {
    if (isDeno) {
      // deno-lint-ignore no-explicit-any
      const Deno = (globalThis as any).Deno;
      const text = Deno.readTextFileSync(path);
      return JSON.parse(text) as ConfigWithFeatures;
    }

    if (isNode || isBun) {
      // deno-lint-ignore no-explicit-any
      const process = (globalThis as any).process;
      // deno-lint-ignore no-explicit-any
      const require = (globalThis as any).require;

      if (typeof require === "function") {
        // CommonJS environment
        const fs = require("fs");
        const pathModule = require("path");
        const fullPath = pathModule.resolve(process.cwd(), path);
        if (fs.existsSync(fullPath)) {
          const text = fs.readFileSync(fullPath, "utf-8");
          return JSON.parse(text) as ConfigWithFeatures;
        }
      } else {
        // ESM environment - we can't use dynamic import synchronously
        // Features will need to be loaded asynchronously or pre-configured
        return null;
      }
    }
  } catch {
    // File doesn't exist or couldn't be parsed
    return null;
  }

  return null;
}

/**
 * Loads features from the appropriate config file.
 * Tries deno.json first, then package.json.
 */
function loadFeatures(): Set<string> {
  const features = new Set<string>();

  // Try deno.json first
  const denoConfig = tryReadConfig("deno.json");
  if (denoConfig?.features) {
    for (const feature of denoConfig.features) {
      features.add(feature);
    }
    return features;
  }

  // Fall back to package.json
  const packageConfig = tryReadConfig("package.json");
  if (packageConfig?.features) {
    for (const feature of packageConfig.features) {
      features.add(feature);
    }
    return features;
  }

  return features;
}

// =============================================================================
// Exported State
// =============================================================================

/**
 * The set of enabled features, loaded from config files.
 */
export const enabledFeatures: ReadonlySet<string> = loadFeatures();

/**
 * Checks if a feature flag is enabled.
 *
 * @param name - The name of the feature to check
 * @returns True if the feature is enabled in the config
 *
 * @example
 * ```ts
 * if (feature("experimental")) {
 *   experimentalCode();
 * }
 * ```
 */
export function feature(name: string): boolean {
  return enabledFeatures.has(name);
}

// =============================================================================
// Feature Management (for testing and dynamic configuration)
// =============================================================================

/**
 * Mutable feature set for testing and dynamic configuration.
 * This is separate from enabledFeatures to allow modification.
 */
const mutableFeatures = new Set<string>(enabledFeatures);

/**
 * Adds a feature flag at runtime.
 * Useful for testing or dynamic feature activation.
 *
 * @param name - The feature name to enable
 */
export function enableFeature(name: string): void {
  mutableFeatures.add(name);
}

/**
 * Removes a feature flag at runtime.
 * Useful for testing or dynamic feature deactivation.
 *
 * @param name - The feature name to disable
 */
export function disableFeature(name: string): void {
  mutableFeatures.delete(name);
}

/**
 * Checks if a feature is enabled (including runtime modifications).
 * This version includes dynamically enabled features.
 *
 * @param name - The feature name to check
 * @returns True if the feature is enabled
 */
export function hasFeature(name: string): boolean {
  return mutableFeatures.has(name);
}

/**
 * Gets all currently enabled features (including runtime modifications).
 */
export function getAllFeatures(): ReadonlySet<string> {
  return mutableFeatures;
}
