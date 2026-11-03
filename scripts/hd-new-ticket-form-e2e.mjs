#!/usr/bin/env node
/**
 * New-ticket form — contact step contract (both dashboards).
 *
 * What it proves, on a built portal and the mock ERP:
 *   1. আপনার নাম comes first and is read-only (it is the signed-in profile);
 *   2. যোগাযোগের পছন্দের মাধ্যম sits directly beneath the name — above ইমেইল
 *      and মোবাইল নম্বর, which share the row below;
 *   3. ইমেইল is read-only too;
 *   4. মোবাইল নম্বর is editable and keeps digits only (typed "01a2-3 4b5+6"
 *      lands as "0123456"), and a short number keeps step 2 closed while an
 *      11-digit one opens it;
 *   5. the whole form still creates a ticket (client role).
 *
 * Usage:
 *   E2E_BASE=http://localhost:3011 E2E_ROLE=client node scripts/hd-new-ticket-form-e2e.mjs
 *   E2E_BASE=http://localhost:3011 E2E_ROLE=staff  node scripts/hd-new-ticket-form-e2e.mjs
 *
 * Needs: `node scripts/mock-frappe.mjs` on 127.0.0.1:8787 (writes LOGIN OTP lines
 * to /tmp/mock_frappe.log) and a `next start` portal pointed at it.
 */
import { chromium } from "/root/arogga-UI/node_modules/playwright/index.mjs";
import fs from "node:fs";

const BASE = process.env.E2E_BASE ?? "http://localhost:3011";
const ROLE = process.env.E2E_ROLE ?? "client";
const LOG = process.env.MOCK_LOG ?? "/tmp/mock_frappe.log";
const SHOT = process.env.SHOT ?? `/tmp/hd-new-ticket-${ROLE}.png`;

