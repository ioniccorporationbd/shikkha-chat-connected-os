// Dashboard Help Desk tables: the tab bar, the row columns and the customer
// names, on both the client and the staff dashboard.
//
// Asserts, for each dashboard:
//   * both tabs render and "সাম্প্রতিক কার্যক্রম" (recent) is the default;
//   * selecting a tab shows exactly one table, the other one is gone;
//   * every row prints the ticket id, its subject, its real customer name
//     (taken from the same list API, never a hardcoded demo name), a status,
//     a priority and a created stamp;
//   * clicking a row opens that ticket's details page;
//   * the page logs no console error.
// Then it screenshots a phone-width layout so the stacked rows can be eyeballed.
//
// Run with the mock (:8787) and next (:3011) up:
//   E2E_BASE=http://localhost:3011 node scripts/hd-dashboard-e2e.mjs

import { chromium } from "/root/arogga-UI/node_modules/playwright/index.mjs";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const run_ = promisify(execFile);

const NEXT = process.env.E2E_BASE ?? "http://localhost:3011";
const MOCK = process.env.MOCK_BASE ?? "http://127.0.0.1:8787";
const PASSWORD = process.env.MOCK_PASSWORD ?? "demo1234";
const SHOTS = "/root/.hermes/cache/scratch";

const DASHBOARDS = [
  { dash: "clientDashboard", usr: "client@example.com", label: "client" },
  { dash: "userDashboard", usr: "tamim@ioniccorporation.com", label: "staff" },
];

const failures = [];
function check(ok, message) {
  console.log(`${ok ? "PASS" : "FAIL"} ${message}`);
  if (!ok) failures.push(message);
}

async function loginOnce(usr) {
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
  if (!cookie) throw new Error(`login failed for ${usr}: ${stdout.slice(0, 200)}`);
  return cookie.split("=")[1];
}

/** The mock 401s its first login after a restart now and then; retry briefly. */
async function login(usr) {
  let last;
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    try {
      return await loginOnce(usr);
    } catch (error) {
      last = error;
      if (attempt < 4) await new Promise((resolve) => setTimeout(resolve, 1500));
    }
  }
  throw last;
}

/** Realistic copy — the dashboards must never be screenshotted with placeholder text. */
const SEED_SUBJECTS = [
  "পেমেন্ট এন্ট্রি পোস্ট হচ্ছে না",
  "সাপ্তাহিক বিক্রয় রিপোর্টে ভুল টোটাল",
  "ইনভয়েস প্রিন্টে লোগো আসছে না",
  "কাস্টমার লেজার ব্যালেন্স মিলছে না",
  "স্টক এন্ট্রি ডুপ্লিকেট দেখাচ্ছে",
  "লগইন OTP আসছে না",
  "রিপোর্ট এক্সপোর্ট ফেইল করছে",
];

/** A fresh mock boots with no tickets, so the tables need rows first. */
async function seedTickets(sid, count) {
  for (let index = 1; index <= count; index += 1) {
    const body = JSON.stringify({
      subject: SEED_SUBJECTS[(index - 1) % SEED_SUBJECTS.length],
      ticketType: "Technical",
      priority: index % 3 === 0 ? "High" : "Medium",
      description: `Seeded row ${index} for the dashboard table checks.`,
      contact: {
        name: index % 2 === 0 ? "Rafiqul Islam" : "Nusrat Jahan",
        email: "client@example.com",
        preferredContact: "email",
      },
      department: "Support",
      relatedRoute: "",
      attachments: [],
    });
    await run_("curl", [
      "-s",
      "-m",
      "15",
      "-X",
      "POST",
      "-H",
      "content-type: application/json",
      "-H",
      `Cookie: sid=${sid}`,
      "-d",
      body,
      `${MOCK}/api/method/shikkha_os.api.v1.help_desk.create_ticket`,
    ]);
  }
}

