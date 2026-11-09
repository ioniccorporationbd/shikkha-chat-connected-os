#!/usr/bin/env node
/**
 * Creating an expense claim from the portal also pays it: the backend posts one
 * Payment Entry (pay-type, party = the employee) whose paid amount is the
 * claim's *base sanctioned amount*, and links it back to the claim it settles.
 *
 * Requirement: on /userDashboard/expense-claim/new, after the user fills the
 * form and presses submit, a Payment Entry must exist at
 * https://dash.shikkhachat.com/desk/expenses/payment-entry with
 * paid_amount = base_sanctioned_amount of the claim created
 * (e.g. HR-EXP-2026-00009: claimed 6000, sanctioned 600 -> paid 600).
 *
 * Proven here against the mock, both locales:
 *   1. the success card names the Payment Entry and its paid amount;
 *   2. the mock's /__mock/payment-entries shows that entry: Pay / Employee /
 *      docstatus 1 / references[0] = Expense Claim <name> / allocated =
 *      paid_amount = the claim's sanctioned base;
 *   3. the claim itself is now Approved and Paid, and the list page shows it.
 *
 *   node scripts/mock-frappe.mjs > /tmp/mock_frappe.log 2>&1 &
 *   FRAPPE_BASE_URL=http://127.0.0.1:8787 npx next start -p 3011 &
 *   E2E_BASE=http://localhost:3011 node scripts/expense-claim-create-payment-e2e.mjs
 */
import { chromium } from "/root/arogga-UI/node_modules/playwright/index.mjs";
import fs from "node:fs";

const BASE = process.env.E2E_BASE ?? "http://localhost:3000";
const MOCK = process.env.MOCK_BASE ?? "http://127.0.0.1:8787";
const LOG = process.env.MOCK_LOG ?? "/tmp/mock_frappe.log";
const PASSWORD = process.env.MOCK_PASSWORD ?? "demo1234";
const EMAIL = process.env.E2E_STAFF ?? "tamim@ioniccorporation.com";

const COPY = {
  bn: {
    submit: "জমা দিন",
    paymentLabel: "পেমেন্ট এন্ট্রি",
    paidLabel: "পরিশোধিত (অনুমোদিত পরিমাণ)",
    paidStatus: "পরিশোধিত",
    colSanctioned: "অনুমোদিত পরিমাণ",
    colStatus: "স্ট্যাটাস",
  },
  en: {
    submit: "Submit",
    paymentLabel: "Payment Entry",
    paidLabel: "Paid (sanctioned amount)",
    paidStatus: "Paid",
    colSanctioned: "Sanctioned Amount",
    colStatus: "Status",
  },
};

/** Bengali digits -> ASCII so "৳৬০০.০০" can be compared as "600". */
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

/**
 * Field labels follow the site language, so the form is addressed by position:
 * the schema's field order is the DOM order of the one <label> per field.
 */
async function fillField(page, wrap, field, value) {
  const type = field.fieldtype;
  if (type === "Select") {
    await wrap.getByRole("button").first().click();
    await page.getByRole("option").filter({ hasText: value }).first().click();
    return;
  }
  if (type === "Link" || type === "Dynamic Link") {
    const input = wrap.locator("input").first();
    await input.click();
    await input.fill(String(value));
    const option = wrap.locator("ul li").filter({ hasText: value }).first();
    await option.waitFor({ timeout: 15000 });
    await option.click();
    return;
  }
  if (type === "Date") {
    await wrap.locator("input[type=date]").first().fill(value);
    return;
  }
  if (["Currency", "Float", "Int", "Percent"].includes(type)) {
    await wrap.locator("input").first().fill(String(value));
    return;
  }
  await wrap.locator("textarea, input").first().fill(String(value));
}