// Staff addresses are read from the mock's own seed table, so a spelling drift in
// one file cannot fake a login failure again (it did once: "ionicorporation").
const MOCK_SRC = new URL("../scripts/mock-frappe.mjs", import.meta.url).pathname;
const STAFF_EMAIL =
  [...fs.readFileSync(MOCK_SRC, "utf8").matchAll(/^\s{2}"([^"\s]+@[^"\s]+)": \{/gm)]
    .map((m) => m[1])
    .find((email) => email.startsWith("tamim")) ?? "tamim@ionicorporation.com";

const EMAIL = ROLE === "staff" ? STAFF_EMAIL : "client@example.com";
const PASSWORD = "demo1234";
const NEW_URL = `${BASE}/${ROLE === "staff" ? "userDashboard" : "clientDashboard"}/help-desk/new`;

let fails = 0;
const check = (name, ok, extra) => {
  if (ok) console.log("PASS", name);
  else {
    fails += 1;
    console.log("FAIL", name, extra ?? "");
  }
};

const browser = await chromium.launch({ args: ["--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 1360, height: 1100 } });
const consoleErrors = [];
page.on("console", (m) => {
  if (m.type() === "error") consoleErrors.push(m.text());
});

// --- sign in (password, then the OTP the mock prints to its log) -------------
await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
await page.fill("input[name=username]", EMAIL);
await page.fill("input[type=password]", PASSWORD);
await page.click("button[type=submit]");

const otpBox = page.locator("input[inputmode=numeric]").first();
await otpBox.waitFor({ timeout: 30000 });
let otp = null;
for (let i = 0; i < 80 && !otp; i += 1) {
  const hits = [
    ...fs.readFileSync(LOG, "utf8").matchAll(new RegExp(`LOGIN OTP ${EMAIL.replace(/\./g, "\\.")} = (\\d{6})`, "g")),
  ];
  otp = hits.length ? hits[hits.length - 1][1] : null;
  if (!otp) await new Promise((r) => setTimeout(r, 250));
}
await otpBox.click();
await page.keyboard.type(otp, { delay: 40 });
await new Promise((r) => setTimeout(r, 600));
await page.locator("button[type=submit]").last().click();
await page.waitForURL(/Dashboard|dashboard/, { timeout: 60000 });

await page.goto(NEW_URL, { waitUntil: "domcontentloaded" });
await page.locator("#hd-mobile").waitFor({ timeout: 60000 });
await new Promise((r) => setTimeout(r, 1000));

// --- 1. the order and the lock state ---------------------------------------
const layout = await page.evaluate(() => {
  const byId = (id) => document.getElementById(id);
  const name = byId("hd-name");
  const email = byId("hd-email");
  const mobile = byId("hd-mobile");
  const group = [...document.querySelectorAll("[role=group]")].find((n) =>
    /মাধ্যম|contact method/i.test(n.getAttribute("aria-label") || ""),
  );
  const top = (n) => (n ? n.getBoundingClientRect().top : null);
  return {
    name: { readOnly: name.readOnly, value: name.value, top: top(name) },
    email: { readOnly: email.readOnly, value: email.value, top: top(email) },
    mobile: { readOnly: mobile.readOnly, value: mobile.value, top: top(mobile), inputMode: mobile.getAttribute("inputmode") },
    groupTop: top(group),
    labels: ["hd-name", "hd-email", "hd-mobile"].map((id) => byId(id).closest("label")?.innerText.split("\n")[0]),
  };
});

check("name field is read-only", layout.name.readOnly === true);
check("email field is read-only", layout.email.readOnly === true);
check("mobile field stays editable", layout.mobile.readOnly === false);
check("name is filled from the profile", layout.name.value.trim().length > 0, layout.name.value);
check("email is filled from the profile", /.+@.+/.test(layout.email.value), layout.email.value);
check("mobile is a numeric field", layout.mobile.inputMode === "numeric", layout.mobile.inputMode);
check(
  "the channel picker sits below the name field",
  layout.groupTop !== null && layout.groupTop > layout.name.top,
  `name.top=${layout.name.top} group.top=${layout.groupTop}`,
);
check(
  "the channel picker sits above email and mobile",
  layout.groupTop < layout.email.top && layout.groupTop < layout.mobile.top,
  `group.top=${layout.groupTop} email.top=${layout.email.top} mobile.top=${layout.mobile.top}`,
);

// --- 2. mobile keeps digits only and gates the next step -------------------
await page.fill("#hd-mobile", "");
await page.locator("#hd-mobile").click();
await page.keyboard.type("01a2-3 4b5+6", { delay: 30 });
const typed = await page.inputValue("#hd-mobile");
check("mobile keeps digits only", typed === "0123456", `value=${JSON.stringify(typed)}`);

await page.locator("[role=group]").first().getByRole("checkbox").first().click();
await new Promise((r) => setTimeout(r, 300));
check("a short mobile keeps step 2 closed", (await page.locator("#hd-subject").count()) === 0);
await page.fill("#hd-mobile", "01712345678");
await new Promise((r) => setTimeout(r, 500));
check("an 11-digit mobile opens step 2", (await page.locator("#hd-subject").count()) === 1);

await page.screenshot({ path: SHOT });

if (ROLE === "client") {
  // --- 3. the form still creates a ticket ----------------------------------
  const pick = async (stepId) => {
    const box = page.locator(`#${stepId} button[role=combobox]`).first();
    await box.scrollIntoViewIfNeeded();
    await box.focus();
    await box.press("Enter");
    await new Promise((r) => setTimeout(r, 250));
    await page.locator(`#${stepId} button[role=option]`).first().click({ force: true });
    await new Promise((r) => setTimeout(r, 400));
  };
  await page.fill("#hd-subject", "আমার টিকিট তৈরি হয় না");
  await pick("hd-step-category");
  await pick("hd-step-priority");
  await pick("hd-step-department");
  await page.fill("#hd-description", "টিকিট জমা দিতে গেলে ফর্ম আটকে যায়, ধাপ ৬ পর্যন্ত পৌঁছায় না। অনুগ্রহ করে দেখুন।");
  await new Promise((r) => setTimeout(r, 500));
  await page.locator("button[type=submit]").last().click();
  await new Promise((r) => setTimeout(r, 2500));
  const body = await page.locator("body").innerText();
  check("the form still creates the ticket", /টিকিট সফলভাবে তৈরি হয়েছে/.test(body), page.url());
  check("the confirmation names a ticket id", /টিকিট আইডি/.test(body));
  await page.screenshot({ path: SHOT.replace(/\.png$/, "-created.png") });
}

check("no console errors on the form", consoleErrors.length === 0, consoleErrors.slice(0, 2).join(" | "));
console.log(fails === 0 ? "\nALL PASS" : `\n${fails} FAILED`);
await browser.close();
process.exit(fails === 0 ? 0 : 1);
