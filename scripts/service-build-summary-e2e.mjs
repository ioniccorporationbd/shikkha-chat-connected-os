// Service Build → "ইনভয়েস সারসংক্ষেপ": the tiles must speak money, not a count —
// মোট বিল = what was billed, পরিশোধিত = what was settled, বকেয়া = what a
// draft/unpaid invoice still owes — and the invoice table's status cell must
// label a Draft row "বকেয়া" (en: "Due") instead of "ড্রাফট".
//
// Expected figures are computed from the same API the page reads, so the probe
// compares the rendered tiles against real data, not against hardcoded numbers.
//
//   E2E_BASE=http://localhost:3011 node scripts/service-build-summary-e2e.mjs

import { chromium } from "/root/arogga-UI/node_modules/playwright/index.mjs";
import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { promisify } from "node:util";

const run_ = promisify(execFile);

const NEXT = process.env.E2E_BASE ?? "http://localhost:3011";
const MOCK = process.env.MOCK_BASE ?? "http://127.0.0.1:8787";
const USR = process.env.MOCK_USER ?? "client@example.com";
const PASSWORD = process.env.MOCK_PASSWORD ?? "demo1234";
const DRAFT = "ACC-SINV-2026-00025";

const failures = [];
function check(ok, message) {
  console.log(`${ok ? "PASS" : "FAIL"} ${message}`);
  if (!ok) failures.push(message);
}

async function loginOnce() {
  const { stdout } = await run_("curl", [
    "-s", "-m", "10", "-D", "-",
    "-X", "POST",
    "-H", "content-type: application/json",
    "-d", JSON.stringify({ usr: USR, pwd: PASSWORD }),
    `${MOCK}/api/method/shikkha_os.api.v1.auth.login`,
  ]);
  const cookie = stdout
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.toLowerCase().startsWith("set-cookie: sid="))
    .map((line) => line.slice("set-cookie: ".length).split(";")[0])
    .pop();
  if (!cookie) throw new Error(`login failed: ${stdout.slice(0, 200)}`);
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

/** The same list payload the page renders, so expectations come from the API. */
async function fetchInvoices(sid) {
  const { stdout } = await run_("curl", [
    "-s", "-m", "15",
    "-H", `cookie: sid=${sid}`,
    "-H", "content-type: application/json",
    "-X", "POST",
    "-d", "{}",
    `${MOCK}/api/method/shikkha_os.api.v1.sales_invoice.list_mine`,
  ]);
  const payload = JSON.parse(stdout);
  const message = payload?.message?.data ?? payload?.message ?? payload;
  const invoices = message?.invoices ?? [];
  if (!Array.isArray(invoices) || invoices.length === 0) {
    throw new Error(`no invoices in list payload: ${stdout.slice(0, 300)}`);
  }
  return { invoices, summary: message?.summary ?? {} };
}

const num = (value) => Number(value) || 0;

/** "৳৩,৭০০.০০" → 3700 (bn digits included), so tiles can be compared as numbers. */
function parseAmount(text) {
  const bn = "০১২৩৪৫৬৭৮৯";
  const ascii = String(text || "").replace(/[০-৯]/g, (d) => String(bn.indexOf(d)));
  const digits = ascii.replace(/[^0-9.]/g, "");
  if (!digits) return NaN;
  return Number(digits.replace(/,/g, ""));
}

