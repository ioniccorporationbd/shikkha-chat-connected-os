import { NextResponse } from "next/server";
import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";

import { callFrappe } from "@/lib/api/frappe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Payload = {
  name?: unknown;
  designation?: unknown;
  institution?: unknown;
  mobile?: unknown;
  page?: unknown;
  language?: unknown;
};

type LeadResult = {
  lead?: string;
  duplicate?: boolean;
};

const clean = (value: unknown, max: number) =>
  typeof value === "string" ? value.trim().slice(0, max) : "";

/**
 * Demo-request intake for the hero form — the lead lands in the CRM.
 *
 * The four form fields become one **CRM Lead** through the app's guest endpoint
 * (`shikkha_os.api.v1.crm_leads.create_demo_lead`), so the enquiry appears in
 * `/crm/leads` beside every other lead. The JSON line below is kept as a
 * flat-file safety net: if the ERP is unreachable the request is still recorded
 * here (override the path with DEMO_LEADS_FILE on the server), and the visitor
 * gets a retryable error instead of a silent thanks.
 */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Payload | null;

  if (!body) {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }

  const name = clean(body.name, 120);
  const designation = clean(body.designation, 120);
  const institution = clean(body.institution, 160);
  const mobile = clean(body.mobile, 24).replace(/\D+/g, "");
  const page = clean(body.page, 120) || "/";
  const language = clean(body.language, 8) === "bn" ? "bn" : "en";

  if (!name || !designation || !institution) {
    return NextResponse.json({ ok: false, error: "missing_fields" }, { status: 422 });
  }

  if (!/^01[3-9]\d{8}$/.test(mobile)) {
    return NextResponse.json({ ok: false, error: "invalid_mobile" }, { status: 422 });
  }

  const lead = {
    name,
    designation,
    institution,
    mobile,
    page,
    at: new Date().toISOString(),
  };

  console.info("[demo-request]", JSON.stringify(lead));

  try {
    const file = process.env.DEMO_LEADS_FILE ?? path.join(process.cwd(), "data", "demo-requests.jsonl");
    await mkdir(path.dirname(file), { recursive: true });
    await appendFile(file, `${JSON.stringify(lead)}\n`, "utf8");
  } catch (error) {
    // Not fatal: the CRM is the system of record, and the log line above holds
    // the request if this file cannot be written.
    console.error("[demo-request] could not persist the flat-file copy", error);
  }

  const result = await callFrappe<LeadResult>("shikkha_os.api.v1.crm_leads.create_demo_lead", {
    httpMethod: "POST",
    timeoutMs: 15000,
    body: { name, designation, institution, mobile, page, language },
  });

  if (result.ok) {
    return NextResponse.json({
      ok: true,
      lead: result.data?.lead ?? null,
      duplicate: result.data?.duplicate === true,
    });
  }

  // Requirement: the failure must be visible in the browser console *and* in
  // the ERP Error Log. The ERP side writes the log entry itself; this is the
  // server half of the console trail the browser then continues.
  console.error("[demo-request] CRM lead was not created", {
    status: result.status,
    code: result.code,
    reason: result.reason,
    message: result.message,
    lead,
  });

  // Mirror the failure into the ERP Error Log (Desk -> Error Log) so support
  // sees every refused request, not only the ones that blew up inside the
  // create path. Best effort: if the app is unreachable this dies quietly and
  // the server console line above is the only record.
  try {
    await callFrappe("shikkha_os.api.v1.crm_leads.log_demo_failure", {
      httpMethod: "POST",
      timeoutMs: 8000,
      body: {
        reason: result.code ?? "unknown",
        page,
        detail: [
          `status=${result.status}`,
          `code=${result.code}`,
          `reason=${result.reason}`,
          `message=${result.message}`,
          `lead=${JSON.stringify(lead)}`,
        ].join("\n"),
      },
    });
  } catch (logError) {
    console.error("[demo-request] could not write the ERP Error Log entry", logError);
  }

  return NextResponse.json(
    { ok: false, error: result.code, message: result.message },
    { status: result.status === 429 ? 429 : 502 }
  );
}
