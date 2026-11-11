#!/usr/bin/env node
/**
 * Minimal Frappe-shaped stub for local development.
 *
 * It exists so the login -> dashboard flow can be exercised end to end without
 * a bench, and it doubles as executable documentation of the exact wire
 * contract the portal expects (status codes included):
 *
 *   417 ValidationError    -> bad/missing payload
 *   401 AuthenticationError-> bad credentials
 *   403 PermissionError    -> guest hitting a non-guest method
 *   200 + Set-Cookie: sid   -> successful sign-in
 *
 * Two demo accounts, one per account type, so the role-aware routing can be
 * exercised too — each signs in to a different dashboard:
 *
 *   staff   tamim@ioniccorporation.com / demo1234   (System User,  /userDashboard)
 *   client  client@example.com         / demo1234   (Website User, /clientDashboard)
 *
 *   node scripts/mock-frappe.mjs          # then: FRAPPE_BASE_URL=http://127.0.0.1:8787 npm run dev
 *
 * Never use this in production.
 */
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { createServer } from "node:http";

const PORT = Number(process.env.MOCK_FRAPPE_PORT ?? 8787);

const PASSWORD = "demo1234";
// Test aid: monotonic counter used by MOCK_PAYMENT_JITTER (see list_mine).
let paymentListSeq = 0;

/** A real (tiny) PNG so the account menu has a picture to load. */
const AVATAR_PATH = "/files/tamim-hasan.png";
const AVATAR_BYTES = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAIAAAAlC+aJAAAAUElEQVR42u3PQQkAAAgEsGthGhvZ/20E38JgBZbqeS0CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApcF12UAtbfzEQsAAAAASUVORK5CYII=",
  "base64"
);

const sessions = new Map();
// Optional per-request jitter for exercising the portal's Smart Reload: with
// MOCK_OVERVIEW_JITTER=1 each dashboard payload changes slightly, so a refetch
// genuinely differs and the portal must fall back to a hard reload.
let overviewCallSeq = 0;

const envelope = (data) =>
  JSON.stringify({ message: { api: "shikkha_os.v1", ok: true, data, meta: { duration_ms: 4 } } });

const serverMessages = (message, title = "") =>
  JSON.stringify([JSON.stringify({ message, title, indicator: "red" })]);

function failure(response, status, excType, message, title) {
  const body = JSON.stringify({
    exc_type: excType,
    exception: `${excType}: ${message}`,
    _server_messages: serverMessages(message, title),
  });

  response.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  response.end(body);
}

function ok(response, data, extraHeaders = {}) {
  response.writeHead(200, {
    "content-type": "application/json; charset=utf-8",
    ...extraHeaders,
  });
  response.end(envelope(data));
}

function readBody(request) {
  return new Promise((resolve) => {
    let raw = "";
    request.on("data", (chunk) => {
      raw += chunk;
    });
    request.on("end", () => {
      try {
        resolve(JSON.parse(raw || "{}"));
      } catch {
        resolve({});
      }
    });
  });
}

function cookieValue(request, name) {
  const header = request.headers.cookie ?? "";
  for (const segment of header.split(";")) {
    const index = segment.indexOf("=");
    if (index === -1) continue;
    if (segment.slice(0, index).trim() === name) return segment.slice(index + 1).trim();
  }
  return null;
}

function userFor(request) {
  const sid = cookieValue(request, "sid");
  if (!sid) return null;
  return sessions.get(sid) ?? null;
}

/**
 * Demo accounts. `user_type` mirrors Frappe's `User.user_type` and decides the
 * landing route (`dashboard_route`), exactly like
 * `shikkha_os.utils.profiles.dashboard_route_for` does on the real site.
 */
const DEMO_USERS = {
  "tamim@ioniccorporation.com": {
    password: PASSWORD,
    kind: "staff",
    can_create_customer: true,
    profile: {
      authenticated: true,
      name: "tamim@ioniccorporation.com",
      full_name: "Tamim Hasan",
      email: "tamim@ioniccorporation.com",
      user_image: AVATAR_PATH,
      time_zone: "Asia/Dhaka",
      language: "en",
      user_type: "System User",
      roles: ["System Manager", "Desk User"],
      is_admin: true,
      designation: "Junior Developer",
      department: "Engineering",
      dashboard_route: "/userDashboard",
    },
  },
  // A System User who LACKS Customer:create - the exact case that used to surface a
  // generic red "load failed" card. The portal must now show a clean, actionable
  // permission state instead (spec item 6), never a broken form or a raw error.
  "sales@ioniccorporation.com": {
    password: PASSWORD,
    kind: "staff",
    can_create_customer: false,
    profile: {
      authenticated: true,
      name: "sales@ioniccorporation.com",
      full_name: "Sales Executive",
      email: "sales@ioniccorporation.com",
      user_image: "",
      time_zone: "Asia/Dhaka",
      language: "bn",
      user_type: "System User",
      roles: ["Sales User"],
      is_admin: false,
      designation: "Sales Executive",
      department: "Sales",
      dashboard_route: "/userDashboard",
    },
  },
  // A SECOND Customer-capable System User, to prove *ownership* (not just role):
  // they may manage customers, yet must never read or delete another owner's.
  "manager@ioniccorporation.com": {
    password: PASSWORD,
    kind: "staff",
    can_create_customer: true,
    profile: {
      authenticated: true,
      name: "manager@ioniccorporation.com",
      full_name: "Ops Manager",
      email: "manager@ioniccorporation.com",
      user_image: "",
      time_zone: "Asia/Dhaka",
      language: "bn",
      user_type: "System User",
      roles: ["System Manager", "Desk User"],
      is_admin: false,
      designation: "Operations Manager",
      department: "Operations",
      dashboard_route: "/userDashboard",
    },
  },
  "client@example.com": {
    password: PASSWORD,
    kind: "client",
    profile: {
      authenticated: true,
      name: "client@example.com",
      full_name: "Nusrat Jahan",
      email: "client@example.com",
      user_image: "",
      time_zone: "Asia/Dhaka",
      language: "bn",
      user_type: "Website User",
      roles: ["Customer"],
      is_admin: false,
      dashboard_route: "/clientDashboard",
    },
  },
  // A second customer (Customer B) for the ownership tests: B must never see A's
  // payments, and a direct details call for A's payment must be refused.
  "client2@example.com": {
    password: PASSWORD,
    kind: "client",
    profile: {
      authenticated: true,
      name: "client2@example.com",
      full_name: "Rahim Uddin",
      email: "client2@example.com",
      user_image: "",
      time_zone: "Asia/Dhaka",
      language: "bn",
      user_type: "Website User",
      roles: ["Customer"],
      is_admin: false,
      dashboard_route: "/clientDashboard",
    },
  },
};

function redirectFor(account) {
  return account.profile.dashboard_route;
}

/**
 * Mirrors shikkha_os.api.v1.customer._require_creator: only a System User who
 * holds Customer:create may proceed. Returns a failure descriptor, or null when
 * allowed. A System User without the permission is refused with a PermissionError
 * (not a ValidationError) so the portal can show the dedicated permission state.
 */
/**
 * The Desk `User` a "Create Customer" click leaves behind (mirrors
 * `_provision_portal_user` in shikkha_os/api/v1/customer.py):
 *
 *  - no `email_id` in the form  -> `{created: false, reason: "no_email"}`
 *  - that e-mail already has a login -> `{created: false, reason: "exists"}`
 *  - `MOCK_USER_PROVISION_FAIL=1` -> `{created: false, reason: "error"}` while
 *    the customer itself is still created (that is the point of the switch)
 *  - otherwise a `Website User` row with the customer's own name and mobile.
 *
 * `mock.users.list` exposes the table so a suite can prove the row exists,
 * not just that the response claimed so.
 */
const customerUsers = new Map();
//: Set by `mock.users.fail` so one suite run can prove the error path without
//: restarting the mock (the customer must still be created when this trips).
let mockUserProvisionFail = process.env.MOCK_USER_PROVISION_FAIL === "1";

function mockProvisionCustomerUser(data) {
  const email = String(data.email_id ?? "").trim().toLowerCase();

  if (!email) return { created: false, reason: "no_email" };

  if (mockUserProvisionFail) {
    return {
      created: false,
      reason: "error",
      email,
      message: "The customer was created, but its login user could not be created.",
    };
  }

  if (DEMO_USERS[email] || customerUsers.has(email)) {
    return { created: false, reason: "exists", email, name: email, customer_portal_users: true };
  }

  // Mirrors the backend literally: first_name is the customer's whole name.
  const full = String(data.customer_name ?? "").trim().replace(/\s+/g, " ");
  const entry = {
    email,
    first_name: full || email.split("@")[0],
    full_name: full || email.split("@")[0],
    mobile_no: String(data.mobile_no ?? "").trim(),
    user_type: "Website User",
    enabled: 1,
    role: "Customer",
    role_profiles: ["Customer"],
  };
  customerUsers.set(email, entry);

  console.log(`[mock-frappe] USER CREATED ${email} (${entry.first_name})`);

  return {
    created: true,
    name: email,
    email,
    first_name: entry.first_name,
    full_name: entry.full_name,
    mobile_no: entry.mobile_no || null,
    role: "Customer",
    role_profiles: ["Customer"],
    customer_portal_users: true,
  };
}

function customerGate(account) {
  if (!account || account.kind !== "staff") {
    return { status: 403, exc: "ValidationError", message: "Only System Users can create customers." };
  }
  if (account.can_create_customer === false) {
    return { status: 403, exc: "PermissionError", message: "You do not have permission to create Customers." };
  }
  return null;
}

// --- Employee check-in (mirrors shikkha_os.api.v1.checkin.*) --------------- //
// The employee is resolved from the logged-in user (never the body), exactly
// like the real endpoint. `HR-EMP-00001` mirrors the reference document.
const DEMO_EMPLOYEES = {
  "tamim@ioniccorporation.com": { name: "HR-EMP-00001", employee_name: "Tamim Hasan Tast" },
  "sales@ioniccorporation.com": { name: "HR-EMP-00002", employee_name: "Sales Executive" },
};

const checkinRecords = [];
let checkinCounter = 0;

// Dev-only seed: a few days of punches for the demo employees so the history
// timeline (multiple punches/day, the rolling 10-day default window and the
// From/To date filter) can be exercised without punching live. In-memory only.
(function seedCheckins() {
  const seed = [
    ["HR-EMP-00001", "Tamim Hasan Tast", 0, "IN", "09:02:11"],
    ["HR-EMP-00001", "Tamim Hasan Tast", 0, "OUT", "13:10:40"],
    ["HR-EMP-00001", "Tamim Hasan Tast", 0, "IN", "14:03:05"],
    ["HR-EMP-00001", "Tamim Hasan Tast", 0, "OUT", "18:14:27"],
    ["HR-EMP-00001", "Tamim Hasan Tast", 1, "IN", "09:11:00"],
    ["HR-EMP-00001", "Tamim Hasan Tast", 1, "OUT", "18:02:00"],
    ["HR-EMP-00001", "Tamim Hasan Tast", 3, "IN", "09:20:05"],
    ["HR-EMP-00001", "Tamim Hasan Tast", 3, "OUT", "17:55:10"],
    ["HR-EMP-00001", "Tamim Hasan Tast", 6, "IN", "09:05:00"],
    ["HR-EMP-00001", "Tamim Hasan Tast", 6, "OUT", "18:10:00"],
    ["HR-EMP-00001", "Tamim Hasan Tast", 9, "IN", "10:00:00"],
    ["HR-EMP-00001", "Tamim Hasan Tast", 9, "OUT", "17:30:00"],
    ["HR-EMP-00001", "Tamim Hasan Tast", 12, "IN", "09:00:00"],
    ["HR-EMP-00001", "Tamim Hasan Tast", 12, "OUT", "18:00:00"],
    ["HR-EMP-00002", "Sales Executive", 0, "IN", "08:30:00"],
    ["HR-EMP-00002", "Sales Executive", 0, "OUT", "17:00:00"],
  ];
  const now = new Date();
  for (const [employee, employee_name, daysAgo, log_type, clockTime] of seed) {
    const d = new Date(now.getTime());
    d.setDate(d.getDate() - daysAgo);
    const ymd = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    checkinCounter += 1;
    checkinRecords.push({
      name: `EMP-CKIN-SEED-${String(checkinCounter).padStart(4, "0")}`,
      employee,
      employee_name,
      log_type,
      time: `${ymd} ${clockTime}`,
      device_id: "seed-demo",
      latitude: 23.8103,
      longitude: 90.4125,
      geolocation: "23.8103, 90.4125",
      creation: `${ymd} ${clockTime}`,
    });
  }
  // Oldest-first so latestCheckin()/lastCheckinOfType() (last array element) are right.
  checkinRecords.sort((a, b) => String(a.time).localeCompare(String(b.time)));
})();

function employeeFor(email) {
  const employee = DEMO_EMPLOYEES[email];
  return employee ? { name: employee.name, employee_name: employee.employee_name } : null;
}

function latestCheckin(employee) {
  const rows = checkinRecords.filter((row) => row.employee === employee);
  return rows.length ? rows[rows.length - 1] : null;
}

function lastCheckinOfType(employee, logType) {
  const rows = checkinRecords.filter(
    (row) => row.employee === employee && row.log_type === logType
  );
  return rows.length ? rows[rows.length - 1] : null;
}

function checkinState(employee) {
  const latest = latestCheckin(employee);
  return latest && latest.log_type === "IN" ? "in" : "out";
}

function nowStamp() {
  return new Date().toISOString().slice(0, 19).replace("T", " ");
}

function todayStamp() {
  return new Date().toISOString().slice(0, 10);
}

function truthy(value) {
  return value === true || value === 1 || ["1", "true", "yes", "on", "y"].includes(String(value).toLowerCase());
}

// --- Employee expense claim (mirrors shikkha_os.api.v1.expense_claim.*) ---- //
// The employee is resolved from the logged-in user (never the body), exactly
// like the real endpoint; ownership is enforced by the `employee` filter on the
// list and by an explicit owner check on details.
// --- CRM lead board (mirrors shikkha_os.api.v1.leads.list_leads) ----------- //
// The real endpoint reads `CRM Lead` through frappe.get_list, so the caller's
// own permissions decide the rows. The mock keeps a small fixed board and the
// same page/shape contract (statuses, has_more, start, limit).
const crmLeads = [
  {
    name: "CRM-LEAD-2026-00021",
    lead_name: "Md. Rakib Hasan",
    organization: "Rahman Traders",
    email: "rakib@rahmantraders.com",
    mobile: "01711234567",
    status: "Qualified",
    source: "Website",
    owner: "staff@shikkhachat.com",
    created: "2026-11-08 10:24:11",
  },
  {
    name: "CRM-LEAD-2026-00020",
    lead_name: "Nusrat Jahan",
    organization: "Ideal Coaching Centre",
    email: "nusrat@idealcoaching.edu.bd",
    mobile: "01822334456",
    status: "Contacted",
    source: "Facebook",
    owner: "staff@shikkhachat.com",
    created: "2026-11-07 15:02:47",
  },
  {
    name: "CRM-LEAD-2026-00019",
    lead_name: "Shafiq Ahmed",
    organization: "Green Valley School",
    email: "shafiq@greenvalley.edu",
    mobile: "01933445567",
    status: "New",
    source: "Referral",
    owner: "staff@shikkhachat.com",
    created: "2026-11-06 09:41:03",
  },
  {
    name: "CRM-LEAD-2026-00018",
    lead_name: "Tahmina Akter",
    organization: "Sunrise Kids Academy",
    email: "tahmina@sunrisekids.edu.bd",
    mobile: "01644556678",
    status: "Converted",
    source: "Walk-in",
    owner: "staff@shikkhachat.com",
    created: "2026-11-04 12:18:55",
  },
  {
    name: "CRM-LEAD-2026-00017",
    lead_name: "Kamal Uddin",
    organization: "Uddin Book House",
    email: "kamal@uddinbooks.com",
    mobile: "01555667789",
    status: "Nurturing",
    source: "Instagram",
    owner: "staff@shikkhachat.com",
    created: "2026-11-02 17:36:29",
  },
  {
    name: "CRM-LEAD-2026-00016",
    lead_name: "Farhana Islam",
    organization: "Bright Future School",
    email: "farhana@brightfuture.edu.bd",
    mobile: "01766778890",
    status: "Unqualified",
    source: "Cold Call",
    owner: "staff@shikkhachat.com",
    created: "2026-10-30 11:09:14",
  },
  {
    name: "CRM-LEAD-2026-00015",
    lead_name: "Anisur Rahman",
    organization: "City Model Academy",
    email: "anis@citymodel.edu.bd",
    mobile: "01877889901",
    status: "Contacted",
    source: "Website",
    owner: "staff@shikkhachat.com",
    created: "2026-10-28 08:52:36",
  },
];
const CRM_LEAD_STATUSES = ["New", "Contacted", "Nurturing", "Qualified", "Converted", "Unqualified"];

function crmLeadPayload(query) {
  const language = (query.get("language") || "bn").toLowerCase();
  const search = (query.get("search") || "").trim().toLowerCase();
  const status = (query.get("status") || "").trim();
  const start = Math.max(Number(query.get("start") || 0) || 0, 0);
  const limit = Math.min(Math.max(Number(query.get("limit") || 60) || 60, 1), 200);

  let rows = crmLeads.slice();
  if (status) rows = rows.filter((row) => row.status === status);
  if (search) {
    rows = rows.filter((row) =>
      [row.lead_name, row.organization, row.email, row.mobile, row.name]
        .join(" ")
        .toLowerCase()
        .includes(search)
    );
  }

  const page = rows.slice(start, start + limit);
  return {
    doctype: "CRM Lead",
    available: true,
    leads: page,
    statuses: CRM_LEAD_STATUSES,
    has_more: rows.length > start + page.length,
    start,
    limit,
    language,
  };
}


// --- CRM lead detail (mirrors shikkha_os.api.v1.leads.lead_detail) ---------- //
// The desk lead page behind "View details": same tab strip, same timeline
// entries (creation, owner, comment, note, e-mail) and the same Data labels.
// Comments posted from the portal land in `crmLeadExtraComments` and show up
// in the next detail read, exactly like a real `Comment` row.
const crmLeadExtraComments = new Map();
// Attachments uploaded from the portal land here and surface in the lead's
// Attachments tab, like a real `File` row attached to the doc.
const crmLeadExtraFiles = new Map();

// Seeded attachments so the Attachments tab has something to show: one picture
// (the tab previews it) and one non-picture (the tab opens it in a new tab).
const crmLeadSeedFilePaths = new Set([
  "/files/lead-site-visit.png",
  "/files/lead-quotation-2026.pdf",
]);

function crmLeadSeedAttachments() {
  const at = "2026-11-05T09:20:00.000Z";
  return [
    {
      key: "file:seed-site-visit",
      file_name: "site-visit.png",
      file_url: "/files/lead-site-visit.png",
      file_size: 184320,
      at,
    },
    {
      key: "file:seed-quote",
      file_name: "quotation-2026.pdf",
      file_url: "/files/lead-quotation-2026.pdf",
      file_size: 96256,
      at,
    },
  ];
}


// Notes written from the portal's New-note form; they prepend the seeded rows,
// exactly like a freshly created `FCRM Note` shows up first in Desk.
const crmLeadExtraNotes = new Map();
let crmNoteCounter = 5;

// The Notes tab: what the desk lead page's #notes tab lists — `CRM Note` rows
// attached to the lead, newest first, each with a title, its body and author.
function crmLeadNotes(name, language) {
  const bn = String(language || "bn").toLowerCase().startsWith("bn");
  const t = (en, bnText) => (bn ? bnText : en);
  const now = Date.now();
  const iso = (offsetMs) => new Date(now - offsetMs).toISOString().replace("T", " ").slice(0, 19);

  return [
    ...(crmLeadExtraNotes.get(name) || []),
    {
      key: "note:CRM-NOTE-00002",
      kind: "note",
      actor: "MD Shahzalal Amin Surker",
      actor_email: "shahzalal@ionicorporation.com",
      actor_image: "",
      text: t("Call recap — revised quotation", "কল সারসংক্ষেপ — সংশোধিত কোটেশন"),
      body: t(
        "Called the office this morning. They asked for the revised quotation by Sunday and want the delivery window confirmed on the same call.",
        "আজ সকালে অফিসে কল করা হয়েছে। রবিবারের মধ্যে সংশোধিত কোটেশন চেয়েছেন এবং একই কলে ডেলিভারির সময় নিশ্চিত করতে বলেছেন।"
      ),
      at: iso(5 * 60 * 60 * 1000),
      updated: iso(5 * 60 * 60 * 1000),
    },
    {
      key: "note:CRM-NOTE-00001",
      kind: "note",
      actor: "MD Shahzalal Amin Surker",
      actor_email: "shahzalal@ionicorporation.com",
      actor_image: "",
      text: t("Budget approved for the demo batch", "ডেমো ব্যাচের বাজেট অনুমোদিত"),
      body: t(
        "Budget approved for one demo batch of 40 seats. Payment will follow after the trial session, so keep the invoice draft ready.",
        "৪০ সিটের একটি ডেমো ব্যাচের বাজেট অনুমোদন হয়েছে। ট্রায়াল সেশনের পরে পেমেন্ট হবে, তাই ইনভয়েস ড্রাফট প্রস্তুত রাখুন।"
      ),
      at: iso(2 * 24 * 60 * 60 * 1000),
      updated: iso(2 * 24 * 60 * 60 * 1000),
    },
  ];
}


// --- CRM lead editable fields (mirrors `_EDITABLE_FIELDS` server-side) ----- //
// Same whitelist the ERP endpoint writes; anything else a caller sends is
// ignored, exactly like the real `update_lead`.
const CRM_LEAD_WRITE_MAP = {
  first_name: "first_name",
  last_name: "last_name",
  salutation: "salutation",
  organization: "organization",
  organization_name: "organization",
  company_name: "organization",
  email: "email",
  mobile_no: "mobile",
  phone: "mobile",
  job_title: "job_title",
  website: "website",
  territory: "territory",
  industry: "industry",
  status: "status",
  source: "source",
};

