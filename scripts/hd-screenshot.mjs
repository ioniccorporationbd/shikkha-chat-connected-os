// Screenshot the tabbed tables on both dashboards, desktop and phone.
import { chromium } from "/root/arogga-UI/node_modules/playwright/index.mjs";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const run_ = promisify(execFile);
const NEXT = process.env.E2E_BASE ?? "http://localhost:3011";
const MOCK = "http://127.0.0.1:8787";
const SHOTS = "/root/.hermes/cache/scratch";

async function login(usr) {
  const { stdout } = await run_("curl", [
    "-s", "-i", "-m", "10", "-X", "POST", "-H", "content-type: application/json",
    "-d", JSON.stringify({ usr, pwd: "demo1234" }),
    `${MOCK}/api/method/shikkha_os.api.v1.auth.login`,
  ]);
  const line = stdout.split("\n").map((l) => l.trim()).find((l) => l.toLowerCase().startsWith("set-cookie: sid="));
  return line.slice("set-cookie: sid=".length).split(";")[0];
}

const browser = await chromium.launch({ args: ["--no-sandbox"] });

for (const [dash, usr, tag] of [
  ["clientDashboard", "client@example.com", "client"],
  ["userDashboard", "tamim@ioniccorporation.com", "staff"],
]) {
  const sid = await login(usr);
  for (const [width, height, mode] of [[1360, 1100, "desktop"], [390, 900, "phone"]]) {
    const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: mode === "phone" ? 2 : 1 });
    await context.addCookies([{ name: "shikkha_os_sid", value: sid, domain: "localhost", path: "/" }]);
    const page = await context.newPage();
    await page.goto(`${NEXT}/${dash}/help-desk`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector('[role="tablist"]', { timeout: 30_000 });
    await page.waitForTimeout(1500);
    // Shoot the tab card itself — an element capture is immune to scroll resets.
    const card = page.locator('section:has([role="tablist"])').first();
    await card.scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    await card.screenshot({ path: `${SHOTS}/hd-tabs-${tag}-${mode}.png` });
    if (mode === "desktop") {
      await page.click('[data-hd-tab="unresolved"]');
      await page.waitForTimeout(500);
      await card.screenshot({ path: `${SHOTS}/hd-tabs-${tag}-desktop-unresolved.png` });
    }
    await context.close();
  }
}

await browser.close();
console.log("shots done");
