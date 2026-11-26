import { NextRequest, NextResponse } from "next/server";
import { generateWeeklySummaryReport } from "@/lib/multi-agent-system";
import { sendWeeklySummaryEmail } from "@/lib/mailer";

export async function GET(req: NextRequest) {
  const report = generateWeeklySummaryReport();
  const isCron = req.headers.get("x-vercel-cron") === "1" || req.nextUrl.searchParams.get("send") === "true";

  if (isCron) {
    const emailResult = await sendWeeklySummaryEmail(report).catch(() => ({
      sent: false,
      mode: "simulated" as const,
    }));
    return NextResponse.json({ success: true, cron: true, report, emailResult });
  }

  return NextResponse.json({ success: true, report });
}

export async function POST() {
  try {
    const report = generateWeeklySummaryReport();
    const emailResult = await sendWeeklySummaryEmail(report).catch(() => ({
      sent: false,
      mode: "simulated" as const,
    }));
    return NextResponse.json({
      success: true,
      message: `Weekly summary report for ${report.week_period} processed (${emailResult.mode}).`,
      report,
      emailResult,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
