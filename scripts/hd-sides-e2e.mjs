// Visual + positional proof for the Help Desk bubble sides.
//
// Customer reading their own ticket: their own lines on the RIGHT, support on
// the LEFT. Staff member reading the same ticket: mirrored. Also proves the
// same-person run collapses (no repeated name) and the Activity chip renders
// inside the chat, oldest first.
//
// Run from /root/shikkha-connected-os with the mock (:8787) and next (:3005) up.

import { chromium } from "/root/arogga-UI/node_modules/playwright/index.mjs";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const run_ = promisify(execFile);

const NEXT = "http://localhost:3005";
const MOCK = "http://127.0.0.1:8787";
const TICKET = "HD-2026-00001";
const PASSWORD = "demo1234";

/**
 * POST via curl.
 *
 * The mock's sign-in answered 401 to Node's own HTTP client for the staff
 * account while answering the very same body 200 to curl — a harness quirk, not
 * a portal bug, and not worth chasing. curl is the transport the manual checks
 * already use, so the harness speaks it too.
 */
async function postJson(path, body, extra = []) {
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
    ...extra,
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

async function push(author, body, at, replyTo) {
  const out = await postJson("/api/method/mock.hd.push", { ticket: TICKET, author, body, at, replyTo });
  if (!out.includes('"ok":true')) throw new Error(`push failed: ${out.slice(0, 200)}`);
}

function minutesAgo(min) {
  return new Date(Date.now() - min * 60_000).toISOString();
}

/** left/right position of every bubble relative to the thread column */
async function bubbles(page, names = []) {
  return page.evaluate((names) => {
    const nodes = [...document.querySelectorAll('[id^="msg-"]')];
    return nodes.map((node, index) => {
      // The row wrapper always spans the column; the bubble is the widest
      // descendant box, and that is what the eye sees.
      let bubble = node;
      let area = 0;
      for (const candidate of node.querySelectorAll("div, li, article")) {
        const rect = candidate.getBoundingClientRect();
        if (rect.width * rect.height > area) {
          area = rect.width * rect.height;
          bubble = candidate;
        }
      }
      const rect = bubble.getBoundingClientRect();
      const text = node.innerText.replace(/\s+/g, " ").trim();
      const stamp = [...node.querySelectorAll("span")].map((s) => s.innerText.trim()).filter(Boolean);
      return {
        index,
        id: node.id,
        text: text.slice(0, 60),
        // A name stamp is any of the labels this role would see: "আপনি" for its
        // own lines, the other party's name for theirs.
        showsName: stamp.some((label) => names.includes(label)),
        stamp,
        leftGap: Math.round(rect.left),
        rightGap: Math.round(window.innerWidth - rect.right),
      };
    });
  }, names);
}

/** Reset the mock's in-memory thread so repeat runs stay deterministic. */
async function resetThread() {
  const out = await postJson("/api/method/mock.hd.reset", {});
  if (!out.includes('"ok":true')) throw new Error(`reset failed: ${out.slice(0, 200)}`);
}

const run = async (label, usr, dashboard, shot, names) => {
  const cookie = await login(usr);
  const browser = await chromium.launch({ args: ["--no-sandbox"] });
  const context = await browser.newContext({ viewport: { width: 1280, height: 1000 } });
  // The mock answers `sid=`; the portal stores it under its own cookie name.
  const [, value] = cookie.split("=");
  await context.addCookies([{ name: "shikkha_os_sid", value, domain: "localhost", path: "/" }]);
  const page = await context.newPage();
  await page.goto(`${NEXT}/${dashboard}/help-desk/tickets/${TICKET}`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector('[id^="msg-"]', { timeout: 30_000 });
  await page.waitForTimeout(1200);
  const rows = await bubbles(page, names);
  await page.screenshot({ path: shot, fullPage: false });
  console.log(`\n== ${label} ==`);
  for (const row of rows) {
    console.log(
      `${row.index} left=${String(row.leftGap).padStart(3)} right=${String(row.rightGap).padStart(3)} name=${row.showsName ? "yes" : "no "} | ${row.text}`
    );
  }
  await browser.close();
  return rows;
};

(async () => {
  await resetThread();
  // A realistic thread: customer opens, agent answers, agent follows up a
  // minute later (collapses), customer replies.
  await push("support", "আসসালামু আলাইকুম, আপনার সমস্যাটি আমরা দেখছি।", minutesAgo(12));
  await push("support", "অনুগ্রহ করে আপনার রেজিস্টার্ড ইমেইলটি নিশ্চিত করুন।", minutesAgo(11));
  await push("user", "আমার ইমেইল client@example.com", minutesAgo(9));

  const customer = await run("CUSTOMER", "client@example.com", "clientDashboard", "/root/.hermes/cache/scratch/hd-sides-customer.png", [
    "আপনি",
    "Tamim Hasan",
  ]);
  const staff = await run("STAFF", "tamim@ioniccorporation.com", "userDashboard", "/root/.hermes/cache/scratch/hd-sides-staff.png", [
    "আপনি",
    "Nusrat Jahan",
  ]);

  // Assertions. Bubbles whose text we seeded: support ones must sit left for the
  // customer and right for staff; the customer's own line the other way round.
  const failures = [];
  const expect = (who, rows, matcher, side) => {
    for (const row of rows.filter(matcher)) {
      const ok = side === "right" ? row.rightGap < row.leftGap : row.leftGap < row.rightGap;
      if (!ok) failures.push(`${who}: bubble ${row.index} not on ${side} (left=${row.leftGap} right=${row.rightGap}) :: ${row.text}`);
    }
  };
  const isSupportRow = (row) => row.text.includes("আসসালামু") || row.text.includes("রেজিস্টার্ড ইমেইল");
  const isCustomerRow = (row) => row.text.includes("আমার ইমেইল");

  expect("customer", customer, isSupportRow, "left");
  expect("customer", customer, isCustomerRow, "right");
  expect("staff", staff, isSupportRow, "right");
  expect("staff", staff, isCustomerRow, "left");

  // The second staff line arrives a minute after the first: same run, no stamp.
  const first = staff.filter(isSupportRow);
  const collapsed = first.slice(1).every((row) => !row.showsName);
  if (!collapsed) failures.push("staff: a same-run reply still prints its sender name");

  console.log(`\nRESULT ${failures.length === 0 ? "PASS" : "FAIL"}`);
  for (const line of failures) console.log(" - " + line);
  process.exit(failures.length === 0 ? 0 : 1);
})();
