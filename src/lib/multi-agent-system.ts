/**
 * multi-agent-system.ts
 * Multi-Agent Orchestrator and MCP Tool Bridge for Tasdeeq / TrueNorth.
 * Coordinates the 7 specialized agents under the Manager Agent:
 *  - Manager Agent (MCP: Calendar)
 *  - Reader Agent (MCP: Google Drive)
 *  - Checker Agent (MCP: Database / Supabase)
 *  - Sorter Agent (MCP: Database)
 *  - Alert Agent (MCP: Gmail / WhatsApp)
 *  - Report Agent (MCP: Google Sheets or Excel, Gmail)
 *  - Closing Agent (MCP: Google Sheets or Excel)
 */
import type {
  AgentCardInfo,
  AgentRole,
  WhatsAppAlert,
  WeeklySummaryReport,
  MonthEndChecklist,
  TypedEntry,
  Finding,
  BusinessContext,
  ExtractionResult,
} from "./types";
import { getLedgerEntries } from "./ledger-db.ts";

// ── AGENT ROSTER DEFINITIONS ──────────────────────────────────────────────────
export const AGENT_ROSTER: AgentCardInfo[] = [
  {
    role: "manager_agent",
    name: "Manager Agent",
    mcpTool: "Calendar",
    title: "Master Coordinator & Scheduler",
    description: "Schedules the Monday report, triggers month-end closing, and assigns tasks to specialized agents.",
    status: "working",
    lastAction: "Synchronized agents & calendar pipeline",
    activityCount: 42,
  },
  {
    role: "reader_agent",
    name: "Reader Agent",
    mcpTool: "Google Drive",
    title: "Document Vision & Form Auto-Filler",
    description: "Picks up bill photos from shared folders or direct upload, reads English/Urdu text, and auto-fills fields.",
    status: "idle",
    lastAction: "Ready to inspect document and auto-populate form",
    activityCount: 28,
  },
  {
    role: "checker_agent",
    name: "Checker Agent",
    mcpTool: "Database (like Supabase)",
    title: "Historical Ledger & Duplicate Bill Finder",
    description: "Compares current entries against database records to catch duplicate bill numbers and double payments.",
    status: "idle",
    lastAction: "Polled historical ledger records (Supabase DB)",
    activityCount: 35,
  },
  {
    role: "sorter_agent",
    name: "Sorter Agent",
    mcpTool: "Database (like Supabase)",
    title: "Party Categorization & Memory Engine",
    description: "Remembers which expense category each vendor belongs to and auto-assigns categories like Utilities.",
    status: "idle",
    lastAction: "Learned party taxonomy mapped to database",
    activityCount: 29,
  },
  {
    role: "alert_agent",
    name: "Alert Agent",
    mcpTool: "Gmail",
    title: "Gmail Anomaly Dispatcher",
    description: "Instantly sends Gmail discrepancy alerts to the business owner for 1-click Approve or Fix.",
    status: "idle",
    lastAction: "Gmail alert gateway connected",
    activityCount: 19,
  },
  {
    role: "report_agent",
    name: "Report Agent",
    mcpTool: "Google Sheets or Excel",
    title: "Weekly Insights & One-Click Excel Exporter",
    description: "Writes audit records, creates ready-to-use Excel/Google Sheets exports, and compiles Monday performance reports.",
    status: "idle",
    lastAction: "Excel export generator ready",
    activityCount: 31,
  },
  {
    role: "closing_agent",
    name: "Closing Agent",
    mcpTool: "Google Sheets or Excel",
    title: "Month-End Auditor & Closing Checklist",
    description: "Performs final pre-closing scan of all monthly vouchers and surfaces remaining items to fix before sign-off.",
    status: "idle",
    lastAction: "Month-end audit rules initialized",
    activityCount: 14,
  },
];

// ── In-Memory Runtime Store for Alerts and Reports ────────────────────────────
let activeAlerts: WhatsAppAlert[] = [
  {
    alert_id: "WA-2026-901",
    timestamp: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    recipient_phone: "+92 300 8472910",
    recipient_name: "Muhammad Tayyab (Owner)",
    invoice_number: "INV-2026-0842",
    vendor_name: "Al-Kareem General Store",
    total_amount: 54000,
    discrepancy_summary: "Typed total PKR 54,000 does not match bill total PKR 50,400 (PKR 3,600 difference). Arithmetic line 5 x 3,200 = 16,000.",
    findings: [
      { field: "total_amount", issue: "Typed 54,000 vs Scanned 50,400" },
      { field: "invoice_number", issue: "Transposition error: INV-2026-0824 vs INV-2026-0842" },
    ],
    status: "pending",
  },
];

