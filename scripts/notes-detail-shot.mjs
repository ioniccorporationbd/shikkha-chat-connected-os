// Visual + behavior proof for the CRM note-details popup.
//   MOCK_FRAPPE_PORT=8787 node scripts/mock-frappe.mjs
//   FRAPPE_BASE_URL=http://127.0.0.1:8787 npx next start -p 3011
//   E2E_BASE=http://localhost:3011 MOCK_BASE=http://127.0.0.1:8787 \
//     node scripts/notes-detail-shot.mjs
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

(async () => {
  const sid = await login();
  const chromePath =
    process.env.PW_CHROME ?? "/root/.cache/ms-playwright/chromium-1254/chrome-linux64/chrome";
  const browser = await chromium.launch({
    ...(existsSync(chromePath) ? { executablePath: chromePath } : {}),
    args: ["--no-sandbox"],
  });
  const context = await browser.newContext({
    viewport: { width: 1040, height: 800 },
    deviceScaleFactor: 2,
  });
  await context.addCookies([
    { name: "shikkha_os_sid", value: sid, domain: "localhost", path: "/" },
    { name: "shikkha-chat-site-language", value: "en", domain: "localhost", path: "/" },
  ]);
  const page = await context.newPage();
  const errors = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.addInitScript(() => localStorage.setItem("shikkha-chat-site-language", "en"));

  // Open the first lead's detail sheet.
  await page.goto(`${NEXT}/userDashboard/leads`, { waitUntil: "domcontentloaded", timeout: 120000 });
  await page.locator("[data-lead-details]:visible").first().waitFor({ state: "visible", timeout: 90000 });
  await page.locator("[data-lead-details]:visible").first().click();
  await page.locator("[data-lead-detail]").waitFor({ state: "visible", timeout: 60000 });

  // Notes tab -> per-row "view details".
  await page.locator('[data-lead-tab="notes"]').click();
  const rows = page.locator("[data-lead-note-details]");
  await rows.first().waitFor({ state: "visible", timeout: 30000 });
  check((await rows.count()) >= 2, `Notes tab shows a per-row view-details button on each row (${await rows.count()})`);

  await rows.first().click();
  const modal = page.locator("[data-note-detail-modal]");
  await modal.waitFor({ state: "visible", timeout: 30000 });
  await page.locator("[data-note-detail-title]").waitFor({ state: "visible", timeout: 20000 });

  // Wait until the note record finished loading (title populated).
  await page.waitForFunction(() => {
    const el = document.querySelector("[data-note-detail-title]");
    return el && el.value && el.value.trim().length > 0;
  }, { timeout: 20000 });

  const heading = ((await page.locator("[data-note-detail-heading]").innerText()) || "").trim();
  check(heading.includes("Edit Note"), `popup heading is "Edit Note" (got "${heading}")`);
  check((await page.locator("[data-note-detail-openlead]").count()) === 1, `popup has an "Open Lead" button`);
  const tools = await page.locator('[data-note-detail-modal] [role="toolbar"] button').count();
  check(tools >= 12, `content box has a full editing toolbar (${tools} buttons)`);

  // The whole point: opening the popup must show the note's data, editable.
  const titleVal = (await page.locator("[data-note-detail-title]").inputValue()).trim();
  const contentText = (await page.locator("[data-note-detail-content]").innerText()).trim();
  check(titleVal.length > 0, `popup shows the note's Title on open ("${titleVal}")`);
  check(contentText.length > 0, `popup shows the note's Content on open ("${contentText.slice(0, 44)}")`);

  const before = await page.locator("[data-note-detail-title]").inputValue();
  await page.screenshot({ path: `${OUT}/note-popup-before.png` });
  await modal.screenshot({ path: `${OUT}/note-popup-modal.png` });

  // Edit + save (title + rich content), then confirm it round-trips.
  const newTitle = `Solved note ${Date.now() % 100000}`;
  await page.locator("[data-note-detail-title]").fill(newTitle);
  await page.locator("[data-note-detail-content]").click();
  await page.locator("[data-note-detail-content]").fill("problem45455656uuuu — edited in popup");
  await page.locator("[data-note-detail-save]").click();
  await modal.waitFor({ state: "detached", timeout: 30000 });
  await page.locator('[data-lead-notice="ok"]').waitFor({ state: "visible", timeout: 20000 });
  check(true, "Update saves and closes the popup with a success toast");

  // Reopen the same row and confirm the new title persisted.
  await page.locator("[data-lead-note-details]").first().click();
  await modal.waitFor({ state: "visible", timeout: 30000 });
  await page.waitForFunction((t) => {
    const el = document.querySelector("[data-note-detail-title]");
    return el && el.value === t;
  }, newTitle, { timeout: 20000 });
  check(true, `edited title persisted and reopens correctly (was "${before}")`);
  await modal.screenshot({ path: `${OUT}/note-popup-after.png` });

  // Console must be clean across the happy path (before we deliberately force
  // an error in the failure-mode block below).
  check(errors.length === 0, `no console errors on the happy path (${errors.length})`);
  if (errors.length) console.log(errors.slice(0, 5).join("\n"));

  // --- Failure mode: if the note fetch errors, the popup must STILL show the
  // row's data (editable), not a blank/dead dialog. Force the GET to 500.
  await page.locator("[data-note-detail-close]").click();
  await modal.waitFor({ state: "detached", timeout: 20000 });
  await page.route("**/api/leads/*/note/*", (route) =>
    route.request().method() === "GET"
      ? route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({ exc_type: "DoesNotExistError", message: "The note was not found." }),
        })
      : route.continue()
  );
  await page.locator("[data-lead-note-details]").first().click();
  await modal.waitFor({ state: "visible", timeout: 20000 });
  await page.locator("[data-note-detail-warn]").waitFor({ state: "visible", timeout: 20000 });
  const fTitle = (await page.locator("[data-note-detail-title]").inputValue()).trim();
  const fContent = (await page.locator("[data-note-detail-content]").innerText()).trim();
  check(fTitle.length > 0, `failed load still shows seeded Title ("${fTitle}")`);
  check(fContent.length > 0, `failed load still shows seeded Content ("${fContent.slice(0, 40)}")`);
  check(!(await page.locator("[data-note-detail-save]").isDisabled()), "Update stays enabled on a failed load");
  await modal.screenshot({ path: `${OUT}/note-popup-fallback.png` });
  await page.unroute("**/api/leads/*/note/*");

  console.log(`(failure-mode console errors seen, expected: ${errors.length})`);

  await browser.close();
  console.log(`\nScreenshots: ${OUT}/note-popup-modal.png , note-popup-before.png , note-popup-after.png`);
  console.log(failures.length ? `\n${failures.length} FAILURE(S)` : "\nALL CHECKS PASSED");
  process.exit(failures.length ? 1 : 0);
})().catch((e) => {
  console.error("RUN ERROR:", e);
  process.exit(2);
});
