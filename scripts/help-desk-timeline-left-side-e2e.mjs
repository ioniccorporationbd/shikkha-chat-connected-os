// The chat card must draw both sides of a ticket: whatever the
// "সম্পূর্ণ কথোপকথন টাইমলাইন" card below it lists as a সাপোর্ট টিম row has to
// appear as a bubble inside শিক্ষা চ্যাট সাপোর্ট, on the team's side (left for a
// customer), and only once.
//
// Ticket 0975 is the live shape that broke this: its message rows arrived as
// `{id: "", rawStamp: ""}` (the ERP Error Log caught all three), so a chat that
// asked "is this id already in the room?" had a blank in its id set and every
// equally-blank trail row read as already drawn — the left side stayed empty
// while the timeline listed the replies.
//
// The probe checks, per locale (bn + en):
//   * the payload's own rule: the old id test folds 0 Support rows, the new one
//     folds every one of them;
//   * every Support row's words appear inside [data-hd="thread"] exactly once;
//   * those bubbles sit on the LEFT half of the card, the customer's on the right;
//   * [data-hd="activity"] lists the same rows (the two cards agree);
//   * a 0975 that has no console error;
//   * a normal thread (0472) keeps every message, nothing lost, nothing doubled.
//
// Run with the mock (:8787) and next (:3011) up:
//   E2E_BASE=http://localhost:3011 node scripts/help-desk-timeline-left-side-e2e.mjs

import { chromium } from "/root/arogga-UI/node_modules/playwright/index.mjs";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const run_ = promisify(execFile);

const NEXT = process.env.E2E_BASE ?? "http://localhost:3011";
const MOCK = process.env.MOCK_BASE ?? "http://127.0.0.1:8787";
const USR = process.env.MOCK_USER ?? "client@example.com";
const PASSWORD = process.env.MOCK_PASSWORD ?? "demo1234";
const SHOTS = "/root/.hermes/cache/scratch";

const TARGET = "0975";
const PLAIN = "0472";

const failures = [];
function check(ok, message) {
  console.log(`${ok ? "PASS" : "FAIL"} ${message}`);
  if (!ok) failures.push(message);
}

async function loginOnce() {
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
    JSON.stringify({ usr: USR, pwd: PASSWORD }),
    `${MOCK}/api/method/shikkha_os.api.v1.auth.login`,
  ]);
  const cookie = stdout
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.toLowerCase().startsWith("set-cookie: sid="))
    .map((line) => line.slice("set-cookie: ".length).split(";")[0])
    .pop();
  if (!cookie) throw new Error(`login failed for ${USR}: ${stdout.slice(0, 200)}`);
  return cookie.split("=")[1];
}

async function login() {
  let last;
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    try {
      return await loginOnce();
    } catch (error) {
      last = error;
      await new Promise((resolve) => setTimeout(resolve, 400));
    }
  }
  throw last;
}

async function payloadFor(sid, ticket) {
  const { stdout } = await run_("curl", [
    "-s",
    "-m",
    "15",
    "-H",
    `Cookie: shikkha_os_sid=${sid}`,
    `${NEXT}/api/help-desk/conversations/${ticket}`,
  ]);
  const parsed = JSON.parse(stdout);
  const body = parsed?.data ?? parsed?.message?.data ?? parsed?.message ?? parsed;
  if (!body?.timeline) throw new Error(`no timeline for ${ticket}: ${stdout.slice(0, 300)}`);
  return body;
}

const norm = (value) => String(value ?? "").replace(/\s+/g, " ").trim();

/** Support rows that carry words and belong in the room (not markers). */
function supportTrailRows(payload) {
  return (payload.timeline ?? []).filter(
    (row) =>
      row.author === "support" &&
      ["message", "requirement", "resolution"].includes(row.type) &&
      norm(row.text),
  );
}

/** How many of those rows the fold picks up, given an id set. */
function folded(payload, rows, ids) {
  const room = new Set(
    (payload.messages ?? []).map((message) => `${message.author}|${norm(message.body)}`),
  );
  return rows.filter(
    (row) => !ids.has(String(row.id ?? "").trim()) && !room.has(`${row.author}|${norm(row.text)}`),
  );
}

