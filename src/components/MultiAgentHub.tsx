"use client";
import { useEffect, useState } from "react";
import type { ExpenseCategory } from "@/lib/types";
import { getLearnedPartyMemory, teachCategory } from "@/lib/sorter-agent";

interface Props {
  onOpenGmailAlert: () => void;
  onOpenWeeklySummary: () => void;
  onOpenMonthEnd: () => void;
  onLoadDuplicateDemo: () => void;
  onDriveFolderSync: () => void;
}

const AGENTS = [
  {
    name: "Alert Agent",
    mcp: "Gmail",
    mcpColor: "gmail",
    desc: "Sends a discrepancy alert to the business owner — owner replies Approve or Fix",
    status: "Active",
    statusColor: "#0F7B6C",
    action: "openGmail",
    actionLabel: "Open Alert",
  },
  {
    name: "Report Agent",
    mcp: "Gmail",
    mcpColor: "gmail",
    desc: "Emails a weekly executive summary every Monday morning",
    status: "Scheduled",
    statusColor: "#0F7B6C",
    action: "openWeekly",
    actionLabel: "View Summary",
  },
  {
    name: "Report Agent",
    mcp: "Google Sheets / Excel",
    mcpColor: "sheets",
    desc: "Writes the official audit record and powers one-click Excel exports",
    status: "Standby",
    statusColor: "#9A5B00",
    action: null,
    actionLabel: null,
  },
  {
    name: "Closing Agent",
    mcp: "Google Sheets / Excel",
    mcpColor: "sheets",
    desc: "Reads all ledger entries for the month-end closing checklist",
    status: "Ready",
    statusColor: "#2F5FD0",
    action: "openMonthEnd",
    actionLabel: "Open Checklist",
  },
  {
    name: "Reader Agent",
    mcp: "Google Drive",
    mcpColor: "drive",
    desc: "Picks up bill photos from shared folders — reads English & Urdu text to auto-fill forms",
    status: "Online",
    statusColor: "#0F7B6C",
    action: "syncDrive",
    actionLabel: "Sync Drive",
  },
  {
    name: "Checker Agent",
    mcp: "Database (Supabase)",
    mcpColor: "db",
    desc: "Finds duplicate bills in historical entries to prevent double payments",
    status: "Monitoring",
    statusColor: "#0F7B6C",
    action: "testDuplicate",
    actionLabel: "Test Detector",
  },
  {
    name: "Sorter Agent",
    mcp: "Database (Supabase)",
    mcpColor: "db",
    desc: "Remembers which expense category each party belongs to — learns from every correction",
    status: "Learned",
    statusColor: "#0F7B6C",
    action: null,
    actionLabel: null,
  },
  {
    name: "Manager Agent",
    mcp: "Calendar",
    mcpColor: "cal",
    desc: "Master orchestrator — schedules Monday summary and month-end closing check",
    status: "Orchestrating",
    statusColor: "#4f46e5",
    action: null,
    actionLabel: null,
  },
] as const;

type AgentAction = typeof AGENTS[number]["action"];

