#!/usr/bin/env node
/**
 * The expense-claim table reports the *base* sanctioned amount and the desk's
 * status vocabulary.
 *
 * The requirement: on `/userDashboard/expense-claim`, inside the
 * আপনার এক্সপেন্স ক্লেম table, the অনুমোদিত পরিমাণ column shows
 * `base_total_sanctioned_amount` (the company-currency figure the desk shows at
 * https://dash.shikkhachat.com/desk/shift-and-attendance/expense-claim), and
 * the সারসংক্ষেপ grid's অনুমোদিত পরিমাণ shows the same base total. Statuses read
 * the way the desk reads them: Draft -> প্রক্রিয়াধীন, Submitted -> অনুমোদিত.
 *
 * Both locales are proven, because the copy is bilingual:
 *   bn: আপনার এক্সপেন্স ক্লেম / অনুমোদিত পরিমাণ / প্রক্রিয়াধীন / অনুমোদিত
 *   en: Your Expense Claims / Sanctioned Amount / In progress / Approved
 *
 *   node scripts/mock-frappe.mjs > /tmp/mock_frappe.log 2>&1 &
 *   FRAPPE_BASE_URL=http://127.0.0.1:8787 npx next start -p 3011 &
 *   E2E_BASE=http://localhost:3011 node scripts/expense-claim-sanctioned-e2e.mjs
 */
import { chromium } from "/root/arogga-UI/node_modules/playwright/index.mjs";
import fs from "node:fs";

const BASE = process.env.E2E_BASE ?? "http://localhost:3000";
const MOCK = process.env.MOCK_BASE ?? "http://127.0.0.1:8787";
const LOG = process.env.MOCK_LOG ?? "/tmp/mock_frappe.log";
const PASSWORD = process.env.MOCK_PASSWORD ?? "demo1234";
const EMAIL = process.env.E2E_STAFF ?? "tamim@ioniccorporation.com";

/**
 * Mock seed facts this probe asserts against (scripts/mock-frappe.mjs):
 *   00001  Draft      sanction total 0     base 0
 *   00002  Submitted (docstatus 1, status still "Draft" as ERPNext keeps it)
 *          sanction total 0     base 0  -> স্ট্যাটাস must read অনুমোদিত, not প্রক্রিয়াধীন
 *   00003  Approved   sanction total 2100  base 2100
 *   00004  Paid       sanction total 800   base 800
 *   00007  Submitted, USD claim: total_sanctioned_amount 100,
 *          base_total_sanctioned_amount 12000  <- the column must show 12,000
 * So the summary sanctioned figure is 0+0+2100+800+0+0+12000 = 14,900.
 */

const COPY = {
  bn: {
    heading: "আপনার এক্সপেন্স ক্লেম",
    summaryHeading: "সারসংক্ষেপ",
    colSanctioned: "অনুমোদিত পরিমাণ",
    colStatus: "স্ট্যাটাস",
    draft: "প্রক্রিয়াধীন",
    submitted: "অনুমোদিত",
    loadFailed: "এক্সপেন্স ক্লেম লোড করা যায়নি",
  },
  en: {
    heading: "Your Expense Claims",
    summaryHeading: "Summary",
    colSanctioned: "Sanctioned Amount",
    colStatus: "Status",
    draft: "In progress",
    submitted: "Approved",
    loadFailed: "could not be loaded",
  },
};

/** Bengali digits -> ASCII, so "৳১২,০০০.০০" can be compared as "12,000". */
const ascii = (text) =>
  String(text).replace(/[০-৯]/g, (d) => String("০১২৩৪৫৬৭৮৯".indexOf(d)));

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

/** The desktop row for one claim, located by its name cell. */
const rowFor = (page, name) =>
  page.locator("table tbody tr").filter({ has: page.locator(`td:text-is("${name}")`) }).first();

