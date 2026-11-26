import nodemailer from "nodemailer";
import type { OwnerAlert, WeeklySummaryReport } from "./types";

function getMailerConfig() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  const to = process.env.OWNER_ALERT_EMAIL || user || "devixaweb@gmail.com";
  return { user, pass, to, configured: Boolean(user && pass) };
}

export async function sendAlertEmail(alert: OwnerAlert): Promise<{ sent: boolean; mode: "live_smtp" | "simulated"; messageId?: string }> {
  const cfg = getMailerConfig();
  if (!cfg.configured) {
    return { sent: false, mode: "simulated" };
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: cfg.user, pass: cfg.pass },
  });

  const issueRows = (alert.findings || [])
    .map((f) => `<li><strong>${f.field}:</strong> ${f.issue}</li>`)
    .join("");

  const info = await transporter.sendMail({
    from: `"Tasdeeq Alert Agent" <${cfg.user}>`,
    to: cfg.to,
    subject: `Tasdeeq Alert Agent: Discrepancy Detected - ${alert.invoice_number}`,
    html: `
      <div style="font-family: Inter, Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #DDD6C3; border-radius: 10px; overflow: hidden;">
        <div style="background: #102248; color: #F6F2E4; padding: 18px 24px;">
          <div style="font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; opacity: 0.8;">Tasdeeq / TrueNorth — Alert Agent</div>
          <h2 style="margin: 6px 0 0; font-size: 18px;">Discrepancy Detected: ${alert.invoice_number}</h2>
        </div>
        <div style="padding: 20px 24px; color: #102248; font-size: 14px; line-height: 1.55;">
          <p><strong>Party / Vendor:</strong> ${alert.vendor_name}</p>
          <p><strong>Entered Amount:</strong> PKR ${Number(alert.total_amount || 0).toLocaleString()}</p>
          <div style="background: #FFF5F5; border-left: 4px solid #C23B3C; padding: 12px 14px; margin: 14px 0;">
            <strong style="color: #C23B3C;">Issues Detected:</strong>
            <ul style="margin: 6px 0 0 18px; padding: 0;">${issueRows || `<li>${alert.discrepancy_summary}</li>`}</ul>
          </div>
          <p style="font-size: 12px; color: #5A6378;">Review in workspace: https://gotruenorth-ai.vercel.app/</p>
        </div>
      </div>
    `,
  });

  return { sent: true, mode: "live_smtp", messageId: info.messageId };
}

export async function sendWeeklySummaryEmail(report: WeeklySummaryReport): Promise<{ sent: boolean; mode: "live_smtp" | "simulated"; messageId?: string }> {
  const cfg = getMailerConfig();
  if (!cfg.configured) {
    return { sent: false, mode: "simulated" };
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: cfg.user, pass: cfg.pass },
  });

  const info = await transporter.sendMail({
    from: `"Tasdeeq Report Agent" <${cfg.user}>`,
    to: cfg.to,
    subject: `Tasdeeq Report Agent: Monday Weekly Summary (${report.mistakes_caught} Mistakes Caught)`,
    html: `
      <div style="font-family: Inter, Arial, sans-serif; max-width: 620px; margin: 0 auto; border: 1px solid #DDD6C3; border-radius: 10px; overflow: hidden;">
        <div style="background: #102248; color: #F6F2E4; padding: 20px 24px;">
          <div style="font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; opacity: 0.8;">Tasdeeq / TrueNorth — Report Agent</div>
          <h2 style="margin: 6px 0 0; font-size: 19px;">Weekly Quality Summary (${report.week_period})</h2>
        </div>
        <div style="padding: 22px 24px; color: #102248; font-size: 14px; line-height: 1.55;">
          <div style="background: #102248; color: #F6F2E4; padding: 16px 18px; border-radius: 8px; margin-bottom: 16px;">
            "We caught <strong>${report.mistakes_caught} mistakes</strong> last week, saving about <strong>${report.hours_saved} hours</strong> and protecting <strong>PKR ${report.amount_protected_pkr.toLocaleString()}</strong>."
          </div>
          <ul>
            <li>Arithmetic Mismatches: <strong>${report.breakdown.arithmetic_errors}</strong></li>
            <li>Duplicate Bills Prevented: <strong>${report.breakdown.duplicate_bills}</strong></li>
            <li>Price Outliers Flagged: <strong>${report.breakdown.outlier_prices}</strong></li>
            <li>Digit Transpositions: <strong>${report.breakdown.transpositions}</strong></li>
          </ul>
          <p style="font-size: 12px; color: #5A6378;">Open dashboard: https://gotruenorth-ai.vercel.app/</p>
        </div>
      </div>
    `,
  });

  return { sent: true, mode: "live_smtp", messageId: info.messageId };
}
