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
  COMBINATOR_EXPORT_NAMES,
  COMBINATOR_METHODS,
  DEFAULT_EXPORT_NAME,
  DEFAULT_MODULE_SPECIFIERS,
  FEATURE_EXPORT_NAME,
  FEATURE_METHOD,
  KNOWN_BOOLEAN_PROPERTIES,
  NAMESPACE_EXPORTS,
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
 * Tracks namespace imports like platform, runtime, arch.
 */
interface NamespaceImportInfo {
  /** The local name used in the source */
  localName: string;
  /** The original export name (platform, runtime, arch) */
  exportName: "platform" | "runtime" | "arch";
}

/**
 * Tracks combinator function imports like all, any, not.
 */
interface CombinatorImportInfo {
  /** The local name used in the source */
  localName: string;
  /** The original export name (all, any, not) */
  exportName: "all" | "any" | "not";
}

/**
 * Tracks feature function import.
 */
interface FeatureImportInfo {
  /** The local name used in the source */
  localName: string;
}

/**
 * All import information for a source file.
 */
interface AllImports {
  /** onlywhen object imports */
  onlywhen: ImportInfo[];
  /** Namespace object imports (platform, runtime, arch) */
  namespaces: NamespaceImportInfo[];
  /** Combinator function imports (all, any, not) */
  combinators: CombinatorImportInfo[];
  /** Feature function import */
  feature: FeatureImportInfo | null;
}

/**
 * Find all imports from the onlywhen module including onlywhen object,
 * namespace objects (platform, runtime, arch), and combinator functions.
 */
function findAllImports(
  sourceFile: import("npm:typescript@^5.0").SourceFile,
  moduleSpecifiers: readonly string[],
): AllImports {
  const result: AllImports = {
    onlywhen: [],
    namespaces: [],
    combinators: [],
    feature: null,
  };
  const specifierSet = new Set(moduleSpecifiers);

  ts.forEachChild(sourceFile, (node) => {
    if (!ts.isImportDeclaration(node)) return;

    const moduleSpecifier = node.moduleSpecifier;
    if (!ts.isStringLiteral(moduleSpecifier)) return;

    const specifier = moduleSpecifier.text;

    // Check if this import is from one of our module specifiers
    const isOnlywhenImport = Array.from(specifierSet).some((s) =>
      specifier === s || specifier.startsWith(s + "@")
    );

    if (!isOnlywhenImport) return;

    const importClause = node.importClause;
    if (!importClause) return;

    if (importClause.namedBindings) {
      if (ts.isNamedImports(importClause.namedBindings)) {
        for (const element of importClause.namedBindings.elements) {
          const importedName = element.propertyName?.text ?? element.name.text;
          const localName = element.name.text;

          // Check for onlywhen
          if (importedName === DEFAULT_EXPORT_NAME) {
            result.onlywhen.push({ localName, isNamespace: false });
          } // Check for namespace objects (platform, runtime, arch)
          else if (importedName in NAMESPACE_EXPORTS) {
            result.namespaces.push({
              localName,
              exportName: importedName as "platform" | "runtime" | "arch",
            });
          } // Check for combinator functions (all, any, not)
          else if (COMBINATOR_EXPORT_NAMES.has(importedName)) {
            result.combinators.push({
              localName,
              exportName: importedName as "all" | "any" | "not",
            });
          } // Check for feature function
          else if (importedName === FEATURE_EXPORT_NAME) {
            result.feature = { localName };
          }
        }
      } else if (ts.isNamespaceImport(importClause.namedBindings)) {
        result.onlywhen.push({
          localName: importClause.namedBindings.name.text,
          isNamespace: true,
        });
      }
    }

    if (importClause.name) {
      result.onlywhen.push({
        localName: importClause.name.text,
        isNamespace: false,
      });
    }
  });

  return result;
}

// =============================================================================
// Value Resolution
// =============================================================================

/**
 * Resolves a namespace property to its boolean value.
 * e.g., platform.darwin, runtime.node, arch.x64
 */