async function openTicket(page, ticket, language) {
  await page.context().addCookies([
    { name: "shikkha-chat-site-language", value: language, domain: "localhost", path: "/" },
    { name: "shikkha_os_sid", value: sid, domain: "localhost", path: "/", httpOnly: true },
  ]);
  await page.goto(`${NEXT}/clientDashboard/help-desk/tickets/${ticket}`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector('[data-hd="thread"]', { timeout: 20000 });
  await page.waitForTimeout(900);
}

/** Every bubble in the chat card, with its side, read from geometry. */
async function bubbles(page) {
  return page.evaluate(() => {
    const card = document.querySelector('[data-hd="thread"]');
    if (!card) return null;
    const box = card.getBoundingClientRect();
    const mid = box.left + box.width / 2;
    const rows = [];
    const seen = new Set();
    for (const node of card.querySelectorAll("p, span, div")) {
      const text = (node.innerText || "").replace(/\s+/g, " ").trim();
      if (!text || text.length > 220) continue;
      if (node.querySelector("p, div")) continue;
      if (seen.has(text)) continue;
      const rect = node.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) continue;
      seen.add(text);
      rows.push({
        text,
        // A right-hand bubble's own box starts past the middle of the card.
        side: rect.left + rect.width / 2 > mid ? "right" : "left",
      });
    }
    return { mid, rows };
  });
}

async function activityText(page) {
  return page.evaluate(() => {
    const card = document.querySelector('[data-hd="activity"]');
    return card ? (card.innerText || "").replace(/\s+/g, " ").trim() : null;
  });
}

/** Count non-overlapping occurrences of `needle` in `haystack`. */
function countOf(haystack, needle) {
  if (!needle) return 0;
  let count = 0;
  let from = 0;
  for (;;) {
    const at = haystack.indexOf(needle, from);
    if (at === -1) break;
    count += 1;
    from = at + needle.length;
  }
  return count;
}

const sid = await login();

async function clientLog() {
  const { stdout } = await run_("curl", ["-s", "-m", "10", `${MOCK}/__mock/client-log`]);
  return JSON.parse(stdout)?.entries ?? [];
}

// The mock keeps every report since it started; only what this run adds counts.
const logBaseline = (await clientLog()).length;

const payload = await payloadFor(sid, TARGET);
const supportRows = supportTrailRows(payload);

// --- 1. The payload's own rule: blank ids must not claim membership ----------
console.log(`\n== ${TARGET} payload (${supportRows.length} Support trail rows) ==`);
check(supportRows.length >= 2, "the payload lists the Support team's rows in the timeline");

const blankIds = (payload.messages ?? []).filter((message) => !String(message.id ?? "").trim()).length;
check(blankIds > 0, `the payload hands over ${blankIds} message row(s) with no id (the live shape)`);

const oldSet = new Set((payload.messages ?? []).map((message) => message.id));
const newSet = new Set(
  (payload.messages ?? []).map((message) => String(message.id ?? "").trim()).filter(Boolean),
);
const oldFold = folded(payload, supportRows, oldSet);
const newFold = folded(payload, supportRows, newSet);
check(
  oldFold.length === 0,
  `the old id test drops every Support row (${oldFold.length} folded) — this was the bug`,
);
check(
  newFold.length === supportRows.length,
  `the new id test folds all ${newFold.length}/${supportRows.length} Support rows into the room`,
);

// --- 2. The page itself, per locale -----------------------------------------
const browser = await chromium.launch({ args: ["--no-sandbox"] });

