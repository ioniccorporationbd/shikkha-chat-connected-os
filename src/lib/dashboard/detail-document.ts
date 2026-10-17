/**
 * Builds a clean, self-contained A4 document from the details popup's data and
 * exposes two browser-native actions:
 *   - print  → renders the document in a hidden iframe and opens the OS print
 *              dialog (works with Bengali because the iframe ships the same
 *              Noto Serif Bengali webfont the app uses).
 *   - download → saves the identical document as a standalone `.html` file.
 *
 * No third-party PDF library is used on purpose: embedding a correct Bengali
 * (complex-script) font into a generated PDF is fragile and heavyweight, so we
 * lean on the browser's own rendering, which prints Bengali perfectly and lets
 * the user "Save as PDF" from the native print dialog when they want a PDF.
 */

export interface DetailDocumentRow {
  label: string;
  value: string;
  emphasis?: boolean;
}

export interface DetailDocumentSection {
  title: string;
  rows: DetailDocumentRow[];
}

export interface DetailDocumentTable {
  title: string;
  columns: string[];
  rows: string[][];
}

/** Per-popup options supplied by the view that owns the details card. */
export interface DetailDocumentMeta {
  brand?: string;
  badges?: string[];
  tables?: DetailDocumentTable[];
  filename?: string;
  printLabel: string;
  downloadLabel: string;
  footerNote?: string;
  /** BCP-47 tag used only for the "generated at" timestamp. */
  locale?: string;
}

export interface DetailDocumentInput {
  brand?: string;
  eyebrow: string;
  title: string;
  subtitle?: string;
  badges?: string[];
  sections: DetailDocumentSection[];
  tables?: DetailDocumentTable[];
  footerNote?: string;
  locale?: string;
}

