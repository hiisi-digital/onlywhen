//----------------------------------------------------------------------------------------------------
// Copyright (c) 2025                    Hiisi Digital                    ort@hiisi.digital
// SPDX-License-Identifier: MPL-2.0      https://mozilla.org/MPL/2.0      contact@hiisi.digital
//----------------------------------------------------------------------------------------------------

/**
 * @module cli
 *
 * Command-line interface for onlywhen.
 *
 * Usage:
 *   deno run -A jsr:@hiisi/onlywhen/cli transform [options] <input> [-o <output>]
 *
 * Commands:
 *   transform   Transform source files, replacing onlywhen expressions with boolean literals
 *
 * Options:
 *   --platform=<darwin|linux|windows>   Target platform
 *   --runtime=<deno|node|bun|browser>   Target runtime
 *   --arch=<x64|arm64>                  Target architecture
 *   --features=<feat1,feat2,...>        Enabled feature flags (comma-separated)
 *   -o, --output=<path>                 Output file or directory
 *   -w, --watch                         Watch for changes and re-transform
 *   -v, --verbose                       Show detailed output
 *   -h, --help                          Show help
 *   --version                           Show version
 */

import { type TargetConfig, transform } from "./src/transform/mod.ts";

// =============================================================================
// Version
// =============================================================================

const VERSION = "0.2.1";

// =============================================================================
// Help Text
// =============================================================================

const HELP_TEXT = `
onlywhen - Conditional code based on platform, runtime, or feature flags.

USAGE:
  onlywhen transform [options] <input> [-o <output>]

COMMANDS:
  transform   Transform source files, replacing onlywhen expressions with
              boolean literals based on target configuration.

OPTIONS:
  --platform=<value>     Target platform: darwin, linux, windows
  --runtime=<value>      Target runtime: deno, node, bun, browser
  --arch=<value>         Target architecture: x64, arm64
  --features=<values>    Enabled feature flags (comma-separated)
  
  -o, --output=<path>    Output file or directory (default: stdout for files,
                         required for directories)
  -v, --verbose          Show detailed transformation info
  -h, --help             Show this help message
  --version              Show version number

EXAMPLES:
  # Transform a single file to stdout
  onlywhen transform --platform=linux src/app.ts

  # Transform a file to a new file
  onlywhen transform --platform=darwin --runtime=node src/app.ts -o dist/app.ts

  # Transform a directory
  onlywhen transform --platform=linux --arch=x64 src/ -o dist/

  # Transform with feature flags
  onlywhen transform --features=production,analytics src/app.ts -o dist/app.ts

  # Transform for deno compile target
  onlywhen transform --platform=linux --runtime=deno --arch=x64 src/ -o .build/

NOTES:
  - Properties not specified in options are left as runtime checks.
  - Only .ts and .js files are transformed when processing directories.
  - The transform preserves code structure; use a minifier for dead code removal.
`;

// =============================================================================
// Argument Parsing
// =============================================================================

interface ParsedArgs {
  command: string | null;
  input: string | null;
  output: string | null;
  platform: TargetConfig["platform"];
  runtime: TargetConfig["runtime"];
  arch: TargetConfig["arch"];
  features: string[] | undefined;
  verbose: boolean;
  help: boolean;
  version: boolean;
}