const browser = await chromium.launch({
  args: ["--no-sandbox"],
  executablePath:
    process.env.PW_CHROME || "/root/.cache/ms-playwright/chromium-1254/chrome-linux64/chrome",
});
try {
  let seq = 0;
  for (const language of ["bn", "en"]) {
    const copy = COPY[language];
    const amount = 600 + seq * 50;
    seq += 1;
    console.log(`\n=== ${language} (claim ${amount}) ===`);

    const context = await browser.newContext({ viewport: { width: 1280, height: 1000 } });
    await context.addCookies([
      { name: "shikkha-chat-site-language", value: language, url: BASE },
    ]);
    const page = await context.newPage();
    const noisy = [];
    page.on("console", (message) => {
      if (message.type() === "error") noisy.push(message.text());
    });
    page.on("pageerror", (error) => noisy.push(String(error)));

    await login(page);
    await page.goto(`${BASE}/userDashboard/expense-claim/new`, {
      waitUntil: "domcontentloaded",
      timeout: 120000,
    });
    // The form schema drives the labels, so resolve them the way the page does.
    const schema = await page.evaluate(async () => {
      const res = await fetch("/api/expense-claim/schema", { headers: { accept: "application/json" } });
      const payload = await res.json();
      return payload?.data ?? payload;
    });
    if (!schema?.child?.fields?.length) throw new Error("no form schema from the proxy");
    check(`[${language}] the New Expense Claim form renders`, true);

    const today = new Date().toISOString().slice(0, 10);
    const parentFields = schema.sections.flatMap((section) => section.fields);
    const allFields = [...parentFields, ...schema.child.fields];
    const labels = page.locator("form label");
    // Hydration lays the fields out after the shell paints.
    await labels.nth(allFields.length - 1).waitFor({ timeout: 30000 });
    const labelCount = await labels.count();
    check(
      `[${language}] the form rendered every field (${labelCount} labels)`,
      labelCount >= allFields.length,
      `labels=${labelCount} fields=${allFields.length}`
    );
    for (const [index, field] of allFields.entries()) {
      if (field.read_only) continue;
      const wrap = labels.nth(index).locator("xpath=..");
      if (field.fieldtype === "Date") await fillField(page, wrap, field, today);
      else if (["Select", "Link", "Dynamic Link"].includes(field.fieldtype)) {
        const option =
          field.options?.includes("Food") || field.link_doctype === "Expense Claim Type"
            ? "Food"
            : (field.options ?? [])[0];
        if (option) await fillField(page, wrap, field, option);
      } else if (["Currency", "Float", "Int", "Percent"].includes(field.fieldtype)) {
        await fillField(page, wrap, field, amount);
      } else {
        await fillField(page, wrap, field, "prepared by the e2e probe");
      }
    }

    await page.locator("button[type=submit]").first().click();

    const paymentBlock = page.locator("[data-claim-payment-entry]").first();
    await paymentBlock.waitFor({ timeout: 30000 });
    await sleep(400);

    const bodyText = await page.locator("body").innerText();
    const claimName = (bodyText.match(/HR-EXP-\d{4}-\d{5}/) ?? [])[0] ?? "";
    const paymentName = (bodyText.match(/ACC-PAY-\d{4}-\d{5}/) ?? [])[0] ?? "";
    check(
      `[${language}] the success card names the claim (${claimName})`,
      Boolean(claimName)
    );
    check(
      `[${language}] the success card shows a ${copy.paymentLabel} (${paymentName})`,
      Boolean(paymentName),
      bodyText.slice(0, 240)
    );
    check(
      `[${language}] the card labels the payment block "${copy.paymentLabel}"`,
      ascii(await paymentBlock.innerText()).includes(copy.paymentLabel)
    );
    check(
      `[${language}] the card says ${copy.paidStatus}, not the raw ERP word`,
      ascii(bodyText).includes(copy.paidStatus),
      ascii(bodyText).slice(0, 200)
    );
    check(
      `[${language}] the card shows the paid amount (${amount})`,
      ascii(bodyText).includes(copy.paidLabel) && ascii(bodyText).includes(String(amount)),
      ascii(bodyText).slice(0, 300)
    );

    // The mock plays the ERP: one Payment Entry, linked to the claim.
    const postedEnvelope = await (await fetch(`${MOCK}/__mock/expense-payment-entries`)).json();
    const posted = postedEnvelope?.message?.data ?? postedEnvelope?.data ?? postedEnvelope;
    const entry = (posted.entries ?? []).find((row) => row.reference_no === claimName);
    check(`[${language}] a Payment Entry was posted for ${claimName}`, Boolean(entry));
    check(
      `[${language}] it is a Pay entry for the employee`,
      entry?.payment_type === "Pay" && entry?.party_type === "Employee",
      JSON.stringify(entry ?? null).slice(0, 300)
    );
    check(
      `[${language}] paid_amount = the claim's base sanctioned amount (${amount})`,
      Number(entry?.paid_amount) === amount,
      `paid=${entry?.paid_amount}`
    );
    check(
      `[${language}] it stays linked to the Expense Claim`,
      entry?.references?.[0]?.reference_doctype === "Expense Claim" &&
        entry?.references?.[0]?.reference_name === claimName &&
        Number(entry?.references?.[0]?.allocated_amount) === amount,
      JSON.stringify(entry?.references ?? []).slice(0, 240)
    );
    check(`[${language}] the entry is submitted (docstatus 1)`, entry?.docstatus === 1);

    // ... and the claim it settles is now paid.
    const claimsEnvelope = await (await fetch(`${MOCK}/__mock/expense-claims`)).json().catch(() => null);
    const claims = claimsEnvelope?.message?.data ?? claimsEnvelope?.data ?? claimsEnvelope;
    if (claims?.entries) {
      const claim = claims.entries.find((row) => row.name === claimName);
      check(
        `[${language}] the claim is approved and paid`,
        claim?.approval_status === "Approved" && Number(claim?.is_paid) === 1,
        JSON.stringify(claim ?? null).slice(0, 240)
      );
    }

    await page.screenshot({
      path: `/root/.hermes/cache/scratch/expense-claim-success-${language}.png`,
      fullPage: true,
    });

    // The list page reflects the same state.
    await page.goto(`${BASE}/userDashboard/expense-claim`, {
      waitUntil: "domcontentloaded",
      timeout: 120000,
    });
    page.setDefaultTimeout(20000);
    const row = page
      .locator("table tbody tr")
      .filter({ has: page.locator(`td:text-is("${claimName}")`) })
      .first();
    await row.waitFor({ timeout: 20000 });
    const cells = (await row.locator("td").allInnerTexts()).map((text) => text.trim());
    check(
      `[${language}] the list shows ${claimName} as ${copy.paidStatus}`,
      cells.some((text) => text === copy.paidStatus),
      cells.join(" | ").slice(0, 240)
    );
    check(
      `[${language}] its ${copy.colSanctioned} cell shows ${amount}`,
      cells.some((text) => ascii(text).replace(/[^\d.]/g, "") === String(amount)) ||
        cells.some((text) => ascii(text).includes(String(amount))),
      cells.join(" | ").slice(0, 240)
    );

    check(`[${language}] no console error`, noisy.length === 0, noisy.slice(0, 2).join(" | "));

    await page.screenshot({
      path: `/root/.hermes/cache/scratch/expense-claim-payment-${language}.png`,
      fullPage: true,
    });
    await context.close();
  }
} finally {
  await browser.close();
}

console.log(`\n${passed}/${passed + failed} checks passed`);
process.exit(failed === 0 ? 0 : 1);
