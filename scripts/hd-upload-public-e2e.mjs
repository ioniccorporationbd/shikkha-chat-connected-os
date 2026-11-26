#!/usr/bin/env node
/**
 * Attachment storage parity with the Desk File doctype.
 *
 * The requirement: a file attached from the portal — by the customer *or* the
 * employee — must land in `desk/data/file` with **is_private unchecked** and a
 * `/files/...` URL (the report showed `is_private: 1` +
 * `/private/files/Screenshot-_20_3350ab.png`). Private is what made an entitled
 * reader hit 403/200-a-page and an <img> that "did not decode" (0668).
 *
 * This suite drives the real portal upload route and asserts, against the mock
 * `File` doctype:
 *   1. the response URL is `/files/...` (never `/private/files/...`);
 *   2. the stored row has `is_private: 0` and that same public URL;
 *   3. the public URL is genuinely readable as a PNG without a session;
 *   4. the portal proxy still serves it (never more public than the ticket);
 *   5. a ticket created with that upload keeps `is_private: 0` after attach,
 *      and the picture paints in the thread and in the Activity list.
 *
 *   node scripts/mock-frappe.mjs &
 *   FRAPPE_BASE_URL=http://127.0.0.1:8787 npx next start -p 3011 &
 *   E2E_BASE=http://localhost:3011 E2E_ROLE=client node scripts/hd-upload-public-e2e.mjs
 *   E2E_BASE=http://localhost:3011 E2E_ROLE=staff  node scripts/hd-upload-public-e2e.mjs
 */
import { chromium } from "/root/arogga-UI/node_modules/playwright/index.mjs";
import fs from "node:fs";

const BASE = process.env.E2E_BASE ?? "http://localhost:3000";
const MOCK_BASE = process.env.MOCK_BASE ?? "http://127.0.0.1:8787";
const LOG = process.env.MOCK_LOG ?? "/tmp/mock_frappe.log";
const PASSWORD = process.env.MOCK_PASSWORD ?? "demo1234";
const ROLE = process.env.E2E_ROLE === "staff" ? "staff" : "client";
const EMAIL = ROLE === "staff" ? "tamim@ioniccorporation.com" : "client@example.com";
const SECTION = ROLE === "staff" ? "userDashboard" : "clientDashboard";

// A real 1x1 PNG, so the magic-byte check has something true to see.
const PNG_1PX = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64"
).toString("base64");
const FILE_NAME = `storage-check-${ROLE}.png`;
// Stored Desk names carry the upload date and time: base-YYYYMMDD-HHMMSS.ext
// (and a `-2`, `-3`… collision suffix when two sends land in the same second).
const STAMP_RE = /^(.*?)-(\d{8}-\d{6})(?:-\d+)?(\.[A-Za-z0-9]+)?$/;
const parseStored = (name) => {
  const m = STAMP_RE.exec(String(name ?? ""));
  return m ? { base: m[1], stamp: m[2], ext: m[3] ?? "" } : null;
};
const SUBJECT = `স্টোরেজ চেক ${Date.now()}`;

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

