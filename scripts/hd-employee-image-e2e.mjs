/**
 * Employee image (employee "sign" picture) end-to-end proof.
 *
 * The live ticket https://dash.shikkhachat.com/helpdesk/tickets/0583 carries an
 * employee image that the customer could not see in the portal: the picture is
 * a *private* File on an agent-side row (Comment), so Frappe answers 403 to a
 * customer session. This script proves the fix on the customer panel:
 *
 *   node scripts/mock-frappe.mjs &                                  # terminal 1
 *   FRAPPE_BASE_URL=http://127.0.0.1:8787 npx next dev -p 3000 &    # terminal 2
 *   node scripts/hd-employee-image-e2e.mjs                          # terminal 3
 *
 * Legs:
 *   1. the direct file GET is refused (403) — the bug as it happens today;
 *   2. the portal proxy answers 200 with image bytes (ticket-scoped streamer);
 *   3. the picture renders in the conversation (naturalWidth > 0);
 *   4. the reply text is still there — nothing else about the thread changed.
 */
import { chromium } from "/root/arogga-UI/node_modules/playwright/index.mjs";
import fs from "node:fs";

const BASE = process.env.E2E_BASE ?? "http://localhost:3000";
const MOCK = process.env.MOCK_BASE ?? "http://127.0.0.1:8787";
const LOG = process.env.MOCK_LOG ?? "/tmp/mock_frappe.log";
const PASSWORD = process.env.MOCK_PASSWORD ?? "demo1234";
const EMAIL = process.env.E2E_EMAIL ?? "client@example.com";
const TICKET = process.env.E2E_TICKET ?? "0583";
const IMAGE = process.env.E2E_IMAGE ?? "/private/files/hd-0583-employee-sign.png";
const NEEDLE_TEXT = process.env.E2E_TEXT ?? "এমপ্লয়ি সাইন";
const SECTION = process.env.E2E_SECTION ?? "clientDashboard";
const AGENT = process.env.E2E_AGENT ?? "MD Shahzalal Amin Surker";
const DOC_NAME = process.env.E2E_DOC_NAME ?? "";

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

  // The reply text must be on screen before we look for the picture.
  const replyText = await (async () => {
    for (let i = 0; i < 60; i += 1) {
      const text = await page.evaluate(() => document.body.innerText || "");
      if (text.includes(NEEDLE_TEXT)) return true;
      await sleep(700);
    }
    return false;
  })();
  check("reply text rendered in the customer thread", replyText);

  // The header is shaped from the conversation payload, so a column their meta
  // hides must not blank the Submitted stamp / assignee (help-desk:ticket-meta).
  const pageText = await page.evaluate(() => document.body.innerText || "");
  check(
    "ticket header keeps its Submitted stamp",
    /(?:[0-9০-৯]{1,4}[/.-]){2}[0-9০-৯]{2,4}/.test(pageText),
    pageText.slice(0, 140)
  );
  check("ticket header names the assigned employee", pageText.includes(AGENT), AGENT);

  // Leg 1 — the bug: the direct file GET is refused for the customer session.
  // Fetched off-origin against the ERP mock, exactly as the portal's server-side
  // proxy would ask for it.
  const direct = await page.request.get(`${MOCK}${IMAGE}`);
  check("direct private-file GET is refused (403)", direct.status() === 403, `status=${direct.status()}`);

  // Leg 2 — the fix: the portal proxy answers with the bytes.
  const proxied = await page.evaluate(async (image) => {
    const res = await fetch(`/api/help-desk/files?url=${encodeURIComponent(image)}`, { cache: "no-store" });
    const blob = await res.blob();
    return { status: res.status, type: res.headers.get("content-type"), size: blob.size };
  }, IMAGE);
  check(
    "portal proxy streams the image",
    proxied.status === 200 && (proxied.type || "").startsWith("image/") && proxied.size > 0,
    `status=${proxied.status} type=${proxied.type} size=${proxied.size}`
  );

  // Leg 3 — the picture actually paints in the conversation.
  let rendered = { found: false, naturalWidth: 0, src: "" };
  for (let i = 0; i < 40; i += 1) {
    rendered = await page.evaluate((image) => {
      const needle = image.split("/").pop();
      const img = [...document.querySelectorAll("img")].find((node) => (node.currentSrc || node.src || "").includes(needle));
      if (!img) return { found: false, naturalWidth: 0, src: "" };
      return { found: true, naturalWidth: img.naturalWidth || 0, src: img.currentSrc || img.src, complete: img.complete };
    }, IMAGE);
    if (rendered.found && rendered.naturalWidth > 0) break;
    await sleep(500);
  }
  check(
    "employee image paints in the thread",
    rendered.found && rendered.naturalWidth > 0,
    `naturalWidth=${rendered.naturalWidth}`
  );

  if (DOC_NAME) {
    // A document the employee sent (no thumbnail to paint): it must arrive as a
    // downloadable row, streamed through the portal proxy like the image.
    let doc = { found: false, href: "" };
    for (let i = 0; i < 20; i += 1) {
      doc = await page.evaluate((name) => {
        const link = [...document.querySelectorAll("a")].find((node) => (node.textContent || "").includes(name));
        return { found: Boolean(link), href: link ? link.getAttribute("href") || "" : "" };
      }, DOC_NAME);
      if (doc.found) break;
      await sleep(300);
    }
    check("employee document renders as a file row", doc.found, DOC_NAME);
    check("the document row goes through the portal proxy", doc.href.includes("/api/help-desk/files"), doc.href);
  }

  const shot = process.env.SHOT ?? "/tmp/hd-employee-sign.png";
  await page.screenshot({ path: shot, fullPage: false });
  console.log(`screenshot ${shot}`);

  const noisy = consoleErrors.filter(
    (line) => !/favicon|hydrat|Failed to load resource/i.test(line) && !/client-error:help-desk:realtime/.test(line)
  );
  check("no new console errors", noisy.length === 0, noisy.slice(0, 2).join(" | "));
} finally {
  await browser.close();
}

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length ? 1 : 0);
