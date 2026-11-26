// Visual proof that the help-desk টিকিট সারসংক্ষেপ tiles use the same tone cards
// as the expense-claim সারসংক্ষেপ (and the leads task board).
//   node scripts/mock-frappe.mjs 2>&1 | tee -a /tmp/mock_frappe.log
//   FRAPPE_BASE_URL=http://127.0.0.1:8787 npx next start -p 3011
//   E2E_BASE=http://localhost:3011 MOCK_BASE=http://127.0.0.1:8787 \
//     node scripts/help-desk-summary-card-shot.mjs
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

const EXPECTED_TONES = {
  total: "rgb(124, 58, 237)", // #7c3aed violet
  open: "rgb(185, 119, 11)", // #b9770b amber ink (swapped with waiting)
  waiting: "rgb(47, 155, 255)", // #2f9bff blue (swapped with open)
  resolved: "rgb(22, 163, 74)", // #16a34a green
};

(async () => {
  const sid = await login();
  const chromePath =
    process.env.PW_CHROME ?? "/root/.cache/ms-playwright/chromium-1254/chrome-linux64/chrome";
  const browser = await chromium.launch({
    ...(existsSync(chromePath) ? { executablePath: chromePath } : {}),
    args: ["--no-sandbox"],
  });

  async function run(language) {
    const context = await browser.newContext({ viewport: { width: 1360, height: 950 }, deviceScaleFactor: 2 });
    await context.addCookies([
      { name: "shikkha_os_sid", value: sid, domain: "localhost", path: "/" },
      { name: "shikkha-chat-site-language", value: language, domain: "localhost", path: "/" },
    ]);
    const page = await context.newPage();
    const errors = [];
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
    page.on("pageerror", (e) => errors.push(String(e)));
    await page.addInitScript((lang) => localStorage.setItem("shikkha-chat-site-language", lang), language);

    // ---- help-desk টিকিট সারসংক্ষেপ tiles
    await page.goto(`${NEXT}/userDashboard/help-desk`, { waitUntil: "domcontentloaded", timeout: 120000 });
    const tiles = page.locator("[data-helpdesk-summary-card]");
    await tiles.first().waitFor({ state: "visible", timeout: 90000 });
    await page.waitForTimeout(600);
    check((await tiles.count()) === 4, `[${language}] টিকিট সারসংক্ষেপ shows 4 tone tiles`);

    for (const key of Object.keys(EXPECTED_TONES)) {
      const tile = page.locator(`[data-helpdesk-summary-card="${key}"]`).first();
      const tone = await tile.locator("span").first().evaluate((el) => getComputedStyle(el).color);
      check(tone === EXPECTED_TONES[key], `[${language}] ${key} tile icon tone = ${EXPECTED_TONES[key]} (got ${tone})`);
      const bg = await tile.evaluate((el) => getComputedStyle(el).backgroundColor);
      check(bg !== "rgb(255, 255, 255)" && bg !== "rgba(0, 0, 0, 0)", `[${language}] ${key} tile has a tinted background (${bg})`);
      const value = (await tile.innerText()).trim();
      check(value.length > 0, `[${language}] ${key} tile still renders its label and count`);
    }

    await tiles.first().scrollIntoViewIfNeeded();
    await page.screenshot({ path: `${OUT}/helpdesk-summary-${language}.png` });

    // ---- expense-claim reference tiles still intact
    await page.goto(`${NEXT}/userDashboard/expense-claim`, { waitUntil: "domcontentloaded", timeout: 120000 });
    const ref = page.locator("[data-expense-summary-card]");
    await ref.first().waitFor({ state: "visible", timeout: 90000 });
    await page.waitForTimeout(400);
    check((await ref.count()) === 4, `[${language}] expense-claim reference keeps its 4 tone tiles`);

    check(errors.length === 0, `[${language}] no console/page errors (${errors.slice(0, 2).join(" | ")})`);
    await context.close();
  }

  await run("bn");
  await run("en");

  await browser.close();
  console.log(failures.length === 0 ? "ALL CHECKS PASSED" : `FAILURES: ${failures.length}`);
  process.exit(failures.length === 0 ? 0 : 1);
})().catch((e) => {
  console.error("RUN ERROR:", e);
  process.exit(2);
});
