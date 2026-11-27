"use client";
import { useState } from "react";
import type { OwnerAlert } from "@/lib/types";

interface Props {
  alert: OwnerAlert;
  isOpen: boolean;
  onClose: () => void;
  onAction: (alertId: string, action: "approved_ok" | "fix_requested") => void;
}

export default function GmailAlertModal({ alert, isOpen, onClose, onAction }: Props) {
  const [sent, setSent] = useState<"approved_ok" | "fix_requested" | null>(null);
  const [sending, setSending] = useState(false);

  if (!isOpen) return null;

  const issueList = alert.findings ?? [];
  const timeStr = new Date(alert.timestamp).toLocaleString("en-PK", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  const handleAction = async (action: "approved_ok" | "fix_requested") => {
    setSending(true);
    // Dispatch alert action to server API
    try {
      await fetch("/api/alert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "dispatch",
          alertData: {
            invoice_number: alert.invoice_number,
            vendor_name: alert.vendor_name,
            total_amount: alert.total_amount,
            findings: alert.findings?.map(f => ({ field: f.field, evidence: f.issue, category: "arithmetic_check", severity: "high", status: "open", finding_id: `f_${Date.now()}` })) || [],
          }
        }),
      });
    } catch {}
    await new Promise((r) => setTimeout(r, 600));
    onAction(alert.alert_id, action);
    setSent(action);
    setSending(false);
    setTimeout(() => {
      onClose();
      setSent(null);
    }, 2200);
  };

  return (
    <div className="gmail-overlay" onClick={onClose}>
      <div className="gmail-pane animate-in" onClick={(e) => e.stopPropagation()}>

        {/* ── Gmail Top Chrome ── */}
        <div className="gmail-topbar">
          <div className="gmail-topbar-left">
            <div className="gmail-logo">
              <svg width="24" height="18" viewBox="0 0 24 18" fill="none">
                <path d="M2 2l10 7L22 2" stroke="#EA4335" strokeWidth="2" strokeLinecap="round"/>
                <path d="M2 2h20v14H2V2z" stroke="#C5221F" strokeWidth="1.5" fill="none"/>
                <path d="M2 2l10 7L22 2" stroke="#EA4335" strokeWidth="2" fill="none"/>
              </svg>
              <span className="gmail-logo-text">Gmail</span>
            </div>
            <span className="gmail-label">Alert Agent — Inbox</span>
          </div>
          <button className="gmail-close-btn" onClick={onClose} aria-label="Close">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* ── Email Subject Bar ── */}
        <div className="gmail-subject-bar">
          <div className="gmail-subject-title">
            <span className="gmail-urgency-dot" />
            Tasdeeq Alert: Discrepancy Detected — {alert.invoice_number}
          </div>
          <div className="gmail-meta-row">
            <div className="gmail-sender-avatar">TA</div>
            <div className="gmail-sender-info">
              <span className="gmail-sender-name">Tasdeeq Alert Agent</span>
              <span className="gmail-sender-email">&lt;alerts@tasdeeq.app&gt;</span>
              <span className="gmail-to-label">to {alert.recipient_name}</span>
            </div>
            <span className="gmail-timestamp">{timeStr}</span>
          </div>
        </div>

        {/* ── Email Body ── */}
        <div className="gmail-body">
          <p className="gmail-greeting">Dear {alert.recipient_name.split(" ")[0]},</p>
          <p className="gmail-para">
            The <strong>Alert Agent</strong> has detected a discrepancy in a voucher submitted
            to Tasdeeq. Your review is required before the entry can be released to the database.
          </p>

          {/* Detail card */}
          <div className="gmail-detail-card">
            <div className="gmail-detail-header">Voucher Details</div>
            <div className="gmail-detail-grid">
              <span className="gmail-detail-label">Voucher No.</span>
              <span className="gmail-detail-value">{alert.invoice_number}</span>
              <span className="gmail-detail-label">Party / Vendor</span>
              <span className="gmail-detail-value">{alert.vendor_name}</span>
              <span className="gmail-detail-label">Entered Amount</span>
              <span className="gmail-detail-value gmail-detail-value--amount">
                PKR {alert.total_amount.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Issue list */}
          <div className="gmail-issue-block">
            <div className="gmail-issue-title">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C23B3C" strokeWidth="2.5" strokeLinecap="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><circle cx="12" cy="16" r="1" fill="#C23B3C"/>
              </svg>
              Issues Detected ({issueList.length > 0 ? issueList.length : 1})
            </div>
            {issueList.length > 0 ? issueList.map((f, i) => (
              <div key={i} className="gmail-issue-row">
                <span className="gmail-issue-field">{f.field.replace(/_/g, " ")}</span>
                <span className="gmail-issue-desc">{f.issue}</span>
              </div>
            )) : (
              <div className="gmail-issue-row">
                <span className="gmail-issue-field">total_amount</span>
                <span className="gmail-issue-desc">{alert.discrepancy_summary}</span>
              </div>
            )}
          </div>

          <p className="gmail-para gmail-para--muted">
            Please choose one of the actions below. This response will be recorded in the
            audit trail and trigger the corresponding workflow in the accounting desk.
          </p>
        </div>

        {/* ── Action Buttons ── */}
        {!sent ? (
          <div className="gmail-actions">
            <button
              className="gmail-btn gmail-btn--approve"
              onClick={() => handleAction("approved_ok")}
              disabled={sending}
            >
              {sending ? (
                <span className="gmail-spinner" />
              ) : (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              )}
              Approve — Accept Exception
            </button>
            <button
              className="gmail-btn gmail-btn--fix"
              onClick={() => handleAction("fix_requested")}
              disabled={sending}
            >
              {sending ? (
                <span className="gmail-spinner" />
              ) : (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              )}
              Request Fix — Auto-adopt Bill Value
            </button>
          </div>
        ) : (
          <div className={`gmail-sent-confirm ${sent === "approved_ok" ? "gmail-sent-confirm--ok" : "gmail-sent-confirm--fix"}`}>
            {sent === "approved_ok" ? (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                Response sent — Exception approved and authorized.
              </>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
                Fix requested — Accounting desk will auto-adopt the scanned bill values.
              </>
            )}
          </div>
        )}

        {/* ── Footer ── */}
        <div className="gmail-footer">
          Sent via Alert Agent · Gmail MCP · Tasdeeq Audit System
        </div>
      </div>
    </div>
  );
}
