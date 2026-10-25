import { NextResponse } from "next/server";
import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Payload = {
  name?: unknown;
  designation?: unknown;
  institution?: unknown;
  mobile?: unknown;
  page?: unknown;
};

const clean = (value: unknown, max: number) =>
  typeof value === "string" ? value.trim().slice(0, max) : "";

/**
 * Demo-request intake for the hero form.
 *
 * The site has no CRM table for public leads, so each accepted request is
 * appended as one JSON line to `data/demo-requests.jsonl` (override with
 * DEMO_LEADS_FILE) and mirrored to the server log. Set that path to a
 * volume-backed file on the server so the leads survive a redeploy.
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
    // The visitor still gets a confirmation — the log line above is the record.
    console.error("[demo-request] could not persist lead", error);
  }

  return NextResponse.json({ ok: true });
}