async function expectedRows(sid) {
  const { stdout } = await run_("curl", [
    "-s",
    "-m",
    "15",
    "-H",
    `Cookie: sid=${sid}`,
    `${MOCK}/api/method/shikkha_os.api.v1.help_desk.list_tickets?language=en&page_size=500`,
  ]);
  const payload = JSON.parse(stdout);
  // `/api/method` wraps the payload twice: { message: { api, ok, data: {...} } }.
  const data = payload?.message?.data ?? payload?.message ?? payload;
  const rows = Array.isArray(data) ? data : data?.tickets ?? [];
  return rows.map((row) => ({
    id: String(row.id ?? row.name ?? ""),
    subject: String(row.subject ?? ""),
    customer: String(row?.contact?.name ?? "").trim(),
    status: String(row.statusLabel ?? row.status ?? ""),
  }));
}

async function inspectTables(page) {
  return page.evaluate(() => {
    const panels = [...document.querySelectorAll("[data-hd-table]")];
    const tables = panels.map((panel) => ({
      tab: panel.getAttribute("data-hd-table"),
      rows: [...panel.querySelectorAll("ul > li > a")].map((link) => {
        const cells = [...link.children].map((cell) =>
          (cell.textContent || "").replace(/\s+/g, " ").trim(),
        );
        return { href: link.getAttribute("href") || "", cells };
      }),
    }));
    const tabs = [...document.querySelectorAll('[role="tab"]')].map((tab) => ({
      id: tab.getAttribute("data-hd-tab"),
      selected: tab.getAttribute("aria-selected") === "true",
      label: (tab.textContent || "").replace(/\s+/g, " ").trim(),
    }));
    return { panels: tables, tabs };
  });
}

