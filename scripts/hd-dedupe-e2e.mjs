// Proof that one message reads once in the chat box.
//
// The desk can store the same reply several ways: both channels (Comment +
// Communication), a resent upload, its own second copy of a sent email, or the
// email copy carrying a quoted history / signature around the same words. Each
// of those used to draw twice in শিক্ষা চ্যাট সাপোর্ট. This suite seeds every
// pattern on the mock thread and asserts:
//
//   1. an identical line sent twice on the same channel appears once;
//   2. a reply and its email copy (same words + a signature) appear once, and
//      the fuller text survives;
//   3. two genuinely different lines a few seconds apart both appear;
//   4. a short line ("ok") repeated by a person is NOT folded away;
//   5. the bubbles stay in time order, oldest on top;
//   6. the page logs no console error.
//
// Run from /root/shikkha-connected-os with the mock (:8787) and next up:
//   E2E_BASE=http://localhost:3011 node scripts/hd-dedupe-e2e.mjs

import { chromium } from "/root/arogga-UI/node_modules/playwright/index.mjs";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const run_ = promisify(execFile);

const NEXT = process.env.E2E_BASE ?? "http://localhost:3005";
const MOCK = process.env.MOCK_BASE ?? "http://127.0.0.1:8787";
const TICKET = "HD-2026-00001";
const PASSWORD = process.env.MOCK_PASSWORD ?? "demo1234";
const CUSTOMER = "client@example.com";

async function postJson(path, body) {
  const { stdout } = await run_("curl", [
    "-s",
    "-m",
    "10",
    "-X",
    "POST",
    "-H",
    "content-type: application/json",
    "-d",
    JSON.stringify(body),
    `${MOCK}${path}`,
  ]);
  return stdout;
}

async function login(usr) {
  const { stdout } = await run_("curl", [
    "-s",
    "-m",
    "10",
    "-D",
    "-",
    "-X",
    "POST",
    "-H",
    "content-type: application/json",
    "-d",
    JSON.stringify({ usr, pwd: PASSWORD }),
    `${MOCK}/api/method/shikkha_os.api.v1.auth.login`,
  ]);
  const cookie = stdout
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.toLowerCase().startsWith("set-cookie: sid="))
    .map((line) => line.slice("set-cookie: ".length).split(";")[0])
    .pop();
  if (!cookie) throw new Error(`login failed for ${usr}: ${stdout.slice(0, 300)}`);
  return cookie;
}

const ago = (seconds) => new Date(Date.now() - seconds * 1000).toISOString();

const A = "MARKER-A একই বাক্য দুইবার পাঠানো হয়েছে ভালো করে দেখুন";
const B = "MARKER-B আপনার সমস্যাটি আমরা দেখছি, আজকের মধ্যেই জানাব";
const B_FULL = `${B} -- ধন্যবাদ, শিক্ষা চ্যাট সাপোর্ট`;
const D = "MARKER-D প্রথম আলাদা কথা একেবারে আলাদা";
const E = "MARKER-E দ্বিতীয় আলাদা কথা একেবারেই আলাদা";

const failures = [];
const check = (ok, message) => {
  console.log(`${ok ? "PASS" : "FAIL"} ${message}`);
  if (!ok) failures.push(message);
};

