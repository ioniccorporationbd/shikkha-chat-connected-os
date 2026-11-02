/**
 * "I attached a picture once, the chat drew it many times" end-to-end proof.
 *
 * The live ticket 0643 carries a customer message with text and one receipt
 * picture, and the chat history drew that one picture several times over. The
 * desk is the reason: it names the same upload twice on the message itself
 * (`/private/files/x.png` from the row's attachment list and `/files/x.png` from
 * the image its HTML embeds) and leaves a bare `Attachment` comment holding the
 * picture with no text of its own.
 *
 * This script sends that first message through the *real* composer on the mock,
 * which answers in exactly that shape (thread 0643 has `mirrorAttachments`), and
 * holds the thread to four rules:
 *
 *   1. one picture is drawn once, in the message that carried it;
 *   2. the picture is a real link (an anchor around it, pointing at the file);
 *   3. the file name under it is a link too, so the row is clickable and named;
 *   4. the duplicate hunt is visible in the browser console — and no console
 *      error appears (a load failure also lands in Desk -> Error Log).
 *
 *   node scripts/mock-frappe.mjs &
 *   FRAPPE_BASE_URL=http://127.0.0.1:8787 npx next start -p 3011 &
 *   E2E_BASE=http://localhost:3011 node scripts/hd-0643-attach-e2e.mjs
 */
import { chromium } from "/root/arogga-UI/node_modules/playwright/index.mjs";
import fs from "node:fs";

const BASE = process.env.E2E_BASE ?? "http://localhost:3000";
const LOG = process.env.MOCK_LOG ?? "/tmp/mock_frappe.log";
const PASSWORD = process.env.MOCK_PASSWORD ?? "demo1234";
const EMAIL = process.env.E2E_EMAIL ?? "client@example.com";
const TICKET = process.env.E2E_TICKET ?? "0643";
const SECTION = process.env.E2E_SECTION ?? "clientDashboard";
const SHOT = process.env.SHOT ?? "/tmp/hd-0643-attach.png";
const TEXT = process.env.E2E_TEXT ?? "স্লিপ দেখুন [0643-A]";

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

/** A real receipt-looking PNG, so the thread shows the actual picture. */
function receiptPng() {
  const file = process.env.E2E_UPLOAD_FILE ?? "/tmp/hd-receipt-0643.png";
  if (!fs.existsSync(file)) {
    fs.writeFileSync(
      file,
      Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAAWklEQVR4nO3QMQEAAAjDMMC/56EB" +
          "3wQJqBsAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" +
          "AAAAAAAAAAAAAAAA4G8GqAABlf7GlQAAAABJRU5ErkJggg==",
        "base64"
      )
    );
  }
  return file;
}

