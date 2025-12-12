# `onlywhen`

<div align="center" style="text-align: center;">

[![GitHub Stars](https://img.shields.io/github/stars/hiisi-digital/onlywhen.svg)](https://github.com/hiisi-digital/onlywhen/stargazers)
[![JSR](https://jsr.io/badges/@hiisi/onlywhen)](https://jsr.io/@hiisi/onlywhen)
[![npm Version](https://img.shields.io/npm/v/onlywhen?logo=npm)](https://www.npmjs.com/package/onlywhen)
[![GitHub Issues](https://img.shields.io/github/issues/hiisi-digital/onlywhen.svg)](https://github.com/hiisi-digital/onlywhen/issues)
![License](https://img.shields.io/github/license/hiisi-digital/onlywhen?color=%23009689)

> Conditional code based on platform, runtime, or feature flags.

</div>

## What it does

`onlywhen` picks up on platform, runtime, and architecture. You can combine them,
branch on them, or use them as decorators. Simple enough that tooling can inline
them (static analysis pass included).

```typescript
import { onlywhen } from "@hiisi/onlywhen";

// Boolean checks
if (onlywhen.darwin) {
  macSpecificCode();
}

// Short-circuit
onlywhen.deno && denoSpecificCode();

// Combinators
if (onlywhen.all(onlywhen.node, onlywhen.linux)) {
  nodeOnLinuxCode();
}

// Decorators
@onlywhen(onlywhen.darwin)
class MacOnlyFeature {
  // Becomes an inert class on other platforms
}
```

## Installation

```bash
# npm / yarn / pnpm
npm install onlywhen

# Deno
deno add jsr:@hiisi/onlywhen
```

As a library:

```typescript
// Deno / JSR
import { onlywhen } from "jsr:@hiisi/onlywhen";

// Node.js
import { onlywhen } from "onlywhen";
```

Or add to your project:

```jsonc
// deno.json
{
  "imports": {
    "@hiisi/onlywhen": "jsr:@hiisi/onlywhen@^0.2"
  }
}

// package.json
{
  "dependencies": {
    "onlywhen": "^0.2"
  }
}
```

## Usage

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
onlywhen.browser; // true in browsers
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

// At least one must be true
onlywhen.any(onlywhen.node, onlywhen.bun);

// Negation
onlywhen.not(onlywhen.windows);
```

### Feature Flags

Define features in your `deno.json` or `package.json`:

```json
{
  "features": ["experimental", "legacy_compat"]
}
```

Check them at runtime:

```typescript
onlywhen.feature("experimental"); // true if listed
onlywhen.features; // Set<string> of all features
```

### Decorators

```typescript
// Class becomes empty if condition is false
@onlywhen(onlywhen.darwin)
class MacFeatures {
  setup() {/* ... */}
}

// Method becomes no-op if condition is false
class App {
  @onlywhen(onlywhen.deno)
  denoMethod() {/* ... */}

  @onlywhen(onlywhen.all(onlywhen.linux, onlywhen.x64))
  linuxX64Method() {/* ... */}

  @onlywhen(onlywhen.feature("experimental"))
  experimentalMethod() {/* ... */}
}
```

### Runtime Matching

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
| :------------------------------------------ | :------------------------------------------------------ |
| `#[cfg(target_os = "macos")]`               | `@onlywhen(onlywhen.darwin)`                            |
| `#[cfg(all(unix, target_arch = "x86_64"))]` | `@onlywhen(onlywhen.all(onlywhen.linux, onlywhen.x64))` |
| `cfg!(target_os = "windows")`               | `onlywhen.windows`                                      |
| `#[cfg(feature = "experimental")]`          | `@onlywhen(onlywhen.feature("experimental"))`           |
| `#[cfg(not(windows))]`                      | `@onlywhen(onlywhen.not(onlywhen.windows))`             |

## Static Analysis Transform

The `@hiisi/onlywhen/transform` module replaces onlywhen expressions with boolean
literals at build time. Bundlers can then eliminate dead branches, reducing bundle
size and removing code that would never run.

### When to use it

- **Deploying to a known environment** - If you're deploying to Linux servers,
  bake in `platform: "linux"` and let the bundler remove Windows/macOS code paths.

- **Building platform-specific binaries** - When using `deno compile` or building
  separate npm packages per platform.

- **Reducing bundle size** - Code behind `if (onlywhen.darwin)` on a Linux deploy
  is dead weight. The transform removes it.

- **Feature flag cleanup** - Ship builds with specific features baked in or out.

### When NOT to use it

- **Building libraries for others** - Don't bake in platform assumptions. Let
  consumers do their own transforms or use runtime detection.

- **Cross-platform packages** - If the same bundle runs everywhere, keep runtime
  detection.

### API usage

```typescript
import { transform } from "@hiisi/onlywhen/transform";

const source = `
import { onlywhen } from "@hiisi/onlywhen";
if (onlywhen.darwin) { macCode(); }
if (onlywhen.linux) { linuxCode(); }
`;

const result = await transform(source, {
  platform: "linux",
  runtime: "node",
  arch: "x64",
  features: ["production"],
});

// result.code:
// if (false) { macCode(); }
// if (true) { linuxCode(); }
//
// A minifier will then remove the dead `if (false)` branch entirely.
```

### CLI usage

```bash
# Transform a file
deno run -A jsr:@hiisi/onlywhen/cli transform \
  --platform=linux --runtime=node \
  src/app.ts -o dist/app.ts

# Transform a directory
deno run -A jsr:@hiisi/onlywhen/cli transform \
  --platform=darwin --arch=arm64 \
  src/ -o dist/
```

### Integration examples

#### Deno compile

Transform before compiling to a standalone binary:

```jsonc
// deno.json
{
  "tasks": {
    "build:linux": "deno run -A jsr:@hiisi/onlywhen/cli transform --platform=linux --runtime=deno src/ -o .build/ && deno compile --target=x86_64-unknown-linux-gnu --output=myapp-linux .build/main.ts",
    "build:macos": "deno run -A jsr:@hiisi/onlywhen/cli transform --platform=darwin --runtime=deno src/ -o .build/ && deno compile --target=aarch64-apple-darwin --output=myapp-macos .build/main.ts"
  }
}
```

#### npm package builds (dnt)

Transform before running dnt to create Node-specific packages:

```typescript
// scripts/build-npm.ts
import { transform } from "jsr:@hiisi/onlywhen/transform";
import { build } from "jsr:@deno/dnt";

// Transform source for Node.js target
for await (const entry of Deno.readDir("src")) {
  if (entry.name.endsWith(".ts")) {
    const source = await Deno.readTextFile(`src/${entry.name}`);
    const result = await transform(source, { runtime: "node" });
    await Deno.writeTextFile(`.build/${entry.name}`, result.code);
  }
}

// Build from transformed source
await build({
  entryPoints: [".build/mod.ts"],
  outDir: "./npm",
  // ...
});
```

#### Deploy scripts

Transform before deploying to a known environment:

```bash
#!/bin/bash
# deploy.sh - Deploy to Linux servers

# Transform for production Linux environment
deno run -A jsr:@hiisi/onlywhen/cli transform \
  --platform=linux \
  --runtime=node \
  --features=production \
  src/ -o dist/

# Bundle with your preferred bundler (dead code gets eliminated)
npx esbuild dist/main.ts --bundle --minify --outfile=bundle.js

# Deploy
rsync -av bundle.js server:/app/
```

#### Custom build script

```typescript
// build.ts
import { transform } from "@hiisi/onlywhen/transform";

const files = ["src/main.ts", "src/utils.ts", "src/platform.ts"];

for (const file of files) {
  const source = await Deno.readTextFile(file);

  const result = await transform(source, {
    platform: Deno.build.os === "darwin" ? "darwin" : "linux",
    runtime: "deno",
    arch: Deno.build.arch === "aarch64" ? "arm64" : "x64",
    features: Deno.env.get("FEATURES")?.split(",") ?? [],
  });

  console.log(`${file}: ${result.transformCount} replacements`);
  await Deno.writeTextFile(file.replace("src/", "dist/"), result.code);
}
```

### What gets transformed

| Expression                       | With `{ platform: "darwin" }` |
| :------------------------------- | :---------------------------- |
| `onlywhen.darwin`                | `true`                        |
| `onlywhen.linux`                 | `false`                       |
| `onlywhen.all(darwin, arm64)`    | `true` (if arch is arm64)     |
| `onlywhen.any(darwin, linux)`    | `true`                        |
| `onlywhen.not(darwin)`           | `false`                       |
| `onlywhen.feature("production")` | `true` (if in features list)  |

Properties not in your config stay as runtime checks. This lets you partially
bake values while keeping others dynamic.

## Support

Whether you use this project, have learned something from it, or just like it,
please consider supporting it by buying me a coffee, so I can dedicate more time
on open-source projects like this :)

<a href="https://buymeacoffee.com/orgrinrt" target="_blank"><img src="https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png" alt="Buy Me A Coffee" style="height: auto !important;width: auto !important;" ></a>

## License

> You can check out the full license [here](https://github.com/hiisi-digital/onlywhen/blob/main/LICENSE)

This project is licensed under the terms of the **Mozilla Public License 2.0**.

`SPDX-License-Identifier: MPL-2.0`
