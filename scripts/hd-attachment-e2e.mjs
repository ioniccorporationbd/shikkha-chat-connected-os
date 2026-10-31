/**
 * Attachment end-to-end proof: customer → ERP File → agent view.
 *
 * Runs against the local Next build wired to `scripts/mock-frappe.mjs`:
 *
 *   node scripts/mock-frappe.mjs &                         # terminal 1
 *   FRAPPE_BASE_URL=http://127.0.0.1:8787 npx next start -p 3011 &  # terminal 2
 *   node scripts/hd-attachment-e2e.mjs                     # terminal 3
 *
 * Legs:
 *   A. customer picks an image on the New Ticket form (thumbnail + honest copy),
 *      submits, and the success card lists what actually landed;
 *   B. the `File` row itself says attached_to_doctype="HD Ticket" and
 *      attached_to_name=<the just-created ticket> — and nothing points at 0529;
 *   C. the ticket's image is visible to the customer on the detail page and to
 *      the support agent (separate login) in the ticket conversation, where it
 *      opens full-size.
 */
import { chromium } from "/root/arogga-UI/node_modules/playwright/index.mjs";
import fs from "node:fs";

const BASE = process.env.E2E_BASE ?? "http://127.0.0.1:3011";
const MOCK = process.env.MOCK_BASE ?? "http://127.0.0.1:8787";
const LOG = process.env.MOCK_LOG ?? "/tmp/mock_frappe.log";
const PASSWORD = process.env.MOCK_PASSWORD ?? "demo1234";
const PIC = process.env.PIC ?? "/tmp/hd13_pic.png";
const PIC_NAME = PIC.split("/").pop();
const PIC_RE = new RegExp(PIC_NAME.replace(/\./g, "\\."));
const REFERENCE_TICKET = "0529"; // screenshot reference only — never a target