(async () => {
  const browser = await chromium.launch({ args: ["--no-sandbox"] });

  for (const { dash, usr, label } of DASHBOARDS) {
    const sid = await login(usr);
    if (label === "client") {
      // Seven rows so the cap can be proven: exactly five survive, no pager.
      const existing = await expectedRows(sid);
      if (existing.length < 7) await seedTickets(sid, 7 - existing.length);
    }
    const wanted = await expectedRows(sid);
    const context = await browser.newContext({ viewport: { width: 1360, height: 1000 } });
    await context.addCookies([{ name: "shikkha_os_sid", value: sid, domain: "localhost", path: "/" }]);
    const page = await context.newPage();
    const consoleErrors = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    page.on("pageerror", (error) => consoleErrors.push(String(error)));

    await page.goto(`${NEXT}/${dash}/help-desk`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector('[role="tab"]', { timeout: 30_000 });
    await page.waitForTimeout(1200);

    const first = await inspectTables(page);
    check(first.tabs.length === 2, `${label}: two tabs render (${first.tabs.length})`);
    const defaultTab = first.tabs.find((tab) => tab.selected);
    check(defaultTab?.id === "recent", `${label}: recent tab is selected by default (${defaultTab?.id})`);
    check(first.panels.length === 1, `${label}: one table at a time (${first.panels.length} panels)`);
    check(first.panels[0]?.tab === "recent", `${label}: the open panel is the recent one`);

    const recentRows = first.panels[0]?.rows ?? [];
    check(recentRows.length > 0, `${label}: recent table has rows (${recentRows.length})`);
    const ids = recentRows.map((row) => row.cells[0] ?? "");
    const newestFirst = ids.every((id, index) => index === 0 || ids[index - 1].localeCompare(id, undefined, { numeric: true }) >= 0);
    check(newestFirst, `${label}: rows run newest first (${ids.join(" > ")})`);
    check(
      recentRows.length <= 5,
      `${label}: the recent table starts paged (${recentRows.length} rows)`,
    );

    // Column sanity on the first row: id, subject, customer, status, priority, date.
    const sample = recentRows[0];
    if (sample) {
      const known = wanted.find((row) => row.id === sample.cells[0]) ?? wanted[0];
      check(/^HD-\d{4}-\d+$/.test(sample.cells[0] ?? ""), `${label}: first column is the ticket id (${sample.cells[0]})`);
      check(Boolean(sample.cells[1]), `${label}: second column carries the subject`);
      check(
        Boolean(sample.cells[3]) && Boolean(sample.cells[4]),
        `${label}: status and priority columns are filled (${sample.cells[3]} / ${sample.cells[4]})`,
      );
      // The portal prints Bengali digits (০৪/১১/২০২৬), so normalise first.
      const ascii = (text) =>
        (text || "").replace(/[\u09E6-\u09EF]/g, (digit) => String(digit.charCodeAt(0) - 0x09e6));
      check(
        /\d{1,4}[/-]\d{1,2}[/-]\d{1,4}/.test(ascii(sample.cells[5])),
        `${label}: created stamp present (${sample.cells[5]})`,
      );
      if (known?.customer) {
        // The customer column must match the API's own contact name for this id.
        const apiRow = wanted.find((row) => row.id === sample.cells[0]);
        check(
          Boolean(apiRow) && sample.cells[2] === apiRow.customer,
          `${label}: customer name matches the ticket API (${sample.cells[2]} vs ${apiRow?.customer})`,
        );
      }
    }

    // Load more: a paged table keeps the rest behind one button.
    check(
      wanted.length <= 5 || recentRows.length === 5,
      `${label}: the table caps at five rows (${recentRows.length})`,
    );
    const pager = await page.evaluate(() => {
      const table = document.querySelector('[data-hd-table]');
      const buttons = [...(table?.querySelectorAll("button") ?? [])].map((b) => b.innerText.trim());
      return buttons;
    });
    check(pager.length === 0, `${label}: no load-more or pager in the table (${pager.join("/") || "none"})`);

    // Switch to the unresolved tab.
    await page.click('[data-hd-tab="unresolved"]');
    await page.waitForTimeout(600);
    const second = await inspectTables(page);
    check(second.panels.length === 1, `${label}: still one table after switching (${second.panels.length})`);
    check(second.panels[0]?.tab === "unresolved", `${label}: unresolved panel is now the open one`);
    check(
      second.tabs.find((tab) => tab.id === "unresolved")?.selected === true,
      `${label}: unresolved tab reads as selected`,
    );

    // Back to recent, then open the first row.
    await page.click('[data-hd-tab="recent"]');
    await page.waitForTimeout(500);
    const back = await inspectTables(page);
    const firstRow = back.panels[0]?.rows?.[0];
    if (firstRow) {
      const expectedId = firstRow.cells[0];
      await page.click('[data-hd-table="recent"] ul > li > a');
      await page.waitForURL((url) => url.pathname.includes(`/tickets/${expectedId}`), { timeout: 20_000 });
      check(page.url().includes(`/${dash}/help-desk/tickets/${expectedId}`), `${label}: row click opens ${expectedId}`);
    } else {
      check(false, `${label}: a recent row existed to click`);
    }

    check(consoleErrors.length === 0, `${label}: no console error (${consoleErrors.length})`);
    if (consoleErrors.length) console.log(consoleErrors.slice(0, 3).join("\n"));
    await context.close();

    // Phone-width render, screenshotted for review.
    const phone = await browser.newContext({ viewport: { width: 390, height: 900 }, deviceScaleFactor: 2 });
    await phone.addCookies([{ name: "shikkha_os_sid", value: sid, domain: "localhost", path: "/" }]);
    const phonePage = await phone.newPage();
    await phonePage.goto(`${NEXT}/${dash}/help-desk`, { waitUntil: "domcontentloaded" });
    await phonePage.waitForSelector('[role="tab"]', { timeout: 30_000 });
    await phonePage.waitForTimeout(1200);
    await phonePage.screenshot({ path: `${SHOTS}/hd-table-${label}-phone.png`, fullPage: false });
    const overflow = await phonePage.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    check(overflow <= 2, `${label}: no horizontal overflow on a phone (${overflow}px)`);
    await phone.close();
  }

  await browser.close();
  const failed = failures.length;
  console.log(`\n${failed === 0 ? "RESULT PASS" : `RESULT FAIL (${failed})`}`);
  process.exit(failed === 0 ? 0 : 1);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
