#!/usr/bin/env node
/**
 * "Create Customer" also leaves a Desk login behind.
 *
 * The requirement: on `/userDashboard/create-customer/new`, one click on the
 * **Create Customer** button must create the Customer *and* a `User` in
 * `/desk/system/user` whose `email` is the customer's e-mail, `first_name` the
 * customer's name and `mobile_no` the customer's mobile — without disturbing
 * the existing create flow or anyone's login.
 *
 * Three shapes are proven against the mock ERP (the mock mirrors
 * `_provision_portal_user` in shikkha_os/api/v1/customer.py):
 *
 *   E2E_MODE=created  (default) a fresh customer -> login created, the row is
 *                     really in the mock's User table with the right identity,
 *                     and the confirmation card shows both facts.
 *   E2E_MODE=exists   an e-mail that already has a login -> the login is reused
 *                     untouched (no duplicate, no overwrite) and the card says so.
 *   E2E_MODE=failure  the login cannot be created -> the CUSTOMER is still
 *                     created (success card intact) and the failure is reported
 *                     to the browser console + ERP Error Log endpoint.
 *
 *   node scripts/mock-frappe.mjs &
 *   FRAPPE_BASE_URL=http://127.0.0.1:8787 npx next start -p 3011 &
 *   E2E_BASE=http://localhost:3011 E2E_MODE=created node scripts/customer-create-user-e2e.mjs
 */
import { chromium } from "/root/arogga-UI/node_modules/playwright/index.mjs";
import fs from "node:fs";

const BASE = process.env.E2E_BASE ?? "http://localhost:3000";
const MOCK_BASE = process.env.MOCK_BASE ?? "http://127.0.0.1:8787";
const LOG = process.env.MOCK_LOG ?? "/tmp/mock_frappe.log";
const PASSWORD = process.env.MOCK_PASSWORD ?? "demo1234";
/** The demo operator: a staff (System) user allowed to create Customers. */
const EMAIL = process.env.E2E_STAFF ?? "tamim@ioniccorporation.com";
/** An e-mail that already owns a User row in the mock (exists-mode fixture). */
const EXISTING_EMAIL = process.env.E2E_EXISTING_EMAIL ?? "client@example.com";
const MODE = ["created", "exists", "failure"].includes(process.env.E2E_MODE ?? "")
  ? process.env.E2E_MODE
  : "created";
/** 390 proves the card at phone width; 1280 is the desk default. */
const WIDTH = Number(process.env.E2E_WIDTH ?? 1280);

const stamp = Date.now().toString().slice(-7);
const CUSTOMER_NAME = process.env.E2E_CUSTOMER_NAME ?? `Login Check Co ${stamp}`;
const CUSTOMER_EMAIL =
  process.env.E2E_CUSTOMER_EMAIL ??
  (MODE === "exists" ? EXISTING_EMAIL : `login-check-${stamp}@example.com`);
const CUSTOMER_MOBILE = process.env.E2E_CUSTOMER_MOBILE ?? "01711122334";

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

