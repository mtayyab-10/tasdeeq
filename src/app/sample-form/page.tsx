"use client";
import { useState } from "react";
import Link from "next/link";

export default function GoogleFormSimulator() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    vendor: "Al-Kareem General Store",
    invoice: "INV-2026-0824", // intentional transposition
    date: "2026-10-15",
    qty: "5",
    unit_price: "3200",
    total: "54000", // math mismatch: 5 * 3200 = 16000 != 54000
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#f0ebf8",
      fontFamily: "'Google Sans', Roboto, Arial, sans-serif",
      color: "#202124",
      padding: "24px 16px"
    }}>
      {/* Top Banner with back link */}
      <div style={{ maxWidth: "640px", margin: "0 auto 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Link href="/" style={{ color: "#673ab7", textDecoration: "none", fontSize: "14px", fontWeight: 500, display: "flex", alignItems: "center", gap: "6px" }}>
          ← Back to TrueNorth / Tasdeeq
        </Link>
        <span style={{ fontSize: "12px", background: "#e8def8", color: "#673ab7", padding: "4px 10px", borderRadius: "16px", fontWeight: 600 }}>
          Google Forms Simulator
        </span>
      </div>

      <div style={{ maxWidth: "640px", margin: "0 auto" }}>
        {/* Form Header Card */}
        <div style={{
          background: "#ffffff",
          borderRadius: "8px",
          borderTop: "10px solid #673ab7",
          boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
          padding: "24px",
          marginBottom: "12px"
        }}>
          <h1 style={{ fontSize: "28px", fontWeight: 400, margin: "0 0 8px", color: "#202124" }}>
            Accounts Payable — Voucher Ingestion Form
          </h1>
          <p style={{ fontSize: "14px", color: "#5f6368", margin: "0 0 16px", lineHeight: 1.5 }}>
            Submit vendor invoices and payment vouchers for accounting ledger recording.
            This form is designed to test the <strong>TrueNorth / Tasdeeq Chrome Extension</strong>.
          </p>
          <div style={{ fontSize: "12px", color: "#d93025" }}>* Indicates required question</div>
        </div>

        {submitted ? (
          <div style={{
            background: "#ffffff",
            borderRadius: "8px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
            padding: "24px",
            textAlign: "center"
          }}>
            <h2 style={{ fontSize: "20px", fontWeight: 500, color: "#137333", margin: "0 0 8px" }}>
              Voucher Recorded
            </h2>
            <p style={{ fontSize: "14px", color: "#5f6368" }}>
              Your voucher has been submitted into the accounting ledger database.
            </p>
            <button
              onClick={() => setSubmitted(false)}
              style={{
                marginTop: "16px",
                background: "transparent",
                border: "none",
                color: "#673ab7",
                fontSize: "14px",
                fontWeight: 500,
                cursor: "pointer",
                textDecoration: "underline"
              }}
            >
              Submit another response
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* Question 1: Vendor Name */}
            <div role="listitem" style={{
              background: "#ffffff",
              borderRadius: "8px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
              padding: "24px",
              marginBottom: "12px"
            }}>
              <div role="heading" aria-level={2} style={{ fontSize: "16px", fontWeight: 500, marginBottom: "16px" }}>
                Vendor / Shop Name <span style={{ color: "#d93025" }}>*</span>
              </div>
              <input
                type="text"
                name="vendor_name"
                value={formData.vendor}
                onChange={handleChange}
                placeholder="Your answer"
                style={{
                  width: "100%",
                  border: "none",
                  borderBottom: "1px solid #dadce0",
                  padding: "8px 0",
                  fontSize: "14px",
                  outline: "none",
                  transition: "border-bottom-color 0.2s"
                }}
                required
              />
            </div>

            {/* Question 2: Invoice Number */}
            <div role="listitem" style={{
              background: "#ffffff",
              borderRadius: "8px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
              padding: "24px",
              marginBottom: "12px"
            }}>
              <div role="heading" aria-level={2} style={{ fontSize: "16px", fontWeight: 500, marginBottom: "16px" }}>
                Invoice / Voucher Number <span style={{ color: "#d93025" }}>*</span>
              </div>
              <input
                type="text"
                name="invoice_number"
                value={formData.invoice}
                onChange={handleChange}
                placeholder="Your answer"
                style={{
                  width: "100%",
                  border: "none",
                  borderBottom: "1px solid #dadce0",
                  padding: "8px 0",
                  fontSize: "14px",
                  outline: "none"
                }}
                required
              />
            </div>

            {/* Question 3: Date */}
            <div role="listitem" style={{
              background: "#ffffff",
              borderRadius: "8px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
              padding: "24px",
              marginBottom: "12px"
            }}>
              <div role="heading" aria-level={2} style={{ fontSize: "16px", fontWeight: 500, marginBottom: "16px" }}>
                Invoice Date <span style={{ color: "#d93025" }}>*</span>
              </div>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                style={{
                  border: "none",
                  borderBottom: "1px solid #dadce0",
                  padding: "8px 0",
                  fontSize: "14px",
                  outline: "none"
                }}
                required
              />
            </div>

            {/* Question 4: Quantity */}
            <div role="listitem" style={{
              background: "#ffffff",
              borderRadius: "8px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
              padding: "24px",
              marginBottom: "12px"
            }}>
              <div role="heading" aria-level={2} style={{ fontSize: "16px", fontWeight: 500, marginBottom: "16px" }}>
                Quantity
              </div>
              <input
                type="number"
                name="quantity"
                value={formData.qty}
                onChange={handleChange}
                placeholder="Your answer"
                style={{
                  width: "100%",
                  border: "none",
                  borderBottom: "1px solid #dadce0",
                  padding: "8px 0",
                  fontSize: "14px",
                  outline: "none"
                }}
              />
            </div>

            {/* Question 5: Unit Price */}
            <div role="listitem" style={{
              background: "#ffffff",
              borderRadius: "8px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
              padding: "24px",
              marginBottom: "12px"
            }}>
              <div role="heading" aria-level={2} style={{ fontSize: "16px", fontWeight: 500, marginBottom: "16px" }}>
                Unit Price (PKR)
              </div>
              <input
                type="number"
                name="unit_price"
                value={formData.unit_price}
                onChange={handleChange}
                placeholder="Your answer"
                style={{
                  width: "100%",
                  border: "none",
                  borderBottom: "1px solid #dadce0",
                  padding: "8px 0",
                  fontSize: "14px",
                  outline: "none"
                }}
              />
            </div>

            {/* Question 6: Total Amount */}
            <div role="listitem" style={{
              background: "#ffffff",
              borderRadius: "8px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
              padding: "24px",
              marginBottom: "12px"
            }}>
              <div role="heading" aria-level={2} style={{ fontSize: "16px", fontWeight: 500, marginBottom: "16px" }}>
                Total Bill Amount (PKR) <span style={{ color: "#d93025" }}>*</span>
              </div>
              <input
                type="number"
                name="total_amount"
                value={formData.total}
                onChange={handleChange}
                placeholder="Your answer"
                style={{
                  width: "100%",
                  border: "none",
                  borderBottom: "1px solid #dadce0",
                  padding: "8px 0",
                  fontSize: "14px",
                  outline: "none"
                }}
                required
              />
            </div>

            {/* Submit & Preset Buttons */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "16px" }}>
              <button
                type="submit"
                style={{
                  background: "#673ab7",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "4px",
                  padding: "10px 24px",
                  fontSize: "14px",
                  fontWeight: 500,
                  cursor: "pointer",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.2)"
                }}
              >
                Submit
              </button>

              <button
                type="button"
                onClick={() => setFormData({
                  vendor: "Al-Kareem General Store",
                  invoice: "INV-2026-0842",
                  date: "2026-10-15",
                  qty: "5",
                  unit_price: "3200",
                  total: "16000",
                })}
                style={{
                  background: "transparent",
                  color: "#5f6368",
                  border: "none",
                  fontSize: "13px",
                  cursor: "pointer"
                }}
              >
                Reset to clean values
              </button>
            </div>
          </form>
        )}

        <div style={{ textAlign: "center", marginTop: "24px", fontSize: "12px", color: "#5f6368" }}>
          This page matches Google Forms DOM structure (<code>role=&quot;listitem&quot;</code> and <code>role=&quot;heading&quot;</code>) for full extension compatibility.
        </div>
      </div>
    </div>
  );
}
