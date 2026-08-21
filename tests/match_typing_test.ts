/**
 * What `match` returns, as a type.
 *
 * It returned `T | undefined` whatever it was given, including when a `default` branch was
 * present and one of the branches therefore always runs. Every caller who had already
 * handled that case still had to assert their way out of it, and the readme example did
 * not type-check for exactly this reason.
 *
 * These are compile-time assertions. They pass by building; the runtime bodies are
 * incidental.
 *
 * @module
 */

import { assertEquals } from "@std/assert";
import { match, matchAsync } from "../mod.ts";

Deno.test("a default branch means the result is not optional", () => {
  // No assertion, no `!`, no widening. If the overload regresses, this line stops
  // compiling and the file is the failure.
  const value: string = match({
    deno: () => "deno",
    node: () => "node",
    default: () => "somewhere else",
  });
  assertEquals(typeof value, "string");
});

Deno.test("without a default the result stays optional", () => {
  const value: string | undefined = match({
    deno: () => "deno",
  });
  assertEquals(typeof value === "string" || value === undefined, true);
});

Deno.test("the async form draws the same distinction", async () => {
  const value: string = await matchAsync({
    deno: () => Promise.resolve("deno"),
    default: () => Promise.resolve("somewhere else"),
  });
  assertEquals(typeof value, "string");

  const maybe: string | undefined = await matchAsync({
    deno: () => Promise.resolve("deno"),
  });
  assertEquals(typeof maybe === "string" || maybe === undefined, true);
});

Deno.test("the branch for the running runtime is the one that runs", () => {
  // Deno is what runs these, so the deno branch wins over the default.
  assertEquals(
    match({ deno: () => "deno", default: () => "fallback" }),
    "deno",
  );
  assertEquals(
    match({ node: () => "node", default: () => "fallback" }),
    "fallback",
  );
});
