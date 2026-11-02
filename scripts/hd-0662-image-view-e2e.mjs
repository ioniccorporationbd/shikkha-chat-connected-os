#!/usr/bin/env node
/**
 * 0662 — "the attached file image does not view properly" (live shape).
 *
 * The live report shows two attachment-only rows in one thread: the customer's
 * own upload, and the employee's reply upload that sits on an agent-side row —
 * so a customer session gets 403 on `/private/files/...` and the portal has to
 * fetch the bytes through the ticket-scoped streamer. This suite proves BOTH
 * pictures paint for the customer, that the direct URL really is refused (so the
 * green result cannot come from a permissive mock), and that a failure would be
 * reported rather than swallowed.
 *
 *   node scripts/mock-frappe.mjs &
 *   FRAPPE_BASE_URL=http://127.0.0.1:8787 npx next start -p 3011 &
 *   E2E_BASE=http://localhost:3011 E2E_ROLE=client node scripts/hd-0662-image-view-e2e.mjs
 *   E2E_BASE=http://localhost:3011 E2E_ROLE=staff  node scripts/hd-0662-image-view-e2e.mjs
 */
import { chromium } from "/root/arogga-UI/node_modules/playwright/index.mjs";
import fs from "node:fs";

const BASE = process.env.E2E_BASE ?? "http://localhost:3000";
const LOG = process.env.MOCK_LOG ?? "/tmp/mock_frappe.log";
const PASSWORD = process.env.MOCK_PASSWORD ?? "demo1234";
const TICKET = process.env.E2E_TICKET ?? "0662";
const ROLE = process.env.E2E_ROLE === "staff" ? "staff" : "client";
const EMAIL = ROLE === "staff" ? "tamim@ioniccorporation.com" : "client@example.com";
const SECTION = ROLE === "staff" ? "userDashboard" : "clientDashboard";
const SHOT = process.env.SHOT ?? `/tmp/hd-0662-${ROLE}.png`;

const MINE = "Screenshot-_18_57d4b9.png"; // the customer's own upload
const THEIRS = "Screenshot-_19_6e0bc2.png"; // the employee's reply upload (agent-side)

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
    if (msg.type() === "error") consoleErrors.push(msg.text());
    else consoleLines.push(msg.text());
  });

  await login(page);
  await page.waitForURL(new RegExp(SECTION), { timeout: 60000 });

  // The ERP storage path itself must refuse an employee's private file to anyone
  // but the desk: otherwise a green run here would only prove the mock is lax.
  const mockBase = process.env.MOCK_BASE ?? "http://127.0.0.1:8787";
  const directTheirs = await page.request.get(`${mockBase}/private/files/Screenshot-_19_6e0bc2.png`);
  check(
    "the ERP refuses the employee file on the storage path (403)",
    directTheirs.status() === 403,
    `status ${directTheirs.status()}`
  );

  await page.goto(`${BASE}/${SECTION}/help-desk/tickets/${TICKET}`, {
    waitUntil: "domcontentloaded",
    timeout: 120000,
  });
  const thread = page.locator('[data-hd="thread"]');
  await thread.waitFor({ timeout: 60000 });

  const painted = async (name) => {
    await page.waitForFunction(
      (fileName) => {
        const node = document.querySelector(`[data-hd="thread"] img[alt="${fileName}"]`);
        return node instanceof HTMLImageElement && node.complete && node.naturalWidth > 0;
      },
      name,
      { timeout: 60000 }
    );
    return page.locator(`[data-hd="thread"] img[alt="${name}"]`).first().evaluate((node) => {
      const rect = node.getBoundingClientRect();
      const link = node.closest("a");
      return {
        naturalWidth: node.naturalWidth,
        naturalHeight: node.naturalHeight,
        width: rect.width,
        height: rect.height,
        src: node.currentSrc || node.src,
        href: link?.getAttribute("href") ?? "",
      };
    });
  };

  const mine = await painted(MINE);
  const theirs = await painted(THEIRS);

  check("the customer's own picture decodes", mine.naturalWidth > 0, `${mine.naturalWidth}x${mine.naturalHeight}`);
  check("the employee's picture decodes for the customer", theirs.naturalWidth > 0, `${theirs.naturalWidth}x${theirs.naturalHeight}`);
  check(
    "both pictures keep their aspect ratio",
    Math.abs(mine.width / Math.max(1, mine.height) - mine.naturalWidth / mine.naturalHeight) < 0.02 &&
      Math.abs(theirs.width / Math.max(1, theirs.height) - theirs.naturalWidth / theirs.naturalHeight) < 0.02,
    `mine ${Math.round(mine.width)}x${Math.round(mine.height)} theirs ${Math.round(theirs.width)}x${Math.round(theirs.height)}`
  );
  check(
    "both pictures are read through the portal route, never the storage path",
    /\/api\/help-desk\/files\?url=/.test(mine.src) && /\/api\/help-desk\/files\?url=/.test(theirs.src),
    `${mine.src.split("?")[0]} | ${theirs.src.split("?")[0]}`
  );
  check(
    "each row shows its own file",
    mine.src.includes(encodeURIComponent(MINE)) && theirs.src.includes(encodeURIComponent(THEIRS)),
    "src/file mismatch"
  );
  check(
    "each picture is wrapped in a link to the file",
    /\/api\/help-desk\/files\?url=/.test(mine.href) && /\/api\/help-desk\/files\?url=/.test(theirs.href),
    `${mine.href} | ${theirs.href}`
  );

  const logText = consoleLines.join("\n");
  check(
    "the console records both paints",
    logText.includes("[hd:attach] image painted") && logText.includes(MINE) && logText.includes(THEIRS),
    "paint line missing"
  );
  check(
    "the console never reports a bad view",
    !logText.includes("does not view properly") && !logText.includes("image did not load"),
    "a failure line was logged"
  );
  check("no console errors", consoleErrors.length === 0, consoleErrors.slice(0, 3).join(" | "));

  await page.screenshot({ path: SHOT, fullPage: false });
  console.log(`screenshot ${SHOT}`);
  console.log(`\n${passed}/${passed + failed} checks passed`);
  if (failed > 0) process.exitCode = 1;
} finally {
  await browser.close();
}
