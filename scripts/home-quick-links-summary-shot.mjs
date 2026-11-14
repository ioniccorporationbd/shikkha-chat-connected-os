// Proves the staff home rail's কুইক লিংক panel now shows the leads/tasks summary
// (same numbers the Leads page shows) while keeping the existing tile UI.
//   node scripts/mock-frappe.mjs 2>&1 | tee -a /tmp/mock_frappe.log
//   FRAPPE_BASE_URL=http://127.0.0.1:8787 npx next start -p 3011
//   E2E_BASE=http://localhost:3011 MOCK_BASE=http://127.0.0.1:8787 \
//     node scripts/home-quick-links-summary-shot.mjs
import { chromium } from "/root/arogga-UI/node_modules/playwright/index.mjs";
import { execFile } from "node:child_process";
import { existsSync, readFileSync, mkdirSync } from "node:fs";
import { promisify } from "node:util";

const run_ = promisify(execFile);
const NEXT = process.env.E2E_BASE ?? "http://localhost:3011";
const MOCK = process.env.MOCK_BASE ?? "http://127.0.0.1:8787";
const PASSWORD = process.env.MOCK_PASSWORD ?? "demo1234";
const MOCK_SRC = readFileSync(new URL("./mock-frappe.mjs", import.meta.url), "utf8");
const STAFF_USR =
  process.env.MOCK_USER ??
  MOCK_SRC.match(/"([a-z0-9.@]+@[a-z0-9.]+)"\s*:\s*\{\s*\n\s*password/)?.[1] ??
  "tamim@ionicorporation.com";
const OUT = process.env.OUT_DIR ?? "/root/.hermes/cache/scratch";
mkdirSync(OUT, { recursive: true });

const failures = [];
const check = (ok, msg) => {
  console.log(`${ok ? "PASS" : "FAIL"} ${msg}`);
  if (!ok) failures.push(msg);
};

async function login() {
  const { stdout } = await run_("curl", [
    "-s", "-m", "10", "-D", "-", "-X", "POST",
    "-H", "content-type: application/json",
    "-d", JSON.stringify({ usr: STAFF_USR, pwd: PASSWORD }),
    `${MOCK}/api/method/shikkha_os.api.v1.auth.login`,
  ]);
  const cookie = stdout
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.toLowerCase().startsWith("set-cookie: sid="))
    .map((l) => l.slice("set-cookie: ".length).split(";")[0])
    .pop();
  if (!cookie) throw new Error(`login failed: ${stdout.slice(0, 200)}`);
  return cookie.split("=")[1];
}

async function api(sid, path) {
  const { stdout } = await run_("curl", [
    "-s", "-m", "15", "-H", `cookie: shikkha_os_sid=${sid}`, `${NEXT}${path}`,
  ]);
  return JSON.parse(stdout);
}

const BN_DIGITS = "০১২৩৪৫৬৭৮৯";
const toBn = (n) =>
  String(n).replace(/[0-9]/g, (d) => BN_DIGITS[Number(d)]);
const fmt = (n, lang) => new Intl.NumberFormat(lang === "en" ? "en-BD" : "bn-BD").format(n);

