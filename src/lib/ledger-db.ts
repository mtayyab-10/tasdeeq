/**
 * ledger-db.ts
 * Historical voucher database & Checker Agent's duplicate bill detector.
 * Simulates Supabase / SQL database connection with real-time in-memory persistence.
 */
import type { HistoricalVoucher, ExpenseCategory } from "./types";

// Initial historical ledger dataset (simulating past entries already recorded in accounting)
const INITIAL_LEDGER: HistoricalVoucher[] = [
  {
    id: "VCH-2026-0089",
    invoice_number: "LESCO-992144",
    vendor_name: "LESCO (Lahore Electric)",
    date: "2026-10-02",
    total_amount: 34500,
    category: "Utilities",
    status: "verified",
    source: "Supabase DB - Synced",
    entered_at: "2026-10-02T10:14:00Z",
  },
  {
    id: "VCH-2026-0094",
    invoice_number: "INV-2026-0711",
    vendor_name: "Packages Limited",
    date: "2026-10-08",
    total_amount: 86400,
    category: "Raw Materials / Inventory",
    status: "verified",
    source: "Supabase DB - Synced",
    entered_at: "2026-10-08T14:22:00Z",
  },
  {
    id: "VCH-2026-0102",
    invoice_number: "PSO-FL-4819",
    vendor_name: "Pakistan State Oil (PSO)",
    date: "2026-10-11",
    total_amount: 14200,
    category: "Logistics & Fuel",
    status: "verified",
    source: "Supabase DB - Synced",
    entered_at: "2026-10-11T09:05:00Z",
  },
  {
    id: "VCH-2026-0118",
    invoice_number: "DUP-TEST-9901",
    vendor_name: "Metro Cash & Carry",
    date: "2026-10-14",
    total_amount: 28500,
    category: "Office Supplies",
    status: "verified",
    source: "Supabase DB - Synced",
    entered_at: "2026-10-14T16:40:00Z",
  },
  {
    id: "VCH-2026-0125",
    invoice_number: "INV-2026-0701",
    vendor_name: "Al-Kareem General Store",
    date: "2026-09-28",
    total_amount: 32000,
    category: "Raw Materials / Inventory",
    status: "verified",
    source: "Supabase DB - Synced",
    entered_at: "2026-09-28T11:30:00Z",
  },
];

// In-memory runtime ledger
let ledgerStore: HistoricalVoucher[] = [...INITIAL_LEDGER];

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  matchType?: "exact_invoice" | "fuzzy_amount_vendor";
  matchedVoucher?: HistoricalVoucher;
  reason?: string;
}

/**
 * Checker Agent - Duplicate Bill Finder
 * Compares incoming voucher with historical entries in the database.
 */
export function findDuplicateBills(
  invoiceNumber?: string | null,
  vendorName?: string | null,
  date?: string | null,
  totalAmount?: number | null
): DuplicateCheckResult {
  if (!invoiceNumber && !vendorName) {
    return { isDuplicate: false };
  }

  const cleanInv = invoiceNumber
    ? invoiceNumber.replace(/[^a-zA-Z0-9]/g, "").toLowerCase()
    : "";
  const cleanVendor = vendorName ? vendorName.trim().toLowerCase() : "";

  for (const item of ledgerStore) {
    const itemCleanInv = item.invoice_number.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
    const itemCleanVendor = item.vendor_name.trim().toLowerCase();

    // 1. Exact Invoice Match
    if (cleanInv && itemCleanInv && cleanInv === itemCleanInv) {
      return {
        isDuplicate: true,
        matchType: "exact_invoice",
        matchedVoucher: item,
        reason: `Bill #${item.invoice_number} already exists in accounting records (Voucher ${item.id}, dated ${item.date}, PKR ${item.total_amount.toLocaleString()}).`,
      };
    }

    // 2. Fuzzy match: Same vendor + Same total amount
    const vendorMatchFuzzy =
      cleanVendor &&
      (itemCleanVendor.includes(cleanVendor) || cleanVendor.includes(itemCleanVendor));
    if (
      vendorMatchFuzzy &&
      totalAmount != null
    ) {
      if (Math.abs(item.total_amount - totalAmount) < 1.0) {
        return {
          isDuplicate: true,
          matchType: "fuzzy_amount_vendor",
          matchedVoucher: item,
          reason: `Potential duplicate: Same vendor (${item.vendor_name}) and identical total (PKR ${(totalAmount as number).toLocaleString()}) was recorded on ${item.date} under Voucher ${item.id}.`,
        };
      }
    }
  }

  return { isDuplicate: false };
}

/**
 * Add a new verified voucher to the ledger
 */
export function recordVoucherInLedger(voucher: Omit<HistoricalVoucher, "id" | "entered_at">): HistoricalVoucher {
  const newVoucher: HistoricalVoucher = {
    ...voucher,
    id: `VCH-2026-${String(ledgerStore.length + 100).padStart(4, "0")}`,
    entered_at: new Date().toISOString(),
  };
  ledgerStore.unshift(newVoucher);
  return newVoucher;
}

/**
 * Get all historical ledger entries
 */
export function getLedgerEntries(): HistoricalVoucher[] {
  return [...ledgerStore];
}

/**
 * Seed or reset ledger for demo testing
 */
export function resetLedgerStore(): void {
  ledgerStore = [...INITIAL_LEDGER];
}
