//----------------------------------------------------------------------------------------------------
// Copyright (c) 2025                    Hiisi Digital                    ort@hiisi.digital
// SPDX-License-Identifier: MPL-2.0      https://mozilla.org/MPL/2.0      contact@hiisi.digital
//----------------------------------------------------------------------------------------------------

/**
 * @module transform/transformer
 *
 * Core transformer using TypeScript compiler API.
 * Transforms onlywhen property accesses and method calls to boolean literals
 * based on the target configuration.
 */

import {
  ARCH_PROPERTIES,
  COMBINATOR_METHODS,
  DEFAULT_EXPORT_NAME,
  DEFAULT_MODULE_SPECIFIERS,
  FEATURE_METHOD,
  KNOWN_BOOLEAN_PROPERTIES,
  PLATFORM_PROPERTIES,
  RUNTIME_PROPERTIES,
} from "./constants.ts";
import type { TargetConfig, TransformInfo, TransformOptions, TransformResult } from "./types.ts";

// =============================================================================
// TypeScript Import
// =============================================================================

// Import TypeScript - works in both Deno and Node
let ts: typeof import("npm:typescript@^5.0");

async function ensureTypeScript(): Promise<void> {
  if (!ts) {
    ts = await import("npm:typescript@^5.0");
  }
}

// =============================================================================
// Import Tracker
// =============================================================================

/**
 * Tracks imports of the onlywhen module to identify which identifiers
 * refer to the onlywhen object.
 */
interface ImportInfo {
  /** The local name used in the source (could be aliased) */
  localName: string;
  /** Whether this is a namespace import (import * as x) */
  isNamespace: boolean;
}

/**
 * Find all imports of onlywhen in the source file.
 */
function findOnlywhenImports(
  sourceFile: import("npm:typescript").SourceFile,
  moduleSpecifiers: readonly string[],
): ImportInfo[] {
  const imports: ImportInfo[] = [];
  const specifierSet = new Set(moduleSpecifiers);

  ts.forEachChild(sourceFile, (node) => {
    if (!ts.isImportDeclaration(node)) return;

    const moduleSpecifier = node.moduleSpecifier;
    if (!ts.isStringLiteral(moduleSpecifier)) return;

    const specifier = moduleSpecifier.text;

    // Check if this import is from one of our module specifiers
    // Also handle version-tagged specifiers like "jsr:@hiisi/onlywhen@^0.2"
    const isOnlywhenImport = Array.from(specifierSet).some((s) =>
      specifier === s || specifier.startsWith(s + "@")
    );

    if (!isOnlywhenImport) return;

    const importClause = node.importClause;
    if (!importClause) return;

    // Named imports: import { onlywhen } from "..."
    // or: import { onlywhen as cfg } from "..."
    if (importClause.namedBindings) {
      if (ts.isNamedImports(importClause.namedBindings)) {
        for (const element of importClause.namedBindings.elements) {
          const importedName = element.propertyName?.text ?? element.name.text;
          if (importedName === DEFAULT_EXPORT_NAME) {
            imports.push({
              localName: element.name.text,
              isNamespace: false,
            });
          }
        }
      } // Namespace import: import * as ow from "..."
      else if (ts.isNamespaceImport(importClause.namedBindings)) {
        imports.push({
          localName: importClause.namedBindings.name.text,
          isNamespace: true,
        });
      }
    }

    // Default import: import onlywhen from "..." (not our pattern, but handle it)
    if (importClause.name) {
      imports.push({
        localName: importClause.name.text,
        isNamespace: false,
      });
    }
  });

  return imports;
}

// =============================================================================
// Value Resolution
// =============================================================================

/**
 * Resolves a property name to its boolean value based on the target config.
 * Returns undefined if the property should not be transformed.
 */
function resolvePropertyValue(
  propertyName: string,
  config: TargetConfig,
): boolean | undefined {
  // Platform properties
  if (propertyName in PLATFORM_PROPERTIES) {
    if (config.platform === undefined) return undefined;
    return config.platform === PLATFORM_PROPERTIES[propertyName];
  }

  // Runtime properties
  if (propertyName in RUNTIME_PROPERTIES) {
    if (config.runtime === undefined) return undefined;
    return config.runtime === RUNTIME_PROPERTIES[propertyName];
  }

  // Architecture properties
  if (propertyName in ARCH_PROPERTIES) {
    if (config.arch === undefined) return undefined;
    return config.arch === ARCH_PROPERTIES[propertyName];
  }

  return undefined;
}

/**
 * Evaluates a combinator call if all arguments are boolean literals.
 * Returns undefined if the call cannot be statically evaluated.
 */
