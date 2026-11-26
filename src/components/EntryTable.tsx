"use client";
import { useEffect, useState } from "react";
import type { TypedEntry, ExpenseCategory } from "@/lib/types";
import { autoSortCategory, teachCategory } from "@/lib/sorter-agent";

const FIELD_LABELS: Record<string, string> = {
  vendor_name:    "Vendor / Shop Name",
  invoice_number: "Invoice / Bill #",
  date:           "Date",
  total_amount:   "Total Amount",
  quantity:       "Quantity (line 1)",
  unit_price:     "Unit Price (line 1)",
};

interface Props {
  entries: TypedEntry[];
  onChange: (entries: TypedEntry[]) => void;
  category?: ExpenseCategory;
  onCategoryChange?: (category: ExpenseCategory) => void;
}

export default function EntryTable({ entries, onChange, category, onCategoryChange }: Props) {
  const [detectedCategory, setDetectedCategory] = useState<ExpenseCategory>(category || "Miscellaneous");
  const [matchSource, setMatchSource] = useState<string>("database");
  const [manualOverride, setManualOverride] = useState(false);

  const vendorEntry = entries.find((e) => e.field === "vendor_name");
  const vendorValue = vendorEntry?.typed_value || "";

  // Re-classify automatically whenever the vendor name changes
  useEffect(() => {
    setManualOverride(false);
    if (vendorValue.trim()) {
      const pred = autoSortCategory(vendorValue);
      setDetectedCategory(pred.category);
      setMatchSource(pred.matchSource);
      if (onCategoryChange) {
        onCategoryChange(pred.category);
      }
    }
  }, [vendorValue]);

  const update = (id: string, value: string) => {
    onChange(entries.map((e) => (e.id === id ? { ...e, typed_value: value } : e)));
  };

  const handleCategorySelect = (newCat: ExpenseCategory) => {
    setManualOverride(true);
    setDetectedCategory(newCat);
    setMatchSource("learned");
    if (onCategoryChange) onCategoryChange(newCat);
    if (vendorValue.trim()) {
      teachCategory(vendorValue.trim(), newCat);
      // Persist to server-side Sorter Agent memory as well
      fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "teach_sorter",
          payload: { partyName: vendorValue.trim(), category: newCat },
        }),
      }).catch(() => {});
    }
  };

  const activeCategory = manualOverride && category ? category : category || detectedCategory;

  return (
    <div style={{ overflowX: "auto" }}>
      <table className="data-table">
        <thead>
          <tr>
            <th style={{ width: "40%" }}>Field</th>
            <th>Your Typed Value</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr key={entry.id}>
              <td style={{ color: "var(--text-secondary)", fontSize: "13px" }}>
                {FIELD_LABELS[entry.field] ?? entry.field}
              </td>
              <td>
                <input
                  className="table-input"
                  type="text"
                  value={entry.typed_value}
                  onChange={(e) => update(entry.id, e.target.value)}
                  placeholder="Enter value…"
                  id={`entry-${entry.field}`}
                  aria-label={`Typed value for ${FIELD_LABELS[entry.field] ?? entry.field}`}
                />
              </td>
            </tr>
          ))}
          {/* Sorter Agent Auto-Sort Category Row */}
          <tr style={{ background: "rgba(16, 34, 72, 0.03)" }}>
            <td style={{ color: "var(--text-secondary)", fontSize: "13px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                <strong style={{ color: "var(--pk-navy)" }}>Expense Category</strong>
                <span style={{ fontSize: "11px", color: "var(--accent)", fontWeight: 500 }}>
                  Sorter Agent ({matchSource === "learned" ? "Learned Memory" : "Auto-Classifier"})
                </span>
              </div>
            </td>
            <td>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                <select
                  value={activeCategory}
                  onChange={(e) => handleCategorySelect(e.target.value as ExpenseCategory)}
                  className="table-input"
                  style={{ fontWeight: "600", color: "var(--text-primary)", flex: 1, minWidth: "200px" }}
                  aria-label="Expense Category"
                >
                  <option value="Utilities">Utilities (Electricity / Gas / Water)</option>
                  <option value="Raw Materials / Inventory">Raw Materials / Inventory</option>
                  <option value="Office Supplies">Office Supplies</option>
                  <option value="Logistics & Fuel">Logistics &amp; Fuel</option>
                  <option value="Facility & Rent">Facility &amp; Rent</option>
                  <option value="Professional Services">Professional Services</option>
                  <option value="Maintenance & Repairs">Maintenance &amp; Repairs</option>
                  <option value="Miscellaneous">Miscellaneous</option>
                </select>
                <span
                  className="hub-status-dot"
                  style={{
                    color: "#0F7B6C",
                    borderColor: "rgba(15, 123, 108, 0.25)",
                    background: "rgba(15, 123, 108, 0.08)",
                  }}
                >
                  <span className="hub-status-pulse" style={{ background: "#0F7B6C" }} />
                  Auto-sorted
                </span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <p style={{ color: "var(--text-muted)", fontSize: "11px", marginTop: "10px" }}>
        Fill in the values you typed into your records, then compare against the document.
      </p>
    </div>
  );
}
