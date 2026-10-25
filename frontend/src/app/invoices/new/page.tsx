"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import { ChevronRight, Plus, Trash2 } from "lucide-react";

const API_BASE = "http://127.0.0.1:8000";

interface LineItemRow {
  description: string;
  subtitle: string;
  qty: number;
  rate: number;
}

export default function NewInvoicePage() {
  const router = useRouter();

  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [serviceSummary, setServiceSummary] = useState("Website Redesign");
  const [issueDate, setIssueDate] = useState("10 May 2026");
  const [dueDate, setDueDate] = useState("24th May 2026");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [items, setItems] = useState<LineItemRow[]>([
    {
      description: "Website Redesign",
      subtitle: "Full UI/UX redesign of company website",
      qty: 1,
      rate: 80000,
    },
    {
      description: "Brand Guidelines",
      subtitle: "Typography, color system, usage rules",
      qty: 1,
      rate: 25000,
    },
    {
      description: "Revision Round",
      subtitle: "One round of design revisions",
      qty: 1,
      rate: 15000,
    },
  ]);

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      { description: "", subtitle: "", qty: 1, rate: 0 },
    ]);
  };

  const removeItem = (idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateItem = (
    idx: number,
    field: keyof LineItemRow,
    value: string | number
  ) => {
    setItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item))
    );
  };

  const totalAmount = items.reduce(
    (acc, it) => acc + (Number(it.qty) || 0) * (Number(it.rate) || 0),
    0
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const invoiceNum = `INV-${Math.floor(1000 + Math.random() * 9000)}`;

    const formattedItems = items.map((it) => ({
      ...it,
      amount: (Number(it.qty) || 1) * (Number(it.rate) || 0),
    }));

    const payload = {
      invoice_number: invoiceNum,
      client_name: clientName.trim() || "Acme Studio",
      client_email: clientEmail.trim() || null,
      service_summary: serviceSummary.trim() || "Design Services",
      issue_date: issueDate,
      due_date: dueDate,
      amount: totalAmount || 120000,
      currency: "NGN",
      status: "Unpaid",
      line_items_json: JSON.stringify(formattedItems),
      notes: notes.trim() || null,
      stellar_memo: `SAPI-${invoiceNum}`,
    };

    try {
      const res = await fetch(`${API_BASE}/invoices`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const created = await res.json();
        router.push(`/invoices/${created.id}`);
      } else {
        router.push("/invoices");
      }
    } catch {
      router.push("/invoices");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell>
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium mb-1.5">
        <Link href="/invoices" className="hover:text-gray-900 transition-colors">
          Invoices
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
        <span className="text-gray-900">New invoice</span>
      </div>

      {/* Header */}
      <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
        Create new invoice
      </h1>
      <p className="text-sm text-gray-500 mt-1 mb-6">
        Generate professional invoices with instant Stellar USDC and bank settlements.
      </p>

      {/* Form Card */}
      <div className="bg-white border border-[#EAE8E4] rounded-xl p-6 max-w-4xl shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
        <form onSubmit={handleSubmit}>
          {/* Section 1: Client Details */}
          <div>
            <h2 className="text-sm font-bold text-gray-900">Client details</h2>
            <p className="text-xs text-gray-400 mt-0.5 mb-4">
              Specify who will receive this invoice.
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-800 mb-1.5">
                  Client Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. TechBridge Ltd"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full bg-[#FAF9F6] border border-[#EAE8E4] rounded-lg px-3.5 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#C85228] focus:bg-white transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-800 mb-1.5">
                  Client Email
                </label>
                <input
                  type="email"
                  placeholder="hello@techbridge.ng"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  className="w-full bg-[#FAF9F6] border border-[#EAE8E4] rounded-lg px-3.5 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#C85228] focus:bg-white transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-gray-800 mb-1.5">
                  Service Summary
                </label>
                <input
                  type="text"
                  placeholder="e.g. Website Redesign"
                  value={serviceSummary}
                  onChange={(e) => setServiceSummary(e.target.value)}
                  className="w-full bg-[#FAF9F6] border border-[#EAE8E4] rounded-lg px-3.5 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#C85228] focus:bg-white transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-800 mb-1.5">
                  Issue Date
                </label>
                <input
                  type="text"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  className="w-full bg-[#FAF9F6] border border-[#EAE8E4] rounded-lg px-3.5 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#C85228] focus:bg-white transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-800 mb-1.5">
                  Due Date
                </label>
                <input
                  type="text"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full bg-[#FAF9F6] border border-[#EAE8E4] rounded-lg px-3.5 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#C85228] focus:bg-white transition-colors"
                />
              </div>
            </div>
          </div>

          <hr className="border-t border-[#EAE8E4] my-6" />

          {/* Section 2: Line Items */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-sm font-bold text-gray-900">Line items</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Add deliverables, rate, and quantities.
                </p>
              </div>

              <button
                type="button"
                onClick={addItem}
                className="border border-[#EAE8E4] text-gray-700 bg-white hover:bg-[#FAF9F6] px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item</span>
              </button>
            </div>

            <div className="space-y-3">
              {items.map((it, idx) => (
                <div
                  key={idx}
                  className="bg-[#FAF9F6] border border-[#EAE8E4] rounded-lg p-3 grid grid-cols-12 gap-3 items-center text-xs"
                >
                  <div className="col-span-4">
                    <input
                      type="text"
                      placeholder="Item description"
                      value={it.description}
                      onChange={(e) =>
                        updateItem(idx, "description", e.target.value)
                      }
                      className="w-full bg-white border border-[#EAE8E4] rounded px-2.5 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-[#C85228]"
                    />
                  </div>
                  <div className="col-span-3">
                    <input
                      type="text"
                      placeholder="Subtitle / details"
                      value={it.subtitle}
                      onChange={(e) =>
                        updateItem(idx, "subtitle", e.target.value)
                      }
                      className="w-full bg-white border border-[#EAE8E4] rounded px-2.5 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-[#C85228]"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      min={1}
                      placeholder="Qty"
                      value={it.qty}
                      onChange={(e) =>
                        updateItem(idx, "qty", Number(e.target.value))
                      }
                      className="w-full bg-white border border-[#EAE8E4] rounded px-2.5 py-1.5 text-xs text-gray-800 text-center focus:outline-none focus:border-[#C85228]"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      placeholder="Rate (₦)"
                      value={it.rate}
                      onChange={(e) =>
                        updateItem(idx, "rate", Number(e.target.value))
                      }
                      className="w-full bg-white border border-[#EAE8E4] rounded px-2.5 py-1.5 text-xs text-gray-800 text-right focus:outline-none focus:border-[#C85228]"
                    />
                  </div>
                  <div className="col-span-1 text-center">
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(idx)}
                        className="text-gray-400 hover:text-red-500 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Total summary */}
            <div className="mt-4 flex justify-end">
              <div className="bg-[#F5F5F4] rounded-lg px-4 py-2.5 flex items-center gap-4 text-xs">
                <span className="text-gray-500 font-medium">Total Amount:</span>
                <span className="text-base font-bold text-[#C85228]">
                  ₦{totalAmount.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 mt-8 pt-4 border-t border-[#EAE8E4]">
            <Link
              href="/invoices"
              className="border border-[#EAE8E4] text-gray-700 bg-white hover:bg-[#FAF9F6] px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="bg-[#C85228] hover:bg-[#B0451F] text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors shadow-2xs disabled:opacity-50"
            >
              {submitting ? "Creating..." : "Create Invoice"}
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
