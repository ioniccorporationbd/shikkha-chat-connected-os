/**
 * The শিক্ষা চ্যাট সাপোর্ট box — time, order and attachment shape.
 *
 * What a customer reads on /clientDashboard/help-desk/tickets/<id>:
 *
 *   1. every bubble carries the time it was sent, to the SECOND
 *      (`08:41:00 PM`), so two messages a few seconds apart are told apart;
 *   2. the thread reads oldest -> newest, and a message just sent by the
 *      customer lands at the BOTTOM with its own stamp;
 *   3. one message never draws twice (the desk stores a retried send on both
 *      channels; the chat folds it);
 *   4. a picture and its file name are ONE card — the caption sits inside the
 *      same frame as the image, not as a loose row underneath.
 *
 *   node scripts/mock-frappe.mjs &
 *   FRAPPE_BASE_URL=http://127.0.0.1:8787 npx next start -p 3011 &
 *   E2E_BASE=http://localhost:3011 node scripts/hd-chat-time-e2e.mjs
 */
import { chromium } from "/root/arogga-UI/node_modules/playwright/index.mjs";
import fs from "node:fs";

const BASE = process.env.E2E_BASE ?? "http://localhost:3011";
const MOCK = process.env.MOCK_BASE ?? "http://127.0.0.1:8787";
const LOG = process.env.MOCK_LOG ?? "/tmp/mock_frappe.log";
const PASSWORD = process.env.MOCK_PASSWORD ?? "demo1234";
const EMAIL = process.env.E2E_EMAIL ?? "client@example.com";
const SHOT = process.env.SHOT ?? "/tmp/hd-chat-time.png";
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

/** Every bubble of the chat, in DOM order, with its stamp. */
async function readBubbles(page) {
  return page.evaluate(() => {
    const thread = document.querySelector('[data-hd="thread"]');
    if (!thread) return [];
    const rows = [...thread.querySelectorAll('div[id^="msg-"]')];
    return rows.map((row) => {
      const time = row.querySelector("time");
      // The bubble's own paragraph: a row can carry an author label and the
      // quoted line too, so innerText is not the message text.
      const bubbleText = [...row.querySelectorAll("p")]
        .map((node) => (node.textContent || "").replace(/\s+/g, " ").trim())
        .filter(Boolean)
        .join(" ");
      return {
        id: row.id.replace("msg-", ""),
        text: bubbleText || (row.innerText || "").replace(/\s+/g, " ").trim(),
        stamp: (time?.textContent || "").trim(),
        at: time?.getAttribute("datetime") || "",
      };
    });
  });
}

const browser = await chromium.launch({ args: ["--no-sandbox"] });
const context = await browser.newContext({ viewport: { width: 1280, height: 1800 } });
const page = await context.newPage();
const consoleErrors = [];
page.on("console", (msg) => {
  if (msg.type() === "error") consoleErrors.push(msg.text());
});

await page.request.post(`${MOCK}/api/method/mock.hd.reset`, { data: {} }).catch(() => {});
await login(page, EMAIL);

// ---------------------------------------------------------------- 1 + 2 + 3
// Ticket 0616 hands its rows over reversed and stores one send twice.
await page.goto(`${BASE}/clientDashboard/help-desk/tickets/0616`, { waitUntil: "networkidle" }).catch(() => {});
await page.waitForSelector('[data-hd="thread"]', { timeout: 60000 });
await sleep(2500);

let bubbles = await readBubbles(page);
check("the thread rendered", bubbles.length >= 4, `${bubbles.length} bubbles`);

// Bangla mode writes the clock in Bengali digits (০৩:০৫:০০ PM) — the seconds
// are what this suite is about, so accept either numeral set.
const STAMP = /^[০-৯0-9]{1,2}:[০-৯0-9]{2}:[০-৯0-9]{2}\s?(AM|PM)$/i;
const badStamps = bubbles.filter((bubble) => !STAMP.test(bubble.stamp));
check(
  "every message shows the time it was sent, with seconds",
  badStamps.length === 0,
  badStamps.map((bubble) => bubble.stamp || "(none)").slice(0, 3).join(", ")
);

const stampsAscending = bubbles.every((bubble, index) => {
  if (index === 0) return true;
  const previous = bubbles[index - 1].at;
  return !previous || !bubble.at || previous <= bubble.at;
});
check("old messages sit on top, recent ones at the bottom", stampsAscending,
  bubbles.map((bubble) => bubble.at).join(" | "));

const counts = ["[0616-1]", "[0616-2]", "[0616-3]", "[0616-4]"].map((token) => ({
  token,
  count: bubbles.filter((bubble) => bubble.text.includes(token)).length,
}));
check(
  "the four seeded lines draw once each (the desk stores [0616-3] twice)",
  counts.every((row) => row.count === 1),
  counts.map((row) => `${row.token}=${row.count}`).join(" ")
);
check("no line is drawn twice", bubbles.length === 4, `${bubbles.length} bubbles`);

