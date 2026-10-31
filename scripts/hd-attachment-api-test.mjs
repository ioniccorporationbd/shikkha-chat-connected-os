/**
 * Backend attachment-contract test for the Help Desk portal.
 *
 * Runs against `scripts/mock-frappe.mjs`, which now mirrors the real ERP rules
 * (see `shikkha_os/api/v1/attachment_rules.py`): an upload is a private `File`
 * row owned by the caller, only *unattached* rows can be claimed by a ticket or
 * a comment, foreign/claimed URLs are refused, identical re-uploads reuse the
 * row, and a create that never produced a ticket discards its own uploads.
 *
 *   node scripts/mock-frappe.mjs &            # terminal 1
 *   node scripts/hd-attachment-api-test.mjs   # terminal 2
 *
 * Proves: HD Ticket mapping (attached_to_doctype / attached_to_name), ownership
 * isolation, comment-level attachment reference, duplicate suppression and
 * orphan cleanup — everything except the live ERP itself.
 */
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";

const BASE = process.env.MOCK_BASE ?? "http://127.0.0.1:8787";
const LOG = process.env.MOCK_LOG ?? "/tmp/mock_frappe.log";
const PASSWORD = process.env.MOCK_PASSWORD ?? "demo1234";
const CLIENT = "client@example.com";
const STAFF = "tamim@ioniccorporation.com";
const PIC = process.env.PIC ?? "/tmp/hd13_pic.png";

let pass = 0;
const failures = [];
function check(name, condition, detail = "") {
  if (condition) {
    pass += 1;
    console.log(`  ✓ ${name}`);
  } else {
    failures.push(`${name}${detail ? ` — ${detail}` : ""}`);
    console.log(`  ✗ ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

async function post(method, body, cookie) {
  const response = await fetch(`${BASE}/api/method/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json", ...(cookie ? { cookie } : {}) },
    body: JSON.stringify(body),
  });
  const text = await response.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text.slice(0, 300) };
  }
  return { status: response.status, json, headers: response.headers };
}

/** Frappe nests payloads as {message:{api,ok,data}}; the mock mirrors that. */
function unwrap(json) {
  return json?.message?.data ?? json?.data ?? json?.message ?? json ?? {};
}

function readOtp(identifier, seenBefore) {
  const log = readFileSync(LOG, "utf8");
  const pattern = new RegExp(`LOGIN OTP ${identifier.replace(/\./g, "\\.")} = (\\d{6})`, "g");
  const matches = [...log.matchAll(pattern)];
  if (matches.length <= seenBefore) return null;
  return matches[matches.length - 1][1];
}

async function login(identifier) {
  const before = (() => {
    try {
      return [...readFileSync(LOG, "utf8").matchAll(new RegExp(`LOGIN OTP ${identifier.replace(/\./g, "\\.")} =`, "g"))].length;
    } catch {
      return 0;
    }
  })();
  const sent = await post("shikkha_os.api.v1.auth.send_login_otp", { identifier, password: PASSWORD });
  if (sent.status !== 200) throw new Error(`send_login_otp ${identifier} -> ${sent.status} ${JSON.stringify(sent.json).slice(0, 200)}`);
  let code = null;
  for (let i = 0; i < 40 && !code; i += 1) {
    code = readOtp(identifier, before);
    if (!code) await new Promise((resolve) => setTimeout(resolve, 150));
  }
  if (!code) throw new Error(`no OTP logged for ${identifier}`);
  const verified = await post("shikkha_os.api.v1.auth.verify_login_otp", { identifier, otp: code });
  if (verified.status !== 200) throw new Error(`verify_login_otp ${identifier} -> ${verified.status}`);
  const raw = verified.headers.getSetCookie?.()[0] ?? verified.headers.get("set-cookie") ?? "";
  const cookie = raw.split(";")[0];
  if (!cookie.startsWith("sid=")) throw new Error(`no session cookie for ${identifier}`);
  return cookie;
}

async function upload(cookie, name, bytes) {
  const response = await post(
    "shikkha_os.api.v1.help_desk.upload_attachment",
    { file_name: name, content: bytes.toString("base64") },
    cookie,
  );
  if (response.status !== 200) throw new Error(`upload ${name} -> ${response.status} ${JSON.stringify(response.json).slice(0, 200)}`);
  return unwrap(response.json);
}

async function filesFor(url) {
  const response = await fetch(`${BASE}/__mock/files`);
  const { files } = await response.json();
  return files.filter((row) => row.file_url === url);
}

async function createTicket(cookie, { subject, attachments, description }) {
  const response = await post(
    "shikkha_os.api.v1.help_desk.create_ticket",
    {
      subject,
      ticketType: "Technical",
      priority: "medium",
      description: description ?? `Attachment contract check ${randomUUID().slice(0, 8)} - the printer stops responding every time.`,
      department: "Support",
      contact: { name: "Nusrat Jahan", email: CLIENT, mobile: "01712345678", preferredContact: "email" },
      attachments,
      language: "bn",
    },
    cookie,
  );
  return { status: response.status, payload: unwrap(response.json) };
}

async function reply(cookie, ticket, { message, attachments }) {
  const response = await post(
    "shikkha_os.api.v1.help_desk_messages.send_message",
    { name: ticket, message, attachments, language: "bn" },
    cookie,
  );
  return { status: response.status, payload: unwrap(response.json) };
}