function evaluateCombinator(
  methodName: string,
  args: readonly import("npm:typescript").Expression[],
): boolean | undefined {
  // Extract boolean values from arguments
  const booleanArgs: boolean[] = [];

  for (const arg of args) {
    if (arg.kind === ts.SyntaxKind.TrueKeyword) {
      booleanArgs.push(true);
    } else if (arg.kind === ts.SyntaxKind.FalseKeyword) {
      booleanArgs.push(false);
    } else {
      // Non-literal argument - cannot evaluate statically
      return undefined;
    }
  }

  // Evaluate the combinator
  switch (methodName) {
    case "all":
      return booleanArgs.every((b) => b);
    case "any":
      return booleanArgs.some((b) => b);
    case "not":
      if (booleanArgs.length !== 1) return undefined;
      return !booleanArgs[0];
    default:
      return undefined;
  }
}

/**
 * Evaluates a feature check if the argument is a string literal.
 * Returns undefined if the check cannot be statically evaluated.
 */
function evaluateFeature(
  arg: import("npm:typescript").Expression,
  features: string[] | undefined,
): boolean | undefined {
  // Features must be configured to transform
  if (features === undefined) return undefined;

  // Argument must be a string literal
  if (!ts.isStringLiteral(arg)) return undefined;

  const featureName = arg.text;
  return features.includes(featureName);
}

// =============================================================================
// AST Utilities
// =============================================================================

/**
 * Gets the line and column of a node in the source file.
 */
function getNodePosition(
  node: import("npm:typescript").Node,
  sourceFile: import("npm:typescript").SourceFile,
): { line: number; column: number } {
  const { line, character } = sourceFile.getLineAndCharacterOfPosition(
    node.getStart(sourceFile),
  );
  return { line: line + 1, column: character };
}

/**
 * Creates a boolean literal node.
 */
function createBooleanLiteral(value: boolean): import("npm:typescript").Expression {
  return value ? ts.factory.createTrue() : ts.factory.createFalse();
}

// =============================================================================
// Transformer Factory
// =============================================================================

/**
 * Creates a TypeScript transformer that replaces onlywhen expressions
 * with boolean literals based on the target configuration.
 */
function createTransformerFactory(
  config: TargetConfig,
  moduleSpecifiers: readonly string[],
  transformations: TransformInfo[],
): import("npm:typescript").TransformerFactory<import("npm:typescript").SourceFile> {
  return (context) => {
    return (sourceFile) => {
      // Find all onlywhen imports in this file
      const imports = findOnlywhenImports(sourceFile, moduleSpecifiers);

      // If no onlywhen imports, return unchanged
      if (imports.length === 0) {
        return sourceFile;
      }

      // Build a set of local names that refer to onlywhen
      const onlywhenNames = new Set(imports.map((i) => i.localName));
      const namespaceImports = new Set(
        imports.filter((i) => i.isNamespace).map((i) => i.localName),
      );

      /**
       * Check if an identifier refers to onlywhen.
       */
      function isOnlywhenIdentifier(node: import("npm:typescript").Node): boolean {
        return ts.isIdentifier(node) && onlywhenNames.has(node.text);
      }

      /**
       * Get the onlywhen object from a property access.
       * For namespace imports, we need: namespace.onlywhen
       * For named imports, we need: onlywhen
       */
      function getOnlywhenObject(
        node: import("npm:typescript").PropertyAccessExpression,
      ): import("npm:typescript").Expression | undefined {
        const expr = node.expression;

        // Direct access: onlywhen.darwin
        if (
          isOnlywhenIdentifier(expr) &&
          !namespaceImports.has((expr as import("npm:typescript").Identifier).text)
        ) {
          return expr;
        }

        // Namespace access: namespace.onlywhen.darwin
        if (
          ts.isPropertyAccessExpression(expr) &&
          ts.isIdentifier(expr.expression) &&
          namespaceImports.has(expr.expression.text) &&
          expr.name.text === DEFAULT_EXPORT_NAME
        ) {
          return expr;
        }

        return undefined;
      }

      /**
       * Visitor function that transforms nodes.
       */
      function visitor(node: import("npm:typescript").Node): import("npm:typescript").Node {
        // Handle property access: onlywhen.darwin, onlywhen.node, etc.
        if (ts.isPropertyAccessExpression(node)) {
          const onlywhenObj = getOnlywhenObject(node);
          if (onlywhenObj) {
            const propertyName = node.name.text;

            // Check if this is a known boolean property
            if (KNOWN_BOOLEAN_PROPERTIES.has(propertyName)) {
              const value = resolvePropertyValue(propertyName, config);
              if (value !== undefined) {
                const pos = getNodePosition(node, sourceFile);
                transformations.push({
                  type: "property",
                  original: node.getText(sourceFile),
                  replacement: value ? "true" : "false",
                  line: pos.line,
                  column: pos.column,
                });
                return createBooleanLiteral(value);
              }
            }
          }
        }

        // Handle method calls: onlywhen.all(...), onlywhen.any(...), etc.
        if (ts.isCallExpression(node)) {
          const callee = node.expression;

          if (ts.isPropertyAccessExpression(callee)) {
            const onlywhenObj = getOnlywhenObject(callee);
            if (onlywhenObj) {
              const methodName = callee.name.text;

              // Combinator methods: all, any, not
              if (COMBINATOR_METHODS.has(methodName)) {
                // First, recursively transform arguments
                const transformedArgs = node.arguments.map((arg) =>
                  ts.visitNode(arg, visitor) as import("npm:typescript").Expression
                );

                // Try to evaluate the combinator
                const value = evaluateCombinator(methodName, transformedArgs);
                if (value !== undefined) {
                  const pos = getNodePosition(node, sourceFile);
                  transformations.push({
                    type: "combinator",
                    original: node.getText(sourceFile),
                    replacement: value ? "true" : "false",
                    line: pos.line,
                    column: pos.column,
                  });
                  return createBooleanLiteral(value);
                }

                // If we couldn't fully evaluate, but args were transformed,
                // create a new call with transformed args
                if (transformedArgs.some((arg, i) => arg !== node.arguments[i])) {
                  return ts.factory.updateCallExpression(
                    node,
                    callee,
                    node.typeArguments,
                    transformedArgs,
                  );
                }
              }

              // Feature method: feature("name")
              if (methodName === FEATURE_METHOD && node.arguments.length === 1) {
                const value = evaluateFeature(node.arguments[0], config.features);
                if (value !== undefined) {
                  const pos = getNodePosition(node, sourceFile);
                  transformations.push({
                    type: "feature",
                    original: node.getText(sourceFile),
                    replacement: value ? "true" : "false",
                    line: pos.line,
                    column: pos.column,
                  });
                  return createBooleanLiteral(value);
                }
              }
            }
          }
        }

        // Continue traversing
        return ts.visitEachChild(node, visitor, context);
      }

      return ts.visitNode(sourceFile, visitor) as import("npm:typescript").SourceFile;
    };
  };
}