// Which side: the customer's own lines are right-aligned rows.
const sides = await page.evaluate(() => {
  const thread = document.querySelector('[data-hd="thread"]');
  if (!thread) return [];
  return [...thread.querySelectorAll('div[id^="msg-"]')].map((row) => {
    const style = getComputedStyle(row);
    return { id: row.id, justify: style.justifyContent };
  });
});
const rightCount = sides.filter((row) => row.justify === "flex-end").length;
check("the customer's own lines sit on the right", rightCount >= 2, `${rightCount} right rows`);

// Sending a fresh message: it must land at the BOTTOM, stamped with seconds.
const sentText = `time-check-${Date.now()}`;
const composer = page.locator("textarea.hd-composer-textarea").last();
await composer.click();
await composer.fill(sentText);
await sleep(300);
// Enter sends (the composer's own key handler); the round paper-plane button
// beside the textarea does the same thing.
await composer.press("Enter");
await sleep(7000);

bubbles = await readBubbles(page);
const mine = bubbles.filter((bubble) => bubble.text.includes(sentText));
check("the message just sent appears once", mine.length === 1, `${mine.length} bubble(s)`);
check("the message just sent carries its own time to the second", Boolean(mine[0] && STAMP.test(mine[0].stamp)), mine[0]?.stamp ?? "missing");
check(
  "the message just sent is the bottom-most row",
  Boolean(mine[0]) && bubbles.at(-1)?.id === mine[0].id,
  `last row ${bubbles.at(-1)?.text?.slice(0, 40) ?? "-"}`
);

// -------------------------------------------------------------------- 4
// Ticket 0623: a picture message. Image and file name must be one card.
await page.goto(`${BASE}/clientDashboard/help-desk/tickets/0623`, { waitUntil: "networkidle" }).catch(() => {});
await page.waitForSelector('[data-hd="thread"]', { timeout: 60000 });
await sleep(2500);

const card = await page.evaluate(() => {
  const thread = document.querySelector('[data-hd="thread"]');
  if (!thread) return null;
  const images = [...thread.querySelectorAll("img")].filter((img) => {
    const box = img.getBoundingClientRect();
    return box.width > 40 && box.height > 40;
  });
  for (const img of images) {
    // The framed card is the wrapper that also holds the caption row.
    const frame = img.closest("div.overflow-hidden");
    if (!frame) continue;
    // The caption row reads "<file name><size>", so the extension is followed
    // by digits with no word boundary — match the extension plainly.
    const caption = [...frame.querySelectorAll("a")].find((anchor) =>
      /\.(png|jpe?g|webp|gif)/i.test(anchor.textContent || "")
    );
    if (!caption) continue;
    const frameBox = frame.getBoundingClientRect();
    const captionBox = caption.getBoundingClientRect();
    return {
      fileName: (caption.textContent || "").trim(),
      inside: frameBox.top <= captionBox.top && captionBox.bottom <= frameBox.bottom + 1,
      attached: Math.abs(captionBox.top - frameBox.bottom) < 60,
      wrapped: frame.contains(img) && frame.contains(caption),
    };
  }
  return null;
});

check("the picture is shown inside a framed card", Boolean(card), card ? card.fileName : "no framed image with a caption");
check("the file name rides inside the same card as the picture", Boolean(card?.wrapped && card?.inside), JSON.stringify(card));

// A new picture sent by the customer must also arrive as one card with a stamp.
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFAAH/q842iQAAAABJRU5ErkJggg==",
  "base64"
);
const upload = await page.request.post(`${BASE}/api/help-desk/upload`, {
  data: { file_name: `chat-shot-${Date.now()}.png`, content: PNG.toString("base64"), language: "en" },
});
const uploadBody = await upload.json().catch(() => ({}));
const uploadData = uploadBody?.data ?? uploadBody;
check("the customer's picture upload succeeded", Boolean(uploadData?.url), JSON.stringify(uploadData).slice(0, 120));

if (uploadData?.url) {
  const sent = await page.request.post(`${BASE}/api/help-desk/tickets/0623/replies`, {
    data: { message: "", attachments: [{ name: uploadData.name, url: uploadData.url }], language: "en" },
  });
  check("a picture-only message was accepted", sent.ok(), `${sent.status()}`);
  await page.reload({ waitUntil: "networkidle" }).catch(() => {});
  await sleep(3000);
  const after = await readBubbles(page);
  const pictureBubble = after.at(-1);
  check("the picture message carries a time to the second", Boolean(pictureBubble && STAMP.test(pictureBubble.stamp)), pictureBubble?.stamp ?? "missing");
}

await page.screenshot({ path: SHOT, fullPage: false }).catch(() => {});
// The dev mock has no live ticket stream, so the realtime hook logs its guarded
// fallback to polling — expected noise, not a defect. Everything else counts.
const unexpected = consoleErrors.filter(
  (line) => !/realtime|Failed to load resource|502|connect_timeout/i.test(line)
);
check("no unexpected console errors on the chat page", unexpected.length === 0, unexpected.slice(0, 2).join(" | "));

await browser.close();

const failed = results.filter((row) => !row.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
if (failed.length) {
  console.error("FAILED:", failed.map((row) => row.label).join("; "));
  process.exit(1);
}
