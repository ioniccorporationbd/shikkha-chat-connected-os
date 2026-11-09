// Client dashboard rail → the দুই পাশের প্যানেল must carry summaries, not links:
//   • কুইক লিংক panel  → Payment Entry summary (count, paid total, this month, latest)
//   • সিস্টেম panel    → Service Build (Sales Invoice) summary (bills, billed, due, latest)
// The markup is untouched — the existing tiles and label/value rows just receive the
// new data — so this probe checks the copy AND that the numbers equal what the
// payment-entry / service-build APIs report for the same session.
//
//   E2E_BASE=http://localhost:3011 node scripts/client-dashboard-summaries-e2e.mjs

import { chromium } from "/root/arogga-UI/node_modules/playwright/index.mjs";
import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { promisify } from "node:util";

const run_ = promisify(execFile);

const NEXT = process.env.E2E_BASE ?? "http://localhost:3011";
const MOCK = process.env.MOCK_BASE ?? "http://127.0.0.1:8787";
const CLIENT_USR = process.env.MOCK_CLIENT ?? "client@example.com";
const STAFF_USR = process.env.MOCK_USER ?? "tamim@ioniccorporation.com";
const PASSWORD = process.env.MOCK_PASSWORD ?? "demo1234";

const failures = [];
let total = 0;
function check(ok, message) {
  total += 1;
  console.log(`${ok ? "PASS" : "FAIL"} ${message}`);
  if (!ok) failures.push(message);
}

async function loginOnce(user) {
  const { stdout } = await run_("curl", [
    "-s", "-m", "10", "-D", "-",
    "-X", "POST",
    "-H", "content-type: application/json",
    "-d", JSON.stringify({ usr: user, pwd: PASSWORD }),
    `${MOCK}/api/method/shikkha_os.api.v1.auth.login`,
  ]);
  const cookie = stdout
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.toLowerCase().startsWith("set-cookie: sid="))
    .map((line) => line.slice("set-cookie: ".length).split(";")[0])
    .pop();
  if (!cookie) throw new Error(`login failed for ${user}: ${stdout.slice(0, 200)}`);
  return cookie.split("=")[1];
}

async function login(user) {
  let last;
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    try {
      return await loginOnce(user);
    } catch (error) {
      last = error;
      if (attempt < 4) await new Promise((resolve) => setTimeout(resolve, 1500));
    }
  }
  throw last;
}

async function callMethod(sid, method, body = {}) {
  const { stdout } = await run_("curl", [
    "-s", "-m", "15",
    "-H", `cookie: sid=${sid}`,
    "-H", "content-type: application/json",
    "-X", "POST",
    "-d", JSON.stringify(body),
    `${MOCK}/api/method/${method}`,
  ]);
  const payload = JSON.parse(stdout);
  const message = payload?.message?.data ?? payload?.message ?? payload;
  return message ?? {};
}

const num = (value) => Number(value) || 0;

/** Bengali digits → ASCII so counts compare regardless of locale. */
function bnToAscii(text) {
  const bn = "০১২৩৪৫৬৭৮৯";
  return String(text || "").replace(/[০-৯]/g, (d) => String(bn.indexOf(d)));
}

/** "৳৩,৭০০.০০" → 3700 (Bengali digits included). */
function parseAmount(text) {
  const bn = "০১২৩৪৫৬৭৮৯";
  const ascii = String(text || "").replace(/[০-৯]/g, (d) => String(bn.indexOf(d)));
  const digits = ascii.replace(/[^0-9.]/g, "");
  if (!digits) return NaN;
  return Number(digits.replace(/,/g, ""));
}

const LOCALES = {
  bn: {
    headings: {
      pay: "পেমেন্ট এন্ট্রি",
      bill: "সার্ভিস বিল",
    },
    staffHeadings: {
      quick: "কুইক লিংক",
      system: "সিস্টেম",
    },
    pay: ["মোট পেমেন্ট এন্ট্রি", "মোট পরিশোধিত", "এই মাসে", "সর্বশেষ পেমেন্ট"],
    bill: ["মোট বিল", "মোট বিলের পরিমাণ", "বকেয়া", "সর্বশেষ বিল"],
    staffSystem: ["সার্ভার", "ভার্সন"],
  },
  en: {
    headings: {
      pay: "Payment Entry",
      bill: "Service Bill",
    },
    staffHeadings: {
      quick: "Quick links",
      system: "System",
    },
    pay: ["Payment entries", "Total paid", "This month", "Latest payment"],
    bill: ["Service bills", "Billed amount", "Outstanding", "Latest bill"],
    staffSystem: ["Server", "Version"],
  },
};

