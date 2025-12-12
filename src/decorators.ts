//----------------------------------------------------------------------------------------------------
// Copyright (c) 2025                    Hiisi Digital                    ort@hiisi.digital
// SPDX-License-Identifier: MPL-2.0      https://mozilla.org/MPL/2.0      contact@hiisi.digital
//----------------------------------------------------------------------------------------------------

/**
 * @module decorators
 *
 * Decorator factory for conditional class and method execution.
 * Provides Rust-like #[cfg()] functionality for TypeScript.
 */

import type { CfgDecorator } from "./types.ts";

// =============================================================================
// Decorator Factory
// =============================================================================

/**
 * Creates a decorator that conditionally enables a class or method.
 *
 * When the condition is false:
 * - Class decorators return an empty class
 * - Method decorators replace the method with a no-op
 *
 * @param condition - The boolean condition to evaluate
 * @returns A decorator that enables/disables based on the condition
 *
 * @example
 * ```ts
 * // Class decorator - becomes empty class if condition is false
 * @createCfgDecorator(onlywhen.darwin)
 * class MacFeatures {
 *   setup() { ... }
 * }
 *
 * // Method decorator - becomes no-op if condition is false
 * class App {
 *   @createCfgDecorator(onlywhen.deno)
 *   denoMethod() { ... }
 * }
 * ```
 */
export function createCfgDecorator(condition: boolean): CfgDecorator {
  // deno-lint-ignore no-explicit-any
  return function decorator(target: any, propertyKey?: string | symbol, descriptor?: any): any {
    // Determine if this is a class decorator or method decorator
    if (propertyKey === undefined && descriptor === undefined) {
      // Class decorator
      return handleClassDecorator(condition, target);
    } else if (descriptor !== undefined) {
      // Method decorator
      return handleMethodDecorator(condition, descriptor);
    }

    // Fallback: return as-is
    return target;
  };
}

// =============================================================================
// Class Decorator Handler
// =============================================================================

/**
 * Handles class decoration.
 * If the condition is false, returns an inert class that has no-op methods.
 */
function handleClassDecorator<T extends new (...args: unknown[]) => unknown>(
  condition: boolean,
  target: T,
): T {
  if (condition) {
    // Condition is true: return the original class
    return target;
  }

  // Condition is false: return a class with no-op methods
  // We create a new class that doesn't extend the original to avoid constructor issues
  // deno-lint-ignore no-explicit-any
  const InertClass = function (this: any, ..._args: unknown[]): void {
    // No-op constructor - just create an empty object
    const propertyNames = Object.getOwnPropertyNames(target.prototype);
    for (const name of propertyNames) {
      if (name !== "constructor") {
        this[name] = function (): void {
          // No-op
        };
      }
    }
  } as unknown as T;

  // Set up prototype chain for instanceof checks
  InertClass.prototype = Object.create(target.prototype);
  InertClass.prototype.constructor = InertClass;

  // Preserve the class name for debugging
  Object.defineProperty(InertClass, "name", {
    value: target.name,
    writable: false,
  });

  return InertClass;
}

// =============================================================================
// Method Decorator Handler
// =============================================================================

/**
 * Handles method decoration.
 * If the condition is false, replaces the method with a no-op.
 */
function handleMethodDecorator<T>(
  condition: boolean,
  descriptor: TypedPropertyDescriptor<T>,
): TypedPropertyDescriptor<T> {
  if (condition) {
    // Condition is true: return the original descriptor
    return descriptor;
  }

  // Condition is false: replace the method with a no-op
  const originalMethod = descriptor.value;

  if (typeof originalMethod === "function") {
    // deno-lint-ignore no-explicit-any
    descriptor.value = function (this: unknown, ..._args: unknown[]): any {
      // No-op: return undefined
      return undefined;
    } as T;
  }

  return descriptor;
}
