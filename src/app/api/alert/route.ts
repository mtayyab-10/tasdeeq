import { NextRequest, NextResponse } from "next/server";
import {
  dispatchOwnerAlert,
  handleOwnerAlertResponse,
  getActiveOwnerAlerts,
} from "@/lib/multi-agent-system";
import { sendAlertEmail } from "@/lib/mailer";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET() {
  return NextResponse.json({
    alerts: getActiveOwnerAlerts(),
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, alertId, responseAction, alertData } = body;

    // 1. Owner interacts with alert ("Approve" or "Fix")
    if (action === "respond") {
      if (!alertId || !responseAction) {
        return NextResponse.json(
          { error: "alertId and responseAction ('approved_ok' | 'fix_requested') required." },
          { status: 400 }
        );
      }
      const updated = handleOwnerAlertResponse(alertId, responseAction);
      if (!updated) {
        return NextResponse.json({ error: "Alert not found." }, { status: 404 });
      }
      return NextResponse.json({ success: true, alert: updated });
    }

    // 2. Dispatch a new alert (and send real Gmail if SMTP configured)
    if (action === "dispatch") {
      const alert = dispatchOwnerAlert(alertData);
      const emailResult = await sendAlertEmail(alert).catch(() => ({ sent: false, mode: "simulated" as const }));
      const sb = getSupabaseAdmin();
      if (sb) {
        await sb.from("owner_alerts").upsert({
          alert_id: alert.alert_id,
          invoice_number: alert.invoice_number,
          vendor_name: alert.vendor_name,
          total_amount: alert.total_amount,
          discrepancy_summary: alert.discrepancy_summary,
          status: alert.status,
        }).then(() => {}, () => {});
      }
      return NextResponse.json({ success: true, alert, emailResult });
    }

    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