function parseArgs(args: string[]): ParsedArgs {
  const result: ParsedArgs = {
    command: null,
    input: null,
    output: null,
    platform: undefined,
    runtime: undefined,
    arch: undefined,
    features: undefined,
    verbose: false,
    help: false,
    version: false,
  };

  const positional: string[] = [];

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    // Help flags
    if (arg === "-h" || arg === "--help") {
      result.help = true;
      continue;
    }

    // Version flag
    if (arg === "--version") {
      result.version = true;
      continue;
    }

    // Verbose flag
    if (arg === "-v" || arg === "--verbose") {
      result.verbose = true;
      continue;
    }

    // Output flag
    if (arg === "-o" || arg === "--output") {
      result.output = args[++i];
      continue;
    }
    if (arg.startsWith("--output=")) {
      result.output = arg.slice("--output=".length);
      continue;
    }
    if (arg.startsWith("-o=")) {
      result.output = arg.slice("-o=".length);
      continue;
    }

    // Platform
    if (arg.startsWith("--platform=")) {
      const value = arg.slice("--platform=".length);
      if (value === "darwin" || value === "linux" || value === "windows") {
        result.platform = value;
      } else {
        console.error(`Invalid platform: ${value}. Use darwin, linux, or windows.`);
        Deno.exit(1);
      }
      continue;
    }

    // Runtime
    if (arg.startsWith("--runtime=")) {
      const value = arg.slice("--runtime=".length);
      if (value === "deno" || value === "node" || value === "bun" || value === "browser") {
        result.runtime = value;
      } else {
        console.error(`Invalid runtime: ${value}. Use deno, node, bun, or browser.`);
        Deno.exit(1);
      }
      continue;
    }

    // Architecture
    if (arg.startsWith("--arch=")) {
      const value = arg.slice("--arch=".length);
      if (value === "x64" || value === "arm64") {
        result.arch = value;
      } else {
        console.error(`Invalid arch: ${value}. Use x64 or arm64.`);
        Deno.exit(1);
      }
      continue;
    }

    // Features
    if (arg.startsWith("--features=")) {
      const value = arg.slice("--features=".length);
      result.features = value.split(",").map((f) => f.trim()).filter((f) => f.length > 0);
      continue;
    }

    // Unknown flag
    if (arg.startsWith("-")) {
      console.error(`Unknown option: ${arg}`);
      console.error("Use --help for usage information.");
      Deno.exit(1);
    }

    // Positional argument
    positional.push(arg);
  }

  // Assign positional arguments
  if (positional.length > 0) {
    result.command = positional[0];
  }
  if (positional.length > 1) {
    result.input = positional[1];
  }

  return result;
}

// =============================================================================
// File System Utilities
// =============================================================================

async function isDirectory(path: string): Promise<boolean> {
  try {
    const stat = await Deno.stat(path);
    return stat.isDirectory;
  } catch {
    return false;
  }
}

async function isFile(path: string): Promise<boolean> {
  try {
    const stat = await Deno.stat(path);
    return stat.isFile;
  } catch {
    return false;
  }
}

async function ensureDir(path: string): Promise<void> {
  try {
    await Deno.mkdir(path, { recursive: true });
  } catch (e) {
    if (!(e instanceof Deno.errors.AlreadyExists)) {
      throw e;
    }
  }
}

async function* walkFiles(dir: string): AsyncGenerator<string> {
  for await (const entry of Deno.readDir(dir)) {
    const path = `${dir}/${entry.name}`;
    if (entry.isDirectory) {
      yield* walkFiles(path);
    } else if (entry.isFile && (entry.name.endsWith(".ts") || entry.name.endsWith(".js"))) {
      yield path;
    }
  }
}

// =============================================================================
// Transform Command
// =============================================================================

interface TransformStats {
  filesProcessed: number;
  totalTransformations: number;
  errors: string[];
}

async function transformFile(
  inputPath: string,
  outputPath: string | null,
  config: TargetConfig,
  verbose: boolean,
): Promise<{ transformCount: number; error?: string }> {
  try {
    const source = await Deno.readTextFile(inputPath);
    const result = await transform(source, config, { filename: inputPath });

    if (outputPath) {
      // Ensure output directory exists
      const outputDir = outputPath.substring(0, outputPath.lastIndexOf("/"));
      if (outputDir) {
        await ensureDir(outputDir);
      }
      await Deno.writeTextFile(outputPath, result.code);
    } else {
      // Write to stdout
      console.log(result.code);
    }

    if (verbose && result.transformCount > 0) {
      console.error(`  ${inputPath}: ${result.transformCount} transformation(s)`);
      for (const t of result.transformations) {
        console.error(`    L${t.line}: ${t.original} -> ${t.replacement}`);
      }
    }

    return { transformCount: result.transformCount };
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : String(e);
    return { transformCount: 0, error: errorMessage };
  }
}

