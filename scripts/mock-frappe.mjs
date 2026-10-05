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
const expenseClaims = [];
let expenseClaimCounter = 1;

function displayStatus(row) {
  const docstatus = Number(row.docstatus || 0);
  const approval = String(row.approval_status || "").toLowerCase();
  const status = String(row.status || "").toLowerCase();
  const paid = truthy(row.is_paid);
  if (docstatus === 0 || status === "draft") return "draft";
  if (docstatus === 2 || status === "cancelled") return "cancelled";
  if (approval === "rejected" || status === "rejected") return "rejected";
  if (paid || status === "paid") return "paid";
  if (approval === "approved" || status === "approved") return "approved";
  return "submitted";
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
    grand_total: Number(row.grand_total || 0),
    total_amount_reimbursed: Number(row.total_amount_reimbursed || 0),
    remark: row.remark || "",
    display_status: displayStatus(row),
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
  Currency: ["BDT", "USD", "EUR"],
};

function expenseAuto(user, employee) {
  return {
    employee: employee.name,
    employee_name: employee.employee_name,
    company: "Magnetic Solution Limited",
    department: employee.name === "HR-EMP-00002" ? "Sales" : "Engineering",
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
  department: "Engineering",
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

// Submitted — awaiting approval.
expenseClaims.push({
  name: "HR-EXP-2026-00002",
  employee: "HR-EMP-00001",
  employee_name: "Tamim Hasan Tast",
  company: "Magnetic Solution Limited",
  department: "Engineering",
  cost_center: "Main - MSL",
  currency: "BDT",
  posting_date: "2026-10-03",
  expense_approver: "magneticsolutionltdbd@gmail.com",
  approval_status: "Draft",
  status: "Submitted",
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
  department: "Engineering",
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
  department: "Engineering",
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

// Rejected.
expenseClaims.push({
  name: "HR-EXP-2026-00005",
  employee: "HR-EMP-00001",
  employee_name: "Tamim Hasan Tast",
  company: "Magnetic Solution Limited",
  department: "Engineering",
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
  department: "Engineering",
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

// Keep created claim ids past the seeded range (next create -> HR-EXP-2026-00007).
expenseClaimCounter = 6;

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

const server = createServer(async (request, response) => {
  const url = new URL(request.url ?? "/", `http://127.0.0.1:${PORT}`);
  const method = url.pathname.replace(/^\/api\/method\//, "");

  // The user picture the portal proxies through /api/auth/avatar. Serve any
  // site file path so a changed / uploaded picture resolves too (the real ERP
  // serves these from its own file store).
  if (
    url.pathname === AVATAR_PATH ||
    url.pathname.startsWith("/files/") ||
    url.pathname.startsWith("/private/files/")
  ) {
    response.writeHead(200, {
      "content-type": "image/png",
      "content-length": AVATAR_BYTES.length,
      "cache-control": "no-store",
    });
    response.end(AVATAR_BYTES);
    return;
  }

  if (!url.pathname.startsWith("/api/method/")) {
    response.writeHead(404, { "content-type": "text/plain" });
    response.end("not found");
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
    createdCustomers.set(name.toLowerCase(), record);
    createdCustomers.set(docName.toLowerCase(), record);

    // eslint-disable-next-line no-console
    console.log(`[mock-frappe] CUSTOMER CREATED ${docName} (${name}) by ${email}`);

    ok(response, record);
    return;
  }

  // --- Employee expense claim (mirrors shikkha_os.api.v1.expense_claim.*) ---
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

    const record = {
      name,
      employee: employee.name,
      employee_name: employee.employee_name,
      company: "Magnetic Solution Limited",
      department: employee.name === "HR-EMP-00002" ? "Sales" : "Engineering",
      cost_center: String(data.cost_center || "Main - MSL"),
      currency: "BDT",
      posting_date: postingDate,
      expense_approver: email,
      approval_status: "Draft",
      status: "Draft",
      docstatus: 0,
      total_claimed_amount: total,
      total_sanctioned_amount: total,
      grand_total: total,
      total_amount_reimbursed: 0,
      is_paid: 0,
      remark: String(data.remark || ""),
      expenses,
      owner: email,
      creation: nowStamp(),
      modified: nowStamp(),
    };
    expenseClaims.push(record);

    console.log(`[mock-frappe] EXPENSE CLAIM CREATED ${name} (${employee.name}) by ${email}`);

    ok(response, {
      name,
      employee: employee.name,
      employee_name: employee.employee_name,
      company: record.company,
      currency: record.currency,
      posting_date: postingDate,
      total_claimed_amount: total,
      status: "Draft",
      approval_status: "Draft",
      docstatus: 0,
      is_paid: false,
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
