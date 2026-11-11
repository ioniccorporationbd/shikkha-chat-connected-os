// The staff **Leads** route: a "লিডস" item directly under Overview in the
// dashboard rail, on its own URL (/userDashboard/leads), listing the CRM lead
// board through /api/leads -> shikkha_os.api.v1.leads.list_leads.
//
//   E2E_BASE=http://localhost:3011 MOCK_BASE=http://127.0.0.1:8787 \
//     node scripts/leads-nav-e2e.mjs
//
// Desktop (1440) asserts the rail order (overview -> leads -> create customer),
// the navigation itself, the table, search and status filtering. Mobile (390)
// asserts the rail entry + card layout with no horizontal overflow.

import { chromium } from "/root/arogga-UI/node_modules/playwright/index.mjs";
import { execFile } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { promisify } from "node:util";

const run_ = promisify(execFile);

const NEXT = process.env.E2E_BASE ?? "http://localhost:3011";
const MOCK = process.env.MOCK_BASE ?? "http://127.0.0.1:8787";
const PASSWORD = process.env.MOCK_PASSWORD ?? "demo1234";

// Read the staff key out of the mock so the double-c spelling is never retyped.
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

    // ---------------------------------------------------------- 1) the rail
    await page.goto(`${NEXT}/userDashboard`, { waitUntil: "domcontentloaded", timeout: 120000 });

    const leadsNav = page.locator("[data-nav-leads]");
    // The rail exists twice on phones (hidden desktop aside + drawer): interact
    // with the visible instance only.
    const leadsNavVisible = page.locator("[data-nav-leads]:visible").first();

    // Phones keep the rail inside a drawer: open it with the header burger. The
    // first click can land before hydration, so retry until the drawer shows.
    if (viewport.tag === "mobile") {
      const burger = page.locator('header button[aria-label="মেনু খুলুন"]').first();
      await burger.waitFor({ state: "visible", timeout: 60000 });
      for (let attempt = 1; attempt <= 5; attempt += 1) {
        await burger.click();
        try {
          await leadsNavVisible.waitFor({ state: "visible", timeout: 3000 });
          break;
        } catch {
          if (attempt === 5) throw new Error("the mobile drawer never opened");
          await page.waitForTimeout(800);
        }
      }
      // Let the drawer slide-in finish so geometry checks compare settled rows.
      await page.waitForTimeout(700);
    }

    await leadsNavVisible.waitFor({ state: "visible", timeout: 60000 });
    check((await leadsNav.count()) >= 1, `[${viewport.tag}] exactly one Leads rail item`);
    check(
      (await leadsNavVisible.innerText()).includes("লিডস"),
      `[${viewport.tag}] rail item is labelled লিডস`
    );

    // Order: Overview -> Leads -> (create customer, when present).
    const boxOf = async (locator) => {
      const count = await locator.count();
      return count ? await locator.first().boundingBox() : null;
    };
    const overviewBox = await boxOf(page.locator('[data-nav-key="overview"]:visible'));
    const leadsBox = await leadsNavVisible.boundingBox();
    check(Boolean(leadsBox), `[${viewport.tag}] Leads rail item is visible`);
    if (overviewBox && leadsBox) {
      check(
        leadsBox.y > overviewBox.y,
        `[${viewport.tag}] Leads sits BELOW Overview (leads y ${Math.round(
          leadsBox.y
        )} > overview y ${Math.round(overviewBox.y)})`
      );
      check(
        Math.abs(leadsBox.x - overviewBox.x) <= 2,
        `[${viewport.tag}] Leads aligns with the Overview rail column`
      );
      check(
        leadsBox.y - overviewBox.y < 90,
        `[${viewport.tag}] Leads is the next row under Overview (Δ ${Math.round(
          leadsBox.y - overviewBox.y
        )}px)`
      );
    } else {
      check(false, `[${viewport.tag}] Overview rail item found for the order check`);
    }

    // ------------------------------------------------------ 2) click → route
    await leadsNavVisible.click();
    await page.waitForURL(/\/userDashboard\/leads$/, { timeout: 60000 });
    await page.locator("[data-leads-view]").waitFor({ state: "visible", timeout: 60000 });
    check(
      new URL(page.url()).pathname === "/userDashboard/leads",
      `[${viewport.tag}] clicking Leads opens /userDashboard/leads`
    );

    const title = ((await page.locator("[data-leads-title]").first().innerText()) || "").trim();
    check(title === "লিডস", `[${viewport.tag}] page heading is ${title || "(empty)"}`);

    const sourceNote = ((await page.locator("[data-leads-source]").first().innerText()) || "").trim();
    check(
      sourceNote.includes("dash.shikkhachat.com/crm/leads/view/list"),
      `[${viewport.tag}] source note names the desk lead list`
    );

    // ------------------------------------------------------- 3) the rows
    const rows = page.locator("[data-lead-row]:visible");
    await rows.first().waitFor({ state: "visible", timeout: 60000 });
    check((await rows.count()) >= 7, `[${viewport.tag}] lead rows rendered (${await rows.count()})`);
    check(
      (await page.locator('[data-lead-status="Qualified"]').count()) >= 1,
      `[${viewport.tag}] a lead carries its CRM status chip (Qualified)`
    );

    // --------------------------------------------------- 4) status filter
    const statusSelect = page.locator("[data-leads-status]");
    await statusSelect.selectOption("New");
    await page.waitForTimeout(600);
    const newRows = page.locator("[data-lead-row]:visible");
    const newCount = await newRows.count();
    check(newCount >= 1, `[${viewport.tag}] status filter returns the "New" lead (${newCount})`);
    const allNew = await page.evaluate(() => {
      const chips = Array.from(
        document.querySelectorAll("[data-lead-row] [data-lead-status]")
      ).filter((chip) => chip.offsetParent !== null);
      return chips.length > 0 && chips.every((chip) => chip.getAttribute("data-lead-status") === "New");
    });
    check(allNew, `[${viewport.tag}] every filtered row is a "New" lead`);

    // --------------------------------------------------- 5) search filter
    await statusSelect.selectOption("");
    await page.waitForTimeout(400);
    await page.locator("[data-leads-search]").fill("Rahman");
    await page.waitForTimeout(900);
    const searchRows = page.locator("[data-lead-row]:visible");
    const searchCount = await searchRows.count();
    check(searchCount >= 1, `[${viewport.tag}] search "Rahman" returns a lead (${searchCount})`);
    check(
      ((await searchRows.first().innerText()) || "").includes("Rahman"),
      `[${viewport.tag}] the search hit mentions Rahman`
    );

    // ------------------------------------------- 5b) Action column + details
    // Desktop only: the table header. (Phones render cards, no thead.)
    if (viewport.tag === "desktop") {
      const thead = ((await page.locator("thead").first().innerText()) || "").replace(/\s+/g, " ");
      check(thead.includes("অ্যাকশন"), `[${viewport.tag}] header carries the Action column (${thead})`);
      check(!thead.includes("তারিখ"), `[${viewport.tag}] header no longer carries তারিখ`);

      const detailButtons = page.locator("[data-lead-row] [data-lead-details]");
      check(
        (await detailButtons.count()) === (await page.locator("[data-lead-row]").count()),
        `[${viewport.tag}] every table row has a View details button`
      );
      check(
        ((await detailButtons.first().innerText()) || "").includes("বিস্তারিত দেখুন"),
        `[${viewport.tag}] the button is labelled বিস্তারিত দেখুন`
      );
    }

    // Clear the search so the board is complete before opening a lead.
    await page.locator("[data-leads-search]").fill("");
    await page.waitForTimeout(900);

    await page.locator("[data-lead-details]:visible").first().click();
    await page.locator("[data-lead-detail]").waitFor({ state: "visible", timeout: 60000 });
    check(true, `[${viewport.tag}] View details opens the lead panel`);

    const tabs = page.locator("[data-lead-tab]");
    check((await tabs.count()) === 8, `[${viewport.tag}] desk tabs rendered (${await tabs.count()})`);

    await page.locator("[data-lead-activity]").first().waitFor({ state: "visible", timeout: 30000 });
    check(
      (await page.locator("[data-lead-activity]").count()) >= 3,
      `[${viewport.tag}] timeline shows the desk activity entries (${await page
        .locator("[data-lead-activity]")
        .count()})`
    );

    const panelText = ((await page.locator("[data-lead-tab-panel]").innerText()) || "").replace(/\s+/g, " ");
    check(panelText.includes("hello tamim"), `[${viewport.tag}] the comment body renders in the timeline`);
    check(panelText.includes("new notes"), `[${viewport.tag}] the note body renders in the timeline`);

    // Data tab
    await page.locator('[data-lead-tab="data"]').click();
    await page.locator("[data-lead-data]").waitFor({ state: "visible", timeout: 30000 });
    check(
      (await page.locator("[data-lead-data] dd").count()) >= 5,
      `[${viewport.tag}] Data tab lists the lead fields (${await page
        .locator("[data-lead-data] dd")
        .count()})`
    );

    // Comment from the panel (the Desk comment box)
    await page.locator('[data-lead-tab="activity"]').click();
    await page.locator("[data-lead-comment]").click();
    await page.locator("[data-lead-composer]").fill("portal probe comment");
    await page.locator("[data-lead-send]").click();
    await page.locator('[data-lead-notice="ok"]').waitFor({ state: "visible", timeout: 30000 });
    check(true, `[${viewport.tag}] a comment posted from the panel is accepted`);
    await page.waitForTimeout(800);
    check(
      (((await page.locator("[data-lead-tab-panel]").innerText()) || "").includes(
        "portal probe comment"
      )),
      `[${viewport.tag}] the posted comment appears in the timeline`
    );

    // Paperclip: the bytes go through the JSON proxy and land in Desk's File
    // list; the panel must show the new row in its Attachments tab.
    await page.locator("[data-lead-attach-input]").setInputFiles({
      name: "probe-attachment.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("portal probe attachment"),
    });
    await page.locator('[data-lead-notice="ok"]').waitFor({ state: "visible", timeout: 30000 });
    check(true, `[${viewport.tag}] an attachment uploaded from the panel is accepted`);
    await page.waitForTimeout(1200);
    check(
      ((await page.locator("[data-lead-tab-panel]").innerText()) || "").includes(
        "probe-attachment.txt"
      ),
      `[${viewport.tag}] the uploaded file shows in the Attachments tab`
    );

    // Clicking an attachment must show the file itself: pictures open in the
    // panel's own preview (streamed through /api/frappe-file), other files
    // open in a new tab — never a raw ERP-host URL the portal cannot reach.
    const imageRow = page.locator('[data-attachment-open][title]').filter({ hasText: "site-visit.png" }).first();
    await imageRow.waitFor({ state: "visible", timeout: 20000 });
    const thumb = page.locator("[data-lead-attachments] [data-attachment-thumb]").first();
    await thumb.waitFor({ state: "visible", timeout: 20000 });
    await page.waitForFunction(() => {
      const img = document.querySelector("[data-lead-attachments] [data-attachment-thumb]");
      return Boolean(img) && img.complete && img.naturalWidth > 0;
    }, null, { timeout: 20000 });
    check(true, `[${viewport.tag}] an image attachment shows a loaded thumbnail`);

    await imageRow.click();
    await page.locator("[data-attachment-preview]").waitFor({ state: "visible", timeout: 20000 });
    await page.waitForFunction(() => {
      const img = document.querySelector("[data-attachment-image]");
      return Boolean(img) && img.complete && img.naturalWidth > 0;
    }, null, { timeout: 20000 });
    const previewName = (await page.locator("[data-attachment-name]").innerText()) || "";
    check(
      previewName.includes("site-visit.png"),
      `[${viewport.tag}] clicking the picture opens it full-size in the panel`
    );
    await page.locator("[data-attachment-close]").click();
    await page.locator("[data-attachment-preview]").waitFor({ state: "detached", timeout: 10000 });
    check(true, `[${viewport.tag}] the image preview closes back to the Attachments tab`);

    const fileRow = page.locator('[data-attachment-open][title]').filter({ hasText: "quotation-2026.pdf" }).first();
    const popupPromise = page.context().waitForEvent("page", { timeout: 15000 });
    await fileRow.click();
    const popup = await popupPromise;
    await popup.waitForURL(/\/api\/frappe-file/, { timeout: 15000 }).catch(() => {});
    const popupUrl = popup.url();
    check(
      popupUrl.includes("/api/frappe-file") && popupUrl.includes("raw=1"),
      `[${viewport.tag}] a non-picture attachment opens through the portal's file proxy (${popupUrl.slice(0, 80)})`
    );
    await popup.close();

    // Comments tab: the comment stream Desk keeps (/desk/system/comment) —
    // comments written in Desk show here, and the panel's own posts land here.
    await page.locator('[data-lead-tab="comments"]').click();
    await page.locator("[data-lead-comment-item]").first().waitFor({ state: "visible", timeout: 20000 });
    const deskCommentCount = await page.locator("[data-lead-comment-item]").count();
    check(deskCommentCount >= 2, `[${viewport.tag}] the Comments tab lists Desk comments (${deskCommentCount})`);
    const commentsText = (await page.locator("[data-lead-comments]").innerText()) || "";
    check(
      commentsText.includes("hello") && commentsText.includes("portal probe comment"),
      `[${viewport.tag}] Desk-written and panel-written comments both render`
    );

    // Avatars: production returns site-relative paths (/files/…) the portal
    // origin cannot load — they must stream through /api/frappe-file, and when
    // the picture is missing the monogram takes over (never a broken icon).
    await page.waitForFunction(
      () => {
        const imgs = Array.from(document.querySelectorAll("[data-lead-comment-item] [data-lead-avatar]"));
        return imgs.length > 0 && imgs.every((img) => img.complete);
      },
      undefined,
      { timeout: 20000 }
    );
    const avatarState = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll("[data-lead-comment-item] [data-lead-avatar]"));
      return {
        total: imgs.length,
        loaded: imgs.filter((img) => img.naturalWidth > 0).length,
        proxies: imgs.filter((img) => String(img.getAttribute("src")).startsWith("/api/frappe-file")).length,
        fallbacks: document.querySelectorAll("[data-lead-comment-item] [data-lead-avatar-fallback]").length,
      };
    });
    check(avatarState.total >= 1, `[${viewport.tag}] comment avatars render (${avatarState.total})`);
    check(
      avatarState.proxies === avatarState.total,
      `[${viewport.tag}] avatars stream through the file proxy (${avatarState.proxies}/${avatarState.total})`
    );
    check(
      avatarState.loaded === avatarState.total,
      `[${viewport.tag}] every proxied avatar loads (${avatarState.loaded}/${avatarState.total}, ${avatarState.fallbacks} monograms)`
    );

    // Notes tab: the lead's CRM Note rows (title + body + author), newest first.
    await page.locator('[data-lead-tab="notes"]').click();
    await page.locator("[data-lead-note]").first().waitFor({ state: "visible", timeout: 20000 });
    const noteCount = await page.locator("[data-lead-note]").count();
    check(noteCount >= 2, `[${viewport.tag}] the Notes tab lists the lead's notes (${noteCount})`);
    const noteText = (await page.locator("[data-lead-notes]").innerText()) || "";
    check(
      noteText.length > 40 && !/undefined|null/.test(noteText),
      `[${viewport.tag}] note titles and bodies render without placeholder text`
    );

    // New note: the button sits top-right of the Notes tab and opens Desk's
    // Create Note form (required title + rich-text content), which writes an
    // FCRM Note so the row also shows up in Desk ▸ CRM ▸ Notes.
    const newNoteBtn = page.locator("[data-lead-new-note]");
    check(
      (await newNoteBtn.count()) === 1,
      `[${viewport.tag}] the Notes tab offers one New note button`
    );
    const noteSectionBox = await page.locator("[data-lead-tab-panel]").boundingBox();
    const noteBtnBox = await newNoteBtn.boundingBox();
    check(
      Boolean(noteSectionBox && noteBtnBox) &&
        noteBtnBox.x + noteBtnBox.width > noteSectionBox.x + noteSectionBox.width / 2 &&
        noteBtnBox.y < noteSectionBox.y + 80,
      `[${viewport.tag}] New note sits at the top-right of the Notes tab`
    );

    await newNoteBtn.click();
    await page.locator("[data-note-modal]").waitFor({ state: "visible", timeout: 10000 });
    check(
      (await page.locator("[data-note-title]").count()) === 1 &&
        (await page.locator("[data-note-content]").count()) === 1,
      `[${viewport.tag}] the note form shows a title and a content box`
    );
    const noteTools = await page.locator('[data-note-modal] [role="toolbar"] button').count();
    check(noteTools >= 12, `[${viewport.tag}] the content box has a full editing toolbar (${noteTools})`);

    // A missing title is caught before anything is sent.
    await page.locator("[data-note-create]").click();
    await page.locator("[data-note-error]").first().waitFor({ state: "visible", timeout: 5000 });
    check(
      !!(await page.locator("[data-note-error]").first().innerText()),
      `[${viewport.tag}] a note without a title is refused with a message`
    );

    const noteTitle = "E2E নোট — পোর্টাল থেকে তৈরি";
    await page.locator("[data-note-title]").fill(noteTitle);
    await page.locator("[data-note-content]").click();
    await page.keyboard.type("এই নোটটি পোর্টালের নতুন নোট ফর্ম থেকে তৈরি হয়েছে।");
    await page.locator("[data-note-create]").click();
    await page.locator("[data-note-modal]").waitFor({ state: "detached", timeout: 20000 });
    await page.waitForFunction(
      (title) => document.body.innerText.includes(title),
      noteTitle,
      { timeout: 20000 }
    );
    const firstNote = (await page.locator("[data-lead-note]").first().innerText()) || "";
    check(
      firstNote.includes(noteTitle),
      `[${viewport.tag}] the new note appears at the top of the Notes tab`
    );
    check(
      (await page.locator("[data-lead-note]").count()) > noteCount,
      `[${viewport.tag}] the Notes tab grew by the new note`
    );

    // Data tab: the lead's fields, editable in place — First Name / Last Name /
    // E-mail rows always exist, and a saved edit round-trips through the ERP.
    await page.locator('[data-lead-tab="data"]').click();
    await page.locator("[data-lead-data]").waitFor({ state: "visible", timeout: 20000 });
    check(
      (await page.locator("[data-lead-edit]").count()) === 1,
      `[${viewport.tag}] the Data tab offers Edit`
    );
    await page.locator("[data-lead-edit]").click();
    await page.locator('[data-lead-edit-field="first_name"]').waitFor({ state: "visible", timeout: 10000 });
    check(
      (await page.locator('[data-lead-edit-field="first_name"]').count()) === 1 &&
        (await page.locator('[data-lead-edit-field="last_name"]').count()) === 1 &&
        (await page.locator('[data-lead-edit-field="email"]').count()) === 1,
      `[${viewport.tag}] First Name, Last Name and E-mail are editable rows`
    );

    const originalLast = await page.locator('[data-lead-edit-field="last_name"]').inputValue();
    const newLast = `QA${Date.now() % 10000}`;
    await page.locator('[data-lead-edit-field="last_name"]').fill(newLast);
    await page.locator("[data-lead-save]").click();
    await page.waitForFunction(
      (expected) => {
        const el = document.querySelector('[data-lead-field="last_name"]');
        return el && (el.textContent || "").includes(expected);
      },
      newLast,
      { timeout: 20000 }
    );
    check(true, `[${viewport.tag}] a saved Last Name edit round-trips through the ERP`);

    // Restore the seed value so the rest of the suite sees pristine data.
    await page.locator("[data-lead-edit]").click();
    await page.locator('[data-lead-edit-field="last_name"]').waitFor({ state: "visible", timeout: 10000 });
    await page.locator('[data-lead-edit-field="last_name"]').fill(originalLast);
    await page.locator("[data-lead-save]").click();
    // Save closes the editor; the empty original renders as an em dash.
    await page.locator("[data-lead-edit]").waitFor({ state: "visible", timeout: 20000 });

    // Tasks tab: the New-task button lives in the section's top-right corner
    // and opens the task form popup; a created CRM Task must show in the list.
    await page.locator('[data-lead-tab="tasks"]').click();
    const newTaskBtn = page.locator("[data-lead-new-task]");
    await newTaskBtn.waitFor({ state: "visible", timeout: 20000 });
    const btnBox = await newTaskBtn.boundingBox();
    const sectionBox = await page.locator("[data-lead-tab-panel]").boundingBox();
    check(
      Boolean(btnBox && sectionBox && btnBox.x + btnBox.width > sectionBox.x + sectionBox.width / 2),
      `[${viewport.tag}] New task sits in the section's top-right corner`
    );

    await newTaskBtn.click();
    await page.locator("[data-task-modal]").waitFor({ state: "visible", timeout: 20000 });
    check(true, `[${viewport.tag}] New task opens the task form popup`);

    const priorityValues = await page
      .locator("[data-task-priority] option")
      .evaluateAll((nodes) => nodes.map((node) => node.value));
    check(
      JSON.stringify(priorityValues) === JSON.stringify(["", "High", "Medium", "Low"]),
      `[${viewport.tag}] priority offers High/Medium/Low/No Priority (${priorityValues.join(",")})`
    );

    const statusValues = await page
      .locator("[data-task-status] option")
      .evaluateAll((nodes) => nodes.map((node) => node.value));
    check(
      JSON.stringify(statusValues) ===
        JSON.stringify(["Backlog", "Todo", "In Progress", "Done", "Cancelled"]),
      `[${viewport.tag}] Status offers Backlog/Todo/In Progress/Done/Cancelled (${statusValues.join(",")})`
    );
    const defaultStatus = await page.locator("[data-task-status]").inputValue();
    check(defaultStatus === "Todo", `[${viewport.tag}] Status defaults to Todo (${defaultStatus})`);

    await page.waitForFunction(
      () => document.querySelectorAll("[data-task-assignee] option").length > 1,
      undefined,
      { timeout: 20000 }
    );
    const assigneeCount = await page.locator("[data-task-assignee] option").count();
    check(
      assigneeCount > 1,
      `[${viewport.tag}] Assigned To is fed from the HR employee list (${assigneeCount - 1} staff)`
    );

    // Empty title must be refused before any round-trip.
    await page.locator("[data-task-create]").click();
    await page.locator("[data-task-error]").waitFor({ state: "visible", timeout: 10000 });
    check(true, `[${viewport.tag}] the task form refuses an empty title`);

    const taskTitle = `QA task ${Date.now() % 10000}`;
    await page.locator("[data-task-title]").fill(taskTitle);
    await page.locator("[data-task-priority]").selectOption("High");
    const chosenEmployee = await page.locator("[data-task-assignee] option").nth(1).getAttribute("value");
    const chosenEmployeeLabel = (await page.locator("[data-task-assignee] option").nth(1).innerText()) || "";
    await page.locator("[data-task-assignee]").selectOption(chosenEmployee);
    await page.locator("[data-task-due]").fill("2026-12-31");
    await page.locator("[data-task-status]").selectOption("In Progress");
    await page.locator("[data-task-create]").click();
    await page.locator("[data-task-modal]").waitFor({ state: "detached", timeout: 30000 });
    check(true, `[${viewport.tag}] the task form submits and closes`);

    await page.locator("[data-lead-task-item]").first().waitFor({ state: "visible", timeout: 30000 });
    const tasksText = (await page.locator("[data-lead-tasks]").innerText()) || "";
    check(tasksText.includes(taskTitle), `[${viewport.tag}] the created task appears in the Tasks tab`);
    check(
      (await page.locator('[data-lead-task-priority="High"]').count()) >= 1,
      `[${viewport.tag}] the task keeps its High priority`
    );
    check(
      (await page.locator('[data-lead-task-status="In Progress"]').count()) >= 1,
      `[${viewport.tag}] the task keeps its In Progress status`
    );
    const assigneeShown = chosenEmployeeLabel.split("·")[0].trim();
    check(
      !assigneeShown || tasksText.includes(assigneeShown),
      `[${viewport.tag}] the task shows its assignee (${assigneeShown || "n/a"})`
    );

    await page.locator("[data-lead-detail-close]").click();
    await page.locator("[data-lead-detail]").waitFor({ state: "detached", timeout: 15000 });
    check(true, `[${viewport.tag}] the panel closes without leaving the board`);

    // -------------------------------------------------- 6) layout sanity
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    check(overflow <= 1, `[${viewport.tag}] no horizontal overflow (${overflow}px)`);
    check(errors.length === 0, `[${viewport.tag}] no console errors (${errors.slice(0, 2).join(" | ")})`);

    await page.screenshot({
      path: `/root/.hermes/cache/scratch/leads-${viewport.tag}.png`,
      fullPage: false,
    });

    // ------------------------------------------- 7) deep link (fresh load)
    await page.goto(`${NEXT}/userDashboard/leads`, {
      waitUntil: "domcontentloaded",
      timeout: 120000,
    });
    await page.locator("[data-leads-view]").waitFor({ state: "visible", timeout: 60000 });
    await page.locator("[data-lead-row]:visible").first().waitFor({ state: "visible", timeout: 60000 });
    check(
      (await page.locator("[data-lead-row]:visible").count()) >= 7,
      `[${viewport.tag}] a direct visit to /userDashboard/leads renders the board`
    );

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