// Split the display name when the row has no explicit first/last name yet —
// seed rows only carry `lead_name`.
function crmLeadNameParts(row) {
  const explicitFirst = String(row.first_name ?? "").trim();
  const explicitLast = String(row.last_name ?? "").trim();
  const parts = String(row.lead_name ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  return {
    first: explicitFirst || parts[0] || "",
    last: explicitLast || parts.slice(1).join(" ") || "",
  };
}

// The Data tab rows: First Name / Last Name / E-mail always render (even when
// empty) so the portal can fill them in, and each editable row carries its
// doctype fieldname.
function crmLeadFields(row, t, ownerName) {
  const { first, last } = crmLeadNameParts(row);

  return [
    { field: "first_name", label: t("First Name", "প্রথম নাম"), value: first, editable: true },
    { field: "last_name", label: t("Last Name", "শেষ নাম"), value: last, editable: true },
    { field: "email", label: t("E-mail", "ইমেইল"), value: row.email || "", editable: true },
    { field: "mobile_no", label: t("Mobile", "মোবাইল"), value: row.mobile || "", editable: true },
    { field: "organization_name", label: t("Organization", "প্রতিষ্ঠান"), value: row.organization || "", editable: true },
    { field: "job_title", label: t("Job Title", "পদবি"), value: row.job_title || "", editable: true },
    { field: "website", label: t("Website", "ওয়েবসাইট"), value: row.website ?? "https://example.com", editable: true },
    { field: "territory", label: t("Territory", "টেরিটরি"), value: row.territory ?? t("Dhaka", "ঢাকা"), editable: true },
    { field: "industry", label: t("Industry", "ইন্ডাস্ট্রি"), value: row.industry ?? t("Education", "শিক্ষা"), editable: true },
    { field: "status", label: t("Status", "স্ট্যাটাস"), value: row.status, editable: true },
    { field: "source", label: t("Source", "সোর্স"), value: row.source, editable: true },
    { label: t("Lead Owner", "লিড ওনার"), value: ownerName },
    { label: t("Created", "তৈরি হয়েছে"), value: row.created },
  ];
}


// --- CRM tasks (mirrors `add_lead_task` / `get_task_options`) -------------- //
// Keyed by lead so a created task shows up when the sheet reloads.
const crmLeadTasks = new Map();
let crmLeadTaskCounter = 1;

// HR ▸ Employee — the same people the Desk employee list shows. `user` is the
// linked User; the ERP endpoint resolves employee -> user itself.
const crmTaskEmployees = [
  { value: "HR-EMP-00001", label: "MD Shahzalal Amin Surker", designation: "Managing Director", user: "sales@ioniccorporation.com", user_image: "" },
  { value: "HR-EMP-00002", label: "Tamim Hasan", designation: "Junior Developer", user: "tamim@ioniccorporation.com", user_image: "" },
  { value: "HR-EMP-00003", label: "Nusrat Jahan", designation: "Sales Executive", user: "manager@ioniccorporation.com", user_image: "" },
  { value: "HR-EMP-00004", label: "Rafiul Islam", designation: "Support Engineer", user: "", user_image: "" },
];

function crmTaskPriorityOptions(t) {
  return [
    { value: "", label: t("No Priority", "কোনো প্রায়োরিটি নেই") },
    { value: "High", label: t("High", "হাই") },
    { value: "Medium", label: t("Medium", "মিডিয়াম") },
    { value: "Low", label: t("Low", "লো") },
  ];
}

const crmTaskStatuses = ["Backlog", "Todo", "In Progress", "Done", "Cancelled"];

function crmTaskStatusOptions(t) {
  return [
    { value: "Backlog", label: t("Backlog", "ব্যাকলগ") },
    { value: "Todo", label: t("Todo", "করণীয়") },
    { value: "In Progress", label: t("In Progress", "চলমান") },
    { value: "Done", label: t("Done", "সম্পন্ন") },
    { value: "Cancelled", label: t("Cancelled", "বাতিল") },
  ];
}

function crmLeadTaskRows(name, t) {
  const rows = crmLeadTasks.get(name) || [];
  return rows.map((row) => ({
    key: row.name,
    kind: "task",
    actor: "Tamim Hasan",
    actor_email: "tamim@ioniccorporation.com",
    actor_image: "",
    text: `${row.title}${row.status ? ` · ${row.status}` : ""}`,
    body: "",
    at: row.at,
    title: row.title,
    status: row.status,
    priority: row.priority,
    assigned_to: row.assigned_to,
    assigned_label: row.assigned_label,
    due_date: row.due_date,
  }));
}

function crmLeadDetailPayload(name, language) {
  const row = crmLeads.find((lead) => lead.name === name);
  if (!row) return null;

  const bn = String(language || "bn").toLowerCase().startsWith("bn");
  const t = (en, bnText) => (bn ? bnText : en);
  const actress = "MD Shahzalal Amin Surker";
  const actorEmail = "shahzalal@ionicorporation.com";

  const now = Date.now();
  const iso = (offsetMs) => new Date(now - offsetMs).toISOString().replace("T", " ").slice(0, 19);

  const activity = [
    {
      key: "created:0",
      kind: "created",
      actor: actress,
      actor_email: actorEmail,
      actor_image: "",
      text: t("created this lead", "লিডটি তৈরি করেছেন"),
      body: "",
      at: row.created,
    },
    {
      key: "owner:1",
      kind: "owner",
      actor: actress,
      actor_email: actorEmail,
      actor_image: "",
      text: t("Lead Owner set to: " + actress, "লিড ওনার নির্ধারিত: " + actress),
      body: "",
      at: row.created,
    },
    {
      key: "comment:2",
      kind: "comment",
      actor: actress,
      actor_email: actorEmail,
      // Site-relative like production — the portal has to proxy it.
      actor_image: "/files/tamim-hasan.png",
      text: t("added a comment", "একটি মন্তব্য যোগ করেছেন"),
      body: "hello tamim",
      at: iso(58 * 60 * 1000),
    },
    {
      key: "comment:3",
      kind: "comment",
      actor: "MD Shahzalal Amin Surker",
      actor_email: "magneticsolutionltdbd@gmail.com",
      actor_image: "/files/tamim-hasan.png",
      text: t("added a comment", "একটি মন্তব্য যোগ করেছেন"),
      body: "hello",
      at: iso(190 * 60 * 1000),
    },
    {
      key: "note:3",
      kind: "note",
      actor: actress,
      actor_email: actorEmail,
      actor_image: "",
      text: t("added a note", "একটি নোট যোগ করেছেন"),
      body: "new notes",
      at: iso(57 * 60 * 1000),
    },
  ];

  for (const extra of crmLeadExtraComments.get(name) || []) {
    activity.push(extra);
  }

  const emails = [
    {
      key: "email:0",
      kind: "email",
      actor: row.email,
      actor_email: row.email,
      actor_image: "",
      text: t("sent an e-mail: Demo class schedule", "একটি ইমেইল পাঠিয়েছেন: ডেমো ক্লাসের সময়সূচি"),
      body: "",
      at: row.created,
    },
  ];

  const lead = {
    name: row.name,
    lead_name: row.lead_name,
    organization: row.organization,
    email: row.email,
    mobile: row.mobile,
    status: row.status,
    source: row.source,
    owner: row.owner,
    owner_name: actress,
    created: row.created,
    modified: row.created,
    image: "",
    fields: crmLeadFields(row, t, actress),
  };

  return {
    doctype: "CRM Lead",
    available: true,
    lead,
    activity,
    emails,
    comments: activity.filter((entry) => entry.kind === "comment"),
    calls: [],
    tasks: crmLeadTaskRows(name, t),
    notes: crmLeadNotes(name, language),
    attachments: [...(crmLeadExtraFiles.get(name) || []), ...crmLeadSeedAttachments()],
  };
}

const expenseClaims = [];
let expenseClaimCounter = 1;
// Payment Entries posted against portal-created claims (one per claim). Named
// apart from the customer `paymentEntries` store above.
const expensePaymentEntries = [];
let expensePaymentEntryCounter = 1000;

function displayStatus(row) {
  const docstatus = Number(row.docstatus || 0);
  const approval = String(row.approval_status || "").toLowerCase();
  const status = String(row.status || "").toLowerCase();
  const paid = truthy(row.is_paid);
  // Approval drives the label, like the desk's approval column: Draft ->
  // অপেক্ষমাণ, Approved -> অনুমোদিত, Rejected/Cancelled -> প্রত্যাখ্যাত.
  if (docstatus === 2 || status === "cancelled" || approval === "cancelled") return "cancelled";
  if (approval === "rejected" || status === "rejected") return "rejected";
  if (paid || status === "paid") return "paid";
  if (approval === "approved" || status === "approved") return "approved";
  return "draft";
}

function expenseRowPayload(row) {
  return {
    name: row.name,
    employee: row.employee,
    employee_name: row.employee_name,
    company: row.company,
    department: row.department,
    cost_center: row.cost_center,
    currency: row.currency || "",
    posting_date: row.posting_date,
    expense_approver: row.expense_approver || "",
    status: row.status || "",
    approval_status: row.approval_status || "",
    docstatus: Number(row.docstatus || 0),
    is_paid: truthy(row.is_paid),
    total_claimed_amount: Number(row.total_claimed_amount || 0),
    total_sanctioned_amount: Number(row.total_sanctioned_amount || 0),
    base_total_claimed_amount: Number(
      row.base_total_claimed_amount ?? row.total_claimed_amount ?? 0
    ),
    base_total_sanctioned_amount: Number(
      row.base_total_sanctioned_amount ?? row.total_sanctioned_amount ?? 0
    ),
    grand_total: Number(row.grand_total || 0),
    total_amount_reimbursed: Number(row.total_amount_reimbursed || 0),
    remark: row.remark || "",
    // A seed may pin display_status to model an older API build that derived
    // the key from the status word; the frontend must still read it correctly.
    display_status: row.display_status || displayStatus(row),
  };
}

function expenseSummary(rows, currency) {
  let draft = 0;
  let submitted = 0;
  let approved = 0;
  let rejected = 0;
  let cancelled = 0;
  let paid = 0;
  let claimed = 0;
  let sanctioned = 0;
  let baseSanctioned = 0;
  let reimbursed = 0;

  for (const row of rows) {
    const key = displayStatus(row);
    if (key === "draft") draft += 1;
    else if (key === "cancelled") cancelled += 1;
    else if (key === "rejected") rejected += 1;
    else {
      submitted += 1;
      if (key === "approved") approved += 1;
      if (key === "paid") paid += 1;
    }
    claimed += Number(row.total_claimed_amount || 0);
    sanctioned += Number(row.total_sanctioned_amount || 0);
    baseSanctioned += Number(
      row.base_total_sanctioned_amount ?? row.total_sanctioned_amount ?? 0
    );
    reimbursed += Number(row.total_amount_reimbursed || 0);
  }

  return {
    total: rows.length,
    draft,
    pending: submitted,
    approved,
    rejected,
    paid,
    cancelled,
    total_claimed_amount: claimed,
    total_sanctioned_amount: sanctioned,
    total_base_sanctioned_amount: baseSanctioned,
    total_amount_reimbursed: reimbursed,
    currency,
  };
}

// A representative Expense Claim schema (mirrors frappe.get_meta output).
const EXPENSE_PARENT_SECTIONS = [
  {
    key: "Claim Details",
    label: "Claim Details",
    fields: [
      { fieldname: "posting_date", label: "Posting Date", fieldtype: "Date", options: [], link_doctype: "", required: true, read_only: false, default: "", description: "", placeholder: "", depends_on: "" },
      { fieldname: "department", label: "Department", fieldtype: "Link", options: [], link_doctype: "Department", required: false, read_only: false, default: "", description: "", placeholder: "", depends_on: "" },
      { fieldname: "remark", label: "Remark", fieldtype: "Small Text", options: [], link_doctype: "", required: false, read_only: false, default: "", description: "", placeholder: "", depends_on: "" },
    ],
  },
];

const EXPENSE_CHILD_FIELDS = [
  { fieldname: "expense_date", label: "Expense Date", fieldtype: "Date", options: [], link_doctype: "", required: true, read_only: false, default: "", description: "", placeholder: "", depends_on: "" },
  { fieldname: "expense_type", label: "Expense Type", fieldtype: "Link", options: [], link_doctype: "Expense Claim Type", required: true, read_only: false, default: "", description: "", placeholder: "", depends_on: "" },
  { fieldname: "amount", label: "Amount", fieldtype: "Currency", options: [], link_doctype: "", required: true, read_only: false, default: "", description: "", placeholder: "", depends_on: "" },
  { fieldname: "description", label: "Description", fieldtype: "Small Text", options: [], link_doctype: "", required: false, read_only: false, default: "", description: "", placeholder: "", depends_on: "" },
];

const EXPENSE_LINK_OPTIONS = {
  "Expense Claim Type": ["Food", "Travel", "Mobile Bill", "Accommodation", "Conveyance"],
  "Cost Center": ["Main - MSL", "Sales - MSL"],
  Employee: ["HR-EMP-00001", "HR-EMP-00002"],
  Company: ["Magnetic Solution Limited"],
  Department: ["Sales - MSL", "Accounts - MSL", "Human Resources - MSL"],
  Currency: ["BDT", "USD", "EUR"],
};

function expenseAuto(user, employee) {
  return {
    employee: employee.name,
    employee_name: employee.employee_name,
    company: "Magnetic Solution Limited",
    department: "Sales - MSL",
    cost_center: "Main - MSL",
    currency: "BDT",
    expense_approver: user,
  };
}

// Seed a representative set of claims for tamim (HR-EMP-00001) covering every
// derived state (draft / submitted / approved / paid / rejected / cancelled) so
// the list, its serial numbers, the dynamic status chips and the details view
// all have real, populated data to exercise.
expenseClaims.push({
  name: "HR-EXP-2026-00001",
  employee: "HR-EMP-00001",
  employee_name: "Tamim Hasan Tast",
  company: "Magnetic Solution Limited",
  department: "Sales - MSL",
  cost_center: "Main - MSL",
  currency: "BDT",
  posting_date: "2026-10-04",
  expense_approver: "magneticsolutionltdbd@gmail.com",
  approval_status: "Draft",
  status: "Draft",
  docstatus: 0,
  total_claimed_amount: 500,
  total_sanctioned_amount: 0,
  grand_total: 500,
  total_amount_reimbursed: 0,
  is_paid: 0,
  remark: "Advance for client visit",
  expenses: [
    { expense_date: "2026-10-04", expense_type: "Travel", description: "Local travel", amount: 500, sanctioned_amount: 0, cost_center: "Main - MSL" },
  ],
  owner: "tamim@ioniccorporation.com",
  creation: "2026-10-04 10:00:00",
  modified: "2026-10-04 10:00:00",
});

// Submitted — awaiting approval. ERPNext keeps status "Draft" after submit
// (only docstatus moves to 1), so this seed is the regression for the
// "প্রক্রিয়াধীন must become অনুমোদিত once submitted" rule.
expenseClaims.push({
  name: "HR-EXP-2026-00002",
  employee: "HR-EMP-00001",
  employee_name: "Tamim Hasan Tast",
  company: "Magnetic Solution Limited",
  department: "Sales - MSL",
  cost_center: "Main - MSL",
  currency: "BDT",
  posting_date: "2026-10-03",
  expense_approver: "magneticsolutionltdbd@gmail.com",
  approval_status: "Draft",
  status: "Draft",
  docstatus: 1,
  total_claimed_amount: 1200,
  total_sanctioned_amount: 0,
  grand_total: 1200,
  total_amount_reimbursed: 0,
  is_paid: 0,
  remark: "",
  expenses: [
    { expense_date: "2026-10-03", expense_type: "Travel", description: "Dhaka to Chattogram", amount: 900, sanctioned_amount: 0, cost_center: "Main - MSL" },
    { expense_date: "2026-10-03", expense_type: "Food", description: "Team lunch", amount: 300, sanctioned_amount: 0, cost_center: "Main - MSL" },
  ],
  owner: "tamim@ioniccorporation.com",
  creation: "2026-10-03 09:15:00",
  modified: "2026-10-03 09:15:00",
});

// Approved — sanctioned, not yet paid.
expenseClaims.push({
  name: "HR-EXP-2026-00003",
  employee: "HR-EMP-00001",
  employee_name: "Tamim Hasan Tast",
  company: "Magnetic Solution Limited",
  department: "Sales - MSL",
  cost_center: "Main - MSL",
  currency: "BDT",
  posting_date: "2026-10-02",
  expense_approver: "magneticsolutionltdbd@gmail.com",
  approval_status: "Approved",
  status: "Submitted",
  docstatus: 1,
  total_claimed_amount: 2100,
  total_sanctioned_amount: 2100,
  grand_total: 2100,
  total_amount_reimbursed: 0,
  is_paid: 0,
  remark: "Approved by manager",
  expenses: [
    { expense_date: "2026-10-02", expense_type: "Accommodation", description: "Hotel stay", amount: 2100, sanctioned_amount: 2100, cost_center: "Main - MSL" },
  ],
  owner: "tamim@ioniccorporation.com",
  creation: "2026-10-02 11:20:00",
  modified: "2026-10-02 11:45:00",
});

// Paid — reimbursed.
expenseClaims.push({
  name: "HR-EXP-2026-00004",
  employee: "HR-EMP-00001",
  employee_name: "Tamim Hasan Tast",
  company: "Magnetic Solution Limited",
  department: "Sales - MSL",
  cost_center: "Main - MSL",
  currency: "BDT",
  posting_date: "2026-10-01",
  expense_approver: "magneticsolutionltdbd@gmail.com",
  approval_status: "Approved",
  status: "Paid",
  docstatus: 1,
  total_claimed_amount: 800,
  total_sanctioned_amount: 800,
  grand_total: 800,
  total_amount_reimbursed: 800,
  is_paid: 1,
  remark: "",
  expenses: [
    { expense_date: "2026-10-01", expense_type: "Mobile Bill", description: "October bill", amount: 800, sanctioned_amount: 800, cost_center: "Main - MSL" },
  ],
  owner: "tamim@ioniccorporation.com",
  creation: "2026-10-01 08:00:00",
  modified: "2026-10-01 12:00:00",
});

// Sanctioned in a foreign claim currency. ERPNext stores the sanctioned figure
// twice — 100 USD in the claim, 12,000 BDT in the company's base currency — and
// the portal reports the base figure, exactly like the desk.
expenseClaims.push({
  name: "HR-EXP-2026-00007",
  employee: "HR-EMP-00001",
  employee_name: "Tamim Hasan Tast",
  company: "Magnetic Solution Limited",
  department: "Sales - MSL",
  cost_center: "Main - MSL",
  currency: "USD",
  posting_date: "2026-09-29",
  expense_approver: "magneticsolutionltdbd@gmail.com",
  approval_status: "Approved",
  status: "Submitted",
  docstatus: 1,
  total_claimed_amount: 100,
  total_sanctioned_amount: 100,
  base_total_claimed_amount: 12000,
  base_total_sanctioned_amount: 12000,
  grand_total: 100,
  total_amount_reimbursed: 0,
  is_paid: 0,
  remark: "Overseas conference fee",
  expenses: [
    { expense_date: "2026-09-29", expense_type: "Travel", description: "Conference fee (USD)", amount: 100, sanctioned_amount: 100, cost_center: "Main - MSL" },
  ],
  owner: "tamim@ioniccorporation.com",
  creation: "2026-09-29 07:40:00",
  modified: "2026-09-29 08:10:00",
});

// Unpaid — approved, money not yet reimbursed. The desk's Status column reads
// "Unpaid" here, and the portal must show অনুমোদিত for it, not প্রক্রিয়াধীন.
expenseClaims.push({
  name: "HR-EXP-2026-00008",
  employee: "HR-EMP-00001",
  employee_name: "Tamim Hasan Tast",
  company: "Magnetic Solution Limited",
  department: "Sales - MSL",
  cost_center: "Main - MSL",
  currency: "BDT",
  posting_date: "2026-09-28",
  expense_approver: "magneticsolutionltdbd@gmail.com",
  approval_status: "Approved",
  status: "Unpaid",
  docstatus: 1,
  total_claimed_amount: 300,
  total_sanctioned_amount: 300,
  base_total_claimed_amount: 300,
  base_total_sanctioned_amount: 300,
  grand_total: 300,
  total_amount_reimbursed: 0,
  is_paid: 0,
  remark: "Hotel bill, awaiting reimbursement",
  expenses: [
    { expense_date: "2026-09-28", expense_type: "Travel", description: "Hotel bill", amount: 300, sanctioned_amount: 300, cost_center: "Main - MSL" },
  ],
  owner: "tamim@ioniccorporation.com",
  creation: "2026-09-28 09:00:00",
  modified: "2026-09-28 10:30:00",
});

// Submitted, but the API still reports display_status "draft" (what an older
// build derived from status == "Draft"). The frontend must correct this by
// docstatus and still render অনুমোদিত.
expenseClaims.push({
  name: "HR-EXP-2026-00009",
  employee: "HR-EMP-00001",
  employee_name: "Tamim Hasan Tast",
  company: "Magnetic Solution Limited",
  department: "Sales - MSL",
  cost_center: "Main - MSL",
  currency: "BDT",
  posting_date: "2026-09-27",
  expense_approver: "magneticsolutionltdbd@gmail.com",
  approval_status: "Draft",
  status: "Draft",
  docstatus: 1,
  display_status: "draft",
  total_claimed_amount: 250,
  total_sanctioned_amount: 0,
  base_total_claimed_amount: 250,
  base_total_sanctioned_amount: 0,
  grand_total: 250,
  total_amount_reimbursed: 0,
  is_paid: 0,
  remark: "Submitted claim, status word still Draft",
  expenses: [
    { expense_date: "2026-09-27", expense_type: "Conveyance", description: "Rickshaw fare", amount: 250, sanctioned_amount: 0, cost_center: "Main - MSL" },
  ],
  owner: "tamim@ioniccorporation.com",
  creation: "2026-09-27 16:00:00",
  modified: "2026-09-27 16:20:00",
});

// Rejected.
expenseClaims.push({
  name: "HR-EXP-2026-00005",
  employee: "HR-EMP-00001",
  employee_name: "Tamim Hasan Tast",
  company: "Magnetic Solution Limited",
  department: "Sales - MSL",
  cost_center: "Main - MSL",
  currency: "BDT",
  posting_date: "2026-09-30",
  expense_approver: "magneticsolutionltdbd@gmail.com",
  approval_status: "Rejected",
  status: "Rejected",
  docstatus: 1,
  total_claimed_amount: 300,
  total_sanctioned_amount: 0,
  grand_total: 300,
  total_amount_reimbursed: 0,
  is_paid: 0,
  remark: "Receipt missing",
  expenses: [
    { expense_date: "2026-09-30", expense_type: "Conveyance", description: "CNG fare", amount: 300, sanctioned_amount: 0, cost_center: "Main - MSL" },
  ],
  owner: "tamim@ioniccorporation.com",
  creation: "2026-09-30 17:30:00",
  modified: "2026-09-30 18:00:00",
});

// Cancelled (docstatus 2) — must render the muted "Cancelled" chip.
expenseClaims.push({
  name: "HR-EXP-2026-00006",
  employee: "HR-EMP-00001",
  employee_name: "Tamim Hasan Tast",
  company: "Magnetic Solution Limited",
  department: "Sales - MSL",
  cost_center: "Main - MSL",
  currency: "BDT",
  posting_date: "2026-09-29",
  expense_approver: "magneticsolutionltdbd@gmail.com",
  approval_status: "Rejected",
  status: "Cancelled",
  docstatus: 2,
  total_claimed_amount: 450,
  total_sanctioned_amount: 0,
  grand_total: 450,
  total_amount_reimbursed: 0,
  is_paid: 0,
  remark: "Withdrawn by employee",
  expenses: [
    { expense_date: "2026-09-29", expense_type: "Food", description: "Client dinner", amount: 450, sanctioned_amount: 0, cost_center: "Main - MSL" },
  ],
  owner: "tamim@ioniccorporation.com",
  creation: "2026-09-29 20:00:00",
  modified: "2026-09-29 20:30:00",
});

// Keep created claim ids past the seeded range (next create -> HR-EXP-2026-00010).
expenseClaimCounter = 9;

// --- customer payment history (mirrors shikkha_os.api.v1.payment_entry.*) --- //
// The customer is resolved from the logged-in user (never the body), exactly
// like the real endpoint; ownership is enforced by the `party` filter on the
// list and by an explicit party check on details. Draft (docstatus 0) and
// Submitted (docstatus 1) rows are returned; the seeded Cancelled row proves
// exclusion.
const linkedCustomers = {
  "client@example.com": { name: "CUST-0001", customer_name: "Nusrat Jahan" },
  "client2@example.com": { name: "CUST-0002", customer_name: "Rahim Uddin" },
};

// --- Manual payment requests (mirrors shikkha_os.api.v1.manual_payment.*) ---
// In-memory persistence so the flow can be exercised end-to-end without a real
// ERP: create writes a row, list returns the caller's own rows, and a repeat of
// the same customer+method+transaction is refused (duplicate). The customer is
// always resolved from the session, never the body.
const manualBanks = [
  { name: "Dutch-Bangla Bank", bank_name: "Dutch-Bangla Bank", account_name: "Shikkha Chat Limited", account_number: "PLACEHOLDER-1101-00000000", branch: "Motijheel Branch", routing_number: "090000000", instructions: "Add the student/account reference exactly as shown.", is_placeholder: true },
  { name: "BRAC Bank", bank_name: "BRAC Bank", account_name: "Shikkha Chat Limited", account_number: "PLACEHOLDER-1501-00000000", branch: "Gulshan Branch", routing_number: "060000000", instructions: "", is_placeholder: true },
  { name: "The City Bank", bank_name: "The City Bank", account_name: "Shikkha Chat Limited", account_number: "PLACEHOLDER-1401-00000000", branch: "Dhanmondi Branch", routing_number: "225000000", instructions: "", is_placeholder: true },
  { name: "Islami Bank Bangladesh", bank_name: "Islami Bank Bangladesh", account_name: "Shikkha Chat Limited", account_number: "PLACEHOLDER-1251-00000000", branch: "Agrabad Branch", routing_number: "125000000", instructions: "", is_placeholder: true },
  { name: "Eastern Bank", bank_name: "Eastern Bank", account_name: "Shikkha Chat Limited", account_number: "PLACEHOLDER-1011-00000000", branch: "Banani Branch", routing_number: "095000000", instructions: "", is_placeholder: true },
  { name: "Sonali Bank", bank_name: "Sonali Bank", account_name: "Shikkha Chat Limited", account_number: "PLACEHOLDER-2001-00000000", branch: "Head Office Branch", routing_number: "200000000", instructions: "", is_placeholder: true },
  { name: "Dhaka Bank", bank_name: "Dhaka Bank", account_name: "Shikkha Chat Limited", account_number: "PLACEHOLDER-1201-00000000", branch: "Motijheel Branch", routing_number: "110000000", instructions: "", is_placeholder: true },
];

// Manual payments are written straight into the Payment Entry list (there is no
// separate "Manual Payment Request" DocType any more); a customer's own entries
// are read back through shikkha_os.api.v1.payment_entry.list_mine.
let manualPaymentSeq = 0;
const manualModeByMethod = { bkash: "bKash", rocket: "Rocket", nagad: "Nagad", bank: "Bank" };

const paymentEntries = [
  {
    name: "ACC-PAY-2026-00045",
    paid_from: "Debtors - MSL",
    paid_to: "Bank - MSL",
    contact_person: "Nusrat Jahan",
    contact_email: "nusrat@example.com",
    total_allocated_amount: 5000,
    unallocated_amount: 0,
    posting_date: "2026-10-04",
    payment_type: "Receive",
    party_type: "Customer",
    party: "CUST-0001",
    party_name: "Nusrat Jahan",
    paid_amount: 5000,
    received_amount: 5000,
    paid_from_account_currency: "BDT",
    paid_to_account_currency: "BDT",
    mode_of_payment: "Bank",
    reference_no: "TXN12345",
    reference_date: "2026-10-03",
    status: "Submitted",
    docstatus: 1,
    company: "Magnetic Solution Limited",
    remarks: "Advance received against order",
    references: [
      {
        reference_doctype: "Sales Invoice",
        reference_name: "SINV-2026-00012",
        due_date: "2026-10-20",
        total_amount: 5000,
        outstanding_amount: 0,
        allocated_amount: 5000,
      },
    ],
  },
  {
    name: "ACC-PAY-2026-00031",
    paid_from: "Debtors - MSL",
    paid_to: "Cash - MSL",
    contact_person: "Nusrat Jahan",
    contact_email: "nusrat@example.com",
    total_allocated_amount: 2500,
    unallocated_amount: 0,
    posting_date: "2026-09-15",
    payment_type: "Receive",
    party_type: "Customer",
    party: "CUST-0001",
    party_name: "Nusrat Jahan",
    paid_amount: 2500,
    received_amount: 2500,
    paid_from_account_currency: "BDT",
    paid_to_account_currency: "BDT",
    mode_of_payment: "Cash",
    reference_no: "",
    reference_date: "",
    status: "Reconciled",
    docstatus: 1,
    company: "Magnetic Solution Limited",
    remarks: "",
    references: [],
  },
  // Draft - shown to the customer (receipt not yet submitted).
  {
    name: "ACC-PAY-2026-00050",
    paid_from: "Debtors - MSL",
    paid_to: "Cash - MSL",
    contact_person: "Nusrat Jahan",
    contact_email: "nusrat@example.com",
    total_allocated_amount: 0,
    unallocated_amount: 9999,
    posting_date: "2026-10-04",
    payment_type: "Receive",
    party_type: "Customer",
    party: "CUST-0001",
    party_name: "Nusrat Jahan",
    paid_amount: 9999,
    received_amount: 9999,
    paid_from_account_currency: "BDT",
    paid_to_account_currency: "BDT",
    mode_of_payment: "Cash",
    reference_no: "",
    reference_date: "",
    status: "Draft",
    docstatus: 0,
    company: "Magnetic Solution Limited",
    remarks: "",
    references: [],
  },
  // Cancelled - must NEVER appear in the history.
  {
    name: "ACC-PAY-2026-00051",
    paid_from: "Debtors - MSL",
    paid_to: "Cash - MSL",
    contact_person: "Nusrat Jahan",
    contact_email: "nusrat@example.com",
    total_allocated_amount: 0,
    unallocated_amount: 7777,
    posting_date: "2026-10-04",
    payment_type: "Receive",
    party_type: "Customer",
    party: "CUST-0001",
    party_name: "Nusrat Jahan",
    paid_amount: 7777,
    received_amount: 7777,
    paid_from_account_currency: "BDT",
    paid_to_account_currency: "BDT",
    mode_of_payment: "Cash",
    reference_no: "",
    reference_date: "",
    status: "Cancelled",
    docstatus: 2,
    company: "Magnetic Solution Limited",
    remarks: "",
    references: [],
  },
  // Customer B (client2@example.com) - must never be visible to Customer A.
  {
    name: "ACC-PAY-2026-00060",
    paid_from: "Debtors - MSL",
    paid_to: "Bank - MSL",
    contact_person: "Rahim Uddin",
    contact_email: "rahim@example.com",
    total_allocated_amount: 12000,
    unallocated_amount: 0,
    posting_date: "2026-10-02",
    payment_type: "Receive",
    party_type: "Customer",
    party: "CUST-0002",
    party_name: "Rahim Uddin",
    paid_amount: 12000,
    received_amount: 12000,
    paid_from_account_currency: "BDT",
    paid_to_account_currency: "BDT",
    mode_of_payment: "Bank",
    reference_no: "TXN99999",
    reference_date: "2026-10-01",
    status: "Submitted",
    docstatus: 1,
    company: "Magnetic Solution Limited",
    remarks: "",
    references: [],
  },
];

// ---- Extra seeded receipts (Customer A) ------------------------------------
// A larger, varied history so the portal's status / amount / posting-date
// filters, the rows-per-page selector and the summary / chart can be exercised
// realistically. Deterministic values only (no randomness), so the Smart Reload
// fingerprint stays stable across requests.
{
  const extraSeeds = [
    ["2026-10-05", 500, "Submitted", "Bank", 1],
    ["2026-10-03", 750, "Reconciled", "Cash", 1],
    ["2026-10-01", 1200, "Submitted", "bKash", 1],
    ["2026-09-28", 300, "Reconciled", "Cash", 1],
    ["2026-09-25", 2200, "Submitted", "Bank", 1],
    ["2026-09-20", 450, "Reconciled", "Nagad", 1],
    ["2026-09-18", 1000, "Reconciled", "Bank", 1],
    ["2026-09-12", 600, "Submitted", "Cash", 1],
    ["2026-09-09", 3200, "Reconciled", "Bank", 1],
    ["2026-09-05", 800, "Submitted", "bKash", 1],
    ["2026-08-30", 500, "Reconciled", "Cash", 1],
    ["2026-08-24", 1750, "Submitted", "Bank", 1],
    ["2026-08-19", 950, "Reconciled", "Nagad", 1],
    ["2026-08-15", 400, "Draft", "Cash", 0],
    ["2026-08-10", 2600, "Submitted", "Bank", 1],
    ["2026-08-04", 550, "Reconciled", "bKash", 1],
    ["2026-07-29", 1350, "Reconciled", "Bank", 1],
    ["2026-07-22", 720, "Submitted", "Cash", 1],
    ["2026-07-17", 500, "Reconciled", "Nagad", 1],
    ["2026-07-11", 4100, "Submitted", "Bank", 1],
    ["2026-07-06", 640, "Draft", "Cash", 0],
    ["2026-06-30", 880, "Reconciled", "bKash", 1],
    ["2026-06-24", 1500, "Reconciled", "Bank", 1],
    ["2026-06-18", 500, "Submitted", "Cash", 1],
    ["2026-06-11", 2000, "Reconciled", "Nagad", 1],
    ["2026-06-05", 350, "Reconciled", "Cash", 1],
    ["2026-05-29", 1750, "Submitted", "Bank", 1],
    ["2026-05-21", 900, "Draft", "bKash", 0],
  ];
  for (let i = 0; i < extraSeeds.length; i += 1) {
    const [postingDate, amount, status, mode, docstatus] = extraSeeds[i];
    const bankLike = mode === "Bank";
    paymentEntries.push({
      name: `ACC-PAY-2026-${String(101 + i).padStart(5, "0")}`,
      paid_from: "Debtors - MSL",
      paid_to: bankLike ? "Bank - MSL" : "Cash - MSL",
      contact_person: "Nusrat Jahan",
      contact_email: "nusrat@example.com",
      total_allocated_amount: docstatus === 1 ? amount : 0,
      unallocated_amount: docstatus === 1 ? 0 : amount,
      posting_date: postingDate,
      payment_type: "Receive",
      party_type: "Customer",
      party: "CUST-0001",
      party_name: "Nusrat Jahan",
      paid_amount: amount,
      received_amount: amount,
      paid_from_account_currency: "BDT",
      paid_to_account_currency: "BDT",
      mode_of_payment: mode,
      reference_no: "",
      reference_date: "",
      status,
      docstatus,
      company: "Magnetic Solution Limited",
      remarks: "",
      references: [],
    });
  }
}

function paymentDisplayAmount(row) {
  const paymentType = String(row.payment_type || "").trim().toLowerCase();
  const paid = Number(row.paid_amount || 0);
  const received = Number(row.received_amount || 0);
  if (paymentType === "pay") return received || paid;
  return paid || received;
}

function paymentDisplayCurrency(row) {
  const paymentType = String(row.payment_type || "").trim().toLowerCase();
  if (paymentType === "pay") {
    return row.paid_to_account_currency || row.paid_from_account_currency || "";
  }
  return row.paid_from_account_currency || row.paid_to_account_currency || "";
}

function paymentDisplayStatus(row) {
  // Mirror the real endpoint: the document's own `status` field, verbatim.
  const status = String(row.status || "").trim();
  if (status) return status;
  const docstatus = Number(row.docstatus || 0);
  if (docstatus === 2) return "Cancelled";
  if (docstatus === 1) return "Submitted";
  return "Draft";
}

function paymentRowPayload(row) {
  return {
    name: row.name,
    posting_date: row.posting_date || "",
    payment_type: row.payment_type || "",
    party_type: row.party_type || "",
    party: row.party || "",
    party_name: row.party_name || "",
    paid_amount: Number(row.paid_amount || 0),
    received_amount: Number(row.received_amount || 0),
    mode_of_payment: row.mode_of_payment || "",
    reference_no: row.reference_no || "",
    reference_date: row.reference_date || "",
    status: row.status || "",
    docstatus: Number(row.docstatus || 0),
    company: row.company || "",
    amount: paymentDisplayAmount(row),
    currency: paymentDisplayCurrency(row),
    display_status: paymentDisplayStatus(row),
    paid_from: row.paid_from || "",
    paid_to: row.paid_to || "",
    paid_from_account_currency: row.paid_from_account_currency || "",
    paid_to_account_currency: row.paid_to_account_currency || "",
    contact_person: row.contact_person || "",
    contact_email: row.contact_email || "",
    total_allocated_amount: Number(row.total_allocated_amount || 0),
    unallocated_amount: Number(row.unallocated_amount || 0),
  };
}

function paymentSummary(rows, currency) {
  const month = new Date().toISOString().slice(0, 7);
  let totalAmount = 0;
  let monthAmount = 0;
  let monthCount = 0;
  let latest = "";

  for (const row of rows) {
    const amount = Number(row.amount || 0);
    totalAmount += amount;
    const posting = String(row.posting_date || "");
    if (posting) {
      if (posting > latest) latest = posting;
      if (posting.slice(0, 7) === month) {
        monthCount += 1;
        monthAmount += amount;
      }
    }
  }

  return {
    total: rows.length,
    total_amount: totalAmount,
    this_month_count: monthCount,
    this_month_amount: monthAmount,
    latest_payment_date: latest,
    currency,
  };
}

// --- customer service build / Sales Invoice (mirrors shikkha_os.api.v1.sales_invoice.*) --- //
// The customer is resolved from the logged-in user (never the body), exactly
// like the real endpoint; ownership is enforced by the `customer` filter on the
// list and by an explicit customer check on details. Draft (docstatus 0) and
// Submitted (docstatus 1) rows are returned; the seeded Cancelled row proves
// exclusion.
const salesInvoices = [
  {
    name: "ACC-SINV-2026-00012",
    posting_date: "2026-09-16",
    due_date: "2026-09-30",
    status: "Paid",
    docstatus: 1,
    grand_total: 5000,
    rounded_total: 5000,
    net_total: 5000,
    total: 5000,
    outstanding_amount: 0,
    currency: "BDT",
    company: "Magnetic Solution Limited",
    customer: "CUST-0001",
    customer_name: "Nusrat Jahan",
    is_return: 0,
    return_against: "",
    po_no: "",
    project: "",
    debit_to: "Debtors - MSL",
    base_grand_total: 5000,
    base_net_total: 5000,
    discount_amount: 0,
    total_taxes_and_charges: 0,
    contact_person: "Nusrat Jahan",
    contact_email: "nusrat@example.com",
    territory: "Bangladesh",
    tax_id: "",
    remarks: "Consulting service billed for September",
    items: [
      {
        item_code: "SRV-001",
        item_name: "Consulting Service",
        description: "Monthly consulting service",
        qty: 5,
        uom: "Nos",
        rate: 1000,
        amount: 5000,
      },
    ],
  },
  {
    name: "ACC-SINV-2026-00020",
    posting_date: "2026-10-01",
    due_date: "2026-10-15",
    status: "Unpaid",
    docstatus: 1,
    grand_total: 1200,
    rounded_total: 1200,
    net_total: 1200,
    total: 1200,
    outstanding_amount: 1200,
    currency: "BDT",
    company: "Magnetic Solution Limited",
    customer: "CUST-0001",
    customer_name: "Nusrat Jahan",
    is_return: 0,
    return_against: "",
    po_no: "PO-2026-0042",
    project: "",
    debit_to: "Debtors - MSL",
    base_grand_total: 1200,
    base_net_total: 1200,
    discount_amount: 0,
    total_taxes_and_charges: 0,
    contact_person: "Nusrat Jahan",
    contact_email: "nusrat@example.com",
    territory: "Bangladesh",
    tax_id: "",
    remarks: "",
    items: [
      {
        item_code: "SUP-010",
        item_name: "Support Package",
        description: "Priority support",
        qty: 1,
        uom: "Nos",
        rate: 1200,
        amount: 1200,
      },
    ],
  },
  {
    name: "ACC-SINV-2026-00021",
    posting_date: "2026-08-20",
    due_date: "2026-09-05",
    status: "Overdue",
    docstatus: 1,
    grand_total: 800,
    rounded_total: 800,
    net_total: 800,
    total: 800,
    outstanding_amount: 800,
    currency: "BDT",
    company: "Magnetic Solution Limited",
    customer: "CUST-0001",
    customer_name: "Nusrat Jahan",
    is_return: 0,
    return_against: "",
    po_no: "",
    project: "",
    debit_to: "Debtors - MSL",
    base_grand_total: 800,
    base_net_total: 800,
    discount_amount: 0,
    total_taxes_and_charges: 0,
    contact_person: "Nusrat Jahan",
    contact_email: "nusrat@example.com",
    territory: "Bangladesh",
    tax_id: "",
    remarks: "",
    items: [
      {
        item_code: "SRV-002",
        item_name: "Setup Fee",
        description: "One-time setup",
        qty: 1,
        uom: "Nos",
        rate: 800,
        amount: 800,
      },
    ],
  },
  // Draft - shown to the customer (invoice not yet submitted).
  {
    name: "ACC-SINV-2026-00025",
    posting_date: "2026-10-04",
    due_date: "2026-10-18",
    status: "Draft",
    docstatus: 0,
    grand_total: 2500,
    rounded_total: 2500,
    net_total: 2500,
    total: 2500,
    outstanding_amount: 2500,
    currency: "BDT",
    company: "Magnetic Solution Limited",
    customer: "CUST-0001",
    customer_name: "Nusrat Jahan",
    is_return: 0,
    return_against: "",
    po_no: "",
    project: "",
    debit_to: "Debtors - MSL",
    base_grand_total: 2500,
    base_net_total: 2500,
    discount_amount: 0,
    total_taxes_and_charges: 0,
    contact_person: "Nusrat Jahan",
    contact_email: "nusrat@example.com",
    territory: "Bangladesh",
    tax_id: "",
    remarks: "",
    items: [
      {
        item_code: "SRV-003",
        item_name: "Development Sprint",
        description: "Two-week sprint",
        qty: 1,
        uom: "Nos",
        rate: 2500,
        amount: 2500,
      },
    ],
  },
  // Cancelled - must NEVER appear in the history.
  {
    name: "ACC-SINV-2026-00026",
    posting_date: "2026-10-04",
    due_date: "2026-10-18",
    status: "Cancelled",
    docstatus: 2,
    grand_total: 999,
    rounded_total: 999,
    net_total: 999,
    total: 999,
    outstanding_amount: 0,
    currency: "BDT",
    company: "Magnetic Solution Limited",
    customer: "CUST-0001",
    customer_name: "Nusrat Jahan",
    is_return: 0,
    return_against: "",
    po_no: "",
    project: "",
    debit_to: "Debtors - MSL",
    base_grand_total: 999,
    base_net_total: 999,
    discount_amount: 0,
    total_taxes_and_charges: 0,
    contact_person: "Nusrat Jahan",
    contact_email: "nusrat@example.com",
    territory: "Bangladesh",
    tax_id: "",
    remarks: "",
    items: [],
  },
  // Customer B (client2@example.com) - must never be visible to Customer A.
  {
    name: "ACC-SINV-2026-00030",
    posting_date: "2026-10-02",
    due_date: "2026-10-16",
    status: "Unpaid",
    docstatus: 1,
    grand_total: 22000,
    rounded_total: 22000,
    net_total: 22000,
    total: 22000,
    outstanding_amount: 22000,
    currency: "BDT",
    company: "Magnetic Solution Limited",
    customer: "CUST-0002",
    customer_name: "Rahim Uddin",
    is_return: 0,
    return_against: "",
    po_no: "",
    project: "",
    debit_to: "Debtors - MSL",
    base_grand_total: 22000,
    base_net_total: 22000,
    discount_amount: 0,
    total_taxes_and_charges: 0,
    contact_person: "Rahim Uddin",
    contact_email: "rahim@example.com",
    territory: "Bangladesh",
    tax_id: "",
    remarks: "",
    items: [],
  },
];

function invoiceDisplayAmount(row) {
  const grand = row.grand_total;
  if (grand !== undefined && String(grand) !== "") return Number(grand || 0);
  if (row.rounded_total !== undefined && String(row.rounded_total) !== "") {
    return Number(row.rounded_total || 0);
  }
  return Number(row.total || 0);
}

function invoiceDisplayStatus(row) {
  // Mirror the real endpoint: the document's own `status` field, verbatim.
  const status = String(row.status || "").trim();
  if (status) return status;
  const docstatus = Number(row.docstatus || 0);
  if (docstatus === 2) return "Cancelled";
  if (docstatus === 1) return "Submitted";
  return "Draft";
}

function invoiceRowPayload(row) {
  return {
    name: row.name,
    posting_date: row.posting_date || "",
    due_date: row.due_date || "",
    status: row.status || "",
    docstatus: Number(row.docstatus || 0),
    grand_total: Number(row.grand_total || 0),
    rounded_total: Number(row.rounded_total || 0),
    net_total: Number(row.net_total || 0),
    total: Number(row.total || 0),
    outstanding_amount: Number(row.outstanding_amount || 0),
    currency: row.currency || "",
    company: row.company || "",
    customer: row.customer || "",
    customer_name: row.customer_name || "",
    is_return: Number(row.is_return || 0),
    return_against: row.return_against || "",
    po_no: row.po_no || "",
    project: row.project || "",
    amount: invoiceDisplayAmount(row),
    display_status: invoiceDisplayStatus(row),
  };
}

function invoiceSummary(rows, currency) {
  const month = new Date().toISOString().slice(0, 7);
  let totalAmount = 0;
  let totalOutstanding = 0;
  let monthAmount = 0;
  let monthCount = 0;
  let latest = "";

  for (const row of rows) {
    const amount = Number(row.amount || 0);
    totalAmount += amount;
    totalOutstanding += Number(row.outstanding_amount || 0);
    const posting = String(row.posting_date || "");
    if (posting) {
      if (posting > latest) latest = posting;
      if (posting.slice(0, 7) === month) {
        monthCount += 1;
        monthAmount += amount;
      }
    }
  }

  return {
    total: rows.length,
    total_amount: totalAmount,
    total_outstanding: totalOutstanding,
    this_month_count: monthCount,
    this_month_amount: monthAmount,
    latest_invoice_date: latest,
    currency,
  };
}

// --- registration ---------------------------------------------------------- //
// In-memory mirror of the shikkha_os registration flow so the sign-up path can
// be exercised end to end. The generated OTP is printed to stdout (never
// returned to the browser) exactly like the real gateway would text it.
const pendingRegistrations = new Map(); // email -> { code, attempts, expires }
const registeredUsers = new Set();
const takenMobiles = new Set();
const pendingLoginOtps = new Map(); // email -> { code, attempts, expires }
const pendingResetOtps = new Map(); // email -> { code, attempts, channel, expires }
const pendingProfileOtps = new Map(); // email -> { code, attempts, values, expires }

// --- self-service profile (mirrors shikkha_os.api.v1.profile.*) ------------- //
const profileExtras = new Map(); // email -> editable extras (except full_name)
// Mirrors the ERP allow-list. `mobile_no` is a recovery channel: read-only in
// the form, never editable, so it is deliberately absent here.
const PROFILE_EDITABLE = [
  "full_name",
  "phone",
  "location",
  "bio",
  "time_zone",
  "gender",
  "birth_date",
  "designation",
  "department",
  "language",
];

// Field presentation meta, shaped exactly like shikkha_os _field_meta().
const PROFILE_FIELDS = [
  { fieldname: "full_name", label: "Full Name", fieldtype: "Data", options: [], section: "basic", required: true },
  { fieldname: "phone", label: "Phone", fieldtype: "Data", options: [], section: "basic", required: false },
  { fieldname: "gender", label: "Gender", fieldtype: "Select", options: ["Male", "Female", "Other"], section: "personal", required: false },
  { fieldname: "birth_date", label: "Birth Date", fieldtype: "Date", options: [], section: "personal", required: false },
  { fieldname: "location", label: "Location", fieldtype: "Data", options: [], section: "personal", required: false },
  { fieldname: "bio", label: "Bio", fieldtype: "Small Text", options: [], section: "personal", required: false },
  { fieldname: "designation", label: "Designation", fieldtype: "Data", options: [], section: "work", required: false },
  { fieldname: "department", label: "Department", fieldtype: "Data", options: [], section: "work", required: false },
  { fieldname: "time_zone", label: "Time Zone", fieldtype: "Data", options: [], section: "work", required: false },
  { fieldname: "language", label: "Language", fieldtype: "Select", options: ["bn", "en"], section: "work", required: false },
];

function profileValues(account, email) {
  const extra = profileExtras.get(email) ?? {};
  return {
    full_name: account.profile.full_name || "",
    phone: extra.phone ?? "",
    location: extra.location ?? "",
    bio: extra.bio ?? "",
    time_zone: extra.time_zone ?? account.profile.time_zone ?? "",
    gender: extra.gender ?? "",
    birth_date: extra.birth_date ?? "",
    designation: extra.designation ?? account.profile.designation ?? "",
    department: extra.department ?? account.profile.department ?? "",
    language: extra.language ?? account.profile.language ?? "",
  };
}

function profileMobile(email) {
  return profileExtras.get(email)?.mobile_no ?? "8801712345678";
}

function maskEmail(value) {
  const [local = "", domain = ""] = String(value).split("@");
  const shown = local.length <= 2 ? `${local[0] ?? ""}*` : `${local[0]}${"*".repeat(local.length - 2)}${local.slice(-1)}`;
  return `${shown}@${domain}`;
}

function maskMobile(value) {
  const digits = String(value).replace(/\D/g, "");
  return digits.length <= 4 ? "****" : `${"*".repeat(digits.length - 4)}${digits.slice(-4)}`;
}

function normalizeMobile(value) {
  let digits = String(value ?? "").replace(/\D/g, "");
  if (!digits) return "";
  if (!digits.startsWith("880")) digits = digits.startsWith("0") ? `880${digits.slice(1)}` : `880${digits}`;
  return digits;
}

// Demo mobile -> email, so the forgot-password flow can be driven by a mobile
// number too (the real site resolves User.mobile_no).
const DEMO_MOBILES = {
  "8801712345678": "tamim@ioniccorporation.com",
};

function findAccountByMobile(value) {
  const email = DEMO_MOBILES[normalizeMobile(value)];
  if (!email || !DEMO_USERS[email]) return null;
  return { email, account: DEMO_USERS[email] };
}

function accountExists(email) {
  return Boolean(DEMO_USERS[email]) || registeredUsers.has(email);
}

function clientProfile(email, fullName) {
  return {
    authenticated: true,
    name: email,
    full_name: fullName,
    email,
    user_image: "",
    time_zone: "Asia/Dhaka",
    language: "bn",
    user_type: "Website User",
    roles: ["Customer"],
    is_admin: false,
    dashboard_route: "/clientDashboard",
  };
}


/**
 * `dashboard.overview` payload, shaped per account type: a client sees the
 * personal cards and their own profile, with no org-wide figures and no desk
 * quick links — the same scoping the real API applies for a non-desk user.
 */
function dashboardPayload(account) {
  const profile = account.profile;
  const staff = account.kind === "staff";

  // Realistic, staggered audit timestamps (minutes ago) so the login-history
  // timeline and its expand control can be exercised deterministically.
  const aud = (minutesAgo, name, event, status, clientIp) => ({
    name,
    event,
    status,
    creation: new Date(Date.now() - minutesAgo * 60_000).toISOString().slice(0, 19).replace("T", " "),
    client_ip: clientIp,
  });

  const personalStats = [
    { key: "roles", label: "Roles", value: profile.roles.length, icon: "badge", hint: "Roles assigned to your account", scope: "personal" },
    { key: "signins", label: "Sign-ins (7 days)", value: 12, icon: "shield", hint: "Successful sign-ins recorded for your account", scope: "personal" },
    { key: "sessions", label: "Active Sessions", value: 1, icon: "device", hint: "Devices currently holding a session for you", scope: "personal" },
  ];

  const siteStats = [
    { key: "users", label: "Active Users", value: 184, icon: "users", hint: "Enabled user accounts", scope: "site" },
    { key: "customers", label: "Customers", value: 1268 + Number(process.env.MOCK_OVERVIEW_BUMP || 0) + (process.env.MOCK_OVERVIEW_JITTER === "1" ? overviewCallSeq++ : 0), icon: "customer", hint: "Active customer records", scope: "site" },
    { key: "items", label: "Items", value: 342, icon: "box", hint: "Active item master records", scope: "site" },
    { key: "employees", label: "Employees", value: 57, icon: "badge", hint: "Active employees", scope: "site" },
    { key: "invoices", label: "Invoices (30 days)", value: 903, icon: "receipt", hint: "Submitted in the last 30 days", scope: "site" },
  ];

  const rows = [
    { label: "Full Name", value: profile.full_name },
    { label: "Email", value: profile.email },
  ];

  const mobileNo = profileMobile(profile.email);
  if (mobileNo) rows.push({ label: "Mobile", value: mobileNo });

  if (profile.designation) rows.push({ label: "Designation", value: profile.designation });
  if (profile.department) rows.push({ label: "Department", value: profile.department });

  rows.push({ label: "Time Zone", value: profile.time_zone });
  rows.push({ label: "Language", value: profile.language });

  return {
    user: profile,
    stats: staff ? [...personalStats, ...siteStats] : personalStats,
    profile: rows,
    activity: staff
      ? [
          aud(0, "SHIKKHA-AUD-2026-00012", "login_success", "Success", "103.15.20.4"),
          aud(1, "SHIKKHA-AUD-2026-00011", "session_probe", "Success", "103.15.20.4"),
          aud(3, "SHIKKHA-AUD-2026-00010", "login_failed", "Failed", "45.126.7.9"),
          aud(8, "SHIKKHA-AUD-2026-00009", "login_success", "Success", "103.15.20.4"),
          aud(20, "SHIKKHA-AUD-2026-00008", "logout", "Success", "103.15.20.4"),
          aud(55, "SHIKKHA-AUD-2026-00007", "login_success", "Success", "103.15.20.4"),
          aud(130, "SHIKKHA-AUD-2026-00006", "login_failed", "Failed", "45.126.7.9"),
          aud(300, "SHIKKHA-AUD-2026-00005", "login_success", "Success", "103.15.20.4"),
          aud(720, "SHIKKHA-AUD-2026-00004", "logout", "Success", "103.15.20.4"),
          aud(1500, "SHIKKHA-AUD-2026-00003", "login_success", "Success", "103.15.20.4"),
          aud(2600, "SHIKKHA-AUD-2026-00002", "login_failed", "Failed", "45.126.7.9"),
          aud(4400, "SHIKKHA-AUD-2026-00001", "login_success", "Success", "103.15.20.4"),
        ]
      : [
          aud(5, "SHIKKHA-AUD-2026-00006", "login_success", "Success", "103.15.20.4"),
          aud(60, "SHIKKHA-AUD-2026-00005", "login_failed", "Failed", "45.126.7.9"),
          aud(240, "SHIKKHA-AUD-2026-00004", "login_success", "Success", "103.15.20.4"),
          aud(600, "SHIKKHA-AUD-2026-00003", "logout", "Success", "103.15.20.4"),
          aud(1400, "SHIKKHA-AUD-2026-00002", "login_success", "Success", "103.15.20.4"),
          aud(3000, "SHIKKHA-AUD-2026-00001", "session_probe", "Success", "103.15.20.4"),
        ],
    quick_links: staff
      ? [
          { key: "desk", label: "ERP Desk", description: "Open the Frappe desk", icon: "grid", href: "https://dash.example.com/app", external: true },
          { key: "users", label: "Users", description: "Manage user accounts", icon: "users", href: "https://dash.example.com/app/user", external: true },
          { key: "customers", label: "Customers", description: "Customer master records", icon: "customer", href: "https://dash.example.com/app/customer", external: true },
          { key: "items", label: "Items", description: "Item master records", icon: "box", href: "https://dash.example.com/app/item", external: true },
        ]
      : [],
    system: {
      app: "shikkha_os",
      version: "1.3.0",
      api: "shikkha_os.v1",
      base_url: `http://127.0.0.1:${PORT}`,
      session_expiry_hours: 24,
    },
  };
}

/**
 * Representative ERPNext `Customer` field catalogue, SIMPLIFIED.
 *
 * Mirrors shikkha_os.api.v1.customer._build_sections(): only the mandatory plus a
 * few genuinely-important optional fields, grouped into three meaningful sections.
 * No Check / technical / advanced surfaces. The real backend derives this from
 * frappe.get_meta("Customer"); this fixture stands in for that output locally.
 */
const CUSTOMER_SECTIONS = [
  {
    key: "customer_information",
    label: "Customer Information",
    fields: [
      { fieldname: "customer_name", label: "Customer Name", fieldtype: "Data", options: [], link_doctype: "", required: true, read_only: false, default: "", description: "The full name of the customer.", placeholder: "", depends_on: "" },
      { fieldname: "customer_type", label: "Customer Type", fieldtype: "Select", options: ["Company", "Individual"], link_doctype: "", required: true, read_only: false, default: "Company", description: "", placeholder: "", depends_on: "" },
      { fieldname: "customer_group", label: "Customer Group", fieldtype: "Link", options: [], link_doctype: "Customer Group", required: false, read_only: false, default: "Commercial", description: "", placeholder: "", depends_on: "" },
      { fieldname: "territory", label: "Territory", fieldtype: "Link", options: [], link_doctype: "Territory", required: false, read_only: false, default: "Bangladesh", description: "", placeholder: "", depends_on: "" },
    ],
  },
  {
    key: "contact_information",
    label: "Contact Information",
    fields: [
      { fieldname: "mobile_no", label: "Mobile Number", fieldtype: "Data", options: [], link_doctype: "", required: false, read_only: false, default: "", description: "", placeholder: "017XXXXXXXX", depends_on: "" },
      { fieldname: "email_id", label: "Email Id", fieldtype: "Data", options: [], link_doctype: "", required: false, read_only: false, default: "", description: "", placeholder: "name@example.com", depends_on: "" },
      { fieldname: "website", label: "Website", fieldtype: "Data", options: [], link_doctype: "", required: false, read_only: false, default: "", description: "", placeholder: "https://", depends_on: "" },
    ],
  },
  {
    key: "business_tax",
    label: "Business & Tax",
    fields: [
      { fieldname: "tax_id", label: "Tax Id", fieldtype: "Data", options: [], link_doctype: "", required: false, read_only: false, default: "", description: "Tax identification number.", placeholder: "", depends_on: "" },
      { fieldname: "default_currency", label: "Default Currency", fieldtype: "Link", options: [], link_doctype: "Currency", required: false, read_only: false, default: "BDT", description: "", placeholder: "", depends_on: "" },
      { fieldname: "default_price_list", label: "Default Price List", fieldtype: "Link", options: [], link_doctype: "Price List", required: false, read_only: false, default: "", description: "", placeholder: "", depends_on: "" },
    ],
  },
];

/** Link data sources, keyed by the target DocType the ERP would return. */
const CUSTOMER_LINK_OPTIONS = {
  "Customer Group": ["Commercial", "Government", "Individual", "Non Profit", "Residential", "Retail", "Distributor"],
  Territory: ["Bangladesh", "Dhaka", "Chattogram", "Khulna", "Rajshahi"],
  Salutation: ["Mr", "Mrs", "Ms", "Dr"],
  Gender: ["Male", "Female", "Other"],
  Lead: ["LEAD-0001", "LEAD-0002"],
  Opportunity: ["OPP-0001", "OPP-0002"],
  User: ["tamim@ioniccorporation.com", "Administrator"],
  Currency: ["BDT", "USD", "EUR"],
  "Price List": ["Standard Selling"],
  Industry: ["Education", "Retail", "Manufacturing", "Technology"],
  "Market Segment": ["Education", "Government", "Corporate"],
  "Tax Category": ["In-State", "Out-of-State"],
  "Tax Withholding Category": ["TDS"],
  Language: ["en", "bn"],
  Address: ["Primary Address"],
  Contact: ["Primary Contact"],
};

/** Customers created through the panel during this mock run. */
const createdCustomers = new Map();
let customerCounter = 0;

// --- Help Desk mock state (see the help_desk_messages handler below) -------- //
// Tickets created through the mocked `help_desk.create_ticket` live here for the
// length of the process; the wizard + list/detail pages read them back.
const hdTicketList = [];
const hdTickets = new Map();
let hdTicketSeq = 0;
let hdFileSeq = 0;

// `File` rows, exactly like the doctype the real portal writes to: an upload is a
// private row owned by the caller and it stays unattached until a ticket or a
// communication claims it. `attached_to_doctype` / `attached_to_name` are what the
// Helpdesk agent's attachment view reads, so the mock keeps them honest.
const hdFileList = [];
const hdFilesByUrl = new Map();

// The bytes the portal actually uploaded, so serving a File row returns the
// real image (what the agent's preview/lightbox fetches), not a placeholder.
const hdFileBytes = new Map();

const hdSqlNow = () => new Date().toISOString().slice(0, 19).replace("T", " ");

function hdFileRow({ name, url, fileName, size, owner }) {
  const row = {
    name,
    file_url: url,
    file_name: fileName,
    file_size: size,
    owner,
    attached_to_doctype: "",
    attached_to_name: "",
    is_private: 0,
    creation: hdSqlNow(),
    // Internal epoch ms for the reuse window; stripped before serving.
    _createdMs: Date.now(),
  };
  hdFileList.push(row);
  hdFilesByUrl.set(url, row);
  return row;
}

const hdFileUnattached = (row) => !row.attached_to_doctype && !row.attached_to_name;

// Mirrors `help_desk.timestamped_filename`: Desk File rows carry the upload's
// date and time, e.g. `photo-20261103-154210.png`.
const HD_STAMP_RE = /-\d{8}-\d{6}(?=\.[^.]+$|$)/;
function mockTimestampedName(fileName) {
  const name = String(fileName || "attachment");
  const un = name.replace(HD_STAMP_RE, "");
  const now = new Date();
  const p = (n) => String(n).padStart(2, "0");
  const stamp = `${now.getFullYear()}${p(now.getMonth() + 1)}${p(now.getDate())}-${p(now.getHours())}${p(now.getMinutes())}${p(now.getSeconds())}`;
  if (un.includes(".")) {
    const i = un.lastIndexOf(".");
    return `${un.slice(0, i)}-${stamp}${un.slice(i)}`;
  }
  return `${un}-${stamp}`;
}
const mockUnstamped = (fileName) => String(fileName || "").replace(HD_STAMP_RE, "");

// The helpdesk app copies a message's file onto the ticket's own attachment tray,
// so one upload leaves two File rows (same file_url). Production must list it
// once; `mock.hd.mirror` turns the same duplication on so a suite can prove it.
let hdMirrorUploads = false;
const hdUniqueFiles = (files) => {
  const seen = new Set();
  return files.filter((file) => {
    const url = String(file?.url ?? "").trim().split("/").pop() ?? "";
    const key = url || `${String(file?.name ?? "")}|${String(file?.size ?? "")}`;
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};
const hdMirrorRow = (row) => {
  if (!hdMirrorUploads) return;
  hdFileList.push({
    ...row,
    name: `${row.name}-mirror`,
    attached_to_doctype: "HD Ticket",
    attached_to_name: "mirror",
  });
};

// Mirrors `help_desk._UPLOAD_REUSE_WINDOW_SECONDS`: only a File row written
// moments ago can be a retry of the same submit; older ones are new sends and
// get their own row with their own timestamp.
const HD_REUSE_WINDOW_MS = 180 * 1000;

// Mirrors `help_desk.unique_stored_name`: two sends in the same second must
// still yield two distinct File rows.
function mockUniqueStoredName(fileName) {
  let candidate = fileName;
  let counter = 1;
  while (hdFileList.some((row) => row.file_name === candidate) && counter < 50) {
    counter += 1;
    if (fileName.includes(".")) {
      const i = fileName.lastIndexOf(".");
      candidate = `${fileName.slice(0, i)}-${counter}${fileName.slice(i)}`;
    } else {
      candidate = `${fileName}-${counter}`;
    }
  }
  return candidate;
}

// The real backend only links Files that (a) the caller owns and (b) nothing has
// claimed yet; anything else is reported back as `attachments_failed`. The mock
// refuses exactly the same way, so a green run cannot hide an ownership hole.
function hdResolveUploads(items, owner) {
  const attached = [];
  const failed = [];
  for (const item of Array.isArray(items) ? items : []) {
    const url = String(item?.url ?? "").trim();
    if (!url) continue;
    const label = String(item?.name ?? url.split("/").pop() ?? "attachment");
    const row = hdFilesByUrl.get(url);
    if (!row || row.owner !== owner || !hdFileUnattached(row)) {
      failed.push(label);
      continue;
    }
    attached.push({ row, label });
    hdMirrorRow(row);
  }
  return { attached, failed };
}

// Mirrors `_discard_unattached_uploads`: a create that never produced a ticket
// takes its own still-unclaimed uploads with it, so nothing is left orphaned.
function hdDiscardUploads(items, owner) {
  for (const item of Array.isArray(items) ? items : []) {
    const url = String(item?.url ?? "").trim();
    if (!url) continue;
    const row = hdFilesByUrl.get(url);
    if (!row || row.owner !== owner || !hdFileUnattached(row)) continue;
    const index = hdFileList.indexOf(row);
    if (index >= 0) hdFileList.splice(index, 1);
    hdFilesByUrl.delete(url);
  }
}

// One thread, in memory, shared by both demo identities: the staff account sees
// the customer's messages, the customer account sees support's — which is what
// the "instant delivery" harness needs. `mock.hd.push` adds a message from the
// other side so a Playwright run can prove the panel picks it up on its own.
const HD_TICKET = "HD-2026-00001";
const hdThreads = new Map();
// Every frontend failure the portal reports through client_log.report, kept so
// GET /__mock/client-log can hand them back to a probe.
const clientLogEntries = [];
let hdMessageSeq = 0;

function hdKey(message) {
  return `${message.createdAt}|${message.id}`;
}

function hdAppend(ticket, author, body, options = {}) {
  const thread = hdThreads.get(ticket);
  if (!thread) return null;
  hdMessageSeq += 1;
  const message = {
    id: `HDMSG-${String(hdMessageSeq).padStart(5, "0")}`,
    author,
    authorName:
      typeof options.authorName === "string" && options.authorName
        ? options.authorName
        : author === "support"
          ? thread.agent || "Tamim Hasan"
          : thread.customer || "Nusrat Jahan",
    body,
    // Dev-only: a harness may backdate a row to reproduce a real thread where
    // the two channels' timestamps land out of order (or share one second).
    createdAt: typeof options.at === "string" && options.at ? options.at : new Date().toISOString(),
    kind: typeof options.kind === "string" && options.kind ? options.kind : "message",
    // The desk stamps an outgoing email with its recipient ("To: ..."); the
    // portal shows the same line on the employee's bubble.
    recipients:
      typeof options.recipients === "string" && options.recipients ? options.recipients : "",
    channel: author === "support" ? "message" : "comment",
    replyTo: options.replyTo && typeof options.replyTo === "object" ? options.replyTo : null,
    attachments: [],
    isMine: false,
    seen: false,
    reactions: [],
  };
  if (Array.isArray(options.attachments) && options.attachments.length) {
    // Seeding a file that hangs on no other row (e.g. the desk's attach button
    // put it straight on the ticket): the thread entry exists, its body is
    // empty, and the attachment is the whole message.
    message.attachments.push(...options.attachments);
  }
  thread.messages.push(message);
  return message;
}

function hdUnread(support) {
  const side = support ? "support" : "user";
  let count = 0;
  for (const thread of hdThreads.values()) {
    count += thread.messages.filter((message) => message.author !== side).length;
  }
  return count;
}

function hdHeader(thread) {
  const last = thread.messages[thread.messages.length - 1];
  // `deskShaped` reproduces how a ticket created from the Desk actually arrives:
  // the owner sits only in the plain `agent` link (Assignments empty), the
  // submitter only in the `customer` column (no Contact row), and the header
  // carries no creation stamp. The portal must still fill "Assigned employee"
  // and "Submitted" from those columns, exactly as the Desk's Assignee/Customer
  // fields do.
  const desk = Boolean(thread.deskShaped);
  return {
    id: thread.name,
    subject: thread.subject,
    category: thread.category,
    priority: thread.priority,
    description: thread.messages[0]?.body ?? "",
    status: thread.status,
    contact: desk
      ? { name: "", email: "" }
      : { name: thread.customer, email: thread.customerEmail },
    attachments: thread.attachments ?? [],
    messages: [],
    createdAt: desk ? null : thread.submittedAt,
    updatedAt: last?.createdAt ?? thread.submittedAt,
    resolvedAt: thread.resolvedAt ?? undefined,
    assignedAgent: desk ? null : thread.agent || "Tamim Hasan",
    agent: desk ? thread.agent || null : undefined,
    customer: desk ? `HDC-${thread.name}` : undefined,
    customerName: desk ? thread.customer : undefined,
    department: thread.department ?? "Support",
  };
}

function hdSummary(thread, support) {
  const last = thread.messages[thread.messages.length - 1];
  const side = support ? "support" : "user";
  return {
    ticketId: thread.name,
    subject: thread.subject,
    status: thread.status,
    statusLabel: thread.currentStatus,
    priority: thread.priority,
    category: thread.category,
    customer: thread.customer,
    assignedAgent: thread.agent || "Tamim Hasan",
    resolvedAt: thread.resolvedAt ?? undefined,
    counterpart: thread.customerEmail,
    lastMessage: last?.body ?? "",
    lastSender: last?.authorName ?? thread.customer,
    lastSenderRole: last?.author === "support" ? "support" : "customer",
    lastMessageAt: last?.createdAt ?? thread.submittedAt,
    submittedAt: thread.submittedAt,
    updatedAt: last?.createdAt ?? thread.submittedAt,
    messageCount: thread.messages.length,
    unread: thread.messages.filter((message) => message.author !== side).length,
  };
}

// Mirrors the ERP's `_drop_channel_duplicates` + time sort: a thread reads once
// per event, oldest first, whatever order the two channels were stored in. The
// duplicate shapes are the ones the ERP really produces — one send stored by
// both channels (Comment keeps the editor's HTML, Communication the plain
// text), a re-sent upload of the same file, and the same message handed over
// twice under two ids.
function hdSeconds(value) {
  const text = String(value ?? "").trim();
  // A bare ERP timestamp is Dhaka wall-clock time, exactly as the portal reads
  // it; without the offset the same instant written two ways compares wrong.
  const naive = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(:\d{2}(\.\d+)?)?$/.test(text);
  const parsed = Date.parse(naive ? `${text.replace(" ", "T")}+06:00` : text);
  return Number.isNaN(parsed) ? null : Math.floor(parsed / 1000);
}

function hdBodyKey(body) {
  const key = String(body ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
  // A share caption says nothing the file does not.
  return ["শেয়ার", "share", "shared"].includes(key) ? "" : key;
}

function hdFileKey(attachments) {
  return (attachments ?? [])
    .map((file) => String(file.url || file.name || file.fileName || ""))
    .sort()
    .join("|");
}

function hdOrder(messages) {
  const seen = new Set();
  const sent = new Map();
  const kept = [];
  for (const message of messages) {
    // A row with no id under any name cannot be told apart from another blank
    // row, and the live ERP does not drop them (ticket 0975 handed over three
    // `{id: ""}` rows) — so blank ids never collapse here either.
    if (message.id) {
      if (seen.has(message.id)) continue;
      seen.add(message.id);
    }
    const words = hdBodyKey(message.body);
    const files = hdFileKey(message.attachments);
    const second = hdSeconds(message.createdAt);
    const channel = String(message.channel ?? "");
    const key = `${message.author}|${words}|${files}`;
    if (words || files) {
      const priors = sent.get(key) ?? [];
      const twin = priors.some((prior) => {
        if (prior.second === null || second === null) return false;
        if (Math.abs(prior.second - second) > 300) return false;
        if (prior.channel !== channel) return true;
        if (files && !words) return true;
        return prior.second === second;
      });
      if (twin) continue;
      priors.push({ second, channel });
      sent.set(key, priors);
    }
    kept.push(message);
  }
  return kept.sort((left, right) => {
    const a = hdSeconds(left.createdAt);
    const b = hdSeconds(right.createdAt);
    if (a !== b) return (a ?? Infinity) - (b ?? Infinity);
    return String(left.id).localeCompare(String(right.id));
  });
}

function hdConversation(name, support, { limit = 0, cursor = "", since = "" } = {}) {
  const thread = hdThreads.get(name);
  if (!thread) return null;

  const all = hdOrder(
    thread.messages.map((message) => ({
      ...message,
      isMine: (message.author === "support") === support,
      seen: true,
    })),
  );

  let messages = all;
  let hasMore = false;
  let hasNewer = false;
  let nextCursor = null;

  if (limit && since) {
    const newer = all.filter((message) => hdKey(message) > since);
    messages = newer.slice(0, limit);
    hasNewer = newer.length > limit;
  } else if (limit && cursor) {
    const older = all.filter((message) => hdKey(message) < cursor);
    messages = older.slice(-limit);
    hasMore = older.length > limit;
    nextCursor = messages.length ? hdKey(messages[0]) : null;
  } else if (limit) {
    messages = all.slice(-limit);
    hasMore = all.length > limit;
    nextCursor = messages.length ? hdKey(messages[0]) : null;
  } else if (since) {
    messages = all.filter((message) => hdKey(message) > since);
  }

  const latest = messages.length ? hdKey(messages[messages.length - 1]) : null;

  // Dev-only: a real thread can hand its messages over in the order the two
  // channels were read (Communication block, then Comment block), which is not
  // the conversation's order. The timeline below the chat is always canonical,
  // so `payloadOrder: "reverse"` reproduces that mismatch on purpose: the chat
  // must still read exactly like the timeline.
  if (thread.payloadOrder === "reverse" && !limit) {
    messages = messages.slice().reverse();
  }

  // Dev-only: the real client payload can leave the employee's channel out of
  // `messages` while the timeline still lists every reply (the reported 0922
  // shape). The chat card has to draw both sides anyway, so this hook
  // reproduces that payload exactly.
  if (thread.hideSupportFromMessages && !support) {
    messages = messages.filter((message) => message.author !== "support");
  }

  // Mirror `_timeline`: the opening description, then one row per message, with
  // requirement/resolution labelled and the description's own Communication
  // promoted to `created` instead of listed twice.
  const timeline = (thread.timeline ?? []).map((row) => ({ ...row }));
  for (const message of all) {
    timeline.push({
      id: message.id,
      type:
        message.kind === "requirement"
          ? "requirement"
          : message.kind === "resolution"
            ? "resolution"
            : message.id === thread.duplicateId
              ? "created"
              : "message",
      at:
        thread.blankSupportTrailTimes && message.author === "support" ? "" : message.createdAt,
      author: message.author,
      // Matches the ERP: a customer's own Communication carries no name, so the
      // timeline shows "আপনি" for it.
      authorName: message.author === "support" ? message.authorName : "",
      text: message.body,
      recipients: message.recipients ?? "",
      attachments: (message.attachments ?? []).length,
      // Mirrors the ERP's `_timeline`: the files themselves, so the Activity list
      // can show and open the picture (0668), not just count it.
      files: (message.attachments ?? []).map((attachment) => ({
        url: attachment.url,
        fileName: attachment.name ?? "",
        fileType: attachment.mime ?? "",
      })),
    });
  }

  return {
    ticket: hdHeader(thread),
    messages,
    requirements: [],
    timeline,
    unread: thread.messages.filter((message) => message.author !== (support ? "support" : "user")).length,
    statusCategory: thread.statusCategory,
    isSupport: support,
    canReply: true,
    canAddRequirement: !support,
    canChangeStatus: support,
    currentStatus: thread.currentStatus,
    statuses: support
      ? [
          { name: "Open", category: "Open" },
          { name: "Resolved", category: "Resolved" },
          { name: "Closed", category: "Closed" },
        ]
      : [],
    paged: Boolean(limit),
    has_more: hasMore,
    has_newer: hasNewer,
    next_cursor: nextCursor,
    latest_cursor: latest,
    server_time: "2026-10-28 10:00:00",
  };
}

hdThreads.set(HD_TICKET, {
  name: HD_TICKET,
  subject: "পাসওয়ার্ড রিসেট করা যাচ্ছে না",
  status: "open",
  currentStatus: "Open",
  statusCategory: "Open",
  priority: "medium",
  category: "login",
  customer: "Nusrat Jahan",
  customerEmail: "client@example.com",
  submittedAt: new Date(Date.now() - 90 * 60_000).toISOString(),
  resolvedAt: null,
  messages: [],
});
hdAppend(HD_TICKET, "user", "আমার অ্যাকাউন্টে লগইন করা যাচ্ছে না, পাসওয়ার্ড রিসেটের ইমেইলও আসছে না।");
// The seeded thread opens with its own event row, the way the ERP returns it.
hdThreads.get(HD_TICKET).timeline = [
  {
    id: "created",
    type: "created",
    at: hdThreads.get(HD_TICKET).submittedAt,
    author: "user",
    authorName: hdThreads.get(HD_TICKET).customer,
    text: hdThreads.get(HD_TICKET).subject,
    attachments: 0,
  },
];

// --- Ticket 0472: the customer's real thread ---------------------------------
// Its chat must read exactly like the audit trail below it: the opening event,
// the employee's row, the extra requirement and then the customer's messages,
// in that order, with the customer on the right and the employee on the left
// (mirrored on the employee's dashboard). Timestamps are the real ones
// (28 Oct 2026, 05:12–05:49 PM Asia/Dhaka).
const HD_TIMELINE_TICKET = "0472";
const HD_0472_CUSTOMER = "Tamim Hasan";
const HD_0472_AGENT = "MD Shahzalal Amin Surker";
hdThreads.set(HD_TIMELINE_TICKET, {
  name: HD_TIMELINE_TICKET,
  subject: "xfg lhp[dffffffffffffffffffffffffffff ver",
  status: "open",
  currentStatus: "Open",
  statusCategory: "Open",
  priority: "medium",
  category: "incident",
  customer: HD_0472_CUSTOMER,
  customerEmail: "client@example.com",
  agent: HD_0472_AGENT,
  submittedAt: "2026-10-28T11:12:00.000Z",
  resolvedAt: null,
  messages: [],
  timeline: [
    {
      id: "created",
      type: "created",
      at: "2026-10-28T11:12:00.000Z",
      author: "user",
      authorName: HD_0472_CUSTOMER,
      text: "xfg lhp[dffffffffffffffffffffffffffff ver\nCategory: Incident\nPreferred contact: email",
      attachments: 0,
    },
  ],
});
// The ERP promotes the description's own Communication to `created` — here the
// employee's very first reply is that row, exactly as the live ticket shows it.
const hd0472Reply = hdAppend(HD_TIMELINE_TICKET, "support", "qayayayayayay4ty4", {
  at: "2026-10-28T11:14:00.000Z",
  authorName: HD_0472_AGENT,
});
if (hd0472Reply) hdThreads.get(HD_TIMELINE_TICKET).duplicateId = hd0472Reply.id;
hdAppend(HD_TIMELINE_TICKET, "user", "5ytertyasertaqa", {
  at: "2026-10-28T11:20:00.000Z",
  kind: "requirement",
});
hdAppend(HD_TIMELINE_TICKET, "user", "xdftudxztuy", { at: "2026-10-28T11:45:00.000Z" });
hdAppend(HD_TIMELINE_TICKET, "user", "wwwwwwtwq4etw4e", { at: "2026-10-28T11:46:00.000Z" });
hdAppend(HD_TIMELINE_TICKET, "user", "aopriwhtopwtoprtopih", { at: "2026-10-28T11:46:40.000Z" });
hdAppend(HD_TIMELINE_TICKET, "user", "yyyyyyyyyy", { at: "2026-10-28T11:48:00.000Z" });
hdAppend(HD_TIMELINE_TICKET, "user", "masum,456", { at: "2026-10-28T11:49:00.000Z" });

// --- Ticket 0491: the same rule, on a thread whose payload arrives scrambled --
// Two of these rows share one second (12:05:30) and the endpoint hands the
// messages over in reverse, the way a channel merge can: the chat still has to
// read exactly like the audit trail below it, first message first.
const HD_0491 = "0491";
const HD_0491_CUSTOMER = "Tamim Hasan";
const HD_0491_AGENT = "MD Shahzalal Amin Surker";
hdThreads.set(HD_0491, {
  name: HD_0491,
  subject: "Payment not reflected in my account",
  status: "open",
  currentStatus: "Open",
  statusCategory: "Open",
  priority: "medium",
  category: "payment",
  customer: HD_0491_CUSTOMER,
  customerEmail: "client@example.com",
  agent: HD_0491_AGENT,
  deskShaped: true,
  submittedAt: "2026-10-28T11:58:00.000Z",
  resolvedAt: null,
  messages: [],
  payloadOrder: "reverse",
  timeline: [
    {
      id: "created",
      type: "created",
      at: "2026-10-28T11:58:00.000Z",
      author: "user",
      authorName: HD_0491_CUSTOMER,
      text: "Payment not reflected in my account\nCategory: Payment\nPreferred contact: email",
      attachments: 0,
    },
  ],
});
hdAppend(HD_0491, "support", "টিকিট তৈরি হয়েছে, বিষয়টি দেখছি।", {
  at: "2026-10-28T12:00:00.000Z",
  authorName: HD_0491_AGENT,
});
hdAppend(HD_0491, "user", "ধন্যবাদ, অপেক্ষা করছি।", { at: "2026-10-28T12:03:00.000Z" });
hdAppend(HD_0491, "support", "আপনার পেমেন্টটি গেটওয়েতে দেখা যাচ্ছে না।", {
  at: "2026-10-28T12:05:30.000Z",
  authorName: HD_0491_AGENT,
});
// Same second as the row above - the tie that used to fall back to payload order.
hdAppend(HD_0491, "user", "অনলাইন পেমেন্ট করে ছিলাম বিকাশ দিয়ে।", { at: "2026-10-28T12:05:30.000Z" });
hdAppend(HD_0491, "user", "ট্রানজেকশন আইডি পাঠাচ্ছি।", { at: "2026-10-28T12:07:00.000Z" });

// 0496 — the ticket where the thread reads as two one-sided columns: the
// customer's rows on the right, support's on the left, nothing saying which
// answer belongs to which comment. No row carries a `replyTo`; the pairing has
// to be inferred from the order.
const HD_0496 = "0496";
const HD_0496_CUSTOMER = "Nusrat Jahan";
const HD_0496_AGENT = "MD Shahzalal Amin Surker";
hdThreads.set(HD_0496, {
  name: HD_0496,
  subject: "Cannot open the practice exam from my dashboard",
  status: "open",
  currentStatus: "Open",
  statusCategory: "Open",
  priority: "high",
  category: "technical",
  customer: HD_0496_CUSTOMER,
  customerEmail: "nusrat@example.com",
  agent: HD_0496_AGENT,
  submittedAt: "2026-10-28T09:10:00.000Z",
  resolvedAt: null,
  messages: [],
  timeline: [],
});
hdAppend(HD_0496, "user", "hi", { at: "2026-10-28T09:10:00.000Z", authorName: HD_0496_CUSTOMER });
hdAppend(HD_0496, "support", "hello", { at: "2026-10-28T09:12:00.000Z", authorName: HD_0496_AGENT });
hdAppend(HD_0496, "user", "প্র্যাকটিস এক্সাম খুললে সাদা পেজ আসে, কিছু দেখায় না।", {
  at: "2026-10-28T09:14:00.000Z",
  authorName: HD_0496_CUSTOMER,
});
hdAppend(HD_0496, "support", "কোন ব্রাউজার আর কোন ক্লাসের এক্সাম, বলবেন?", {
  at: "2026-10-28T09:16:00.000Z",
  authorName: HD_0496_AGENT,
});
hdAppend(HD_0496, "user", "Chrome, ক্লাস নাইন, পদার্থবিজ্ঞান অধ্যায় ৩।", {
  at: "2026-10-28T09:18:00.000Z",
  authorName: HD_0496_CUSTOMER,
});
hdAppend(HD_0496, "support", "ওই অধ্যায়ের প্রশ্নপত্রে ফাইল আপলোড করছি, ৫ মিনিট পর আবার চেষ্টা করুন।", {
  at: "2026-10-28T09:21:00.000Z",
  authorName: HD_0496_AGENT,
});
hdAppend(HD_0496, "user", "এখন খুলছে, ধন্যবাদ!", { at: "2026-10-28T09:26:00.000Z", authorName: HD_0496_CUSTOMER });

// 0510 — a different ticket with a different conversation. The portal must keep
// the two apart: 0496's rows may never appear here, and nothing of 0510 may leak
// back into 0496. The rows are also *inserted* out of order and one of them
// carries a real `replyTo` (the quote the ERP would send for a linked reply), so
// the thread has to be ordered by creation time and the explicit quote has to win
// over the inferred pairing.
const HD_0510 = "0510";
const HD_0510_CUSTOMER = "Rafiqul Islam";
const HD_0510_AGENT = "Sadia Afrin";
hdThreads.set(HD_0510, {
  name: HD_0510,
  subject: "Refund not received for a cancelled course",
  status: "open",
  currentStatus: "Open",
  statusCategory: "Open",
  priority: "medium",
  category: "payment",
  customer: HD_0510_CUSTOMER,
  customerEmail: "rafiqul@example.com",
  agent: HD_0510_AGENT,
  submittedAt: "2026-10-29T04:05:00.000Z",
  resolvedAt: null,
  messages: [],
  timeline: [],
});
hdAppend(HD_0510, "user", "স্যার, কোর্স বাতিল করেছি কিন্তু টাকা ফেরত পাইনি।", {
  at: "2026-10-29T04:20:00.000Z",
  authorName: HD_0510_CUSTOMER,
});
hdAppend(HD_0510, "support", "অর্ডার নম্বরটা দেবেন? দেখে জানাচ্ছি।", {
  at: "2026-10-29T04:22:00.000Z",
  authorName: HD_0510_AGENT,
});
hdAppend(HD_0510, "user", "ORD-2026-1187", {
  at: "2026-10-29T04:24:00.000Z",
  authorName: HD_0510_CUSTOMER,
  // Deliberately quotes the *first* comment, not the row above it: the ERP's own
  // parent reference must win over the inferred "answers the previous message".
  replyTo: {
    id: "HDMSG-05100A",
    author: "user",
    authorName: HD_0510_CUSTOMER,
    body: "স্যার, কোর্স বাতিল করেছি কিন্তু টাকা ফেরত পাইনি।",
  },
});
hdAppend(HD_0510, "support", "பணம் ফেরতের রিকোয়েস্ট ব্যাংকে পাঠানো হয়েছে, ৩-৫ কর্মদিবস লাগবে।", {
  at: "2026-10-29T04:30:00.000Z",
  authorName: HD_0510_AGENT,
});
// Arrives last in the array but sits in the middle of the thread by time: the
// chat must read it where the timeline puts it, not where the array does.
hdAppend(HD_0510, "user", "ঠিক আছে, অপেক্ষা করছি।", {
  at: "2026-10-29T04:26:00.000Z",
  authorName: HD_0510_CUSTOMER,
});
hdThreads.get(HD_0510).payloadOrder = "reverse";

// 0583 — support answered with a picture, the way it happens on the live site
// (https://dash.shikkhachat.com/helpdesk/tickets/0583). The employee's image is
// a *private* File on the agent-side Comment row: Frappe refuses it to a
// customer session (403), so the portal must fall back to the ticket-scoped
// streamer and then render the picture inline in the conversation.
const HD_0583 = "0583";
const HD_0583_CUSTOMER = "Tamim Hasan";
const HD_0583_AGENT = "MD Shahzalal Amin Surker";
const HD_0583_IMAGE_URL = "/private/files/hd-0583-employee-sign.png";
hdThreads.set(HD_0583, {
  name: HD_0583,
  subject: "রেজাল্ট পেজে এরর আসছে",
  status: "open",
  currentStatus: "Open",
  statusCategory: "Open",
  priority: "medium",
  category: "technical",
  customer: HD_0583_CUSTOMER,
  customerEmail: "client@example.com",
  agent: HD_0583_AGENT,
  submittedAt: "2026-10-31T06:20:00.000Z",
  resolvedAt: null,
  messages: [],
  timeline: [],
});
hdAppend(HD_0583, "user", "রেজাল্ট পেজ খুললে এরর আসছে। কী করব?", {
  at: "2026-10-31T06:20:00.000Z",
  authorName: HD_0583_CUSTOMER,
});
const hd0583File = hdFileRow({
  name: "MOCKFILE-05831",
  url: HD_0583_IMAGE_URL,
  fileName: "employee-sign.png",
  size: 0,
  owner: "agent@shikkhachat.com",
});
hd0583File.attached_to_doctype = "Comment";
hd0583File.attached_to_name = "COMMENT-0583-A1";
hd0583File.is_private = 1;
// Dev-only mirror of Frappe's Comment permission: the customer cannot read this
// row, so a plain GET of the private file must answer 403 and force the portal
// through the ticket-scoped streamer.
hd0583File.agent_only = true;
hdFileBytes.set(HD_0583_IMAGE_URL, AVATAR_BYTES);
hd0583File.file_size = AVATAR_BYTES.length;
const hd0583Reply = hdAppend(
  HD_0583,
  "support",
  "ছবিটি দেখুন — এটি আমাদের এমপ্লয়ি সাইন, এটা দিয়েই ভেরিফাই করতে পারবেন।",
  { at: "2026-10-31T06:33:00.000Z", authorName: HD_0583_AGENT }
);
hd0583Reply.attachments.push({
  id: hd0583File.name,
  name: hd0583File.file_name,
  size: hd0583File.file_size,
  mime: "image/png",
  url: HD_0583_IMAGE_URL,
});

// 0592 — the live report (dash.shikkhachat.com/helpdesk/tickets/0592): support's
// screenshot is not on a message row at all. It is a private File attached to the
// ticket itself, announced by the ``Attachment`` comment Frappe writes and the
// desk renders inside *Activity*. The customer thread must show it as a message
// with that file attached — and the direct GET must stay 403 for the customer.
const HD_0592 = "0592";
const HD_0592_AGENT = "MD Shahzalal Amin Surker";
const HD_0592_IMAGE_URL = "/private/files/hd-0592-employee-sign.png";
hdThreads.set(HD_0592, {
  name: HD_0592,
  subject: "রেজাল্ট পেজে এরর আসছে",
  status: "open",
  currentStatus: "Open",
  statusCategory: "Open",
  priority: "medium",
  category: "technical",
  customer: "Tamim Hasan",
  customerEmail: "client@example.com",
  agent: HD_0592_AGENT,
  submittedAt: "2026-10-30T05:10:00.000Z",
  resolvedAt: null,
  messages: [],
  timeline: [],
});
hdAppend(HD_0592, "user", "রেজাল্ট পেজে এরর আসছে, একটু দেখবেন?", {
  at: "2026-10-30T05:10:00.000Z",
  authorName: "Tamim Hasan",
});
const hd0592File = hdFileRow({
  name: "MOCKFILE-05921",
  url: HD_0592_IMAGE_URL,
  fileName: "hd-0592-employee-sign.png",
  size: 0,
  owner: "agent@shikkhachat.com",
});
hd0592File.attached_to_doctype = "HD Ticket";
hd0592File.attached_to_name = HD_0592;
hd0592File.is_private = 1;
hd0592File.agent_only = true;
hdFileBytes.set(HD_0592_IMAGE_URL, AVATAR_BYTES);
hd0592File.file_size = AVATAR_BYTES.length;
// the Attachment comment's own text is just the file link — the API drops it,
// so the picture stands alone in the bubble
const hd0592Attach = hdAppend(HD_0592, "support", "", {
  at: "2026-10-31T03:00:00.000Z",
  authorName: HD_0592_AGENT,
});
if (hd0592Attach) {
  hd0592Attach.id = "comment:MOCK-0592-ATTACH";
  hd0592Attach.attachments.push({
    id: hd0592File.name,
    name: hd0592File.file_name,
    size: hd0592File.file_size,
    mime: "image/png",
    url: HD_0592_IMAGE_URL,
  });
}
hdAppend(HD_0592, "support", "ছবিটি দেখুন — এটি আমাদের এমপ্লয়ি সাইন, এটা দিয়েই ভেরিফাই করতে পারবেন।", {
  at: "2026-10-31T03:01:00.000Z",
  authorName: HD_0592_AGENT,
});

// 0602 — the file the *employee* sends. Two shapes live on the same ticket and
// both must reach the customer's chat box: an image attached to a support reply,
// and a document that hangs on no message row at all (the desk's attach button
// puts it straight on the ticket, which the API surfaces as its own entry).
const HD_0602 = "0602";
const HD_0602_AGENT = "MD Shahzalal Amin Surker";
const HD_0602_IMAGE_URL = "/private/files/hd-0602-employee-sign.png";
const HD_0602_PDF_URL = "/private/files/hd-0602-payment-slip.pdf";
const HD_0602_PDF_NAME = "hd-0602-payment-slip.pdf";
hdThreads.set(HD_0602, {
  name: HD_0602,
  subject: "পেমেন্ট স্লিপ যুক্ত করুন",
  status: "open",
  currentStatus: "Open",
  statusCategory: "Open",
  priority: "medium",
  category: "billing",
  customer: "Tamim Hasan",
  customerEmail: "client@example.com",
  agent: HD_0602_AGENT,
  submittedAt: "2026-11-01T06:20:00.000Z",
  resolvedAt: null,
  messages: [],
  timeline: [],
});
hdAppend(HD_0602, "user", "আমার পেমেন্ট স্লিপটা চ্যাটে দেখতে পাচ্ছি না, একটু দেবেন?", {
  at: "2026-11-01T06:20:00.000Z",
  authorName: "Tamim Hasan",
});
const hd0602File = hdFileRow({
  name: "MOCKFILE-06021",
  url: HD_0602_IMAGE_URL,
  fileName: "hd-0602-employee-sign.png",
  size: 0,
  owner: "agent@shikkhachat.com",
});
hd0602File.attached_to_doctype = "HD Ticket";
hd0602File.attached_to_name = HD_0602;
hd0602File.is_private = 1;
hd0602File.agent_only = true;
hdFileBytes.set(HD_0602_IMAGE_URL, AVATAR_BYTES);
hd0602File.file_size = AVATAR_BYTES.length;
const hd0602ImageReply = hdAppend(HD_0602, "support", "স্লিপের স্ক্রিনশট দিলাম, দেখুন।", {
  at: "2026-11-01T07:05:00.000Z",
  authorName: HD_0602_AGENT,
});
if (hd0602ImageReply) {
  hd0602ImageReply.attachments.push({
    id: hd0602File.name,
    name: hd0602File.file_name,
    size: hd0602File.file_size,
    mime: "image/png",
    url: HD_0602_IMAGE_URL,
  });
}
const hd0602Pdf = hdFileRow({
  name: "MOCKFILE-06022",
  url: HD_0602_PDF_URL,
  fileName: HD_0602_PDF_NAME,
  size: 0,
  owner: "agent@shikkhachat.com",
});
hd0602Pdf.attached_to_doctype = "HD Ticket";
hd0602Pdf.attached_to_name = HD_0602;
hd0602Pdf.is_private = 1;
hd0602Pdf.agent_only = true;
const HD_0602_PDF_BYTES = Buffer.from("%PDF-1.4\n% stub payment slip\n%%EOF\n", "utf8");
hdFileBytes.set(HD_0602_PDF_URL, HD_0602_PDF_BYTES);
hd0602Pdf.file_size = HD_0602_PDF_BYTES.length;
// No message row claims the document: this is the entry the API's orphan sweep
// emits (body empty, one attachment) and exactly what the customer saw vanish.
hdAppend(HD_0602, "support", "", {
  at: "2026-11-01T07:06:00.000Z",
  authorName: HD_0602_AGENT,
  attachments: [
    {
      id: hd0602Pdf.name,
      name: HD_0602_PDF_NAME,
      size: hd0602Pdf.file_size,
      mime: "application/pdf",
      url: HD_0602_PDF_URL,
    },
  ],
});

// 0611 — reported again after 0602: the employee replies from the agent portal
// (userDashboard) with a screenshot, and the desk ticket page shows the file, yet
// the customer's chat box shows only the text. Both carrier shapes are seeded:
// the image rides the support reply (files live on the Communication row), and a
// proof PDF hangs on the ticket alone with no message row anywhere.
const HD_0611 = "0611";
const HD_0611_AGENT = "MD Shahzalal Amin Surker";
const HD_0611_IMAGE_URL = "/private/files/hd-0611-employee-slip.png";
const HD_0611_PDF_URL = "/private/files/hd-0611-proof.pdf";
const HD_0611_PDF_NAME = "hd-0611-proof.pdf";
hdThreads.set(HD_0611, {
  name: HD_0611,
  subject: "স্ক্রিনশট যুক্ত করুন",
  status: "open",
  currentStatus: "Open",
  statusCategory: "Open",
  priority: "medium",
  category: "billing",
  customer: "Tamim Hasan",
  customerEmail: "client@example.com",
  agent: HD_0611_AGENT,
  submittedAt: "2026-11-01T08:10:00.000Z",
  resolvedAt: null,
  messages: [],
  timeline: [],
});
hdAppend(HD_0611, "user", "আপনার পাঠানো স্ক্রিনশটটা চ্যাটে দেখা যাচ্ছে না।", {
  at: "2026-11-01T08:10:00.000Z",
  authorName: "Tamim Hasan",
});
const hd0611Image = hdFileRow({
  name: "MOCKFILE-06111",
  url: HD_0611_IMAGE_URL,
  fileName: "hd-0611-employee-slip.png",
  size: 0,
  owner: "agent@shikkhachat.com",
});
hd0611Image.attached_to_doctype = "Communication";
hd0611Image.attached_to_name = "MOCKCOMM-06111";
hd0611Image.is_private = 1;
hd0611Image.agent_only = true;
hdFileBytes.set(HD_0611_IMAGE_URL, AVATAR_BYTES);
hd0611Image.file_size = AVATAR_BYTES.length;
const hd0611ImageReply = hdAppend(HD_0611, "support", "স্ক্রিনশটটি দেখুন, এখানে পেমেন্ট ডিটেইল আছে।", {
  at: "2026-11-01T08:40:00.000Z",
  authorName: HD_0611_AGENT,
});
if (hd0611ImageReply) {
  hd0611ImageReply.attachments.push({
    id: hd0611Image.name,
    name: hd0611Image.file_name,
    size: hd0611Image.file_size,
    mime: "image/png",
    url: HD_0611_IMAGE_URL,
  });
}
const hd0611Pdf = hdFileRow({
  name: "MOCKFILE-06112",
  url: HD_0611_PDF_URL,
  fileName: HD_0611_PDF_NAME,
  size: 0,
  owner: "agent@shikkhachat.com",
});
hd0611Pdf.attached_to_doctype = "HD Ticket";
hd0611Pdf.attached_to_name = HD_0611;
hd0611Pdf.is_private = 1;
hd0611Pdf.agent_only = true;
const HD_0611_PDF_BYTES = Buffer.from("%PDF-1.4\n% stub proof slip\n%%EOF\n", "utf8");
hdFileBytes.set(HD_0611_PDF_URL, HD_0611_PDF_BYTES);
hd0611Pdf.file_size = HD_0611_PDF_BYTES.length;
hdAppend(HD_0611, "support", "", {
  at: "2026-11-01T08:41:00.000Z",
  authorName: HD_0611_AGENT,
  attachments: [
    {
      id: hd0611Pdf.name,
      name: HD_0611_PDF_NAME,
      size: hd0611Pdf.file_size,
      mime: "application/pdf",
      url: HD_0611_PDF_URL,
    },
  ],
});

// 0616 - the customer's chat box must read like the desk ticket: oldest on top,
// newest at the bottom, customer on the right, employee on the left, and a retried
// send that landed on both channels only once. The payload is handed over in the
// order the two channels were read (reversed), which is exactly the mismatch the
// portal has to correct.
const HD_0616 = "0616";
hdThreads.set(HD_0616, {
  name: HD_0616,
  subject: "পেমেন্ট স্লিপ ও স্ট্যাটাস",
  status: "open",
  currentStatus: "Open",
  statusCategory: "Open",
  priority: "medium",
  category: "billing",
  customer: "Tamim Hasan",
  customerEmail: "client@example.com",
  agent: "MD Shahzalal Amin Surker",
  submittedAt: "2026-11-02T09:05:00.000Z",
  resolvedAt: null,
  messages: [],
  timeline: [],
  // See hdConversation: only the no-limit (detail page) read is reversed.
  payloadOrder: "reverse",
});
hdAppend(HD_0616, "user", "[0616-1] পেমেন্ট স্লিপ পাঠিয়েছি, দেখে নিন।", {
  at: "2026-11-02T09:05:00.000Z",
});
hdAppend(HD_0616, "support", "[0616-2] স্লিপটি পেয়েছি, যাচাই করছি।", {
  at: "2026-11-02T09:18:00.000Z",
  authorName: "MD Shahzalal Amin Surker",
});
hdAppend(HD_0616, "user", "[0616-3] ধন্যবাদ, কত সময় লাগবে?", {
  at: "2026-11-02T09:26:00.000Z",
});
hdAppend(HD_0616, "support", "[0616-4] আজকের মধ্যেই জানিয়ে দিচ্ছি।", {
  at: "2026-11-02T09:41:00.000Z",
  authorName: "MD Shahzalal Amin Surker",
});
// The retried send: same words, same side, three minutes later, other channel.
const hd0616Retry = hdAppend(HD_0616, "user", "[0616-3] ধন্যবাদ, কত সময় লাগবে?", {
  at: "2026-11-02T09:29:00.000Z",
});
if (hd0616Retry) {
  hd0616Retry.id = "HDMSG-0616R";
  hd0616Retry.channel = "message";
}

// 0623 - the chat box issue ticket, seeded exactly as the desk shows it: two
// customer lines (one with only a receipt picture), two employee lines, then the
// customer's "ok sir". The payload is handed over reversed so the portal has to
// put the sequence right instead of trusting the read order.
const HD_0623 = "0623";
const HD_0623_AGENT = "MD Shahzalal Amin Surker";
const HD_0623_IMAGE_URL = "/private/files/payment-receipt-080QqpUdCU8b55bd.png";
const HD_0623_IMAGE_NAME = "payment-receipt-080QqpUdCU8b55bd.png";
const HD_0623_JPG_URL = "/private/files/payment-receipt-2Y7fjJLDw.jpg";
const HD_0623_JPG_NAME = "payment-receipt-2Y7fjJLDw.jpg";
hdThreads.set(HD_0623, {
  name: HD_0623,
  subject: "chat box issue",
  status: "open",
  currentStatus: "Open",
  statusCategory: "Open",
  priority: "medium",
  category: "billing",
  customer: "Tamim Hasan",
  customerEmail: "client@example.com",
  agent: HD_0623_AGENT,
  submittedAt: "2026-11-02T09:52:00.000Z",
  resolvedAt: null,
  messages: [],
  timeline: [],
  payloadOrder: "reverse",
});
hdAppend(HD_0623, "user", "[0623-1] yhhhhhhhhhhhhhhhhhhhhhh", {
  at: "2026-11-02T09:53:00.000Z",
});
// The customer's own receipt, sent as the picture alone (the desk shows it as an
// Attachment comment carrying the inline image): body empty, one file.
const hd0623Image = hdFileRow({
  name: "MOCKFILE-06231",
  url: HD_0623_IMAGE_URL,
  fileName: HD_0623_IMAGE_NAME,
  size: 0,
  owner: "client@example.com",
});
hd0623Image.attached_to_doctype = "Comment";
hd0623Image.attached_to_name = "MOCKCOMMENT-06231";
hd0623Image.is_private = 1;
hdFileBytes.set(HD_0623_IMAGE_URL, AVATAR_BYTES);
hd0623Image.file_size = AVATAR_BYTES.length;
hdAppend(HD_0623, "user", "", {
  at: "2026-11-02T09:55:00.000Z",
  attachments: [
    {
      id: hd0623Image.name,
      name: HD_0623_IMAGE_NAME,
      size: hd0623Image.file_size,
      mime: "image/png",
      url: HD_0623_IMAGE_URL,
    },
  ],
});
const hd0623Jpg = hdFileRow({
  name: "MOCKFILE-06232",
  url: HD_0623_JPG_URL,
  fileName: HD_0623_JPG_NAME,
  size: 0,
  owner: "agent@shikkhachat.com",
});
hd0623Jpg.attached_to_doctype = "Communication";
hd0623Jpg.attached_to_name = "MOCKCOMM-06231";
hd0623Jpg.is_private = 1;
hd0623Jpg.agent_only = true;
hdFileBytes.set(HD_0623_JPG_URL, AVATAR_BYTES);
hd0623Jpg.file_size = AVATAR_BYTES.length;
hdAppend(HD_0623, "support", "[0623-3] solve problem", {
  at: "2026-11-02T09:57:00.000Z",
  authorName: HD_0623_AGENT,
  attachments: [
    {
      id: hd0623Jpg.name,
      name: HD_0623_JPG_NAME,
      size: hd0623Jpg.file_size,
      mime: "image/jpeg",
      url: HD_0623_JPG_URL,
    },
  ],
});
hdAppend(HD_0623, "support", "[0623-4] hello sir", {
  at: "2026-11-02T09:59:00.000Z",
  authorName: HD_0623_AGENT,
});
hdAppend(HD_0623, "user", "[0623-5] ok sir", {
  at: "2026-11-02T10:01:00.000Z",
});

// 0643 - the "attach a picture the first time" ticket. It starts empty on
// purpose: the e2e sends the first message with an image through the real
// composer, and this thread answers the way the live desk does - the same upload
// named twice on the message itself, plus a bare Attachment comment that holds
// nothing but the picture.
const HD_0643 = "0643";
hdThreads.set(HD_0643, {
  name: HD_0643,
  subject: "attachment test",
  status: "open",
  currentStatus: "Open",
  statusCategory: "Open",
  priority: "medium",
  category: "billing",
  customer: "Tamim Hasan",
  customerEmail: "client@example.com",
  agent: "MD Shahzalal Amin Surker",
  submittedAt: "2026-11-02T10:00:00.000Z",
  resolvedAt: null,
  messages: [],
  timeline: [],
  mirrorAttachments: true,
});

// 0658 — "attached file image do not view properly". The employee attaches a
// full-page screenshot (1600x900): a wide picture is what breaks a bubble whose
// image is only capped by height, so this fixture is the standing proof that the
// thumbnail keeps the whole picture inside the bubble at its own aspect ratio.
const HD_0658 = "0658";
const HD_0658_AGENT = "MD Shahzalal Amin Surker";
const HD_0658_IMAGE_URL = "/private/files/hd-0658-screenshot.png";
const HD_0658_IMAGE_NAME = "Screenshot-18_57d4b9.png";
hdThreads.set(HD_0658, {
  name: HD_0658,
  subject: "পেজে এরর আসছে",
  status: "open",
  currentStatus: "Open",
  statusCategory: "Open",
  priority: "medium",
  category: "technical",
  customer: "Tamim Hasan",
  customerEmail: "client@example.com",
  agent: HD_0658_AGENT,
  submittedAt: "2026-11-02T11:00:00.000Z",
  resolvedAt: null,
  messages: [],
  timeline: [],
});
hdAppend(HD_0658, "user", "[0658-1] এই পেজে এরর আসছে, স্ক্রিনশট দিচ্ছি", {
  at: "2026-11-02T11:00:00.000Z",
  authorName: "Tamim Hasan",
});
const hd0658Image = hdFileRow({
  name: "MOCKFILE-06581",
  url: HD_0658_IMAGE_URL,
  fileName: HD_0658_IMAGE_NAME,
  size: 0,
  owner: "agent@shikkhachat.com",
});
hd0658Image.attached_to_doctype = "Comment";
hd0658Image.attached_to_name = "MOCKCOMMENT-06581";
hd0658Image.is_private = 1;
hd0658Image.agent_only = true;
// A wide screenshot, so the browser has real bytes to lay out: 1600x900.
const HD_0658_IMAGE_BYTES = (() => {
  try {
    return readFileSync(new URL("./fixtures/hd-0658-screenshot.png", import.meta.url));
  } catch {
    return AVATAR_BYTES;
  }
})();
hdFileBytes.set(HD_0658_IMAGE_URL, HD_0658_IMAGE_BYTES);
// The lead Attachments tab demo picture reuses this real screenshot, so the
// thumbnail and the preview look like an actual uploaded file.
hdFileBytes.set("/files/lead-site-visit.png", HD_0658_IMAGE_BYTES);
hd0658Image.file_size = HD_0658_IMAGE_BYTES.length;
hdAppend(HD_0658, "support", "[0658-2] স্ক্রিনশট দেখুন", {
  at: "2026-11-02T11:10:00.000Z",
  authorName: HD_0658_AGENT,
  attachments: [
    {
      id: hd0658Image.name,
      name: HD_0658_IMAGE_NAME,
      size: hd0658Image.file_size,
      mime: "image/png",
      url: HD_0658_IMAGE_URL,
    },
  ],
});

// 0662 — the live shape behind "attached file image does not view properly": two
// attachment-only rows, the customer's own upload first and the employee's reply
// upload second. The employee file lives on an agent-side row, so a customer
// session gets 403 on the direct URL and only the ticket-scoped streamer can hand
// the bytes over. This fixture is the standing proof that the portal still paints
// that picture (and the 0658 fixture keeps proving the geometry).
const HD_0662 = "0662";
const HD_0662_USER_IMAGE_URL = "/private/files/Screenshot-_18_57d4b9.png";
const HD_0662_STAFF_IMAGE_URL = "/private/files/Screenshot-_19_6e0bc2.png";
hdThreads.set(HD_0662, {
  name: HD_0662,
  subject: "ছবি দেখা যাচ্ছে না",
  status: "open",
  currentStatus: "Open",
  statusCategory: "Open",
  priority: "medium",
  category: "technical",
  customer: "Tajul Islam",
  customerEmail: "client@example.com",
  agent: HD_0658_AGENT,
  submittedAt: "2026-11-02T12:00:00.000Z",
  resolvedAt: null,
  messages: [],
  timeline: [],
});

// The customer's own upload: readable directly, so the plain URL works.
const hd0662UserImage = hdFileRow({
  name: "MOCKFILE-06621",
  url: HD_0662_USER_IMAGE_URL,
  fileName: "Screenshot-_18_57d4b9.png",
  size: 0,
  owner: "client@example.com",
});
hd0662UserImage.attached_to_doctype = "Comment";
hd0662UserImage.attached_to_name = "MOCKCOMMENT-06621";
hd0662UserImage.is_private = 1;
hdFileBytes.set(HD_0662_USER_IMAGE_URL, HD_0658_IMAGE_BYTES);
hd0662UserImage.file_size = HD_0658_IMAGE_BYTES.length;

// The employee's reply upload: agent-side, so `agent_only` makes a direct read a
// 403 and the portal has to go through `help_desk_files.stream_file`.
const hd0662StaffImage = hdFileRow({
  name: "MOCKFILE-06622",
  url: HD_0662_STAFF_IMAGE_URL,
  fileName: "Screenshot-_19_6e0bc2.png",
  size: 0,
  owner: "agent@shikkhachat.com",
});
hd0662StaffImage.attached_to_doctype = "Comment";
hd0662StaffImage.attached_to_name = "MOCKCOMMENT-06622";
hd0662StaffImage.is_private = 1;
hd0662StaffImage.agent_only = true;
hdFileBytes.set(HD_0662_STAFF_IMAGE_URL, HD_0658_IMAGE_BYTES);
hd0662StaffImage.file_size = HD_0658_IMAGE_BYTES.length;

hdAppend(HD_0662, "user", "", {
  at: "2026-11-02T12:00:00.000Z",
  authorName: "Tajul Islam",
  attachments: [
    {
      id: hd0662UserImage.name,
      name: "Screenshot-_18_57d4b9.png",
      size: hd0662UserImage.file_size,
      mime: "image/png",
      url: HD_0662_USER_IMAGE_URL,
    },
  ],
});
hdAppend(HD_0662, "support", "", {
  at: "2026-11-02T12:05:00.000Z",
  authorName: HD_0658_AGENT,
  attachments: [
    {
      id: hd0662StaffImage.name,
      name: "Screenshot-_19_6e0bc2.png",
      size: hd0662StaffImage.file_size,
      mime: "image/png",
      url: HD_0662_STAFF_IMAGE_URL,
    },
  ],
});

// 0747 — the ticket behind "the chat has to read like the desk's Activity tab":
// the customer's text, two attachment-only rows (the desk's "Shared" rows), and
// the employee's emailed reply, which the desk stamps `To: <customer email>` and
// which carries its own picture.
const HD_0747 = "0747";
const HD_0747_CUSTOMER = "tajul23";
const HD_0747_CUSTOMER_EMAIL = "tajul789@gmail.com";
const HD_0747_AGENT = "MD Shahzalal Amin Surker";
const HD_0747_IMG5_URL = "/private/files/Screenshot-5-20261104-171145d7ba8b.png";
const HD_0747_IMG6_URL = "/private/files/Screenshot-6-20261104-171238503386.png";
const HD_0747_IMG3_URL = "/private/files/Screenshot-3-20261104-1713228b5efa.png";
hdThreads.set(HD_0747, {
  name: HD_0747,
  subject: "hjkkkk",
  status: "open",
  currentStatus: "Open",
  statusCategory: "Open",
  priority: "medium",
  category: "technical",
  customer: HD_0747_CUSTOMER,
  customerEmail: "client@example.com",
  customerContactEmail: HD_0747_CUSTOMER_EMAIL,
  agent: HD_0747_AGENT,
  submittedAt: "2026-11-04T12:05:00.000Z",
  resolvedAt: null,
  messages: [],
  timeline: [
    {
      id: "created",
      type: "created",
      at: "2026-11-04T12:05:00.000Z",
      author: "user",
      authorName: HD_0747_CUSTOMER,
      text: "hjkkkk\nCategory: Technical\nPreferred contact: email",
      attachments: 0,
    },
  ],
});
hdAppend(HD_0747, "user", "kkkkkkkkkkkkkkkkkkkkkkk", {
  at: "2026-11-04T12:10:00.000Z",
  authorName: HD_0747_CUSTOMER,
});
const hd0747Img5 = hdFileRow({
  name: "MOCKFILE-07471",
  url: HD_0747_IMG5_URL,
  fileName: "Screenshot-5-20261104-171145d7ba8b.png",
  size: 0,
  owner: "client@example.com",
});
hd0747Img5.attached_to_doctype = "Comment";
hd0747Img5.attached_to_name = "MOCKCOMMENT-07471";
hd0747Img5.is_private = 1;
hdFileBytes.set(HD_0747_IMG5_URL, AVATAR_BYTES);
hd0747Img5.file_size = AVATAR_BYTES.length;
hdAppend(HD_0747, "user", "", {
  at: "2026-11-04T12:11:45.000Z",
  authorName: HD_0747_CUSTOMER,
  attachments: [
    {
      id: hd0747Img5.name,
      name: "Screenshot-5-20261104-171145d7ba8b.png",
      size: hd0747Img5.file_size,
      mime: "image/png",
      url: HD_0747_IMG5_URL,
    },
  ],
});
const hd0747Img6 = hdFileRow({
  name: "MOCKFILE-07472",
  url: HD_0747_IMG6_URL,
  fileName: "Screenshot-6-20261104-171238503386.png",
  size: 0,
  owner: "agent@shikkhachat.com",
});
hd0747Img6.attached_to_doctype = "Communication";
hd0747Img6.attached_to_name = "MOCKCOMM-07471";
hd0747Img6.is_private = 1;
hd0747Img6.agent_only = true;
hdFileBytes.set(HD_0747_IMG6_URL, AVATAR_BYTES);
hd0747Img6.file_size = AVATAR_BYTES.length;
hdAppend(HD_0747, "support", "শেয়ার", {
  at: "2026-11-04T12:12:38.000Z",
  authorName: HD_0747_AGENT,
  recipients: HD_0747_CUSTOMER_EMAIL,
  attachments: [
    {
      id: hd0747Img6.name,
      name: "Screenshot-6-20261104-171238503386.png",
      size: hd0747Img6.file_size,
      mime: "image/png",
      url: HD_0747_IMG6_URL,
    },
  ],
});
const hd0747Img3 = hdFileRow({
  name: "MOCKFILE-07473",
  url: HD_0747_IMG3_URL,
  fileName: "Screenshot-3-20261104-1713228b5efa.png",
  size: 0,
  owner: "client@example.com",
});
hd0747Img3.attached_to_doctype = "Comment";
hd0747Img3.attached_to_name = "MOCKCOMMENT-07473";
hd0747Img3.is_private = 1;
hdFileBytes.set(HD_0747_IMG3_URL, AVATAR_BYTES);
hd0747Img3.file_size = AVATAR_BYTES.length;
hdAppend(HD_0747, "user", "", {
  at: "2026-11-04T12:13:22.000Z",
  authorName: HD_0747_CUSTOMER,
  attachments: [
    {
      id: hd0747Img3.name,
      name: "Screenshot-3-20261104-1713228b5efa.png",
      size: hd0747Img3.file_size,
      mime: "image/png",
      url: HD_0747_IMG3_URL,
    },
  ],
});

// The desk's last three rows re-share the same three pictures by email: the
// agent mails Screenshot-5, then Screenshot-3, then Screenshot-2 (9 minutes
// ago). Each is an email row with a To: recipient and the "shared" chip.
const hd0747Reshare5 = hdFileRow({
  name: "MOCKFILE-07475",
  url: HD_0747_IMG5_URL,
  fileName: "Screenshot-5-20261104-171145d7ba8b.png",
  size: 0,
  owner: "agent@shikkhachat.com",
});
hd0747Reshare5.attached_to_doctype = "Communication";
hd0747Reshare5.attached_to_name = "MOCKCOMM-07472";
hd0747Reshare5.is_private = 1;
hd0747Reshare5.agent_only = true;
hd0747Reshare5.file_size = AVATAR_BYTES.length;
hdAppend(HD_0747, "support", "শেয়ার", {
  at: "2026-11-04T12:14:30.000Z",
  authorName: HD_0747_AGENT,
  recipients: HD_0747_CUSTOMER_EMAIL,
  attachments: [
    {
      id: hd0747Reshare5.name,
      name: "Screenshot-5-20261104-171145d7ba8b.png",
      size: hd0747Reshare5.file_size,
      mime: "image/png",
      url: HD_0747_IMG5_URL,
    },
  ],
});
const hd0747Reshare3 = hdFileRow({
  name: "MOCKFILE-07476",
  url: HD_0747_IMG3_URL,
  fileName: "Screenshot-3-20261104-1713228b5efa.png",
  size: 0,
  owner: "agent@shikkhachat.com",
});
hd0747Reshare3.attached_to_doctype = "Communication";
hd0747Reshare3.attached_to_name = "MOCKCOMM-07472";
hd0747Reshare3.is_private = 1;
hd0747Reshare3.agent_only = true;
hd0747Reshare3.file_size = AVATAR_BYTES.length;
hdAppend(HD_0747, "support", "শেয়ার", {
  at: "2026-11-04T12:15:40.000Z",
  authorName: HD_0747_AGENT,
  recipients: HD_0747_CUSTOMER_EMAIL,
  attachments: [
    {
      id: hd0747Reshare3.name,
      name: "Screenshot-3-20261104-1713228b5efa.png",
      size: hd0747Reshare3.file_size,
      mime: "image/png",
      url: HD_0747_IMG3_URL,
    },
  ],
});
const HD_0747_IMG2_URL = "/private/files/Screenshot-2-20261104-1749438c8a93.png";
const hd0747Img2 = hdFileRow({
  name: "MOCKFILE-07474",
  url: HD_0747_IMG2_URL,
  fileName: "Screenshot-2-20261104-1749438c8a93.png",
  size: 0,
  owner: "agent@shikkhachat.com",
});
hd0747Img2.attached_to_doctype = "Communication";
hd0747Img2.attached_to_name = "MOCKCOMM-07472";
hd0747Img2.is_private = 1;
hd0747Img2.agent_only = true;
hdFileBytes.set(HD_0747_IMG2_URL, AVATAR_BYTES);
hd0747Img2.file_size = AVATAR_BYTES.length;
hdAppend(HD_0747, "support", "শেয়ার", {
  at: "2026-11-04T12:19:43.000Z",
  authorName: HD_0747_AGENT,
  recipients: HD_0747_CUSTOMER_EMAIL,
  attachments: [
    {
      id: hd0747Img2.name,
      name: "Screenshot-2-20261104-1749438c8a93.png",
      size: hd0747Img2.file_size,
      mime: "image/png",
      url: HD_0747_IMG2_URL,
    },
  ],
});

// 0759 — the ordering ticket: the same conversation the desk's Activity tab
// shows in time order, seeded with the ways the ERP hands rows over *out* of
// order and *twice*: an overlapping page (one message delivered again under a
// new id), a send stored by both channels (a Comment and a Communication, the
// second wrapped in HTML), a re-sent upload of the same file, and a row whose
// timestamp arrives in Frappe's space-separated form and is appended last.
// The portal has to read each row once, oldest first.
const HD_0759 = "0759";
const HD_0759_CUSTOMER = "Nusrat Jahan";
const HD_0759_CUSTOMER_EMAIL = "nusrat@example.com";
const HD_0759_IMG1_URL = "/private/files/Screenshot-1-20261104-130205aa11.png";
const HD_0759_IMG2_URL = "/private/files/Screenshot-2-20261104-130720bb22.png";
const HD_0759_IMG7_URL = "/private/files/Screenshot-7-20261104-130600cc33.png";
hdThreads.set(HD_0759, {
  name: HD_0759,
  subject: "Unable to login",
  status: "open",
  currentStatus: "Open",
  statusCategory: "Open",
  priority: "medium",
  category: "technical",
  customer: HD_0759_CUSTOMER,
  customerEmail: "client@example.com",
  customerContactEmail: HD_0759_CUSTOMER_EMAIL,
  agent: HD_0747_AGENT,
  submittedAt: "2026-11-04T13:00:00.000Z",
  resolvedAt: null,
  messages: [],
  timeline: [
    {
      id: "created",
      type: "created",
      at: "2026-11-04T13:00:00.000Z",
      author: "user",
      authorName: HD_0759_CUSTOMER,
      text: "Unable to login\nCategory: Technical\nPreferred contact: email",
      attachments: 0,
    },
  ],
});

// 1 — the customer's first text.
hdAppend(HD_0759, "user", "hlw ami login korte parchi na", {
  at: "2026-11-04T13:01:10.000Z",
  authorName: HD_0759_CUSTOMER,
});

// 2 — the customer shares a picture (the desk's "Shared" row).
const hd0759Img1 = hdFileRow({
  name: "MOCKFILE-07591",
  url: HD_0759_IMG1_URL,
  fileName: "Screenshot-1-20261104-130205aa11.png",
  size: 0,
  owner: "client@example.com",
});
hd0759Img1.attached_to_doctype = "Comment";
hd0759Img1.attached_to_name = "MOCKCOMMENT-07591";
hd0759Img1.is_private = 1;
hdFileBytes.set(HD_0759_IMG1_URL, AVATAR_BYTES);
hd0759Img1.file_size = AVATAR_BYTES.length;
hdAppend(HD_0759, "user", "", {
  at: "2026-11-04T13:02:05.000Z",
  authorName: HD_0759_CUSTOMER,
  attachments: [
    {
      id: hd0759Img1.name,
      name: "Screenshot-1-20261104-130205aa11.png",
      size: hd0759Img1.file_size,
      mime: "image/png",
      url: HD_0759_IMG1_URL,
    },
  ],
});

// 2b — the same row delivered again by the other channel: same file, same
// second, space-separated timestamp. Must fold into row 2.
const hd0759Twin = hdAppend(HD_0759, "user", "", {
  at: "2026-11-04 19:02:05",
  authorName: HD_0759_CUSTOMER,
  attachments: [
    {
      id: hd0759Img1.name,
      name: "Screenshot-1-20261104-130205aa11.png",
      size: hd0759Img1.file_size,
      mime: "image/png",
      url: HD_0759_IMG1_URL,
    },
  ],
});
if (hd0759Twin) hd0759Twin.channel = "message";

// 3 — the employee's emailed answer.
hdAppend(HD_0759, "support", "আপনার সমস্যাটি দেখছি, একটু অপেক্ষা করুন", {
  at: "2026-11-04T13:03:30.000Z",
  authorName: HD_0747_AGENT,
  recipients: HD_0759_CUSTOMER_EMAIL,
});

// 3b — the same answer as stored by the Comment channel, wrapped in the
// editor's HTML: a retry the desk shows once.
const hd0759ReplyTwin = hdAppend(
  HD_0759,
  "support",
  "<p>আপনার সমস্যাটি দেখছি, একটু অপেক্ষা করুন</p>",
  {
    at: "2026-11-04T13:03:31.000Z",
    authorName: HD_0747_AGENT,
  },
);
if (hd0759ReplyTwin) hd0759ReplyTwin.channel = "comment";

// 4 — the customer answers twice (two different moments, both must survive).
hdAppend(HD_0759, "user", "ok", {
  at: "2026-11-04T13:04:40.000Z",
  authorName: HD_0759_CUSTOMER,
});
hdAppend(HD_0759, "user", "ok", {
  at: "2026-11-04T13:04:52.000Z",
  authorName: HD_0759_CUSTOMER,
});

// 5 — the employee sends a picture by email.
const hd0759Img7 = hdFileRow({
  name: "MOCKFILE-07597",
  url: HD_0759_IMG7_URL,
  fileName: "Screenshot-7-20261104-130600cc33.png",
  size: 0,
  owner: "agent@shikkhachat.com",
});
hd0759Img7.attached_to_doctype = "Communication";
hd0759Img7.attached_to_name = "MOCKCOMM-07591";
hd0759Img7.is_private = 1;
hd0759Img7.agent_only = true;
hdFileBytes.set(HD_0759_IMG7_URL, AVATAR_BYTES);
hd0759Img7.file_size = AVATAR_BYTES.length;
hdAppend(HD_0759, "support", "শেয়ার", {
  at: "2026-11-04T13:06:00.000Z",
  authorName: HD_0747_AGENT,
  recipients: HD_0759_CUSTOMER_EMAIL,
  attachments: [
    {
      id: hd0759Img7.name,
      name: "Screenshot-7-20261104-130600cc33.png",
      size: hd0759Img7.file_size,
      mime: "image/png",
      url: HD_0759_IMG7_URL,
    },
  ],
});

// 5b — the same file re-sent five seconds later on the same channel: a
// duplicate upload, read once.
hdAppend(HD_0759, "support", "", {
  at: "2026-11-04T13:06:05.000Z",
  authorName: HD_0747_AGENT,
  attachments: [
    {
      id: hd0759Img7.name,
      name: "Screenshot-7-20261104-130600cc33.png",
      size: hd0759Img7.file_size,
      mime: "image/png",
      url: HD_0759_IMG7_URL,
    },
  ],
});

// 6 — the customer shares a second picture.
const hd0759Img2 = hdFileRow({
  name: "MOCKFILE-07592",
  url: HD_0759_IMG2_URL,
  fileName: "Screenshot-2-20261104-130720bb22.png",
  size: 0,
  owner: "client@example.com",
});
hd0759Img2.attached_to_doctype = "Comment";
hd0759Img2.attached_to_name = "MOCKCOMMENT-07592";
hd0759Img2.is_private = 1;
hdFileBytes.set(HD_0759_IMG2_URL, AVATAR_BYTES);
hd0759Img2.file_size = AVATAR_BYTES.length;
hdAppend(HD_0759, "user", "", {
  at: "2026-11-04T13:07:20.000Z",
  authorName: HD_0759_CUSTOMER,
  attachments: [
    {
      id: hd0759Img2.name,
      name: "Screenshot-2-20261104-130720bb22.png",
      size: hd0759Img2.file_size,
      mime: "image/png",
      url: HD_0759_IMG2_URL,
    },
  ],
});

// 7 — a row handed over last but belonging between 2 and 3 (13:02:50), with
// the space-separated timestamp form: sorting has to move it into place.
hdAppend(HD_0759, "user", "abar try korlam", {
  at: "2026-11-04 19:02:50",
  authorName: HD_0759_CUSTOMER,
});

// ---------------------------------------------------------------------------
// 0781 — the desk's own case: both the customer and the employee write on the
// same ticket, and the employee's dashboard detail page has to read exactly
// like the immersive conversation page: every send, its time, in order.
// ---------------------------------------------------------------------------
const HD_0781 = "0781";
hdThreads.set(HD_0781, {
  name: HD_0781,
  subject: "Portal chat reply",
  status: "open",
  currentStatus: "Open",
  statusCategory: "Open",
  priority: "medium",
  category: "technical",
  customer: HD_0759_CUSTOMER,
  customerEmail: "client@example.com",
  customerContactEmail: HD_0759_CUSTOMER_EMAIL,
  agent: HD_0747_AGENT,
  submittedAt: "2026-11-05T06:00:00.000Z",
  resolvedAt: null,
  messages: [],
  timeline: [
    {
      id: "created",
      type: "created",
      at: "2026-11-05T06:00:00.000Z",
      author: "user",
      authorName: HD_0759_CUSTOMER,
      text: "Portal chat reply\nCategory: Technical\nPreferred contact: email",
      attachments: 0,
    },
  ],
});

hdAppend(HD_0781, "user", "assalamu alaikum, amar order update dorkar", {
  at: "2026-11-05T06:01:00.000Z",
  authorName: HD_0759_CUSTOMER,
});

hdAppend(HD_0781, "support", "walaikum assalam, order ti check korchi", {
  at: "2026-11-05T06:03:00.000Z",
  authorName: HD_0747_AGENT,
  recipients: HD_0759_CUSTOMER_EMAIL,
});

hdAppend(HD_0781, "user", "dhonnobad, wait korchi", {
  at: "2026-11-05T06:05:00.000Z",
  authorName: HD_0759_CUSTOMER,
});

// 0793 — the desk's own ticket ("problem6666", customer tajul23), mirrored row
// for row from dash.shikkhachat.com/helpdesk/tickets/0793: the customer opens
// with a garbled body plus a screenshot, the employee mails three replies (one
// carrying a picture), the customer answers "na sir" with a reaction, and the
// team is reassigned in between. Both the client dashboard section and the
// employee's কথোপকথন panel have to show exactly this, with each row's time.
const HD_0793 = "0793";
const HD_0793_AGENT = HD_0747_AGENT;
const HD_0793_CUSTOMER = "tajul23";
const HD_0793_EMAIL = "tajul789@gmail.com";
const hd0793Ago = (minutes) => new Date(Date.now() - minutes * 60000).toISOString();

hdThreads.set(HD_0793, {
  name: HD_0793,
  subject: "problem6666",
  status: "open",
  currentStatus: "Open",
  statusCategory: "Open",
  priority: "medium",
  category: "bug",
  customer: HD_0793_CUSTOMER,
  customerEmail: "client@example.com",
  customerContactEmail: HD_0793_EMAIL,
  agent: HD_0793_AGENT,
  team: "Support Team",
  submittedAt: hd0793Ago(19),
  resolvedAt: null,
  messages: [],
  timeline: [
    {
      id: "created",
      type: "created",
      at: hd0793Ago(19.75),
      author: "user",
      authorName: HD_0793_CUSTOMER,
      text: "|||||||||||||||||||||||||||||||||||||",
      attachments: 0,
    },
  ],
});

// The customer's two uploads: the ticket-opening screenshot and the one the
// employee re-shares by email later.
const HD_0793_IMG1_URL = "/private/files/Screenshot-1_-20261104-184603ac8be7.png";
const HD_0793_IMG4_URL = "/private/files/Screenshot-4_-20261105-140926c5e72b.png";
const hd0793Img1 = hdFileRow({
  name: "MOCKFILE-07931",
  url: HD_0793_IMG1_URL,
  fileName: "Screenshot-1_-20261104-184603ac8be7.png",
  size: 0,
  owner: HD_0793_EMAIL,
});
hd0793Img1.attached_to_doctype = "Comment";
hd0793Img1.attached_to_name = "MOCKCOMMENT-07931";
hd0793Img1.is_private = 1;
hd0793Img1.file_size = AVATAR_BYTES.length;
hdFileBytes.set(HD_0793_IMG1_URL, AVATAR_BYTES);
const hd0793Img4 = hdFileRow({
  name: "MOCKFILE-07934",
  url: HD_0793_IMG4_URL,
  fileName: "Screenshot-4_-20261105-140926c5e72b.png",
  size: 0,
  owner: "agent@shikkhachat.com",
});
hd0793Img4.attached_to_doctype = "Communication";
hd0793Img4.attached_to_name = "MOCKCOMM-07934";
hd0793Img4.is_private = 1;
hd0793Img4.agent_only = true;
hd0793Img4.file_size = AVATAR_BYTES.length;
hdFileBytes.set(HD_0793_IMG4_URL, AVATAR_BYTES);

// 19 minutes ago — the customer attaches a screenshot right after opening.
hdAppend(HD_0793, "user", "শুভেচ্ছা", {
  at: hd0793Ago(19),
  authorName: HD_0793_CUSTOMER,
  attachments: [
    {
      id: hd0793Img1.name,
      name: "Screenshot-1_-20261104-184603ac8be7.png",
      size: hd0793Img1.file_size,
      mime: "image/png",
      url: HD_0793_IMG1_URL,
    },
  ],
});

// 18 / 17 minutes ago — the employee's first two mails.
hdAppend(HD_0793, "support", "hello sir", {
  at: hd0793Ago(18),
  authorName: HD_0793_AGENT,
  recipients: HD_0793_EMAIL,
});

hdAppend(HD_0793, "support", "problem ki", {
  at: hd0793Ago(17),
  authorName: HD_0793_AGENT,
  recipients: HD_0793_EMAIL,
});

// 15 minutes ago — a mail that re-shares the customer's picture, then a follow-up.
hdAppend(HD_0793, "support", "শুভেচ্ছা", {
  at: hd0793Ago(15),
  authorName: HD_0793_AGENT,
  recipients: HD_0793_EMAIL,
  attachments: [
    {
      id: hd0793Img4.name,
      name: "Screenshot-4_-20261105-140926c5e72b.png",
      size: hd0793Img4.file_size,
      mime: "image/png",
      url: HD_0793_IMG4_URL,
    },
  ],
});

hdAppend(HD_0793, "support", "solve hoi nai", {
  at: hd0793Ago(15),
  authorName: HD_0793_AGENT,
  recipients: HD_0793_EMAIL,
});

// 14 minutes ago — the customer's short reply, with the emoji the desk shows.
const hd0793NaSir = hdAppend(HD_0793, "user", "na sir", {
  at: hd0793Ago(14),
  authorName: HD_0793_CUSTOMER,
});
if (hd0793NaSir) hd0793NaSir.reactions.push({ emoji: "😊", count: 1, mine: false });

// 4 minutes ago — the desk's activity line: the team was set to Support Team.
hdThreads.get(HD_0793).timeline.push({
  id: "team:0793",
  type: "status",
  at: hd0793Ago(4),
  author: "support",
  authorName: HD_0793_AGENT,
  from: "—",
  to: "Support Team",
  text: `Team → Support Team`,
  attachments: 0,
});



// 0814 — a thread where the employee answers with text *and* a picture, the
// shape the staff conversation page (/userDashboard/.../0814/conversation) and
// the customer's page must both draw in full.
const HD_0814 = "0814";
const HD_0814_CUSTOMER = "sadia";
const HD_0814_EMAIL = "sadia@example.com";
const HD_0814_AGENT_EMAIL = "agent@shikkhachat.com";
const hd0814Ago = (minutes) => new Date(Date.now() - minutes * 60000).toISOString();

const HD_0814_CUST_IMG_URL = "/private/files/screenshot-1-20261105-101500aa11bb.png";
const HD_0814_AGENT_IMG_URL = "/private/files/screenshot-2-20261105-101800cc22dd.png";

const hd0814CustImg = hdFileRow({
  name: "MOCKFILE-08141",
  url: HD_0814_CUST_IMG_URL,
  fileName: "screenshot-1-20261105-101500aa11bb.png",
  size: 0,
  owner: HD_0814_EMAIL,
});
hd0814CustImg.attached_to_doctype = "Comment";
hd0814CustImg.attached_to_name = "MOCKCOMMENT-08141";
hd0814CustImg.is_private = 1;
hd0814CustImg.file_size = AVATAR_BYTES.length;
hdFileBytes.set(HD_0814_CUST_IMG_URL, AVATAR_BYTES);

// The employee's picture is a Desk upload: private, on the agent's own row, and
// flagged agent-only — the customer's page still has to show it, streamed
// through the portal's ticket-checked file route.
const hd0814AgentImg = hdFileRow({
  name: "MOCKFILE-08142",
  url: HD_0814_AGENT_IMG_URL,
  fileName: "screenshot-2-20261105-101800cc22dd.png",
  size: 0,
  owner: HD_0814_AGENT_EMAIL,
});
hd0814AgentImg.attached_to_doctype = "Communication";
hd0814AgentImg.attached_to_name = "MOCKCOMM-08142";
hd0814AgentImg.is_private = 1;
hd0814AgentImg.agent_only = true;
hd0814AgentImg.file_size = AVATAR_BYTES.length;
hdFileBytes.set(HD_0814_AGENT_IMG_URL, AVATAR_BYTES);

hdThreads.set(HD_0814, {
  name: HD_0814,
  subject: "payment problem",
  status: "open",
  currentStatus: "Open",
  statusCategory: "Open",
  priority: "medium",
  category: "bug",
  customer: HD_0814_CUSTOMER,
  customerEmail: "client@example.com",
  customerContactEmail: HD_0814_EMAIL,
  agent: HD_0747_AGENT,
  team: "Support Team",
  submittedAt: hd0814Ago(56),
  resolvedAt: null,
  messages: [],
  timeline: [
    {
      id: "created",
      type: "created",
      at: hd0814Ago(56),
      author: "user",
      authorName: HD_0814_CUSTOMER,
      text: "payment problem\nCategory: Bug\nPreferred contact: chat",
      attachments: 0,
    },
  ],
});

// 55 minutes ago — the customer opens with a picture.
hdAppend(HD_0814, "user", "পেমেন্ট deduction হয়েছে কিন্তু কোর্সে ঢুকতে পারছি না", {
  at: hd0814Ago(55),
  authorName: HD_0814_CUSTOMER,
  attachments: [
    {
      id: hd0814CustImg.name,
      name: "screenshot-1-20261105-101500aa11bb.png",
      size: hd0814CustImg.file_size,
      mime: "image/png",
      url: HD_0814_CUST_IMG_URL,
    },
  ],
});

// 52 minutes ago — the employee's first answer.
hdAppend(HD_0814, "support", "hello sir, ki problem hoyeche?", {
  at: hd0814Ago(52),
  authorName: HD_0747_AGENT,
  recipients: HD_0814_EMAIL,
});

// 50 minutes ago — the employee answers with a picture only.
hdAppend(HD_0814, "support", "", {
  at: hd0814Ago(50),
  authorName: HD_0747_AGENT,
  recipients: HD_0814_EMAIL,
  attachments: [
    {
      id: hd0814AgentImg.name,
      name: "screenshot-2-20261105-101800cc22dd.png",
      size: hd0814AgentImg.file_size,
      mime: "image/png",
      url: HD_0814_AGENT_IMG_URL,
    },
  ],
});

// 48 minutes ago — the employee's explanation.
hdAppend(HD_0814, "support", "ei dekhen, payment ta confirm hoye geche", {
  at: hd0814Ago(48),
  authorName: HD_0747_AGENT,
  recipients: HD_0814_EMAIL,
});

// 20 minutes ago — the customer closes the loop.
hdAppend(HD_0814, "user", "ok sir, ekhon dhukte parchi", {
  at: hd0814Ago(20),
  authorName: HD_0814_CUSTOMER,
});

// 0860 — the conversation-page twin: read from
// /userDashboard/help-desk/tickets/0860/conversation (staff desk: whatever the
// employee types or attaches appears on the right, with its own timestamp) and
// /clientDashboard/help-desk/tickets/0860/conversation (the customer's copy of
// the same room, read from the customer's chair).
const HD_0860 = "0860";
const HD_0860_CUSTOMER = "farhan";
const HD_0860_EMAIL = "farhan@example.com";
const HD_0860_AGENT_EMAIL = "agent@shikkhachat.com";
const hd0860Ago = (minutes) => new Date(Date.now() - minutes * 60000).toISOString();

const HD_0860_CUST_IMG_URL = "/private/files/screenshot-1-20261105-121500aa55bb.png";
const HD_0860_AGENT_IMG_URL = "/private/files/screenshot-2-20261105-121900cc66dd.png";

const hd0860CustImg = hdFileRow({
  name: "MOCKFILE-08601",
  url: HD_0860_CUST_IMG_URL,
  fileName: "screenshot-1-20261105-121500aa55bb.png",
  size: 0,
  owner: HD_0860_EMAIL,
});
hd0860CustImg.attached_to_doctype = "Comment";
hd0860CustImg.attached_to_name = "MOCKCOMMENT-08601";
hd0860CustImg.is_private = 1;
hd0860CustImg.file_size = AVATAR_BYTES.length;
hdFileBytes.set(HD_0860_CUST_IMG_URL, AVATAR_BYTES);

const hd0860AgentImg = hdFileRow({
  name: "MOCKFILE-08602",
  url: HD_0860_AGENT_IMG_URL,
  fileName: "screenshot-2-20261105-121900cc66dd.png",
  size: 0,
  owner: HD_0860_AGENT_EMAIL,
});
hd0860AgentImg.attached_to_doctype = "Communication";
hd0860AgentImg.attached_to_name = "MOCKCOMM-08602";
hd0860AgentImg.is_private = 1;
hd0860AgentImg.agent_only = true;
hd0860AgentImg.file_size = AVATAR_BYTES.length;
hdFileBytes.set(HD_0860_AGENT_IMG_URL, AVATAR_BYTES);

hdThreads.set(HD_0860, {
  name: HD_0860,
  subject: "class link problem",
  status: "open",
  currentStatus: "Open",
  statusCategory: "Open",
  priority: "medium",
  category: "bug",
  customer: HD_0860_CUSTOMER,
  customerEmail: "client@example.com",
  customerContactEmail: HD_0860_EMAIL,
  agent: HD_0747_AGENT,
  team: "Support Team",
  submittedAt: hd0860Ago(40),
  resolvedAt: null,
  messages: [],
  timeline: [
    {
      id: "created",
      type: "created",
      at: hd0860Ago(40),
      author: "user",
      authorName: HD_0860_CUSTOMER,
      text: "class link problem\nCategory: Bug\nPreferred contact: chat",
      attachments: 0,
    },
  ],
});

// 39 minutes ago — the customer opens with text + picture.
hdAppend(HD_0860, "user", "class er link kaj korche na", {
  at: hd0860Ago(39),
  authorName: HD_0860_CUSTOMER,
  attachments: [
    {
      id: hd0860CustImg.name,
      name: "screenshot-1-20261105-121500aa55bb.png",
      size: hd0860CustImg.file_size,
      mime: "image/png",
      url: HD_0860_CUST_IMG_URL,
    },
  ],
});

// 36 minutes ago — an employee answer.
hdAppend(HD_0860, "support", "hello sir, link ta abar pathachhi", {
  at: hd0860Ago(36),
  authorName: HD_0747_AGENT,
  recipients: HD_0860_EMAIL,
});

// 34 minutes ago — an employee answer with a picture only.
hdAppend(HD_0860, "support", "", {
  at: hd0860Ago(34),
  authorName: HD_0747_AGENT,
  recipients: HD_0860_EMAIL,
  attachments: [
    {
      id: hd0860AgentImg.name,
      name: "screenshot-2-20261105-121900cc66dd.png",
      size: hd0860AgentImg.file_size,
      mime: "image/png",
      url: HD_0860_AGENT_IMG_URL,
    },
  ],
});

// 8 minutes ago — the customer confirms.
hdAppend(HD_0860, "user", "ekhon kaj korche, dhonnobad", {
  at: hd0860Ago(8),
  authorName: HD_0860_CUSTOMER,
});

// 0922 — the client detail page reads /clientDashboard/help-desk/tickets/0922:
// the শিক্ষা চ্যাট সাপোর্ট thread must place every গ্রাহকের বার্তা on the right
// and every সাপোর্ট টিম reply on the left, exactly as the audit trail below
// attributes them.
const HD_0922 = "0922";
const HD_0922_CUSTOMER = "tajul23";
const HD_0922_EMAIL = "tajul789@gmail.com";
const hd0922Ago = (minutes) => new Date(Date.now() - minutes * 60000).toISOString();

const HD_0922_CUST_IMG_URL = "/private/files/recording-0922-20261108-101500bb11cc.png";
const HD_0922_AGENT_IMG_URL = "/private/files/answer-0922-20261108-103100dd22ee.png";

const hd0922CustImg = hdFileRow({
  name: "MOCKFILE-09221",
  url: HD_0922_CUST_IMG_URL,
  fileName: "recording-0922-20261108-101500bb11cc.png",
  size: 0,
  owner: HD_0922_EMAIL,
});
hd0922CustImg.attached_to_doctype = "Comment";
hd0922CustImg.attached_to_name = "MOCKCOMMENT-09221";
hd0922CustImg.is_private = 1;
hd0922CustImg.file_size = AVATAR_BYTES.length;
hdFileBytes.set(HD_0922_CUST_IMG_URL, AVATAR_BYTES);

const hd0922AgentImg = hdFileRow({
  name: "MOCKFILE-09222",
  url: HD_0922_AGENT_IMG_URL,
  fileName: "answer-0922-20261108-103100dd22ee.png",
  size: 0,
  owner: HD_0747_AGENT,
});
hd0922AgentImg.attached_to_doctype = "Communication";
hd0922AgentImg.attached_to_name = "MOCKCOMM-09222";
hd0922AgentImg.is_private = 1;
hd0922AgentImg.file_size = AVATAR_BYTES.length;
hdFileBytes.set(HD_0922_AGENT_IMG_URL, AVATAR_BYTES);

hdThreads.set(HD_0922, {
  name: HD_0922,
  hideSupportFromMessages: true,
  stripReplyTimestamps: true,
  subject: "PROBLEM0922",
  status: "open",
  currentStatus: "Open",
  statusCategory: "Open",
  priority: "medium",
  category: "bug",
  customer: HD_0922_CUSTOMER,
  customerEmail: "client@example.com",
  customerContactEmail: HD_0922_EMAIL,
  agent: HD_0747_AGENT,
  team: "Support Team",
  submittedAt: hd0922Ago(30),
  resolvedAt: null,
  messages: [],
  timeline: [
    {
      id: "created",
      type: "created",
      at: hd0922Ago(30),
      author: "user",
      authorName: HD_0922_CUSTOMER,
      text: "PROBLEM0922\nCategory: Bug\nPreferred contact: chat",
      attachments: 0,
    },
  ],
});

// 29 minutes ago — the customer opens the problem.
hdAppend(HD_0922, "user", "class er recording load hocche na", {
  at: hd0922Ago(29),
  authorName: HD_0922_CUSTOMER,
});

// 26 minutes ago — an employee answer.
hdAppend(HD_0922, "support", "hello sir, browser cache clear kore abar chesta korun", {
  at: hd0922Ago(26),
  authorName: HD_0747_AGENT,
  recipients: HD_0922_EMAIL,
});

// 24 minutes ago — the customer replies and shows the screen.
hdAppend(HD_0922, "user", "cache clear korlam, tao hocche na", {
  at: hd0922Ago(24),
  authorName: HD_0922_CUSTOMER,
  attachments: [
    {
      id: hd0922CustImg.name,
      name: "recording-0922-20261108-101500bb11cc.png",
      size: hd0922CustImg.file_size,
      mime: "image/png",
      url: HD_0922_CUST_IMG_URL,
    },
  ],
});

// 20 minutes ago — the employee closes the loop with a picture.
hdAppend(HD_0922, "support", "apnar account e recording enable kore diyechi, ekhon dekhte paren", {
  at: hd0922Ago(20),
  authorName: HD_0747_AGENT,
  recipients: HD_0922_EMAIL,
  attachments: [
    {
      id: hd0922AgentImg.name,
      name: "answer-0922-20261108-103100dd22ee.png",
      size: hd0922AgentImg.file_size,
      mime: "image/png",
      url: HD_0922_AGENT_IMG_URL,
    },
  ],
});

// 0932 — every reply on this ticket was filed by the desk as the Support Team's
// own (MD Shahzalal Amin Surker): the client payload carries them in the
// timeline only, never in `messages`. Read from /clientDashboard/help-desk/
// tickets/0932: শিক্ষা চ্যাট সাপোর্ট must still list the whole thread — the
// customer's words on the right, the Support Team's words and files on the
// left, oldest first.
const HD_0932 = "0932";
const HD_0932_CUSTOMER = "tajul23";
const HD_0932_EMAIL = "tajul789@gmail.com";
const HD_0932_AGENT = "MD Shahzalal Amin Surker";
const hd0932Ago = (minutes) => new Date(Date.now() - minutes * 60000).toISOString();

const HD_0932_CUST_IMG_URL = "/private/files/screen-0932-20261108-1210001a2b3c.png";
const HD_0932_AGENT_IMG_URL = "/private/files/reply-0932-20261108-1225004d5e6f.png";

const hd0932CustImg = hdFileRow({
  name: "MOCKFILE-09321",
  url: HD_0932_CUST_IMG_URL,
  fileName: "screen-0932-20261108-1210001a2b3c.png",
  owner: HD_0932_EMAIL,
});
hd0932CustImg.attached_to_doctype = "Comment";
hd0932CustImg.attached_to_name = "MOCKCOMMENT-09321";
hd0932CustImg.is_private = 1;
hd0932CustImg.file_size = AVATAR_BYTES.length;
hdFileBytes.set(HD_0932_CUST_IMG_URL, AVATAR_BYTES);

const hd0932AgentImg = hdFileRow({
  name: "MOCKFILE-09322",
  url: HD_0932_AGENT_IMG_URL,
  fileName: "reply-0932-20261108-1225004d5e6f.png",
  owner: HD_0747_AGENT,
});
hd0932AgentImg.attached_to_doctype = "Communication";
hd0932AgentImg.attached_to_name = "MOCKCOMM-09322";
hd0932AgentImg.is_private = 1;
hd0932AgentImg.file_size = AVATAR_BYTES.length;
hdFileBytes.set(HD_0932_AGENT_IMG_URL, AVATAR_BYTES);

hdThreads.set(HD_0932, {
  name: HD_0932,
  // Dev-only: the ERP can file the desk's rows into the trail without their own
  // `at` while the message row still knows its creation. The trail must then show
  // the real filing date and time by borrowing that stamp — never a bare "—".
  blankSupportTrailTimes: true,
  subject: "PROBLEM0932",
  status: "open",
  currentStatus: "Open",
  statusCategory: "Open",
  priority: "medium",
  category: "bug",
  customer: HD_0932_CUSTOMER,
  customerEmail: "client@example.com",
  customerContactEmail: HD_0932_EMAIL,
  agent: HD_0932_AGENT,
  team: "Support Team",
  submittedAt: hd0932Ago(45),
  resolvedAt: null,
  messages: [],
  timeline: [
    {
      id: "created",
      type: "created",
      at: hd0932Ago(45),
      author: "user",
      authorName: HD_0932_CUSTOMER,
      text: "PROBLEM0932\nCategory: Bug\nPreferred contact: chat",
      attachments: 0,
    },
  ],
});

// 43 minutes ago — the customer describes the problem and shows the screen.
hdAppend(HD_0932, "user", "result sheet e mark dekhacche na", {
  at: hd0932Ago(43),
  authorName: HD_0932_CUSTOMER,
  attachments: [
    {
      id: hd0932CustImg.name,
      name: "screen-0932-20261108-1210001a2b3c.png",
      size: hd0932CustImg.file_size,
      mime: "image/png",
      url: HD_0932_CUST_IMG_URL,
    },
  ],
});

// 40 minutes ago — Support Team answer, filed in the timeline only.
hdAppend(HD_0932, "support", "assalamu alaikum, apnar result sheet er access check korchi", {
  at: hd0932Ago(40),
  authorName: HD_0932_AGENT,
  recipients: HD_0932_EMAIL,
});

// 35 minutes ago — Support Team follows up with the corrected sheet.
hdAppend(HD_0932, "support", "access deya hoyeche, ekhon result dekha jabe", {
  at: hd0932Ago(35),
  authorName: HD_0932_AGENT,
  recipients: HD_0932_EMAIL,
  attachments: [
    {
      id: hd0932AgentImg.name,
      name: "reply-0932-20261108-1225004d5e6f.png",
      size: hd0932AgentImg.file_size,
      mime: "image/png",
      url: HD_0932_AGENT_IMG_URL,
    },
  ],
});

// 0949 — the ticket that printed the two halves of its trail unevenly: every
// customer row carried a date and a time, every Support row (and the desk's own
// duplicate rows) drew a bare "—", on both the client and the staff side. The
// cause is naming, not time: this payload stamps its rows the way the desk's
// activity feed does — `timestamp` — and nothing carries `at`. Any reader that
// asked for one field name went blind on the other author side.
const HD_0949 = "0949";
const HD_0949_CUSTOMER = "tajul23";
const HD_0949_EMAIL = "tajul789@gmail.com";
const HD_0949_AGENT = "MD Shahzalal Amin Surker";
const hd0949Ago = (minutes, seconds = 0) =>
  new Date(Date.now() - minutes * 60000 - seconds * 1000).toISOString();

const HD_0949_IMG_URL = "/files/Screenshot-_22_-20261105-1451352cedd1.png";
const hd0949Img = hdFileRow({
  name: "MOCKFILE-09491",
  url: HD_0949_IMG_URL,
  fileName: "Screenshot-_22_-20261105-1451352cedd1.png",
  owner: HD_0949_EMAIL,
});
hd0949Img.attached_to_doctype = "Communication";
hd0949Img.attached_to_name = "MOCKCOMM-09491";
hd0949Img.is_private = 0;
hd0949Img.file_size = AVATAR_BYTES.length;
hdFileBytes.set(HD_0949_IMG_URL, AVATAR_BYTES);

hdThreads.set(HD_0949, {
  name: HD_0949,
  subject: "pppppppppppppppppppppppp",
  status: "open",
  currentStatus: "Open",
  statusCategory: "Open",
  priority: "medium",
  category: "incident",
  customer: HD_0949_CUSTOMER,
  customerEmail: "client@example.com",
  customerContactEmail: HD_0949_EMAIL,
  agent: HD_0949_AGENT,
  team: "Support Team",
  submittedAt: hd0949Ago(5 * 60),
  resolvedAt: null,
  messages: [],
  // The desk's rows, stamped only under `timestamp` — never `at`.
  timeline: [
    {
      id: "created",
      type: "created",
      timestamp: hd0949Ago(5 * 60),
      author: "user",
      authorName: HD_0949_CUSTOMER,
      text: "pppppppppppppppppppppppp",
      attachments: 0,
    },
    {
      id: "HDMSG-0949-share",
      type: "message",
      timestamp: hd0949Ago(5 * 60, -5),
      author: "user",
      authorName: HD_0949_CUSTOMER,
      text: "শেয়ার — Screenshot-_22_-20261105-1451352cedd1.png",
      attachments: 0,
    },
    {
      id: "HDMSG-0949-hello",
      type: "message",
      timestamp: hd0949Ago(4 * 60),
      author: "user",
      authorName: HD_0949_CUSTOMER,
      text: "hello cus1",
      attachments: 0,
    },
    {
      id: "HDMSG-0949-desc",
      type: "requirement",
      timestamp: hd0949Ago(5 * 60),
      author: "user",
      authorName: HD_0949_CUSTOMER,
      text: "pppppppppppppppppppppppp\nCategory: Incident\nDepartment: Support Team\nPreferred contact: mobile\nRelated page: https:localhost3000",
      attachments: 0,
    },
    {
      id: "HDMSG-0949-stub",
      type: "requirement",
      timestamp: hd0949Ago(5 * 60, -5),
      author: "user",
      authorName: HD_0949_CUSTOMER,
      text: "সংযুক্তি — Screenshot-_22_-20261105-1451352cedd1.png",
      attachments: 0,
    },
    {
      id: "HDMSG-0949-em1",
      type: "message",
      timestamp: hd0949Ago(3 * 60),
      author: "support",
      authorName: HD_0949_AGENT,
      text: "hi em1",
      recipients: HD_0949_EMAIL,
      attachments: 0,
    },
    {
      id: "HDMSG-0949-em2",
      type: "message",
      timestamp: hd0949Ago(2 * 60),
      author: "support",
      authorName: HD_0949_AGENT,
      text: "helo em2",
      recipients: HD_0949_EMAIL,
      attachments: 0,
    },
  ],
});

const hd0949CustShare = hdAppend(HD_0949, "user", "শেয়ার — Screenshot-_22_-20261105-1451352cedd1.png", {
  at: hd0949Ago(5 * 60, -5),
  authorName: HD_0949_CUSTOMER,
  attachments: [
    {
      id: hd0949Img.name,
      name: "Screenshot-_22_-20261105-1451352cedd1.png",
      size: hd0949Img.file_size,
      mime: "image/png",
      url: HD_0949_IMG_URL,
    },
  ],
});
const hd0949CustHello = hdAppend(HD_0949, "user", "hello cus1", {
  at: hd0949Ago(4 * 60),
  authorName: HD_0949_CUSTOMER,
});
const hd0949CustDesc = hdAppend(
  HD_0949,
  "user",
  "pppppppppppppppppppppppp\nCategory: Incident\nDepartment: Support Team\nPreferred contact: mobile\nRelated page: https:localhost3000",
  { at: hd0949Ago(5 * 60), authorName: HD_0949_CUSTOMER }
);
const hd0949CustStub = hdAppend(HD_0949, "user", "সংযুক্তি — Screenshot-_22_-20261105-1451352cedd1.png", {
  at: hd0949Ago(5 * 60, -5),
  authorName: HD_0949_CUSTOMER,
});
const hd0949Em1 = hdAppend(HD_0949, "support", "hi em1", {
  at: hd0949Ago(3 * 60),
  authorName: HD_0949_AGENT,
  recipients: HD_0949_EMAIL,
});
const hd0949Em2 = hdAppend(HD_0949, "support", "helo em2", {
  at: hd0949Ago(2 * 60),
  authorName: HD_0949_AGENT,
  recipients: HD_0949_EMAIL,
});
// Rename the message ids to match the trail rows, and swap `createdAt` for the
// desk's `timestamp` — a row whose time is filed under the other name.
for (const [row, id] of [
  [hd0949CustShare, "HDMSG-0949-share"],
  [hd0949CustHello, "HDMSG-0949-hello"],
  [hd0949CustDesc, "HDMSG-0949-desc"],
  [hd0949CustStub, "HDMSG-0949-stub"],
  [hd0949Em1, "HDMSG-0949-em1"],
  [hd0949Em2, "HDMSG-0949-em2"],
]) {
  row.timestamp = row.createdAt;
  row.createdAt = "";
  row.id = id;
}

// 0975 — the live shape behind "the chat card's left side is empty while the
// timeline lists সাপোর্ট টিম rows". The error log caught it: three message rows
// arrived as `{id: "", rawStamp: ""}` — no id under any name, no clock under any
// name — and the employee's replies lived only in `timeline` (the customer's
// channel cannot read them). A chat that asked "is this id already in the room"
// put a blank into its id set, so every equally-blank trail row read as already
// drawn: the left side of শিক্ষা চ্যাট সাপোর্ট stayed customer-only while
// সম্পূর্ণ কথোপকথন টাইমলাইন listed the team's answers.
const HD_0975 = "0975";
const HD_0975_CUSTOMER = "tajul23";
const HD_0975_AGENT = "MD Shahzalal Amin Surker";
const hd0975Ago = (minutes) => new Date(Date.now() - minutes * 60000).toISOString();

hdThreads.set(HD_0975, {
  name: HD_0975,
  subject: "ক্লাস নাইনের রেজাল্ট খোলা যাচ্ছে না",
  status: "open",
  currentStatus: "Open",
  statusCategory: "Open",
  priority: "medium",
  category: "technical",
  customer: HD_0975_CUSTOMER,
  customerEmail: "client@example.com",
  customerContactEmail: "tajul789@gmail.com",
  agent: HD_0975_AGENT,
  team: "Support Team",
  submittedAt: hd0975Ago(3 * 60),
  resolvedAt: null,
  messages: [],
  // The employee's half, filed only in the trail — and with no id and no clock,
  // exactly as the three rows the error log captured on the live ticket.
  timeline: [
    {
      id: "",
      type: "requirement",
      at: "",
      author: "support",
      authorName: HD_0975_AGENT,
      text: "রেজাল্ট পেজটি আমরা দেখছি, ইনভয়েস নম্বরটি দেবেন?",
      attachments: 0,
    },
    {
      id: "",
      type: "resolution",
      at: "",
      author: "support",
      authorName: HD_0975_AGENT,
      text: "সমস্যাটি ঠিক করা হয়েছে — এখন আবার লগইন করে দেখুন।",
      attachments: 0,
    },
  ],
});

const hd0975C1 = hdAppend(HD_0975, "user", "ক্লাস নাইনের রেজাল্ট খুললে সাদা পেজ আসে।", {
  at: hd0975Ago(3 * 60),
  authorName: HD_0975_CUSTOMER,
});
const hd0975C2 = hdAppend(HD_0975, "user", "তিন দিন ধরে একই সমস্যা।", {
  at: hd0975Ago(2 * 60),
  authorName: HD_0975_CUSTOMER,
});
const hd0975C3 = hdAppend(HD_0975, "user", "প্লিজ দ্রুত দেখুন।", {
  at: hd0975Ago(60),
  authorName: HD_0975_CUSTOMER,
});
// The live shape: no id under any name, no clock under any name.
for (const row of [hd0975C1, hd0975C2, hd0975C3]) {
  row.id = "";
  row.createdAt = "";
}

// 0937 — the ticket read at /clientDashboard/help-desk/tickets/0937. The desk's
// own activity feed (Frappe Helpdesk, `message.activities[]`) is in true time
// order; the portal payload is NOT — the mock hands the rows over grouped by
// channel, exactly as a stale concatenation would, so the frontend must put the
// serial back: customer, customer, Support, customer, Support, customer's
// picture beside the words it was sent with, and so on. Set
// `localStorage.hdDebug = "1"` to see every fetched row and its stamp.
const HD_0937 = "0937";
const HD_0937_CUSTOMER = "tajul23";
const HD_0937_EMAIL = "tajul789@gmail.com";
const HD_0937_AGENT = "MD Shahzalal Amin Surker";
const hd0937Ago = (minutes, seconds = 0) =>
  new Date(Date.now() - minutes * 60000 - seconds * 1000).toISOString();

const HD_0937_IMG_URL = "/files/Screenshot-_17_-20261105-153500ed5085.png";
const hd0937Img = hdFileRow({
  name: "MOCKFILE-09371",
  url: HD_0937_IMG_URL,
  fileName: "Screenshot-_17_-20261105-153500ed5085.png",
  owner: HD_0937_EMAIL,
});
hd0937Img.attached_to_doctype = "Communication";
hd0937Img.attached_to_name = "MOCKCOMM-09371";
hd0937Img.is_private = 0;
hd0937Img.file_size = AVATAR_BYTES.length;
hdFileBytes.set(HD_0937_IMG_URL, AVATAR_BYTES);

hdThreads.set(HD_0937, {
  name: HD_0937,
  subject: "problem900000000",
  status: "open",
  currentStatus: "Open",
  statusCategory: "Open",
  priority: "medium",
  category: "incident",
  customer: HD_0937_CUSTOMER,
  customerEmail: "client@example.com",
  customerContactEmail: HD_0937_EMAIL,
  agent: HD_0937_AGENT,
  team: "Support Team",
  submittedAt: hd0937Ago(52),
  resolvedAt: null,
  messages: [],
  timeline: [
    {
      id: "created",
      type: "created",
      at: hd0937Ago(52),
      author: "user",
      authorName: HD_0937_CUSTOMER,
      text: "problem900000000\nCategory: Incident\nDepartment: Support Team\nPreferred contact: mobile",
      attachments: 0,
    },
  ],
});

// The desk's activity feed, in real order (see the payload quoted in the ticket):
//   1–2  the customer writes twice            (-49m, -47m)
//   3    Support answers                      (-40m)
//   4    the customer sends words + a picture (-35m, the picture 3 s later)
//   5–6  Support answers twice                (-30m, -25m)
// The array below is filled channel-blocked on purpose: customer rows first,
// then Support rows — the mock's stand-in for the out-of-series payload.
const hd0937Seeds = {
  custOne: () => hdAppend(HD_0937, "user", "problem900000000 llllllllllllllllllllllllllllllllllllllll", {
    at: hd0937Ago(49),
    authorName: HD_0937_CUSTOMER,
  }),
  custTwo: () => hdAppend(HD_0937, "user", "ekhon amar result sheet e mark dekhacche na", {
    at: hd0937Ago(47),
    authorName: HD_0937_CUSTOMER,
  }),
  custWords: () => hdAppend(HD_0937, "user", "ei screenshot e problem ta dekhun", {
    at: hd0937Ago(35),
    authorName: HD_0937_CUSTOMER,
  }),
  custPicture: () =>
    hdAppend(HD_0937, "user", "সংযুক্তি — Screenshot-_17_-20261105-153500ed5085.png", {
      at: hd0937Ago(35, -3), // three seconds after the words
      authorName: HD_0937_CUSTOMER,
      attachments: [
        {
          id: hd0937Img.name,
          name: "Screenshot-_17_-20261105-153500ed5085.png",
          size: hd0937Img.file_size,
          mime: "image/png",
          url: HD_0937_IMG_URL,
        },
      ],
    }),
  supportOne: () =>
    hdAppend(HD_0937, "support", "assalamu alaikum, apnar problem ta dekhchi", {
      at: hd0937Ago(40),
      authorName: HD_0937_AGENT,
      recipients: HD_0937_EMAIL,
    }),
  supportTwo: () =>
    hdAppend(HD_0937, "support", "mark er issue ta fix kora hoyeche, ekhon check korun", {
      at: hd0937Ago(30),
      authorName: HD_0937_AGENT,
      recipients: HD_0937_EMAIL,
    }),
  supportThree: () =>
    hdAppend(HD_0937, "support", "aro kono problem hole janan", {
      at: hd0937Ago(25),
      authorName: HD_0937_AGENT,
      recipients: HD_0937_EMAIL,
    }),
};
// Channel-blocked arrival order: every customer row, then every Support row.
hd0937Seeds.custOne();
hd0937Seeds.custTwo();
hd0937Seeds.custWords();
hd0937Seeds.custPicture();
hd0937Seeds.supportOne();
hd0937Seeds.supportTwo();
hd0937Seeds.supportThree();

// 0850 — the detail-page twin of 0814: a customer opens with text + picture,
// the employee answers with text and a picture, the customer replies. Read from
// /userDashboard/help-desk/tickets/0850 (staff detail: own text and files on
// the right) and /clientDashboard/help-desk/tickets/0850 (the শিক্ষা চ্যাট
// সাপোর্ট thread below: every employee reply on the left).
const HD_0850 = "0850";
const HD_0850_CUSTOMER = "mim";
const HD_0850_EMAIL = "mim@example.com";
const HD_0850_AGENT_EMAIL = "agent@shikkhachat.com";
const hd0850Ago = (minutes) => new Date(Date.now() - minutes * 60000).toISOString();

const HD_0850_CUST_IMG_URL = "/private/files/screenshot-1-20261105-113000dd33ee.png";
const HD_0850_AGENT_IMG_URL = "/private/files/screenshot-2-20261105-113400ff44aa.png";

const hd0850CustImg = hdFileRow({
  name: "MOCKFILE-08501",
  url: HD_0850_CUST_IMG_URL,
  fileName: "screenshot-1-20261105-113000dd33ee.png",
  size: 0,
  owner: HD_0850_EMAIL,
});
hd0850CustImg.attached_to_doctype = "Comment";
hd0850CustImg.attached_to_name = "MOCKCOMMENT-08501";
hd0850CustImg.is_private = 1;
hd0850CustImg.file_size = AVATAR_BYTES.length;
hdFileBytes.set(HD_0850_CUST_IMG_URL, AVATAR_BYTES);

const hd0850AgentImg = hdFileRow({
  name: "MOCKFILE-08502",
  url: HD_0850_AGENT_IMG_URL,
  fileName: "screenshot-2-20261105-113400ff44aa.png",
  size: 0,
  owner: HD_0850_AGENT_EMAIL,
});
hd0850AgentImg.attached_to_doctype = "Communication";
hd0850AgentImg.attached_to_name = "MOCKCOMM-08502";
hd0850AgentImg.is_private = 1;
hd0850AgentImg.agent_only = true;
hd0850AgentImg.file_size = AVATAR_BYTES.length;
hdFileBytes.set(HD_0850_AGENT_IMG_URL, AVATAR_BYTES);

hdThreads.set(HD_0850, {
  name: HD_0850,
  subject: "course fee problem",
  status: "open",
  currentStatus: "Open",
  statusCategory: "Open",
  priority: "medium",
  category: "bug",
  customer: HD_0850_CUSTOMER,
  customerEmail: "client@example.com",
  customerContactEmail: HD_0850_EMAIL,
  agent: HD_0747_AGENT,
  team: "Support Team",
  submittedAt: hd0850Ago(45),
  resolvedAt: null,
  messages: [],
  timeline: [
    {
      id: "created",
      type: "created",
      at: hd0850Ago(45),
      author: "user",
      authorName: HD_0850_CUSTOMER,
      text: "course fee problem\nCategory: Bug\nPreferred contact: chat",
      attachments: 0,
    },
  ],
});

// 44 minutes ago — the customer opens with a picture.
hdAppend(HD_0850, "user", "কোর্স ফি কেটে নিয়েছে কিন্তু ক্লাস শুরু হয়নি", {
  at: hd0850Ago(44),
  authorName: HD_0850_CUSTOMER,
  attachments: [
    {
      id: hd0850CustImg.name,
      name: "screenshot-1-20261105-113000dd33ee.png",
      size: hd0850CustImg.file_size,
      mime: "image/png",
      url: HD_0850_CUST_IMG_URL,
    },
  ],
});

// 41 minutes ago — the employee's first answer.
hdAppend(HD_0850, "support", "hello sir, payment ta dekhe janachhi", {
  at: hd0850Ago(41),
  authorName: HD_0747_AGENT,
  recipients: HD_0850_EMAIL,
});

// 39 minutes ago — the employee answers with a picture only.
hdAppend(HD_0850, "support", "", {
  at: hd0850Ago(39),
  authorName: HD_0747_AGENT,
  recipients: HD_0850_EMAIL,
  attachments: [
    {
      id: hd0850AgentImg.name,
      name: "screenshot-2-20261105-113400ff44aa.png",
      size: hd0850AgentImg.file_size,
      mime: "image/png",
      url: HD_0850_AGENT_IMG_URL,
    },
  ],
});

// 37 minutes ago — the employee's explanation.
hdAppend(HD_0850, "support", "payment confirm hoye geche, class link pathiye diyechi", {
  at: hd0850Ago(37),
  authorName: HD_0747_AGENT,
  recipients: HD_0850_EMAIL,
});

// 12 minutes ago — the customer closes the loop.
hdAppend(HD_0850, "user", "ok sir, link peyechi", {
  at: hd0850Ago(12),
  authorName: HD_0850_CUSTOMER,
});

// 0807 — a portal ticket read from the staff desk's own conversation route
// (/userDashboard/help-desk/tickets/0807/conversation).
const HD_0807 = "0807";
const HD_0807_CUSTOMER = "rakib";
const HD_0807_EMAIL = "rakib@example.com";
const hd0807Ago = (minutes) => new Date(Date.now() - minutes * 60000).toISOString();

hdThreads.set(HD_0807, {
  name: HD_0807,
  subject: "login problem",
  status: "open",
  currentStatus: "Open",
  statusCategory: "Open",
  priority: "medium",
  category: "bug",
  customer: HD_0807_CUSTOMER,
  customerEmail: "client@example.com",
  customerContactEmail: HD_0807_EMAIL,
  agent: HD_0747_AGENT,
  team: "Support Team",
  submittedAt: hd0807Ago(42),
  resolvedAt: null,
  messages: [],
  timeline: [
    {
      id: "created",
      type: "created",
      at: hd0807Ago(42),
      author: "user",
      authorName: HD_0807_CUSTOMER,
      text: "login problem\nCategory: Bug\nPreferred contact: chat",
      attachments: 0,
    },
  ],
});

hdAppend(HD_0807, "user", "আমার অ্যাকাউন্টে লগইন হচ্ছে না", {
  at: hd0807Ago(41),
  authorName: HD_0807_CUSTOMER,
});

hdAppend(HD_0807, "support", "একটু অপেক্ষা করুন, দেখছি", {
  at: hd0807Ago(39),
  authorName: HD_0747_AGENT,
  recipients: HD_0807_EMAIL,
});

hdAppend(HD_0807, "user", "ধন্যবাদ, এখন ঠিক আছে", {
  at: hd0807Ago(12),
  authorName: HD_0807_CUSTOMER,
});

// handed over at all (neither the storage path nor the ticket streamer). The
// portal must say so in the console and in Desk -> Error Log, and show a clear
// "cannot be loaded" frame instead of a torn thumbnail.
const HD_0663 = "0663";
const HD_0663_IMAGE_URL = "/private/files/hd-0663-unreadable.png";
hdThreads.set(HD_0663, {
  name: HD_0663,
  subject: "ছবি লোড হচ্ছে না",
  status: "open",
  currentStatus: "Open",
  statusCategory: "Open",
  priority: "medium",
  category: "technical",
  customer: "Tajul Islam",
  customerEmail: "client@example.com",
  agent: HD_0658_AGENT,
  submittedAt: "2026-11-02T13:00:00.000Z",
  resolvedAt: null,
  messages: [],
  timeline: [],
});
const hd0663Image = hdFileRow({
  name: "MOCKFILE-06631",
  url: HD_0663_IMAGE_URL,
  fileName: "Screenshot-_20_1a2b3c.png",
  size: 0,
  owner: "agent@shikkhachat.com",
});
hd0663Image.attached_to_doctype = "Comment";
hd0663Image.attached_to_name = "MOCKCOMMENT-06631";
hd0663Image.is_private = 1;
hd0663Image.agent_only = true;
hd0663Image.unreadable = true;
hdFileBytes.set(HD_0663_IMAGE_URL, HD_0658_IMAGE_BYTES);
hd0663Image.file_size = HD_0658_IMAGE_BYTES.length;
hdAppend(HD_0663, "support", "", {
  at: "2026-11-02T13:05:00.000Z",
  authorName: HD_0658_AGENT,
  attachments: [
    {
      id: hd0663Image.name,
      name: "Screenshot-_20_1a2b3c.png",
      size: hd0663Image.file_size,
      mime: "image/png",
      url: HD_0663_IMAGE_URL,
    },
  ],
});

// 0668 — the live shape behind "upload the image issue": the customer's own
// screenshot paints, the employee's reply screenshot is on a row whose *direct*
// URL answers 200 with a page (the desk login), which is exactly what an <img>
// reports as "the bytes did not decode as an image". Only the ticket-scoped
// streamer can hand the real bytes over, so this fixture is the standing proof
// that the portal sniffs, refuses the page and falls back instead of painting
// garbage. Its Activity list also carries both files, so the trail can show and
// open them like the desk does.
const HD_0668 = "0668";
const HD_0668_USER_URL = "/private/files/Screenshot-_21_9f8e7d.png";
const HD_0668_STAFF_URL = "/private/files/Screenshot-_22_5c4b3a.png";
const HD_0668_GARBAGE_URL = "/private/files/hd-0668-not-a-picture.png";
hdThreads.set(HD_0668, {
  name: HD_0668,
  subject: "ছবি আপলোড সমস্যা",
  status: "open",
  currentStatus: "Open",
  statusCategory: "Open",
  priority: "medium",
  category: "technical",
  customer: "Tajul Islam",
  customerEmail: "client@example.com",
  agent: HD_0658_AGENT,
  submittedAt: "2026-11-03T09:00:00.000Z",
  resolvedAt: null,
  messages: [],
  timeline: [],
});

// The customer's own upload: readable directly.
const hd0668UserImage = hdFileRow({
  name: "MOCKFILE-06681",
  url: HD_0668_USER_URL,
  fileName: "Screenshot-_21_9f8e7d.png",
  size: 0,
  owner: "client@example.com",
});
hd0668UserImage.attached_to_doctype = "Comment";
hd0668UserImage.attached_to_name = "MOCKCOMMENT-06681";
hd0668UserImage.is_private = 1;
hdFileBytes.set(HD_0668_USER_URL, HD_0658_IMAGE_BYTES);
hd0668UserImage.file_size = HD_0658_IMAGE_BYTES.length;

// The employee's reply upload: agent-side, and its stored URL answers a *page*
// with status 200. `stream_file` serves the real bytes (the live row has no
// attach target and is reached through the ticket that mentions it).
const hd0668StaffImage = hdFileRow({
  name: "MOCKFILE-06682",
  url: HD_0668_STAFF_URL,
  fileName: "Screenshot-_22_5c4b3a.png",
  size: 0,
  owner: "agent@shikkhachat.com",
});
hd0668StaffImage.attached_to_doctype = "";
hd0668StaffImage.attached_to_name = "";
hd0668StaffImage.is_private = 1;
hd0668StaffImage.agent_only = true;
hd0668StaffImage.decoy_html = true;
hd0668StaffImage.ticket_scoped = HD_0668;
hdFileBytes.set(HD_0668_STAFF_URL, HD_0658_IMAGE_BYTES);
hd0668StaffImage.file_size = HD_0658_IMAGE_BYTES.length;

// A row neither path can serve as a picture (both answer a page). Referenced by
// no message: the 0668 harness requests it directly to prove the proxy answers a
// typed error instead of streaming garbage.
const hd0668Garbage = hdFileRow({
  name: "MOCKFILE-06683",
  url: HD_0668_GARBAGE_URL,
  fileName: "hd-0668-not-a-picture.png",
  size: 0,
  owner: "agent@shikkhachat.com",
});
hd0668Garbage.is_private = 1;
hd0668Garbage.agent_only = true;
hd0668Garbage.decoy_html = true;
hd0668Garbage.only_garbage = true;

hdAppend(HD_0668, "user", "আমার স্ক্রিনশট দেখুন", {
  at: "2026-11-03T09:00:00.000Z",
  authorName: "Tajul Islam",
  attachments: [
    {
      id: hd0668UserImage.name,
      name: "Screenshot-_21_9f8e7d.png",
      size: hd0668UserImage.file_size,
      mime: "image/png",
      url: HD_0668_USER_URL,
    },
  ],
});
hdAppend(HD_0668, "support", "সমাধানটির স্ক্রিনশট দিন", {
  at: "2026-11-03T09:10:00.000Z",
  authorName: HD_0658_AGENT,
  attachments: [
    {
      id: hd0668StaffImage.name,
      name: "Screenshot-_22_5c4b3a.png",
      size: hd0668StaffImage.file_size,
      mime: "image/png",
      url: HD_0668_STAFF_URL,
    },
  ],
});

// Every seeded thread's pristine rows, keyed by ticket name. A harness resets to
// this between runs so repeated pushes cannot pile up duplicate rows in one
// long-lived mock process.
const HD_SEED_ALL = new Map(
  [...hdThreads.values()].map((thread) => [thread.name, thread.messages.map((message) => ({ ...message }))]),
);

const server = createServer(async (request, response) => {
  const url = new URL(request.url ?? "/", `http://127.0.0.1:${PORT}`);
  const method = url.pathname.replace(/^\/api\/method\//, "");

  // Test-only view of the mocked `File` doctype: lets the Playwright/API suites
  // assert the attachment mapping (attached_to_doctype / attached_to_name)
  // without a live ERP.
  if (url.pathname === "/__mock/client-log") {
    response.writeHead(200, { "content-type": "application/json", "cache-control": "no-store" });
    response.end(JSON.stringify({ entries: clientLogEntries }));
    return;
  }

  if (url.pathname === "/__mock/expense-payment-entries") {
    ok(response, { entries: expensePaymentEntries });
    return;
  }

  if (url.pathname === "/__mock/expense-claims") {
    ok(response, { entries: expenseClaims });
    return;
  }

  if (url.pathname === "/__mock/files") {
    // `_createdMs` is a local test knob; the ERP has no such column.
    const files = hdFileList.map(({ _createdMs, ...row }) => row);
    response.writeHead(200, { "content-type": "application/json", "cache-control": "no-store" });
    response.end(JSON.stringify({ files }));
    return;
  }

  // The user picture the portal proxies through /api/auth/avatar. Serve any
  // site file path so a changed / uploaded picture resolves too (the real ERP
  // serves these from its own file store).
  if (
    url.pathname === AVATAR_PATH ||
    url.pathname.startsWith("/files/") ||
    url.pathname.startsWith("/private/files/")
  ) {
    // A private file claimed onto an agent-side Comment is unreadable for the
    // customer, exactly like Frappe's Comment permission. Answering 403 here is
    // what pushes the portal onto the ticket-scoped streamer fallback.
    const fileRow =
      hdFilesByUrl.get(url.pathname) ??
      // A seeded file can be quoted under the other prefix than the one it was
      // registered with; treat the two spellings as the same file.
      hdFilesByUrl.get(
        (url.pathname.startsWith("/private/files/") ? "/files/" : "/private/files/") +
          (url.pathname.split("/").pop() || "")
      );
    // Nothing claims this name and it is not the avatar: the real ERP answers 404,
    // so the mock must not invent bytes (otherwise a broken picture looks painted).
    if (!fileRow && url.pathname !== AVATAR_PATH && !crmLeadSeedFilePaths.has(url.pathname)) {
      failure(response, 404, "DoesNotExistError", "File not found.", "Help Desk");
      return;
    }
    // A 200 that is not the file: the withdrawn-session/desk-page shape behind
    // "the bytes did not decode as an image". The portal must sniff, refuse it and
    // fall through to the ticket streamer (0668).
    if (fileRow && fileRow.decoy_html) {
      response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      response.end("<!doctype html><html><body><h1>Login</h1></body></html>");
      return;
    }
    if (fileRow && fileRow.agent_only) {
      failure(response, 403, "PermissionError", "You are not permitted to access this file.", "Help Desk");
      return;
    }
    if (fileRow && fileRow.unreadable) {
      failure(response, 403, "PermissionError", "Not permitted to read this file.", "Help Desk");
      return;
    }
    // Serve the uploaded bytes when we have them (the ticket's real image);
    // anything else (avatars and seeded files) falls back to the sample PNG.
    const stored = hdFileBytes.get(url.pathname);
    const payload = stored ?? AVATAR_BYTES;
    response.writeHead(200, {
      "content-type": "image/png",
      "content-length": payload.length,
      "cache-control": "no-store",
    });
    response.end(payload);
    return;
  }

  if (!url.pathname.startsWith("/api/method/")) {
    response.writeHead(404, { "content-type": "text/plain" });
    response.end("not found");
    return;
  }

  // Ticket-scoped attachment streamer. The portal calls this only after the
  // direct file GET was refused (403/404), and it answers the bytes for any
  // file that belongs to a ticket the caller may read.
  if (method === "shikkha_os.api.v1.help_desk_files.stream_file") {
    const fileUrl = url.searchParams.get("url") || "";
    const row = hdFilesByUrl.get(fileUrl);
    const known = Boolean(row);
    if (!known || !(fileUrl.startsWith("/files/") || fileUrl.startsWith("/private/files/"))) {
      failure(response, 404, "DoesNotExistError", "Unknown file.", "Help Desk");
      return;
    }
    if (row.only_garbage) {
      // Both paths answer a page: the portal must say so instead of streaming it.
      response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      response.end("<!doctype html><html><body><h1>Login</h1></body></html>");
      return;
    }
    if (row.unreadable) {
      // The case behind "if the image has problem to view properly": the file is
      // listed on the row but its bytes may not be handed over at all.
      failure(response, 403, "PermissionError", "Not permitted to read this file.", "Help Desk");
      return;
    }
    const payload = hdFileBytes.get(fileUrl) ?? AVATAR_BYTES;
    response.writeHead(200, {
      "content-type": "image/png",
      "content-length": payload.length,
      "cache-control": "no-store",
    });
    response.end(payload);
    return;
  }

  if (method === "shikkha_os.api.v1.health.ping") {
    ok(response, {
      app: "shikkha_os",
      version: "1.3.12",
      endpoints: [
        "shikkha_os.api.v1.auth.login",
        "shikkha_os.api.v1.auth.logout",
        "shikkha_os.api.v1.auth.session",
        "shikkha_os.api.v1.dashboard.overview",
        "shikkha_os.api.v1.profile.details",
        "shikkha_os.api.v1.profile.request_update_otp",
        "shikkha_os.api.v1.profile.verify_update_otp",
        "shikkha_os.api.v1.profile.upload_image",
        "shikkha_os.api.v1.profile.change_password",
        "shikkha_os.api.v1.customer.form_schema",
        "shikkha_os.api.v1.customer.link_options",
        "shikkha_os.api.v1.customer.create",
        "shikkha_os.api.v1.checkin.status",
        "shikkha_os.api.v1.checkin.punch",
        "shikkha_os.api.v1.expense_claim.form_schema",
        "shikkha_os.api.v1.expense_claim.link_options",
        "shikkha_os.api.v1.expense_claim.list_mine",
        "shikkha_os.api.v1.expense_claim.details",
        "shikkha_os.api.v1.expense_claim.create",
        "shikkha_os.api.v1.payment_entry.list_mine",
        "shikkha_os.api.v1.payment_entry.details",
        "shikkha_os.api.v1.payment_entry.report_error",
        "shikkha_os.api.v1.sales_invoice.list_mine",
        "shikkha_os.api.v1.sales_invoice.details",
        "shikkha_os.api.v1.sales_invoice.report_error",
        "shikkha_os.api.v1.registration.send_otp",
        "shikkha_os.api.v1.registration.verify_otp",
        "shikkha_os.api.v1.registration.availability",
      ],
      session_expiry_hours: 24,
    });
    return;
  }

  if (method === "shikkha_os.api.v1.auth.login") {
    if (request.method !== "POST") {
      failure(response, 405, "AuthenticationError", "Method not allowed.", "Not Allowed");
      return;
    }

    const body = await readBody(request);
    const usr = typeof body.usr === "string" ? body.usr.trim() : "";
    const pwd = typeof body.pwd === "string" ? body.pwd : "";

    if (!usr || !pwd) {
      failure(response, 417, "ValidationError", "Email and Password are required.", "Missing Values");
      return;
    }

    const account = DEMO_USERS[usr];

    if (!account || pwd !== account.password) {
      failure(response, 401, "AuthenticationError", "Invalid email or password.", "Sign In Failed");
      return;
    }

    const sid = randomUUID().replace(/-/g, "");
    sessions.set(sid, usr);

    ok(
      response,
      {
        authenticated: true,
        user: account.profile,
        redirect_to: redirectFor(account),
        session_expiry_seconds: 86400,
      },
      {
        "set-cookie": [
          `sid=${sid}; Path=/; HttpOnly; SameSite=Lax`,
          `full_name=${encodeURIComponent(account.profile.full_name)}; Path=/`,
        ],
      }
    );
    return;
  }

  if (method === "shikkha_os.api.v1.auth.session") {
    const email = userFor(request);
    const account = email ? DEMO_USERS[email] : null;

    ok(
      response,
      account
        ? {
            authenticated: true,
            user: account.profile,
            redirect_to: redirectFor(account),
            session_expiry_seconds: 86400,
          }
        : { authenticated: false, user: null, redirect_to: "/login", session_expiry_seconds: 86400 }
    );
    return;
  }

  if (method === "shikkha_os.api.v1.auth.logout") {
    const sid = cookieValue(request, "sid");
    if (sid) sessions.delete(sid);

    ok(response, { authenticated: false, user: null, redirect_to: "/login" });
    return;
  }

  if (method === "shikkha_os.api.v1.dashboard.overview") {
    const email = userFor(request);
    const account = email ? DEMO_USERS[email] : null;

    if (!account) {
      // Exactly what Frappe answers for a Guest calling a non-guest method.
      failure(
        response,
        403,
        "PermissionError",
        "You are not permitted to access this resource. Login to access.",
        "Method Not Allowed"
      );
      return;
    }

    ok(response, dashboardPayload(account));
    return;
  }

  if (method === "shikkha_os.api.v1.registration.availability") {
    const email = (url.searchParams.get("email") ?? "").trim().toLowerCase();
    const mobile = normalizeMobile(url.searchParams.get("mobile") ?? "");

    ok(response, {
      email_available: email ? !accountExists(email) : true,
      mobile_available: mobile ? !takenMobiles.has(mobile) : true,
    });
    return;
  }

  if (method === "shikkha_os.api.v1.registration.send_otp") {
    if (request.method !== "POST") {
      failure(response, 405, "AuthenticationError", "Method not allowed.", "Not Allowed");
      return;
    }

    const body = await readBody(request);
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const fullName = typeof body.full_name === "string" ? body.full_name.trim() : "";
    const mobile = normalizeMobile(body.mobile);
    const password = typeof body.password === "string" ? body.password : "";

    if (!fullName || !email || !mobile || !password) {
      failure(response, 417, "ValidationError", "Please fill in every field.", "Registration");
      return;
    }

    if (accountExists(email)) {
      failure(response, 417, "ValidationError", "That email already has an account. Please sign in instead.", "Registration");
      return;
    }

    if (takenMobiles.has(mobile)) {
      failure(response, 417, "ValidationError", "That mobile number already has an account.", "Registration");
      return;
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));
    pendingRegistrations.set(email, { code, attempts: 0, expires: Date.now() + 300_000 });

    // eslint-disable-next-line no-console
    console.log(`[mock-frappe] OTP ${email} = ${code}`);

    ok(response, {
      sent: true,
      email: maskEmail(email),
      mobile: maskMobile(mobile),
      delivery: { sms: true, email: true },
      expires_in_seconds: 300,
      resend_after_seconds: 30,
    });
    return;
  }

  if (method === "shikkha_os.api.v1.registration.verify_otp") {
    if (request.method !== "POST") {
      failure(response, 405, "AuthenticationError", "Method not allowed.", "Not Allowed");
      return;
    }

    const body = await readBody(request);
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const otp = String(body.otp ?? "").replace(/\D/g, "");
    const fullName = typeof body.full_name === "string" ? body.full_name.trim() : "";
    const mobile = normalizeMobile(body.mobile);

    if (!email || !otp) {
      failure(response, 417, "ValidationError", "Enter the OTP code we sent you.", "Registration");
      return;
    }

    const pending = pendingRegistrations.get(email);
    if (!pending) {
      failure(response, 417, "ValidationError", "The OTP code has expired. Please request a new one.", "Registration");
      return;
    }

    if (pending.code !== otp) {
      pending.attempts += 1;
      failure(response, 417, "ValidationError", "That OTP code is not correct. Please try again.", "Registration");
      return;
    }

    pendingRegistrations.delete(email);
    registeredUsers.add(email);

    const profile = clientProfile(email, fullName || "New User");
    const sid = randomUUID().replace(/-/g, "");
    sessions.set(sid, email);
    DEMO_USERS[email] = { password: typeof body.password === "string" ? body.password : PASSWORD, kind: "client", profile };
    takenMobiles.add(mobile);

    ok(
      response,
      {
        authenticated: true,
        user: profile,
        redirect_to: "/clientDashboard",
        session_expiry_seconds: 86400,
        created: { user: email, customer: `CUST-${email.split("@")[0].toUpperCase()}` },
      },
      { "set-cookie": [`sid=${sid}; Path=/; HttpOnly; SameSite=Lax`] }
    );
    return;
  }

  // --- OTP sign-in (mirrors shikkha_os.api.v1.auth.send_login_otp / verify_login_otp) ---
  if (method === "shikkha_os.api.v1.auth.send_login_otp") {
    if (request.method !== "POST") {
      failure(response, 405, "AuthenticationError", "Method not allowed.", "Not Allowed");
      return;
    }

    const body = await readBody(request);
    const raw = typeof body.identifier === "string" ? body.identifier.trim() : "";
    const isEmail = raw.includes("@");
    const found = isEmail
      ? DEMO_USERS[raw.toLowerCase()]
        ? { email: raw.toLowerCase(), account: DEMO_USERS[raw.toLowerCase()] }
        : null
      : findAccountByMobile(raw);
    const password = typeof body.password === "string" ? body.password : "";

    // Two-factor: the password is checked before any code is minted, and a bad
    // password is indistinguishable from an unknown account (anti-enumeration).
    if (!found || password !== found.account.password) {
      failure(response, 417, "ValidationError", "The email/mobile or password is not correct.", "Sign In");
      return;
    }

    const email = found.email;
    const code = String(Math.floor(100000 + Math.random() * 900000));
    pendingLoginOtps.set(email, { code, attempts: 0, expires: Date.now() + 300_000 });

    // eslint-disable-next-line no-console
    console.log(`[mock-frappe] LOGIN OTP ${email} = ${code}`);

    const smsOk = process.env.MOCK_SMS_FAIL !== "1";
    ok(response, {
      sent: true,
      target: maskEmail(email),
      email: maskEmail(email),
      mobile: maskMobile(isEmail ? "8801712345678" : normalizeMobile(raw)),
      delivery: {
        sms: smsOk,
        email: true,
        sms_code: smsOk ? "sent" : "not_configured",
        email_code: "sent",
      },
      expires_in_seconds: 300,
      resend_after_seconds: 30,
    });
    return;
  }

  if (method === "shikkha_os.api.v1.auth.verify_login_otp") {
    if (request.method !== "POST") {
      failure(response, 405, "AuthenticationError", "Method not allowed.", "Not Allowed");
      return;
    }

    const body = await readBody(request);
    const raw = typeof body.identifier === "string" ? body.identifier.trim() : "";
    const isEmail = raw.includes("@");
    const found = isEmail
      ? DEMO_USERS[raw.toLowerCase()]
        ? { email: raw.toLowerCase(), account: DEMO_USERS[raw.toLowerCase()] }
        : null
      : findAccountByMobile(raw);
    const otp = String(body.otp ?? "").replace(/\D/g, "");

    if (!found || !otp) {
      failure(response, 417, "ValidationError", "That code is not correct. Please try again.", "Sign In");
      return;
    }

    const email = found.email;
    const account = found.account;
    const pending = pendingLoginOtps.get(email);
    if (!pending) {
      failure(response, 417, "ValidationError", "The code has expired. Please request a new one.", "Sign In");
      return;
    }

    if (pending.code !== otp) {
      pending.attempts += 1;
      failure(response, 417, "ValidationError", "That code is not correct. Please try again.", "Sign In");
      return;
    }

    pendingLoginOtps.delete(email);

    const sid = randomUUID().replace(/-/g, "");
    sessions.set(sid, email);

    ok(
      response,
      {
        authenticated: true,
        user: account.profile,
        redirect_to: redirectFor(account),
        session_expiry_seconds: 86400,
      },
      { "set-cookie": [`sid=${sid}; Path=/; HttpOnly; SameSite=Lax`] }
    );
    return;
  }

  // --- Forgot password (mirrors shikkha_os.api.v1.auth.send_reset_otp / verify_reset_otp) ---
  if (method === "shikkha_os.api.v1.auth.send_reset_otp") {
    if (request.method !== "POST") {
      failure(response, 405, "AuthenticationError", "Method not allowed.", "Not Allowed");
      return;
    }

    const body = await readBody(request);
    const raw = typeof body.identifier === "string" ? body.identifier.trim() : "";
    const isEmail = raw.includes("@");
    const found = isEmail
      ? DEMO_USERS[raw.toLowerCase()]
        ? { email: raw.toLowerCase(), account: DEMO_USERS[raw.toLowerCase()] }
        : null
      : findAccountByMobile(raw);

    if (!found) {
      failure(response, 417, "ValidationError", "No account was found for that email or mobile number.", "Forgot Password");
      return;
    }

    const channel = isEmail ? "email" : "sms";
    const code = String(Math.floor(100000 + Math.random() * 900000));
    pendingResetOtps.set(found.email, { code, attempts: 0, channel, expires: Date.now() + 300_000 });

    // eslint-disable-next-line no-console
    console.log(`[mock-frappe] RESET OTP ${found.email} = ${code}`);

    ok(response, {
      sent: true,
      channel,
      target: channel === "email" ? maskEmail(found.email) : maskMobile("8801712345678"),
      delivery: {
        sms: channel === "sms",
        email: channel === "email",
        sms_code: channel === "sms" ? "sent" : "not_attempted",
        email_code: channel === "email" ? "sent" : "not_attempted",
      },
      expires_in_seconds: 300,
      resend_after_seconds: 30,
    });
    return;
  }

  if (method === "shikkha_os.api.v1.auth.verify_reset_otp") {
    if (request.method !== "POST") {
      failure(response, 405, "AuthenticationError", "Method not allowed.", "Not Allowed");
      return;
    }

    const body = await readBody(request);
    const raw = typeof body.identifier === "string" ? body.identifier.trim() : "";
    const isEmail = raw.includes("@");
    const found = isEmail
      ? DEMO_USERS[raw.toLowerCase()]
        ? { email: raw.toLowerCase(), account: DEMO_USERS[raw.toLowerCase()] }
        : null
      : findAccountByMobile(raw);
    const otp = String(body.otp ?? "").replace(/\D/g, "");

    if (!found || !otp) {
      failure(response, 417, "ValidationError", "That code is not correct. Please try again.", "Forgot Password");
      return;
    }

    const pending = pendingResetOtps.get(found.email);
    if (!pending) {
      failure(response, 417, "ValidationError", "The code has expired. Please request a new one.", "Forgot Password");
      return;
    }

    if (pending.code !== otp) {
      pending.attempts += 1;
      failure(response, 417, "ValidationError", "That code is not correct. Please try again.", "Forgot Password");
      return;
    }

    pendingResetOtps.delete(found.email);
    const newPassword = String(Math.floor(100000 + Math.random() * 900000));
    found.account.password = newPassword;

    // eslint-disable-next-line no-console
    console.log(`[mock-frappe] RESET PASSWORD ${found.email} = ${newPassword}`);

    ok(response, {
      reset: true,
      channel: pending.channel,
      target: pending.channel === "email" ? maskEmail(found.email) : maskMobile("8801712345678"),
      delivery: { sms: pending.channel === "sms", email: pending.channel === "email" },
    });
    return;
  }

  // --- self-service profile (mirrors shikkha_os.api.v1.profile.*) ---
  if (method === "shikkha_os.api.v1.profile.details") {
    const email = userFor(request);
    const account = email ? DEMO_USERS[email] : null;

    if (!account) {
      failure(response, 403, "PermissionError", "Login to access this resource.", "Method Not Allowed");
      return;
    }

    ok(response, {
      name: email,
      full_name: account.profile.full_name,
      email,
      user_image: account.profile.user_image || "",
      mobile_no: profileMobile(email),
      user_type: account.profile.user_type,
      roles: account.profile.roles,
      editable: PROFILE_EDITABLE,
      fields: PROFILE_FIELDS,
      values: profileValues(account, email),
    });
    return;
  }

  if (method === "shikkha_os.api.v1.profile.request_update_otp") {
    if (request.method !== "POST") {
      failure(response, 405, "AuthenticationError", "Method not allowed.", "Not Allowed");
      return;
    }

    const email = userFor(request);
    const account = email ? DEMO_USERS[email] : null;

    if (!account) {
      failure(response, 403, "PermissionError", "Login to access this resource.", "Method Not Allowed");
      return;
    }

    const body = await readBody(request);
    const current = profileValues(account, email);
    const changed = PROFILE_EDITABLE.filter(
      (field) => typeof body[field] === "string" && body[field].trim() !== (current[field] ?? "")
    );
    const hasImage = typeof body.user_image === "string" && body.user_image.trim();
    const removeImage = truthy(body.remove_image);

    if (!changed.length && !hasImage && !removeImage) {
      failure(response, 417, "ValidationError", "There is nothing to update.", "Edit Profile");
      return;
    }

    const mobileNo = profileMobile(email);
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const values = {};
    for (const field of PROFILE_EDITABLE) {
      if (typeof body[field] === "string") values[field] = body[field].trim();
    }
    if (hasImage) values.user_image = body.user_image.trim();
    if (removeImage) values.remove_image = "1";

    pendingProfileOtps.set(email, { code, attempts: 0, values, expires: Date.now() + 10 * 60 * 1000 });

    // eslint-disable-next-line no-console
    console.log(`[mock-frappe] PROFILE OTP ${email} = ${code}`);

    ok(response, {
      sent: true,
      target: maskEmail(email),
      email: maskEmail(email),
      mobile: maskMobile(mobileNo),
      delivery: { sms: true, email: true, sms_code: "sent", email_code: "sent" },
      expires_in_seconds: 300,
      resend_after_seconds: 30,
    });
    return;
  }

  if (method === "shikkha_os.api.v1.profile.verify_update_otp") {
    if (request.method !== "POST") {
      failure(response, 405, "AuthenticationError", "Method not allowed.", "Not Allowed");
      return;
    }

    const email = userFor(request);
    const account = email ? DEMO_USERS[email] : null;

    if (!account) {
      failure(response, 403, "PermissionError", "Login to access this resource.", "Method Not Allowed");
      return;
    }

    const body = await readBody(request);
    const code = String(body.otp ?? "").replace(/\D/g, "");

    const pending = pendingProfileOtps.get(email);
    if (!pending || pending.expires < Date.now()) {
      pendingProfileOtps.delete(email);
      failure(response, 417, "ValidationError", "The OTP has expired. Please request a new one.", "Edit Profile");
      return;
    }
    if (pending.attempts >= 5) {
      pendingProfileOtps.delete(email);
      failure(response, 417, "ValidationError", "Too many wrong codes. Please request a new one.", "Edit Profile");
      return;
    }
    if (code !== pending.code) {
      pending.attempts += 1;
      failure(response, 417, "ValidationError", "The OTP you entered is not correct. Please try again.", "Edit Profile");
      return;
    }

    pendingProfileOtps.delete(email);

    const extra = profileExtras.get(email) ?? {};
    if (typeof pending.values.full_name === "string" && pending.values.full_name.trim()) {
      account.profile.full_name = pending.values.full_name.trim();
    }
    for (const field of PROFILE_EDITABLE) {
      if (field === "full_name") continue;
      if (typeof pending.values[field] === "string") extra[field] = pending.values[field].trim();
    }
    profileExtras.set(email, extra);
    if (truthy(pending.values.remove_image)) {
      account.profile.user_image = "";
    } else if (typeof pending.values.user_image === "string" && pending.values.user_image.trim()) {
      account.profile.user_image = pending.values.user_image.trim();
    }

    ok(response, { updated: true, user: account.profile, values: profileValues(account, email) });
    return;
  }

  if (method === "shikkha_os.api.v1.profile.upload_image") {
    if (request.method !== "POST") {
      failure(response, 405, "AuthenticationError", "Method not allowed.", "Not Allowed");
      return;
    }

    const email = userFor(request);
    if (!email || !DEMO_USERS[email]) {
      failure(response, 403, "PermissionError", "Login to access this resource.", "Method Not Allowed");
      return;
    }

    const body = await readBody(request);
    const data = String(body.file_data ?? "");
    if (!data.startsWith("data:image/")) {
      failure(response, 417, "ValidationError", "Only image files can be used.", "Edit Profile");
      return;
    }

    ok(response, { file_url: `/private/files/profile-${Date.now()}.png` });
    return;
  }

  if (method === "shikkha_os.api.v1.profile.change_password") {
    if (request.method !== "POST") {
      failure(response, 405, "AuthenticationError", "Method not allowed.", "Not Allowed");
      return;
    }

    const email = userFor(request);
    const account = email ? DEMO_USERS[email] : null;

    if (!account) {
      failure(response, 403, "PermissionError", "Login to access this resource.", "Method Not Allowed");
      return;
    }

    const body = await readBody(request);
    const current = String(body.current_password ?? "");
    const next = String(body.new_password ?? "");

    if (!current || !next) {
      failure(response, 417, "ValidationError", "Enter your current and new password.", "Change Password");
      return;
    }
    if (next.length < 6) {
      failure(response, 417, "ValidationError", "The new password must be at least 6 characters.", "Change Password");
      return;
    }
    if (current !== account.password) {
      failure(response, 417, "ValidationError", "Your current password is not correct.", "Change Password");
      return;
    }

    account.password = next;
    ok(response, { changed: true });
    return;
  }

  // --- Employee check-in (mirrors shikkha_os.api.v1.checkin.*) ---
  if (method === "shikkha_os.api.v1.checkin.status") {
    const email = userFor(request);
    const account = email ? DEMO_USERS[email] : null;

    if (!account) {
      failure(
        response,
        403,
        "PermissionError",
        "You are not permitted to access this resource. Login to access.",
        "Method Not Allowed"
      );
      return;
    }

    const employee = employeeFor(email);
    if (!employee) {
      ok(response, {
        doctype: "Employee Checkin",
        linked: false,
        employee: null,
        state: "out",
        checked_in: false,
        last: null,
        last_in: null,
        last_out: null,
        server_time: nowStamp(),
      });
      return;
    }

    const state = checkinState(employee.name);
    const latest = latestCheckin(employee.name);

    ok(response, {
      doctype: "Employee Checkin",
      linked: true,
      employee,
      state,
      checked_in: state === "in",
      last: latest,
      last_in: lastCheckinOfType(employee.name, "IN"),
      last_out: lastCheckinOfType(employee.name, "OUT"),
      server_time: nowStamp(),
    });
    return;
  }

  if (method === "shikkha_os.api.v1.checkin.punch") {
    if (request.method !== "POST") {
      failure(response, 405, "AuthenticationError", "Method not allowed.", "Not Allowed");
      return;
    }

    const email = userFor(request);
    const account = email ? DEMO_USERS[email] : null;

    if (!account || account.kind !== "staff") {
      failure(response, 403, "PermissionError", "You do not have permission to check in or out.", "Check In / Out");
      return;
    }

    const employee = employeeFor(email);
    if (!employee) {
      failure(
        response,
        403,
        "PermissionError",
        "No Employee record is linked to your account. Please contact an HR administrator.",
        "Check In / Out"
      );
      return;
    }

    const body = await readBody(request);
    const logType = String(body.log_type ?? "").trim().toUpperCase();

    if (logType !== "IN" && logType !== "OUT") {
      failure(response, 417, "ValidationError", "Invalid check in / out request.", "Check In / Out");
      return;
    }

    const state = checkinState(employee.name);
    if (logType === "IN" && state === "in") {
      failure(response, 417, "ValidationError", "You are already checked in.", "Check In / Out");
      return;
    }
    if (logType === "OUT" && state === "out") {
      failure(response, 417, "ValidationError", "You are already checked out.", "Check In / Out");
      return;
    }

    const latitude = Number(body.latitude);
    const longitude = Number(body.longitude);
    checkinCounter += 1;

    const record = {
      name: `EMP-CKIN-10-2026-${String(checkinCounter).padStart(6, "0")}`,
      employee: employee.name,
      employee_name: employee.employee_name,
      log_type: logType,
      time: nowStamp(),
      device_id: String(body.device_id ?? "").slice(0, 140),
      latitude: Number.isFinite(latitude) ? latitude : 0,
      longitude: Number.isFinite(longitude) ? longitude : 0,
      geolocation: String(body.geolocation ?? ""),
      creation: nowStamp(),
    };
    checkinRecords.push(record);

    console.log(`[mock-frappe] CHECKIN ${record.name} ${employee.name} ${logType}`);

    ok(response, {
      record,
      employee,
      state: logType === "IN" ? "in" : "out",
      checked_in: logType === "IN",
      verified: true,
    });
    return;
  }

  // --- Help Desk tickets (mirrors shikkha_os.api.v1.help_desk.*) ------------ //
  // Enough of the real contract to drive the New Ticket wizard end to end
  // locally: the ERP-managed option lists, a private-file upload stub, ticket
  // creation with the same five mandatory checks the backend now enforces, and
  // the customer's list/detail reads. Shapes follow src/lib/help-desk/types.ts.
  if (method.startsWith("shikkha_os.api.v1.help_desk.")) {
    const email = userFor(request);
    const account = email ? DEMO_USERS[email] : null;
    if (!account) {
      failure(response, 403, "PermissionError", "You are not permitted to access this resource. Login to access", "Method Not Allowed");
      return;
    }
    const hdAction = method.slice("shikkha_os.api.v1.help_desk.".length).split("?")[0];
    // A Desk agent reads every ticket; a customer only sees their own.
    const hdCanRead = (item) => Boolean(account.kind === "staff" || item.support || item.ownerKey === String(email).toLowerCase());

    if (hdAction === "options") {
      ok(response, {
        statuses: [
          { name: "Open", category: "Open", label: "Open", color: "#3b82f6", enabled: 1 },
          { name: "Replied", category: "Open", label: "Replied", color: "#f59e0b", enabled: 1 },
          { name: "Resolved", category: "Resolved", label: "Resolved", color: "#22c55e", enabled: 1 },
        ],
        priorities: [
          { id: "low", name: "Low" },
          { id: "medium", name: "Medium" },
          { id: "high", name: "High" },
          { id: "urgent", name: "Urgent" },
        ],
        // Real label vocabulary from shikkha_os.api.v1.help_desk.CATEGORY_LABELS
        types: ["Technical", "Payment", "Account", "Other"],
        categories: [
          { value: "Technical", key: "technical" },
          { value: "Payment", key: "payment" },
          { value: "Account", key: "account" },
          { value: "Other", key: "other" },
        ],
        teams: ["Support", "Accounts", "Technical Team"],
      });
      return;
    }

    if (hdAction === "upload_attachment") {
      const body = await readBody(request);
      const name = String(body?.file_name ?? "attachment.png").replace(/[^\w.\-]+/g, "_");
      const size = String(body?.content ?? "").length;
      const bytes = size ? Math.ceil((size * 3) / 4) : 0;
      const owner = String(email ?? "").toLowerCase();

      // Mirrors `attachment_rules.reusable_upload`: a retried submit re-sends the
      // same bytes, so the same File row is handed back instead of a duplicate.
      // Stored names are stamped, so compare the base name.
      const reusable = hdFileList.find(
        (row) =>
          row.owner === owner &&
          mockUnstamped(row.file_name) === name &&
          row.file_size === bytes &&
          hdFileUnattached(row) &&
          // Only a row written moments ago is a retry of *this* submit; a fresh
          // send of the same picture gets its own row and timestamp.
          Date.now() - (row._createdMs ?? 0) < HD_REUSE_WINDOW_MS,
      );
      if (reusable) {
        console.log(`[mock-frappe] HD UPLOAD ${reusable.file_name} (reused)`);
        ok(response, { name: reusable.file_name, url: reusable.file_url, size: bytes, reused: true });
        return;
      }

      hdFileSeq += 1;
      // `_store_upload` on the ERP writes a *public* row (`is_private` 0), which
      // is what the Desk shows as an unchecked box and a `/files/...` URL — and
      // the stored name carries the upload date and time.
      const storedName = mockUniqueStoredName(mockTimestampedName(name));
      const url = `/files/mock-hd-${hdFileSeq}-${storedName}`;
      hdFileBytes.set(url, Buffer.from(String(body?.content ?? ""), "base64"));
      const uploadedRow = hdFileRow({
        name: `MOCKFILE-${String(hdFileSeq).padStart(5, "0")}`,
        url,
        fileName: storedName,
        size: bytes,
        owner,
      });
      uploadedRow.is_private = 0;
      console.log(`[mock-frappe] HD UPLOAD ${storedName} (${size}b64)`);
      ok(response, { name: storedName, url, size: bytes });
      return;
    }

    const hdBody = (await readBody(request)) || {};
    const hdData = typeof hdBody.data === "object" && hdBody.data ? hdBody.data : hdBody;
    const ownerKey = String(email).toLowerCase();

    if (hdAction === "create_ticket") {
      const text = (key) => String(hdData[key] ?? "").trim();
      const contact = hdData.contact && typeof hdData.contact === "object" ? hdData.contact : {};
      const preferred = String(contact.preferredContact ?? "").trim().toLowerCase();
      const mobileDigits = String(contact.mobile ?? "").replace(/\D+/g, "");
      const fail = (message) => {
        hdDiscardUploads(hdData.attachments, ownerKey);
        return failure(response, 417, "ValidationError", message, "Help Desk");
      };

      if (text("subject").length < 4) return fail("Please enter a subject (4-140 characters).");
      if (!text("ticketType")) return fail("Please choose a valid category.");
      if (!text("priority")) return fail("Please choose a valid priority.");
      if (text("description").length < 15) return fail("Please describe the problem (15-8000 characters).");
      if (!text("department")) return fail("Please choose a department.");
      if (!["mobile", "email", "both"].includes(preferred)) return fail("Please choose at least one contact method (Mobile or Email).");
      if (preferred !== "email" && mobileDigits.length < 10) return fail("Please enter a valid mobile number — or choose Email only.");

      // Duplicate-submission guard, mirroring the backend's recent-duplicate rule.
      const dupeKey = `${ownerKey}|${text("subject").toLowerCase()}|${text("description")}`;
      const recent = hdTickets.get(dupeKey);
      if (recent && Date.now() - recent.at < 60_000) {
        // The resubmit still carries this attempt's uploads: they go onto the
        // ticket that actually exists, and anything left over is discarded.
        const retryUploads = hdResolveUploads(hdData.attachments, ownerKey);
        const retryMessageId = retryUploads.attached.length
          ? `HDCOMM-${recent.ticket.id}-${Date.now()}`
          : null;
        for (const entry of retryUploads.attached) {
          entry.row.attached_to_doctype = "Communication";
          entry.row.attached_to_name = retryMessageId;
          recent.ticket.attachments.push({
            id: entry.row.name,
            name: entry.row.file_name,
            size: entry.row.file_size,
            mime: /\.(png|jpe?g|webp|gif)$/i.test(entry.row.file_name) ? "image/png" : "application/pdf",
            url: entry.row.file_url,
          });
        }
        const retryThread = hdThreads.get(recent.ticket.id);
        if (retryThread && retryUploads.attached.length) {
          retryThread.attachments = recent.ticket.attachments;
          retryThread.messages.push({
            id: retryMessageId,
            author: "user",
            authorName: recent.ticket.contact.name,
            body: `সংযুক্তি — ${retryUploads.attached.map((entry) => entry.row.file_name).join(", ")}`,
            createdAt: new Date().toISOString(),
            kind: "message",
            channel: "message",
            replyTo: null,
            attachments: recent.ticket.attachments,
            isMine: false,
            seen: false,
            reactions: [],
          });
        }
        hdDiscardUploads(hdData.attachments, ownerKey);
        ok(response, {
          ticket: recent.ticket,
          verified: true,
          duplicate: true,
          notification: null,
          attachments_failed: retryUploads.failed,
        });
        return;
      }

      hdTicketSeq += 1;
      const typeKey =
        { technical: "technical", payment: "payment", account: "account", "login & access": "login" }[
          text("ticketType").toLowerCase()
        ] ?? "other";
      const id = `HD-2026-${String(hdTicketSeq).padStart(5, "0")}`;
      const timestamp = new Date().toISOString();

      // Claim the uploaded Files exactly like `_attach_uploaded_files`: only the
      // caller's unattached rows move, and they move onto a *message*
      // (Communication) on the ticket — Desk shows them in Activity > the message
      // > attach file, which is the conversation the agent actually reads. A
      // Comment is not used: the helpdesk app refuses comment inserts from
      // customers (ticket comments are internal agent notes).
      const uploads = hdResolveUploads(hdData.attachments, ownerKey);
      const attachmentMessageId = uploads.attached.length ? `HDCOMM-${id}` : null;
      for (const entry of uploads.attached) {
        entry.row.attached_to_doctype = "Communication";
        entry.row.attached_to_name = attachmentMessageId;
      }
      const ticket = {
        id,
        subject: text("subject"),
        category: typeKey,
        ticketType: text("ticketType"),
        priority: text("priority").toLowerCase(),
        description: text("description"),
        status: "open",
        statusLabel: "Open",
        contact: {
          name: String(contact.name ?? "").trim() || account.profile?.full_name || email,
          email: String(contact.email ?? "").trim() || email,
          mobile: String(contact.mobile ?? "").trim() || null,
          preferredContact: preferred,
        },
        relatedRoute: text("relatedRoute") || undefined,
        department: text("department"),
        attachments: uploads.attached.map((entry, index) => ({
          id: entry.row.name || `mock-file-${hdTicketSeq}-${index}`,
          name: entry.row.file_name,
          size: entry.row.file_size || 1024,
          mime: /\.(png|jpe?g|webp|gif)$/i.test(entry.row.file_name) ? "image/png" : "application/pdf",
          url: entry.row.file_url,
        })),
        messages: [],
        pinnedMessageId: null,
        createdAt: timestamp,
        updatedAt: timestamp,
        assignedAgent: undefined,
        ownerKey,
      };
      hdTicketList.push({ ownerKey, support: account.kind === "staff", ticket });
      hdTickets.set(dupeKey, { at: Date.now(), ticket });

      // The ticket detail page reads the conversation API, so the created
      // ticket also becomes a thread — with its attachments — exactly as the
      // ERP would list them from `HD Ticket`.
      hdThreads.set(id, {
        name: id,
        subject: ticket.subject,
        category: ticket.category,
        priority: ticket.priority,
        status: "Open",
        currentStatus: "Open",
        statusCategory: "Open",
        customer: ticket.contact.name,
        customerEmail: ticket.contact.email || email,
        agent: "Tamim Hasan",
        department: ticket.department,
        submittedAt: timestamp,
        attachments: ticket.attachments,
        messages: [
          {
            id: "HDMSG-00001",
            author: "user",
            authorName: ticket.contact.name,
            body: ticket.description,
            createdAt: timestamp,
            kind: "message",
            channel: "comment",
            replyTo: null,
            // The files were posted as their own comment, so they hang off that
            // comment — the ticket-level list above is the aggregate the ERP
            // serves for the ticket page.
            attachments: [],
            isMine: false,
            seen: false,
            reactions: [],
          },
          ...(ticket.attachments.length
            ? [
                {
                  id: attachmentMessageId,
                  author: "user",
                  authorName: ticket.contact.name,
                  body: `সংযুক্তি — ${ticket.attachments.map((file) => file.name).join(", ")}`,
                  createdAt: timestamp,
                  kind: "message",
                  channel: "message",
                  replyTo: null,
                  attachments: ticket.attachments,
                  isMine: false,
                  seen: false,
                  reactions: [],
                },
              ]
            : []),
        ],
      });
      console.log(`[mock-frappe] HD TICKET ${id} ${preferred} files=${ticket.attachments.length}`);
      ok(response, {
        ticket,
        verified: true,
        notification: {
          ticket: id,
          sent: true,
          channels: {
            ...(preferred === "email" || preferred === "both" ? { email: { sent: true } } : {}),
            ...(preferred === "mobile" || preferred === "both" ? { mobile: { sent: true } } : {}),
          },
        },
        attachments_failed: uploads.failed,
      });
      return;
    }

    if (hdAction === "list_tickets") {
      // A support agent sees the whole queue, exactly like the ERP scopes it;
      // a customer only ever sees the tickets they raised themselves.
      const viewerIsStaff = DEMO_USERS[String(email ?? "").toLowerCase()]?.kind === "staff";
      const rows = hdTicketList
        .filter((row) => viewerIsStaff || row.ownerKey === ownerKey || row.support)
        .map((row) => row.ticket)
        .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
      ok(response, {
        tickets: rows,
        counts: { all: rows.length, open: rows.filter((t) => t.status === "open").length, resolved: 0 },
        total: rows.length,
        page: 1,
        page_size: 500,
        has_more: false,
        server_time: new Date().toISOString(),
      });
      return;
    }

    if (hdAction === "get_ticket") {
      const wanted = String(url.searchParams.get("name") ?? "").trim();
      const row = hdTicketList.find((item) => item.ticket.id === wanted && hdCanRead(item));
      if (!row) {
        failure(response, 404, "DoesNotExistError", "Ticket not found.", "Help Desk");
        return;
      }
      ok(response, { ticket: row.ticket });
      return;
    }

    if (hdAction === "reply_ticket") {
      try {
        // The dispatcher already consumed the request body into `hdData`.
        const data = hdData;
        const wanted = String(data.name ?? "").trim();
        const text = String(data.message ?? "").trim();
        // A ticket raised through the UI lives in `hdTicketList`; the seeded
        // fixtures (0616, 0623, ...) live in `hdThreads`, so a reply to one of
        // those has to resolve there too — same visitor rule: staff, or the
        // customer the thread belongs to.
        const seeded = (() => {
          const thread = hdThreads.get(wanted);
          if (!thread) return null;
          const ownerEmail = String(thread.customerEmail || "").toLowerCase();
          const mayReply = account.kind === "staff" || ownerEmail === String(email || "").toLowerCase();
          if (!mayReply) return null;
          return { ownerKey: ownerEmail, support: account.kind === "staff", ticket: thread };
        })();
        const row =
          hdTicketList.find((item) => item.ticket.id === wanted && hdCanRead(item)) ?? seeded;
        if (!row) {
          failure(response, 404, "DoesNotExistError", "Ticket not found.", "Help Desk");
          return;
        }
        if (!text && !(Array.isArray(data.attachments) && data.attachments.length)) {
          failure(response, 417, "ValidationError", "Message is required.", "Help Desk");
          return;
        }
        // A reply's files belong to its own comment, exactly like the real
        // `create_communication_via_contact`; the ticket tray keeps only the
        // files the customer sent when the ticket was raised.
        const owner = String(email ?? "").toLowerCase();
        const uploads = hdResolveUploads(data.attachments, owner);
        const ticket = row.ticket;
        if (text || uploads.attached.length) {
          const nextId = `HDMSG-${String((ticket.messages?.length ?? 0) + 1).padStart(5, "0")}`;
          ticket.messages = Array.isArray(ticket.messages) ? ticket.messages : [];
          ticket.messages.push({
            id: nextId,
            author: row.support ? "support" : "user",
            authorName: row.support ? (ticket.agent || "Support") : (ticket.customer || ticket.contact?.name || ""),
            body: text,
            // Dev-only: some ERP rows come back with a blank stamp, which used
            // to print "—" in the trail right after sending. HD_0922 reproduces
            // that shape so the composer's own stamping stays testable.
            createdAt: ticket.stripReplyTimestamps ? "" : new Date().toISOString(),
            kind: "message",
            channel: "comment",
            replyTo: null,
            attachments: hdUniqueFiles(
              uploads.attached.map((entry) => ({
                id: entry.row.name,
                name: entry.row.file_name,
                size: entry.row.file_size,
                mime: /\.(png|jpe?g|webp|gif)$/i.test(entry.row.file_name) ? "image/png" : "application/pdf",
                url: entry.row.file_url,
              })),
            ),
            isMine: true,
            seen: false,
            reactions: [],
          });
          for (const entry of uploads.attached) {
            entry.row.attached_to_doctype = "Communication";
            entry.row.attached_to_name = `HDCOMM-${wanted}-${nextId}`;
          }
          console.log(`[mock-frappe] HD REPLY ${wanted} ${nextId} files=${uploads.attached.length}`);
        }
        ok(response, { ticket, attachments_failed: uploads.failed });
      } catch (error) {
        console.error("[mock-frappe] REPLY ERROR", error && error.stack ? error.stack : error);
        failure(response, 500, "ValidationError", String(error && error.message || error), "Help Desk");
      }
      return;
    }

    failure(response, 404, "DoesNotExistError", `Unknown help desk method ${hdAction}`, "Help Desk");
    return;
  }

  // --- Help Desk conversations (mirrors shikkha_os.api.v1.help_desk_messages.*) ---
  // In-memory threads so a dev run can exercise the real panels end to end: the
  // Playwright harness pushes a message through `mock.hd.push` (a dev-only
  // control method) and then asserts the OTHER panel shows it without a reload.
  // Nothing here touches the real ERP; shapes follow src/lib/help-desk/types.ts.
  // Dev-only control surface for the customer-bound login users, so a Playwright
  // run can assert the row a create left behind (and clear it between runs).
  if (method === "mock.users.list") {
    ok(response, { users: [...customerUsers.values()] });
    return;
  }

  if (method === "mock.users.clear") {
    const cleared = customerUsers.size;
    customerUsers.clear();
    mockUserProvisionFail = process.env.MOCK_USER_PROVISION_FAIL === "1";
    ok(response, { ok: true, cleared });
    return;
  }

  if (method === "mock.users.fail") {
    const body = await readBody(request);
    const data = body && typeof body.data === "object" && body.data ? body.data : body ?? {};
    mockUserProvisionFail = Boolean(data.fail);
    ok(response, { ok: true, fail: mockUserProvisionFail });
    return;
  }

  // Customers created through `customer.create`, with their `portal_users`
  // link, so a suite can prove the customer side of the identity too.
  if (method === "mock.customers.list") {
    const seen = new Set();
    const customers = [];
    for (const record of createdCustomers.values()) {
      if (seen.has(record.name)) continue;
      seen.add(record.name);
      customers.push({
        name: record.name,
        customer_name: record.customer_name,
        email_id: record.values?.email_id ?? "",
        mobile_no: record.values?.mobile_no ?? "",
        portal_users: record.portal_users ?? [],
        user: record.user ?? null,
      });
    }
    ok(response, { customers });
    return;
  }

  // Simulate the helpdesk app copying a message's files onto the ticket tray:
  // two File rows for one upload, which the portal must fold into one file.
  if (method === "mock.hd.mirror") {
    const body = await readBody(request);
    const data = body && typeof body.data === "object" && body.data ? body.data : body ?? {};
    hdMirrorUploads = data.enabled !== false;
    ok(response, { ok: true, mirror: hdMirrorUploads });
    return;
  }

  // Backdate earlier uploads so the retry-reuse window has elapsed — the knob a
  // suite needs to prove "same file sent again = a new dated File row".
  if (method === "mock.hd.age") {
    const body = await readBody(request);
    const data = body && typeof body.data === "object" && body.data ? body.data : body ?? {};
    const seconds = Math.max(0, Number(data.seconds ?? 600));
    for (const row of hdFileList) {
      row._createdMs = (row._createdMs ?? Date.now()) - seconds * 1000;
    }
    ok(response, { ok: true, aged: hdFileList.length, seconds });
    return;
  }

  if (method === "mock.hd.reset") {
    let restored = 0;
    for (const [name, seeded] of HD_SEED_ALL) {
      const thread = hdThreads.get(name);
      if (!thread) continue;
      thread.messages = seeded.map((message) => ({ ...message }));
      restored += thread.messages.length;
    }
    // Keep ids unique across every thread, not just the first one restored.
    hdMessageSeq = Math.max(
      hdMessageSeq,
      ...hdThreads.values().flatMap((thread) =>
        thread.messages.map((message) => Number(String(message.id).replace(/\D+/g, "")) || 0),
      ),
    );
    console.log(`[mock-frappe] HD RESET ${HD_SEED_ALL.size} threads (${restored} seeded)`);
    ok(response, { ok: true, messages: restored, threads: HD_SEED_ALL.size });
    return;
  }

  if (method === "mock.hd.push") {
    const body = await readBody(request);
    const data = body && typeof body.data === "object" && body.data ? body.data : body ?? {};
    const ticket = String(data.ticket ?? "").trim();
    const author = data.author === "support" ? "support" : "user";
    const text = String(data.body ?? "").trim();
    const row = hdThreads.get(ticket);
    if (!row || !text) {
      failure(response, 404, "ValidationError", "Unknown ticket or empty body.", "Help Desk");
      return;
    }
    const message = hdAppend(ticket, author, text, { at: data.at, replyTo: data.replyTo });
    console.log(`[mock-frappe] HD PUSH ${ticket} ${author} ${text}`);
    ok(response, message);
    return;
  }

  if (method.startsWith("shikkha_os.api.v1.help_desk_messages.")) {
    const email = userFor(request);
    const account = email ? DEMO_USERS[email] : null;
    if (!account) {
      failure(response, 403, "PermissionError", "You are not permitted to access this resource. Login to access", "Method Not Allowed");
      return;
    }
    const support = account.kind === "staff";
    const action = method.slice("shikkha_os.api.v1.help_desk_messages.".length);

    if (action === "help_desk_badges") {
      ok(response, {
        role: support ? "employee" : "customer",
        counts: support
          ? { open_tickets: 0, solved_tickets: 0, new_problem: hdUnread(support), solve_problem: 0 }
          : { open_tickets: hdUnread(support), solved_tickets: 0, new_problem: 0, solve_problem: 0 },
        server_time: "2026-10-28 10:00:00",
      });
      return;
    }

    if (action === "list_conversations") {
      const statuses = String(url.searchParams.get("statuses") ?? "").trim();
      const page = Math.max(Number(url.searchParams.get("page") ?? "1") || 1, 1);
      const pageSize = Math.max(Number(url.searchParams.get("page_size") ?? "10") || 10, 1);
      const wanted = statuses
        .split(/[,\s]+/)
        .map((value) => value.trim())
        .filter(Boolean);
      const rows = [...hdThreads.values()]
        .filter((thread) => {
          if (!wanted.length) return true;
          const isOpen = thread.statusCategory === "Open";
          return wanted.some((key) => (key === "open" ? isOpen : key === "not_open" ? !isOpen : thread.status === key));
        })
        .map((thread) => hdSummary(thread, support))
        .sort((a, b) => String(b.lastMessageAt).localeCompare(String(a.lastMessageAt)));
      const start = (page - 1) * pageSize;
      ok(response, {
        conversations: rows.slice(start, start + pageSize),
        total: rows.length,
        unread: hdUnread(support),
        page,
        page_size: pageSize,
        has_more: start + pageSize < rows.length,
        isSupport: support,
        server_time: "2026-10-28 10:00:00",
      });
      return;
    }

    if (action === "get_conversation") {
      const name = String(url.searchParams.get("name") ?? "").trim();
      const limit = Math.max(Number(url.searchParams.get("limit") ?? "0") || 0, 0);
      const cursor = String(url.searchParams.get("cursor") ?? "").trim();
      const since = String(url.searchParams.get("since") ?? "").trim();
      const payload = hdConversation(name, support, { limit, cursor, since });
      if (!payload) {
        failure(response, 404, "DoesNotExistError", "The ticket could not be found.", "Not Found");
        return;
      }
      ok(response, payload);
      return;
    }

    if (action === "send_message") {
      const body = await readBody(request);
      const data = body && typeof body.data === "object" && body.data ? body.data : body ?? {};
      const name = String(data.name ?? "").trim();
      const text = String(data.message ?? "").trim();
      if (!hdThreads.has(name) || !text) {
        failure(response, 417, "ValidationError", "Message is required.", "Help Desk");
        return;
      }
      // Comment attachments: each message owns its File reference, so a file that
      // already lives on the ticket (or on an earlier comment) is refused rather
      // than silently re-parented away from the message that shows it.
      const owner = String(email ?? "").toLowerCase();
      const uploads = hdResolveUploads(data.attachments, owner);
      const message = hdAppend(name, support ? "support" : "user", text);
      if (message) {
        // One line per stored message: the slow-send e2e counts them to prove a
        // timed-out write was not sent twice.
        console.log(`[mock-frappe] HD MESSAGE ${name} ${message.id} by=${owner}`);
        for (const entry of uploads.attached) {
          entry.row.attached_to_doctype = "Communication";
          entry.row.attached_to_name = `HDCOMM-${message.id}`;
        }
        message.attachments = hdUniqueFiles(
          uploads.attached.map((entry) => ({
            id: entry.row.name,
            name: entry.row.file_name,
            size: entry.row.file_size,
            mime: /\.(png|jpe?g|webp|gif)$/i.test(entry.row.file_name) ? "image/png" : "application/pdf",
            url: entry.row.file_url,
          })),
        );
        // 0643: the desk names the same upload twice — once from the row's own
        // attachment list (`/private/files/...`) and once from the image its
        // HTML embeds (`/files/...`) — and leaves a bare `Attachment` comment
        // holding the picture with no text of its own. A chat that trusts the
        // payload draws the same picture three times; the fixture keeps that
        // shape so the portal has to fold it.
        const thread = hdThreads.get(name);
        if (thread && thread.mirrorAttachments && message.attachments?.length) {
          const originals = [...message.attachments];
          for (const file of originals) {
            const alias = String(file.url || "").replace("/private/files/", "/files/");
            hdFileBytes.set(alias, hdFileBytes.get(file.url) || AVATAR_BYTES);
            message.attachments.push({ ...file, id: `${file.id}-alias`, url: alias });
          }
          const mirror = hdAppend(name, support ? "support" : "user", "", {
            at: new Date(Date.now() + 500).toISOString(),
          });
          if (mirror) {
            mirror.attachments = message.attachments.map((file) => ({ ...file }));
          }
        }
      }
      // A site whose write lands but whose answer crawls (0602): by the time the
      // portal's ceiling expires the message is already on the ticket.
      const sendDelay = Number(process.env.MOCK_HD_SEND_DELAY_MS || 0);
      if (sendDelay > 0) await new Promise((resolve) => setTimeout(resolve, sendDelay));
      ok(response, { ...hdConversation(name, support, {}), attachments_failed: uploads.failed });
      return;
    }

    if (action === "mark_read") {
      ok(response, { ok: true });
      return;
    }

    failure(response, 404, "ValidationError", `Unknown help desk method ${action}.`, "Help Desk");
    return;
  }

  // --- Customer creation (mirrors shikkha_os.api.v1.customer.*) ---
  if (method === "shikkha_os.api.v1.customer.form_schema") {
    const email = userFor(request);
    const account = email ? DEMO_USERS[email] : null;

    const denied = customerGate(account);
    if (denied) {
      failure(response, denied.status, denied.exc, denied.message, "Customer");
      return;
    }

    ok(response, {
      doctype: "Customer",
      title: "Customer",
      sections: CUSTOMER_SECTIONS,
      meta: { title_field: "name", search_fields: ["customer_name"] },
    });
    return;
  }

  if (method === "shikkha_os.api.v1.customer.link_options") {
    const email = userFor(request);
    const account = email ? DEMO_USERS[email] : null;

    const denied = customerGate(account);
    if (denied) {
      failure(response, denied.status, denied.exc, denied.message, "Customer");
      return;
    }

    const target = (url.searchParams.get("doctype") ?? "").trim();
    const txt = (url.searchParams.get("txt") ?? "").trim().toLowerCase();
    const all = CUSTOMER_LINK_OPTIONS[target] ?? [];
    const options = all
      .filter((value) => !txt || value.toLowerCase().includes(txt))
      .map((value) => ({ value, label: value }));

    ok(response, { doctype: target, options });
    return;
  }

  // --- Customer-bound login users ----------------------------------------- //
  // Mirrors the backend's `_provision_portal_user`: one "Create Customer"
  // request also leaves a Desk User (email / first_name / mobile_no). Kept out
  // of the customer record so a suite can assert the row the operator sees, and
  // switchable to the failure shape (customer created, login not) via
  // `MOCK_USER_PROVISION_FAIL=1`, which is how the error-report path is proven.
  if (method === "shikkha_os.api.v1.customer.create") {
    if (request.method !== "POST") {
      failure(response, 405, "AuthenticationError", "Method not allowed.", "Not Allowed");
      return;
    }

    const email = userFor(request);
    const account = email ? DEMO_USERS[email] : null;

    const denied = customerGate(account);
    if (denied) {
      failure(response, denied.status, denied.exc, denied.message, "Customer");
      return;
    }

    const body = await readBody(request);
    const data = body && typeof body.data === "object" && body.data ? body.data : {};

    const name = String(data.customer_name ?? "").trim();
    const type = String(data.customer_type ?? "").trim();

    if (!name) {
      failure(response, 417, "ValidationError", "Customer Name is required.", "Customer");
      return;
    }
    if (!type) {
      failure(response, 417, "ValidationError", "Customer Type is required.", "Customer");
      return;
    }

    if (createdCustomers.has(name.toLowerCase())) {
      failure(response, 417, "DuplicateEntryError", "A customer with that name already exists.", "Customer");
      return;
    }

    customerCounter += 1;
    const docName = `CUST-${String(customerCounter).padStart(4, "0")}`;
    const creation = new Date().toISOString().slice(0, 19).replace("T", " ");
    const record = {
      name: docName,
      customer_name: name,
      customer_type: type,
      customer_group: String(data.customer_group ?? "").trim(),
      territory: String(data.territory ?? "").trim(),
      owner: email,
      creation,
      values: { ...data },
      verified: true,
    };
    record.user = mockProvisionCustomerUser(data);
    // Customer-side link: `portal_users` ← the same e-mail (mirrors
    // `_link_customer_portal_user`; stays empty when provisioning failed).
    record.portal_users = record.user?.customer_portal_users
      ? [String(data.email_id ?? "").trim().toLowerCase()]
      : [];
    createdCustomers.set(name.toLowerCase(), record);
    createdCustomers.set(docName.toLowerCase(), record);

    // eslint-disable-next-line no-console
    console.log(`[mock-frappe] CUSTOMER CREATED ${docName} (${name}) by ${email}`);

    ok(response, record);
    return;
  }

  // --- Employee expense claim (mirrors shikkha_os.api.v1.expense_claim.*) ---
  if (method === "shikkha_os.api.v1.leads.list_leads") {
    const email = userFor(request);
    const account = email ? DEMO_USERS[email] : null;
    if (!account) {
      failure(response, 401, "AuthenticationError", "Please sign in to continue.", "Not Signed In");
      return;
    }

    // Same shape the backend returns through ok(): the query parameters carry
    // search / status / start / limit for the paged board.
    const { language: _language, ...payload } = crmLeadPayload(url.searchParams);
    ok(response, payload);
    return;
  }

  if (method === "shikkha_os.api.v1.leads.lead_detail") {
    const email = userFor(request);
    const account = email ? DEMO_USERS[email] : null;
    if (!account) {
      failure(response, 401, "AuthenticationError", "Please sign in to continue.", "Not Signed In");
      return;
    }

    const name = (url.searchParams.get("name") || "").trim();
    const payload = name ? crmLeadDetailPayload(name, url.searchParams.get("language")) : null;
    if (!payload) {
      failure(response, 404, "DoesNotExistError", "The lead was not found.", "CRM Lead");
      return;
    }

    ok(response, payload);
    return;
  }

  if (method === "shikkha_os.api.v1.leads.update_lead") {
    const email = userFor(request);
    const account = email ? DEMO_USERS[email] : null;
    if (!account) {
      failure(response, 401, "AuthenticationError", "Please sign in to continue.", "Not Signed In");
      return;
    }

    const body = await readBody(request);
    // Body-only kwargs, like Frappe.
    const name = String(body.name ?? "").trim();
    const row = crmLeads.find((lead) => lead.name === name);
    if (!row) {
      failure(response, 404, "DoesNotExistError", "The lead was not found.", "CRM Lead");
      return;
    }

    let updates = body.updates;
    if (typeof updates === "string") {
      try {
        updates = JSON.parse(updates);
      } catch {
        updates = null;
      }
    }
    if (!updates || typeof updates !== "object" || Array.isArray(updates)) {
      failure(response, 417, "ValidationError", "There is nothing to save.", "CRM Lead");
      return;
    }

    const changed = {};
    for (const [field, value] of Object.entries(updates)) {
      const target = CRM_LEAD_WRITE_MAP[field];
      if (!target) continue; // unknown fields are ignored, like the ERP whitelist
      const text = value === null || value === undefined ? "" : String(value).trim();
      row[target] = text;
      changed[field] = text;
    }

    if (Object.keys(changed).length === 0) {
      failure(response, 417, "ValidationError", "There is nothing to save.", "CRM Lead");
      return;
    }

    if (changed.first_name !== undefined || changed.last_name !== undefined) {
      const next = [row.first_name, row.last_name].filter((part) => String(part ?? "").trim());
      if (next.length > 0) row.lead_name = next.join(" ").trim();
    }

    ok(response, { updated: changed, lead: row.name });
    return;
  }

  if (method === "shikkha_os.api.v1.leads.get_task_options") {
    const email = userFor(request);
    const account = email ? DEMO_USERS[email] : null;
    if (!account) {
      failure(response, 401, "AuthenticationError", "Please sign in to continue.", "Not Signed In");
      return;
    }

    const bn = String(url.searchParams.get("language") || "bn").toLowerCase().startsWith("bn");
    const t = (en, bnText) => (bn ? bnText : en);
    ok(response, {
      priorities: crmTaskPriorityOptions(t),
      statuses: crmTaskStatusOptions(t),
      status_default: "Todo",
      employees: crmTaskEmployees,
      available: true,
    });
    return;
  }

  if (method === "shikkha_os.api.v1.leads.add_lead_task") {
    const email = userFor(request);
    const account = email ? DEMO_USERS[email] : null;
    if (!account) {
      failure(response, 401, "AuthenticationError", "Please sign in to continue.", "Not Signed In");
      return;
    }

    const body = await readBody(request);
    // Body-only kwargs, like Frappe.
    const leadName = String(body.name ?? "").trim();
    const row = crmLeads.find((lead) => lead.name === leadName);
    if (!row) {
      failure(response, 404, "DoesNotExistError", "The lead was not found.", "CRM Lead");
      return;
    }

    let task = body.task;
    if (typeof task === "string") {
      try {
        task = JSON.parse(task);
      } catch {
        task = null;
      }
    }
    if (!task || typeof task !== "object" || Array.isArray(task)) {
      failure(response, 417, "ValidationError", "Give the task a title.", "CRM Task");
      return;
    }

    const title = String(task.title ?? "").trim().replace(/\s+/g, " ");
    if (!title) {
      failure(response, 417, "ValidationError", "Give the task a title.", "CRM Task");
      return;
    }
    if (title.length > 140) {
      failure(response, 417, "ValidationError", "The task title is too long.", "CRM Task");
      return;
    }

    const priority = ["High", "Medium", "Low"].includes(
      String(task.priority ?? "").trim().replace(/^./, (c) => c.toUpperCase())
    )
      ? String(task.priority).trim().replace(/^./, (c) => c.toUpperCase())
      : "";

    let assignedTo = "";
    let assignedLabel = "";
    const employeeId = String(task.assigned_to ?? "").trim();
    if (employeeId) {
      const employee = crmTaskEmployees.find((item) => item.value === employeeId);
      if (employee) {
        // Employee without a linked User stays unassigned, like the ERP endpoint.
        assignedLabel = employee.user ? employee.label : "";
        assignedTo = employee.user || "";
      }
    }

    const rawStatus = String(task.status ?? "")
      .trim()
      .replace(/\s+/g, " ")
      .toLowerCase();
    const status = crmTaskStatuses.find((item) => item.toLowerCase() === rawStatus) || "Todo";

    const dueDate = String(task.due_date ?? "").trim();
    const at = new Date().toISOString().replace("T", " ").slice(0, 19);
    const created = {
      name: `CRM-TASK-${String(crmLeadTaskCounter++).padStart(5, "0")}`,
      title,
      status,
      priority,
      assigned_to: assignedTo,
      assigned_label: assignedLabel,
      due_date: /^\d{4}-\d{2}-\d{2}$/.test(dueDate) ? dueDate : "",
      at,
    };

    const list = crmLeadTasks.get(leadName) || [];
    list.unshift(created);
    crmLeadTasks.set(leadName, list);

    ok(response, {
      task: {
        key: created.name,
        title: created.title,
        status: created.status,
        priority: created.priority,
        assigned_to: created.assigned_to,
        assigned_label: created.assigned_label,
        due_date: created.due_date,
        at: created.at,
      },
      lead: leadName,
    });
    return;
  }

  if (method === "shikkha_os.api.v1.leads.add_lead_note") {
    const email = userFor(request);
    const account = email ? DEMO_USERS[email] : null;
    if (!account) {
      failure(response, 401, "AuthenticationError", "Please sign in to continue.", "Not Signed In");
      return;
    }

    const body = await readBody(request);
    // Body-only kwargs, like Frappe.
    const leadName = String(body.name ?? "").trim();
    const row = crmLeads.find((lead) => lead.name === leadName);
    if (!row) {
      failure(response, 404, "DoesNotExistError", "The lead was not found.", "CRM Lead");
      return;
    }

    let note = body.note;
    if (typeof note === "string") {
      try {
        note = JSON.parse(note);
      } catch {
        note = null;
      }
    }
    if (!note || typeof note !== "object" || Array.isArray(note)) {
      failure(response, 417, "ValidationError", "Give the note a title.", "FCRM Note");
      return;
    }

    const title = String(note.title ?? "").trim().replace(/\s+/g, " ");
    if (!title) {
      failure(response, 417, "ValidationError", "Give the note a title.", "FCRM Note");
      return;
    }
    if (title.length > 140) {
      failure(response, 417, "ValidationError", "The note title is too long.", "FCRM Note");
      return;
    }

    const content = String(note.content ?? "");
    // Preview text for the list row: tags stripped, entities left as written.
    const preview = content
      .replace(/<(br|\/p|\/div|\/li|\/h[1-6])[^>]*>/gi, "\n")
      .replace(/<[^>]*>/g, "")
      .replace(/\n{2,}/g, "\n")
      .trim();

    const at = new Date().toISOString().replace("T", " ").slice(0, 19);
    const noteName = `CRM-NOTE-${String(crmNoteCounter++).padStart(5, "0")}`;
    const entry = {
      key: `note:${noteName}`,
      kind: "note",
      actor: account.full_name || account.profile?.full_name || account.name || "Portal user",
      actor_email: email,
      actor_image: "",
      text: title,
      body: preview,
      at,
      updated: at,
      note: noteName,
      pinned: 0,
    };

    const list = crmLeadExtraNotes.get(leadName) || [];
    list.unshift(entry);
    crmLeadExtraNotes.set(leadName, list);

    ok(response, { note: entry, lead: leadName });
    return;
  }

  if (method === "shikkha_os.api.v1.leads.add_lead_comment") {
    const email = userFor(request);
    const account = email ? DEMO_USERS[email] : null;
    if (!account) {
      failure(response, 401, "AuthenticationError", "Please sign in to continue.", "Not Signed In");
      return;
    }

    const body = await readBody(request);
    // Frappe binds a POST's kwargs from the request body only — a name that
    // rides solely in the query string never reaches the endpoint, so mirror
    // that strictness here rather than reading searchParams.
    const name = String(body.name ?? "").trim();
    const row = crmLeads.find((lead) => lead.name === name);
    const content = String(body.content ?? "").trim();
    if (!row) {
      failure(response, 404, "DoesNotExistError", "The lead was not found.", "CRM Lead");
      return;
    }
    if (!content) {
      failure(response, 417, "ValidationError", "The comment cannot be empty.", "CRM Lead");
      return;
    }

    const extra = {
      key: `comment:${Date.now()}`,
      kind: "comment",
      actor: String(account.full_name || (account.profile && account.profile.full_name) || account.name || email),
      actor_email: email,
      actor_image: "",
      text: String(body.language || "bn").toLowerCase().startsWith("bn")
        ? "একটি মন্তব্য যোগ করেছেন"
        : "added a comment",
      body: content,
      at: new Date().toISOString().replace("T", " ").slice(0, 19),
    };
    const bucket = crmLeadExtraComments.get(name) || [];
    bucket.push(extra);
    crmLeadExtraComments.set(name, bucket);

    ok(response, { comment: extra.key });
    return;
  }

  // The comment box's paperclip: a PUBLIC File (is_private=0) plus the comment
  // whose HTML embeds the picture — mirrors add_lead_comment_attachment.
  if (method === "shikkha_os.api.v1.leads.add_lead_comment_attachment") {
    const email = userFor(request);
    const account = email ? DEMO_USERS[email] : null;
    if (!account) {
      failure(response, 401, "AuthenticationError", "Please sign in to continue.", "Not Signed In");
      return;
    }

    const body = await readBody(request);
    const name = String(body.name ?? "").trim();
    const row = crmLeads.find((lead) => lead.name === name);
    if (!row) {
      failure(response, 404, "DoesNotExistError", "The lead was not found.", "CRM Lead");
      return;
    }

    const text = String(body.content ?? "").replace(/<[^>]*>/g, "").trim();
    const fileName = String(body.file_name ?? "").trim();
    const base64 = String(body.content_base64 ?? "").replace(/\s+/g, "");

    let file = null;
    if (base64) {
      const bytes = Buffer.from(base64, "base64");
      if (!bytes.length) {
        failure(response, 417, "ValidationError", "The file is empty.", "CRM Lead");
        return;
      }
      if (bytes.length > 5 * 1024 * 1024) {
        failure(response, 417, "ValidationError", "The file cannot be larger than 5 MB.", "CRM Lead");
        return;
      }

      const safe = (fileName || "attachment").replace(/[^\w.\- ()]+/g, "_").replace(/^\.+/, "") || "attachment";
      const url = `/files/${safe}`;
      hdFileBytes.set(url, bytes);
      // Let the file server hand these bytes back like a stored upload.
      crmLeadSeedFilePaths.add(url);

      file = {
        key: `file:${Date.now()}`,
        file_name: safe,
        file_url: url,
        file_size: bytes.length,
        at: new Date().toISOString(),
        is_private: 0,
      };
      const files = crmLeadExtraFiles.get(name) || [];
      files.push({ ...file });
      crmLeadExtraFiles.set(name, files);
    }

    if (!text && !file) {
      failure(response, 417, "ValidationError", "Add a comment or attach a file.", "CRM Lead");
      return;
    }

    const extra = {
      key: `comment:${Date.now()}:file`,
      kind: "comment",
      actor: String(account.full_name || (account.profile && account.profile.full_name) || account.name || email),
      actor_email: email,
      actor_image: "",
      text: String(body.language || "bn").toLowerCase().startsWith("bn")
        ? "একটি মন্তব্য যোগ করেছেন"
        : "added a comment",
      body: text,
      at: new Date().toISOString(),
      images: file ? [file.file_url] : [],
    };
    const bucket = crmLeadExtraComments.get(name) || [];
    bucket.push(extra);
    crmLeadExtraComments.set(name, bucket);

    ok(response, {
      comment: extra.key,
      file,
      images: file ? [file.file_url] : [],
    });
    return;
  }

  if (method === "shikkha_os.api.v1.leads.add_lead_attachment") {
    const email = userFor(request);
    const account = email ? DEMO_USERS[email] : null;
    if (!account) {
      failure(response, 401, "AuthenticationError", "Please sign in to continue.", "Not Signed In");
      return;
    }

    const body = await readBody(request);
    // POST kwargs come from the body on real Frappe — body only here too.
    const name = String(body.name ?? "").trim();
    const row = crmLeads.find((lead) => lead.name === name);
    if (!row) {
      failure(response, 404, "DoesNotExistError", "The lead was not found.", "CRM Lead");
      return;
    }

    const fileName = String(body.file_name ?? "").trim();
    const contentBase64 = String(body.content_base64 ?? "").trim();
    if (!fileName || !contentBase64) {
      failure(response, 417, "ValidationError", "No file was received.", "CRM Lead");
      return;
    }
    const size = Math.floor((contentBase64.length * 3) / 4);
    if (size > 5 * 1024 * 1024) {
      failure(response, 417, "ValidationError", "The file cannot be larger than 5 MB.", "CRM Lead");
      return;
    }

    const key = `FILE-${String(crmLeadExtraFiles.get(name)?.length ?? 0) + 1}-${Date.now()}`;
    const attachment = {
      key,
      file_name: fileName,
      file_url: `/private/files/${fileName}`,
      file_size: size,
      at: new Date().toISOString().replace("T", " ").slice(0, 19),
    };
    const bucket = crmLeadExtraFiles.get(name) || [];
    bucket.unshift(attachment);
    crmLeadExtraFiles.set(name, bucket);

    ok(response, { attachment: { name: key, file_name: fileName, file_url: attachment.file_url, file_size: size } });
    return;
  }

  if (method === "shikkha_os.api.v1.expense_claim.form_schema") {
    const email = userFor(request);
    const account = email ? DEMO_USERS[email] : null;
    if (!account || account.kind !== "staff") {
      failure(response, 403, "PermissionError", "You do not have permission to create Expense Claims.", "Expense Claim");
      return;
    }
    const employee = employeeFor(email);
    if (!employee) {
      failure(response, 403, "PermissionError", "No Employee record is linked to your account. Please contact an HR administrator.", "Expense Claim");
      return;
    }
    ok(response, {
      doctype: "Expense Claim",
      title: "Expense Claim",
      sections: EXPENSE_PARENT_SECTIONS,
      child: { doctype: "Expense Claim Detail", fields: EXPENSE_CHILD_FIELDS },
      auto: expenseAuto(email, employee),
      meta: { title_field: "name", search_fields: ["employee"] },
    });
    return;
  }

  if (method === "shikkha_os.api.v1.expense_claim.link_options") {
    const email = userFor(request);
    const account = email ? DEMO_USERS[email] : null;
    if (!account || account.kind !== "staff") {
      failure(response, 403, "PermissionError", "You do not have permission to create Expense Claims.", "Expense Claim");
      return;
    }
    const target = (url.searchParams.get("doctype") ?? "").trim();
    const txt = (url.searchParams.get("txt") ?? "").trim().toLowerCase();

    if (!Object.prototype.hasOwnProperty.call(EXPENSE_LINK_OPTIONS, target)) {
      failure(response, 400, "ValidationError", "Unsupported link DocType.", "Expense Claim");
      return;
    }

    const options = EXPENSE_LINK_OPTIONS[target]
      .filter((value) => !txt || value.toLowerCase().includes(txt))
      .map((value) => ({ value, label: value }));

    ok(response, { doctype: target, options });
    return;
  }

  if (method === "shikkha_os.api.v1.expense_claim.list_mine") {
    const email = userFor(request);
    const account = email ? DEMO_USERS[email] : null;
    if (!account || account.kind !== "staff") {
      failure(response, 403, "PermissionError", "You do not have permission to view Expense Claims.", "Expense Claim");
      return;
    }
    const employee = employeeFor(email);
    if (!employee) {
      ok(response, {
        doctype: "Expense Claim",
        linked: false,
        claims: [],
        summary: expenseSummary([], ""),
      });
      return;
    }

    const mine = expenseClaims
      .filter((row) => row.employee === employee.name)
      .sort((a, b) => {
        // Mirror the backend: newest posting_date first, then newest creation.
        const byDate = String(b.posting_date).localeCompare(String(a.posting_date));
        if (byDate !== 0) return byDate;
        return String(b.creation).localeCompare(String(a.creation));
      });
    const claims = mine.map(expenseRowPayload);
    const currency = (claims.find((c) => c.currency) || {}).currency || "BDT";

    ok(response, {
      doctype: "Expense Claim",
      linked: true,
      employee,
      claims,
      summary: expenseSummary(mine, currency),
    });
    return;
  }

  if (method === "shikkha_os.api.v1.expense_claim.details") {
    const email = userFor(request);
    const account = email ? DEMO_USERS[email] : null;
    if (!account || account.kind !== "staff") {
      failure(response, 403, "PermissionError", "You do not have permission to view this Expense Claim.", "Expense Claim");
      return;
    }
    const employee = employeeFor(email);
    if (!employee) {
      failure(response, 403, "PermissionError", "No Employee record is linked to your account. Please contact an HR administrator.", "Expense Claim");
      return;
    }

    const name = (url.searchParams.get("name") ?? "").trim();
    const row = expenseClaims.find((r) => r.name === name);
    if (!row) {
      failure(response, 404, "DoesNotExistError", "This Expense Claim could not be found.", "Expense Claim");
      return;
    }
    // Ownership: refuse to reveal another employee's claim (never trust the name).
    if (row.employee !== employee.name) {
      failure(response, 403, "PermissionError", "You are not permitted to view this Expense Claim.", "Expense Claim");
      return;
    }

    ok(response, { ...expenseRowPayload(row), expenses: row.expenses, verified: true });
    return;
  }

  if (method === "shikkha_os.api.v1.expense_claim.create") {
    if (request.method !== "POST") {
      failure(response, 405, "AuthenticationError", "Method not allowed.", "Not Allowed");
      return;
    }

    const email = userFor(request);
    const account = email ? DEMO_USERS[email] : null;
    if (!account || account.kind !== "staff") {
      failure(response, 403, "PermissionError", "You do not have permission to create Expense Claims.", "Expense Claim");
      return;
    }
    const employee = employeeFor(email);
    if (!employee) {
      failure(response, 403, "PermissionError", "No Employee record is linked to your account. Please contact an HR administrator.", "Expense Claim");
      return;
    }

    const body = await readBody(request);
    const data = body && typeof body.data === "object" && body.data ? body.data : {};
    const rows = Array.isArray(data.expenses) ? data.expenses : [];

    if (rows.length === 0) {
      failure(response, 417, "ValidationError", "Add at least one expense row.", "Expense Claim");
      return;
    }
    const hasValid = rows.some((r) => String(r.expense_type ?? "").trim() && Number(r.amount) > 0);
    if (!hasValid) {
      failure(response, 417, "ValidationError", "Please fill the required details (Expense Type and Amount).", "Expense Claim");
      return;
    }

    expenseClaimCounter += 1;
    const name = `HR-EXP-2026-${String(expenseClaimCounter).padStart(5, "0")}`;
    const total = rows.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
    const postingDate = String(data.posting_date || todayStamp());

    const expenses = rows.map((r) => ({
      expense_date: String(r.expense_date || postingDate),
      expense_type: String(r.expense_type || ""),
      description: String(r.description || ""),
      amount: Number(r.amount) || 0,
      sanctioned_amount: Number(r.sanctioned_amount) || Number(r.amount) || 0,
      cost_center: String(r.cost_center || data.cost_center || ""),
    }));

    const departmentOptions = EXPENSE_LINK_OPTIONS["Department"] || [];
    const requestedDept = String(data.department || "").trim();
    const defaultDept = "Sales - MSL";
    // Mirror the real backend (§10): an explicit, unknown Department is refused
    // outright - the browser can never force an arbitrary string.
    if (requestedDept && !departmentOptions.includes(requestedDept)) {
      failure(response, 417, "ValidationError", "Selected Department is invalid.", "Expense Claim");
      return;
    }
    const department = requestedDept || defaultDept;

    // Mirror the real backend: the portal claim is sanctioned in full, approved
    // and reimbursed at once with one Payment Entry whose paid amount is the
    // claim's base sanctioned amount.
    const sanctioned = total;
    expensePaymentEntryCounter += 1;
    const paymentName = `ACC-PAY-2026-${String(expensePaymentEntryCounter).padStart(5, "0")}`;
    const paymentEntry = {
      name: paymentName,
      doctype: "Payment Entry",
      payment_type: "Pay",
      party_type: "Employee",
      party: employee.name,
      party_name: employee.employee_name,
      company: "Magnetic Solution Limited",
      currency: "BDT",
      paid_amount: sanctioned,
      received_amount: sanctioned,
      paid_from: "Nagad - MSL",
      paid_to: "Creditors - MSL",
      mode_of_payment: "Nagad",
      cost_center: "Main - MSL",
      letter_head: "Company Letterhead - Grey",
      title: employee.name,
      reference_no: name,
      reference_date: postingDate,
      docstatus: 1,
      status: "Submitted",
      total_allocated_amount: sanctioned,
      unallocated_amount: 0,
      references: [
        {
          reference_doctype: "Expense Claim",
          reference_name: name,
          allocated_amount: sanctioned,
          total_amount: sanctioned,
          outstanding_amount: 0,
        },
      ],
      owner: email,
      posting_date: postingDate,
      creation: nowStamp(),
    };
    expensePaymentEntries.push(paymentEntry);

    const record = {
      name,
      employee: employee.name,
      employee_name: employee.employee_name,
      company: "Magnetic Solution Limited",
      department,
      cost_center: String(data.cost_center || "Main - MSL"),
      currency: "BDT",
      posting_date: postingDate,
      expense_approver: email,
      approval_status: "Approved",
      status: "Paid",
      docstatus: 1,
      total_claimed_amount: total,
      total_sanctioned_amount: sanctioned,
      base_total_claimed_amount: total,
      base_total_sanctioned_amount: sanctioned,
      grand_total: sanctioned,
      total_amount_reimbursed: sanctioned,
      is_paid: 1,
      payment_entry: paymentName,
      remark: String(data.remark || ""),
      expenses: expenses.map((row) => ({ ...row, sanctioned_amount: row.sanctioned_amount || row.amount })),
      owner: email,
      creation: nowStamp(),
      modified: nowStamp(),
    };
    expenseClaims.push(record);

    console.log(
      `[mock-frappe] EXPENSE CLAIM CREATED ${name} (${employee.name}) by ${email} -> PAYMENT ENTRY ${paymentName} paid=${sanctioned}`
    );

    ok(response, {
      name,
      employee: employee.name,
      employee_name: employee.employee_name,
      company: record.company,
      currency: record.currency,
      posting_date: postingDate,
      total_claimed_amount: total,
      total_sanctioned_amount: sanctioned,
      base_total_sanctioned_amount: sanctioned,
      status: "Paid",
      approval_status: "Approved",
      docstatus: 1,
      is_paid: true,
      payment_entry: {
        name: paymentName,
        paid_amount: sanctioned,
        currency: "BDT",
        status: "Submitted",
        docstatus: 1,
        reference_name: name,
      },
      payment_error: null,
      owner: email,
      creation: record.creation,
      verified: true,
    });
    return;
  }

  // --- Customer payment history (mirrors shikkha_os.api.v1.payment_entry.*) ---
  if (method === "shikkha_os.api.v1.payment_entry.list_mine") {
    const email = userFor(request);
    if (!email) {
      failure(response, 401, "AuthenticationError", "Please sign in to continue.", "Not Signed In");
      return;
    }
    const customer = linkedCustomers[email];
    if (!customer) {
      // Authenticated, but no Customer is linked to this account: a calm state.
      ok(response, {
        doctype: "Payment Entry",
        linked: false,
        payments: [],
        summary: paymentSummary([], ""),
      });
      return;
    }

    const mine = paymentEntries.filter(
      (row) =>
        row.party_type === "Customer" &&
        row.party === customer.name &&
        // Draft (0) + Submitted (1); Cancelled (2) is never shown.
        (Number(row.docstatus) === 0 || Number(row.docstatus) === 1)
    );
    const payments = mine.map(paymentRowPayload);
    if (process.env.MOCK_PAYMENT_JITTER) {
      // Test aid: make the payload differ on every request so the Smart Reload
      // button can be exercised end-to-end (unchanged vs changed) without
      // restarting the mock or losing the in-memory session.
      paymentListSeq += 1;
      if (payments.length > 0) {
        payments[0].amount = Number(payments[0].amount || 0) + paymentListSeq;
      }
    }
    const currency = (payments.find((p) => p.currency) || {}).currency || "BDT";

    ok(response, {
      doctype: "Payment Entry",
      linked: true,
      customer,
      payments,
      summary: paymentSummary(payments, currency),
    });
    return;
  }

  if (method === "shikkha_os.api.v1.payment_entry.details") {
    const email = userFor(request);
    if (!email) {
      failure(response, 401, "AuthenticationError", "Please sign in to continue.", "Not Signed In");
      return;
    }
    const customer = linkedCustomers[email];
    if (!customer) {
      failure(response, 403, "PermissionError", "You are not permitted to view this payment.", "Payment Entry");
      return;
    }

    const name = (url.searchParams.get("name") ?? "").trim();
    const row = paymentEntries.find((r) => r.name === name);
    if (!row) {
      failure(response, 404, "DoesNotExistError", "This payment could not be found.", "Payment Entry");
      return;
    }
    // Ownership: refuse to reveal another customer's payment (never trust the name).
    if (row.party_type !== "Customer" || row.party !== customer.name) {
      failure(response, 403, "PermissionError", "You are not permitted to view this payment.", "Payment Entry");
      return;
    }
    // Only non-cancelled entries are part of a customer's payment history.
    if (Number(row.docstatus) === 2) {
      failure(response, 404, "ValidationError", "This payment has been cancelled.", "Payment Entry");
      return;
    }

    ok(response, {
      ...paymentRowPayload(row),
      remark: row.remarks || "",
      references: row.references || [],
      verified: true,
    });
    return;
  }

  if (method === "shikkha_os.api.v1.payment_entry.report_error") {
    const email = userFor(request);
    if (!email) {
      failure(response, 401, "AuthenticationError", "Please sign in to continue.", "Not Signed In");
      return;
    }
    // Mirrors shikkha_os.api.v1.payment_entry.report_error: the portal records
    // its own failures so they surface in the ERP Error Log.
    const body = await readBody(request);
    console.log(
      `[mock] payment_entry.report_error from ${email}: ${String(body.context || "")} - ${String(body.message || "")}`
    );
    ok(response, {
      logged: true,
      context: String(body.context || ""),
      message: String(body.message || ""),
    });
    return;
  }

  // --- Manual payment requests (mirrors shikkha_os.api.v1.manual_payment.*) ---
  if (method === "shikkha_os.api.v1.manual_payment.supported_banks") {
    const email = userFor(request);
    if (!email) {
      failure(response, 401, "AuthenticationError", "Please sign in to continue.", "Not Signed In");
      return;
    }
    ok(response, { banks: manualBanks });
    return;
  }

  if (method === "shikkha_os.api.v1.manual_payment.create") {
    const email = userFor(request);
    if (!email) {
      failure(response, 401, "AuthenticationError", "Please sign in to continue.", "Not Signed In");
      return;
    }
    const customer = linkedCustomers[email];
    if (!customer) {
      failure(response, 403, "PermissionError", "No Customer record is linked to your account.", "Payment");
      return;
    }

    const body = await readBody(request);
    const lang = String(body.language || "bn").startsWith("en") ? "en" : "bn";
    const t = (bn, en) => (lang === "en" ? en : bn);

    const rawMethod = String(body.payment_method || "").toLowerCase();
    const canon =
      rawMethod === "bkash" ? "bKash"
      : rawMethod === "rocket" ? "Rocket"
      : rawMethod === "nagad" ? "Nagad"
      : rawMethod === "bank" ? "Bank"
      : "";
    if (!canon) {
      failure(response, 417, "ValidationError", t("পেমেন্টের মাধ্যমে বেছে নিন (bKash, Rocket, Nagad বা ব্যাংক)।", "Choose a payment method (bKash, Rocket, Nagad or Bank)."), "Payment");
      return;
    }
    const amount = Number(body.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      failure(response, 417, "ValidationError", t("সঠিক পরিমাণ লিখুন (০-এর বেশি)।", "Enter a valid amount (greater than 0)."), "Payment");
      return;
    }
    // A receipt image is required for Bank transfers only; wallet transfers
    // (bKash / Rocket / Nagad) carry no proof (mirrors the real endpoint).
    if (canon === "Bank" && !String(body.proof_file_data || "").trim()) {
      failure(response, 417, "ValidationError", t("পেমেন্টের রিসিটের ছবি যোগ করুন।", "Attach the payment receipt image."), "Payment");
      return;
    }

    let reference = "";
    const remarksBits = [canon];
    if (canon === "Bank") {
      const bank = String(body.bank || "").trim();
      if (!bank || !manualBanks.some((b) => b.name === bank)) {
        failure(response, 417, "ValidationError", t("একটি সাপোর্টেড ব্যাংক বেছে নিন।", "Select a supported bank."), "Payment");
        return;
      }
      reference = String(body.transfer_reference || "").trim();
      if (reference.length < 3) {
        failure(response, 417, "ValidationError", t("ট্রান্সফার রেফারেন্স লিখুন।", "Enter the transfer reference."), "Payment");
        return;
      }
      remarksBits.push(`Bank: ${bank}`, `Ref: ${reference}`);
    } else {
      reference = String(body.transaction_id || "").trim();
      if (reference.length < 4) {
        failure(response, 417, "ValidationError", t("ট্রানজেকশন আইডি লিখুন।", "Enter the transaction ID."), "Payment");
        return;
      }
      remarksBits.push(`Sender: ${String(body.sender_mobile || "")}`, `TxID: ${reference}`);
    }

    const dup = paymentEntries.find(
      (r) => r.party === customer.name && r.reference_no === reference && Number(r.docstatus) !== 2
    );
    if (dup) {
      failure(
        response,
        417,
        "DuplicateEntryError",
        t(
          `এই ট্রানজেকশন/রেফারেন্স দিয়ে ইতিমধ্যে একটি পেমেন্ট (${dup.name}) রেকর্ড করা আছে।`,
          `A payment (${dup.name}) for this transaction/reference already exists. Please wait, or contact support.`
        ),
        "Payment"
      );
      return;
    }

    manualPaymentSeq += 1;
    const name = `ACC-PAY-2026-${String(manualPaymentSeq).padStart(5, "0")}`;
    const creation = new Date().toISOString().slice(0, 19).replace("T", " ");
    const note = String(body.note || "").trim();
    const row = {
      name,
      paid_from: "Debtors - MSL",
      paid_to: canon === "Bank" ? "Bank - MSL" : "Cash - MSL",
      contact_person: customer.customer_name,
      contact_email: email,
      total_allocated_amount: 0,
      unallocated_amount: amount,
      posting_date: String(body.payment_date || ""),
      payment_type: "Receive",
      party_type: "Customer",
      party: customer.name,
      party_name: customer.customer_name,
      paid_amount: amount,
      received_amount: amount,
      paid_from_account_currency: "BDT",
      paid_to_account_currency: "BDT",
      mode_of_payment: manualModeByMethod[rawMethod] || canon,
      reference_no: reference,
      reference_date: String(body.payment_date || ""),
      status: "Draft",
      docstatus: 0,
      company: "Magnetic Solution Limited",
      remarks: [remarksBits.join(" · "), note].filter(Boolean).join(" · "),
      references: [],
      creation,
    };
    paymentEntries.unshift(row);

    ok(response, {
      name,
      request_id: name,
      payment_entry: name,
      status: "Draft",
      payment_method: rawMethod,
      mode_of_payment: row.mode_of_payment,
      amount,
      currency: "BDT",
      payment_date: row.posting_date,
      submitted_at: creation,
    });
    return;
  }

  // --- Customer Service Build / Sales Invoice (mirrors shikkha_os.api.v1.sales_invoice.*) ---
  if (method === "shikkha_os.api.v1.sales_invoice.list_mine") {
    const email = userFor(request);
    if (!email) {
      failure(response, 401, "AuthenticationError", "Please sign in to continue.", "Not Signed In");
      return;
    }
    const customer = linkedCustomers[email];
    if (!customer) {
      // Authenticated, but no Customer is linked to this account: a calm state.
      ok(response, {
        doctype: "Sales Invoice",
        linked: false,
        invoices: [],
        summary: invoiceSummary([], ""),
      });
      return;
    }

    const mine = salesInvoices.filter(
      (row) =>
        row.customer === customer.name &&
        // Draft (0) + Submitted (1); Cancelled (2) is never shown.
        (Number(row.docstatus) === 0 || Number(row.docstatus) === 1)
    );
    const invoices = mine.map(invoiceRowPayload);
    const currency = (invoices.find((p) => p.currency) || {}).currency || "BDT";

    ok(response, {
      doctype: "Sales Invoice",
      linked: true,
      customer,
      invoices,
      summary: invoiceSummary(invoices, currency),
    });
    return;
  }

  if (method === "shikkha_os.api.v1.sales_invoice.details") {
    const email = userFor(request);
    if (!email) {
      failure(response, 401, "AuthenticationError", "Please sign in to continue.", "Not Signed In");
      return;
    }
    const customer = linkedCustomers[email];
    if (!customer) {
      failure(response, 403, "PermissionError", "You are not permitted to view this invoice.", "Sales Invoice");
      return;
    }

    const name = (url.searchParams.get("name") ?? "").trim();
    const row = salesInvoices.find((r) => r.name === name);
    if (!row) {
      failure(response, 404, "DoesNotExistError", "This invoice could not be found.", "Sales Invoice");
      return;
    }
    // Ownership: refuse to reveal another customer's invoice (never trust the name).
    if (row.customer !== customer.name) {
      failure(response, 403, "PermissionError", "You are not permitted to view this invoice.", "Sales Invoice");
      return;
    }
    // Only non-cancelled invoices are part of a customer's invoice history.
    if (Number(row.docstatus) === 2) {
      failure(response, 404, "ValidationError", "This invoice has been cancelled.", "Sales Invoice");
      return;
    }

    ok(response, {
      ...invoiceRowPayload(row),
      debit_to: row.debit_to || "",
      base_grand_total: Number(row.base_grand_total || 0),
      base_net_total: Number(row.base_net_total || 0),
      discount_amount: Number(row.discount_amount || 0),
      total_taxes_and_charges: Number(row.total_taxes_and_charges || 0),
      contact_person: row.contact_person || "",
      contact_email: row.contact_email || "",
      territory: row.territory || "",
      tax_id: row.tax_id || "",
      remark: row.remarks || "",
      items: row.items || [],
      verified: true,
    });
    return;
  }

  // --- The portal's own error log --------------------------------------------
  // Mirrors shikkha_os.api.v1.client_log.report: a frontend failure is written
  // into the ERP Error Log. The mock keeps the entries so a probe can read them
  // back at GET /__mock/client-log.
  if (method === "shikkha_os.api.v1.client_log.report") {
    const email = userFor(request);
    const body = await readBody(request);
    const entry = {
      at: new Date().toISOString(),
      email: email ?? "",
      scope: String(body.scope || "client"),
      message: String(body.message || ""),
      page: String(body.page || ""),
      detail: body.detail ?? null,
      userAgent: String(body.user_agent || ""),
    };
    clientLogEntries.push(entry);
    console.log(`[mock] client_log.report ${entry.scope}: ${entry.message.slice(0, 160)}`);
    ok(response, { ok: true });
    return;
  }

  if (method === "shikkha_os.api.v1.sales_invoice.report_error") {
    const email = userFor(request);
    if (!email) {
      failure(response, 401, "AuthenticationError", "Please sign in to continue.", "Not Signed In");
      return;
    }
    // Mirrors shikkha_os.api.v1.sales_invoice.report_error: the portal records
    // its own failures so they surface in the ERP Error Log.
    const body = await readBody(request);
    console.log(
      `[mock] sales_invoice.report_error from ${email}: ${String(body.context || "")} - ${String(body.message || "")}`
    );
    ok(response, {
      logged: true,
      context: String(body.context || ""),
      message: String(body.message || ""),
    });
    return;
  }

  // --- Customer management: list / details / update / delete -----------------
  if (method === "shikkha_os.api.v1.customer.list_mine") {
    const email = userFor(request);
    const account = email ? DEMO_USERS[email] : null;
    const denied = customerGate(account);
    if (denied) {
      failure(response, denied.status, denied.exc, denied.message, "Customer");
      return;
    }
    ok(response, {
      doctype: "Customer",
      count: ownCustomers(email).length,
      customers: ownCustomers(email).map(customerRowPayload),
      verified: true,
    });
    return;
  }

  if (method === "shikkha_os.api.v1.customer.details") {
    const email = userFor(request);
    const account = email ? DEMO_USERS[email] : null;
    const denied = customerGate(account);
    if (denied) {
      failure(response, denied.status, denied.exc, denied.message, "Customer");
      return;
    }
    const record = ownedCustomer(email, (url.searchParams.get("name") ?? "").trim(), response);
    if (!record) return;
    ok(response, {
      doctype: "Customer",
      name: record.name,
      customer_name: record.customer_name,
      owner: record.owner,
      values: { ...(record.values || {}) },
      verified: true,
    });
    return;
  }

  if (method === "shikkha_os.api.v1.customer.update") {
    if (request.method !== "POST") {
      failure(response, 405, "AuthenticationError", "Method not allowed.", "Not Allowed");
      return;
    }
    const email = userFor(request);
    const account = email ? DEMO_USERS[email] : null;
    const denied = customerGate(account);
    if (denied) {
      failure(response, denied.status, denied.exc, denied.message, "Customer");
      return;
    }
    const body = await readBody(request);
    const name = String(body.name ?? "").trim();
    const data = body && typeof body.data === "object" && body.data ? body.data : {};
    const record = ownedCustomer(email, name, response);
    if (!record) return;

    const newName = String(data.customer_name ?? record.customer_name).trim();
    if (
      newName &&
      newName.toLowerCase() !== String(record.customer_name).toLowerCase() &&
      createdCustomers.has(newName.toLowerCase())
    ) {
      failure(response, 417, "DuplicateEntryError", "A customer with that name already exists.", "Customer");
      return;
    }

    record.values = { ...(record.values || {}), ...data };
    const previousNameKey = String(record.customer_name).toLowerCase();
    if (newName) record.customer_name = newName;
    createdCustomers.delete(previousNameKey);
    createdCustomers.set(String(record.customer_name).toLowerCase(), record);
    createdCustomers.set(String(record.name).toLowerCase(), record);
    if (data.customer_type != null) record.customer_type = String(data.customer_type);
    if (data.customer_group != null) record.customer_group = String(data.customer_group);
    if (data.territory != null) record.territory = String(data.territory);

    console.log(`[mock-frappe] CUSTOMER UPDATED ${record.name} by ${email}`);

    ok(response, customerRowPayload(record));
    return;
  }

  if (method === "shikkha_os.api.v1.customer.delete") {
    if (request.method !== "POST") {
      failure(response, 405, "AuthenticationError", "Method not allowed.", "Not Allowed");
      return;
    }
    const email = userFor(request);
    const account = email ? DEMO_USERS[email] : null;
    const denied = customerGate(account);
    if (denied) {
      failure(response, denied.status, denied.exc, denied.message, "Customer");
      return;
    }
    const body = await readBody(request);
    const name = String(body.name ?? "").trim();
    const record = ownedCustomer(email, name, response);
    if (!record) return;

    // A customer whose name hints at a transaction is "linked" — demonstrates the
    // friendly 409 the portal renders for a real dependency block.
    if (/invoice|order|linked/i.test(record.customer_name || "")) {
      failure(response, 409, "LinkExistsError", "This customer has linked transactions, so it cannot be deleted.", "Customer");
      return;
    }

    for (const [key, value] of Array.from(createdCustomers.entries())) {
      if (value === record) createdCustomers.delete(key);
    }

    console.log(`[mock-frappe] CUSTOMER DELETED ${record.name} by ${email}`);

    ok(response, { deleted: true, name: record.name, verified: true });
    return;
  }

  // --- Check-in history ------------------------------------------------------
  if (method === "shikkha_os.api.v1.checkin.history") {
    const email = userFor(request);
    const account = email ? DEMO_USERS[email] : null;
    if (!account) {
      failure(response, 403, "PermissionError", "You are not permitted to access this resource. Login to access.", "Method Not Allowed");
      return;
    }
    const employee = employeeFor(email);
    const days = clampDays(url.searchParams.get("days"));
    const fromParam = (url.searchParams.get("from_date") || "").trim();
    const toParam = (url.searchParams.get("to_date") || "").trim();
    const range = resolveRange(fromParam, toParam, days, response);
    if (!range) return; // invalid range -> already answered
    if (!employee) {
      ok(response, {
        doctype: "Employee Checkin",
        linked: false,
        employee: null,
        filtered: range.filtered,
        window_days: range.windowDays,
        max_range_days: 31,
        days: [],
        from_date: range.from,
        to_date: range.to,
        server_time: nowStamp(),
      });
      return;
    }
    ok(response, {
      doctype: "Employee Checkin",
      linked: true,
      employee,
      filtered: range.filtered,
      window_days: range.windowDays,
      max_range_days: 31,
      days: range.filtered
        ? checkinDaysBetween(employee.name, range.from, range.to)
        : recentCheckinDays(employee.name, range.windowDays),
      from_date: range.from,
      to_date: range.to,
      server_time: nowStamp(),
    });
    return;
  }

  function clampDays(value) {
    const n = Number(value);
    return Number.isFinite(n) ? Math.max(1, Math.min(Math.trunc(n), 31)) : 10;
  }

  function ownCustomers(email) {
    const unique = new Map();
    for (const record of createdCustomers.values()) unique.set(record.name, record);
    return Array.from(unique.values()).filter((record) => record.owner === email);
  }

  function customerRowPayload(record) {
    return {
      name: record.name,
      customer_name: record.customer_name || "",
      customer_type: record.customer_type || "",
      customer_group: record.customer_group || "",
      territory: record.territory || "",
      mobile_no: (record.values && record.values.mobile_no) || "",
      email_id: (record.values && record.values.email_id) || "",
      creation: record.creation || "",
      owner: record.owner || "",
    };
  }

  function ownedCustomer(email, name, response) {
    const unique = new Map();
    for (const record of createdCustomers.values()) unique.set(record.name, record);
    const list = Array.from(unique.values());
    const record =
      list.find((r) => r.name === name) ||
      list.find((r) => String(r.customer_name).toLowerCase() === name.toLowerCase());
    if (!name || !record) {
      failure(response, 404, "DoesNotExistError", "This customer could not be found.", "Customer");
      return null;
    }
    if (record.owner !== email) {
      failure(response, 403, "PermissionError", "This customer was not created by you, so it cannot be edited or deleted.", "Customer");
      return null;
    }
    return record;
  }

  function offsetFromToday(daysAgo) {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return date;
  }

  // Local (not UTC) calendar date, so the window matches the seeded timestamps.
  function localISO(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
      date.getDate()
    ).padStart(2, "0")}`;
  }

  function dayPayloadFor(employee, date) {
    const punches = checkinRecords
      .filter((row) => row.employee === employee && String(row.time).slice(0, 10) === date)
      .map((row) => ({ log_type: String(row.log_type || "").toUpperCase(), time: row.time }));
    const ins = punches.filter((p) => p.log_type === "IN");
    const outs = punches.filter((p) => p.log_type === "OUT");
    return {
      date,
      punches,
      first_in: ins.length ? ins[0].time : null,
      last_out: outs.length ? outs[outs.length - 1].time : null,
      in_count: ins.length,
      out_count: outs.length,
      total: punches.length,
    };
  }

  function recentCheckinDays(employee, days) {
    const out = [];
    for (let offset = 0; offset < days; offset += 1) {
      out.push(dayPayloadFor(employee, localISO(offsetFromToday(offset))));
    }
    return out; // newest day first
  }

  function checkinDaysBetween(employee, fromISO, toISO) {
    const out = [];
    const start = new Date(`${fromISO}T00:00:00Z`);
    const end = new Date(`${toISO}T00:00:00Z`);
    const span = Math.round((end.getTime() - start.getTime()) / 86400000) + 1;
    for (let i = 0; i < span; i += 1) {
      out.push(dayPayloadFor(employee, localISO(new Date(end.getTime() - i * 86400000))));
    }
    return out; // newest day first
  }

  // Resolve the requested window. Mirrors the backend: an explicit From/To pair
  // is validated (malformed / inverted / oversized are refused); otherwise the
  // rolling `days` window is used. Returns null after answering a bad request.
  function resolveRange(fromParam, toParam, days, response) {
    const hasFrom = Boolean(fromParam);
    const hasTo = Boolean(toParam);
    if (hasFrom || hasTo) {
      const valid = (v) => /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(new Date(`${v}T00:00:00Z`).getTime());
      if (!hasFrom || !hasTo || !valid(fromParam) || !valid(toParam)) {
        failure(response, 417, "ValidationError", "Both dates are required, and the start date cannot be after the end date.", "Check In / Out");
        return null;
      }
      const start = new Date(`${fromParam}T00:00:00Z`);
      const end = new Date(`${toParam}T00:00:00Z`);
      if (start > end) {
        failure(response, 417, "ValidationError", "Both dates are required, and the start date cannot be after the end date.", "Check In / Out");
        return null;
      }
      const span = Math.round((end.getTime() - start.getTime()) / 86400000) + 1;
      if (span > 31) {
        failure(response, 417, "ValidationError", "The date range can be at most 31 days.", "Check In / Out");
        return null;
      }
      return { filtered: true, windowDays: span, from: fromParam, to: toParam };
    }
    return {
      filtered: false,
      windowDays: days,
      from: localISO(offsetFromToday(days - 1)),
      to: localISO(new Date()),
    };
  }

  failure(response, 417, "ValidationError", `Failed to get method for command ${method}`, "Method Not Found");
});

server.listen(PORT, "127.0.0.1", () => {
  // eslint-disable-next-line no-console
  console.log(`mock-frappe listening on http://127.0.0.1:${PORT}`);
});
