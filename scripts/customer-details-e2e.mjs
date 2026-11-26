#!/usr/bin/env node
/**
 * "বিস্তারিত" on the Create Customer table opens a customer profile popup.
 *
 * The requirement: on `/userDashboard/create-customer`, in the table where
 * তৈরির তারিখ is a column, the Action column's cell is a **বিস্তারিত** button.
 * A click shows a loading state, then a popup with the customer's details that
 * can be **printed** and **downloaded**. The data comes from the ERP Customer
 * document (`https://dash.shikkhachat.com/desk/selling/customer`), read through
 * `shikkha_os.api.v1.customer.details` — the same method the EDIT form prefills
 * from — so nothing new is exposed.
 *
 * Both locales are proven, because the copy is bilingual:
 *   bn: অ্যাকশন / বিস্তারিত / কাস্টমার প্রোফাইল
 *   en: Action   / Details   / Customer profile
 *
 *   node scripts/mock-frappe.mjs > /tmp/mock_frappe.log 2>&1 &
 *   FRAPPE_BASE_URL=http://127.0.0.1:8787 npx next start -p 3011 &
 *   E2E_BASE=http://localhost:3011 node scripts/customer-details-e2e.mjs
 */
import { chromium } from "/root/arogga-UI/node_modules/playwright/index.mjs";
import fs from "node:fs";

const BASE = process.env.E2E_BASE ?? "http://localhost:3000";
const MOCK = process.env.MOCK_BASE ?? "http://127.0.0.1:8787";
const LOG = process.env.MOCK_LOG ?? "/tmp/mock_frappe.log";
const PASSWORD = process.env.MOCK_PASSWORD ?? "demo1234";
const EMAIL = process.env.E2E_STAFF ?? "tamim@ioniccorporation.com";

const stamp = Date.now().toString().slice(-7);
const SEEDS = [
  {
    customer_name: `Details Check Co ${stamp}`,
    customer_type: "Company",
    customer_group: "Commercial",
    territory: "Bangladesh",
    mobile_no: "01812345678",
    email_id: `details-${stamp}@example.com`,
    website: "https://details-check.example.com",
    tax_id: `BIN-${stamp}`,
    default_currency: "BDT",
    default_price_list: "Standard Selling",
  },
  {
    customer_name: `Details Check Person ${stamp}`,
    customer_type: "Individual",
    customer_group: "Individual",
    territory: "Bangladesh",
    mobile_no: "01987654321",
    email_id: `details-person-${stamp}@example.com`,
  },
];

