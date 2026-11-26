import { z } from "zod";

// ── Extracted line item from the document image ──────────────────────────────
export const ExtractedLineItemSchema = z.object({
  description: z.string(),
  quantity: z.number().optional().nullable(),
  unit_price: z.number().optional().nullable(),
  line_total: z.number().optional().nullable(),
});

// ── Full extraction result returned by Gemma ─────────────────────────────────
export const ExtractionResultSchema = z.object({
  vendor_name: z.string().optional().nullable(),
  invoice_number: z.string().optional().nullable(),
  date: z.string().optional().nullable(),
  line_items: z.array(ExtractedLineItemSchema).default([]),
  subtotal: z.number().optional().nullable(),
  tax: z.number().optional().nullable(),
  total_amount: z.number().optional().nullable(),
  currency: z.string().optional().nullable(),
  raw_text_snippet: z.string().optional().nullable(),
  language_detected: z.enum(["en", "ur", "mixed"]).optional().nullable(),
});

export type ExtractionResult = z.infer<typeof ExtractionResultSchema>;
export type ExtractedLineItem = z.infer<typeof ExtractedLineItemSchema>;

// ── A single typed entry / captured form entry ───────────────────────────────
export const TypedEntrySchema = z.object({
  id: z.string(),
  field: z.string(),
  label: z.string().optional(),
  typed_value: z.string(),
  field_type: z.string().optional(), // 'number', 'text', 'date', 'select', etc.
});
export type TypedEntry = z.infer<typeof TypedEntrySchema>;

// ── Finding Categories (Required 4 distinct categories) ──────────────────────
export const FindingCategorySchema = z.enum([
  "rule_violation",       // Deterministic check established a failure
  "contextual_suspicion",  // AI or statistical analysis identified anomaly/suspicion
  "uncertain_extraction", // Value unreadable / OCR confidence low
  "missing_context",      // Responsible evaluation requires additional context
]);
export type FindingCategory = z.infer<typeof FindingCategorySchema>;

// ── Severity ─────────────────────────────────────────────────────────────────
export const SeveritySchema = z.enum(["blocking", "warning", "info", "high", "medium", "low"]);
export type Severity = z.infer<typeof SeveritySchema>;

// ── Finding Status & Audit ───────────────────────────────────────────────────
export const FindingStatusSchema = z.enum([
  "open",
  "resolved_accepted",  // Legitimate exception accepted with reason
  "resolved_corrected", // Value corrected to accurate figure
  "dismissed",          // Dismissed with explicit explanation
  // Legacy aliases for backward compatibility:
  "accepted_doc",
  "kept_typed",
  "edited",
]);
export type FindingStatus = z.infer<typeof FindingStatusSchema>;

export interface ResolutionAudit {
  status: FindingStatus;
  timestamp: string;
  reason?: string;
  previous_value: string;
  resolved_value: string;
}

// ── Full Finding Structure ───────────────────────────────────────────────────
export const FindingSchema = z.object({
  finding_id: z.string(),
  rule_id: z.string(),
  category: FindingCategorySchema.default("rule_violation"),
  field: z.string(),
  label: z.string().optional(),
  typed_value: z.string(),
  document_value: z.string().default("").optional(),
  observed_value: z.string().optional(),
  expected_value: z.string().optional(),
  evidence: z.string(),
  explanation: z.string().optional(),
  suggested_action: z.string().optional(),
  confidence: z.enum(["high", "medium", "low"]).default("high"),
  severity: SeveritySchema,
  status: FindingStatusSchema.default("open"),
  resolved_value: z.string().optional(),
  resolution_reason: z.string().optional(),
  audit_trail: z.array(z.any()).optional(),
});
export type Finding = z.infer<typeof FindingSchema>;

// ── Quality Gate State ───────────────────────────────────────────────────────
export type QualityGateState =
  | "not_checked"
  | "checking"
  | "needs_review"
  | "blocked"
  | "ready_for_release"
  | "released";

// ── Business Context ─────────────────────────────────────────────────────────
export const BusinessContextSchema = z.object({
  business_type: z.string().default("General Commerce"),
  currency: z.string().default("PKR"),
  reporting_period: z.string().default("Current Period"),
  allowed_variance_pct: z.number().default(0),
  notes: z.string().optional(),
});
export type BusinessContext = z.infer<typeof BusinessContextSchema>;

