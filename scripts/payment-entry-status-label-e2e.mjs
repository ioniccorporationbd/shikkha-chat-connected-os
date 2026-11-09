// Payment history details popup: the settled-amount row must speak the row's
// own status — "Unpaid Amount" on a Draft, "Paid Amount" on a Submitted entry —
// in the popup, in the printed document and in the downloaded .html.
//
// Run with the mock (:8787) and next (:3011) up:
//   E2E_BASE=http://localhost:3011 node scripts/payment-entry-status-label-e2e.mjs

import { chromium } from "/root/arogga-UI/node_modules/playwright/index.mjs";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const run_ = promisify(execFile);

const NEXT = process.env.E2E_BASE ?? "http://localhost:3011";
const MOCK = process.env.MOCK_BASE ?? "http://127.0.0.1:8787";
const PASSWORD = process.env.MOCK_PASSWORD ?? "demo1234";
const USR = process.env.MOCK_USER ?? "client@example.com";

const DRAFT = "ACC-PAY-2026-00050"; // seeded Draft (Unpaid)
const PAID = "ACC-PAY-2026-00045"; // seeded Submitted (Paid)

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

/** Open the details popup for one payment row (by name) and read its rows. */
async function openDetails(page, paymentName) {
  const clicked = await page.evaluate((name) => {
    const rows = [...document.querySelectorAll("table tbody tr")];
    const row = rows.find((tr) => (tr.textContent || "").includes(name));
    if (!row) return false;
    const button = row.querySelector("button");
    if (!button) return false;
    button.click();
    return true;
  }, paymentName);
  if (!clicked) throw new Error(`row ${paymentName} not found to open`);
  await page.waitForSelector('[role="dialog"]', { timeout: 20_000 });
  await page.waitForTimeout(900);

  return page.evaluate(() => {
    const dialog = document.querySelector('[role="dialog"]');
    const sections = [...dialog.querySelectorAll("section")].map((section) => ({
      title: section.querySelector("h3")?.innerText?.trim() || "",
      rows: [...section.querySelectorAll("dl > div")].map((cell) => ({
        label: cell.querySelector("dt")?.innerText?.trim() || "",
        value: cell.querySelector("dd")?.innerText?.trim() || "",
      })),
    }));
    return { sections, text: dialog.innerText };
  });
}

/** Capture what the shared document builder produced for Download. */
async function captureDownload(page) {
  await page.evaluate(() => {
    window.__docBlobs = [];
    if (!window.__origCreateObjectURL) {
      window.__origCreateObjectURL = URL.createObjectURL.bind(URL);
      URL.createObjectURL = (blob) => {
        if (blob instanceof Blob && String(blob.type).includes("text/html")) {
          window.__docBlobs.push(blob);
        }
        return window.__origCreateObjectURL(blob);
      };
    }
    // Swallow the anchor click so no real file lands on disk.
    window.__origAnchorClick = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function () {};
  });
  const buttons = await page.$$('[role="dialog"] footer button');
  check(buttons.length >= 2, `popup footer has Download + Print (${buttons.length})`);
  await buttons[0].click(); // Download
  await page.waitForTimeout(500);
  const html = await page.evaluate(async () => {
    const blob = (window.__docBlobs || []).pop();
    return blob ? await blob.text() : "";
  });
  await page.evaluate(() => {
    HTMLAnchorElement.prototype.click = window.__origAnchorClick;
  });
  return html;
}

/** Capture what Print writes into its hidden iframe. */
async function capturePrint(page) {
  await page.evaluate(() => {
    window.print = () => {};
    // Neutralise the iframe's own print so no native dialog can block.
    const desc = Object.getOwnPropertyDescriptor(HTMLIFrameElement.prototype, "contentWindow");
    if (desc && desc.get) {
      Object.defineProperty(HTMLIFrameElement.prototype, "contentWindow", {
        get() {
          const win = desc.get.call(this);
          if (win && !win.__printStubbed) {
            try {
              win.print = () => {};
              win.focus = () => {};
              win.__printStubbed = true;
            } catch {
              /* cross-origin: leave it */
            }
          }
          return win;
        },
      });
    }
  });
  const buttons = await page.$$('[role="dialog"] footer button');
  await buttons[buttons.length - 1].click(); // Print
  await page.waitForTimeout(1200);
  return page.evaluate(() => {
    const frames = [...document.querySelectorAll("iframe")].filter(
      (f) => f.getAttribute("aria-hidden") === "true"
    );
    const frame = frames[frames.length - 1];
    if (!frame) return "";
    try {
      return frame.contentDocument?.documentElement?.outerHTML || "";
    } catch {
      return "";
    }
  });
}

