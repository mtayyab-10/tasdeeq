import {
  runDeterministicChecks,
  runStatisticalSignals,
  evaluateQualityGate,
  runUnifiedVerification,
} from "./src/lib/verification-engine.ts";
import { findDuplicateBills, getLedgerEntries } from "./src/lib/ledger-db.ts";
import { autoSortCategory, teachCategory } from "./src/lib/sorter-agent.ts";

console.log("=== TRUENORTH MULTI-AGENT AUTOMATED TEST SUITE ===");

let passed = 0;
let failed = 0;

function assert(condition, name) {
  if (condition) {
    console.log(`✅ PASS: ${name}`);
    passed++;
  } else {
    console.error(`❌ FAIL: ${name}`);
    failed++;
  }
}

// ── ORIGINAL TESTS (Preserved) ────────────────────────────────────────────────

// Test 1: Deterministic Arithmetic Check
const arithmeticSample = [
  { id: "1", field: "vendor_name", typed_value: "Al-Kareem Store" },
  { id: "2", field: "invoice_number", typed_value: "INV-100" },
  { id: "3", field: "date", typed_value: "2026-10-15" },
  { id: "4", field: "quantity", typed_value: "5" },
  { id: "5", field: "unit_price", typed_value: "1000" },
  { id: "6", field: "total_amount", typed_value: "99999" }, // Math mismatch: 5 x 1000 = 5000 != 99999
];

const detFindings = runDeterministicChecks(arithmeticSample);
const mathFinding = detFindings.find((f) => f.rule_id === "RULE_MATH_MISMATCH");
assert(!!mathFinding, "Deterministic check detects quantity * unit_price arithmetic mismatch");
assert(mathFinding?.severity === "blocking", "Arithmetic mismatch is marked blocking");

// Test 2: Missing Required Field
const missingSample = [
  { id: "1", field: "vendor_name", typed_value: "" }, // missing vendor
  { id: "2", field: "invoice_number", typed_value: "INV-100" },
  { id: "3", field: "date", typed_value: "2026-10-15" },
  { id: "4", field: "total_amount", typed_value: "5000" },
];
const missingFindings = runDeterministicChecks(missingSample);
const reqFinding = missingFindings.find((f) => f.rule_id === "RULE_REQ_FIELD" && f.field === "vendor_name");
assert(!!reqFinding, "Missing required vendor name is detected as a blocking rule violation");

// Test 3: Statistical Benchmark Signal
const outlierSample = [
  { id: "1", field: "vendor_name", typed_value: "Basmati Rice Supplier" },
  { id: "2", field: "unit_price", typed_value: "35000" }, // 10x market normal of 3,200
  { id: "3", field: "item_description", typed_value: "Basmati Rice 25kg" },
];
const statFindings = runStatisticalSignals(outlierSample);
const priceOutlier = statFindings.find((f) => f.rule_id === "STAT_PRICE_OUTLIER_HIGH");
assert(!!priceOutlier, "Statistical benchmark flags unit price 10x higher than market baseline as contextual suspicion");
assert(priceOutlier?.category === "contextual_suspicion", "Category is correctly contextual_suspicion");

// Test 4: Quality Gate Evaluation
const openBlockingGate = evaluateQualityGate(detFindings);
assert(openBlockingGate.gateState === "blocked", "Quality gate blocks release when open blocking violations exist");

// Resolve finding and re-evaluate
const resolvedFindings = detFindings.map((f) => ({ ...f, status: "resolved_corrected" }));
const clearGate = evaluateQualityGate(resolvedFindings);
assert(clearGate.gateState === "ready_for_release", "Quality gate allows release when all blocking findings are resolved");

// ── NEW MULTI-AGENT TESTS ─────────────────────────────────────────────────────

// Test 5: Checker Agent — Duplicate Bill Detection (exact invoice match)
const dupCheck = findDuplicateBills("LESCO-992144", "LESCO (Lahore Electric)", "2026-10-02", 34500);
assert(dupCheck.isDuplicate === true, "Checker Agent: exact invoice number match is flagged as duplicate");
assert(dupCheck.matchType === "exact_invoice", "Checker Agent: duplicate match type is exact_invoice");
assert(dupCheck.matchedVoucher?.id === "VCH-2026-0089", "Checker Agent: matched the correct historical voucher ID");

// Test 6: Checker Agent — No duplicate for a fresh bill
const noDup = findDuplicateBills("INV-BRAND-NEW-9999", "New Vendor XYZ", "2026-11-20", 12345);
assert(noDup.isDuplicate === false, "Checker Agent: genuinely new bill is not flagged as duplicate");

// Test 7: Checker Agent is wired into deterministic checks pipeline
const dupEntrySample = [
  { id: "1", field: "vendor_name", typed_value: "LESCO (Lahore Electric)" },
  { id: "2", field: "invoice_number", typed_value: "LESCO-992144" }, // exists in DB
  { id: "3", field: "date", typed_value: "2026-10-02" },
  { id: "4", field: "total_amount", typed_value: "34500" },
  { id: "5", field: "quantity", typed_value: "1" },
  { id: "6", field: "unit_price", typed_value: "34500" },
];
const dupPipelineFindings = runDeterministicChecks(dupEntrySample);
const dupFinding = dupPipelineFindings.find((f) => f.rule_id === "CHECKER_DUPLICATE_BILL");
assert(!!dupFinding, "Checker Agent integrated: duplicate bill detected inside full verification pipeline");
assert(dupFinding?.severity === "blocking", "Duplicate bill finding is correctly marked blocking");

// Test 8: Sorter Agent — Keyword Auto-Sort for Utilities
const electricResult = autoSortCategory("LESCO (Lahore Electric)", "electricity bill");
assert(electricResult.category === "Utilities", "Sorter Agent: LESCO correctly auto-sorted to Utilities");
assert(electricResult.confidence >= 0.9, "Sorter Agent: Utility classification has high confidence");

// Test 9: Sorter Agent — Raw Materials classification
const riceResult = autoSortCategory("Al-Kareem General Store", "basmati rice 25kg");
assert(riceResult.category === "Raw Materials / Inventory", "Sorter Agent: rice/general store auto-sorted to Raw Materials");

// Test 10: Sorter Agent — Teach & Remember (Learned Memory)
teachCategory("SNGPL Gas Company", "Utilities");
const taughtResult = autoSortCategory("SNGPL Gas Company", "natural gas supply");
assert(taughtResult.category === "Utilities", "Sorter Agent: taught category is remembered from learned memory");
assert(taughtResult.matchSource === "learned", "Sorter Agent: match source is 'learned' after teaching");

// Test 11: Ledger DB — Historical record retrieval
const ledgerEntries = getLedgerEntries();
assert(ledgerEntries.length >= 4, "Ledger DB: initial historical voucher entries are populated");
assert(ledgerEntries.some((e) => e.vendor_name.includes("Al-Kareem")), "Ledger DB: contains Al-Kareem historical record");

console.log(`\nResults: ${passed} passed, ${failed} failed.\n`);
process.exit(failed > 0 ? 1 : 0);