/**
 * Trigger WhatsApp / Gmail Alert for the Owner
 */
export function dispatchOwnerAlert(params: {
  invoice_number: string;
  vendor_name: string;
  total_amount: number;
  findings: Finding[];
}): WhatsAppAlert {
  const discrepancySummary = params.findings
    .map((f) => `${f.label || f.field}: ${f.evidence}`)
    .slice(0, 3)
    .join("; ");

  const newAlert: WhatsAppAlert = {
    alert_id: `WA-${Date.now().toString().slice(-6)}`,
    timestamp: new Date().toISOString(),
    recipient_phone: "+92 300 8472910",
    recipient_name: "Business Owner / Approver",
    invoice_number: params.invoice_number || "VOUCHER-NEW",
    vendor_name: params.vendor_name || "Unknown Party",
    total_amount: params.total_amount || 0,
    discrepancy_summary: discrepancySummary || "Contextual discrepancy detected.",
    findings: params.findings.map((f) => ({
      field: f.field,
      issue: f.evidence,
    })),
    status: "pending",
  };

  activeAlerts.unshift(newAlert);
  return newAlert;
}

/**
 * Handle Owner's response from Gmail alert notification ("Approve" or "Fix")
 */
export function handleOwnerAlertResponse(
  alertId: string,
  action: "approved_ok" | "fix_requested"
): WhatsAppAlert | null {
  const alert = activeAlerts.find((a) => a.alert_id === alertId);
  if (!alert) return null;

  alert.status = action;
  alert.action_timestamp = new Date().toISOString();
  return alert;
}

export function getActiveOwnerAlerts(): WhatsAppAlert[] {
  return [...activeAlerts];
}

export const handleOwnerWhatsAppResponse = handleOwnerAlertResponse;
export const getActiveWhatsAppAlerts = getActiveOwnerAlerts;

// ── Report Agent: Weekly Summary Report ───────────────────────────────────────
export function generateWeeklySummaryReport(): WeeklySummaryReport {
  return {
    week_period: "October 19, 2026 – October 25, 2026",
    mistakes_caught: 14,
    hours_saved: 18.5,
    amount_protected_pkr: 247800,
    breakdown: {
      arithmetic_errors: 6,
      duplicate_bills: 3,
      outlier_prices: 2,
      transpositions: 2,
      missing_fields: 1,
    },
    top_flagged_vendors: [
      { vendor: "Al-Kareem General Store", count: 4 },
      { vendor: "Packages Limited", count: 3 },
      { vendor: "Metro Cash & Carry", count: 2 },
    ],
    generated_by: "Report Agent (MCP: Gmail & Google Sheets)",
    scheduled_by: "Manager Agent (MCP: Calendar - Every Monday 09:00 AM)",
    email_recipient: "accounting-team@tasdeeq.ai",
    status: "sent",
  };
}

// ── Closing Agent: Month-End Checklist ────────────────────────────────────────
export function generateMonthEndChecklist(currentFindings?: Finding[]): MonthEndChecklist {
  const ledger = getLedgerEntries();
  const openFindingsCount = (currentFindings || []).filter((f) => f.status === "open").length;

  const checklistItems = [
    {
      id: "CHK-01",
      voucher_id: "VCH-2026-0125",
      vendor_name: "Al-Kareem General Store",
      title: "Voucher Amount vs Bill Discrepancy",
      issue: "Discrepancy of PKR 3,600 detected between invoice amount and scanned bill.",
      severity: "blocking" as const,
      recommended_fix: "Adopt verified document total (PKR 50,400) or attach manager approval note.",
      resolved: openFindingsCount === 0,
    },
    {
      id: "CHK-02",
      voucher_id: "VCH-2026-0089",
      vendor_name: "LESCO (Lahore Electric)",
      title: "Utility Bill Missing GST Breakup",
      issue: "LESCO electricity voucher entered with combined total without sales tax itemization.",
      severity: "warning" as const,
      recommended_fix: "Split tax component into FBR sales tax withholding ledger line.",
      resolved: true,
    },
    {
      id: "CHK-03",
      voucher_id: "VCH-2026-0102",
      vendor_name: "Pakistan State Oil (PSO)",
      title: "Fleet Fuel Voucher Missing Vehicle Log #",
      issue: "Voucher logged under Logistics & Fuel without vehicle registration tag.",
      severity: "warning" as const,
      recommended_fix: "Add vehicle registration number (e.g. LEA-2024-41) to notes.",
      resolved: false,
    },
  ];

  const openIssues = checklistItems.filter((item) => !item.resolved).length;

  return {
    month_year: "October 2026",
    total_vouchers_scanned: ledger.length + 1,
    clean_vouchers: ledger.length,
    open_issues_count: openIssues,
    checklist_items: checklistItems,
    closing_status: openIssues === 0 ? "ready_for_close" : "needs_action",
    closed_at: openIssues === 0 ? new Date().toISOString() : undefined,
    closing_certificate_hash: undefined,
  };
}

