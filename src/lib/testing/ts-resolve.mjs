// Test-only module resolver so `node --test` can import app modules that use Next-style
// imports: extensionless relative paths ("./db") and the "@/..." alias. Node strips the
// TypeScript types itself; this hook only finds the file. Registered by tests that need it:
//   import { register } from "node:module";
//   register("./testing/ts-resolve.mjs", import.meta.url);
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const SRC = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

export async function resolve(specifier, context, next) {
  let spec = specifier;
  if (spec.startsWith("@/")) spec = pathToFileURL(join(SRC, spec.slice(2))).href;
  const local = spec.startsWith("./") || spec.startsWith("../") || spec.startsWith("file:");
  if (local && context.parentURL && !/\.(m|c)?(t|j)sx?$|\.json$/.test(spec)) {
    const base = new URL(spec, context.parentURL).href;
    for (const ext of [".ts", ".tsx", "/index.ts"]) {
      const candidate = base + ext;
      if (existsSync(fileURLToPath(candidate))) return next(candidate, context);
    }
  }
  return next(spec, context);
}
