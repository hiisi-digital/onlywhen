# onlywhen

> Runtime configuration and conditional execution for JavaScript/TypeScript — inspired by Rust's `#[cfg()]`

[![JSR](https://jsr.io/badges/@hiisi/onlywhen)](https://jsr.io/@hiisi/onlywhen)
[![License: MPL-2.0](https://img.shields.io/badge/License-MPL%202.0-brightgreen.svg)](https://opensource.org/licenses/MPL-2.0)

## Overview

`onlywhen` provides a clean, ergonomic API for runtime detection and conditional execution across JavaScript runtimes and platforms. Write code that adapts to its environment with minimal boilerplate.

```typescript
import { onlywhen } from "@hiisi/onlywhen";

// Simple boolean checks
if (onlywhen.darwin) {
  macSpecificCode();
}

// Short-circuit pattern
onlywhen.deno && denoSpecificCode();

// Combinators
if (onlywhen.all(onlywhen.node, onlywhen.linux)) {
  nodeOnLinuxCode();
}

// Decorators
@onlywhen(onlywhen.darwin)
class MacOnlyFeature {
  // This class becomes inert on non-macOS platforms
}
```

## Installation

### Deno / JSR

```typescript
import { onlywhen } from "jsr:@hiisi/onlywhen";
```

Or add to your `deno.json`:

```json
{
  "imports": {
    "@hiisi/onlywhen": "jsr:@hiisi/onlywhen@^0.1.0"
  }
}
```

### Node.js / Bun (npm)

```bash
npm install onlywhen
```

```typescript
import { onlywhen } from "onlywhen";
```

## API

### Platform Detection

```typescript
onlywhen.darwin; // true on macOS
onlywhen.linux; // true on Linux
onlywhen.windows; // true on Windows
```

### Runtime Detection

```typescript
onlywhen.deno; // true in Deno
onlywhen.node; // true in Node.js
onlywhen.bun; // true in Bun
onlywhen.browser; // true in browser environments
```

### Architecture Detection

```typescript
onlywhen.x64; // true on x86_64
onlywhen.arm64; // true on aarch64 / Apple Silicon
```

### Combinators

```typescript
// All conditions must be true
onlywhen.all(onlywhen.darwin, onlywhen.arm64);

// At least one condition must be true
onlywhen.any(onlywhen.node, onlywhen.bun);

// Negation
onlywhen.not(onlywhen.windows);
```

### Feature Flags

Define features in your `deno.json` or `package.json`:

```json
{
  "features": ["experimental", "legacy_compat", "verbose_logging"]
}
```

Then check them at runtime:

```typescript
onlywhen.feature("experimental"); // true if in features array
onlywhen.feature("nonexistent"); // false

onlywhen.features; // Set<string> of all active features
```

### Decorators

Use `onlywhen` as a decorator to conditionally enable classes or methods:

```typescript
// Class decorator - becomes empty class if condition is false
@onlywhen(onlywhen.darwin)
class MacFeatures {
  setup() {/* ... */}
}

// Method decorator - becomes no-op if condition is false
class App {
  @onlywhen(onlywhen.deno)
  denoMethod() {/* ... */}

  @onlywhen(onlywhen.all(onlywhen.linux, onlywhen.x64))
  linuxX64Method() {/* ... */}

  @onlywhen(onlywhen.not(onlywhen.windows))
  posixMethod() {/* ... */}

  @onlywhen(onlywhen.feature("experimental"))
  experimentalMethod() {/* ... */}
}
```

## Usage Patterns

### Pattern 1: If Statements

```typescript
if (onlywhen.darwin) {
  macCode();
}

if (onlywhen.all(onlywhen.deno, onlywhen.darwin)) {
  denoMacCode();
}

if (onlywhen.any(onlywhen.node, onlywhen.bun)) {
  npmRuntimeCode();
}

if (onlywhen.not(onlywhen.windows)) {
  unixCode();
}

if (onlywhen.feature("experimental")) {
  experimentalCode();
}
```

### Pattern 2: Short-Circuit

```typescript
onlywhen.darwin && macCode();
onlywhen.deno && denoCode();
onlywhen.feature("legacy") && legacyCode();
```

### Pattern 3: Runtime Matching

```typescript
import { match } from "@hiisi/onlywhen";

const result = match({
  deno: () => Deno.readTextFileSync("file.txt"),
  node: () => require("fs").readFileSync("file.txt", "utf-8"),
  bun: () => Bun.file("file.txt").text(),
  default: () => {
    throw new Error("Unsupported runtime");
  },
});
```

## Comparison to Rust

| Rust                                        | onlywhen                                                |
| ------------------------------------------- | ------------------------------------------------------- |
| `#[cfg(target_os = "macos")]`               | `@onlywhen(onlywhen.darwin)`                            |
| `#[cfg(all(unix, target_arch = "x86_64"))]` | `@onlywhen(onlywhen.all(onlywhen.linux, onlywhen.x64))` |
| `cfg!(target_os = "windows")`               | `onlywhen.windows` (in `if`)                            |
| `#[cfg(feature = "experimental")]`          | `@onlywhen(onlywhen.feature("experimental"))`           |
| `#[cfg(not(windows))]`                      | `@onlywhen(onlywhen.not(onlywhen.windows))`             |

## Future: Static Analysis

The API is designed so a future build tool plugin can:

1. Recognize patterns: `if (onlywhen.darwin)`, `onlywhen.darwin &&`, `@onlywhen(onlywhen.darwin)`
2. Replace with constants: `onlywhen.darwin` → `true` or `false`
3. Dead code elimination: Remove unreachable branches
4. Platform-specific bundles: Build separate bundles per platform

This is exactly how `process.env.NODE_ENV` works in production bundlers.

## License

[MPL-2.0](LICENSE) © [Hiisi Digital](https://hiisi.digital)