(async () => {
  const reset = await postJson("/api/method/mock.hd.reset", {});
  if (!reset.includes('"ok":true')) throw new Error(`reset failed: ${reset.slice(0, 200)}`);

  const push = async (author, body, at) => {
    const out = await postJson("/api/method/mock.hd.push", { ticket: TICKET, author, body, at });
    if (!out.includes('"ok":true')) throw new Error(`push failed: ${out.slice(0, 200)}`);
  };

  // 1. the same line twice, same channel, 40 s apart
  await push("user", A, ago(300));
  await push("user", A, ago(260));
  // 2. the reply and its email copy (same words + signature), 30 s apart
  await push("support", B, ago(200));
  await push("support", B_FULL, ago(170));
  // 3. two different lines, ten seconds apart
  await push("user", D, ago(120));
  await push("user", E, ago(110));
  // 4. a short line a person really does repeat
  await push("user", "ok", ago(60));
  await push("user", "ok", ago(40));

  const cookie = await login(CUSTOMER);
  const browser = await chromium.launch({ args: ["--no-sandbox"] });
  const context = await browser.newContext({ viewport: { width: 1280, height: 1100 } });
  const [, value] = cookie.split("=");
  await context.addCookies([{ name: "shikkha_os_sid", value, domain: "localhost", path: "/" }]);
  const page = await context.newPage();

  const consoleErrors = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => consoleErrors.push(String(error)));

  await page.goto(`${NEXT}/clientDashboard/help-desk/tickets/${TICKET}`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector('[id^="msg-"]', { timeout: 30_000 });
  await page.waitForTimeout(1500);

  const rows = await page.evaluate(() => {
    return [...document.querySelectorAll('[id^="msg-"]')].map((node, index) => {
      const paras = [...node.querySelectorAll("p")]
        .map((p) => (p.textContent || "").replace(/\s+/g, " ").trim())
        .filter(Boolean);
      const label = node.querySelector("time");
      return {
        index,
        text: (paras[0] || node.innerText || "").replace(/\s+/g, " ").trim(),
        stamp: label?.textContent?.trim() ?? "",
      };
    });
  });

  await page.screenshot({ path: "/root/.hermes/cache/scratch/hd-dedupe.png", fullPage: false });
  await browser.close();

  for (const row of rows) console.log(`  ${row.index} ${row.stamp} | ${row.text.slice(0, 70)}`);

  const count = (needle) => rows.filter((row) => row.text.includes(needle)).length;
  const only = (needle, label) => {
    const seen = count(needle);
    check(seen === 1, `${label}: appears exactly once (found ${seen})`);
  };

  only("MARKER-A", "identical resend");
  only("MARKER-B", "reply + its email copy");
  check(count("MARKER-D") === 1, `different line 1: appears once (found ${count("MARKER-D")})`);
  check(count("MARKER-E") === 1, `different line 2: appears once (found ${count("MARKER-E")})`);
  const okRows = rows.filter((row) => row.text === "ok").length;
  check(okRows === 2, `a repeated short line is kept twice (found ${okRows})`);

  // The fuller text of the folded pair must survive, not the bare one.
  const bRow = rows.find((row) => row.text.includes("MARKER-B"));
  check(
    Boolean(bRow && bRow.text.includes("শিক্ষা চ্যাট সাপোর্ট")),
    "the folded pair keeps its fuller text (the signature)"
  );

  // Order: the printed stamps must not go backwards.
  // The portal prints Bengali digits (১২:৩৫:৪৬ PM), so normalise before parsing.
  const toAscii = (stamp) =>
    stamp.replace(/[\u09E6-\u09EF]/g, (digit) => String(digit.charCodeAt(0) - 0x09e6));
  const toMs = (stamp) => {
    const match = toAscii(stamp).match(/(\d{1,2}):(\d{2}):(\d{2})\s*(AM|PM)/i);
    if (!match) return null;
    let hour = Number(match[1]) % 12;
    if (/PM/i.test(match[4])) hour += 12;
    return hour * 3600 + Number(match[2]) * 60 + Number(match[3]);
  };
  const marks = rows.map((row) => toMs(row.stamp)).filter((value) => value !== null);
  const ascends = marks.length >= 5 && marks.every((value, index) => index === 0 || value >= marks[index - 1]);
  check(ascends, `the thread reads oldest first (${marks.length} stamps, never backwards)`);

  check(consoleErrors.length === 0, `no console error on the page (${consoleErrors.length})`);
  if (consoleErrors.length) console.log(consoleErrors.slice(0, 4).join("\n"));

  const failed = failures.length;
  console.log(`\n${failed === 0 ? "RESULT PASS" : `RESULT FAIL (${failed})`}`);
  process.exit(failed === 0 ? 0 : 1);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