function resolveNamespacePropertyValue(
  namespaceName: "platform" | "runtime" | "arch",
  propertyName: string,
  config: TargetConfig,
): boolean | undefined {
  const namespaceConfig = NAMESPACE_EXPORTS[namespaceName];
  if (!(propertyName in namespaceConfig)) return undefined;

  const targetValue = namespaceConfig[propertyName];

  switch (namespaceName) {
    case "platform":
      if (config.platform === undefined) return undefined;
      return config.platform === targetValue;
    case "runtime":
      if (config.runtime === undefined) return undefined;
      return config.runtime === targetValue;
    case "arch":
      if (config.arch === undefined) return undefined;
      return config.arch === targetValue;
  }
}

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
  args: readonly import("npm:typescript@^5.0").Expression[],
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
  arg: import("npm:typescript@^5.0").Expression,
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
  node: import("npm:typescript@^5.0").Node,
  sourceFile: import("npm:typescript@^5.0").SourceFile,
): { line: number; column: number } {
  const { line, character } = sourceFile.getLineAndCharacterOfPosition(
    node.getStart(sourceFile),
  );
  return { line: line + 1, column: character };
}

/**
 * Creates a boolean literal node.
 */
function createBooleanLiteral(value: boolean): import("npm:typescript@^5.0").Expression {
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
): import("npm:typescript@^5.0").TransformerFactory<import("npm:typescript@^5.0").SourceFile> {
  return (context) => {
    return (sourceFile) => {
      // Find all imports from the onlywhen module
      const allImports = findAllImports(sourceFile, moduleSpecifiers);

      // If no relevant imports, return unchanged
      const hasImports = allImports.onlywhen.length > 0 ||
        allImports.namespaces.length > 0 ||
        allImports.combinators.length > 0 ||
        allImports.feature !== null;

      if (!hasImports) {
        return sourceFile;
      }

      // Build sets and maps for quick lookup
      const onlywhenNames = new Set(allImports.onlywhen.map((i) => i.localName));
      const starImports = new Set(
        allImports.onlywhen.filter((i) => i.isNamespace).map((i) => i.localName),
      );

      // Map local names to their namespace export name (platform, runtime, arch)
      const namespaceLocalToExport = new Map<string, "platform" | "runtime" | "arch">();
      for (const ns of allImports.namespaces) {
        namespaceLocalToExport.set(ns.localName, ns.exportName);
      }

      // Map local names to their combinator export name (all, any, not)
      const combinatorLocalToExport = new Map<string, "all" | "any" | "not">();
      for (const comb of allImports.combinators) {
        combinatorLocalToExport.set(comb.localName, comb.exportName);
      }

      // Track the feature function local name
      const featureLocalName = allImports.feature?.localName;

      /**
       * Check if an identifier refers to onlywhen.
       */
      function isOnlywhenIdentifier(node: import("npm:typescript@^5.0").Node): boolean {
        return ts.isIdentifier(node) && onlywhenNames.has(node.text);
      }

      /**
       * Get the onlywhen object from a property access.
       * For star imports, we need: namespace.onlywhen
       * For named imports, we need: onlywhen
       */
      function getOnlywhenObject(
        node: import("npm:typescript@^5.0").PropertyAccessExpression,
      ): import("npm:typescript@^5.0").Expression | undefined {
        const expr = node.expression;

        // Direct access: onlywhen.darwin
        if (
          isOnlywhenIdentifier(expr) &&
          !starImports.has((expr as import("npm:typescript@^5.0").Identifier).text)
        ) {
          return expr;
        }

        // Star import access: namespace.onlywhen.darwin
        if (
          ts.isPropertyAccessExpression(expr) &&
          ts.isIdentifier(expr.expression) &&
          starImports.has(expr.expression.text) &&
          expr.name.text === DEFAULT_EXPORT_NAME
        ) {
          return expr;
        }

        return undefined;
      }

      /**
       * Check if a property access is on a namespace object (platform, runtime, arch).
       * Returns the namespace export name and property name if matched.
       */
      function getNamespaceAccess(
        node: import("npm:typescript@^5.0").PropertyAccessExpression,
      ): { namespace: "platform" | "runtime" | "arch"; property: string } | undefined {
        const expr = node.expression;

        // Direct access: platform.darwin, runtime.node, arch.x64
        if (ts.isIdentifier(expr)) {
          const nsName = namespaceLocalToExport.get(expr.text);
          if (nsName) {
            return { namespace: nsName, property: node.name.text };
          }
        }

        return undefined;
      }

      /**
       * Check if a call expression is a standalone combinator call.
       * Returns the combinator name if matched.
       */
      function getStandaloneCombinator(
        callee: import("npm:typescript@^5.0").Expression,
      ): "all" | "any" | "not" | undefined {
        if (ts.isIdentifier(callee)) {
          return combinatorLocalToExport.get(callee.text);
        }
        return undefined;
      }

      /**
       * Check if a call expression is a standalone feature() call.
       */
      function isStandaloneFeatureCall(
        callee: import("npm:typescript@^5.0").Expression,
      ): boolean {
        return ts.isIdentifier(callee) && callee.text === featureLocalName;
      }

      /**
       * Visitor function that transforms nodes.
       */
      function visitor(
        node: import("npm:typescript@^5.0").Node,
      ): import("npm:typescript@^5.0").Node {
        // Handle property access: onlywhen.darwin, platform.linux, runtime.node, arch.x64, etc.
        if (ts.isPropertyAccessExpression(node)) {
          // First check for namespace object access: platform.darwin, runtime.node, arch.x64
          const nsAccess = getNamespaceAccess(node);
          if (nsAccess) {
            const value = resolveNamespacePropertyValue(
              nsAccess.namespace,
              nsAccess.property,
              config,
            );
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

          // Then check for onlywhen object access: onlywhen.darwin, onlywhen.node, etc.
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

        // Handle method calls: onlywhen.all(...), all(...), etc.
        if (ts.isCallExpression(node)) {
          const callee = node.expression;

          // Check for standalone feature() call
          if (featureLocalName && isStandaloneFeatureCall(callee) && node.arguments.length === 1) {
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

          // Check for standalone combinator calls: all(...), any(...), not(...)
          const standaloneCombinator = getStandaloneCombinator(callee);
          if (standaloneCombinator) {
            // First, recursively transform arguments
            const transformedArgs = node.arguments.map((arg) =>
              ts.visitNode(arg, visitor) as import("npm:typescript@^5.0").Expression
            );

            // Try to evaluate the combinator
            const value = evaluateCombinator(standaloneCombinator, transformedArgs);
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

          // Check for onlywhen method calls: onlywhen.all(...), onlywhen.any(...), etc.
          if (ts.isPropertyAccessExpression(callee)) {
            const onlywhenObj = getOnlywhenObject(callee);
            if (onlywhenObj) {
              const methodName = callee.name.text;

              // Combinator methods: all, any, not
              if (COMBINATOR_METHODS.has(methodName)) {
                // First, recursively transform arguments
                const transformedArgs = node.arguments.map((arg) =>
                  ts.visitNode(arg, visitor) as import("npm:typescript@^5.0").Expression
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

        // =================================================================
        // Decorator Optimization: Strip decorators and transform bodies
        // =================================================================

        // Handle class declarations with decorators
        if (ts.isClassDeclaration(node) && node.modifiers) {
          const decorators = node.modifiers.filter(ts.isDecorator);
          const otherModifiers = node.modifiers.filter((m) => !ts.isDecorator(m));

          for (const decorator of decorators) {
            const evalResult = evaluateOnlywhenDecorator(decorator);
            if (evalResult !== undefined) {
              const pos = getNodePosition(decorator, sourceFile);

              if (evalResult === true) {
                // Condition is true: remove decorator, keep class unchanged
                transformations.push({
                  type: "decorator",
                  original: decorator.getText(sourceFile),
                  replacement: "(removed - condition true)",
                  line: pos.line,
                  column: pos.column,
                });

                // Remove this decorator, keep others and the class body
                const remainingDecorators = decorators.filter((d) => d !== decorator);
                const newModifiers = [...remainingDecorators, ...otherModifiers];

                // Visit children first, then rebuild
                const visitedMembers = node.members.map(
                  (m) => ts.visitNode(m, visitor) as import("npm:typescript@^5.0").ClassElement,
                );

                return ts.factory.updateClassDeclaration(
                  node,
                  newModifiers.length > 0 ? newModifiers : undefined,
                  node.name,
                  node.typeParameters,
                  node.heritageClauses,
                  visitedMembers,
                );
              } else {
                // Condition is false: remove decorator, replace class with inert stub
                transformations.push({
                  type: "decorator",
                  original: decorator.getText(sourceFile),
                  replacement: "(removed - class stubbed)",
                  line: pos.line,
                  column: pos.column,
                });

                // Create inert class with no-op methods
                const inertMembers: import("npm:typescript@^5.0").ClassElement[] = [];

                for (const member of node.members) {
                  if (ts.isMethodDeclaration(member) && member.name) {
                    // Replace method with no-op
                    inertMembers.push(
                      ts.factory.createMethodDeclaration(
                        member.modifiers?.filter((m) => !ts.isDecorator(m)),
                        member.asteriskToken,
                        member.name,
                        member.questionToken,
                        member.typeParameters,
                        member.parameters,
                        member.type,
                        ts.factory.createBlock([], false), // Empty body
                      ),
                    );
                  } else if (ts.isConstructorDeclaration(member)) {
                    // Keep constructor but make it empty
                    inertMembers.push(
                      ts.factory.createConstructorDeclaration(
                        member.modifiers?.filter((m) => !ts.isDecorator(m)),
                        member.parameters,
                        ts.factory.createBlock([], false),
                      ),
                    );
                  } else if (ts.isPropertyDeclaration(member)) {
                    // Keep property declarations but without initializers
                    inertMembers.push(
                      ts.factory.createPropertyDeclaration(
                        member.modifiers?.filter((m) => !ts.isDecorator(m)),
                        member.name,
                        member.questionToken || member.exclamationToken,
                        member.type,
                        undefined, // No initializer
                      ),
                    );
                  }
                  // Skip other members (getters, setters, etc.) or keep as-is
                }

                // Remove all decorators, keep other modifiers
                return ts.factory.updateClassDeclaration(
                  node,
                  otherModifiers.length > 0 ? otherModifiers : undefined,
                  node.name,
                  node.typeParameters,
                  node.heritageClauses,
                  inertMembers,
                );
              }
            }
          }
        }

        // Handle method declarations with decorators
        if (ts.isMethodDeclaration(node) && node.modifiers) {
          const decorators = node.modifiers.filter(ts.isDecorator);
          const otherModifiers = node.modifiers.filter((m) => !ts.isDecorator(m));

          for (const decorator of decorators) {
            const evalResult = evaluateOnlywhenDecorator(decorator);
            if (evalResult !== undefined) {
              const pos = getNodePosition(decorator, sourceFile);

              if (evalResult === true) {
                // Condition is true: remove decorator, keep method unchanged
                transformations.push({
                  type: "decorator",
                  original: decorator.getText(sourceFile),
                  replacement: "(removed - condition true)",
                  line: pos.line,
                  column: pos.column,
                });

                // Remove this decorator, keep others and the method body
                const remainingDecorators = decorators.filter((d) => d !== decorator);
                const newModifiers = [...remainingDecorators, ...otherModifiers];

                // Visit body
                const visitedBody = node.body
                  ? (ts.visitNode(node.body, visitor) as import("npm:typescript@^5.0").Block)
                  : undefined;

                return ts.factory.updateMethodDeclaration(
                  node,
                  newModifiers.length > 0 ? newModifiers : undefined,
                  node.asteriskToken,
                  node.name,
                  node.questionToken,
                  node.typeParameters,
                  node.parameters,
                  node.type,
                  visitedBody,
                );
              } else {
                // Condition is false: remove decorator, replace with no-op
                transformations.push({
                  type: "decorator",
                  original: decorator.getText(sourceFile),
                  replacement: "(removed - method stubbed)",
                  line: pos.line,
                  column: pos.column,
                });

                return ts.factory.updateMethodDeclaration(
                  node,
                  otherModifiers.length > 0 ? otherModifiers : undefined,
                  node.asteriskToken,
                  node.name,
                  node.questionToken,
                  node.typeParameters,
                  node.parameters,
                  node.type,
                  ts.factory.createBlock([], false), // Empty body
                );
              }
            }
          }
        }

        // Continue traversing
        return ts.visitEachChild(node, visitor, context);
      }

      /**
       * Evaluate an @onlywhen(...) decorator to a boolean if possible.
       * Returns true/false if evaluable, undefined otherwise.
       */
      function evaluateOnlywhenDecorator(
        decorator: import("npm:typescript@^5.0").Decorator,
      ): boolean | undefined {
        const expr = decorator.expression;

        // Must be a call expression: @onlywhen(...)
        if (!ts.isCallExpression(expr)) {
          return undefined;
        }

        const callee = expr.expression;

        // Check if callee is onlywhen identifier
        if (!isOnlywhenIdentifier(callee)) {
          return undefined;
        }

        // Must have exactly one argument
        if (expr.arguments.length !== 1) {
          return undefined;
        }

        const arg = expr.arguments[0];

        // Try to evaluate the argument to a boolean
        return evaluateExpressionToBoolean(arg);
      }

      /**
       * Recursively evaluate an expression to a boolean value.
       * Returns the boolean value if fully evaluable, undefined otherwise.
       */
      function evaluateExpressionToBoolean(
        node: import("npm:typescript@^5.0").Expression,
      ): boolean | undefined {
        // Boolean literals
        if (node.kind === ts.SyntaxKind.TrueKeyword) {
          return true;
        }
        if (node.kind === ts.SyntaxKind.FalseKeyword) {
          return false;
        }

        // Property access: onlywhen.darwin, platform.linux, etc.
        if (ts.isPropertyAccessExpression(node)) {
          // Check namespace access first: platform.darwin, runtime.node, arch.x64
          const nsAccess = getNamespaceAccess(node);
          if (nsAccess) {
            return resolveNamespacePropertyValue(nsAccess.namespace, nsAccess.property, config);
          }

          // Check onlywhen object access: onlywhen.darwin
          const onlywhenObj = getOnlywhenObject(node);
          if (onlywhenObj) {
            const propertyName = node.name.text;
            if (KNOWN_BOOLEAN_PROPERTIES.has(propertyName)) {
              return resolvePropertyValue(propertyName, config);
            }
          }
        }

        // Call expressions: all(...), any(...), not(...), feature(...)
        if (ts.isCallExpression(node)) {
          const callee = node.expression;

          // Standalone feature() call
          if (featureLocalName && isStandaloneFeatureCall(callee) && node.arguments.length === 1) {
            return evaluateFeature(node.arguments[0], config.features);
          }

          // Standalone combinators: all(...), any(...), not(...)
          const standaloneCombinator = getStandaloneCombinator(callee);
          if (standaloneCombinator) {
            const argValues = node.arguments.map((a) => evaluateExpressionToBoolean(a));
            if (argValues.every((v) => v !== undefined)) {
              return evaluateCombinatorValues(
                standaloneCombinator,
                argValues as boolean[],
              );
            }
          }

          // onlywhen.all(...), onlywhen.any(...), etc.
          if (ts.isPropertyAccessExpression(callee)) {
            const onlywhenObj = getOnlywhenObject(callee);
            if (onlywhenObj) {
              const methodName = callee.name.text;

              if (COMBINATOR_METHODS.has(methodName)) {
                const argValues = node.arguments.map((a) => evaluateExpressionToBoolean(a));
                if (argValues.every((v) => v !== undefined)) {
                  return evaluateCombinatorValues(methodName, argValues as boolean[]);
                }
              }

              if (methodName === FEATURE_METHOD && node.arguments.length === 1) {
                return evaluateFeature(node.arguments[0], config.features);
              }
            }
          }
        }

        return undefined;
      }

      /**
       * Evaluate combinator with known boolean values.
       */
      function evaluateCombinatorValues(
        combinator: string,
        values: boolean[],
      ): boolean | undefined {
        switch (combinator) {
          case "all":
            return values.every((v) => v);
          case "any":
            return values.some((v) => v);
          case "not":
            return values.length === 1 ? !values[0] : undefined;
          default:
            return undefined;
        }
      }

      return ts.visitNode(sourceFile, visitor) as import("npm:typescript@^5.0").SourceFile;
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
