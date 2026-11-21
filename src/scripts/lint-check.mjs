// Lint gate: "no new lint errors versus the baseline".
// The repo carries pre-existing errors (recorded in lint-baseline.json, per file). This fails if
// any file has more errors than its baseline, or if a file not in the baseline has any error.
// Fixing baseline errors is welcome; refresh the file with `npm run lint:baseline`.
//
//   npm run lint:check
//   npm run lint:baseline   (rewrite the baseline from the current tree; use sparingly)
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const baselinePath = join(root, "lint-baseline.json");

let out;
try {
  out = execFileSync(process.execPath, [join(root, "node_modules/eslint/bin/eslint.js"), ".", "-f", "json"], { cwd: root, maxBuffer: 64 * 1024 * 1024 }).toString();
} catch (e) {
  out = e.stdout?.toString() ?? ""; // eslint exits 1 when errors exist; the JSON is still on stdout
}
const counts = {};
for (const f of JSON.parse(out)) {
  const n = f.messages.filter((m) => m.severity === 2).length;
  if (n) counts[relative(root, f.filePath).split("\\").join("/")] = n;
}
const total = Object.values(counts).reduce((a, b) => a + b, 0);

if (process.argv.includes("--update")) {
  writeFileSync(baselinePath, JSON.stringify({ total, files: Object.fromEntries(Object.entries(counts).sort()) }, null, 2) + "\n");
  console.log(`lint baseline written: ${total} errors in ${Object.keys(counts).length} files`);
  process.exit(0);
}

const baseline = JSON.parse(readFileSync(baselinePath, "utf8"));
const regressions = Object.entries(counts).filter(([f, n]) => n > (baseline.files[f] ?? 0));
if (regressions.length) {
  console.error("New lint errors (file: now vs baseline):");
  for (const [f, n] of regressions) console.error(`  ${f}: ${n} vs ${baseline.files[f] ?? 0}`);
  console.error("Run `npx eslint <file>` to see them.");
  process.exit(1);
}
console.log(`lint ok: ${total} errors, baseline ${baseline.total}, no new errors`);
