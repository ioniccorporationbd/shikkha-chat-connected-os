#!/usr/bin/env node
/**
 * Diagnose the portal -> ERP connection.
 *
 * A 502 in the browser tells you nothing; this walks the whole chain and names
 * the failing link: configuration, DNS/TLS, the Frappe site itself, the
 * shikkha_os app, and finally the login endpoint.
 *
 *   npm run check:erp                       # uses FRAPPE_BASE_URL
 *   npm run check:erp -- --base https://erp.example.com
 *   npm run check:erp -- --probe-login      # also POST a fake sign-in (writes an
 *                                           # Error Log entry on the ERP)
 *
 * No dependencies. Node 18+ (global fetch).
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const TIMEOUT_MS = 15_000;
const PROBE_USER = "portal-healthcheck@example.invalid";

/* ------------------------------- arguments ------------------------------- */

const argv = process.argv.slice(2);
const baseFlagIndex = argv.findIndex((a) => a === "--base");
const baseFlag = baseFlagIndex >= 0 ? (argv[baseFlagIndex + 1] ?? "") : "";
const probeLogin = argv.includes("--probe-login");

/* --------------------------------- env ---------------------------------- */

/** Minimal .env reader: first `KEY=value` wins, later files do not override. */
function readEnvFile(file) {
  const out = {};
  if (!existsSync(file)) return out;

  for (const rawLine of readFileSync(file, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const eq = line.indexOf("=");
    if (eq < 1) continue;

    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in out)) out[key] = value;
  }
  return out;
}

const fileEnv = {
  ...readEnvFile(resolve(process.cwd(), ".env")),
  ...readEnvFile(resolve(process.cwd(), ".env.local")),
};

const rawBase = (baseFlag || process.env.FRAPPE_BASE_URL || fileEnv.FRAPPE_BASE_URL || "").trim();
const base = rawBase.replace(/\/+$/, "");

/* -------------------------------- output -------------------------------- */

const results = [];

function line(status, label, detail = "") {
  const icon = status === "ok" ? "  ok  " : status === "warn" ? " warn " : " FAIL ";
  console.log(`[${icon}] ${label.padEnd(38)} ${detail}`);
  results.push({ status, label, detail });
}

function hint(text) {
  console.log(`         -> ${text}`);
}

const bar = "─".repeat(78);

/* -------------------------------- helpers ------------------------------- */

async function probe(path, init = {}) {
  const url = `${base}${path}`;
  const started = Date.now();

  try {
    const response = await fetch(url, {
      ...init,
      redirect: "manual",
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { Accept: "application/json, text/html;q=0.8", ...(init.headers ?? {}) },
    });
    const text = await response.text();
    let payload = null;
    try {
      payload = text ? JSON.parse(text) : null;
    } catch {
      payload = null;
    }

    return {
      url,
      ok: true,
      status: response.status,
      contentType: response.headers.get("content-type") ?? "",
      payload,
      text,
      ms: Date.now() - started,
    };
  } catch (error) {
    const timedOut = error?.name === "TimeoutError" || error?.name === "AbortError";

    return {
      url,
      ok: false,
      error: error?.cause?.code ?? error?.message ?? String(error),
      timedOut,
      ms: Date.now() - started,
    };
  }
}

const isHtml = (text) => /<!doctype|<html|<\?xml/i.test((text ?? "").slice(0, 400));

function excType(payload) {
  return typeof payload?.exc_type === "string" ? payload.exc_type : "";
}

/* ---------------------------------- run --------------------------------- */

console.log(`\n${bar}\n  Portal -> ERP connection check\n${bar}`);

if (!base) {
  line("fail", "FRAPPE_BASE_URL configured", "not set");
  hint("Create .env.local with a line such as:");
  hint("    FRAPPE_BASE_URL=https://erp.your-domain.com");
  console.log(`\n${bar}\n`);
  process.exit(1);
}

let host = base;
try {
  const url = new URL(base);
  host = url.host;
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    line("fail", "FRAPPE_BASE_URL is a valid URL", `unsupported protocol ${url.protocol}`);
  } else {
    line("ok", "FRAPPE_BASE_URL configured", base);
  }
} catch {
  line("fail", "FRAPPE_BASE_URL is a valid URL", base);
  hint("It must include the scheme, e.g. https://erp.your-domain.com");
  console.log(`\n${bar}\n`);
  process.exit(1);
}

console.log(`\n  -- reachability (${host}) ${"-".repeat(Math.max(0, 50 - host.length))}`);
const ping = await probe("/api/method/ping");

