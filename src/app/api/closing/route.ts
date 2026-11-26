import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import {
  getPersistentMonthEndChecklist,
  resolveMonthEndChecklistItem,
  signOffMonthEndChecklist,
} from "@/lib/multi-agent-system";

export async function GET() {
  const checklist = getPersistentMonthEndChecklist();
  return NextResponse.json({ success: true, checklist });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { action, itemId } = body;

    if (action === "resolve_item" && itemId) {
      const checklist = resolveMonthEndChecklistItem(itemId);
      return NextResponse.json({ success: true, checklist });
    }

    if (action === "sign_off") {
      const current = getPersistentMonthEndChecklist();
      const open = current.checklist_items.filter((i) => !i.resolved).length;
      if (open > 0) {
        return NextResponse.json(
          { error: `Cannot close books: ${open} open item(s) remain.` },
          { status: 400 }
        );
      }
      const payload = JSON.stringify({
        month_year: current.month_year,
        items: current.checklist_items,
        closed_at: new Date().toISOString(),
      });
      const digest = crypto.createHash("sha256").update(payload).digest("hex");
      const checklist = signOffMonthEndChecklist(`SHA256:${digest}`);
      return NextResponse.json({ success: true, checklist });
    }

    return NextResponse.json({
      success: true,
      checklist: getPersistentMonthEndChecklist(),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
