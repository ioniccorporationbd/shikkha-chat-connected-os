/**
 * Ticket 0616 — the customer's chat box must read like the desk ticket.
 *
 * The desk thread is one sequence: oldest on top, newest at the bottom. The
 * portal receives the rows in the order the two channels were read (here the
 * payload is deliberately reversed, the shape a real merge produces), and one
 * message was stored twice — a send the browser retried landed on `Comment` and
 * on `Communication` three minutes apart. The chat box must still show:
 *
 *   1. every row, in time order (oldest first);
 *   2. the customer's own rows on the right, the employee's on the left;
 *   3. the retried message once, not twice;
 *   4. nothing else changed (no console errors).
 *
 *   node scripts/mock-frappe.mjs &
 *   FRAPPE_BASE_URL=http://127.0.0.1:8787 npx next start -p 3011 &
 *   E2E_BASE=http://localhost:3011 node scripts/hd-0616-order-e2e.mjs
 */
import { chromium } from "/root/arogga-UI/node_modules/playwright/index.mjs";
import fs from "node:fs";

const BASE = process.env.E2E_BASE ?? "http://localhost:3011";
const LOG = process.env.MOCK_LOG ?? "/tmp/mock_frappe.log";
const PASSWORD = process.env.MOCK_PASSWORD ?? "demo1234";
const EMAIL = process.env.E2E_EMAIL ?? "client@example.com";
const TICKET = process.env.E2E_TICKET ?? "0616";
const SECTION = process.env.E2E_SECTION ?? "clientDashboard";
const SHOT = process.env.SHOT ?? "/tmp/hd-0616-order.png";

// Chronological order the chat must read in, and who wrote each row. Another
// ticket passes its own thread via E2E_EXPECT (JSON array of {token, side}); the
// ticket under test says which single message must not read twice.
const EXPECTED = process.env.E2E_EXPECT
  ? JSON.parse(process.env.E2E_EXPECT)
  : [
      { token: "[0616-1]", side: "right" },
      { token: "[0616-2]", side: "left" },
      { token: "[0616-3]", side: "right" },
      { token: "[0616-4]", side: "left" },
    ];
const ONCE = process.env.E2E_ONCE ?? "[0616-3]";
const IMAGE = process.env.E2E_IMAGE ?? "";

const results = [];
const check = (name, ok, extra = "") => {
  results.push({ name, ok: !!ok });
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

/** Every rendered bubble row, with its position and side. */
const readRows = (tokens) =>
  ((tokens) => {
    const root = document.querySelector('[data-hd="thread"]');
    if (!root) return null;
    const rows = [];
    for (const token of tokens) {
      const hits = [];
      for (const el of root.querySelectorAll("div,p,span")) {
        if (!(el.textContent || "").includes(token)) continue;
        // A quote preview repeats an older message; the bubble is the row.
        if (el.closest("[data-hd-quote]")) continue;
        // The smallest element that still carries the text.
        const inner = Array.from(el.children).some((child) =>
          (child.textContent || "").includes(token)
        );
        if (inner) continue;
        hits.push(el);
      }
      let row = null;
      for (const hit of hits) {
        for (let node = hit; node && node !== root; node = node.parentElement) {
          const cls = node.className || "";
          if (typeof cls !== "string") continue;
          if (cls.includes("justify-end") || cls.includes("justify-start")) {
            const rect = node.getBoundingClientRect();
            row = {
              token,
              top: Math.round(rect.top),
              left: Math.round(rect.left),
              side: cls.includes("justify-end") ? "right" : "left",
            };
            break;
          }
        }
        if (row) break;
      }
      rows.push(row);
    }
    return rows;
  })(tokens);

const browser = await chromium.launch({ args: ["--no-sandbox"] });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 }, deviceScaleFactor: 2 });
  const consoleErrors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });

  await login(page);
  await page.waitForURL(new RegExp(SECTION), { timeout: 60000 });

  await page.goto(`${BASE}/${SECTION}/help-desk/tickets/${TICKET}`, {
    waitUntil: "domcontentloaded",
    timeout: 120000,
  });

  // The thread must be on screen before its order means anything.
  const tokens = EXPECTED.map((row) => row.token);
  let rows = null;
  for (let i = 0; i < 60; i += 1) {
    const text = await page.evaluate(() => document.body.innerText || "");
    if (tokens.every((token) => text.includes(token))) {
      rows = await page.evaluate(readRows, tokens);
      if (rows && rows.every(Boolean)) break;
    }
    await sleep(700);
  }

  check("every ticket message renders in the chat box", Boolean(rows) && rows.every(Boolean), JSON.stringify(rows));

  if (rows && rows.every(Boolean)) {
    const order = rows.map((row) => row.token).join(",");
    check(
      "the chat reads in time order, oldest on top",
      order === tokens.join(","),
      order
    );

    const sides = rows.map((row) => row.side);
    check(
      "customer's rows stay on the right, the employee's on the left",
      EXPECTED.every((want, index) => sides[index] === want.side),
      sides.join(",")
    );

    const duplicated = await page.evaluate(
      (token) => {
        const root = document.querySelector('[data-hd="thread"]');
        if (!root) return -1;
        // A row is the element whose own text carries the token and whose children
        // do not — i.e. the bubble, not the wrapper that repeats it. A quote
        // preview repeats an older message on purpose; it is not a second bubble.
        const rows = new Set();
        for (const el of root.querySelectorAll("div,p,span")) {
          if (!(el.textContent || "").includes(token)) continue;
          if (el.closest("[data-hd-quote]")) continue;
          if (Array.from(el.children).some((child) => (child.textContent || "").includes(token))) {
            continue;
          }
          for (let node = el; node && node !== root; node = node.parentElement) {
            const cls = typeof node.className === "string" ? node.className : "";
            if (!cls.includes("justify-end") && !cls.includes("justify-start")) continue;
            rows.add(node);
            break;
          }
        }
        return rows.size;
      },
      ONCE
    );
    check(`"${ONCE}" reads once, not twice`, duplicated === 1, String(duplicated));

    // A picture the customer or the employee sent must paint, not sit blank:
    // its bytes come through the portal proxy, which is the whole point of the
    // ticket-scoped streamer.
    if (IMAGE) {
      const needle = IMAGE.split("/").pop();
      const painted = await page.evaluate(async (name) => {
        for (let i = 0; i < 30; i += 1) {
          const img = [...document.querySelectorAll("img")].find((node) =>
            (node.currentSrc || node.src || "").includes(name)
          );
          if (img) {
            if (!img.naturalWidth) img.scrollIntoView({ block: "center" });
            if (img.naturalWidth > 0) return { found: true, width: img.naturalWidth };
          } else {
            const link = [...document.querySelectorAll("a")].find((node) =>
              (node.getAttribute("href") || "").includes(name)
            );
            if (link) return { found: true, width: -1 };
          }
          await new Promise((resolve) => setTimeout(resolve, 400));
        }
        return { found: false, width: 0 };
      }, needle);
      check("the sent picture paints in the chat box", painted.found, JSON.stringify(painted));
    }
  }

  await page.screenshot({ path: SHOT, fullPage: false });
  console.log(`screenshot ${SHOT}`);
  check("no new console errors", consoleErrors.length === 0, consoleErrors.slice(0, 2).join(" | "));
} finally {
  await browser.close();
}

const failed = results.filter((row) => !row.ok);
console.log();
console.log(failed.length ? `${results.length - failed.length}/${results.length} checks passed` : `${results.length}/${results.length} checks passed`);
if (failed.length) process.exit(1);
