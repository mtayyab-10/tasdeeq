/**
 * sorter-agent.ts
 * Sorter Agent: Auto-sort into categories.
 * Learns party-to-category associations and maintains a knowledge base
 * so staff stop choosing expense categories by hand.
 */
import type { ExpenseCategory, PartyCategoryMapping } from "./types";

// Base category dictionary for common Pakistani and general commercial entities
const DEFAULT_RULES: Array<{ keywords: string[]; category: ExpenseCategory }> = [
  {
    keywords: [
      "lesco", "k-electric", "kelectric", "iesco", "gepco", "fesco", "mepco", "pesco",
      "sui", "ssgc", "sngpl", "wapda", "electricity", "bijli", "water", "wasa", "gas", "utility", "utilities"
    ],
    category: "Utilities",
  },
  {
    keywords: [
      "rice", "flour", "atta", "sugar", "grain", "oil", "ghee", "general store", "al-kareem",
      "packages", "wholesale", "packaging", "carton", "raw material", "cement", "steel", "cotton", "textile"
    ],
    category: "Raw Materials / Inventory",
  },
  {
    keywords: [
      "stationery", "paper", "print", "printing", "xerox", "photocopy", "toner", "ink",
      "metro cash", "staples", "office depot", "pens", "files", "envelopes"
    ],
    category: "Office Supplies",
  },
  {
    keywords: [
      "pso", "shell", "total", "parco", "attock", "petroleum", "fuel", "diesel", "petrol",
      "cng", "careem", "uber", "freight", "cargo", "tcs", "leopard", "delivery", "logistics"
    ],
    category: "Logistics & Fuel",
  },
  {
    keywords: [
      "rent", "plaza", "commercial", "building", "lease", "estate", "landlord", "tenancy", "shop rent", "warehouse"
    ],
    category: "Facility & Rent",
  },
  {
    keywords: [
      "kpmg", "ferguson", "pwc", "deloitte", "ey", "auditor", "legal", "advocate", "law",
      "tax", "consultant", "fbr", "professional", "chartered"
    ],
    category: "Professional Services",
  },
  {
    keywords: [
      "repair", "generator", "electrician", "plumber", "ac service", "hardware", "maintenance",
      "spare parts", "overhaul", "workshop"
    ],
    category: "Maintenance & Repairs",
  },
];

// Persistent learned memory store (simulates database party-category remembrance)
const learnedMemory = new Map<string, ExpenseCategory>([
  ["al-kareem general store", "Raw Materials / Inventory"],
  ["lesco", "Utilities"],
  ["pakistan state oil (pso)", "Logistics & Fuel"],
  ["metro cash & carry", "Office Supplies"],
]);

/**
 * Sorter Agent: Auto-sort into categories
 * Inspects party name and description, checks learned memory, matches rules,
 * and returns predicted category with high confidence.
 */
export function autoSortCategory(
  partyName?: string | null,
  description?: string | null
): PartyCategoryMapping {
  const pName = (partyName || "").trim().toLowerCase();
  const desc = (description || "").trim().toLowerCase();
  const combined = `${pName} ${desc}`.trim();

  // 1. Check Learned Database Memory
  if (pName && learnedMemory.has(pName)) {
    return {
      partyName: partyName!,
      category: learnedMemory.get(pName)!,
      confidence: 0.98,
      matchSource: "learned",
    };
  }

  // 2. Keyword & Rule Matching
  for (const rule of DEFAULT_RULES) {
    for (const kw of rule.keywords) {
      if (combined.includes(kw)) {
        return {
          partyName: partyName || "Party",
          category: rule.category,
          confidence: 0.92,
          matchSource: "database",
        };
      }
    }
  }

  // 3. Fallback
  return {
    partyName: partyName || "General",
    category: "Miscellaneous",
    confidence: 0.5,
    matchSource: "default",
  };
}

/**
 * Sorter Agent: Teach & Remember
 * When user manually selects or confirms a category, remember it for next time.
 */
export function teachCategory(partyName: string, category: ExpenseCategory): void {
  if (!partyName) return;
  const key = partyName.trim().toLowerCase();
  learnedMemory.set(key, category);
}

/**
 * Get all learned memory mappings
 */
export function getLearnedPartyMemory(): Array<{ party: string; category: ExpenseCategory }> {
  return Array.from(learnedMemory.entries()).map(([party, category]) => ({
    party,
    category,
  }));
}