export default function MultiAgentHub({
  onOpenGmailAlert,
  onOpenWeeklySummary,
  onOpenMonthEnd,
  onLoadDuplicateDemo,
  onDriveFolderSync,
}: Props) {
  const [showMemory, setShowMemory] = useState(false);
  const [learnedParties, setLearnedParties] = useState(getLearnedPartyMemory());
  const [newParty, setNewParty] = useState("");
  const [newCat, setNewCat] = useState<ExpenseCategory>("Utilities");
  const [taught, setTaught] = useState(false);

  // Hydrate persisted learned parties from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("tasdeeq_learned_parties");
      if (saved) {
        const parsed = JSON.parse(saved) as Array<{ party: string; category: ExpenseCategory }>;
        parsed.forEach((p) => teachCategory(p.party, p.category));
        setLearnedParties(getLearnedPartyMemory());
      }
    } catch {}
  }, []);

  const handleTeach = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newParty.trim()) return;
    teachCategory(newParty.trim(), newCat);
    const updated = getLearnedPartyMemory();
    setLearnedParties(updated);
    try {
      localStorage.setItem("tasdeeq_learned_parties", JSON.stringify(updated));
    } catch {}
    fetch("/api/agents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "teach_sorter",
        payload: { partyName: newParty.trim(), category: newCat },
      }),
    }).catch(() => {});
    setNewParty("");
    setTaught(true);
    setTimeout(() => setTaught(false), 2000);
  };

  const handleAgentAction = (action: AgentAction) => {
    if (action === "openGmail") onOpenGmailAlert();
    else if (action === "openWeekly") onOpenWeeklySummary();
    else if (action === "openMonthEnd") onOpenMonthEnd();
    else if (action === "testDuplicate") onLoadDuplicateDemo();
    else if (action === "syncDrive") onDriveFolderSync();
  };

  return (
    <div className="hub-card" id="multi-agent-hub">
      {/* ── Header ── */}
      <div className="hub-header">
        <div className="hub-header-left">
          <div className="hub-swarm-pill">
            <span className="hub-pulse" />
            Multi-Agent Swarm
          </div>
          <p className="hub-subtitle">
            8 specialized agents, each with one job, orchestrated by the <strong>Manager Agent</strong>
          </p>
        </div>
        <div className="hub-quick-actions">
          <button className="hub-quick-btn" onClick={onOpenGmailAlert}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <rect x="2" y="4" width="20" height="16" rx="2"/><polyline points="2,4 12,13 22,4"/>
            </svg>
            Gmail Alert
          </button>
          <button className="hub-quick-btn" onClick={onOpenWeeklySummary}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/>
            </svg>
            Weekly Report
          </button>
          <button className="hub-quick-btn" onClick={onOpenMonthEnd}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
            </svg>
            Month-End
          </button>
          <button className="hub-quick-btn hub-quick-btn--outline" onClick={onLoadDuplicateDemo}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            Test Duplicate Finder
          </button>
        </div>
      </div>

      {/* ── Agent Roster Table ── */}
      <div className="hub-table-wrap">
        <table className="hub-table">
          <thead>
            <tr>
              <th>Agent</th>
              <th>MCP Tool Connected</th>
              <th>What it does</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {AGENTS.map((agent, idx) => (
              <tr key={idx} className={agent.name === "Manager Agent" ? "hub-row hub-row--manager" : "hub-row"}>
                <td className="hub-cell-agent">
                  <strong>{agent.name}</strong>
                </td>
                <td>
                  <span className={`mcp-pill mcp-pill--${agent.mcpColor}`}>{agent.mcp}</span>
                </td>
                <td className="hub-cell-desc">{agent.desc}</td>
                <td>
                  <span
                    className="hub-status-dot"
                    style={{ color: agent.statusColor, borderColor: agent.statusColor + "33", background: agent.statusColor + "11" }}
                  >
                    <span className="hub-status-pulse" style={{ background: agent.statusColor }} />
                    {agent.status}
                  </span>
                </td>
                <td className="hub-cell-action">
                  {agent.action && (
                    <button
                      className="hub-action-btn"
                      onClick={() => handleAgentAction(agent.action)}
                    >
                      {agent.actionLabel}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Sorter Agent Memory Drawer ── */}
      <div className="hub-memory-section">
        <button
          className="hub-memory-toggle"
          onClick={() => setShowMemory(!showMemory)}
        >
          <svg
            width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round"
            style={{ transform: showMemory ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}
          >
            <polyline points="6 9 12 15 18 9"/>
          </svg>
          Sorter Agent Category Memory
          <span className="hub-memory-count">{learnedParties.length} parties remembered</span>
        </button>

        {showMemory && (
          <div className="hub-memory-panel animate-in">
            {learnedParties.length > 0 && (
              <div className="hub-memory-pills">
                {learnedParties.map((p, i) => (
                  <div key={i} className="hub-memory-chip">
                    <span className="hub-memory-chip-name">{p.party}</span>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                    </svg>
                    <span className="hub-memory-chip-cat">{p.category}</span>
                  </div>
                ))}
              </div>
            )}

            <form onSubmit={handleTeach} className="hub-teach-form">
              <div className="hub-teach-label">Teach a new rule:</div>
              <div className="hub-teach-row">
                <input
                  type="text"
                  placeholder="Party name (e.g. SNGPL Gas, TCS Express)"
                  value={newParty}
                  onChange={(e) => setNewParty(e.target.value)}
                  className="hub-teach-input"
                />
                <select
                  value={newCat}
                  onChange={(e) => setNewCat(e.target.value as ExpenseCategory)}
                  className="hub-teach-select"
                >
                  <option>Utilities</option>
                  <option>Raw Materials / Inventory</option>
                  <option>Office Supplies</option>
                  <option>Logistics &amp; Fuel</option>
                  <option>Facility &amp; Rent</option>
                  <option>Professional Services</option>
                  <option>Maintenance &amp; Repairs</option>
                  <option>Miscellaneous</option>
                </select>
                <button type="submit" className="hub-teach-btn">
                  {taught ? "Saved ✓" : "Teach Agent"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