const browser = await chromium.launch({
  args: ["--no-sandbox"],
  executablePath:
    process.env.PW_CHROME || "/root/.cache/ms-playwright/chromium-1254/chrome-linux64/chrome",
});
try {
  const context = await browser.newContext({ viewport: { width: 1280, height: 1000 } });
  const page = await context.newPage();
  await login(page);
  await page.waitForURL(/Dashboard/, { timeout: 60000 });

  for (const language of ["bn", "en"]) {
    const copy = COPY[language];
    console.log(`\n=== ${language} ===`);

    await context.addCookies([
      { name: "shikkha-chat-site-language", value: language, url: BASE },
    ]);

    const consoleErrors = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });

    await page.goto(`${BASE}/userDashboard/expense-claim`, {
      waitUntil: "domcontentloaded",
      timeout: 120000,
    });
    await page.locator("table tbody tr").first().waitFor({ timeout: 60000 });
    await sleep(400);

    // 1. the section the user pointed at
    const bodyText = await page.locator("body").innerText();
    check(`[${language}] the ${copy.heading} section renders`, bodyText.includes(copy.heading));
    check(
      `[${language}] the সারসংক্ষেপ grid renders`,
      ascii(bodyText).toLowerCase().includes(copy.summaryHeading.toLowerCase()),
      copy.summaryHeading
    );

    // 2. headers still say অনুমোদিত পরিমাণ / Sanctioned Amount
    const headerTexts = (await page.locator("table thead th").allInnerTexts()).map((entry) =>
      entry.trim().toLowerCase()
    );
    check(
      `[${language}] the table keeps its ${copy.colSanctioned} column`,
      headerTexts.includes(copy.colSanctioned.toLowerCase()),
      headerTexts.join(" | ")
    );
    check(
      `[${language}] the table keeps its ${copy.colStatus} column`,
      headerTexts.includes(copy.colStatus.toLowerCase()),
      headerTexts.join(" | ")
    );

    // 3. 00007 is a USD claim: claimed 100 USD, sanctioned 12,000 BDT (base).
    //    The sanctioned cell must carry the base figure, not the claim-currency one.
    const usdRow = rowFor(page, "HR-EXP-2026-00007");
    const usdCells = (await usdRow.locator("td").allInnerTexts()).map((text) => text.trim());
    check(
      `[${language}] the USD claim is listed`,
      usdCells.length >= 8,
      `cells=${usdCells.length}`
    );
    const claimedCell = ascii(usdCells[3] ?? "");
    const sanctionedCell = ascii(usdCells[4] ?? "");
    check(
      `[${language}] its claimed cell shows the claim currency (100)`,
      claimedCell.includes("100"),
      claimedCell
    );
    check(
      `[${language}] its sanctioned cell shows base_total_sanctioned_amount (12,000), not 100`,
      sanctionedCell.includes("12,000") && !sanctionedCell.includes("$"),
      sanctionedCell
    );

    // 4. statuses read like the desk: Draft -> প্রক্রিয়াধীন, Submitted -> অনুমোদিত
    const draftCells = (await rowFor(page, "HR-EXP-2026-00001").locator("td").allInnerTexts()).map(
      (text) => text.trim()
    );
    check(
      `[${language}] a Draft claim's স্ট্যাটাস reads ${copy.draft}`,
      (draftCells[5] ?? "").toLowerCase() === copy.draft.toLowerCase(),
      draftCells[5]
    );
    const submittedCells = (
      await rowFor(page, "HR-EXP-2026-00002").locator("td").allInnerTexts()
    ).map((text) => text.trim());
    check(
      `[${language}] a Submitted claim's স্ট্যাটাস reads ${copy.submitted}`,
      (submittedCells[5] ?? "").toLowerCase() === copy.submitted.toLowerCase(),
      submittedCells[5]
    );

    // 5. সারসংক্ষেপ's অনুমোদিত পরিমাণ is the base total (14,900)
    check(
      `[${language}] the summary's ${copy.colSanctioned} shows the base total (14,900)`,
      ascii(bodyText).includes("14,900"),
      ascii(bodyText).slice(0, 120)
    );

    // 6. nothing else broke
    const noisy = consoleErrors.filter(
      (line) => !/Download the React DevTools|favicon|hydration/i.test(line)
    );
    check(`[${language}] no console error`, noisy.length === 0, noisy.slice(0, 2).join(" | "));

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    check(`[${language}] no horizontal overflow at 1280px`, overflow <= 0, `overflow=${overflow}px`);

    await page.screenshot({
      path: `/root/.hermes/cache/scratch/expense-claim-${language}.png`,
      fullPage: false,
    });

    // 7. phone: the card view must carry the same figures and words
    await page.setViewportSize({ width: 390, height: 900 });
    await sleep(600);
    const phoneText = ascii(await page.locator("body").innerText());
    check(
      `[${language}] the phone cards show the base sanctioned figure too`,
      phoneText.includes("12,000"),
      phoneText.slice(0, 160)
    );
    check(
      `[${language}] the phone cards use the same status words`,
      phoneText.includes(copy.draft),
      phoneText.slice(0, 160)
    );
    const phoneOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    check(
      `[${language}] no horizontal overflow at 390px`,
      phoneOverflow <= 0,
      `overflow=${phoneOverflow}px`
    );
    await page.screenshot({
      path: `/root/.hermes/cache/scratch/expense-claim-${language}-phone.png`,
      fullPage: false,
    });
    await page.setViewportSize({ width: 1280, height: 1000 });

    // 8. requirement #4 — a broken list must leave a console line AND an entry
    // in the ERP Error Log (the mock mirrors /api/log/client-error).
    if (language === "bn") {
      const failedConsole = [];
      const collect = (message) => {
        if (message.type() === "error") failedConsole.push(message.text());
      };
      page.on("console", collect);

      const before = (await (await fetch(`${MOCK}/__mock/client-log`)).json()).entries?.length ?? 0;

      // The page reads its own proxy, so abort that (never the Frappe URL).
      await page.route(/\/api\/expense-claim\?/, (route) => route.abort("failed"));
      await page.goto(`${BASE}/userDashboard/expense-claim`, {
        waitUntil: "domcontentloaded",
        timeout: 120000,
      });
      await page
        .locator(`text=${copy.loadFailed}`)
        .first()
        .waitFor({ timeout: 30000 })
        .catch(() => {});
      await sleep(1500);

      check(
        `[${language}] the failure reached the browser console`,
        failedConsole.some((line) => line.includes("[client-error:expense-claim:list]")),
        failedConsole.slice(0, 2).join(" | ")
      );

      const entries = (await (await fetch(`${MOCK}/__mock/client-log`)).json()).entries ?? [];
      check(
        `[${language}] the failure was logged for the ERP Error Log`,
        entries.length > before &&
          entries
            .slice(before)
            .some((entry) => String(entry.scope ?? "").includes("expense-claim:list")),
        JSON.stringify(entries.slice(before)).slice(0, 200)
      );
      await page.unroute(/\/api\/expense-claim\?/);
    }
  }
} finally {
  await browser.close();
}

console.log(`\n${passed}/${passed + failed} checks passed`);
if (failed > 0) process.exit(1);
