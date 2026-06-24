import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const files = ["public/index.html", "public/privacy.html", "public/terms.html"]
  .map((file) => resolve(process.cwd(), file))
  .filter((file) => existsSync(file));

const forbidden = [
  "Wolfie Alpha",
  "Trading Bots",
  "Wolfie Command Dashboard",
  "Field Navigator",
  "Bot Thought Preview",
  "Configuration required",
  "wolfie-hero-suite-bg.png",
  "wolfie-waitlist-card-reference.png",
  "wolfie-landing-hero-laptop.png"
];

const hits = files.flatMap((file) => {
  const body = readFileSync(file, "utf8");
  return forbidden.filter((text) => body.includes(text)).map((text) => `${file}: ${text}`);
});

if (hits.length) {
  console.error(`Old landing/dashboard strings or assets found:\n${hits.join("\n")}`);
  process.exit(1);
}

console.log("uploaded landing visible string scan passed");