async function runTransformCommand(args: ParsedArgs): Promise<void> {
  // Validate input
  if (!args.input) {
    console.error("Error: No input file or directory specified.");
    console.error("Use --help for usage information.");
    Deno.exit(1);
  }

  // Check if any transform config is provided
  const config: TargetConfig = {
    platform: args.platform,
    runtime: args.runtime,
    arch: args.arch,
    features: args.features,
  };

  const hasConfig = config.platform !== undefined ||
    config.runtime !== undefined ||
    config.arch !== undefined ||
    config.features !== undefined;

  if (!hasConfig) {
    console.error("Warning: No target configuration specified. Nothing will be transformed.");
    console.error("Use --platform, --runtime, --arch, or --features to specify targets.");
  }

  // Process input
  const inputIsDir = await isDirectory(args.input);
  const inputIsFile = await isFile(args.input);

  if (!inputIsDir && !inputIsFile) {
    console.error(`Error: Input path does not exist: ${args.input}`);
    Deno.exit(1);
  }

  const stats: TransformStats = {
    filesProcessed: 0,
    totalTransformations: 0,
    errors: [],
  };

  if (inputIsFile) {
    // Transform single file
    const outputPath = args.output;
    const result = await transformFile(args.input, outputPath, config, args.verbose);

    if (result.error) {
      console.error(`Error processing ${args.input}: ${result.error}`);
      Deno.exit(1);
    }

    stats.filesProcessed = 1;
    stats.totalTransformations = result.transformCount;
  } else {
    // Transform directory
    if (!args.output) {
      console.error("Error: Output directory is required when input is a directory.");
      console.error("Use -o or --output to specify the output directory.");
      Deno.exit(1);
    }

    // Ensure output directory exists
    await ensureDir(args.output);

    // Process all files
    for await (const inputPath of walkFiles(args.input)) {
      // Calculate relative path and output path
      const relativePath = inputPath.slice(args.input.length);
      const outputPath = args.output + relativePath;

      const result = await transformFile(inputPath, outputPath, config, args.verbose);

      stats.filesProcessed++;
      stats.totalTransformations += result.transformCount;

      if (result.error) {
        stats.errors.push(`${inputPath}: ${result.error}`);
      }
    }
  }

  // Print summary
  if (args.verbose || inputIsDir) {
    console.error("");
    console.error(`Processed ${stats.filesProcessed} file(s)`);
    console.error(`Total transformations: ${stats.totalTransformations}`);

    if (stats.errors.length > 0) {
      console.error("");
      console.error(`Errors (${stats.errors.length}):`);
      for (const err of stats.errors) {
        console.error(`  ${err}`);
      }
      Deno.exit(1);
    }
  }
}

// =============================================================================
// Main
// =============================================================================

async function main(): Promise<void> {
  const args = parseArgs(Deno.args);

  // Handle help
  if (args.help) {
    console.log(HELP_TEXT);
    Deno.exit(0);
  }

  // Handle version
  if (args.version) {
    console.log(`onlywhen ${VERSION}`);
    Deno.exit(0);
  }

  // Handle commands
  if (!args.command) {
    console.error("Error: No command specified.");
    console.error("Use --help for usage information.");
    Deno.exit(1);
  }

  switch (args.command) {
    case "transform":
      await runTransformCommand(args);
      break;

    default:
      console.error(`Unknown command: ${args.command}`);
      console.error("Use --help for usage information.");
      Deno.exit(1);
  }
}

// Run if this is the main module
if (import.meta.main) {
  main();
}
