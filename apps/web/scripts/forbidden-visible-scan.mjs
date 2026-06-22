import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const page = readFileSync(resolve(process.cwd(), "app/page.tsx"), "utf8").toLowerCase();
const forbidden = [
  "mock",
  "sandbox",
  "debug",
  "localhost",
  "mcp tool call",
  "botconfig",
  "paperexchange",
  "warren",
  "twinkies",
  "premium",
  "pro tier",
  "upgrade tier",
];

const hits = forbidden.filter((text) => page.includes(text));
if (hits.length) {
  console.error(`Forbidden visible strings found in app/page.tsx: ${hits.join(", ")}`);
  process.exit(1);
}
console.log("forbidden visible string scan passed");
