#!/usr/bin/env node
/**
 * 0668 — "upload the image issue" (the live shape).
 *
 * The report: the customer's own screenshot paints, but the employee's reply
 * screenshot fails with `{fileName: "Screenshot-_19_6e0bc2.png"}` and
 * "the bytes did not decode as an image". The cause is a `200` that is not the
 * file (the login/desk page coming back under a `/private/files/...` URL), which
 * the old proxy streamed straight into an `<img>`.
 *
 * This suite proves, end to end through the built portal + mock ERP:
 *   1. the fixture really answers 200-with-a-page on the storage path;
 *   2. the portal route refuses those bytes and serves the real picture instead
 *      (content-type image/png, PNG magic) — the ticket upload is clickable;
 *   3. both chat images decode at their true aspect ratio;
 *   4. the Activity list carries both files and its thumbnails open a lightbox;
 *   5. a file nobody can serve answers a typed 502 JSON, not garbage.
 *
 *   node scripts/mock-frappe.mjs &
 *   FRAPPE_BASE_URL=http://127.0.0.1:8787 npx next start -p 3011 &
 *   E2E_BASE=http://localhost:3011 E2E_ROLE=client node scripts/hd-0668-attachment-e2e.mjs
 *   E2E_BASE=http://localhost:3011 E2E_ROLE=staff  node scripts/hd-0668-attachment-e2e.mjs
 */
import { chromium } from "/root/arogga-UI/node_modules/playwright/index.mjs";
import fs from "node:fs";

const BASE = process.env.E2E_BASE ?? "http://localhost:3000";
const LOG = process.env.MOCK_LOG ?? "/tmp/mock_frappe.log";
const PASSWORD = process.env.MOCK_PASSWORD ?? "demo1234";
const TICKET = process.env.E2E_TICKET ?? "0668";
const ROLE = process.env.E2E_ROLE === "staff" ? "staff" : "client";
const EMAIL = ROLE === "staff" ? "tamim@ioniccorporation.com" : "client@example.com";
const SECTION = ROLE === "staff" ? "userDashboard" : "clientDashboard";
const SHOT = process.env.SHOT ?? `/tmp/hd-0668-${ROLE}.png`;