const COPY = {
  bn: {
    action: "অ্যাকশন",
    email: "ইমেইল",
    created: "তৈরির তারিখ",
    details: "বিস্তারিত",
    loading: "কাস্টমারের তথ্য লোড হচ্ছে…",
    eyebrow: "কাস্টমার প্রোফাইল",
    sections: ["কাস্টমার তথ্য", "যোগাযোগ", "ব্যবসা ও কর", "রেকর্ড"],
    print: "প্রিন্ট",
    download: "ডাউনলোড",
    close: "বন্ধ করুন",
    footer: "গ্রাহক কপি — শিক্ষা চ্যাট পোর্টাল",
    taxLabel: "ট্যাক্স আইডি",
    failed: "কাস্টমারের তথ্য আনা যায়নি",
  },
  en: {
    action: "Action",
    email: "Email",
    created: "Created",
    details: "Details",
    loading: "Loading the customer's details…",
    eyebrow: "Customer profile",
    sections: ["Customer information", "Contact", "Business & tax", "Record"],
    print: "Print",
    download: "Download",
    close: "Close",
    footer: "Customer copy — Shikkha Chat portal",
    taxLabel: "Tax ID",
    failed: "could not be loaded",
  },
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

  // The print iframe is same-origin and short-lived; a `print` shim records
  // the exact HTML that was handed to the browser's print dialog.
  await context.addInitScript(() => {
    const real = window.print ? window.print.bind(window) : null;
    window.print = function patchedPrint(...args) {
      try {
        const sink = window.parent === window ? window : window.parent;
        sink.__printSnapshots = sink.__printSnapshots || [];
        sink.__printSnapshots.push(document.documentElement.outerHTML);
      } catch {
        /* cross-origin frame — nothing to record */
      }
      return real ? real.apply(window, args) : undefined;
    };
  });

  // --- seed two Customers through the app's own proxy --------------------
  const cookieHeader = (await context.cookies())
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join("; ");
  for (const seed of SEEDS) {
    const response = await fetch(`${BASE}/api/customer/create`, {
      method: "POST",
      headers: { "content-type": "application/json", cookie: cookieHeader },
      body: JSON.stringify({ data: seed, language: "en" }),
    });
    const payload = await response.json().catch(() => ({}));
    check(
      `seed: ${seed.customer_name} created`,
      response.ok && Boolean((payload?.data ?? payload)?.name),
      `${response.status} ${JSON.stringify(payload).slice(0, 160)}`
    );
  }

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

    await page.goto(`${BASE}/userDashboard/create-customer`, {
      waitUntil: "domcontentloaded",
      timeout: 120000,
    });
    await page.locator("[data-customer-details]").first().waitFor({ timeout: 60000 });

    // 1. the action column replaced plain text, sits right after তৈরির তারিখ
    const headers = await page.locator("table thead th").allInnerTexts();
    const headerTexts = headers.map((entry) => entry.trim().toLowerCase());
    check(
      `[${language}] the last column header reads ${copy.action}`,
      headerTexts[headerTexts.length - 1] === copy.action.toLowerCase(),
      headerTexts.join(" | ")
    );
    check(
      `[${language}] it comes directly after ${copy.email}`,
      headerTexts[headerTexts.length - 2] === copy.email.toLowerCase(),
      headerTexts.join(" | ")
    );
    check(
      `[${language}] the ${copy.created} column is gone from the table`,
      !headerTexts.includes(copy.created.toLowerCase()),
      headerTexts.join(" | ")
    );
    const firstRowCells = await page.locator("table tbody tr").first().locator("td").count();
    check(
      `[${language}] every row has exactly one cell per header (${headerTexts.length})`,
      firstRowCells === headerTexts.length,
      `cells=${firstRowCells} headers=${headerTexts.length}`
    );

    // 2. every row offers the বিস্তারিত button
    const rowCount = await page.locator("table tbody tr").count();
    const buttonCount = await page.locator("table tbody [data-customer-details]").count();
    check(
      `[${language}] every one of ${rowCount} rows has a ${copy.details} button`,
      rowCount > 0 && buttonCount === rowCount,
      `rows=${rowCount} buttons=${buttonCount}`
    );
    const firstButtonText = (await page.locator("table tbody [data-customer-details]").first().innerText()).trim();
    check(
      `[${language}] the button's own label is ${copy.details}`,
      firstButtonText === copy.details,
      firstButtonText
    );

    // Narrow to one row so the popup is exercised on a known Customer even
    // when older runs have filled the first page.
    const seed = SEEDS[0];
    await page.fill("input[type=search]", seed.customer_name);
    await page
      .locator("table tbody tr")
      .filter({ hasText: seed.customer_name })
      .first()
      .waitFor({ timeout: 15000 });

    // 3. loading → popup. Park the details call briefly so the loader is real.
    await page.route("**/api/customer/details*", async (route) => {
      await sleep(900);
      await route.continue();
    });

    const rowButton = page
      .locator("table tbody tr")
      .filter({ hasText: seed.customer_name })
      .locator("[data-customer-details]")
      .first();
    await rowButton.click();

    const loadingVisible = await page
      .locator(`text=${copy.loading}`)
      .first()
      .isVisible()
      .catch(() => false);
    check(`[${language}] a loading state shows before the popup fills`, loadingVisible, copy.loading);

    const sheet = page.locator("[data-detail-sheet]").first();
    await sheet.waitFor({ timeout: 30000 });
    await page.locator(`text=${copy.eyebrow}`).first().waitFor({ timeout: 30000 });
    const sheetText = await sheet.innerText();
    await page.unroute("**/api/customer/details*");

    check(
      `[${language}] the loader is gone once the popup is filled`,
      !sheetText.includes(copy.loading),
      sheetText.slice(0, 120)
    );
    check(
      `[${language}] the popup names the customer`,
      sheetText.includes(seed.customer_name),
      sheetText.slice(0, 200)
    );
    check(
      `[${language}] the popup shows the customer id (CUST-…)`,
      /CUST-\d{4}/.test(sheetText),
      sheetText.slice(0, 200)
    );
    for (const section of copy.sections) {
      check(
        `[${language}] section “${section}” is in the popup`,
        sheetText.toLowerCase().includes(section.toLowerCase()),
        sheetText.slice(0, 240)
      );
    }
    check(`[${language}] the mobile is shown`, sheetText.includes(seed.mobile_no));
    check(`[${language}] the e-mail is shown`, sheetText.includes(seed.email_id));
    check(`[${language}] the tax id is shown`, sheetText.includes(seed.tax_id));
    check(
      `[${language}] the created date is shown`,
      !sheetText.includes("—") || /\d{1,2}\s/.test(sheetText),
      sheetText.slice(0, 240)
    );

    await sleep(900); // let the entrance animation settle before the screenshot
    await page.screenshot({
      path: `/root/.hermes/cache/scratch/customer-details-${language}-popup.png`,
      fullPage: false,
    });

    // 4. print — the printed document must carry the same details
    await page.evaluate(() => {
      window.__printSnapshots = [];
    });
    await sheet.locator(`button:has-text("${copy.print}")`).first().click();
    let printed = "";
    for (let i = 0; i < 40 && !printed; i += 1) {
      const snapshots = await page.evaluate(() => window.__printSnapshots || []);
      printed = snapshots[0] || "";
      if (!printed) await sleep(150);
    }
    check(`[${language}] Print builds a printable document`, printed.length > 500, `len=${printed.length}`);
    check(`[${language}] the printed copy names the customer`, printed.includes(seed.customer_name));
    check(`[${language}] the printed copy carries the mobile`, printed.includes(seed.mobile_no));
    check(`[${language}] the printed copy carries the tax id`, printed.includes(seed.tax_id));
    check(`[${language}] the printed copy carries the footer note`, printed.includes(copy.footer));

    // 5. download — an .html file named after the Customer
    const [download] = await Promise.all([
      page.waitForEvent("download", { timeout: 15000 }),
      sheet.locator(`button:has-text("${copy.download}")`).first().click(),
    ]);
    check(
      `[${language}] Download saves customer-CUST-….html`,
      /customer-CUST-\d{4}\.html$/.test(download.suggestedFilename()),
      download.suggestedFilename()
    );

    // 6. the popup closes cleanly and the table is still there
    const closeButton = sheet.locator(`button[aria-label="${copy.close}"]`).first();
    check(
      `[${language}] the close control is labelled ${copy.close}`,
      (await closeButton.count()) === 1
    );
    await closeButton.click();
    await sleep(500);
    await page.fill("input[type=search]", "");
    await page.locator("table tbody tr").first().waitFor({ timeout: 15000 });
    await sleep(300);
    check(
      `[${language}] the popup closes back onto the table`,
      (await page.locator("table tbody [data-customer-details]").count()) === rowCount,
      `rows=${await page.locator("table tbody [data-customer-details]").count()}`
    );

    // 7. nothing else broke
    const noisy = consoleErrors.filter(
      (line) => !/Download the React DevTools|favicon|hydration/i.test(line)
    );
    check(`[${language}] no console error`, noisy.length === 0, noisy.slice(0, 2).join(" | "));

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    check(`[${language}] no horizontal overflow at 1280px`, overflow <= 0, `overflow=${overflow}px`);

    await page.screenshot({
      path: `/root/.hermes/cache/scratch/customer-details-${language}.png`,
      fullPage: false,
    });

    // phone width: the card view must offer the same button
    await page.setViewportSize({ width: 390, height: 900 });
    await sleep(500);
    const phoneButtons = await page.locator("[data-customer-details]:visible").count();
    check(`[${language}] the button is reachable on a phone (390px)`, phoneButtons > 0, `count=${phoneButtons}`);
    const phoneText = await page.locator("body").innerText();
    check(
      `[${language}] the phone cards drop ${copy.created} too`,
      !phoneText.includes(copy.created),
      phoneText.slice(0, 160)
    );

    // reopen on phone to prove the popup fits
    await page.locator("[data-customer-details]:visible").first().click();
    await page.locator("[data-detail-sheet]").first().waitFor({ timeout: 30000 });
    await sleep(900);
    const phoneOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    check(`[${language}] the popup does not overflow a phone`, phoneOverflow <= 0, `overflow=${phoneOverflow}px`);
    await page.screenshot({
      path: `/root/.hermes/cache/scratch/customer-details-${language}-phone.png`,
      fullPage: false,
    });
    await page.keyboard.press("Escape");
    await page.setViewportSize({ width: 1280, height: 1000 });

    // 8. requirement #4 — a broken popup must leave a console line AND an entry
    // in the ERP Error Log (the mock mirrors `/api/log/client-error`).
    if (language === "bn") {
      const failedConsole = [];
      const collect = (message) => {
        if (message.type() === "error") failedConsole.push(message.text());
      };
      page.on("console", collect);

      const before = (await (await fetch(`${MOCK}/__mock/client-log`)).json()).entries?.length ?? 0;

      await page.route("**/api/customer/details*", (route) => route.abort("failed"));
      await page.locator("table tbody [data-customer-details]").first().click();
      const failedSheet = page.locator("[data-detail-sheet]").first();
      await failedSheet.waitFor({ timeout: 30000 });
      await page.locator(`text=${copy.failed}`).first().waitFor({ timeout: 20000 });
      const failedText = await failedSheet.innerText();
      check(
        `[${language}] a failed fetch shows the failure message`,
        failedText.includes(copy.failed),
        failedText.slice(0, 160)
      );
      await sleep(800);

      check(
        `[${language}] the failure reached the browser console`,
        failedConsole.some((line) => line.includes("[client-error:customer:details]")),
        failedConsole.slice(0, 2).join(" | ")
      );

      const entries = (await (await fetch(`${MOCK}/__mock/client-log`)).json()).entries ?? [];
      const fresh = entries.slice(before).filter((entry) => entry.scope === "customer:details");
      check(
        `[${language}] the failure reached the ERP Error Log bridge`,
        fresh.length === 1 && String(fresh[0].page || "").includes("create-customer"),
        JSON.stringify(fresh).slice(0, 240)
      );

      await page.keyboard.press("Escape");
      await page.unroute("**/api/customer/details*");
      page.off("console", collect);
    }

    page.removeAllListeners("console");
  }
} finally {
  await browser.close();
}

console.log(`\n${passed}/${passed + failed} checks passed`);
process.exit(failed === 0 && passed > 0 ? 0 : 1);
