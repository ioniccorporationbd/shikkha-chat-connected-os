#!/usr/bin/env node
/**
 * Expense-claim list UI, two requirements on /userDashboard/expense-claim:
 *
 *   1. সারসংক্ষেপ gains a বকেয়া figure beside অনুমোদিত পরিমাণ / পরিশোধিত, and it
 *      equals অনুমোদিত পরিমাণ − পরিশোধিত (sum of base sanctioned − sum reimbursed,
 *      clamped at zero).
 *   2. The অ্যাকশন column's "বিস্তারিত দেখুন" button shows a spinner while the
 *      details request is in flight and only then opens the popup; the popup
 *      carries Print and Download actions that really print / download the
 *      same sections the popup shows.
 *
 *   node scripts/mock-frappe.mjs > /tmp/mock_frappe.log 2>&1 &
 *   FRAPPE_BASE_URL=http://127.0.0.1:8787 npx next start -p 3011 &
 *   E2E_BASE=http://localhost:3011 node scripts/expense-claim-list-due-e2e.mjs
 */
import { chromium } from "/root/arogga-UI/node_modules/playwright/index.mjs";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const BASE = process.env.E2E_BASE ?? "http://localhost:3000";
const MOCK = process.env.MOCK_BASE ?? "http://127.0.0.1:8787";
const LOG = process.env.MOCK_LOG ?? "/tmp/mock_frappe.log";
const PASSWORD = process.env.MOCK_PASSWORD ?? "demo1234";
const EMAIL = process.env.E2E_STAFF ?? "tamim@ioniccorporation.com";
const CHROME =
  process.env.PW_CHROME ?? "/root/.cache/ms-playwright/chromium-1254/chrome-linux64/chrome";

const COPY = {
  bn: { due: "বকেয়া", print: "প্রিন্ট", download: "ডাউনলোড", view: "বিস্তারিত দেখুন", paidColumn: "পেমেন্ট" },
  en: { due: "Due", print: "Print", download: "Download", view: "View details", paidColumn: "Paid" },
};

/** Bengali digits -> ASCII so "৳৬০০.০০" can be compared as 600. */
const ascii = (text) =>
  String(text).replace(/[০-৯]/g, (d) => String("০১২৩৪৫৬৭৮৯".indexOf(d)));

/** Parse a formatted currency string back to a number ("৳১,০০০.০০" -> 1000). */
const amountOf = (text) => {
  const clean = ascii(text).replace(/[^0-9.]/g, "");
  return clean ? Number(clean) : Number.NaN;
};

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

/** Expected বকেয়া from the mock's own claim store, using the UI's formula. */
async function expectedDue() {
  const envelope = await (await fetch(`${MOCK}/__mock/expense-claims`)).json();
  const rows =
    envelope.message?.data?.entries ?? envelope.data?.entries ?? envelope.entries ?? [];
  let sanctioned = 0;
  let reimbursed = 0;
  for (const row of rows) {
    sanctioned += Number(row.base_total_sanctioned_amount ?? row.total_sanctioned_amount ?? 0);
    reimbursed += Number(row.total_amount_reimbursed || 0);
  }
  return Math.max(0, sanctioned - reimbursed);
}

