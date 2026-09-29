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

/** A real (tiny) PNG so the account menu has a picture to load. */
const AVATAR_PATH = "/files/tamim-hasan.png";
const AVATAR_BYTES = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAIAAAAlC+aJAAAAUElEQVR42u3PQQkAAAgEsGthGhvZ/20E38JgBZbqeS0CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApcF12UAtbfzEQsAAAAASUVORK5CYII=",
  "base64"
);

const sessions = new Map();

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
};

function redirectFor(account) {
  return account.profile.dashboard_route;
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
  const stamp = new Date().toISOString().slice(0, 19).replace("T", " ");
  const profile = account.profile;
  const staff = account.kind === "staff";

  const personalStats = [
    { key: "roles", label: "Roles", value: profile.roles.length, icon: "badge", hint: "Roles assigned to your account", scope: "personal" },
    { key: "signins", label: "Sign-ins (7 days)", value: 12, icon: "shield", hint: "Successful sign-ins recorded for your account", scope: "personal" },
    { key: "sessions", label: "Active Sessions", value: 1, icon: "device", hint: "Devices currently holding a session for you", scope: "personal" },
  ];

  const siteStats = [
    { key: "users", label: "Active Users", value: 184, icon: "users", hint: "Enabled user accounts", scope: "site" },
    { key: "customers", label: "Customers", value: 1268, icon: "customer", hint: "Active customer records", scope: "site" },
    { key: "items", label: "Items", value: 342, icon: "box", hint: "Active item master records", scope: "site" },
    { key: "employees", label: "Employees", value: 57, icon: "badge", hint: "Active employees", scope: "site" },
    { key: "invoices", label: "Invoices (30 days)", value: 903, icon: "receipt", hint: "Submitted in the last 30 days", scope: "site" },
  ];

  const rows = [
    { label: "Full Name", value: profile.full_name },
    { label: "Email", value: profile.email },
  ];

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
          { name: "SHIKKHA-AUD-2026-00008", event: "login_success", status: "Success", creation: stamp, client_ip: "103.15.20.4" },
          { name: "SHIKKHA-AUD-2026-00007", event: "session_probe", status: "Success", creation: stamp, client_ip: "103.15.20.4" },
          { name: "SHIKKHA-AUD-2026-00006", event: "login_failed", status: "Failed", creation: stamp, client_ip: "45.126.7.9" },
          { name: "SHIKKHA-AUD-2026-00005", event: "logout", status: "Success", creation: stamp, client_ip: "103.15.20.4" },
        ]
      : [
          { name: "SHIKKHA-AUD-2026-00004", event: "login_success", status: "Success", creation: stamp, client_ip: "103.15.20.4" },
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

const server = createServer(async (request, response) => {
  const url = new URL(request.url ?? "/", `http://127.0.0.1:${PORT}`);
  const method = url.pathname.replace(/^\/api\/method\//, "");

  // The user picture the portal proxies through /api/auth/avatar.
  if (url.pathname === AVATAR_PATH) {
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
      version: "1.3.1",
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
    pendingRegistrations.set(email, { code, attempts: 0, expires: Date.now() + 600_000 });

    // eslint-disable-next-line no-console
    console.log(`[mock-frappe] OTP ${email} = ${code}`);

    ok(response, {
      sent: true,
      email: maskEmail(email),
      mobile: maskMobile(mobile),
      delivery: { sms: true, email: true },
      expires_in_seconds: 600,
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
    pendingLoginOtps.set(email, { code, attempts: 0, expires: Date.now() + 600_000 });

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
      expires_in_seconds: 600,
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
    pendingResetOtps.set(found.email, { code, attempts: 0, channel, expires: Date.now() + 600_000 });

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
      expires_in_seconds: 600,
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

    if (!changed.length && !hasImage) {
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

    pendingProfileOtps.set(email, { code, attempts: 0, values, expires: Date.now() + 10 * 60 * 1000 });

    // eslint-disable-next-line no-console
    console.log(`[mock-frappe] PROFILE OTP ${email} = ${code}`);

    ok(response, {
      sent: true,
      target: maskEmail(email),
      email: maskEmail(email),
      mobile: maskMobile(mobileNo),
      delivery: { sms: true, email: true, sms_code: "sent", email_code: "sent" },
      expires_in_seconds: 600,
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
    if (typeof pending.values.user_image === "string" && pending.values.user_image.trim()) {
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

  failure(response, 417, "ValidationError", `Failed to get method for command ${method}`, "Method Not Found");
});

server.listen(PORT, "127.0.0.1", () => {
  // eslint-disable-next-line no-console
  console.log(`mock-frappe listening on http://127.0.0.1:${PORT}`);
});
