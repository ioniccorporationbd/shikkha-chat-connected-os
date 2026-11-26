/**
 * Slow-send recovery end-to-end proof (ticket 0602).
 *
 * The customer's report: the employee's attachment never arrives, and the console
 * showed `scope: help-desk:send — "The ERP server at dash.shikkhachat.com did not
 * answer within 15s"`. On a slow site the ERP still commits; the portal had
 * already told the customer the message failed, so the reply (and its file) was
 * never shown and the customer retyped it.
 *
 * This script drives that exact shape: the mock lands the message and then takes
 * longer than the portal ceiling to answer, so the first answer is a timeout while
 * the ticket already holds the text.
 *
 *   MOCK_HD_SEND_DELAY_MS=4000 node scripts/mock-frappe.mjs &
 *   FRAPPE_BASE_URL=http://127.0.0.1:8787 HD_WRITE_TIMEOUT_MS=1500 npx next start -p 3011 &
 *   E2E_BASE=http://localhost:3011 node scripts/hd-send-timeout-e2e.mjs
 *
 * Legs:
 *   1. the write outran the ceiling (the timeout was really exercised);
 *   2. the portal re-read the thread and found the reply — success, not failure;
 *   3. exactly one copy of the text is on the ticket (no duplicate send);
 *   4. the composer is empty again (draft cleared), so the user cannot resend it.
 */
import { chromium } from "/root/arogga-UI/node_modules/playwright/index.mjs";
import fs from "node:fs";

const BASE = process.env.E2E_BASE ?? "http://localhost:3011";
const LOG = process.env.MOCK_LOG ?? "/tmp/mock_frappe.log";
const PASSWORD = process.env.MOCK_PASSWORD ?? "demo1234";
const EMAIL = process.env.E2E_EMAIL ?? "client@example.com";
const TICKET = process.env.E2E_TICKET ?? "0602";
const SECTION = process.env.E2E_SECTION ?? "clientDashboard";
const TEXT = process.env.E2E_TEXT ?? `ধীর সার্ভার পরীক্ষা ${Date.now()}`;

const results = [];
const check = (name, ok, extra = "") => {
  results.push({ name, ok: !!ok });
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${extra ? ` :: ${extra}` : ""}`);
};
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function latestOtp(email) {
  const matches = [
    ...fs.readFileSync(LOG, "utf8").matchAll(new RegExp(`LOGIN OTP ${email.replace(/\./g, "\\.")} = (\\d{6})`, "g")),
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
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 }, deviceScaleFactor: 2 });
  const logs = [];
  page.on("console", (msg) => logs.push(msg.text()));

  await login(page);
  await page.waitForURL(new RegExp(SECTION), { timeout: 60000 });
  await page.goto(`${BASE}/${SECTION}/help-desk/tickets/${TICKET}`, {
    waitUntil: "domcontentloaded",
    timeout: 120000,
  });

  const box = page.locator(".hd-composer-textarea").first();
  await box.waitFor({ timeout: 60000 });
  await box.click();
  await page.keyboard.type(TEXT, { delay: 10 });

  const before = fs.readFileSync(LOG, "utf8").length;
  await box.press("Enter");

  // The optimistic bubble appears at once; the interesting moment is the one
  // where the portal stops waiting and has to decide whether the write landed.
  // Wait for that decision (console trail) before judging anything.
  let decided = false;
  for (let i = 0; i < 60; i += 1) {
    if (logs.some((line) => /landed after the portal stopped waiting|outran the portal ceiling/.test(line))) {
      decided = true;
      break;
    }
    await sleep(500);
  }
  check("the portal reached a decision about the timed-out write", decided, "no timeout trail seen");
  await sleep(1500); // let the reload settle

  const landedAt = await page.evaluate((needle) => (document.body.innerText || "").includes(needle), TEXT);
  check("the reply is visible in the customer chat box", landedAt);

  check(
    "the portal found the reply instead of failing it",
    logs.some((line) => /landed after the portal stopped waiting/.test(line)),
    logs.filter((line) => /help-desk/.test(line)).slice(-2).join(" | "),
  );

  const sendLog = fs.readFileSync(LOG, "utf8").slice(before);
  const posted = (sendLog.match(/HD MESSAGE/g) || []).length;
  check("the ERP stored exactly one copy", posted === 1, `HD MESSAGE x${posted}`);

  // Count in the chat thread only: the activity timeline below repeats the body.
  const occurrences = await page.evaluate((needle) => {
    const thread = document.querySelector("[data-hd=thread]");
    const text = (thread ? thread.innerText : document.body.innerText) || "";
    return text.split(needle).length - 1;
  }, TEXT);
  check("the chat thread shows exactly one bubble for it", occurrences === 1, `x${occurrences}`);

  const composer = await box.inputValue();
  check("the composer was cleared after the recovery", composer.trim() === "", JSON.stringify(composer.slice(0, 40)));

  await page.screenshot({ path: process.env.SHOT ?? "/tmp/hd-0602-slow-send.png", timeout: 60000 });
} finally {
  await browser.close();
}

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length ? 1 : 0);
