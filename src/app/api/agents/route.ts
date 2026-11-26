import { NextRequest, NextResponse } from "next/server";
import { AGENT_ROSTER } from "@/lib/multi-agent-system";
import { autoSortCategory, teachCategory, getLearnedPartyMemory } from "@/lib/sorter-agent";
import { findDuplicateBills, getLedgerEntries } from "@/lib/ledger-db";
import { getSupabaseAdmin } from "@/lib/supabase";
import { listDriveBillPhotos } from "@/lib/google-workspace";

export async function GET() {
  return NextResponse.json({
    agents: AGENT_ROSTER,
    ledgerCount: getLedgerEntries().length,
    learnedPartiesCount: getLearnedPartyMemory().length,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, payload } = body;

    if (action === "auto_sort") {
      const { partyName, description } = payload || {};
      const result = autoSortCategory(partyName, description);
      return NextResponse.json({ success: true, result });
    }

    if (action === "teach_sorter") {
      const { partyName, category } = payload || {};
      if (partyName && category) {
        teachCategory(partyName, category);
        const sb = getSupabaseAdmin();
        if (sb) {
          await sb.from("party_categories").upsert({ party: partyName, category }).then(() => {}, () => {});
        }
        return NextResponse.json({ success: true, message: `Learned: "${partyName}" -> "${category}"` });
      }
      return NextResponse.json({ error: "partyName and category required" }, { status: 400 });
    }

    if (action === "sync_drive") {
      const result = await listDriveBillPhotos().catch(() => ({
        synced: false,
        mode: "simulated" as const,
        files: [],
      }));
      return NextResponse.json({ success: true, ...result });
    }

    if (action === "check_duplicate") {
      const { invoiceNumber, vendorName, date, totalAmount } = payload || {};
      const result = findDuplicateBills(invoiceNumber, vendorName, date, totalAmount);
      return NextResponse.json({ success: true, result });
    }

    return NextResponse.json({ error: "Unknown agent action" }, { status: 400 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