(async () => {
  const chromePath =
    process.env.PW_CHROME ?? "/root/.cache/ms-playwright/chromium-1254/chrome-linux64/chrome";
  const browser = await chromium.launch({
    ...(existsSync(chromePath) ? { executablePath: chromePath } : {}),
    args: ["--no-sandbox"],
  });
  const sid = await login();
  const { invoices, summary } = await fetchInvoices(sid);

  const expected = {
    total: summary.total ?? invoices.length,
    billed: invoices.reduce((sum, row) => sum + num(row.amount), 0),
    paid: invoices.reduce((sum, row) => sum + Math.max(0, num(row.amount) - num(row.outstanding_amount)), 0),
    due: invoices.reduce((sum, row) => {
      const key = String(row.display_status || "").trim().toLowerCase();
      if (key !== "draft" && key !== "unpaid") return sum;
      return sum + num(row.outstanding_amount);
    }, 0),
  };
  console.log(
    `API expectations: ${invoices.length} invoices · billed ${expected.billed} · paid ${expected.paid} · due ${expected.due}`
  );
  check(expected.due > 0, `seeded data has a real বকেয়া figure (${expected.due})`);

  const LOCALES = [
    {
      lang: "bn",
      labels: ["মোট সার্ভিস বিল", "মোট বিল", "পরিশোধিত", "বকেয়া", "এই মাসের ইনভয়েস", "সর্বশেষ ইনভয়েস"],
      draftStatus: "বকেয়া",
      forbidden: ["দেখানো হচ্ছে", "মোট পরিমাণ", "মোট বাকি", "ড্রাফট"],
    },
    {
      lang: "en",
      labels: ["Total service bills", "Total billed", "Paid", "Due", "This month", "Latest invoice"],
      draftStatus: "Due",
      forbidden: ["Showing", "Total amount", "Total outstanding", "Draft"],
    },
  ];

  for (const { lang, labels, draftStatus, forbidden } of LOCALES) {
    const context = await browser.newContext({ viewport: { width: 1360, height: 1100 } });
    await context.addCookies([
      { name: "shikkha_os_sid", value: sid, domain: "localhost", path: "/" },
      { name: "shikkha-chat-site-language", value: lang, domain: "localhost", path: "/" },
    ]);
    const page = await context.newPage();
    const errors = [];
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });
    page.on("pageerror", (e) => errors.push(String(e)));

    await page.addInitScript((l) => {
      localStorage.setItem("shikkha-chat-site-language", l);
    }, lang);

    await page.goto(`${NEXT}/clientDashboard/service-build`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("table tbody tr", { timeout: 45_000 });
    await page.waitForTimeout(1200);

    const tiles = await page.evaluate(() => {
      const heading = [...document.querySelectorAll("h2")].find((h) =>
        /সারসংক্ষেপ|summary/i.test(h.textContent || "")
      );
      const grid = heading?.closest("div")?.parentElement?.querySelector("div.mt-4");
      const container = grid || document;
      return [...container.querySelectorAll(":scope > div")].map((tile) => {
        const spans = [...tile.querySelectorAll("span")].map((s) => s.innerText.trim());
        return { label: spans[0] || "", value: spans[1] || "", hint: spans[2] || "" };
      });
    });

    check(tiles.length >= 6, `${lang}: six summary tiles rendered (${tiles.length})`);
    // Tile labels are uppercased by CSS and innerText reports them that way.
    const gotLabels = tiles.map((t) => t.label);
    check(
      JSON.stringify(gotLabels.slice(0, 6).map((l) => l.toLowerCase())) ===
        JSON.stringify(labels.map((l) => l.toLowerCase())),
      `${lang}: tile labels are the renamed set — ${gotLabels.slice(0, 6).join(" | ")}`
    );

    const tile = (label) =>
      tiles.find((t) => t.label.trim().toLowerCase() === label.trim().toLowerCase());
    const billed = parseAmount(tile(labels[1])?.value);
    const paid = parseAmount(tile(labels[2])?.value);
    const due = parseAmount(tile(labels[3])?.value);
    check(billed === expected.billed, `${lang}: মোট বিল = ${expected.billed} (rendered ${billed})`);
    check(paid === expected.paid, `${lang}: পরিশোধিত = ${expected.paid} (rendered ${paid})`);
    check(due === expected.due, `${lang}: বকেয়া = ${expected.due} (rendered ${due})`);
    check(
      /[৳$]/.test(tile(labels[1])?.value || "") || /\d/.test(tile(labels[1])?.value || ""),
      `${lang}: মোট বিল shows a money amount (${tile(labels[1])?.value})`
    );

    const bodyText = await page.evaluate(() => document.body.innerText);
    for (const word of forbidden) {
      check(!bodyText.includes(word), `${lang}: old label "${word}" is gone`);
    }

    // Status cell of the seeded Draft invoice, in the table and the breakdown.
    const rowCells = await page.evaluate((name) => {
      const row = [...document.querySelectorAll("table tbody tr")].find((tr) =>
        (tr.textContent || "").includes(name)
      );
      return row ? [...row.querySelectorAll("td")].map((td) => td.innerText.trim()) : null;
    }, DRAFT);
    check(Boolean(rowCells), `${lang}: draft invoice row ${DRAFT} is listed`);
    if (rowCells) {
      check(
        rowCells.includes(draftStatus),
        `${lang}: draft row status cell reads "${draftStatus}" (${rowCells.join(" | ")})`
      );
    }

    check(errors.length === 0, `${lang}: no console/page errors (${errors.slice(0, 2).join(" ; ")})`);

    if (lang === "bn") {
      await page.screenshot({ path: "/root/.hermes/cache/scratch/service-build-summary-bn.png", fullPage: true });
    } else {
      await page.screenshot({ path: "/root/.hermes/cache/scratch/service-build-summary-en.png" });
    }

    await context.close();
  }

  await browser.close();
  console.log(failures.length === 0 ? "\nALL CHECKS PASSED" : `\n${failures.length} FAILURE(S)`);
  process.exit(failures.length === 0 ? 0 : 1);
})().catch((error) => {
  console.error("PROBE ERROR", error);
  process.exit(1);
});
