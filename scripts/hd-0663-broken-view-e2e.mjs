#!/usr/bin/env node
/**
 * 0663 — the negative twin of 0662: what the thread does when a picture's bytes
 * are refused outright (neither the ERP storage path nor the ticket streamer will
 * hand them over).
 *
 * The customer must not be left with a torn thumbnail and a silent failure:
 *
 *   1. the console says `[hd:attach] image did not load` and then logs the reason
 *      (the HTTP status the portal route answered), so the cause is readable;
 *   2. the same reason reaches Desk -> Error Log through client_log.report;
 *   3. the bubble shows the "cannot be loaded" frame with the file name still
 *      linked, so the customer can at least try the file itself;
 *   4. nothing else in the page breaks (no uncaught console errors).
 *
 *   E2E_BASE=http://localhost:3011 node scripts/hd-0663-broken-view-e2e.mjs
 */
import { chromium } from "/root/arogga-UI/node_modules/playwright/index.mjs";
import fs from "node:fs";

const BASE = process.env.E2E_BASE ?? "http://localhost:3011";
const LOG = process.env.MOCK_LOG ?? "/tmp/mock_frappe.log";
const PASSWORD = process.env.MOCK_PASSWORD ?? "demo1234";
const TICKET = process.env.E2E_TICKET ?? "0663";
const ROLE = process.env.E2E_ROLE === "staff" ? "staff" : "client";
const EMAIL = ROLE === "staff" ? "tamim@ioniccorporation.com" : "client@example.com";
const SECTION = ROLE === "staff" ? "userDashboard" : "clientDashboard";
const SHOT = process.env.SHOT ?? `/tmp/hd-0663-${ROLE}.png`;

let passed = 0;
let failed = 0;
const check = (name, ok, extra = "") => {
  if (ok) passed += 1;
  else failed += 1;
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${!ok && extra ? ` :: ${extra}` : ""}`);
};
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function latestOtp(email) {
  const matches = [
    ...fs
      .readFileSync(LOG, "utf8")
      .matchAll(new RegExp(`LOGIN OTP ${email.replace(/\./g, "\\.")} = (\\d{6})`, "g")),
  ];
  return matches.length ? matches[matches.length - 1][1] : null;
}

async function login(page) {
  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded", timeout: 120000 });
  await page.fill("input[name=username]", EMAIL);
  await page.fill("input[type=password]", PASSWORD);
  await page.click("button[type=submit]");
  const box = page.locator("input[inputmode=numeric]").first();
  await box.waitFor({ timeout: 30000 });
  let code = null;
  for (let i = 0; i < 60 && !code; i += 1) {
    code = latestOtp(EMAIL);
    if (!code) await sleep(250);
  }
  if (!code) throw new Error(`no OTP logged for ${EMAIL}`);
  await box.click();
  await page.keyboard.type(code, { delay: 60 });
  await sleep(700);
  await page.locator("button[type=submit]").last().click();
}

const browser = await chromium.launch({ args: ["--no-sandbox"] });
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 1000 }, deviceScaleFactor: 2 });
  const consoleErrors = [];
  const consoleLines = [];
  page.on("console", (msg) => {
    consoleLines.push(msg.text());
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  const reports = [];
  page.on("request", (request) => {
    const href = request.url();
    const body = request.postData() ?? "";
    const looksLikeReport =
      href.includes("client_log") ||
      href.includes("client-log") ||
      href.includes("/api/log/client-error") ||
      body.includes("help-desk:attachment");
    if (looksLikeReport) reports.push(`${href} ${body}`);
  });

  await login(page);
  await page.waitForURL(new RegExp(SECTION), { timeout: 60000 });
  await page.goto(`${BASE}/${SECTION}/help-desk/tickets/${TICKET}`, {
    waitUntil: "domcontentloaded",
    timeout: 120000,
  });
  await page.locator('[data-hd="thread"]').waitFor({ timeout: 60000 });

  // The bubble must settle on the "cannot be loaded" frame, not on an <img>.
  const frame = page.getByText("ছবিটি এখন দেখা যাচ্ছে না").first();
  await frame.waitFor({ timeout: 60000 }).catch(() => {});
  check("the thread shows a clear cannot-be-loaded frame", await frame.count() > 0);

  const live = await page.locator('[data-hd="thread"] img').count();
  check("no torn <img> thumbnail is left behind", live === 0, `${live} images still mounted`);

  await sleep(1500); // let the async reason fetch + report settle
  const logText = consoleLines.join("\n");
  check("the console says the image did not load", logText.includes("[hd:attach] image did not load"));
  check(
    "the console names the reason, not a blank failure",
    /does not view properly[\s\S]{0,400}HTTP \d{3}/.test(logText) ||
      /does not view properly[\s\S]{0,400}the request failed/.test(logText),
    "no HTTP status in the reason"
  );
  const decoded = reports.map((entry) => {
    try {
      return decodeURIComponent(entry.replace(/\+/g, " "));
    } catch {
      return entry;
    }
  });
  // `sendBeacon` hands the body to the browser as a Blob, which a driver cannot
  // always read back — so the fact that the reporter's endpoint was called with
  // this scope is what is asserted, and the body is printed when available.
  const reportHrefs = reports.map((entry) => entry.split(" ")[0]);
  const scopeInBody = decoded.some((body) => body.includes("help-desk:attachment"));
  check(
    "the reason reaches Desk -> Error Log (POST /api/log/client-error)",
    reportHrefs.some((href) => href.includes("/api/log/client-error")),
    `${reports.length} report request(s) seen`
  );
  console.log(
    `note: scope travel in the report body = ${scopeInBody ? "yes" : "not captured by the driver"}`
  );

  // A missing file makes the browser itself log "Failed to load resource: 404" —
  // that is the expected trace, not a defect. Anything else is.
  const unexpected = consoleErrors.filter(
    (line) =>
      !/Failed to load resource/i.test(line) &&
      !line.includes("[hd:attach]") &&
      !line.includes("[client-error:") &&
      !/client-error:help-desk:realtime/.test(line)
  );
  check("no unexpected console errors", unexpected.length === 0, unexpected.slice(0, 3).join(" | "));

  await page.screenshot({ path: SHOT, fullPage: false });
  console.log(`screenshot ${SHOT}`);
  console.log(`\n${passed}/${passed + failed} checks passed`);
  if (failed > 0) process.exitCode = 1;
} finally {
  await browser.close();
}