// ── Release Record ───────────────────────────────────────────────────────────
export interface ReleaseRecord {
  release_id: string;
  timestamp: string;
  quality_gate_state: "released";
  total_entries: number;
  total_findings: number;
  resolved_findings: number;
  data_snapshot: TypedEntry[];
  audit_log: {
    finding_id: string;
    field: string;
    category: FindingCategory;
    resolution: FindingStatus;
    reason?: string;
    final_value: string;
  }[];
  verification_checksum: string;
}

// ── API request/response shapes ───────────────────────────────────────────────
export const ExtractRequestSchema = z.object({
  imageBase64: z.string(),
  mimeType: z.string(),
});

export const SummarizeRequestSchema = z.object({
  findings: z.array(FindingSchema),
  language: z.enum(["en", "ur"]),
});

export const VerifyRequestSchema = z.object({
  entries: z.array(TypedEntrySchema),
  documentExtraction: ExtractionResultSchema.optional().nullable(),
  context: BusinessContextSchema.optional(),
});
export type VerifyRequest = z.infer<typeof VerifyRequestSchema>;

export const ReleaseRequestSchema = z.object({
  entries: z.array(TypedEntrySchema),
  findings: z.array(FindingSchema),
  context: BusinessContextSchema.optional(),
});
export type ReleaseRequest = z.infer<typeof ReleaseRequestSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// ── MULTI-AGENT ARCHITECTURE & SPECIALIZED EXTENSIONS ────────────────────────
// ─────────────────────────────────────────────────────────────────────────────

export type AgentRole =
  | "manager_agent"
  | "reader_agent"
  | "checker_agent"
  | "sorter_agent"
  | "alert_agent"
  | "report_agent"
  | "closing_agent";

export type AgentMCPTool =
  | "Calendar"
  | "Google Drive"
  | "Database (like Supabase)"
  | "Gmail"
  | "Google Sheets or Excel";

export interface AgentCardInfo {
  role: AgentRole;
  name: string;
  mcpTool: AgentMCPTool;
  title: string;
  description: string;
  status: "idle" | "working" | "completed" | "alerting";
  lastAction?: string;
  activityCount: number;
}

// ── Expense Categories & Sorter Agent ─────────────────────────────────────────
export type ExpenseCategory =
  | "Utilities"
  | "Raw Materials / Inventory"
  | "Office Supplies"
  | "Logistics & Fuel"
  | "Facility & Rent"
  | "Professional Services"
  | "Maintenance & Repairs"
  | "Miscellaneous";

export interface PartyCategoryMapping {
  partyName: string;
  category: ExpenseCategory;
  confidence: number;
  matchSource: "learned" | "database" | "ai" | "default";
}

// ── Historical Record for Checker Agent (Duplicate Bill Finder) ───────────────
export interface HistoricalVoucher {
  id: string;
  invoice_number: string;
  vendor_name: string;
  date: string;
  total_amount: number;
  category?: ExpenseCategory;
  status: "verified" | "flagged" | "draft";
  source: string;
  entered_at: string;
}

// ── Owner Alert (Gmail) ───────────────────────────────────────────────────────
export interface OwnerAlert {
  alert_id: string;
  timestamp: string;
  recipient_phone: string;
  recipient_name: string;
  invoice_number: string;
  vendor_name: string;
  total_amount: number;
  discrepancy_summary: string;
  findings: Array<{ field: string; issue: string }>;
  status: "pending" | "approved_ok" | "fix_requested";
  action_timestamp?: string;
}

/** @deprecated Use OwnerAlert instead */
export type WhatsAppAlert = OwnerAlert;

// ── Weekly Summary for Report Agent ───────────────────────────────────────────
export interface WeeklySummaryReport {
  week_period: string;
  mistakes_caught: number;
  hours_saved: number;
  amount_protected_pkr: number;
  breakdown: {
    arithmetic_errors: number;
    duplicate_bills: number;
    outlier_prices: number;
    transpositions: number;
    missing_fields: number;
  };
  top_flagged_vendors: Array<{ vendor: string; count: number }>;
  generated_by: string;
  scheduled_by: string;
  email_recipient?: string;
  status: "scheduled" | "sent";
}

// ── Month-End Checklist for Closing Agent ─────────────────────────────────────
export interface MonthEndChecklistItem {
  id: string;
  voucher_id: string;
  vendor_name: string;
  title: string;
  issue: string;
  severity: "blocking" | "warning";
  recommended_fix: string;
  resolved: boolean;
}

export interface MonthEndChecklist {
  month_year: string;
  total_vouchers_scanned: number;
  clean_vouchers: number;
  open_issues_count: number;
  checklist_items: MonthEndChecklistItem[];
  closing_status: "needs_action" | "ready_for_close" | "closed";
  closed_at?: string;
  closing_certificate_hash?: string;
}

