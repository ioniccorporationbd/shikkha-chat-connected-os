#!/usr/bin/env node
/**
 * 0658 — "the attached file image does not view properly".
 *
 * The employee attaches a full-page screenshot (1600x900) and the customer's
 * chat box must show the WHOLE picture, at its own aspect ratio, inside the
 * bubble — not a height-capped slab that spills across the page and cuts the
 * screenshot in half.
 *
 * Checks, on role=client (/clientDashboard) by default:
 *
 *   1. the picture decodes (naturalWidth = 1600, naturalHeight = 900);
 *   2. the frame keeps the picture's aspect ratio (no squash, no crop);
 *   3. the frame stays inside the thread (right edge within the pane);
 *   4. the frame is big enough to read but not page-width (300..470px);
 *   5. the picture is wrapped in a link to the file;
 *   6. the console says it painted, and never says "does not view properly";
 *   7. no console errors (a load failure also lands in Desk -> Error Log).
 *
 *   node scripts/mock-frappe.mjs &
 *   FRAPPE_BASE_URL=http://127.0.0.1:8787 npx next start -p 3011 &
 *   E2E_BASE=http://localhost:3011 E2E_ROLE=client node scripts/hd-0658-image-view-e2e.mjs
 *   E2E_BASE=http://localhost:3011 E2E_ROLE=staff  node scripts/hd-0658-image-view-e2e.mjs
 */
import { chromium } from "/root/arogga-UI/node_modules/playwright/index.mjs";
import fs from "node:fs";

const BASE = process.env.E2E_BASE ?? "http://localhost:3000";
const LOG = process.env.MOCK_LOG ?? "/tmp/mock_frappe.log";
const PASSWORD = process.env.MOCK_PASSWORD ?? "demo1234";
const TICKET = process.env.E2E_TICKET ?? "0658";
const ROLE = process.env.E2E_ROLE === "staff" ? "staff" : "client";
const EMAIL = ROLE === "staff" ? "tamim@ioniccorporation.com" : "client@example.com";
const SECTION = ROLE === "staff" ? "userDashboard" : "clientDashboard";
const SHOT = process.env.SHOT ?? `/tmp/hd-0658-${ROLE}.png`;
const IMAGE_NAME = process.env.E2E_IMAGE_NAME ?? "Screenshot-18_57d4b9.png";

let passed = 0;
let failed = 0;
const check = (name, ok, extra = "") => {
  if (ok) passed += 1;
  else failed += 1;
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${extra ? ` :: ${extra}` : ""}`);
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

  await page.goto(`${BASE}/${SECTION}/help-desk/tickets/${TICKET}`, {
    waitUntil: "domcontentloaded",
    timeout: 120000,
  });
  const thread = page.locator('[data-hd="thread"]');
  await thread.waitFor({ timeout: 60000 });

  // The picture the employee attached, once the thread has painted.
  const img = page.locator(`[data-hd="thread"] img[alt="${IMAGE_NAME}"]`).first();
  await img.waitFor({ state: "visible", timeout: 60000 });
  await img.scrollIntoViewIfNeeded();
  await page.waitForFunction(
    (name) => {
      const node = document.querySelector(`[data-hd="thread"] img[alt="${name}"]`);
      return node instanceof HTMLImageElement && node.complete && node.naturalWidth > 0;
    },
    IMAGE_NAME,
    { timeout: 60000 }
  );

  const box = await img.evaluate((node) => {
    const rect = node.getBoundingClientRect();
    const pane = node.closest('[data-hd="thread"]');
    const paneRect = pane.getBoundingClientRect();
    const link = node.closest("a");
    return {
      naturalWidth: node.naturalWidth,
      naturalHeight: node.naturalHeight,
      width: rect.width,
      height: rect.height,
      right: rect.right,
      paneRight: paneRect.right,
      paneWidth: pane.clientWidth,
      href: link?.getAttribute("href") ?? "",
      className: node.className,
    };
  });

  check(
    "the screenshot decodes at its real size",
    box.naturalWidth === 1600 && box.naturalHeight === 900,
    `${box.naturalWidth}x${box.naturalHeight}`
  );

  const naturalRatio = box.naturalWidth / box.naturalHeight;
  const shownRatio = box.width / Math.max(1, box.height);
  check(
    "the frame keeps the picture's aspect ratio (no squash, no crop)",
    Math.abs(shownRatio - naturalRatio) / naturalRatio < 0.02,
    `natural=${naturalRatio.toFixed(3)} shown=${shownRatio.toFixed(3)}`
  );

  check(
    "the picture stays inside the thread box",
    box.right <= box.paneRight + 1,
    `right=${Math.round(box.right)} paneRight=${Math.round(box.paneRight)}`
  );

  check(
    "the picture is big enough to read, but not page-width",
    box.width >= 300 && box.width <= 470,
    `${Math.round(box.width)}x${Math.round(box.height)} (pane ${box.paneWidth})`
  );

  check(
    "the picture is wrapped in a link to the file",
    /\/api\/help-desk\/files\?url=/.test(box.href),
    box.href
  );

  const logText = consoleLines.join("\n");
  check(
    "the console records the paint",
    logText.includes("[hd:attach] image painted") && logText.includes(IMAGE_NAME),
    logText.includes("[hd:attach] image painted") ? "" : "no paint line"
  );
  check(
    "the console never reports a bad view",
    !logText.includes("does not view properly"),
    logText.includes("does not view properly") ? "found 'does not view properly'" : ""
  );
  check("no console errors", consoleErrors.length === 0, consoleErrors.slice(0, 3).join(" | "));

  await page.screenshot({ path: SHOT, fullPage: false });
  console.log(`screenshot ${SHOT}`);
  console.log(`\n${passed}/${passed + failed} checks passed`);
  if (failed > 0) process.exitCode = 1;
} finally {
  await browser.close();
}
