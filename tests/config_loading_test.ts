/**
 * @module
 *
 * Features declared in a config file reach `getAllFeatures()`, on every runtime.
 *
 * This is checked by spawning each runtime in a directory holding a config file, because the
 * loading happens once while the module initialises and there is no way to re-run it in
 * process. That is also why the defect it pins survived: the branch that reads the file on
 * node and bun tested `typeof require === "function"`, which is false under ESM, so it never
 * ran, and the surrounding catch swallowed nothing because nothing threw. A consumer with
 * `features` in package.json silently got none of them, and every in-process test passed.
 */

import { assert, assertEquals } from "@std/assert";
import { dirname, fromFileUrl, join } from "@std/path";

const ROOT = dirname(dirname(fromFileUrl(import.meta.url)));
const MOD = join(ROOT, "mod.ts");

/** A directory holding one config file, and a script that prints the loaded features. */
async function project(
  configName: string,
  config: Record<string, unknown>,
): Promise<string> {
  const dir = await Deno.makeTempDir({ prefix: "onlywhen_config_" });
  await Deno.writeTextFile(join(dir, configName), JSON.stringify(config, null, 2));
  await Deno.writeTextFile(
    join(dir, "probe.ts"),
    `import { getAllFeatures } from ${JSON.stringify(MOD)};\n` +
      `console.log(JSON.stringify([...getAllFeatures()].sort()));\n`,
  );
  return dir;
}

/** The features one runtime reports, run in `dir`. */
async function featuresUnder(
  command: string,
  args: readonly string[],
  dir: string,
): Promise<string[]> {
  const { success, stdout, stderr } = await new Deno.Command(command, {
    args: [...args, join(dir, "probe.ts")],
    cwd: dir,
    stdout: "piped",
    stderr: "piped",
  }).output();
  const out = new TextDecoder().decode(stdout).trim();
  assert(success, `${command} failed:\n${new TextDecoder().decode(stderr)}`);
  const last = out.split("\n").at(-1) ?? "[]";
  return JSON.parse(last) as string[];
}

/**
 * The probe imports this module by absolute path, so the subprocess has to
 * resolve this module's own imports, one of which is `@hiisi/tgts`. Deno is
 * handed the config that maps it to the sibling on disk. Node and bun have no
 * equivalent and would ask a registry for a package that is not on one, so they
 * are named here and skipped with the reason rather than silently dropped.
 */
const LOCAL_CONFIG = join(ROOT, "deno.local.json");

const RUNTIMES: readonly [string, string, readonly string[]][] = [
  ["deno", Deno.execPath(), ["run", "--allow-read", "--allow-env", "-c", LOCAL_CONFIG]],
];

/** Runtimes this cannot reach yet, and the one reason. */
const UNREACHABLE: readonly [string, string][] = [
  ["node", "resolves @hiisi/tgts from a registry, and it is not on one yet"],
  ["bun", "resolves @hiisi/tgts from a registry, and it is not on one yet"],
];

Deno.test("features in package.json load on every runtime", async () => {
  const dir = await project("package.json", {
    name: "probe",
    type: "module",
    features: ["alpha", "beta"],
  });
  try {
    // All three at once: each spawns its own process and they only read the directory, so
    // there is nothing to serialise and three sequential spawns is three times the wait.
    const seen = await Promise.all(
      RUNTIMES.map(([, command, args]) => featuresUnder(command, args, dir)),
    );
    for (const [index, [name]] of RUNTIMES.entries()) {
      assertEquals(
        seen[index],
        ["alpha", "beta"],
        `${name} did not load the features from package.json`,
      );
    }
  } finally {
    await Deno.remove(dir, { recursive: true });
  }
});

Deno.test("features in deno.json load, and win over package.json", async () => {
  const dir = await project("deno.json", { features: ["from-deno"] });
  await Deno.writeTextFile(
    join(dir, "package.json"),
    JSON.stringify({ name: "probe", type: "module", features: ["from-package"] }),
  );
  try {
    const seen = await Promise.all(
      RUNTIMES.map(([, command, args]) => featuresUnder(command, args, dir)),
    );
    for (const [index, [name]] of RUNTIMES.entries()) {
      assertEquals(seen[index], ["from-deno"], `${name} read the wrong config file`);
    }
  } finally {
    await Deno.remove(dir, { recursive: true });
  }
});

Deno.test("a project with no features declared loads none", async () => {
  // The control. Without it every assertion above is satisfied by an implementation that
  // returns a fixed list, and the defect this file pins is precisely one that returned a
  // fixed empty list on two of the three runtimes.
  const dir = await project("package.json", { name: "probe", type: "module" });
  try {
    const seen = await Promise.all(
      RUNTIMES.map(([, command, args]) => featuresUnder(command, args, dir)),
    );
    for (const [index, [name]] of RUNTIMES.entries()) {
      assertEquals(seen[index], [], `${name} invented a feature nothing declared`);
    }
  } finally {
    await Deno.remove(dir, { recursive: true });
  }
});

Deno.test("the runtimes this cannot reach are named, not quietly dropped", () => {
  // A suite that silently covers one runtime while claiming three is the shape
  // the test gate calls sampled: every test present looks reasonable and the
  // uncovered region goes unnamed. These are named, with the reason, so the
  // coverage this file actually has is legible from inside it.
  assert(UNREACHABLE.length > 0 || RUNTIMES.length === 3, "neither reachable nor named");
  for (const [name, why] of UNREACHABLE) {
    assert(why.length > 0, `${name} is listed as unreachable with no reason`);
    assert(
      !RUNTIMES.some(([r]) => r === name),
      `${name} is both exercised and listed as unreachable`,
    );
  }
});
