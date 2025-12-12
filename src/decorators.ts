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
// Shared No-Op Function
// =============================================================================

/**
 * Shared no-op function used for all disabled methods.
 * Using a single function instance reduces memory allocation.
 */
function noop(): undefined {
  return undefined;
}

// =============================================================================
// Decorator Factory
// =============================================================================

/**
 * Creates a decorator that conditionally enables a class or method.
 *
 * When the condition is false:
 * - Class decorators return an inert class with no-op methods
 * - Method decorators replace the method with a no-op
 *
 * @param condition - The boolean condition to evaluate
 * @returns A decorator that enables/disables based on the condition
 *
 * @example
 * ```ts
 * // Class decorator - becomes inert class if condition is false
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
  // Fast path: if condition is true, return a pass-through decorator
  if (condition) {
    // deno-lint-ignore no-explicit-any
    return function passthrough<T>(target: T, _propertyKey?: string | symbol, descriptor?: any): T {
      return descriptor !== undefined ? descriptor : target;
    } as CfgDecorator;
  }

  // Condition is false: return a decorator that disables
  // deno-lint-ignore no-explicit-any
  return function disabler(target: any, propertyKey?: string | symbol, descriptor?: any): any {
    // Determine if this is a class decorator or method decorator
    if (propertyKey === undefined && descriptor === undefined) {
      // Class decorator
      return createInertClass(target);
    }

    if (descriptor !== undefined) {
      // Method decorator
      return createNoopDescriptor(descriptor);
    }

    // Fallback: return as-is
    return target;
  };
}

// =============================================================================
// Inert Class Factory
// =============================================================================

/**
 * Creates an inert class that replaces all methods with no-ops.
 * The inert class is created once at decoration time, not per-instantiation.
 */
function createInertClass<T extends new (...args: unknown[]) => unknown>(target: T): T {
  // Create the inert prototype once, upfront
  const inertPrototype = Object.create(target.prototype);

  // Replace all methods on the prototype with no-ops
  const propertyNames = Object.getOwnPropertyNames(target.prototype);
  for (let i = 0; i < propertyNames.length; i++) {
    const name = propertyNames[i];
    if (name !== "constructor") {
      const descriptor = Object.getOwnPropertyDescriptor(target.prototype, name);
      if (descriptor && typeof descriptor.value === "function") {
        inertPrototype[name] = noop;
      }
    }
  }

  // Create the inert constructor function
  // deno-lint-ignore no-explicit-any
  const InertClass = function (this: any): void {
    // No-op constructor - instance already has inert prototype
  } as unknown as T;

  // Set up the prototype
  InertClass.prototype = inertPrototype;
  inertPrototype.constructor = InertClass;

  // Preserve the class name for debugging
  Object.defineProperty(InertClass, "name", {
    value: target.name,
    writable: false,
    configurable: true,
  });

  // Copy static properties (except prototype, length, name)
  const staticProps = Object.getOwnPropertyNames(target);
  for (let i = 0; i < staticProps.length; i++) {
    const prop = staticProps[i];
    if (prop !== "prototype" && prop !== "length" && prop !== "name") {
      try {
        const descriptor = Object.getOwnPropertyDescriptor(target, prop);
        if (descriptor) {
          Object.defineProperty(InertClass, prop, descriptor);
        }
      } catch {
        // Skip properties that can't be copied
      }
    }
  }

  return InertClass;
}

// =============================================================================
// No-Op Descriptor Factory
// =============================================================================

/**
 * Creates a descriptor with the method replaced by a no-op.
 */
function createNoopDescriptor<T>(
  descriptor: TypedPropertyDescriptor<T>,
): TypedPropertyDescriptor<T> {
  // Only replace if the descriptor has a function value
  if (typeof descriptor.value === "function") {
    return {
      ...descriptor,
      value: noop as T,
    };
  }

  // For getters/setters, return as-is (could be extended later)
  return descriptor;
}