(async () => {
  const chromePath =
    process.env.PW_CHROME ?? "/root/.cache/ms-playwright/chromium-1254/chrome-linux64/chrome";
  const browser = await chromium.launch({
    ...(existsSync(chromePath) ? { executablePath: chromePath } : {}),
    args: ["--no-sandbox"],
  });

  // ---- client session + the numbers the pages themselves report ----
  const clientSid = await login(CLIENT_USR);
  const payMessage = await callMethod(clientSid, "shikkha_os.api.v1.payment_entry.list_mine");
  const billMessage = await callMethod(clientSid, "shikkha_os.api.v1.sales_invoice.list_mine");

  const paySummary = payMessage.summary ?? {};
  const payRows = Array.isArray(payMessage.payments) ? payMessage.payments : [];
  const billSummary = billMessage.summary ?? {};
  const billRows = Array.isArray(billMessage.invoices) ? billMessage.invoices : [];

  const expected = {
    payCount: paySummary.total ?? payRows.length,
    payAmount: num(paySummary.total_amount ?? payRows.reduce((s, r) => s + num(r.paid_amount ?? r.amount), 0)),
    payMonth: num(paySummary.this_month_amount ?? 0),
    billCount: billSummary.total ?? billRows.length,
    billAmount: num(billSummary.total_amount ?? billRows.reduce((s, r) => s + num(r.amount), 0)),
    billDue: num(billSummary.total_outstanding ?? billRows.reduce((s, r) => s + num(r.outstanding_amount), 0)),
  };
  console.log(
    `API: ${expected.payCount} payments ৳${expected.payAmount} · ${expected.billCount} bills ৳${expected.billAmount} due ৳${expected.billDue}`
  );

  check(payRows.length > 0, "seeded client has payment entries to summarise");
  check(billRows.length > 0, "seeded client has service bills to summarise");

  for (const lang of ["bn", "en"]) {
    const copy = LOCALES[lang];
    const context = await browser.newContext({ viewport: { width: 1440, height: 1100 } });
    await context.addCookies([
      { name: "shikkha_os_sid", value: clientSid, domain: "localhost", path: "/" },
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

    await page.goto(`${NEXT}/clientDashboard`, { waitUntil: "domcontentloaded", timeout: 120000 });

    const quickPanel = page.locator('[data-panel="quick-links"]');
    const systemPanel = page.locator('[data-panel="system"]');
    await quickPanel.waitFor({ state: "visible", timeout: 60000 });
    await systemPanel.waitFor({ state: "visible", timeout: 60000 });

    // The rail fills in after the client's own summary requests answer; wait for
    // the first payment tile / bill row instead of asserting on a pending fetch.
    // Panel titles were renamed for clients: কুইক লিংক → পেমেন্ট এন্ট্রি,
    // সিস্টেম → সার্ভিস বিল (staff keeps the original headings).
    const quickHeadingText = (await quickPanel.innerText().catch(() => "")).split("\n")[0];
    check(
      quickHeadingText.trim() === copy.headings.pay,
      `[${lang}] কুইক লিংক panel title is now "${copy.headings.pay}" (saw "${quickHeadingText.trim()}")`
    );
    const systemHeadingText = ((await systemPanel.innerText().catch(() => "")) || "").split("\n")[0];
    check(
      systemHeadingText.trim() === copy.headings.bill,
      `[${lang}] সিস্টেম panel title is now "${copy.headings.bill}" (saw "${systemHeadingText.trim()}")`
    );

    await quickPanel
      .locator("a")
      .first()
      .waitFor({ state: "visible", timeout: 60000 })
      .catch(() => {});
    await page
      .getByText(copy.bill[0], { exact: false })
      .first()
      .waitFor({ state: "visible", timeout: 60000 })
      .catch(() => {});

    // Payment Entry tiles inside কুইক লিংক
    for (const label of copy.pay) {
      const tile = quickPanel.locator("a", { hasText: label }).first();
      const visible = await tile.isVisible().catch(() => false);
      check(visible, `[${lang}] payment summary tile "${label}" renders in কুইক লিংক`);
      if (visible) {
        const href = (await tile.getAttribute("href")) ?? "";
        check(
          href.includes("/payment-entry"),
          `[${lang}] tile "${label}" opens the payments page (href ${href})`
        );
      }
    }

    const quickText = (await quickPanel.innerText().catch(() => "")) || "";

    // count tile must carry the API's payment count
    const countTile = quickPanel.locator("a", { hasText: copy.pay[0] }).first();
    const countText = (await countTile.innerText().catch(() => "")) || "";
    check(
      bnToAscii(countText).replace(/[^0-9]/g, "").includes(String(expected.payCount)),
      `[${lang}] payment entry count ${expected.payCount} on its tile (${countText.replace(/\n/g, " | ")})`
    );

    // paid-total tile must carry the API's total amount
    const amountTile = quickPanel.locator("a", { hasText: copy.pay[1] }).first();
    const amountText = (await amountTile.innerText().catch(() => "")) || "";
    check(
      parseAmount(amountText) === expected.payAmount,
      `[${lang}] মোট পরিশোধিত tile matches the API (${parseAmount(amountText)} vs ${expected.payAmount})`
    );

    // Service bill rows inside সিস্টেম
    const systemText = (await systemPanel.innerText().catch(() => "")) || "";
    for (const label of copy.bill) {
      check(systemText.includes(label), `[${lang}] system panel row "${label}" renders`);
    }
    for (const label of copy.staffSystem) {
      check(
        !systemText.includes(label),
        `[${lang}] system panel no longer shows "${label}"`
      );
    }
    check(
      bnToAscii(systemText).replace(/[^0-9]/g, "").includes(String(expected.billCount)),
      `[${lang}] service bill count ${expected.billCount} present`
    );

    const billAmountRow = systemText.split(copy.bill[1]).pop() ?? "";
    const renderedBilled = parseAmount((billAmountRow.match(/[0-9০-৯,.]+/) ?? [""])[0]);
    check(
      Number.isFinite(renderedBilled) && renderedBilled === expected.billAmount,
      `[${lang}] billed amount row matches the API (${renderedBilled} vs ${expected.billAmount})`
    );

    const dueSlice = systemText.split(copy.bill[2]).pop() ?? "";
    const renderedDue = parseAmount((dueSlice.match(/[0-9০-৯,.]+/) ?? [""])[0]);
    check(
      Number.isFinite(renderedDue) && renderedDue === expected.billDue,
      `[${lang}] বকেয়া row matches the API (${renderedDue} vs ${expected.billDue})`
    );

    check(errors.length === 0, `[${lang}] no console errors (${errors.slice(0, 2).join(" | ")})`);

    if (lang === "bn") {
      await page.screenshot({
        path: "/root/.hermes/cache/scratch/client-dashboard-summaries-bn.png",
        fullPage: false,
      });
    }
    await context.close();
  }

  // ---- staff dashboard must keep its old rail ----
  const staffSid = await login(STAFF_USR);
  const staffContext = await browser.newContext({ viewport: { width: 1440, height: 1100 } });
  await staffContext.addCookies([
    { name: "shikkha_os_sid", value: staffSid, domain: "localhost", path: "/" },
    { name: "shikkha-chat-site-language", value: "bn", domain: "localhost", path: "/" },
  ]);
  const staffPage = await staffContext.newPage();
  await staffPage.addInitScript(() => {
    localStorage.setItem("shikkha-chat-site-language", "bn");
  });
  await staffPage.goto(`${NEXT}/userDashboard`, { waitUntil: "domcontentloaded", timeout: 120000 });
  const staffBody = (await staffPage.locator("body").innerText().catch(() => "")) || "";
  check(staffBody.includes("সার্ভার"), "staff dashboard keeps its System (সার্ভার) row");
  check(staffBody.includes(LOCALES.bn.staffHeadings.quick), "staff dashboard keeps the কুইক লিংক heading");
  check(staffBody.includes(LOCALES.bn.staffHeadings.system), "staff dashboard keeps the সিস্টেম heading");
  check(
    !staffBody.includes(LOCALES.bn.headings.bill),
    "staff dashboard did not inherit the সার্ভিস বিল heading"
  );
  check(
    !staffBody.includes(LOCALES.bn.pay[1]),
    "staff dashboard did not inherit the payment summary tiles"
  );
  await staffContext.close();

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