/** Dev-only control methods go straight to the mock, like `mock.hd.push`. */
async function mockControl(method, body = {}) {
  const response = await fetch(`${MOCK_BASE}/api/method/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload = await response.json().catch(() => ({}));
  return payload?.message ?? payload ?? {};
}

/** Read the mock's User table — the local stand-in for `/desk/system/user`. */
async function mockUsers() {
  // The mock wraps every answer as {message: {api, ok, data}}.
  const payload = await mockControl("mock.users.list");
  return payload?.data?.users ?? payload?.users ?? [];
}

async function setMockFail(fail) {
  await mockControl("mock.users.fail", { fail });
}

/** Customers created via `customer.create`, including their `portal_users`. */
async function mockCustomers() {
  const payload = await mockControl("mock.customers.list");
  return payload?.data?.customers ?? payload?.customers ?? [];
}

const browser = await chromium.launch({
  args: ["--no-sandbox"],
  executablePath:
    process.env.PW_CHROME || "/root/.cache/ms-playwright/chromium-1254/chrome-linux64/chrome",
});
try {
  const context = await browser.newContext({ viewport: { width: WIDTH, height: 1000 } });
  const page = await context.newPage();
  await login(page);
  await page.waitForURL(/Dashboard/, { timeout: 60000 });

  // Failure mode is a mock-side switch, not a code path the UI can pick.
  await setMockFail(MODE === "failure");

  const consoleErrors = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  const reports = [];
  page.on("request", (request) => {
    if (request.url().includes("/api/log/client-error")) reports.push(`${request.method()} ${request.url()}`);
  });

  await page.goto(`${BASE}/userDashboard/create-customer/new`, {
    waitUntil: "domcontentloaded",
    timeout: 120000,
  });

  const nameInput = page.locator("#cc-input-customer_name");
  await nameInput.waitFor({ timeout: 60000 });
  await nameInput.fill(CUSTOMER_NAME);
  await page.locator("#cc-input-email_id").fill(CUSTOMER_EMAIL);
  await page.locator("#cc-input-mobile_no").fill(CUSTOMER_MOBILE);

  await page.locator("button[type=submit]").last().click();

  // The success card is the existing flow's proof that the Customer was made —
  // in every mode, including the one where the login fails.
  await page.locator("[data-customer-login]").first().waitFor({ timeout: 60000 });
  const cardText = await page.locator("body").innerText();
  const loginRow = await page
    .locator(`text=${CUSTOMER_EMAIL}`)
    .first()
    .isVisible()
    .catch(() => false);

  check(
    "the customer itself was created (success card, not an error toast)",
    /Customer created successfully|কাস্টমার সফলভাবে তৈরি হয়েছে/.test(cardText),
    cardText.slice(0, 160)
  );
  check("the confirmation names the login identity", loginRow, CUSTOMER_EMAIL);

  const badge = (kind) => page.locator(`[data-customer-login="${kind}"]`).first();

  if (MODE === "failure") {
    check("the login failure is shown on the card", await badge("error").isVisible());
    check(
      "no 'login created' badge is claimed",
      (await badge("created").count()) === 0
    );

    const users = await mockUsers();
    check(
      "no User row was left behind by the failed provisioning",
      !users.some((user) => user.email === CUSTOMER_EMAIL),
      JSON.stringify(users)
    );

    const customers = await mockCustomers();
    const customer = customers.find((entry) => entry.customer_name === CUSTOMER_NAME);
    check(
      "the Customer carries no portal_users row when provisioning failed",
      Array.isArray(customer?.portal_users) && customer.portal_users.length === 0,
      JSON.stringify(customer)
    );

    // Console + Error Log: the reporter is fire-and-forget, so poll briefly.
    const sawReport = async () => {
      for (let i = 0; i < 40; i += 1) {
        // The reporter uses `navigator.sendBeacon`, so the body is not readable
        // here — a POST to the Error Log endpoint is the observable proof; the
        // scope tag is asserted through the console line right below.
        if (reports.some((entry) => entry.startsWith("POST"))) return true;
        await sleep(250);
      }
      return false;
    };
    check("the failure is reported to the ERP Error Log endpoint", await sawReport(), reports.join(" | ").slice(0, 200));
    check(
      "the failure is also on the browser console",
      consoleErrors.some((line) => line.includes("customer:create-user")),
      consoleErrors.join(" | ").slice(0, 200)
    );
  } else if (MODE === "exists") {
    check("an existing login is reported as reused", await badge("exists").isVisible());
    check("nothing claims a new login", (await badge("created").count()) === 0);

    const users = await mockUsers();
    check(
      "no duplicate User row was created for that e-mail",
      users.filter((user) => user.email === EXISTING_EMAIL).length === 0,
      JSON.stringify(users)
    );

    const customers = await mockCustomers();
    const customer = customers.find((entry) => entry.customer_name === CUSTOMER_NAME);
    check(
      "the Customer still links portal_users to that existing login",
      Array.isArray(customer?.portal_users) && customer.portal_users.includes(EXISTING_EMAIL),
      JSON.stringify(customer)
    );
  } else {
    check("the login is reported as created", await badge("created").isVisible());

    const users = await mockUsers();
    const row = users.find((user) => user.email === CUSTOMER_EMAIL);
    check("the User row is really in the mock's User table", Boolean(row), JSON.stringify(users));
    check(
      "the email field is the customer's e-mail",
      row?.email === CUSTOMER_EMAIL,
      JSON.stringify(row)
    );
    check(
      "first_name is the customer's name",
      row?.first_name === CUSTOMER_NAME.replace(/\s+/g, " ").trim(),
      JSON.stringify(row)
    );
    check(
      "mobile_no is the customer's mobile",
      row?.mobile_no === CUSTOMER_MOBILE,
      JSON.stringify(row)
    );
    check("the login is a Website User (portal, not desk)", row?.user_type === "Website User", JSON.stringify(row));
    check(
      "role_profiles carries Customer",
      Array.isArray(row?.role_profiles) && row.role_profiles.includes("Customer"),
      JSON.stringify(row)
    );
    check(
      "full_name is the customer's name",
      row?.full_name === CUSTOMER_NAME.replace(/\s+/g, " ").trim(),
      JSON.stringify(row)
    );

    const customers = await mockCustomers();
    const customer = customers.find((entry) => entry.customer_name === CUSTOMER_NAME);
    check(
      "the Customer's portal_users points at the new login",
      Array.isArray(customer?.portal_users) && customer.portal_users.includes(CUSTOMER_EMAIL),
      JSON.stringify(customer)
    );
    check(
      "the card shows the Role profile row",
      /Role profile|রোল প্রোফাইল/.test(cardText),
      cardText.slice(0, 240)
    );
  }

  // The create flow must still end where it always did: the card offers
  // "another" and the dashboard link is intact.
  check(
    "the success card still offers the normal next steps",
    /create another|আরেকটি তৈরি করুন|Dashboard|ড্যাশবোর্ড/i.test(cardText),
    cardText.slice(0, 200)
  );

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth
  );
  check(`no horizontal overflow at ${WIDTH}px`, overflow <= 0, `overflow=${overflow}px`);

  await page.screenshot({ path: `/tmp/customer-user-${MODE}-${WIDTH}.png`, fullPage: false });
  console.log(`screenshot /tmp/customer-user-${MODE}-${WIDTH}.png`);
} finally {
  await browser.close();
}

console.log(`\n${passed}/${passed + failed} checks passed (mode=${MODE})`);
process.exit(failed === 0 && passed > 0 ? 0 : 1);