function escapeHtml(value: string): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Full, standalone HTML document (UTF-8) for a details card. */
export function buildDetailDocumentHtml(input: DetailDocumentInput): string {
  const brand = input.brand || "Shikkha Chat";
  const locale = input.locale || "bn-BD";
  let generated = "";
  try {
    generated = new Date().toLocaleString(locale);
  } catch {
    generated = new Date().toLocaleString();
  }

  const badgeHtml =
    input.badges && input.badges.length
      ? `<div class="badges">${input.badges
          .filter(Boolean)
          .map((b) => `<span class="badge">${escapeHtml(b)}</span>`)
          .join("")}</div>`
      : "";

  const sectionHtml = input.sections
    .filter((s) => s.rows.length > 0)
    .map((section) => {
      const rows = section.rows
        .map(
          (row) =>
            `<div class="row${row.emphasis ? " emphasis" : ""}"><div class="label">${escapeHtml(
              row.label
            )}</div><div class="value">${escapeHtml(row.value || "—")}</div></div>`
        )
        .join("");
      return `<section class="section"><h2>${escapeHtml(section.title)}</h2><div class="rows">${rows}</div></section>`;
    })
    .join("");

  const tableHtml = (input.tables || [])
    .filter((t) => t.columns.length > 0 && t.rows.length > 0)
    .map((table) => {
      const head = table.columns
        .map((c) => `<th>${escapeHtml(c)}</th>`)
        .join("");
      const body = table.rows
        .map(
          (r) =>
            `<tr>${r.map((cell) => `<td>${escapeHtml(cell || "—")}</td>`).join("")}</tr>`
        )
        .join("");
      return `<table class="items"><caption>${escapeHtml(
        table.title
      )}</caption><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
    })
    .join("");

  const subtitleHtml = input.subtitle
    ? `<p class="subtitle">${escapeHtml(input.subtitle)}</p>`
    : "";

  return `<!doctype html><html lang="bn"><head><meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(input.title)} — ${escapeHtml(brand)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Serif+Bengali:wght@400;500;600;700&display=swap" rel="stylesheet" />
<style>
  @page { size: A4; margin: 16mm 14mm; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body {
    font-family: "Noto Serif Bengali", "Inter", system-ui, -apple-system, "Segoe UI", Tahoma, "Nirmala UI", sans-serif;
    color: #11201c; background: #ffffff; line-height: 1.45;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  .doc { max-width: 190mm; margin: 0 auto; }
  .brandbar { display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; padding-bottom: 12px; border-bottom: 3px solid #e00516; }
  .brand { font-size: 22px; font-weight: 800; letter-spacing: -0.02em; color: #032521; }
  .brand .dot { color: #e00516; }
  .brand-sub { font-size: 10.5px; color: #6b7a76; margin-top: 2px; font-family: "Inter", system-ui, sans-serif; letter-spacing: 0.02em; }
  .doc-meta { text-align: right; font-size: 10.5px; color: #6b7a76; font-family: "Inter", system-ui, sans-serif; }
  .doc-title { margin: 22px 0 0; }
  .eyebrow { font-size: 10px; text-transform: uppercase; letter-spacing: 0.14em; color: #b06a6a; font-weight: 700; font-family: "Inter", system-ui, sans-serif; }
  h1 { font-size: 21px; margin: 5px 0 2px; color: #032521; letter-spacing: -0.01em; }
  .subtitle { font-size: 13px; color: #4a5b56; margin: 0; }
  .badges { margin-top: 10px; display: flex; flex-wrap: wrap; gap: 8px; }
  .badge { font-size: 11px; font-weight: 600; padding: 3px 10px; border: 1px solid #d7dedb; border-radius: 999px; color: #032521; background: #f5f8f7; font-family: "Inter", system-ui, sans-serif; }
  .section { margin-top: 16px; border: 1px solid #e2e8e5; border-radius: 10px; overflow: hidden; page-break-inside: avoid; }
  .section h2 { margin: 0; font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.1em; color: #5a6b66; background: #f3f7f5; padding: 8px 14px; border-bottom: 1px solid #e2e8e5; font-family: "Inter", system-ui, sans-serif; }
  .rows { display: grid; grid-template-columns: 1fr 1fr; }
  .row { padding: 8px 14px; border-bottom: 1px solid #eef2f0; }
  .row:last-child { border-bottom: 0; }
  .row .label { font-size: 9px; text-transform: uppercase; letter-spacing: 0.07em; color: #7a8985; font-weight: 700; font-family: "Inter", system-ui, sans-serif; }
  .row .value { font-size: 12.5px; color: #11201c; margin-top: 2px; word-break: break-word; }
  .row.emphasis .value { font-size: 15px; font-weight: 700; color: #032521; }
  table.items { width: 100%; border-collapse: collapse; margin-top: 16px; page-break-inside: avoid; }
  table.items caption { caption-side: top; text-align: left; font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.1em; color: #5a6b66; font-weight: 700; padding-bottom: 6px; font-family: "Inter", system-ui, sans-serif; }
  table.items th { text-align: left; font-size: 9px; text-transform: uppercase; letter-spacing: 0.06em; color: #5a6b66; background: #f3f7f5; padding: 7px 10px; border-bottom: 1px solid #e2e8e5; font-family: "Inter", system-ui, sans-serif; }
  table.items td { font-size: 12px; padding: 7px 10px; border-bottom: 1px solid #eef2f0; }
  .doc-footer { margin-top: 26px; padding-top: 10px; border-top: 1px solid #e2e8e5; display: flex; align-items: center; justify-content: space-between; gap: 12px; font-size: 10px; color: #8a9793; font-family: "Inter", system-ui, sans-serif; }
</style></head>
<body><div class="doc">
  <div class="brandbar">
    <div>
      <div class="brand">${escapeHtml(brand)}<span class="dot">.</span></div>
      <div class="brand-sub">Connected Operating System</div>
    </div>
    <div class="doc-meta">Generated: ${escapeHtml(generated)}</div>
  </div>
  <div class="doc-title">
    <div class="eyebrow">${escapeHtml(input.eyebrow)}</div>
    <h1>${escapeHtml(input.title)}</h1>
    ${subtitleHtml}
    ${badgeHtml}
  </div>
  ${sectionHtml}
  ${tableHtml}
  <div class="doc-footer">
    <span>${escapeHtml(input.footerNote || brand)}</span>
    <span>${escapeHtml(brand)} · ${escapeHtml(input.title)}</span>
  </div>
</div></body></html>`;
}

/** Print the document via a hidden iframe (native OS dialog, correct Bengali). */
export function printDetailDocument(html: string): void {
  if (typeof document === "undefined") return;
  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  iframe.style.opacity = "0";
  document.body.appendChild(iframe);

  const win = iframe.contentWindow;
  const doc = win?.document;
  if (!win || !doc) {
    iframe.remove();
    return;
  }

  let printed = false;
  const fire = () => {
    if (printed) return;
    printed = true;
    try {
      win.focus();
      win.print();
    } finally {
      window.setTimeout(() => iframe.remove(), 2000);
    }
  };

  doc.open();
  doc.write(html);
  doc.close();

  // Wait for the webfonts so Bengali is laid out before printing.
  const fontsReady = (doc as Document & { fonts?: { ready?: Promise<unknown> } }).fonts?.ready;
  if (fontsReady && typeof fontsReady.then === "function") {
    fontsReady.then(() => window.setTimeout(fire, 120)).catch(() => window.setTimeout(fire, 400));
  } else {
    window.setTimeout(fire, 500);
  }
  // Safety net in case fonts.ready never resolves (offline etc.).
  window.setTimeout(fire, 1800);
}

function sanitizeFilename(base: string): string {
  return (
    String(base || "")
      .trim()
      .replace(/[^\w\u0980-\u09FF.-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 120) || "details"
  );
}

/** Download the document as a standalone `.html` file. */
export function downloadDetailDocument(html: string, filenameBase: string): void {
  if (typeof document === "undefined") return;
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${sanitizeFilename(filenameBase)}.html`;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}
