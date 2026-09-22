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
      version: "1.1.2",
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
      version: "1.1.2",
      endpoints: [
        "shikkha_os.api.v1.auth.login",
        "shikkha_os.api.v1.auth.logout",
        "shikkha_os.api.v1.auth.session",
        "shikkha_os.api.v1.dashboard.overview",
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

  failure(response, 417, "ValidationError", `Failed to get method for command ${method}`, "Method Not Found");
});

server.listen(PORT, "127.0.0.1", () => {
  // eslint-disable-next-line no-console
  console.log(`mock-frappe listening on http://127.0.0.1:${PORT}`);
});
