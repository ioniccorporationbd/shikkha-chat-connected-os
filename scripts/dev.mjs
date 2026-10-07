#!/usr/bin/env node
/**
 * Dev launcher that runs `next dev` and strips the framework's startup banner
 * from the terminal. Next.js prints that block through a bare `console.log`
 * (see next/dist/build/output/log.js -> bootstrap()) with no config or env
 * flag to disable it, so the only way to hide it is to filter the stream.
 *
 * Removed lines:
 *   ▲ Next.js 16.2.10 (Turbopack)
 *   - Local:         http://localhost:3000
 *   - Network:       http://192.168.0.192:3000
 *   - Environments: .env.local, .env
 *   ✓ Ready in 1037ms
 *
 * Everything else — route compiles, HMR, errors, warnings — passes through
 * untouched. Extra args are forwarded to `next dev`:
 *   npm run dev -- -p 3000
 */
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

// Resolve the project's own `next` bin from the filesystem so the launcher
// works whether it is started via `npm run dev` (node_modules/.bin on PATH) or
// invoked directly (`node scripts/dev.mjs`), and identically on Windows.
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const nextBin = path.join(projectRoot, "node_modules", "next", "dist", "bin", "next");

if (!existsSync(nextBin)) {
  console.error("[dev] Could not find next at " + nextBin + " — run `npm install` first.");
  process.exit(1);
}

const extraArgs = process.argv.slice(2);
const child = spawn(process.execPath, [nextBin, "dev", ...extraArgs], {
  stdio: ["inherit", "pipe", "pipe"],
  // Colour detection sees our pipe as non-TTY, so force colours back on.
  env: { ...process.env, FORCE_COLOR: "1" },
});

const BANNER = [
  /^\s*\u25B2 Next\.js/, // ▲ Next.js <version> (<bundler>)
  /^\s*-\s+(Local|Network|Debugger port|Environments|Cache Components|Experiments)\b/,
  /^\s*\u2713 Ready in\b/, // ✓ Ready in <time>
];

// Next.js colourises the "▲"/"✓" prefixes, so match against the line with SGR
// codes stripped while still writing the original (coloured) line through.
const ANSI = /\x1b\[[0-9;]*m/g;

function filteredWriter(out) {
  let buffer = "";
  let lastLineWasBanner = false;
  return (chunk) => {
    buffer += chunk.toString();
    let newline;
    while ((newline = buffer.indexOf("\n")) !== -1) {
      const line = buffer.slice(0, newline);
      buffer = buffer.slice(newline + 1);
      const plain = line.replace(ANSI, "");

      if (BANNER.some((re) => re.test(plain))) {
        lastLineWasBanner = true;
        continue;
      }
      // Swallow the single blank line Next.js prints right after the banner.
      if (lastLineWasBanner && plain.trim() === "") {
        lastLineWasBanner = false;
        continue;
      }
      lastLineWasBanner = false;
      out.write(line + "\n");
    }
  };
}

child.stdout.on("data", filteredWriter(process.stdout));
child.stderr.on("data", filteredWriter(process.stderr));

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => child.kill(signal));
}

child.on("exit", (code, signal) => {
  process.exit(signal ? 0 : (code ?? 0));
});