// Persistent runtime store for Month-End Checklist
let activeChecklistState: MonthEndChecklist | null = null;

export function getPersistentMonthEndChecklist(): MonthEndChecklist {
  if (!activeChecklistState) {
    activeChecklistState = generateMonthEndChecklist();
  }
  return activeChecklistState;
}

export function resolveMonthEndChecklistItem(itemId: string): MonthEndChecklist {
  const current = getPersistentMonthEndChecklist();
  current.checklist_items = current.checklist_items.map((i) =>
    i.id === itemId ? { ...i, resolved: true } : i
  );
  const open = current.checklist_items.filter((i) => !i.resolved).length;
  current.open_issues_count = open;
  current.closing_status = open === 0 ? "ready_for_close" : "needs_action";
  return current;
}

export function signOffMonthEndChecklist(hash: string): MonthEndChecklist {
  const current = getPersistentMonthEndChecklist();
  current.closing_status = "closed";
  current.closed_at = new Date().toISOString();
  current.closing_certificate_hash = hash;
  return current;
}

/**
 * Report Agent: Build Excel-ready formatted Spreadsheet Content
 */
export function buildExcelExportContent(
  entries: TypedEntry[],
  findings: Finding[],
  context?: BusinessContext
): { filename: string; mimeType: string; csvData: string; summaryHtml: string } {
  const timestamp = new Date().toISOString();
  const dateFormatted = new Date().toLocaleDateString("en-PK", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const headers = [
    "Field ID",
    "Field Name",
    "Typed Value",
    "Verified Value",
    "Audit Status",
    "Finding Category",
    "Severity",
    "Evidence & Rule Details",
    "Audit Justification",
  ];

  const rows = entries.map((entry) => {
    const f = findings.find((fi) => fi.field === entry.field);
    return [
      entry.id,
      entry.field,
      `"${(entry.typed_value || "").replace(/"/g, '""')}"`,
      `"${((f?.resolved_value || entry.typed_value) || "").replace(/"/g, '""')}"`,
      `"${f ? f.status : "verified_clean"}"`,
      `"${f ? f.category : "deterministic_clean"}"`,
      `"${f ? f.severity : "none"}"`,
      `"${(f?.evidence || "Verified accurately by TrueNorth").replace(/"/g, '""')}"`,
      `"${(f?.resolution_reason || "Passed pre-submission gate").replace(/"/g, '""')}"`,
    ];
  });

  // Excel UTF-8 BOM + standard CSV format that opens natively in Microsoft Excel and Google Sheets
  const csvData =
    "\uFEFF" +
    [
      `"TrueNorth / Tasdeeq - Official Accounting Audit Export"`,
      `"Export Date: ${dateFormatted} | Generated By: Report Agent (MCP: Google Sheets / Excel)"`,
      `"Business Context: ${context?.business_type || "Commercial Accounting"} | Currency: ${context?.currency || "PKR"}"`,
      "",
      headers.join(","),
      ...rows.map((r) => r.join(",")),
    ].join("\r\n");

  const summaryHtml = `
  <table>
    <tr><th>Voucher Field</th><th>Final Value</th><th>Verification Seal</th></tr>
    ${entries
      .map(
        (e) =>
          `<tr><td>${e.field}</td><td>${e.typed_value}</td><td>Verified Clean</td></tr>`
      )
      .join("")}
  </table>
  `;

  return {
    filename: `Tasdeeq_Audit_Voucher_${Date.now()}.csv`,
    mimeType: "text/csv;charset=utf-8;",
    csvData,
    summaryHtml,
  };
}
