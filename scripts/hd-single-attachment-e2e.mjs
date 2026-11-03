/**
 * One picture, one attachment.
 *
 * The helpdesk app copies a message's file onto the ticket's own attachment tray,
 * so a single upload can leave two File rows with the same file_url. This suite
 * turns that duplication on in the mock and proves the portal still shows the
 * customer's single screenshot as exactly one attachment — on the success card
 * and on the ticket detail payload — for the customer flow and, via the reply
 * endpoint, for the employee flow.
 */
import { chromium } from "/root/arogga-UI/node_modules/playwright/index.mjs";
import fs from "node:fs";

const BASE = process.env.E2E_BASE ?? "http://localhost:3011";
const MOCK = process.env.MOCK_BASE ?? "http://127.0.0.1:8787";
const LOG = process.env.MOCK_LOG ?? "/tmp/mock_frappe.log";
const PASSWORD = "demo1234";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const results = [];
function check(label, ok, detail = "") {
  results.push({ label, ok: Boolean(ok) });
  console.log(`${ok ? "PASS" : "FAIL"} ${label}${detail ? ` — ${detail}` : ""}`);
}

function latestOtp(email) {
  try {
    const lines = fs
      .readFileSync(LOG, "utf8")
      .split("\n")
      .filter((line) => line.includes(`LOGIN OTP ${email}`));
    const last = lines.at(-1);
    return last ? last.trim().split("=").pop().trim() : null;
  } catch {
    return null;
  }
}

async function login(page, email) {
  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded", timeout: 120000 });
  await page.fill("input[name=username]", email);
  await page.fill("input[type=password]", PASSWORD);
  await page.click("button[type=submit]");
  const box = page.locator("input[inputmode=numeric]").first();
  await box.waitFor({ timeout: 30000 });
  let code = null;
  for (let i = 0; i < 80 && !code; i += 1) {
    code = latestOtp(email);
    if (!code) await sleep(250);
  }
  if (!code) throw new Error(`no OTP logged for ${email}`);
  await box.click();
  await page.keyboard.type(code, { delay: 40 });
  await sleep(700);
  await page.locator("button[type=submit]").last().click();
  await page.waitForURL(/dashboard/i, { timeout: 60000 }).catch(() => {});
}

const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFAAH/q842iQAAAABJRU5ErkJggg==",
  "base64"
);
const FILE_NAME = "Screenshot (18).png";

const browser = await chromium.launch({ args: ["--no-sandbox"] });
// One context per role: the session cookie is httpOnly, so sign-out must be a
// fresh context rather than a document.cookie sweep.
const clientContext = await browser.newContext({ viewport: { width: 1280, height: 1600 } });
const page = await clientContext.newPage();

// fresh state, then switch the desk's tray-mirroring on
await page.request.post(`${MOCK}/api/method/mock.hd.reset`, { data: {} });
await page.request.post(`${MOCK}/api/method/mock.hd.mirror`, { data: { enabled: true } });

await login(page, "client@example.com");
await page.goto(`${BASE}/clientDashboard/help-desk/new`, { waitUntil: "domcontentloaded" });
await page.waitForSelector("#hd-name", { timeout: 60000 });
await sleep(1200);

const pick = async (host, label) => {
  await page.evaluate(
    ([selector, text]) => {
      const root = document.querySelector(selector);
      const buttons = [...(root?.querySelectorAll("button") ?? [])];
      (buttons.find((b) => (b.textContent || "").includes(text)) || buttons.at(-1))?.click();
    },
    [host, label],
  );
  await sleep(1000);
};

await page.waitForFunction(() => document.getElementById("hd-name")?.value.length > 0, null, { timeout: 30000 });
await page.fill("#hd-mobile", "01712345678");
await sleep(600);
await page.locator("[role=checkbox]").first().click();
await sleep(900);
await page.fill("#hd-subject", "One picture one attachment");
await sleep(1000);
await pick("#hd-step-category", "টেকনিক্যাল");
await pick("#hd-step-priority", "উচ্চ");
await pick("#hd-step-department", "Support");
await page.fill("#hd-description", "One screenshot attached — the field must list it once.");

// the customer picks exactly one image
await page.locator("input[type=file]").first().setInputFiles({ name: FILE_NAME, mimeType: "image/png", buffer: PNG });
await sleep(2000);