async function main() {
  const bytes = readFileSync(PIC);
  console.log(`Backend attachment contract — ${BASE}`);

  const client = await login(CLIENT);
  const staff = await login(STAFF);
  console.log("  · logged in as customer and support");

  // 1. Upload creates one private, unattached File row.
  const first = await upload(client, "hd13_pic.png", bytes);
  const firstRows = await filesFor(first.url);
  check("upload returns a url", typeof first.url === "string" && first.url.length > 0, JSON.stringify(first));
  check("upload stores one File row", firstRows.length === 1, `rows=${firstRows.length}`);
  check(
    "new File row is unattached",
    firstRows[0] && !firstRows[0].attached_to_doctype && !firstRows[0].attached_to_name,
    JSON.stringify(firstRows[0]),
  );

  // 2. The same image uploaded again reuses the row instead of duplicating it.
  const again = await upload(client, "hd13_pic.png", bytes);
  const afterRetry = await filesFor(first.url);
  check("re-upload is deduplicated", again.reused === true && again.url === first.url, JSON.stringify(again));
  check("still exactly one File row", afterRetry.length === 1, `rows=${afterRetry.length}`);

  // 3. Creating the ticket claims the File with the HD Ticket mapping.
  const created = await createTicket(client, {
    subject: `Attachment contract ${randomUUID().slice(0, 6)}`,
    attachments: [{ name: "hd13_pic.png", url: first.url }],
  });
  const ticketId = created.payload?.ticket?.id;
  check("ticket created", created.status === 200 && Boolean(ticketId), JSON.stringify(created.payload).slice(0, 200));
  check("no attachment refused", (created.payload?.attachments_failed ?? []).length === 0, JSON.stringify(created.payload?.attachments_failed));

  const claimed = (await filesFor(first.url))[0] ?? {};
  check("attached_to_doctype = HD Ticket", claimed.attached_to_doctype === "HD Ticket", JSON.stringify(claimed));
  check("attached_to_name = created ticket id", claimed.attached_to_name === ticketId, `${claimed.attached_to_name} vs ${ticketId}`);
  check(
    "ticket payload lists the file for the employee view",
    (created.payload?.ticket?.attachments ?? []).some((file) => file.url === first.url && file.name === "hd13_pic.png"),
    JSON.stringify(created.payload?.ticket?.attachments),
  );

  // 4. The same URL cannot be pulled onto a second ticket.
  const second = await createTicket(client, {
    subject: `Attachment steal check ${randomUUID().slice(0, 6)}`,
    attachments: [{ name: "hd13_pic.png", url: first.url }],
  });
  check(
    "already-attached file is refused for a new ticket",
    (second.payload?.attachments_failed ?? []).length === 1,
    JSON.stringify(second.payload?.attachments_failed),
  );
  const afterSteal = (await filesFor(first.url))[0] ?? {};
  check("original ticket keeps the file", afterSteal.attached_to_name === ticketId, JSON.stringify(afterSteal));

  // 5. Another user's upload cannot be attached at all.
  const staffFile = await upload(staff, "staff-note.png", bytes);
  const crossUser = await createTicket(client, {
    subject: `Ownership check ${randomUUID().slice(0, 6)}`,
    attachments: [{ name: "staff-note.png", url: staffFile.url }],
  });
  check(
    "foreign upload is refused",
    (crossUser.payload?.attachments_failed ?? []).length === 1,
    JSON.stringify(crossUser.payload?.attachments_failed),
  );
  const foreignRow = (await filesFor(staffFile.url))[0] ?? {};
  check("foreign file stays unattached", !foreignRow.attached_to_name, JSON.stringify(foreignRow));

  // 6. A comment never re-parents a file the ticket already shows.
  const ticketFileReply = await reply(client, ticketId, {
    message: "Trying to reuse the ticket image in a comment.",
    attachments: [{ name: "hd13_pic.png", url: first.url }],
  });
  check(
    "comment refuses the ticket's own file",
    (ticketFileReply.payload?.attachments_failed ?? []).length === 1,
    JSON.stringify(ticketFileReply.payload?.attachments_failed),
  );
  const afterComment = (await filesFor(first.url))[0] ?? {};
  check("ticket file still on the ticket", afterComment.attached_to_doctype === "HD Ticket", JSON.stringify(afterComment));

  // 7. A fresh comment upload gets its own Communication reference.
  const commentFile = await upload(client, "comment-pic.png", bytes);
  const commentReply = await reply(client, ticketId, {
    message: "Here is the screenshot you asked for.",
    attachments: [{ name: "comment-pic.png", url: commentFile.url }],
  });
  check("comment attachment accepted", (commentReply.payload?.attachments_failed ?? []).length === 0, JSON.stringify(commentReply.payload?.attachments_failed));
  const commentRow = (await filesFor(commentFile.url))[0] ?? {};
  check("comment File points at the Communication", commentRow.attached_to_doctype === "Communication", JSON.stringify(commentRow));
  check("comment File names the communication", Boolean(commentRow.attached_to_name), JSON.stringify(commentRow));

  // 8. A failed create removes its own upload (no orphan).
  const orphanCandidate = await upload(client, "orphan-check.png", bytes);
  const rejected = await createTicket(client, {
    subject: "ab",
    attachments: [{ name: "orphan-check.png", url: orphanCandidate.url }],
  });
  check("validation failure is rejected", rejected.status === 417, `status=${rejected.status}`);
  const orphanRows = await filesFor(orphanCandidate.url);
  check("failed create discards its upload", orphanRows.length === 0, `rows=${orphanRows.length}`);

  console.log(`\nBackend attachment contract: ${pass} passed, ${failures.length} failed`);
  if (failures.length) {
    for (const failure of failures) console.log(`  - ${failure}`);
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error("FATAL", error);
  process.exitCode = 1;
});
