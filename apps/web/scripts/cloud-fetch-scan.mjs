import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

const root = resolve(process.cwd(), "app");
const allowedFile = resolve(process.cwd(), "app/lib/runtime/wolfie-cloud-client.ts");

function files(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) return files(full);
    if (!/\.(ts|tsx)$/.test(full)) return [];
    return [full];
  });
}

const offenders = files(root).filter((file) => file !== allowedFile && /wolfie cloud|wolfie-cloud|fetch\(/i.test(readFileSync(file, "utf8")) && /fetch\(/.test(readFileSync(file, "utf8")));
if (offenders.length) {
  console.error(`Direct Wolfie Cloud fetch usage must go through wolfie-cloud-client:\n${offenders.join("\n")}`);
  process.exit(1);
}
console.log("cloud fetch scan passed");