// =============================================================================
// Public API
// =============================================================================

/**
 * Transforms source code by replacing onlywhen expressions with boolean literals.
 *
 * @param source - The source code to transform
 * @param config - The target configuration
 * @param options - Optional transform options
 * @returns The transform result
 *
 * @example
 * ```ts
 * const result = await transform(
 *   `if (onlywhen.darwin) { console.log("mac"); }`,
 *   { platform: "darwin" }
 * );
 * // result.code: `if (true) { console.log("mac"); }`
 * ```
 */
export async function transform(
  source: string,
  config: TargetConfig,
  options: TransformOptions = {},
): Promise<TransformResult> {
  await ensureTypeScript();

  const moduleSpecifiers = options.moduleSpecifiers ?? DEFAULT_MODULE_SPECIFIERS;
  const filename = options.filename ?? "input.ts";
  const transformations: TransformInfo[] = [];

  // Parse the source
  const sourceFile = ts.createSourceFile(
    filename,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );

  // Create and run the transformer
  const transformer = createTransformerFactory(config, moduleSpecifiers, transformations);
  const result = ts.transform(sourceFile, [transformer]);
  const transformedSourceFile = result.transformed[0];

  // Print the transformed source
  const printer = ts.createPrinter({
    newLine: ts.NewLineKind.LineFeed,
    removeComments: false,
  });
  const code = printer.printFile(transformedSourceFile);

  result.dispose();

  return {
    code,
    transformCount: transformations.length,
    transformations,
    sourceMap: undefined, // TODO: implement source map support
  };
}

/**
 * Synchronous version of transform.
 * Requires TypeScript to be already loaded (call ensureTypeScript first).
 */
export function transformSync(
  source: string,
  config: TargetConfig,
  options: TransformOptions = {},
): TransformResult {
  if (!ts) {
    throw new Error(
      "TypeScript not loaded. Call ensureTypeScript() first or use async transform().",
    );
  }

  const moduleSpecifiers = options.moduleSpecifiers ?? DEFAULT_MODULE_SPECIFIERS;
  const filename = options.filename ?? "input.ts";
  const transformations: TransformInfo[] = [];

  // Parse the source
  const sourceFile = ts.createSourceFile(
    filename,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );

  // Create and run the transformer
  const transformer = createTransformerFactory(config, moduleSpecifiers, transformations);
  const result = ts.transform(sourceFile, [transformer]);
  const transformedSourceFile = result.transformed[0];

  // Print the transformed source
  const printer = ts.createPrinter({
    newLine: ts.NewLineKind.LineFeed,
    removeComments: false,
  });
  const code = printer.printFile(transformedSourceFile);

  result.dispose();

  return {
    code,
    transformCount: transformations.length,
    transformations,
    sourceMap: undefined,
  };
}

/**
 * Pre-load TypeScript for use with transformSync.
 */
export { ensureTypeScript };
