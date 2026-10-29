"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import {
  Clock,
  CircleAlert,
  FileText,
  Plus,
  ChevronRight,
  Check,
  Send,
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
}

interface DashboardSummary {
  total_invoices: number;
  total_clients?: number;
  active_clients?: number;
  total_paid: number;
  total_outstanding: number;
  total_overdue: number;
  draft_count: number;
  pending_count?: number;
  overdue_count?: number;
}

const API_BASE = "http://127.0.0.1:8000";

function formatCompactNaira(val: number): string {
  if (!val || val === 0) return "₦0.00";
  if (val >= 1_000_000) {
    const m = val / 1_000_000;
    return `₦${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)}m`;
  }
  if (val >= 1_000) {
    const k = val / 1_000;
    return `₦${k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)}k`;
  }
  return `₦${val.toLocaleString()}`;
}

function formatFullNaira(val: number): string {
  return `₦${Number(val || 0).toLocaleString("en-NG", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

export default function DashboardPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<ApiInvoice[]>([]);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchData() {
      try {
        let email = "default@sapi.com";
        try {
          const profile = JSON.parse(localStorage.getItem("sapi_user_profile") || "{}");
          if (profile.email) email = profile.email;
        } catch {}

        const [sumRes, invRes] = await Promise.all([
          fetch(`${API_BASE}/dashboard/summary?owner_email=${encodeURIComponent(email)}`, {
            signal: controller.signal,
            cache: "no-store",
          }),
          fetch(`${API_BASE}/invoices?owner_email=${encodeURIComponent(email)}`, {
            signal: controller.signal,
            cache: "no-store",
          }),
        ]);

        if (sumRes.ok && invRes.ok) {
          const sumData = await sumRes.json();
          const invData = await invRes.json();
          setSummary(sumData);
          setInvoices(Array.isArray(invData) ? invData : []);
        } else if (invRes.ok) {
          const invData = await invRes.json();
          setInvoices(Array.isArray(invData) ? invData : []);
          setSummary(null);
        } else {
          setSummary(null);
          setInvoices([]);
        }
      } catch {
        if (!controller.signal.aborted) {
          setSummary(null);
          setInvoices([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    fetchData();
    return () => controller.abort();
  }, []);

  const hasInvoices = invoices.length > 0;

  // Compute live metrics directly from real data
  const totalOutstanding =
    summary?.total_outstanding ??
    invoices
      .filter((i) =>
        ["unpaid", "pending", "overdue"].includes(i.status?.toLowerCase() || "")
      )
      .reduce((acc, i) => acc + (i.amount || 0), 0);

  const pendingCount =
    summary?.pending_count ??
    invoices.filter((i) =>
      ["unpaid", "pending"].includes(i.status?.toLowerCase() || "")
    ).length;

  const totalPaid =
    summary?.total_paid ??
    invoices
      .filter((i) => (i.status?.toLowerCase() || "") === "paid")
      .reduce((acc, i) => acc + (i.amount || 0), 0);

  const totalOverdue =
    summary?.total_overdue ??
    invoices
      .filter((i) => (i.status?.toLowerCase() || "") === "overdue")
      .reduce((acc, i) => acc + (i.amount || 0), 0);

  const overdueCount =
    summary?.overdue_count ??
    invoices.filter((i) => (i.status?.toLowerCase() || "") === "overdue").length;

  const draftCount =
    summary?.draft_count ??
    invoices.filter((i) => (i.status?.toLowerCase() || "") === "draft").length;

  // Breakdown calculations for "This Month"
  const thisMonthPaid = totalPaid;
  const thisMonthOverdue = totalOverdue;
  const thisMonthPending = Math.max(0, totalOutstanding - thisMonthOverdue);
  const totalVolume = thisMonthPaid + thisMonthPending + thisMonthOverdue || 1;
  const paidPercent = Math.round((thisMonthPaid / totalVolume) * 100);
  const pendingPercent = Math.round((thisMonthPending / totalVolume) * 100);
  const overduePercent = Math.max(0, 100 - paidPercent - pendingPercent);

  // Status Pill component following design tokens
  const renderStatusPill = (status: string) => {
    const s = status?.toLowerCase() || "draft";
    if (s === "paid" || s === "active") {
      return (
        <span className="bg-[#EAF7EF] text-[#1E8E4E] text-[11px] font-medium px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#1E8E4E]" />
          Paid
        </span>
      );
    }
    if (s === "unpaid" || s === "pending") {
      return (
        <span className="bg-[#FEF4E6] text-[#D97706] text-[11px] font-medium px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#D97706]" />
          Unpaid
        </span>
      );
    }
    if (s === "overdue") {
      return (
        <span className="bg-[#FDECEC] text-[#DC2626] text-[11px] font-medium px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#DC2626]" />
          Overdue
        </span>
      );
    }
    return (
      <span className="bg-[#F3F4F6] text-[#6B7280] text-[11px] font-medium px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-[#6B7280]" />
        Draft
      </span>
    );
  };

  return (
    <AppShell>
      {/* Top Action Bar */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Dashboard
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Track your invoices, payments, and client balances in real-time
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/clients/new"
            className="border border-[#EAE8E4] text-gray-700 bg-white hover:bg-[#FAF9F6] px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-2xs"
          >
            Add Client
          </Link>
          <Link
            href="/invoices/new"
            className="bg-[#C85228] hover:bg-[#B0451F] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-2xs flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Create Invoice</span>
          </Link>
        </div>
      </div>

      {/* 4 Stat Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Card 1: TOTAL OUTSTANDING */}
        <div className="bg-white border border-[#EAE8E4] rounded-xl p-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-gray-500">
            <Clock className="w-3.5 h-3.5" />
            <span className="text-xs text-[#8C8985] uppercase tracking-wider font-semibold">
              TOTAL OUTSTANDING
            </span>
          </div>
          <div className="bg-[#F5F5F4] rounded-lg p-4 mt-2.5">
            <p className="text-2xl font-bold text-gray-900 tracking-tight">
              {!hasInvoices ? "₦0.00" : formatCompactNaira(totalOutstanding)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {!hasInvoices ? "No pending invoice" : `${pendingCount} invoices pending`}
            </p>
          </div>
        </div>

        {/* Card 2: TOTAL PAID */}
        <div className="bg-white border border-[#EAE8E4] rounded-xl p-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-gray-500">
            <Clock className="w-3.5 h-3.5" />
            <span className="text-xs text-[#8C8985] uppercase tracking-wider font-semibold">
              TOTAL PAID
            </span>
          </div>
          <div className="bg-[#F5F5F4] rounded-lg p-4 mt-2.5">
            <p className="text-2xl font-bold text-gray-900 tracking-tight">
              {!hasInvoices ? "₦0.00" : formatCompactNaira(totalPaid)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {!hasInvoices ? "No payments yet" : "All time paid"}
            </p>
          </div>
        </div>

        {/* Card 3: OVERDUE */}
        <div className="bg-white border border-[#EAE8E4] rounded-xl p-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-gray-500">
            <CircleAlert className="w-3.5 h-3.5" />
            <span className="text-xs text-[#8C8985] uppercase tracking-wider font-semibold">
              OVERDUE
            </span>
          </div>
          <div className="bg-[#F5F5F4] rounded-lg p-4 mt-2.5">
            <p className="text-2xl font-bold text-gray-900 tracking-tight">
              {!hasInvoices ? "₦0.00" : formatCompactNaira(totalOverdue)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {!hasInvoices ? "Nothing overdue" : `${overdueCount} invoices overdue`}
            </p>
          </div>
        </div>

        {/* Card 4: DRAFT */}
        <div className="bg-white border border-[#EAE8E4] rounded-xl p-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-gray-500">
            <FileText className="w-3.5 h-3.5" />
            <span className="text-xs text-[#8C8985] uppercase tracking-wider font-semibold">
              DRAFT
            </span>
          </div>
          <div className="bg-[#F5F5F4] rounded-lg p-4 mt-2.5">
            <p className="text-2xl font-bold text-gray-900 tracking-tight">
              {!hasInvoices ? "0" : draftCount}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {!hasInvoices ? "No drafts saved" : `${draftCount} invoices not sent yet`}
            </p>
          </div>
        </div>
      </div>

      {/* CONDITIONAL BODY: STRICT EMPTY STATE VS POPULATED STATE */}
      {!hasInvoices ? (
        /* Empty State UI */
        <div className="border-2 border-dashed border-[#E2E0D8] rounded-xl bg-white min-h-[420px] flex flex-col items-center justify-center text-center p-8">
          <div className="w-12 h-12 rounded-xl bg-[#F3F2EE] flex items-center justify-center text-gray-400 mb-3">
            <FileText className="w-6 h-6 stroke-[1.5]" />
          </div>
          <h3 className="font-bold text-base text-gray-900">No invoices yet</h3>
          <p className="text-xs text-gray-500 max-w-sm mt-1 mb-5">
            Create your first invoice and start getting paid on time. It only takes a minute.
          </p>
          <Link
            href="/invoices/new"
            className="bg-[#C85228] hover:bg-[#B0451F] text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-2xs flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create Invoice</span>
          </Link>
        </div>
      ) : (
        /* Populated State */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Columns: Recent Invoices Table */}
          <div className="lg:col-span-2 bg-white border border-[#EAE8E4] rounded-xl overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex flex-col justify-between">
            <div>
              {/* Header */}
              <div className="px-5 py-3.5 flex items-center justify-between border-b border-[#EAE8E4]">
                <h2 className="text-sm font-bold text-gray-900">Recent Invoices</h2>
                <Link
                  href="/invoices"
                  className="text-xs text-gray-400 hover:text-gray-600 font-medium flex items-center gap-0.5 transition-colors"
                >
                  <span>view all</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* Table Header */}
              <div className="bg-[#F5F5F4] px-5 py-2.5 grid grid-cols-12 items-center border-b border-[#EAE8E4] text-xs text-[#8C8985] uppercase tracking-wider font-semibold">
                <div className="col-span-2">Invoice ID</div>
                <div className="col-span-4">Client</div>
                <div className="col-span-3 text-center">Amount</div>
                <div className="col-span-3 text-right">Status</div>
              </div>

              {/* Table Rows */}
              <div className="divide-y divide-[#F0EFEB]">
                {invoices.slice(0, 6).map((inv) => (
                  <div
                    key={inv.id}
                    onClick={() => router.push(`/invoices/${inv.id}`)}
                    className="px-5 py-3 grid grid-cols-12 items-center hover:bg-[#FAF9F6] cursor-pointer transition-colors text-xs"
                  >
                    {/* Invoice ID */}
                    <div className="col-span-2 text-sm text-gray-600 font-normal">
                      {inv.invoice_number || `INV-${String(inv.id).padStart(4, "0")}`}
                    </div>

                    {/* Client & Subtitle */}
                    <div className="col-span-4 min-w-0 pr-2">
                      <p className="text-base font-bold text-gray-900 truncate">
                        {inv.client_name}
                      </p>
                      <p className="text-sm text-gray-600 truncate mt-0.5">
                        {inv.service_summary || "Design Services"}
                      </p>
                    </div>

                    {/* Amount */}
                    <div className="col-span-3 text-center text-base font-bold text-gray-900">
                      {formatFullNaira(inv.amount)}
                    </div>

                    {/* Status Pill */}
                    <div className="col-span-3 text-right flex justify-end">
                      {renderStatusPill(inv.status)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right 1 Column: This Month Breakdown */}
          <div className="space-y-6">
            {/* This Month Card */}
            <div className="bg-white border border-[#EAE8E4] rounded-xl p-4 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-900">This Month</h3>
                <span className="text-xs text-gray-400 font-normal">Summary</span>
              </div>

              {/* Nested Grey Box */}
              <div className="bg-[#F5F5F4] rounded-lg p-4 mt-2.5 mb-4 border border-[#E5E4DF]">
                <p className="text-2xl font-bold text-gray-900 tracking-tight">
                  {formatFullNaira(thisMonthPaid)}
                </p>
                <p className="text-xs text-gray-400 mt-1">Total earned this month</p>
              </div>

              {/* Paid / Pending / Overdue Breakdown */}
              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Paid</span>
                  <span className="font-bold text-[#1E8E4E]">
                    {formatFullNaira(thisMonthPaid)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Pending</span>
                  <span className="font-bold text-[#D97706]">
                    {formatFullNaira(thisMonthPending)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Overdue</span>
                  <span className="font-bold text-[#DC2626]">
                    {formatFullNaira(thisMonthOverdue)}
                  </span>
                </div>
              </div>

              {/* Segmented Progress Bar */}
              <div className="h-2 rounded-full flex overflow-hidden mt-4 gap-0.5 bg-[#F5F5F4]">
                <div
                  style={{ width: `${paidPercent}%` }}
                  className="bg-[#1E8E4E] rounded-l-full h-full"
                />
                <div
                  style={{ width: `${pendingPercent}%` }}
                  className="bg-[#D97706] h-full"
                />
                <div
                  style={{ width: `${overduePercent}%` }}
                  className="bg-[#DC2626] rounded-r-full h-full"
                />
              </div>
            </div>

            {/* Quick Actions Card */}
            <div className="bg-white border border-[#EAE8E4] rounded-xl p-4 shadow-[0_1px_2px_rgba(0,0,0,0.02)] space-y-3">
              <h3 className="text-sm font-bold text-gray-900">Quick Actions</h3>
              <div className="space-y-2">
                <Link
                  href="/invoices/new"
                  className="w-full bg-[#FAF9F6] border border-[#EAE8E4] hover:border-[#C85228] p-3 rounded-lg flex items-center justify-between transition-colors group"
                >
                  <span className="text-xs font-semibold text-gray-800 group-hover:text-[#C85228] transition-colors">
                    New Invoice
                  </span>
                  <Plus className="w-4 h-4 text-gray-400 group-hover:text-[#C85228] transition-colors" />
                </Link>
                <Link
                  href="/clients/new"
                  className="w-full bg-[#FAF9F6] border border-[#EAE8E4] hover:border-[#C85228] p-3 rounded-lg flex items-center justify-between transition-colors group"
                >
                  <span className="text-xs font-semibold text-gray-800 group-hover:text-[#C85228] transition-colors">
                    New Client
                  </span>
                  <Plus className="w-4 h-4 text-gray-400 group-hover:text-[#C85228] transition-colors" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}