for (const language of ["bn", "en"]) {
  console.log(`\n== ${TARGET} @ ${language} ==`);
  const context = await browser.newContext({ viewport: { width: 420, height: 900 }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  const consoleErrors = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => consoleErrors.push(String(error)));

  await openTicket(page, TARGET, language);
  const shot = `${SHOTS}/help-desk-0975-left-${language}.png`;
  await page.screenshot({ path: shot, fullPage: true });

  const read = await bubbles(page);
  check(Boolean(read), `[${language}] the chat card renders`);
  const texts = (read?.rows ?? []).map((row) => row.text);
  const plate = texts.join(" \n ");

  for (const row of supportRows) {
    const words = norm(row.text);
    check(countOf(plate, words) === 1, `[${language}] chat shows "${words.slice(0, 34)}…" exactly once`);
    const bubble = (read?.rows ?? []).find((entry) => entry.text.includes(words.slice(0, 24)));
    check(Boolean(bubble), `[${language}] the row found its bubble`);
    if (bubble) {
      check(bubble.side === "left", `[${language}] "${words.slice(0, 24)}…" sits on the LEFT side (was ${bubble.side})`);
    }
  }

  for (const message of payload.messages ?? []) {
    const words = norm(message.body);
    if (!words) continue;
    const bubble = (read?.rows ?? []).find((entry) => entry.text.includes(words.slice(0, 24)));
    if (bubble) check(bubble.side === "right", `[${language}] customer row "${words.slice(0, 24)}…" stays on the right`);
  }

  const trail = await activityText(page);
  check(Boolean(trail), `[${language}] the timeline card renders`);
  for (const row of supportRows) {
    check(countOf(trail ?? "", norm(row.text)) === 1, `[${language}] timeline lists it too, once`);
  }
  // The one console line allowed here is the stamp watchdog: the seeded rows
  // carry no clock at all (the live 0975 shape), and the card reports that to
  // the ERP Error Log on purpose. Anything else is a real error.
  const unexpected = consoleErrors.filter((line) => !line.includes("rows without a usable timestamp"));
  check(
    unexpected.length === 0,
    `[${language}] no unexpected console error${unexpected.length ? `: ${unexpected[0].slice(0, 120)}` : ""}`,
  );

  if (language === "bn") {
    // The stamp watchdog also files itself in the ERP Error Log. The seeded rows
    // carry no clock at all — 0975's live shape — so the log must now hold that
    // one report, and nothing else for this page.
    const entries = (await clientLog()).slice(logBaseline);
    const stampReports = entries.filter((entry) => entry.message.includes("rows without a usable timestamp"));
    check(stampReports.length === 1, `the ERP Error Log received the stamp report once (${stampReports.length})`);
    check(
      Boolean(stampReports[0]?.message.includes(TARGET)),
      `the report names ticket ${TARGET}: ${String(stampReports[0]?.message ?? "").slice(0, 80)}`,
    );
    const others = entries.filter(
      (entry) => !entry.message.includes("rows without a usable timestamp") && entry.email === USR,
    );
    check(others.length === 0, `no other error was logged for this page (${others.length})`);
  }

  await context.close();
}

// --- 3. A plain thread keeps every row, nothing doubled ----------------------
console.log(`\n== ${PLAIN} regression ==`);
const plainPayload = await payloadFor(sid, PLAIN);
const plainContext = await browser.newContext({ viewport: { width: 420, height: 900 }, deviceScaleFactor: 1 });
const plainPage = await plainContext.newPage();
await openTicket(plainPage, PLAIN, "bn");
const plainRead = await bubbles(plainPage);
const plainPlate = (plainRead?.rows ?? []).map((row) => row.text).join(" \n ");
let kept = 0;
for (const message of plainPayload.messages ?? []) {
  const words = norm(message.body);
  if (!words) continue;
  const count = countOf(plainPlate, words);
  if (count === 1) kept += 1;
  else check(false, `plain thread row "${words.slice(0, 30)}…" appears ${count} time(s)`);
}
check(kept > 0, `the plain thread still shows all ${kept} of its messages exactly once`);
await plainPage.screenshot({ path: `${SHOTS}/help-desk-0472-regression.png`, fullPage: true });
await plainContext.close();

await browser.close();

console.log(`\n${failures.length === 0 ? "ALL PASS" : `${failures.length} FAILURE(S)`}`);
if (failures.length) {
  for (const failure of failures) console.log(` - ${failure}`);
  process.exitCode = 1;
}