const MINE = "Screenshot-_21_9f8e7d.png"; // the customer's own upload
const THEIRS = "Screenshot-_22_5c4b3a.png"; // the employee's reply upload
const GARBAGE = "/private/files/hd-0668-not-a-picture.png"; // a 200 that is a page

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
  const page = await browser.newPage({ viewport: { width: 1280, height: 1000 }, deviceScaleFactor: 2 });
  const consoleErrors = [];
  const consoleLines = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
    else consoleLines.push(msg.text());
  });

  await login(page);
  await page.waitForURL(new RegExp(SECTION), { timeout: 60000 });

  // 1. The fixture must reproduce the live bug on the storage path: 200, but the
  //    body is a page. If this were a 403 the run would prove nothing about the
  //    "bytes did not decode" report.
  const mockBase = process.env.MOCK_BASE ?? "http://127.0.0.1:8787";
  const decoy = await page.request.get(`${mockBase}/private/files/${THEIRS}`);
  const decoyType = decoy.headers()["content-type"] ?? "";
  const decoyBody = (await decoy.text()).slice(0, 40).toLowerCase();
  check(
    "the storage path really answers 200 with a page (the reported bug)",
    decoy.status() === 200 && /text\/html/.test(decoyType) && decoyBody.includes("<"),
    `status ${decoy.status()} type ${decoyType}`
  );

  // 2. The portal route must refuse those bytes and serve the real file.
  const proxied = await page.request.get(
    `${BASE}/api/help-desk/files?url=${encodeURIComponent(`/private/files/${THEIRS}`)}`
  );
  const proxyType = proxied.headers()["content-type"] ?? "";
  const proxyBytes = Buffer.from(await proxied.body());
  check(
    "the portal route serves the real picture, not the page",
    proxied.status() === 200 && /image\/png/.test(proxyType) && proxyBytes.subarray(1, 4).toString() === "PNG",
    `status ${proxied.status()} type ${proxyType} magic ${proxyBytes.subarray(0, 8).toString("hex")}`
  );

  // 3. A file neither path can serve as a picture answers a typed error.
  const refused = await page.request.get(
    `${BASE}/api/help-desk/files?url=${encodeURIComponent(GARBAGE)}`
  );
  const refusedPayload = await refused.json().catch(() => ({}));
  check(
    "an undecodable file answers 502 JSON, never the page bytes",
    refused.status() === 502 &&
      /application\/json/.test(refused.headers()["content-type"] ?? "") &&
      refusedPayload.code === "not_a_file" &&
      refusedPayload.sawHtml === true,
    `status ${refused.status()} code ${refusedPayload.code} sawHtml ${refusedPayload.sawHtml}`
  );

  await page.goto(`${BASE}/${SECTION}/help-desk/tickets/${TICKET}`, {
    waitUntil: "domcontentloaded",
    timeout: 120000,
  });
  const thread = page.locator('[data-hd="thread"]');
  await thread.waitFor({ timeout: 60000 });

  const painted = async (name) => {
    await page.waitForFunction(
      (fileName) => {
        const node = document.querySelector(`[data-hd="thread"] img[alt="${fileName}"]`);
        return node instanceof HTMLImageElement && node.complete && node.naturalWidth > 0;
      },
      name,
      { timeout: 60000 }
    );
    return page.locator(`[data-hd="thread"] img[alt="${name}"]`).first().evaluate((node) => {
      const rect = node.getBoundingClientRect();
      const link = node.closest("a");
      return {
        naturalWidth: node.naturalWidth,
        naturalHeight: node.naturalHeight,
        width: rect.width,
        height: rect.height,
        src: node.currentSrc || node.src,
        href: link?.getAttribute("href") ?? "",
      };
    });
  };

  const mine = await painted(MINE);
  const theirs = await painted(THEIRS);
  check("the customer's own screenshot decodes", mine.naturalWidth > 0, `${mine.naturalWidth}x${mine.naturalHeight}`);
  check(
    "the employee's screenshot decodes (was: did not decode)",
    theirs.naturalWidth > 0,
    `${theirs.naturalWidth}x${theirs.naturalHeight}`
  );
  check(
    "both screenshots keep their aspect ratio",
    Math.abs(mine.width / Math.max(1, mine.height) - mine.naturalWidth / mine.naturalHeight) < 0.02 &&
      Math.abs(theirs.width / Math.max(1, theirs.height) - theirs.naturalWidth / theirs.naturalHeight) < 0.02,
    `mine ${Math.round(mine.width)}x${Math.round(mine.height)} theirs ${Math.round(theirs.width)}x${Math.round(theirs.height)}`
  );
  check(
    "both are clickable links to the authorised route",
    /\/api\/help-desk\/files\?url=/.test(mine.href) && /\/api\/help-desk\/files\?url=/.test(theirs.href),
    `${mine.href} | ${theirs.href}`
  );

  // 4. Activity: the same files listed, thumbnails open the lightbox.
  const activity = page.locator('[data-hd="activity"]');
  await activity.waitFor({ timeout: 30000 });
  const storyThumbs = activity.locator(`img[alt="${THEIRS}"]`);
  const ownThumbs = activity.locator(`img[alt="${MINE}"]`);
  check("activity lists the customer's file", (await ownThumbs.count()) > 0, `count ${await ownThumbs.count()}`);
  check(
    "activity lists the employee's file the thread could not decode",
    (await storyThumbs.count()) > 0,
    `count ${await storyThumbs.count()}`
  );

  await storyThumbs.first().click();
  const lightbox = page.locator('[role="dialog"]');
  await lightbox.waitFor({ timeout: 15000 });
  const lightboxImage = await lightbox.locator("img").first().evaluate((node) => ({
    src: node.getAttribute("src") ?? "",
    alt: node.getAttribute("alt") ?? "",
  }));
  check(
    "clicking the activity thumbnail opens that picture",
    lightboxImage.alt === THEIRS && /\/api\/help-desk\/files\?url=/.test(lightboxImage.src),
    `${lightboxImage.alt} ${lightboxImage.src}`
  );
  await page.keyboard.press("Escape");
  await lightbox.waitFor({ state: "detached", timeout: 10000 }).catch(() => {});

  const logText = consoleLines.join("\n");
  check(
    "no attachment failure was logged",
    !logText.includes("does not view properly") &&
      !logText.includes("image did not load") &&
      !logText.includes("activity thumbnail did not load"),
    "a failure line was logged"
  );
  check("no console errors", consoleErrors.length === 0, consoleErrors.slice(0, 3).join(" | "));

  await page.screenshot({ path: SHOT, fullPage: false });
  console.log(`screenshot ${SHOT}`);
  console.log(`\n${passed}/${passed + failed} checks passed`);
  if (failed > 0) process.exitCode = 1;
} finally {
  await browser.close();
}
