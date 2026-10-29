"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import {
  CreditCard,
  Zap,
  ArrowUpRight,
  ExternalLink,
  Plus,
  RefreshCw,
  Clock,
  CheckCircle2,
  Activity,
  Search,
} from "lucide-react";

interface ApiInvoice {
  id: number;
  invoice_number?: string;
  client_name: string;
  client_email?: string;
  service_summary?: string;
  issue_date?: string;
  due_date: string;
  amount: number;
  currency?: string;
  status: string;
  stellar_memo?: string;
  stellar_tx_hash?: string;
  owner_email?: string;
}

const API_BASE = "http://127.0.0.1:8000";

// Standard calculation: converts NGN to USDC at standard rate (approx ~1,500 NGN = 1 USDC) or direct USDC
function toUsdc(amount: number, currency?: string): number {
  if (!amount || amount <= 0) return 0;
  if (currency === "USDC" || currency === "USD") return amount;
  // If stored in NGN, convert at 1500 NGN = 1 USDC
  return Number((amount / 1500).toFixed(2));
}

function formatUsdc(val: number): string {
  return `$${val.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} USDC`;
}

export default function PaymentsPage() {
  const [invoices, setInvoices] = useState<ApiInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [userEmail, setUserEmail] = useState("default@sapi.com");

  useEffect(() => {
    // Read owner_email from localStorage sapi_user_profile
    try {
      const savedProfile = localStorage.getItem("sapi_user_profile");
      if (savedProfile) {
        const parsed = JSON.parse(savedProfile);
        if (parsed.email) {
          setUserEmail(parsed.email);
        }
      }
    } catch {
      // fallback to default
    }
  }, []);

  const fetchPayments = async (email: string) => {
    setLoading(true);
    try {
      const res = await fetch(
        `${API_BASE}/invoices?owner_email=${encodeURIComponent(email)}`,
        { cache: "no-store" }
      );
      if (res.ok) {
        const data: ApiInvoice[] = await res.json();
        setInvoices(Array.isArray(data) ? data : []);
      } else {
        setInvoices([]);
      }
    } catch {
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments(userEmail);
  }, [userEmail]);

  // Compute metric cards
  const paidInvoices = invoices.filter(
    (inv) => inv.status?.toLowerCase() === "paid"
  );
  const pendingInvoices = invoices.filter(
    (inv) =>
      inv.status?.toLowerCase() === "unpaid" ||
      inv.status?.toLowerCase() === "pending" ||
      inv.status?.toLowerCase() === "overdue"
  );

  const totalSettledUsdc = paidInvoices.reduce(
    (sum, inv) => sum + toUsdc(inv.amount, inv.currency),
    0
  );
  const awaitingSettlementUsdc = pendingInvoices.reduce(
    (sum, inv) => sum + toUsdc(inv.amount, inv.currency),
    0
  );

  // Filtered transactions for the ledger table
  const filteredInvoices = invoices.filter((inv) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const num = (inv.invoice_number || "").toLowerCase();
    const memo = (inv.stellar_memo || "").toLowerCase();
    const client = (inv.client_name || "").toLowerCase();
    return num.includes(q) || memo.includes(q) || client.includes(q);
  });

  const renderStatusPill = (status: string) => {
    const s = status?.toLowerCase() || "draft";
    if (s === "paid" || s === "active") {
      return (
        <span className="bg-[#EAF7EF] text-[#1E8E4E] text-[11px] font-semibold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#1E8E4E]" />
          Settled
        </span>
      );
    }
    if (s === "unpaid" || s === "pending") {
      return (
        <span className="bg-[#FEF4E6] text-[#D97706] text-[11px] font-semibold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#D97706]" />
          Awaiting Settlement
        </span>
      );
    }
    if (s === "overdue") {
      return (
        <span className="bg-[#FDECEC] text-[#DC2626] text-[11px] font-semibold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#DC2626]" />
          Overdue
        </span>
      );
    }
    return (
      <span className="bg-[#F3F4F6] text-[#6B7280] text-[11px] font-semibold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-[#6B7280]" />
        Draft
      </span>
    );
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Payments &amp; Settlements
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Real-time Stellar USDC settlements and multi-currency transaction ledger.
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => fetchPayments(userEmail)}
              className="p-2 border border-[#EAE8E4] rounded-lg bg-white text-gray-600 hover:text-gray-900 hover:bg-[#FAF9F6] transition-colors shadow-2xs"
              title="Refresh ledger"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <Link
              href="/invoices/new"
              className="bg-[#C85228] hover:bg-[#B0451F] text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors shadow-2xs"
            >
              <Plus className="w-4 h-4" />
              <span>Create Invoice</span>
            </Link>
          </div>
        </div>

        {/* 3 Metric Cards at Top */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1: Total Settled (USDC) */}
          <div className="bg-white border border-[#EAE8E4] rounded-xl p-5 shadow-[0_1px_2px_rgba(0,0,0,0.02)] relative overflow-hidden group hover:border-gray-300 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-[#8C8985] uppercase tracking-wider">
                Total Settled (USDC)
              </span>
              <div className="w-7 h-7 rounded-lg bg-[#EAF7EF] flex items-center justify-center text-[#1E8E4E]">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 tracking-tight">
              {formatUsdc(totalSettledUsdc)}
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-[#1E8E4E] font-medium">
              <span>{paidInvoices.length} invoices settled on-chain</span>
            </div>
          </div>

          {/* Card 2: Awaiting Settlement */}
          <div className="bg-white border border-[#EAE8E4] rounded-xl p-5 shadow-[0_1px_2px_rgba(0,0,0,0.02)] relative overflow-hidden group hover:border-gray-300 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-[#8C8985] uppercase tracking-wider">
                Awaiting Settlement
              </span>
              <div className="w-7 h-7 rounded-lg bg-[#FEF4E6] flex items-center justify-center text-[#D97706]">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 tracking-tight">
              {formatUsdc(awaitingSettlementUsdc)}
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-[#D97706] font-medium">
              <span>{pendingInvoices.length} invoices pending payment</span>
            </div>
          </div>

          {/* Card 3: Stellar Network Status */}
          <div className="bg-white border border-[#EAE8E4] rounded-xl p-5 shadow-[0_1px_2px_rgba(0,0,0,0.02)] relative overflow-hidden group hover:border-gray-300 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-[#8C8985] uppercase tracking-wider">
                Stellar Network Status
              </span>
              <div className="w-7 h-7 rounded-lg bg-orange-50 flex items-center justify-center text-[#C85228]">
                <Zap className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <div className="text-lg font-bold text-gray-900 tracking-tight">
                Mainnet/Horizon Ready
              </div>
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-500 font-mono">
              <span className="bg-[#FAF9F6] border border-[#EAE8E4] px-1.5 py-0.5 rounded text-[11px] text-gray-700">
                Horizon RPC Connected
              </span>
              <span>•</span>
              <span>3-5s Finality</span>
            </div>
          </div>
        </div>

        {/* Ledger Section Header & Search */}
        <div className="bg-white border border-[#EAE8E4] rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.02)] overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-[#EAE8E4] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-gray-900">
                Transaction Ledger
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                All Stellar USDC payment memos and settlement activity
              </p>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search memo, invoice, client..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#FAF9F6] border border-[#EAE8E4] rounded-lg pl-9 pr-3 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-[#C85228] transition-colors"
              />
            </div>
          </div>

          {/* Table / Empty State */}
          {filteredInvoices.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-[#FAF9F6] border border-[#EAE8E4] flex items-center justify-center text-gray-400 mb-3">
                <CreditCard className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-gray-900 mb-1">
                No transactions yet
              </h3>
              <p className="text-xs text-gray-500 max-w-sm mb-5 leading-relaxed">
                When you create invoices and clients settle via Stellar USDC or Paystack, your settlements will appear in this ledger.
              </p>
              <Link
                href="/invoices/new"
                className="inline-flex items-center gap-1.5 bg-[#C85228] hover:bg-[#B0451F] text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create an Invoice</span>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#FAF9F6] border-b border-[#EAE8E4]">
                    <th className="py-3 px-4 text-xs text-[#8C8985] uppercase tracking-wider font-semibold">
                      Invoice / Memo
                    </th>
                    <th className="py-3 px-4 text-xs text-[#8C8985] uppercase tracking-wider font-semibold">
                      Client
                    </th>
                    <th className="py-3 px-4 text-xs text-[#8C8985] uppercase tracking-wider font-semibold text-right">
                      Amount (USDC)
                    </th>
                    <th className="py-3 px-4 text-xs text-[#8C8985] uppercase tracking-wider font-semibold">
                      Settlement Method
                    </th>
                    <th className="py-3 px-4 text-xs text-[#8C8985] uppercase tracking-wider font-semibold">
                      Status
                    </th>
                    <th className="py-3 px-4 text-xs text-[#8C8985] uppercase tracking-wider font-semibold text-right">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAE8E4] text-xs">
                  {filteredInvoices.map((inv) => {
                    const usdcVal = toUsdc(inv.amount, inv.currency);
                    const memo = inv.stellar_memo || `SAPI-${inv.invoice_number || inv.id}`;

                    return (
                      <tr
                        key={inv.id}
                        className="hover:bg-[#FAF9F6]/60 transition-colors"
                      >
                        {/* INVOICE / MEMO */}
                        <td className="py-3.5 px-4">
                          <Link
                            href={`/invoices/${inv.id}`}
                            className="font-bold text-gray-900 hover:text-[#C85228] transition-colors"
                          >
                            {inv.invoice_number || `INV-${inv.id}`}
                          </Link>
                          <div className="font-mono text-[11px] text-gray-500 mt-0.5 select-all">
                            MEMO: {memo}
                          </div>
                        </td>

                        {/* CLIENT */}
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-gray-900">
                            {inv.client_name}
                          </div>
                          <div className="text-[11px] text-gray-500">
                            {inv.service_summary || "Design & Development"}
                          </div>
                        </td>

                        {/* AMOUNT (USDC) */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="font-bold text-gray-900">
                            {formatUsdc(usdcVal)}
                          </div>
                          {inv.currency !== "USDC" && (
                            <div className="text-[11px] text-gray-400">
                              ₦{Number(inv.amount || 0).toLocaleString()}
                            </div>
                          )}
                        </td>

                        {/* SETTLEMENT METHOD */}
                        <td className="py-3.5 px-4">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#FAF9F6] border border-[#EAE8E4] text-[11px] font-medium text-gray-700">
                            <Zap className="w-3 h-3 text-[#C85228]" />
                            <span>Stellar USDC</span>
                          </div>
                        </td>

                        {/* STATUS */}
                        <td className="py-3.5 px-4">
                          {renderStatusPill(inv.status)}
                        </td>

                        {/* ACTION */}
                        <td className="py-3.5 px-4 text-right">
                          <Link
                            href={`/pay/${inv.id}`}
                            target="_blank"
                            className="inline-flex items-center gap-1 text-[#C85228] hover:text-[#B0451F] font-semibold text-xs hover:underline transition-colors"
                          >
                            <span>Pay Link</span>
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
