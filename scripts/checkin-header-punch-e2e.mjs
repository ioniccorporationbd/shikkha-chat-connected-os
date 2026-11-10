// Check In/Out punch button lives in the dashboard navbar, immediately LEFT of
// the shell's refresh button — the panel action bar now only carries its own
// refresh. Asserts DOM placement (inside <header>, one instance, left of the
// refresh button) plus a mobile pass with no horizontal overflow.
//
//   E2E_BASE=http://localhost:3011 node scripts/checkin-header-punch-e2e.mjs

import { chromium } from "/root/arogga-UI/node_modules/playwright/index.mjs";
import { execFile } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { promisify } from "node:util";

const run_ = promisify(execFile);

const NEXT = process.env.E2E_BASE ?? "http://localhost:3011";
const MOCK = process.env.MOCK_BASE ?? "http://127.0.0.1:8787";
const PASSWORD = process.env.MOCK_PASSWORD ?? "demo1234";

// Read the staff key straight out of the mock so the double-c spelling is never
// retyped by hand (a single-c copy costs a 401 hunt every time).
const MOCK_SRC = readFileSync(new URL("./mock-frappe.mjs", import.meta.url), "utf8");
const STAFF_USR =
  process.env.MOCK_USER ??
  MOCK_SRC.match(/"([a-z0-9.@]+@[a-z0-9.]+)"\s*:\s*\{\s*\n\s*password/)?.[1] ??
  "tamim@ionicorporation.com";

const failures = [];
let total = 0;
function check(ok, message) {
  total += 1;
  console.log(`${ok ? "PASS" : "FAIL"} ${message}`);
  if (!ok) failures.push(message);
}

async function loginOnce() {
  const { stdout } = await run_("curl", [
    "-s", "-m", "10", "-D", "-",
    "-X", "POST",
    "-H", "content-type: application/json",
    "-d", JSON.stringify({ usr: STAFF_USR, pwd: PASSWORD }),
    `${MOCK}/api/method/shikkha_os.api.v1.auth.login`,
  ]);
  const cookie = stdout
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.toLowerCase().startsWith("set-cookie: sid="))
    .map((line) => line.slice("set-cookie: ".length).split(";")[0])
    .pop();
  if (!cookie) throw new Error(`login failed for ${STAFF_USR}: ${stdout.slice(0, 200)}`);
  return cookie.split("=")[1];
}

async function login() {
  let last;
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    try {
      return await loginOnce();
    } catch (error) {
      last = error;
      if (attempt < 4) await new Promise((resolve) => setTimeout(resolve, 1500));
    }
  }
  throw last;
}

const REFRESH_LABEL = "রিফ্রেশ";

(async () => {
  const sid = await login();
  const chromePath =
    process.env.PW_CHROME ?? "/root/.cache/ms-playwright/chromium-1254/chrome-linux64/chrome";
  const browser = await chromium.launch({
    ...(existsSync(chromePath) ? { executablePath: chromePath } : {}),
    args: ["--no-sandbox"],
  });

  for (const viewport of [
    { width: 1440, height: 1000, tag: "desktop" },
    { width: 390, height: 900, tag: "mobile" },
  ]) {
    const context = await browser.newContext({ viewport });
    await context.addCookies([
      { name: "shikkha_os_sid", value: sid, domain: "localhost", path: "/" },
      { name: "shikkha-chat-site-language", value: "bn", domain: "localhost", path: "/" },
    ]);
    const page = await context.newPage();
    const errors = [];
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });
    page.on("pageerror", (e) => errors.push(String(e)));
    await page.addInitScript(() => {
      localStorage.setItem("shikkha-chat-site-language", "bn");
    });

    await page.goto(`${NEXT}/userDashboard/check-in-out`, {
      waitUntil: "domcontentloaded",
      timeout: 120000,
    });

    const punch = page.locator("[data-checkin-punch]");
    await punch.first().waitFor({ state: "visible", timeout: 60000 });

    check((await punch.count()) === 1, `[${viewport.tag}] exactly one punch button on the page`);
    check(
      (await page.locator("header [data-checkin-punch]").count()) === 1,
      `[${viewport.tag}] punch button renders inside the dashboard navbar`
    );

    const label = ((await punch.first().innerText()) || "").trim();
    const accessible = ((await punch.first().getAttribute("aria-label")) || "").trim();
    check(
      label.includes("চেক ইন") ||
        label.includes("চেক আউট") ||
        accessible.includes("চেক ইন") ||
        accessible.includes("চেক আউট"),
      `[${viewport.tag}] button keeps its check-in/out label ("${label || accessible}")`
    );

    // Position: punch sits left of the refresh button on the same header row.
    const refresh = page.locator(`header button[aria-label="${REFRESH_LABEL}"]`).first();
    check((await refresh.count()) === 1, `[${viewport.tag}] navbar refresh button found`);
    const punchBox = await punch.first().boundingBox();
    const refreshBox = await refresh.boundingBox();
    if (punchBox && refreshBox) {
      check(
        punchBox.x + punchBox.width <= refreshBox.x + 1,
        `[${viewport.tag}] punch button is LEFT of refresh (punch right ${Math.round(
          punchBox.x + punchBox.width
        )} ≤ refresh left ${Math.round(refreshBox.x)})`
      );
      check(
        Math.abs(punchBox.y + punchBox.height / 2 - (refreshBox.y + refreshBox.height / 2)) <= 4,
        `[${viewport.tag}] punch button is vertically centered with refresh`
      );
    } else {
      check(false, `[${viewport.tag}] punch/refresh bounding boxes available`);
    }

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    check(overflow <= 1, `[${viewport.tag}] no horizontal overflow (${overflow}px)`);
    check(errors.length === 0, `[${viewport.tag}] no console errors (${errors.slice(0, 2).join(" | ")})`);

    await page.screenshot({
      path: `/root/.hermes/cache/scratch/checkin-header-${viewport.tag}.png`,
      fullPage: false,
    });
    await context.close();
  }

  await browser.close();

  if (failures.length) {
    console.log(`\n${failures.length} FAILED`);
    process.exit(1);
  }
  console.log(`\n${total}/${total} checks passed`);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
