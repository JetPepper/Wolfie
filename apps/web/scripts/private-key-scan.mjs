import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

const root = resolve(process.cwd(), "../..");
const ignored = new Set([".git", "node_modules", ".next", "out", ".architecture-build", "test-results"]);
const privateKeyPattern = /BEGIN (RSA |OPENSSH |EC |DSA |PRIVATE )?PRIVATE KEY|WOLFIE_PRIVATE_SIGNING_KEY|PRODUCTION_SIGNING_PRIVATE_KEY/;

function files(dir) {
  return readdirSync(dir).flatMap((entry) => {
    if (ignored.has(entry)) return [];
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) return files(full);
    if (!/\.(ts|tsx|js|mjs|json|md|yml|yaml|env|txt)$/.test(full)) return [];
    return [full];
  });
}

const matches = files(root)
  .filter((file) => !file.endsWith("apps/web/scripts/private-key-scan.mjs"))
  .filter((file) => privateKeyPattern.test(readFileSync(file, "utf8")));
if (matches.length) {
  console.error(`Private key material pattern found:\n${matches.join("\n")}`);
  process.exit(1);
}
console.log("private key scan passed");