const browser = await chromium.launch({ args: ["--no-sandbox"] });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 }, deviceScaleFactor: 2 });
  const consoleErrors = [];
  const consoleLines = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
    else consoleLines.push(msg.text());
  });

  await login(page);
  await page.waitForURL(new RegExp(SECTION), { timeout: 60000 });

  await page.goto(`${BASE}/${SECTION}/help-desk/tickets/${TICKET}`, {
    waitUntil: "domcontentloaded",
    timeout: 120000,
  });
  const thread = page.locator('[data-hd="thread"]');
  await thread.waitFor({ timeout: 60000 });

  // --- send the first message WITH an image, the way a customer does -------
  const textarea = page.locator("textarea").last();
  await textarea.click();
  await textarea.fill(TEXT);
  await page.setInputFiles('input[type="file"]', receiptPng());

  // The send control is an icon button: its label lives in aria-label, not text.
  const send = page
    .locator('button[aria-label="পাঠান"], button[aria-label="Send"]')
    .last();
  const sendVisible = await send.count();
  if (sendVisible) {
    await send.waitFor({ state: "visible", timeout: 10000 });
    await send.click();
  } else {
    await textarea.press("Enter");
  }

  // The bubble lands once the thread refreshes with the stored message.
  await page.waitForFunction(
    (token) => !!document.querySelector(`[data-hd="thread"]`)?.textContent?.includes(token),
    TEXT,
    { timeout: 60000 }
  );
  await sleep(2500); // let the duplicate fold + lazy image paint settle

  // --- 1. one picture, drawn once ----------------------------------------
  const images = await page.evaluate(() => {
    const root = document.querySelector('[data-hd="thread"]');
    return [...(root?.querySelectorAll("img") ?? [])].map((img) => ({
      src: img.currentSrc || img.src,
      width: img.naturalWidth,
      // The bubble is the element holding the message: the attachment list's
      // parent, not the <li> the picture lives in.
      text: (
        img.closest("li")?.parentElement?.parentElement?.textContent ??
        img.closest("li")?.parentElement?.textContent ??
        ""
      )
        .trim()
        .slice(0, 160),
      anchor: img.closest("a")?.getAttribute("href") ?? "",
      caption: [...(img.closest("li")?.querySelectorAll("a") ?? [])].map((a) => a.textContent?.trim() ?? ""),
    }));
  });
  check(
    "the attached picture is drawn exactly once in the history",
    images.length === 1,
    `images=${images.length} ${JSON.stringify(images.map((i) => i.src.split("/").pop()))}`
  );
  check(
    "the picture sits in the message that carried it (same bubble as the text)",
    images.length === 1 && images[0].text.includes("[0643-A]"),
    images.length === 1 ? images[0].text : ""
  );

  // --- 2. the picture is a link ------------------------------------------
  check(
    "the picture is wrapped in a real link to the file",
    images.length === 1 && /\/api\/help-desk\/|http/.test(images[0].anchor),
    images.length === 1 ? images[0].anchor : ""
  );

  // --- 3. the file name under it is a link too ---------------------------
  const caption = images.length === 1 ? images[0].caption.join(" ") : "";
  check(
    "the file name under the picture is a link and names the file",
    images.length === 1 && /\.png|\.jpe?g/i.test(caption),
    caption
  );

  // --- 4. the picture actually paints ------------------------------------
  const painted = await page.evaluate(async () => {
    for (let i = 0; i < 30; i += 1) {
      const img = [...document.querySelectorAll('[data-hd="thread"] img')].find((node) =>
        (node.currentSrc || node.src || "").includes("receipt")
      );
      if (img) {
        if (!img.naturalWidth) img.scrollIntoView({ block: "center" });
        if (img.naturalWidth > 0) return img.naturalWidth;
      }
      await new Promise((resolve) => setTimeout(resolve, 400));
    }
    return 0;
  });
  check("the picture's bytes actually load", painted > 0, `naturalWidth=${painted}`);

  // --- 4b. the ticket audit agrees with the chat -------------------------
  const audit = await page.evaluate(() => {
    const text = document.body.innerText;
    const events = [...document.querySelectorAll("li,div")].filter((node) =>
      /^বার্তা$|^বার্তা /.test((node.firstElementChild?.textContent ?? "").trim())
    ).length;
    return { text, events };
  });
  const counterLine =
    audit.text.split("\n").find((line) => line.includes("কার্যক্রম")) ?? "(no কার্যক্রম line)";
  const activityDigits = (counterLine.match(/[0-9\u09E6-\u09EF]+/) ?? [""])[0];
  check(
    "the ticket timeline shows one activity for the one message",
    /^[1\u09E7]$/.test(activityDigits),
    counterLine
  );
  check(
    "the timeline does not still count the folded copies",
    !/২টি সংযুক্তি/.test(audit.text),
    /২টি সংযুক্তি/.test(audit.text) ? "found ২টি সংযুক্তি" : ""
  );

  // --- 5. the console tells the story ------------------------------------
  const logText = consoleLines.join("\n");
  check("console logs the upload", logText.includes("[hd:attach] uploaded"));
  check(
    "console logs the repeated file inside one message",
    logText.includes("[hd:attach] folded a repeated file inside one message")
  );
  check(
    "console logs the stray copy folded away",
    logText.includes("[hd:attach] a file already shown elsewhere was folded away")
  );
  check("console logs the attachment census", logText.includes("[hd:attach] conversation"));
  check("no new console errors", consoleErrors.length === 0, consoleErrors.join(" | "));

  await page.screenshot({ path: SHOT, fullPage: false });
  console.log(`screenshot ${SHOT}`);
} catch (error) {
  check("the run itself completed", false, String(error));
} finally {
  await browser.close();
}

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length ? 1 : 0);
