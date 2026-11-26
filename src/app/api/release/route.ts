import { NextRequest, NextResponse } from "next/server";
import { ReleaseRequestSchema, ReleaseRecord } from "@/lib/types";
import { evaluateQualityGate } from "@/lib/verification-engine";
import { getSession, saveSession } from "@/lib/review-store";
import { recordVoucherInLedger } from "@/lib/ledger-db";
import { getSupabaseAdmin } from "@/lib/supabase";
import { appendAuditRowToSheet } from "@/lib/google-workspace";
import crypto from "crypto";

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(),
  });
}

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400, headers: corsHeaders() }
    );
  }

  const parsed = ReleaseRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid release request: " + parsed.error.message },
      { status: 400, headers: corsHeaders() }
    );
  }

  const { entries, findings, context } = parsed.data;

  // ── SERVER-SIDE QUALITY GATE ENFORCEMENT ───────────────────────────────────
  // Do NOT trust a stale frontend status. Evaluate real-time findings state.
  const gate = evaluateQualityGate(findings);

  if (gate.gateState === "blocked") {
    const blockingItems = findings.filter(
      (f) => f.status === "open" && (f.severity === "blocking" || f.severity === "high")
    );
    return NextResponse.json(
      {
        error: "RELEASE HELD: Quality gate cannot permit release while blocking findings remain unresolved.",
        gateState: "blocked",
        blockingCount: gate.blockingCount,
        blockingFindings: blockingItems.map((b) => ({
          finding_id: b.finding_id,
          field: b.field,
          label: b.label,
          evidence: b.evidence,
        })),
      },
      { status: 403, headers: corsHeaders() }
    );
  }

  // Generate cryptographic seal & audit trail
  const releaseId = "REL-" + Date.now().toString(36).toUpperCase() + "-" + crypto.randomBytes(3).toString("hex").toUpperCase();
  const timestamp = new Date().toISOString();

  const auditLog = findings.map((f) => ({
    finding_id: f.finding_id,
    field: f.field,
    category: f.category,
    resolution: f.status,
    reason: f.resolution_reason || (f.status === "open" ? "Acknowledged warning" : "Resolved"),
    final_value: f.resolved_value || f.typed_value,
  }));

  const dataPayload = JSON.stringify({ entries, auditLog, timestamp });
  const checksum = crypto.createHash("sha256").update(dataPayload).digest("hex");

  const releaseRecord: ReleaseRecord = {
    release_id: releaseId,
    timestamp,
    quality_gate_state: "released",
    total_entries: entries.length,
    total_findings: findings.length,
    resolved_findings: gate.resolvedCount,
    data_snapshot: entries,
    audit_log: auditLog,
    verification_checksum: checksum,
  };

  // Persist verified voucher into Checker Agent's ledger so future duplicates are caught
  const getFinalVal = (field: string, fallback = "") => {
    const f = findings.find((fi) => fi.field === field);
    if (f?.resolved_value) return f.resolved_value;
    const e = entries.find((en) => en.field === field);
    return e?.typed_value || fallback;
  };
  const parsedAmount = parseFloat(getFinalVal("total_amount", "0").replace(/[^0-9.-]/g, "")) || 0;
  const savedVoucher = recordVoucherInLedger({
    invoice_number: getFinalVal("invoice_number", releaseId),
    vendor_name: getFinalVal("vendor_name", "Unknown Vendor"),
    date: getFinalVal("date", timestamp.slice(0, 10)),
    total_amount: parsedAmount,
    category: "Miscellaneous",
    status: "verified",
    source: body.source || "web",
  });

  // Optional cloud persistence (Supabase + Google Sheets) when env vars are configured
  const sb = getSupabaseAdmin();
  if (sb) {
    await sb.from("vouchers").upsert(savedVoucher).then(() => {}, () => {});
  }
  await appendAuditRowToSheet([
    savedVoucher.id,
    savedVoucher.invoice_number,
    savedVoucher.vendor_name,
    savedVoucher.category || "Miscellaneous",
    savedVoucher.date,
    String(savedVoucher.total_amount),
    `Verified & Sealed (${releaseId})`,
  ]).catch(() => {});

  if (body.sessionId) {
    const existingSession = getSession(body.sessionId);
    if (existingSession) {
      existingSession.gateState = "released";
      existingSession.releasedRecord = releaseRecord;
      saveSession(existingSession);
    }
  }

  return NextResponse.json(
    {
      success: true,
      message: "Data passed Quality Gate and is verified for release.",
      releaseRecord,
    },
    { status: 200, headers: corsHeaders() }
  );
}