const results = [];
const check = (name, ok, extra = "") => {
  results.push({ name, ok: !!ok });
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${extra ? ` :: ${extra}` : ""}`);
};
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function latestOtp(email) {
  const matches = [...fs.readFileSync(LOG, "utf8").matchAll(new RegExp(`LOGIN OTP ${email.replace(/\./g, "\\.")} = (\\d{6})`, "g"))];
  return matches.length ? matches[matches.length - 1][1] : null;
}

async function login(page, email) {
  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded", timeout: 120000 });
  await page.fill("input[name=username]", email);
  await page.fill("input[type=password]", PASSWORD);
  await page.click("button[type=submit]");
  const box = page.locator("input[inputmode=numeric]").first();
  await box.waitFor({ timeout: 30000 });
  let code = null;
  for (let i = 0; i < 60 && !code; i += 1) {
    code = latestOtp(email);
    if (!code) await sleep(250);
  }
  if (!code) throw new Error(`no OTP logged for ${email}`);
  await box.click();
  await page.keyboard.type(code, { delay: 60 });
  await sleep(700);
  await page.locator("button[type=submit]").last().click();
}

async function mockFiles() {
  const response = await fetch(`${MOCK}/__mock/files`);
  const { files } = await response.json();
  return files;
}

const browser = await chromium.launch({ args: ["--no-sandbox"] });
try {
  // ------------------------------------------------------------------ leg A
  const customer = await browser.newPage({ viewport: { width: 1600, height: 1150 }, deviceScaleFactor: 2 });
  await login(customer, "client@example.com");
  await customer.waitForURL(/clientDashboard/, { timeout: 60000 });

  await customer.goto(`${BASE}/clientDashboard/help-desk/new`, { waitUntil: "domcontentloaded", timeout: 120000 });
  await customer.waitForSelector("#hd-name", { timeout: 60000 });
  await sleep(1200);

  const pick = async (host, label) => {
    await customer.evaluate(
      ([selector, text]) => {
        const root = document.querySelector(selector);
        const buttons = [...root.querySelectorAll("button")];
        (buttons.find((b) => (b.textContent || "").includes(text)) || buttons[buttons.length - 1]).click();
      },
      [host, label],
    );
    await sleep(1000);
  };

  await customer.fill("#hd-name", "Nusrat Jahan");
  await customer.fill("#hd-email", "nusrat@example.com");
  await customer.fill("#hd-mobile", "01712345678");
  await sleep(600);
  await customer.locator("[role=checkbox]").first().click();
  await sleep(900);
  const runTag = `HD14-${Date.now().toString().slice(-6)}`;
  await customer.fill("#hd-subject", `Attachment delivery check ${runTag}`);
  await sleep(1200);
  await pick("#hd-step-category", "টেকনিক্যাল");
  await pick("#hd-step-priority", "উচ্চ");
  await pick("#hd-step-department", "Support");
  await customer.fill("#hd-description", "One real screenshot rides along so the agent attachment view can be checked end to end.");
  await sleep(800);

  await customer.locator("input[type=file]").first().setInputFiles(PIC);
  await sleep(1800);
  const preview = await customer.evaluate((name) => ({
    thumbs: [...document.querySelectorAll("img")].filter((img) => /blob:|data:image/.test(img.src) && img.getBoundingClientRect().width > 25).length,
    named: new RegExp(name.replace(/\./g, "\\.")).test(document.body.innerText),
  }), PIC_NAME);
  check("customer sees a thumbnail before submitting", preview.thumbs >= 1 && preview.named, JSON.stringify(preview));

  const before = fs.readFileSync(LOG, "utf8").length;
  await customer.locator("button[type=submit]").last().click();
  await sleep(8000);
  const submitLog = fs.readFileSync(LOG, "utf8").slice(before);
  const createdId = (submitLog.match(/HD TICKET (HD-\d{4}-\d{5})/) || [])[1] ?? null;
  check("upload hit the ERP", new RegExp(`HD UPLOAD ${PIC_NAME.replace(/\./g, "\\.")}`).test(submitLog));
  check("ticket created carrying the file", /files=1/.test(submitLog) && Boolean(createdId), createdId ?? "no id");

  const successText = await customer.evaluate(() => document.body.innerText.replace(/\n+/g, " | "));
  check(
    "success card lists the attachment that landed",
    /সংযুক্তি|Attachments/i.test(successText) && PIC_RE.test(successText),
    successText.slice(0, 160),
  );
  await customer.screenshot({ path: "/tmp/hd14_success.png", timeout: 60000 });

  // ------------------------------------------------------------------ leg B
  if (createdId) {
    const files = await mockFiles();
    const mine = files.filter((row) => row.attached_to_name === createdId);
    check("File row maps to HD Ticket", mine.length === 1 && mine[0].attached_to_doctype === "HD Ticket", JSON.stringify(mine[0] ?? null));
    check("File row names the created ticket", mine[0]?.attached_to_name === createdId, `${mine[0]?.attached_to_name} vs ${createdId}`);
    const wrong = files.filter((row) => String(row.attached_to_name ?? "").includes(REFERENCE_TICKET));
    check("no upload was attached to reference ticket 0529", wrong.length === 0, JSON.stringify(wrong));
  }

  // ------------------------------------------------------------------ customer detail
  if (createdId) {
    await customer.goto(`${BASE}/clientDashboard/help-desk/tickets/${createdId}`, { waitUntil: "domcontentloaded", timeout: 120000 });
    await sleep(4500);
    const detail = await customer.evaluate((name) => {
      const pattern = new RegExp(name.replace(/\./g, "\\."));
      return {
        images: [...document.querySelectorAll("img")].map((img) => img.getAttribute("src") || "").filter((src) => /files?[=/]|private/.test(src)),
        chips: [...document.querySelectorAll("a,button")].filter((el) => pattern.test(el.textContent || "")).length,
      };
    }, PIC_NAME);
    check("customer detail page shows the attached image", detail.images.length >= 1 || detail.chips >= 1, JSON.stringify(detail).slice(0, 200));
    if (detail.images[0]) {
      const response = await customer.request.get(detail.images[0].startsWith("http") ? detail.images[0] : BASE + detail.images[0]);
      check("attached file streams back (private file served to the owner)", response.status() === 200, `${response.status()}`);
    }
    await customer.screenshot({ path: "/tmp/hd14_customer_detail.png", timeout: 60000 });
  }

  // ------------------------------------------------------------------ leg C: agent
  const agent = await browser.newPage({ viewport: { width: 1600, height: 1150 }, deviceScaleFactor: 2 });
  await login(agent, "tamim@ioniccorporation.com");
  await agent.waitForURL(/userDashboard/, { timeout: 60000 });

  await agent.goto(`${BASE}/userDashboard/help-desk/tickets/${createdId}`, { waitUntil: "domcontentloaded", timeout: 120000 });
  await sleep(5000);
  const agentView = await agent.evaluate((name) => {
    const images = [...document.querySelectorAll("img")]
      .filter((img) => /files?[=/]|private/.test(img.getAttribute("src") || ""))
      .map((img) => ({ src: img.getAttribute("src"), w: Math.round(img.getBoundingClientRect().width), h: Math.round(img.getBoundingClientRect().height) }));
    return {
      images,
      named: new RegExp(name.replace(/\./g, "\\.")).test(document.body.innerText),
      ticketShown: /HD-\d{4}-\d{5}/.test(document.body.innerText),
    };
  }, PIC_NAME);
  check("agent opens the created ticket", agentView.ticketShown, JSON.stringify({ ticketShown: agentView.ticketShown }));
  check("agent sees the attachment itself, not just a filename", agentView.images.length >= 1, JSON.stringify(agentView.images).slice(0, 240));

  if (agentView.images.length >= 1) {
    const loaded = await agent.evaluate(() => {
      const img = [...document.querySelectorAll("img")].find((el) => /files?[=/]|private/.test(el.getAttribute("src") || ""));
      return img ? { complete: img.complete, w: img.naturalWidth, h: img.naturalHeight } : null;
    });
    check("agent image actually decodes", Boolean(loaded && loaded.complete && loaded.w > 0 && loaded.h > 0), JSON.stringify(loaded));

    // Open it full-size the way the agent would.
    await agent.evaluate(() => {
      const img = [...document.querySelectorAll("img")].find((el) => /files?[=/]|private/.test(el.getAttribute("src") || ""));
      (img?.closest("button") || img)?.click();
    });
    await sleep(1500);
    const lightbox = await agent.evaluate(() => {
      const dialogs = [...document.querySelectorAll("[role=dialog],div[class*='fixed']")];
      const shown = dialogs.filter((el) => el.getBoundingClientRect().width > 300 && el.querySelector("img"));
      return shown.length;
    });
    check("agent can open the image full-size", lightbox >= 1, `lightboxes=${lightbox}`);
    await agent.screenshot({ path: "/tmp/hd14_agent_lightbox.png", timeout: 60000 });
    await agent.keyboard.press("Escape");
    await sleep(900);
  }

  // Final mapping re-check after the agent looked at it.
  if (createdId) {
    const files = await mockFiles();
    const mine = files.filter((row) => row.attached_to_name === createdId);
    check("mapping unchanged after the agent opened the ticket", mine.length === 1 && mine[0].attached_to_doctype === "HD Ticket");
  }
  await agent.screenshot({ path: "/tmp/hd14_agent_conversation.png", timeout: 60000 });
} finally {
  await browser.close();
}

const pass = results.filter((row) => row.ok).length;
console.log(`\nATTACHMENT E2E ${pass}/${results.length}`);
fs.writeFileSync("/tmp/hd14_results.json", JSON.stringify({ pass, total: results.length, fails: results.filter((row) => !row.ok) }, null, 2));
if (pass !== results.length) process.exitCode = 1;