const browser = await chromium.launch({
  executablePath: CHROME,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
const expected = await expectedDue();

for (const language of ["bn", "en"]) {
  const copy = COPY[language];
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    acceptDownloads: true,
  });
  await context.addCookies([
    { name: "shikkha-chat-site-language", value: language, url: BASE },
  ]);
  // the mock answers instantly, which can hide the in-sheet loader; slow only the
  // single-claim details request so the loading state is deterministic
  await context.route("**/*", async (route) => {
    const request = route.request();
    if (request.method() === "GET" && /\/api\/expense-claim\/[A-Z]/.test(request.url())) {
      await new Promise((resolve) => setTimeout(resolve, 1200));
    }
    await route.continue();
  });
  const page = await context.newPage();
  const noisy = [];
  page.on("console", (message) => {
    if (message.type() === "error") noisy.push(message.text());
  });

  console.log(`\n=== ${language} ===`);
  await login(page);
  await page.goto(`${BASE}/userDashboard/expense-claim`, {
    waitUntil: "domcontentloaded",
    timeout: 120000,
  });

  // ---- 1. the বকেয়া summary figure
  const dueTile = page.locator("[data-summary-due]").first();
  await dueTile.waitFor({ timeout: 60000 });
  const dueText = (await dueTile.innerText()).trim();
  check(
    `[${language}] সারসংক্ষেপ shows a ${copy.due} figure`,
    ascii(dueText).toLowerCase().includes(copy.due.toLowerCase()),
    dueText
  );
  const dueValue = await page
    .locator("[data-summary-due-value]")
    .first()
    .innerText()
    .catch(() => "");
  check(
    `[${language}] ${copy.due} = অনুমোদিত পরিমাণ − পরিশোধিত (${expected})`,
    Math.abs(amountOf(dueValue) - expected) < 0.01,
    `rendered=${dueValue} expected=${expected}`
  );

  // ---- 2. view details: popup opens at once with a loading state inside
  //         (the Create Customer pattern), then fills in.
  await page.evaluate(() => {
    window.__sawLoading = false;
    new MutationObserver(() => {
      if (document.querySelector("[data-claim-detail-loading]")) {
        window.__sawLoading = true;
      }
    }).observe(document.documentElement, {
      subtree: true,
      childList: true,
      attributes: true,
    });
  });

  const viewButtons = page.locator("[data-claim-details]");
  await viewButtons.first().waitFor({ timeout: 60000 });
  check(
    `[${language}] the অ্যাকশন button reads ${copy.view}`,
    ascii(await viewButtons.first().innerText()).includes(copy.view)
  );
  await viewButtons.first().click();

  // ---- the পেমেন্ট column is gone from the আপনার এক্সপেন্স ক্লেম table
  const headers = await page.locator("table thead th").allInnerTexts();
  check(
    `[${language}] no "${copy.paidColumn}" column in the claims table`,
    !headers.some((text) => ascii(text).trim().toLowerCase() === copy.paidColumn.toLowerCase()),
    headers.join(" | ")
  );

  const printButton = page.locator("[data-claim-print]").first();
  await printButton.waitFor({ timeout: 60000 });
  check(`[${language}] the popup opened on click`, await printButton.isVisible());
  check(
    `[${language}] the popup showed a loading state while fetching`,
    await page.evaluate(() => window.__sawLoading === true)
  );

  // ---- popup shell + button styling follow the Create Customer popup
  const shape = await page.evaluate(() => {
    const dialog = document.querySelector('[role="dialog"]');
    const print = document.querySelector("[data-claim-print]");
    const download = document.querySelector("[data-claim-download]");
    const read = (el) => (el ? getComputedStyle(el) : null);
    const p = read(print);
    const d = read(download);
    return {
      width: dialog ? Math.round(dialog.getBoundingClientRect().width) : 0,
      printBg: p ? p.backgroundColor : "",
      printText: print ? getComputedStyle(print.querySelector("span")).color : "",
      downloadBorder: d ? d.borderTopColor : "",
      downloadWidth: d ? d.borderTopWidth : "",
    };
  });
  const RED = "rgb(224, 5, 22)"; // --color-action
  check(
    `[${language}] the popup is wider than the old 560px sheet`,
    shape.width >= 640,
    `width=${shape.width}px`
  );
  check(
    `[${language}] প্রিন্ট is red with white text`,
    shape.printBg === RED && shape.printText === "rgb(255, 255, 255)",
    `bg=${shape.printBg} text=${shape.printText}`
  );
  check(
    `[${language}] ডাউনলোড keeps a red outline`,
    shape.downloadBorder === RED && parseFloat(shape.downloadWidth) > 0,
    `border=${shape.downloadBorder} width=${shape.downloadWidth}`
  );

  const downloadButton = page.locator("[data-claim-download]").first();
  const downloadText = ascii(await downloadButton.innerText());
  const printText = ascii(await printButton.innerText());
  check(
    `[${language}] the popup offers ${copy.print} and ${copy.download}`,
    printText.includes(copy.print) && downloadText.includes(copy.download),
    `print=${printText} download=${downloadText}`
  );

  // ---- download really downloads an HTML document
  const [download] = await Promise.all([
    page.waitForEvent("download", { timeout: 30000 }),
    downloadButton.click(),
  ]);
  const suggested = download.suggestedFilename();
  const saved = path.join(os.tmpdir(), `ec-list-${language}-${suggested}`);
  await download.saveAs(saved);
  const html = fs.readFileSync(saved, "utf8");
  check(
    `[${language}] download saves expense-claim-*.html with the document body`,
    suggested.startsWith("expense-claim-") &&
      suggested.endsWith(".html") &&
      html.length > 1000 &&
      html.includes("<!doctype html>"),
    `${suggested} ${html.length}b`
  );

  // ---- print opens a print frame with the same document
  await page.evaluate(() => {
    window.__printFrames = 0;
    const count = () => {
      window.__printFrames = document.querySelectorAll("iframe").length;
    };
    new MutationObserver(count).observe(document.body, {
      subtree: true,
      childList: true,
    });
  });
  await printButton.click();
  await sleep(600);
  const frames = await page.evaluate(() => window.__printFrames);
  check(`[${language}] print opens a print frame`, frames > 0, `frames=${frames}`);

  check(`[${language}] no console error`, noisy.length === 0, noisy.slice(0, 2).join(" | "));

  await page.screenshot({
    path: `/root/.hermes/cache/scratch/expense-claim-due-${language}.png`,
    fullPage: false,
  });
  await context.close();
}

await browser.close();
console.log(`\n${passed}/${passed + failed} checks passed`);
process.exit(failed ? 1 : 0);