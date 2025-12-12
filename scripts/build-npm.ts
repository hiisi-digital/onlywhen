//----------------------------------------------------------------------------------------------------
// Copyright (c) 2025                    Hiisi Digital                    ort@hiisi.digital
// SPDX-License-Identifier: MPL-2.0      https://mozilla.org/MPL/2.0      contact@hiisi.digital
//----------------------------------------------------------------------------------------------------

/**
 * Build script for npm package.
 *
 * This script uses dnt (Deno to Node Transform) to build an npm-compatible
 * package from our Deno source.
 *
 * Run with: deno run -A scripts/build-npm.ts
 */

import { build, emptyDir } from "jsr:@deno/dnt@0.41.3";

// Package naming - use unscoped name for npm
const NPM_PACKAGE_NAME = "onlywhen";

const denoJson = JSON.parse(await Deno.readTextFile("deno.json"));
const outDir = "./npm";

await emptyDir(outDir);

await build({
  entryPoints: ["./mod.ts"],
  outDir,
  shims: {
    // Minimal shims - we handle runtime detection ourselves
    deno: false,
  },
  typeCheck: "both",
  scriptModule: "cjs",
  test: false,
  skipSourceOutput: true,
  compilerOptions: {
    lib: ["ES2022"],
    target: "ES2022",
  },
  package: {
    name: NPM_PACKAGE_NAME,
    version: denoJson.version,
    description: "Conditional code based on platform, runtime, or feature flags.",
    license: denoJson.license,
    type: "module",
    repository: {
      type: "git",
      url: "git+https://github.com/hiisi-digital/onlywhen.git",
    },
    bugs: {
      url: "https://github.com/hiisi-digital/onlywhen/issues",
    },
    homepage: "https://github.com/hiisi-digital/onlywhen#readme",
    keywords: [
      "cfg",
      "conditional",
      "platform",
      "runtime",
      "detection",
      "decorator",
      "feature-flags",
      "environment",
      "cross-platform",
    ],
    engines: {
      node: ">=18",
    },
  },
  postBuild(): void {
    // Copy files that should be included in the npm package
    Deno.copyFileSync("LICENSE", `${outDir}/LICENSE`);
    Deno.copyFileSync("README.md", `${outDir}/README.md`);

    // Update the generated package.json with additional fields
    const pkgJsonPath = `${outDir}/package.json`;
    const pkgJson = JSON.parse(Deno.readTextFileSync(pkgJsonPath));

    // Add exports field for proper ESM/CJS resolution
    pkgJson.exports = {
      ".": {
        import: "./esm/mod.js",
        require: "./script/mod.js",
        types: "./types/mod.d.ts",
      },
    };

    // Add files field to ensure only needed files are published
    pkgJson.files = ["esm", "script", "types", "README.md", "LICENSE"];

    Deno.writeTextFileSync(
      pkgJsonPath,
      JSON.stringify(pkgJson, null, 2) + "\n",
    );

    console.log(`\nPackage configuration:`);
    console.log(`  Name: ${NPM_PACKAGE_NAME}`);
    console.log(`  Version: ${denoJson.version}`);
  },
});

console.log("\nnpm package built successfully in ./npm");
console.log("\nTo publish:");
console.log("  cd npm && npm publish");
console.log("\nUsers can install with:");
console.log("  npm install onlywhen");
