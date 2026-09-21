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
 *   node scripts/mock-frappe.mjs          # then: FRAPPE_BASE_URL=http://127.0.0.1:8787 npm run dev
 *
 * Never use this in production.
 */
import { randomUUID } from "node:crypto";
import { createServer } from "node:http";

const PORT = Number(process.env.MOCK_FRAPPE_PORT ?? 8787);

const ACCOUNT = { usr: "tamim@ioniccorporation.com", pwd: "demo1234" };

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

const PROFILE = {
  authenticated: true,
  name: ACCOUNT.usr,
  full_name: "Tamim Hasan",
  email: ACCOUNT.usr,
  user_image: "",
  time_zone: "Asia/Dhaka",
  language: "en",
  roles: ["System Manager", "System User"],
  is_admin: true,
  designation: "Junior Developer",
  department: "Engineering",
};

function dashboardPayload() {
  const stamp = new Date().toISOString().slice(0, 19).replace("T", " ");

  return {
    user: PROFILE,
    stats: [
      { key: "roles", label: "Roles", value: 2, icon: "badge", hint: "Roles assigned to your account", scope: "personal" },
      { key: "signins", label: "Sign-ins (7 days)", value: 12, icon: "shield", hint: "Successful sign-ins recorded for your account", scope: "personal" },
      { key: "sessions", label: "Active Sessions", value: 1, icon: "device", hint: "Devices currently holding a session for you", scope: "personal" },
      { key: "users", label: "Active Users", value: 184, icon: "users", hint: "Enabled user accounts", scope: "site" },
      { key: "customers", label: "Customers", value: 1268, icon: "customer", hint: "Active customer records", scope: "site" },
      { key: "items", label: "Items", value: 342, icon: "box", hint: "Active item master records", scope: "site" },
      { key: "employees", label: "Employees", value: 57, icon: "badge", hint: "Active employees", scope: "site" },
      { key: "invoices", label: "Invoices (30 days)", value: 903, icon: "receipt", hint: "Submitted in the last 30 days", scope: "site" },
    ],
    profile: [
      { label: "Full Name", value: "Tamim Hasan" },
      { label: "Email", value: ACCOUNT.usr },
      { label: "Designation", value: "Junior Developer" },
      { label: "Department", value: "Engineering" },
      { label: "Time Zone", value: "Asia/Dhaka" },
    ],
    activity: [
      { name: "SHIKKHA-AUD-2026-00008", event: "login_success", status: "Success", creation: stamp, client_ip: "103.15.20.4" },
      { name: "SHIKKHA-AUD-2026-00007", event: "session_probe", status: "Success", creation: stamp, client_ip: "103.15.20.4" },
      { name: "SHIKKHA-AUD-2026-00006", event: "login_failed", status: "Failed", creation: stamp, client_ip: "45.126.7.9" },
      { name: "SHIKKHA-AUD-2026-00005", event: "logout", status: "Success", creation: stamp, client_ip: "103.15.20.4" },
    ],
    quick_links: [
      { key: "desk", label: "ERP Desk", description: "Open the Frappe desk", icon: "grid", href: "https://dash.example.com/app", external: true },
      { key: "users", label: "Users", description: "Manage user accounts", icon: "users", href: "https://dash.example.com/app/user", external: true },
      { key: "customers", label: "Customers", description: "Customer master records", icon: "customer", href: "https://dash.example.com/app/customer", external: true },
      { key: "items", label: "Items", description: "Item master records", icon: "box", href: "https://dash.example.com/app/item", external: true },
    ],
    system: {
      app: "shikkha_os",
      version: "1.0.0",
      api: "shikkha_os.v1",
      base_url: `http://127.0.0.1:${PORT}`,
      session_expiry_hours: 24,
    },
  };
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url ?? "/", `http://127.0.0.1:${PORT}`);
  const method = url.pathname.replace(/^\/api\/method\//, "");

  if (!url.pathname.startsWith("/api/method/")) {
    response.writeHead(404, { "content-type": "text/plain" });
    response.end("not found");
    return;
  }

  if (method === "shikkha_os.api.v1.health.ping") {
    ok(response, {
      app: "shikkha_os",
      version: "1.0.0",
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

    if (usr !== ACCOUNT.usr || pwd !== ACCOUNT.pwd) {
      failure(response, 401, "AuthenticationError", "Invalid email or password.", "Sign In Failed");
      return;
    }

    const sid = randomUUID().replace(/-/g, "");
    sessions.set(sid, usr);

    ok(
      response,
      {
        authenticated: true,
        user: PROFILE,
        redirect_to: "/userDashboard",
        session_expiry_seconds: 86400,
      },
      {
        "set-cookie": [
          `sid=${sid}; Path=/; HttpOnly; SameSite=Lax`,
          "full_name=Tamim%20Hasan; Path=/",
        ],
      }
    );
    return;
  }

  if (method === "shikkha_os.api.v1.auth.session") {
    const user = userFor(request);

    ok(
      response,
      user
        ? { authenticated: true, user: PROFILE, redirect_to: "/userDashboard", session_expiry_seconds: 86400 }
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
    if (!userFor(request)) {
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

    ok(response, dashboardPayload());
    return;
  }

  failure(response, 417, "ValidationError", `Failed to get method for command ${method}`, "Method Not Found");
});

server.listen(PORT, "127.0.0.1", () => {
  // eslint-disable-next-line no-console
  console.log(`mock-frappe listening on http://127.0.0.1:${PORT}`);
});