const formState = await page.evaluate(() => {
  const text = document.body.innerText;
  const thumbs = [...document.querySelectorAll("img")].filter((img) => {
    const rect = img.getBoundingClientRect();
    return rect.width > 40 && (img.src.startsWith("blob:") || img.src.includes("/files/"));
  });
  return { text, thumbs: thumbs.length, counter: (text.match(/(\d+)\s*\/\s*5/) ?? [])[1] };
});
check("the form shows the picked picture once", formState.thumbs === 1, `thumbnails ${formState.thumbs}`);
check("the attachment counter reads 1", formState.counter === "1", `counter ${formState.counter}`);

await page.locator("button[type=submit]").last().click();
await sleep(9000);

const success = await page.evaluate(() => document.body.innerText);
const successNames = (success.match(/Screenshot[^\n|]*\.png/g) ?? []).length;
const successCount = (success.match(/সংযুক্তি\s*\n?\s*(\d+)/) ?? [])[1];
check("success card lists the attachment once", successNames === 1, `name hits ${successNames}`);
check("success card attachment count is 1", successCount === "1", `count ${successCount}`);

const ticketId = (success.match(/HD-\d{4}-\d{5}/) ?? [])[0];
check("the ticket was created", Boolean(ticketId), ticketId ?? "missing");

const mockFiles = (await (await page.request.get(`${MOCK}/__mock/files`)).json()).files ?? [];

if (ticketId) {
  const detail = await page.request.get(`${BASE}/api/help-desk/tickets/${ticketId}?language=bn`);
  const body = await detail.json().catch(() => ({}));
  const ticket = body?.data?.ticket ?? body?.ticket ?? null;
  const attachments = ticket?.attachments ?? [];
  check("detail payload carries one attachment", attachments.length === 1, `count ${attachments.length}`);
  const onlyUrl = attachments[0]?.url ?? "";
  const rows = mockFiles.filter((row) => row.file_url === onlyUrl);
  check(
    "the desk kept the mirrored duplicate row (bug reproduced in data)",
    rows.length === 2,
    `${rows.length} rows for ${onlyUrl}`
  );

  await page.goto(`${BASE}/clientDashboard/help-desk/tickets/${ticketId}`, { waitUntil: "networkidle" }).catch(() => {});
  await sleep(2500);
  const detailCount = await page.evaluate(() => {
    const text = document.body.innerText;
    const section = (text.match(/সংযুক্তি\s*\n\s*([^\n]+)/) ?? [])[1] ?? "";
    return section;
  });
  check("the ticket page attachment section lists one file", (detailCount.match(/\.png/g) ?? []).length === 1, detailCount);
}

// employee side: one reply attachment must also read as one file
await clientContext.close();
const staffContext = await browser.newContext({ viewport: { width: 1280, height: 1600 } });
const staff = await staffContext.newPage();
await login(staff, "tamim@ioniccorporation.com");

const replyTicket = ticketId ?? "";
const agentName = `agent-shot-${Date.now()}.png`;
const up = await staff.request.post(`${BASE}/api/help-desk/upload`, {
  data: { file_name: agentName, content: PNG.toString("base64"), language: "en" },
});
const upBody = await up.json().catch(() => ({}));
const upData = upBody?.data ?? upBody;
check("employee upload succeeded", Boolean(upData?.url), JSON.stringify(upData).slice(0, 120));

const sent = await staff.request.post(`${BASE}/api/help-desk/tickets/${replyTicket}/replies`, {
  data: {
    message: "Here is the requested screenshot.",
    attachments: [{ name: upData?.name, url: upData?.url }],
    language: "en",
  },
});
check("employee reply with one attachment was accepted", sent.ok(), `${sent.status()}`);

const after = await staff.request.get(`${BASE}/api/help-desk/tickets/${replyTicket}?language=en`);
const afterBody = await after.json().catch(() => ({}));
const afterTicket = afterBody?.data?.ticket ?? afterBody?.ticket ?? null;
const reply = [...(afterTicket?.messages ?? [])].reverse().find((m) => (m.attachments ?? []).length);
check(
  "the employee's reply carries one attachment",
  (reply?.attachments ?? []).length === 1,
  `count ${(reply?.attachments ?? []).length}`
);

const staffRows = (await (await staff.request.get(`${MOCK}/__mock/files`)).json()).files ?? [];
const staffMirror = staffRows.filter((row) => row.file_url === upData?.url);
check(
  "the desk kept the mirrored duplicate row for the reply too",
  staffMirror.length === 2,
  `${staffMirror.length} rows`
);
check("the reply file is named after its own send", String(upData?.name ?? "").includes(agentName.replace(".png", "")), upData?.name);

await browser.close();

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
if (failed.length) {
  console.error("FAILED:", failed.map((r) => r.label).join("; "));
  process.exit(1);
}
