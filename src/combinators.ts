//----------------------------------------------------------------------------------------------------
// Copyright (c) 2025                    Hiisi Digital                    ort@hiisi.digital
// SPDX-License-Identifier: MPL-2.0      https://mozilla.org/MPL/2.0      contact@hiisi.digital
//----------------------------------------------------------------------------------------------------

/**
 * @module combinators
 *
 * Logical combinators for combining conditions.
 * These mirror Rust's cfg combinators: all(), any(), not().
 */

// =============================================================================
// Combinators
// =============================================================================

/**
 * Returns true if all conditions are true.
 * Equivalent to Rust's `#[cfg(all(...))]`.
 *
 * @param conditions - Variable number of boolean conditions
 * @returns True if all conditions are true, false otherwise
 *
 * @example
 * ```ts
 * if (all(onlywhen.darwin, onlywhen.arm64)) {
 *   // Apple Silicon Mac only
 * }
 * ```
 */
export function all(...conditions: boolean[]): boolean {
  return conditions.every((c) => c);
}

/**
 * Returns true if any condition is true.
 * Equivalent to Rust's `#[cfg(any(...))]`.
 *
 * @param conditions - Variable number of boolean conditions
 * @returns True if at least one condition is true, false otherwise
 *
 * @example
 * ```ts
 * if (any(onlywhen.node, onlywhen.bun)) {
 *   // Node.js or Bun
 * }
 * ```
 */
export function any(...conditions: boolean[]): boolean {
  return conditions.some((c) => c);
}

/**
 * Negates a condition.
 * Equivalent to Rust's `#[cfg(not(...))]`.
 *
 * @param condition - The condition to negate
 * @returns The negated condition
 *
 * @example
 * ```ts
 * if (not(onlywhen.windows)) {
 *   // Not Windows (i.e., POSIX-like)
 * }
 * ```
 */
export function not(condition: boolean): boolean {
  return !condition;
}
