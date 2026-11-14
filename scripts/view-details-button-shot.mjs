// Proves the expense-claim row "view details" button matches the leads table
// button (same pill shape, border tint, 11.5px action-colour label, eye icon).
//   node scripts/mock-frappe.mjs 2>&1 | tee -a /tmp/mock_frappe.log
//   FRAPPE_BASE_URL=http://127.0.0.1:8787 npx next start -p 3011
//   E2E_BASE=http://localhost:3011 MOCK_BASE=http://127.0.0.1:8787 \
//     node scripts/view-details-button-shot.mjs
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

const STYLE_KEYS = [
  "borderTopLeftRadius",
  "borderTopWidth",
  "borderTopColor",
  "paddingLeft",
  "paddingTop",
  "fontSize",
  "fontWeight",
  "color",
];

const js_norm = (btn) => {
  const cs = getComputedStyle(btn);
  const out = {};
  for (const key of [
    "borderTopLeftRadius",
    "borderTopWidth",
    "borderTopColor",
    "paddingLeft",
    "paddingTop",
    "fontSize",
    "fontWeight",
    "color",
  ]) out[key] = cs[key];
  const svg = btn.querySelector("svg");
  out.hasIcon = Boolean(svg);
  out.svgSize = svg ? Math.round(svg.getBoundingClientRect().width) : 0;
  out.iconFirst = Boolean(svg && btn.firstElementChild && btn.firstElementChild.tagName === "svg");
  out.label = (btn.textContent ?? "").trim();
  return out;
};

(async () => {
  const sid = await login();
  const chromePath =
    process.env.PW_CHROME ?? "/root/.cache/ms-playwright/chromium-1254/chrome-linux64/chrome";
  const browser = await chromium.launch({
    ...(existsSync(chromePath) ? { executablePath: chromePath } : {}),
    args: ["--no-sandbox"],
  });

  async function collect(pathname, attr, language) {
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
    await page.goto(`${NEXT}${pathname}`, { waitUntil: "domcontentloaded", timeout: 120000 });
    const btn = page.locator(`[${attr}]`).first();
    await btn.waitFor({ state: "visible", timeout: 90000 });
    await page.waitForTimeout(500);
    const style = await btn.evaluate(js_norm);
    const box = await btn.boundingBox();
    return { page, context, style, box, errors };
  }

  for (const language of ["bn", "en"]) {
    console.log(`\n== ${language} ==`);
    const leads = await collect("/userDashboard/leads", "data-lead-details", language);
    const claim = await collect("/userDashboard/expense-claim", "data-claim-details", language);

    check(claim.style.hasIcon, `[${language}] expense button carries an icon`);
    check(claim.style.iconFirst, `[${language}] expense icon sits before the label (eye first)`);
    check(claim.style.svgSize === 12, `[${language}] expense icon is 12px (got ${claim.style.svgSize})`);
    check(claim.style.label === leads.style.label, `[${language}] same label text ("${claim.style.label}" vs "${leads.style.label}")`);

    for (const key of STYLE_KEYS) {
      check(
        claim.style[key] === leads.style[key],
        `[${language}] ${key} matches leads (${leads.style[key]} vs ${claim.style[key]})`,
      );
    }

    check(
      claim.box && leads.box && Math.abs(claim.box.height - leads.box.height) <= 3,
      `[${language}] button height close to leads (${leads.box?.height} vs ${claim.box?.height})`,
    );

    await claim.page.locator(`[data-claim-details]`).first().scrollIntoViewIfNeeded();
    const row = claim.page.locator(`[data-claim-details]`).first();
    const boxC = await row.boundingBox();
    if (boxC) {
      await claim.page.screenshot({
        path: `${OUT}/view-details-claim-${language}.png`,
        clip: { x: Math.max(boxC.x - 260, 0), y: Math.max(boxC.y - 90, 0), width: 620, height: 200 },
      });
    }
    const boxL = leads.box;
    if (boxL) {
      await leads.page.locator(`[data-lead-details]`).first().scrollIntoViewIfNeeded();
      const b2 = await leads.page.locator(`[data-lead-details]`).first().boundingBox();
      if (b2) {
        await leads.page.screenshot({
          path: `${OUT}/view-details-leads-${language}.png`,
          clip: { x: Math.max(b2.x - 260, 0), y: Math.max(b2.y - 90, 0), width: 620, height: 200 },
        });
      }
    }

    check(claim.errors.length === 0, `[${language}] expense page console clean (${claim.errors.slice(0, 2).join(" | ")})`);
    check(leads.errors.length === 0, `[${language}] leads page console clean (${leads.errors.slice(0, 2).join(" | ")})`);
    await claim.context.close();
    await leads.context.close();
  }

  await browser.close();
  console.log(failures.length === 0 ? "ALL CHECKS PASSED" : `FAILURES: ${failures.length}`);
  process.exit(failures.length === 0 ? 0 : 1);
})().catch((e) => {
  console.error("RUN ERROR:", e);
  process.exit(2);
});