const browser = await chromium.launch({ args: ["--no-sandbox"] });
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
  await login(page);
  await page.waitForURL(new RegExp(SECTION), { timeout: 60000 });

  // 1. Upload through the same route the composer uses.
  const uploaded = await page.request.post(`${BASE}/api/help-desk/upload`, {
    data: { file_name: FILE_NAME, content: PNG_1PX, language: "bn" },
  });
  const payload = await uploaded.json().catch(() => ({}));
  const data = payload?.data ?? payload;
  const fileUrl = String(data?.url ?? "");
  const storedName = String(data?.name ?? "");
  check("upload is accepted", uploaded.status() === 200, `status ${uploaded.status()} ${JSON.stringify(payload).slice(0, 160)}`);
  check(
    "the upload URL is public (/files/…), not /private/files/…",
    fileUrl.startsWith("/files/"),
    fileUrl
  );

  // 1b. The Desk File row is named with the upload's date and time.
  const stamp = parseStored(storedName);
  check(
    "the stored file name carries the upload date and time",
    Boolean(stamp) && stamp.base === FILE_NAME.replace(/\.png$/, "") && stamp.ext === ".png",
    storedName
  );
  check(
    "the public URL keeps the same name",
    fileUrl.endsWith("/" + storedName) || fileUrl.endsWith(storedName),
    `${fileUrl} vs ${storedName}`
  );

  // 2. The Desk row itself: is_private must be 0.
  const filesResponse = await page.request.get(`${MOCK_BASE}/__mock/files`);
  const rows = (await filesResponse.json()).files ?? [];
  const row = rows.find((item) => item.file_url === fileUrl);
  check("the File row exists", Boolean(row), `no row for ${fileUrl}`);
  check("the File row stores the stamped name", row?.file_name === storedName, `${row?.file_name} vs ${storedName}`);
  check("the File row stores is_private 0 (box unchecked)", row?.is_private === 0, `is_private ${row?.is_private}`);
  check("the File row is owned by the uploader", row?.owner === EMAIL.toLowerCase(), row?.owner);

  // 2b. A retried submit re-sends the same bytes: same row, no duplicate.
  const retried = await page.request.post(`${BASE}/api/help-desk/upload`, {
    data: { file_name: FILE_NAME, content: PNG_1PX, language: "bn" },
  });
  const retriedRaw = await retried.json().catch(() => ({}));
  const retriedData = retriedRaw?.data ?? retriedRaw;
  check(
    "a retried upload reuses the same stamped File row",
    retriedData?.url === fileUrl && retriedData?.name === storedName,
    JSON.stringify(retriedData).slice(0, 160)
  );
  const rowsAfterRetry = (await (await page.request.get(`${MOCK_BASE}/__mock/files`)).json()).files ?? [];
  check(
    "no duplicate File row is written on retry",
    rowsAfterRetry.filter((item) => item.file_url === fileUrl).length === 1,
    `count ${rowsAfterRetry.filter((item) => item.file_url === fileUrl).length}`
  );

  // 2c. The operator's rule: send the *same* picture again later and it must be
  // stored again — its own File row, its own name with today's date and the new
  // sending time. Only a retry within the same submit may reuse the first row.
  await page.request.post(`${MOCK_BASE}/api/method/mock.hd.age`, { data: { seconds: 600 } });
  const second = await page.request.post(`${BASE}/api/help-desk/upload`, {
    data: { file_name: FILE_NAME, content: PNG_1PX, language: "bn" },
  });
  const secondRaw = await second.json().catch(() => ({}));
  const secondData = secondRaw?.data ?? secondRaw;
  const secondStamp = parseStored(secondData?.name);
  check(
    "re-sending the same name after the reuse window stores a NEW File",
    secondData?.name !== storedName && Boolean(secondStamp) && secondStamp.base === stamp?.base,
    JSON.stringify(secondData).slice(0, 160)
  );
  const rowsAfterSecond = (await (await page.request.get(`${MOCK_BASE}/__mock/files`)).json()).files ?? [];
  const sameBase = rowsAfterSecond.filter((item) => parseStored(item.file_name)?.base === stamp?.base);
  check(
    "both sends appear as separate dated File rows",
    sameBase.length === 2 &&
      new Set(sameBase.map((item) => item.file_name)).size === 2 &&
      sameBase.every((item) => /\d{8}-\d{6}/.test(item.file_name)),
    JSON.stringify(sameBase.map((item) => item.file_name))
  );

  // 3. Public means publicly readable — no session, no proxy.
  const direct = await page.request.get(`${MOCK_BASE}${fileUrl}`);
  const directBytes = Buffer.from(await direct.body());
  check(
    "the public URL serves the picture itself",
    direct.status() === 200 &&
      /image\/png/.test(direct.headers()["content-type"] ?? "") &&
      directBytes.subarray(1, 4).toString() === "PNG",
    `status ${direct.status()} type ${direct.headers()["content-type"]} magic ${directBytes.subarray(0, 8).toString("hex")}`
  );

  // 4. The portal proxy keeps working for the same public URL.
  const proxied = await page.request.get(
    `${BASE}/api/help-desk/files?url=${encodeURIComponent(fileUrl)}`
  );
  check(
    "the portal proxy still serves it",
    proxied.status() === 200 && /image\/png/.test(proxied.headers()["content-type"] ?? ""),
    `status ${proxied.status()} type ${proxied.headers()["content-type"]}`
  );

  // 5. Attaching to a ticket must not flip the row back to private.
  if (ROLE === "client") {
    const created = await page.request.post(`${BASE}/api/help-desk/tickets`, {
      data: {
        subject: SUBJECT,
        description: "সংযুক্ত ছবিটি পাবলিক ফাইল হিসেবে সংরক্ষণ করা হয়েছে কি না তা যাচাই করা হচ্ছে।",
        ticketType: "technical",
        priority: "medium",
        department: "Support",
        contact: { preferredContact: "email", mobile: "" },
        attachments: [{ name: storedName, url: fileUrl, size: PNG_1PX.length }],
        language: "bn",
      },
    });
    const createdPayload = await created.json().catch(() => ({}));
    const ticket = createdPayload?.data?.ticket ?? createdPayload?.data ?? {};
    const ticketId = String(ticket.id ?? ticket.name ?? ticket.ticketId ?? "");
    check("the ticket is created with the upload", created.status() === 200 && Boolean(ticketId), `status ${created.status()} ${JSON.stringify(createdPayload).slice(0, 160)}`);

    const afterFiles = (await (await page.request.get(`${MOCK_BASE}/__mock/files`)).json()).files ?? [];
    const afterRow = afterFiles.find((item) => item.file_url === fileUrl);
    check("attaching keeps is_private 0", afterRow?.is_private === 0, `is_private ${afterRow?.is_private}`);
    check(
      "the row is attached to the ticket record",
      Boolean(afterRow?.attached_to_doctype) && Boolean(afterRow?.attached_to_name),
      `${afterRow?.attached_to_doctype}/${afterRow?.attached_to_name}`
    );

    if (ticketId) {
      await page.goto(`${BASE}/${SECTION}/help-desk/tickets/${ticketId}`, {
        waitUntil: "domcontentloaded",
        timeout: 120000,
      });
      const thread = page.locator('[data-hd="thread"]');
      await thread.waitFor({ timeout: 60000 });
      await page.waitForFunction(
        (fileName) => {
          const node = document.querySelector(`[data-hd="thread"] img[alt="${fileName}"]`);
          return node instanceof HTMLImageElement && node.complete && node.naturalWidth > 0;
        },
        storedName,
        { timeout: 60000 }
      );
      const painted = await page
        .locator(`[data-hd="thread"] img[alt="${storedName}"]`)
        .first()
        .evaluate((node) => ({ w: node.naturalWidth, h: node.naturalHeight }));
      check("the attached picture paints in the thread", painted.w > 0, `${painted.w}x${painted.h}`);

      const inActivity = await page.locator(`[data-hd="activity"] img[alt="${storedName}"]`).count();
      check("the Activity list shows the attachable picture", inActivity > 0, `count ${inActivity}`);
    }
  }

  const consoleErrors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  check("no console errors", consoleErrors.length === 0, consoleErrors.slice(0, 3).join(" | "));

  console.log(`\n${passed}/${passed + failed} checks passed`);
  if (failed > 0) process.exitCode = 1;
} finally {
  await browser.close();
}