if (!ping.ok) {
  line(
    "fail",
    "site reachable",
    ping.timedOut ? `no answer within ${TIMEOUT_MS / 1000}s` : `network error: ${ping.error}`
  );
  hint(ping.error === "ENOTFOUND" || ping.error === "EAI_AGAIN"
    ? "DNS does not resolve this host — check the spelling, or your VPN/hosts file."
    : "Check that the ERP is running and reachable from this machine (VPN, firewall, port 443).");
} else if (ping.status >= 500) {
  line("fail", "site healthy", `HTTP ${ping.status}${excType(ping.payload) ? ` ${excType(ping.payload)}` : ""}`);
  hint(
    isHtml(ping.text)
      ? "The ERP is serving its HTML error page for every request — the site itself is broken"
      : "The ERP is throwing on every request — the site itself is broken"
  );
  hint("On the server:  tail -n 200 ~/frappe-bench/logs/web.error.log    # names the file + line");
  hint("                tail -n 200 ~/frappe-bench/sites/<site>/logs/web.error.log");
  hint("A 500 on EVERY route (even / and /robots.txt) usually comes from a per-request hook:");
  hint("  bench --site <site> list-apps   |   grep -rn before_request ~/frappe-bench/apps/*/*/hooks.py");
  hint("Then:  bench --site <site> migrate && bench --site <site> clear-cache && bench restart");
} else if (ping.status === 200) {
  const pong = typeof ping.payload === "object" ? (ping.payload?.message ?? "") : "";
  line("ok", "site healthy", `HTTP 200 ${pong === "pong" ? "pong" : ""}`.trim());
} else {
  line("warn", "site healthy", `HTTP ${ping.status} — unexpected for ` + "/api/method/ping");
}

if (ping.ok) {
  console.log(`\n  -- frappe session layer ${"-".repeat(Math.max(0, 47))}`);
  const guest = await probe("/api/method/frappe.auth.get_logged_user");
  if (guest.ok && (guest.status === 403 || guest.status === 200)) {
    line("ok", "frappe session layer", `HTTP ${guest.status} (expected for a guest)`);
  } else if (guest.ok) {
    line("warn", "frappe session layer", `HTTP ${guest.status}`);
  } else {
    line("warn", "frappe session layer", guest.error ?? "unreachable");
  }

  console.log(`\n  -- shikkha_os app ${"-".repeat(Math.max(0, 54))}`);
  const health = await probe("/api/method/shikkha_os.api.v1.health.ping");

  if (!health.ok) {
    line("fail", "app responds", health.error ?? "unreachable");
  } else if (health.status === 200) {
    const version = health.payload?.message?.version ?? health.payload?.message?.app_version ?? "";
    line("ok", "app installed", `${version ? `shikkha_os ${version}` : "HTTP 200"}`);
  } else if (health.status === 403) {
    line("fail", "app installed", "HTTP 403 — method refused for guests");
    hint("Let guest call health.ping  (allow_guest=True), then re-run.");
  } else if (health.status === 404) {
    line("fail", "app installed", "HTTP 404 — method not found");
    hint("Install the app on THIS site:  bench --site <site> install-app shikkha_os");
  } else if (health.status === 417 || health.status === 418) {
    const message = health.payload?.message ?? "";
    line("fail", "app installed", `HTTP ${health.status} ${message || excType(health.payload)}`);
    hint("The site is up but the app is missing here. On the server:");
    hint("    bench get-app https://github.com/ionicorporationbd/shikkha_os");
    hint("    bench --site <site> install-app shikkha_os && bench restart");
  } else {
    line("fail", "app installed", `HTTP ${health.status} ${excType(health.payload)}`.trim());
  }

  if (probeLogin) {
    console.log(`\n  -- login endpoint ${"-".repeat(Math.max(0, 53))}`);
    const login = await probe("/api/method/shikkha_os.api.v1.auth.login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usr: PROBE_USER, pwd: "not-a-real-password" }),
    });

    if (login.ok && login.status === 401) {
      line("ok", "login endpoint reachable", "401 for a fake account (correct)");
    } else if (login.ok && [200, 417, 418].includes(login.status)) {
      line("ok", "login endpoint reachable", `HTTP ${login.status} — endpoint answered`);
    } else if (login.ok && login.status === 429) {
      line("warn", "login endpoint reachable", "HTTP 429 — rate limited, nothing broken");
    } else if (login.ok) {
      line("fail", "login endpoint reachable", `HTTP ${login.status} ${excType(login.payload)}`.trim());
      hint("This is what the browser shows as a 502. See the hints above.");
    } else {
      line("fail", "login endpoint reachable", login.error ?? "unreachable");
    }
    hint("The ERP records this probe in Error Log as 'shikkha_os: failed login'.");
  }
}

/* ------------------------------- verdict -------------------------------- */

const failed = results.filter((r) => r.status === "fail");
const warned = results.filter((r) => r.status === "warn");

console.log(`\n${bar}`);
if (failed.length) {
  console.log(`  VERDICT: ${failed.length} blocking problem(s) — the portal cannot sign in until fixed.`);
  console.log(`  First failing link: ${failed[0].label} (${failed[0].detail})`);
} else if (warned.length) {
  console.log(`  VERDICT: usable, ${warned.length} warning(s).`);
} else {
  console.log("  VERDICT: the portal -> ERP chain looks healthy.");
}
console.log(`${bar}\n`);

process.exit(failed.length ? 1 : 0);