(async () => {
  const sid = await login();

  // What the Leads page itself reports — the numbers the rail must echo.
  const leadsPayload = await api(sid, "/api/leads?language=bn&mine=1&limit=200");
  const tasksPayload = await api(sid, "/api/leads/tasks?language=bn&mine=1&window=today");
  const summary = tasksPayload.data?.summary ?? tasksPayload.summary;
  const leadRows = leadsPayload.data?.leads ?? leadsPayload.leads;
  if (!summary) throw new Error(`tasks payload: ${JSON.stringify(tasksPayload).slice(0, 300)}`);
  if (!leadRows) throw new Error(`leads payload: ${JSON.stringify(leadsPayload).slice(0, 300)}`);
  const leadCount = leadRows.length;
  console.log(`leads=${leadCount} today=${summary.today} week=${summary.week} overdue=${summary.overdue} done=${summary.completed_week}`);

  const chromePath =
    process.env.PW_CHROME ?? "/root/.cache/ms-playwright/chromium-1254/chrome-linux64/chrome";
  const browser = await chromium.launch({
    ...(existsSync(chromePath) ? { executablePath: chromePath } : {}),
    args: ["--no-sandbox"],
  });

  for (const language of ["bn", "en"]) {
    console.log(`\n== ${language} ==`);
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 2 });
    await context.addCookies([
      { name: "shikkha_os_sid", value: sid, domain: "localhost", path: "/" },
      { name: "shikkha-chat-site-language", value: language, domain: "localhost", path: "/" },
    ]);
    const page = await context.newPage();
    const errors = [];
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
    page.on("pageerror", (e) => errors.push(String(e)));
    await page.addInitScript((lang) => localStorage.setItem("shikkha-chat-site-language", lang), language);

    await page.goto(`${NEXT}/userDashboard`, { waitUntil: "domcontentloaded", timeout: 120000 });
    const panel = page.locator('[data-panel="quick-links"]');
    await panel.waitFor({ state: "visible", timeout: 90000 });

    // The tiles only replace the desk shortcuts once the summary fetch lands.
    await page
      .locator('[data-panel="quick-links"] li', { hasText: language === "en" ? "My leads" : "আমার লিড" })
      .first()
      .waitFor({ state: "visible", timeout: 45000 });

    const tiles = await panel.evaluate((root) =>
      Array.from(root.querySelectorAll("li a")).map((a) => ({
        label: (a.querySelector("span span:nth-child(1)")?.textContent ?? "").trim(),
        description: (a.querySelector("span span:nth-child(2)")?.textContent ?? "").trim(),
        href: a.getAttribute("href") ?? "",
        icon: Boolean(a.querySelector("span svg")),
      })),
    );

    check(tiles.length === 5, `[${language}] rail shows 5 summary tiles (got ${tiles.length})`);
    check(tiles.every((t) => t.href.endsWith("/userDashboard/leads")), `[${language}] every tile opens the Leads page`);
    check(tiles.every((t) => t.icon), `[${language}] every tile keeps its icon square`);

    const expectation = [
      {
        label: language === "en" ? "My leads" : "আমার লিড",
        needle: fmt(leadCount, language),
      },
      {
        label: language === "en" ? "Today's tasks" : "আজকের টাস্ক",
        needle: fmt(summary.today, language),
      },
      {
        label: language === "en" ? "Next 7 days' tasks" : "পরবর্তী ৭ দিনের টাস্ক",
        needle: fmt(summary.week, language),
      },
      {
        label: language === "en" ? "Overdue tasks" : "ওভারডিউ টাস্ক",
        needle: fmt(summary.overdue, language),
      },
      {
        label: language === "en" ? "Completed (this week)" : "সম্পন্ন (এই সপ্তাহ)",
        needle: fmt(summary.completed_week, language),
      },
    ];

    for (const want of expectation) {
      const tile = tiles.find((t) => t.label === want.label);
      check(Boolean(tile), `[${language}] tile "${want.label}" present`);
      if (tile) {
        check(
          tile.description.includes(want.needle),
          `[${language}] "${want.label}" shows the Leads-page count ${want.needle} (got "${tile.description}")`,
        );
      }
    }

    const hint = (await panel.locator("p").first().innerText().catch(() => "")) ?? "";
    const hubText = await panel.innerText();
    check(
      language === "en"
        ? hubText.includes("A summary of your leads and tasks")
        : hubText.includes("আপনার লিড ও টাস্কের সারসংক্ষেপ"),
      `[${language}] panel hint now describes the summary (${hint.slice(0, 40)})`,
    );

    await panel.scrollIntoViewIfNeeded();
    await panel.screenshot({ path: `${OUT}/home-quick-links-${language}.png` }).catch(async () => {
      await page.screenshot({ path: `${OUT}/home-quick-links-${language}.png`, fullPage: true });
    });

    check(errors.length === 0, `[${language}] home console clean (${errors.slice(0, 2).join(" | ")})`);
    await context.close();
  }

  await browser.close();
  console.log(failures.length === 0 ? "ALL CHECKS PASSED" : `FAILURES: ${failures.length}`);
  process.exit(failures.length === 0 ? 0 : 1);
})().catch((e) => {
  console.error("RUN ERROR:", e);
  process.exit(2);
});
