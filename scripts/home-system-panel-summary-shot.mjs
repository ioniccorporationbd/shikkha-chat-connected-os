// Proves the staff home rail's সিস্টেম panel now summarises the employee's
// Expense Claims (same numbers the /userDashboard/expense-claim page shows),
// while the panel's row UI stays exactly as before.
//   node scripts/mock-frappe.mjs 2>&1 | tee -a /tmp/mock_frappe.log
//   FRAPPE_BASE_URL=http://127.0.0.1:8787 npx next start -p 3011
//   E2E_BASE=http://localhost:3011 MOCK_BASE=http://127.0.0.1:8787 \
//     node scripts/home-system-panel-summary-shot.mjs
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

const fmt = (n, lang) => new Intl.NumberFormat(lang === "en" ? "en-BD" : "bn-BD").format(n);

(async () => {
  const sid = await login();

  // What the Expense Claim page itself reports — the numbers the rail must echo.
  const claimPayload = await api(sid, "/api/expense-claim?language=bn");
  const summary = claimPayload.data?.summary ?? claimPayload.summary;
  if (!summary) throw new Error(`expense payload: ${JSON.stringify(claimPayload).slice(0, 300)}`);
  console.log(
    `total=${summary.total} draft=${summary.draft} approved=${summary.approved} paid=${summary.paid} claimed=${summary.total_claimed_amount} sanctioned=${summary.total_sanctioned_amount} reimbursed=${summary.total_amount_reimbursed}`,
  );

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
    ]);
    const page = await context.newPage();
    const errors = [];
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
    page.on("pageerror", (e) => errors.push(String(e)));
    await page.addInitScript((lang) => localStorage.setItem("shikkha-chat-site-language", lang), language);

    await page.goto(`${NEXT}/userDashboard`, { waitUntil: "domcontentloaded", timeout: 120000 });
    const panel = page.locator('[data-panel="system"]');
    await panel.waitFor({ state: "visible", timeout: 90000 });

    const firstLabel = language === "en" ? "Total claims" : "মোট ক্লেম";
    await panel
      .locator("dt", { hasText: firstLabel })
      .first()
      .waitFor({ state: "visible", timeout: 45000 });

    const rows = await panel.evaluate((root) =>
      Array.from(root.querySelectorAll("dl > div")).map((row) => ({
        label: (row.querySelector("dt")?.textContent ?? "").trim(),
        value: (row.querySelector("dd")?.textContent ?? "").trim(),
      })),
    );
    console.log(rows.map((r) => `${r.label} = ${r.value}`).join(" | "));

    const expect = [
      { label: language === "en" ? "Total claims" : "মোট ক্লেম", needle: fmt(summary.total, language) },
      { label: language === "en" ? "Claimed" : "মোট দাবি", needle: fmt(summary.total_claimed_amount, language) },
      { label: language === "en" ? "Draft" : "ড্রাফট", needle: fmt(summary.draft, language) },
      { label: language === "en" ? "Approved" : "অনুমোদিত", needle: fmt(summary.total_sanctioned_amount, language) },
      { label: language === "en" ? "Paid" : "পরিশোধিত", needle: fmt(summary.total_amount_reimbursed, language) },
    ];

    check(rows.length === expect.length, `[${language}] panel has ${expect.length} summary rows (got ${rows.length})`);
    for (const want of expect) {
      const row = rows.find((r) => r.label === want.label);
      check(Boolean(row), `[${language}] row "${want.label}" present`);
      if (row) {
        check(
          row.value.includes(want.needle),
          `[${language}] "${want.label}" shows the expense-page number ${want.needle} (got "${row.value}")`,
        );
      }
    }

    // অনুমোদিত / পরিশোধিত show the amount only — no "count · amount" union.
    for (const label of language === "en" ? ["Approved", "Paid"] : ["অনুমোদিত", "পরিশোধিত"]) {
      const row = rows.find((r) => r.label === label);
      check(
        Boolean(row) && !row.value.includes("·"),
        `[${language}] "${label}" shows only the total amount (got "${row?.value}")`,
      );
    }

    // The old system rows must be gone from the staff panel.
    const text = await panel.innerText();
    check(!text.includes("v16") && !text.toLowerCase().includes("api"), `[${language}] ERP system rows replaced`);

    // The panel title now names the summary itself.
    const heading = ((text.split("\n")[0] ?? "") || "").trim();
    const wantHeading = language === "en" ? "Expense claims" : "এক্সপেন্স ক্লেম";
    check(heading === wantHeading, `[${language}] panel title is "${wantHeading}" (saw "${heading}")`);

    await panel.scrollIntoViewIfNeeded();
    await panel.screenshot({ path: `${OUT}/home-system-panel-${language}.png` }).catch(async () => {
      await page.screenshot({ path: `${OUT}/home-system-panel-${language}.png`, fullPage: true });
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