async function closeDialog(page) {
  await page.keyboard.press("Escape");
  await page.waitForTimeout(700);
}

(async () => {
  const browser = await chromium.launch({ args: ["--no-sandbox"] });
  const sid = await login();

  for (const locale of ["bn", "en"]) {
    const context = await browser.newContext({ viewport: { width: 1360, height: 1000 } });
    await context.addCookies([
      { name: "shikkha_os_sid", value: sid, domain: "localhost", path: "/" },
      { name: "shikkha-chat-site-language", value: locale, domain: "localhost", path: "/" },
    ]);
    const page = await context.newPage();
    const errors = [];
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });
    page.on("pageerror", (e) => errors.push(String(e)));

    await page.addInitScript((lang) => {
      localStorage.setItem("shikkha-chat-site-language", lang);
    }, locale);

    await page.goto(`${NEXT}/clientDashboard/payment-entry`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("table tbody tr", { timeout: 40_000 });
    await page.waitForTimeout(1200);

    const settle = locale === "en" ? "Amount" : "পরিমাণ";
    const paidWord = locale === "en" ? "Paid Amount" : "পরিশোধিত পরিমাণ";
    const unpaidWord = locale === "en" ? "Unpaid Amount" : "বকেয়া পরিমাণ";
    const has = (text, word) => new RegExp(word, "i").test(text || "");
    // "UNPAID AMOUNT" contains "PAID AMOUNT"; compare whole labels, and for the
    // document text blank the unpaid word out before looking for the paid one.
    const labelHas = (labels, word) =>
      labels.some((label) => label.trim().toLowerCase() === word.trim().toLowerCase());
    const docHasPaid = (text) =>
      has(String(text || "").replace(new RegExp(unpaidWord, "gi"), "__"), paidWord);
    const docHasUnpaid = (text) => has(text, unpaidWord);

    // ---- Draft / Unpaid row -------------------------------------------------
    const draft = await openDetails(page, DRAFT);
    const draftAmount = draft.sections.find((s) => has(s.title, settle));
    check(Boolean(draftAmount), `${locale} draft: Amount section renders`);
    const draftLabels = (draftAmount?.rows || []).map((r) => r.label);
    const draftValues = (draftAmount?.rows || []).map((r) => r.value).join(" | ");
    check(labelHas(draftLabels, unpaidWord), `${locale} draft popup label is Unpaid (${draftLabels.join(" | ")})`);
    check(!labelHas(draftLabels, paidWord), `${locale} draft popup has NO Paid Amount label`);
    check(/[৳$0-9]/.test(draftValues), `${locale} draft popup shows an amount (${draftValues})`);

    const draftDownload = await captureDownload(page);
    check(docHasUnpaid(draftDownload), `${locale} draft DOWNLOAD carries the Unpaid label`);
    check(!docHasPaid(draftDownload), `${locale} draft DOWNLOAD has no Paid label`);

    const draftPrint = await capturePrint(page);
    check(Boolean(draftPrint), `${locale} draft PRINT produced a document`);
    check(docHasUnpaid(draftPrint), `${locale} draft PRINT carries the Unpaid label`);
    check(!docHasPaid(draftPrint), `${locale} draft PRINT has no Paid label`);

    await closeDialog(page);

    // ---- Submitted / Paid row ----------------------------------------------
    const paid = await openDetails(page, PAID);
    const paidAmount = paid.sections.find((s) => has(s.title, settle));
    check(Boolean(paidAmount), `${locale} paid: Amount section renders`);
    const paidLabels = (paidAmount?.rows || []).map((r) => r.label);
    check(labelHas(paidLabels, paidWord), `${locale} paid popup label is Paid (${paidLabels.join(" | ")})`);
    check(!labelHas(paidLabels, unpaidWord), `${locale} paid popup has NO Unpaid Amount label`);

    const paidDownload = await captureDownload(page);
    check(docHasPaid(paidDownload), `${locale} paid DOWNLOAD carries the Paid label`);
    check(!docHasUnpaid(paidDownload), `${locale} paid DOWNLOAD has no Unpaid label`);

    check(errors.length === 0, `${locale}: no console/page errors (${errors.slice(0, 2).join(" ; ")})`);

    await context.close();
  }

  await browser.close();
  console.log(failures.length === 0 ? "\nALL CHECKS PASSED" : `\n${failures.length} FAILURE(S)`);
  process.exit(failures.length === 0 ? 0 : 1);
})().catch((error) => {
  console.error("PROBE ERROR", error);
  process.exit(1);
});
