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
  Ellipsis,
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

// Standard demo invoices matching Main Screen Sapi.jpg
const DEMO_INVOICES: ApiInvoice[] = [
  {
    id: 31,
    invoice_number: "INV-0031",
    client_name: "TechBridge Ltd",
    service_summary: "Website Redesign",
    amount: 120000,
    status: "Overdue",
    due_date: "24th May 2026",
  },
  {
    id: 30,
    invoice_number: "INV-0030",
    client_name: "Adaeze Okafor",
    service_summary: "Brand Identity",
    amount: 85000,
    status: "Unpaid",
    due_date: "26th May 2026",
  },
  {
    id: 29,
    invoice_number: "INV-0029",
    client_name: "Kola Designs",
    service_summary: "Logo Design",
    amount: 55000,
    status: "Unpaid",
    due_date: "28th May 2026",
  },
  {
    id: 28,
    invoice_number: "INV-0028",
    client_name: "Emeka Eze",
    service_summary: "Landing Page",
    amount: 50000,
    status: "Unpaid",
    due_date: "29th May 2026",
  },
  {
    id: 27,
    invoice_number: "INV-0027",
    client_name: "Pelumi Maliki",
    service_summary: "Copywriting",
    amount: 75000,
    status: "Overdue",
    due_date: "20th May 2026",
  },
  {
    id: 26,
    invoice_number: "INV-0026",
    client_name: "Sade Williams",
    service_summary: "Social Media",
    amount: 180000,
    status: "Paid",
    due_date: "15th May 2026",
  },
  {
    id: 25,
    invoice_number: "INV-0025",
    client_name: "Chisom Ibeku",
    service_summary: "Motion Design",
    amount: 220000,
    status: "Paid",
    due_date: "19th May 2026",
  },
  {
    id: 24,
    invoice_number: "INV-0024",
    client_name: "Agha Uchenna",
    service_summary: "Motions Design",
    amount: 220000,
    status: "Paid",
    due_date: "22nd May 2026",
  },
  {
    id: 23,
    invoice_number: "INV-0023",
    client_name: "Ngozi Peters",
    service_summary: "Content Writing",
    amount: 45000,
    status: "Draft",
    due_date: "1st June 2026",
  },
  {
    id: 22,
    invoice_number: "INV-0022",
    client_name: "Ebede Ife",
    service_summary: "Illustration",
    amount: 38000,
    status: "Draft",
    due_date: "2nd June 2026",
  },
];

const DEMO_SUMMARY: DashboardSummary = {
  total_invoices: 10,
  total_paid: 620000,
  total_outstanding: 285000,
  total_overdue: 95000,
  draft_count: 2,
  pending_count: 4,
  overdue_count: 2,
};

// Formatting helpers
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
  const [forceView, setForceView] = useState<"auto" | "empty" | "populated">("auto");

  useEffect(() => {
    const controller = new AbortController();

    async function fetchData() {
      try {
        const [sumRes, invRes] = await Promise.all([
          fetch(`${API_BASE}/dashboard/summary`, {
            signal: controller.signal,
            cache: "no-store",
          }),
          fetch(`${API_BASE}/invoices`, {
            signal: controller.signal,
            cache: "no-store",
          }),
        ]);

        if (sumRes.ok && invRes.ok) {
          const sumData = await sumRes.json();
          const invData = await invRes.json();
          setSummary(sumData);
          setInvoices(invData);
        } else {
          // If backend returned error response, use clean empty state
          setSummary(null);
          setInvoices([]);
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          // Backend unreachable: default to empty state
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

  // Determine active dataset based on toggle or fetched data
  const effectiveInvoices =
    forceView === "empty"
      ? []
      : forceView === "populated"
      ? DEMO_INVOICES
      : invoices.length > 0
      ? invoices
      : [];

  const effectiveSummary =
    forceView === "empty"
      ? {
          total_invoices: 0,
          total_paid: 0,
          total_outstanding: 0,
          total_overdue: 0,
          draft_count: 0,
          pending_count: 0,
          overdue_count: 0,
        }
      : forceView === "populated"
      ? DEMO_SUMMARY
      : summary || {
          total_invoices: invoices.length,
          total_paid: invoices
            .filter((i) => i.status.toLowerCase() === "paid")
            .reduce((acc, i) => acc + i.amount, 0),
          total_outstanding: invoices
            .filter((i) =>
              ["unpaid", "pending", "overdue"].includes(i.status.toLowerCase())
            )
            .reduce((acc, i) => acc + i.amount, 0),
          total_overdue: invoices
            .filter((i) => i.status.toLowerCase() === "overdue")
            .reduce((acc, i) => acc + i.amount, 0),
          draft_count: invoices.filter((i) => i.status.toLowerCase() === "draft")
            .length,
          pending_count: invoices.filter((i) =>
            ["unpaid", "pending"].includes(i.status.toLowerCase())
          ).length,
          overdue_count: invoices.filter((i) =>
            i.status.toLowerCase() === "overdue"
          ).length,
        };

  const hasInvoices = effectiveInvoices.length > 0;

  // Breakdown calculations for "This Month"
  const thisMonthPaid = effectiveSummary?.total_paid || 0;
  const thisMonthOverdue = effectiveSummary?.total_overdue || 0;
  const thisMonthPending = Math.max(
    0,
    (effectiveSummary?.total_outstanding || 0) - thisMonthOverdue
  );
  const totalVolume = thisMonthPaid + thisMonthPending + thisMonthOverdue || 1;
  const paidPercent = Math.round((thisMonthPaid / totalVolume) * 100);
  const pendingPercent = Math.round((thisMonthPending / totalVolume) * 100);
  const overduePercent = Math.max(0, 100 - paidPercent - pendingPercent);

  // Status Pill component following STRICT DESIGN SYSTEM TOKENS
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
    // Draft / Inactive
    return (
      <span className="bg-[#F3F4F6] text-[#6B7280] text-[11px] font-medium px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-[#6B7280]" />
        Draft
      </span>
    );
  };

  const activities = [
    {
      icon: Check,
      iconBg: "bg-[#EAF7EF]",
      iconColor: "text-[#1E8E4E]",
      title: "Sade Williams paid ₦180,000",
      time: "2 hours ago",
    },
    {
      icon: Clock,
      iconBg: "bg-[#FEF4E6]",
      iconColor: "text-[#D97706]",
      title: "INV-0030 due in 2 days",
      time: "Today",
    },
    {
      icon: Send,
      iconBg: "bg-[#EFF6FF]",
      iconColor: "text-[#3B82F6]",
      title: "Invoice sent to Emeka Eze",
      time: "Yesterday",
    },
    {
      icon: CircleAlert,
      iconBg: "bg-[#FDECEC]",
      iconColor: "text-[#DC2626]",
      title: "INV-0031 is overdue",
      time: "3 days ago",
    },
  ];

  return (
    <AppShell>
      {/* Top Action Bar */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            {!hasInvoices ? "Hello Jude" : "Dashboard"}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {!hasInvoices
              ? "You have no invoices yet. Create your first one and get paid professionally."
              : "Track invoices, payments, and client activity."}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Quick Preview Toggle for testing both screenshot modes */}
          <div className="hidden sm:flex items-center bg-[#F3F2EE] border border-[#E5E4DF] rounded-lg p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setForceView("empty")}
              className={`px-2.5 py-1 rounded-md transition-all ${
                forceView === "empty"
                  ? "bg-white text-gray-900 shadow-2xs font-medium"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              Empty View
            </button>
            <button
              type="button"
              onClick={() => setForceView("populated")}
              className={`px-2.5 py-1 rounded-md transition-all ${
                forceView === "populated"
                  ? "bg-white text-gray-900 shadow-2xs font-medium"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              Populated View
            </button>
            <button
              type="button"
              onClick={() => setForceView("auto")}
              className={`px-2.5 py-1 rounded-md transition-all ${
                forceView === "auto"
                  ? "bg-white text-gray-900 shadow-2xs font-medium"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              Live API
            </button>
          </div>

          <Link
            href="/clients/new"
            className="border border-[#C85228] text-[#C85228] bg-white hover:bg-[#FDF3EE] px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-2xs"
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
      <div className="grid grid-cols-4 gap-4 mb-6">
        {/* Card 1: TOTAL OUTSTANDING */}
        <div className="bg-white border border-[#EAE8E4] rounded-xl p-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-gray-500">
            <Clock className="w-3.5 h-3.5" />
            <span className="text-[11px] font-semibold tracking-wider uppercase text-gray-500">
              TOTAL OUTSTANDING
            </span>
          </div>
          <div className="bg-[#F5F5F4] rounded-lg p-4 mt-2.5">
            <p className="text-2xl font-bold text-gray-900 tracking-tight">
              {!hasInvoices
                ? "₦0.00"
                : formatCompactNaira(effectiveSummary?.total_outstanding || 0)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {!hasInvoices
                ? "No pending invoice"
                : `${effectiveSummary?.pending_count || 4} invoices pending`}
            </p>
          </div>
        </div>

        {/* Card 2: TOTAL PAID */}
        <div className="bg-white border border-[#EAE8E4] rounded-xl p-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-gray-500">
            <Clock className="w-3.5 h-3.5" />
            <span className="text-[11px] font-semibold tracking-wider uppercase text-gray-500">
              TOTAL PAID
            </span>
          </div>
          <div className="bg-[#F5F5F4] rounded-lg p-4 mt-2.5">
            <p className="text-2xl font-bold text-gray-900 tracking-tight">
              {!hasInvoices
                ? "₦0.00"
                : formatCompactNaira(effectiveSummary?.total_paid || 0)}
            </p>
            {!hasInvoices ? (
              <p className="text-xs text-gray-500 mt-1">No payments yet</p>
            ) : (
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-gray-500">This month</span>
                <span className="bg-[#EAF7EF] text-[#1E8E4E] text-[11px] font-semibold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                  ↑ +12%
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Card 3: OVERDUE */}
        <div className="bg-white border border-[#EAE8E4] rounded-xl p-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-gray-500">
            <CircleAlert className="w-3.5 h-3.5" />
            <span className="text-[11px] font-semibold tracking-wider uppercase text-gray-500">
              OVERDUE
            </span>
          </div>
          <div className="bg-[#F5F5F4] rounded-lg p-4 mt-2.5">
            <p className="text-2xl font-bold text-gray-900 tracking-tight">
              {!hasInvoices
                ? "₦0.00"
                : formatCompactNaira(effectiveSummary?.total_overdue || 0)}
            </p>
            {!hasInvoices ? (
              <p className="text-xs text-gray-500 mt-1">Nothing overdue</p>
            ) : (
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-gray-500">
                  {effectiveSummary?.overdue_count || 2} invoices overdue
                </span>
                <span className="w-4 h-4 rounded-full bg-[#FDECEC] text-[#DC2626] flex items-center justify-center text-[10px] font-bold">
                  ↓
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Card 4: DRAFT */}
        <div className="bg-white border border-[#EAE8E4] rounded-xl p-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-gray-500">
            <FileText className="w-3.5 h-3.5" />
            <span className="text-[11px] font-semibold tracking-wider uppercase text-gray-500">
              DRAFT
            </span>
          </div>
          <div className="bg-[#F5F5F4] rounded-lg p-4 mt-2.5">
            <p className="text-2xl font-bold text-gray-900 tracking-tight">
              {!hasInvoices ? "0" : effectiveSummary?.draft_count ?? 2}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {!hasInvoices
                ? "No drafts saved"
                : `${effectiveSummary?.draft_count ?? 2} invoices not sent yet`}
            </p>
          </div>
        </div>
      </div>

      {/* CONDITIONAL BODY */}
      {!hasInvoices ? (
        /* Empty State (Sapi 1.png) */
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
        /* Populated State (Main Screen Sapi.jpg) */
        <div className="grid grid-cols-3 gap-6">
          {/* Left 2 Columns: Recent Invoices Table */}
          <div className="col-span-2 bg-white border border-[#EAE8E4] rounded-xl overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex flex-col justify-between">
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
              <div className="bg-[#F5F5F4] text-xs text-gray-500 font-medium px-5 py-2.5 grid grid-cols-12 items-center border-b border-[#EAE8E4]">
                <div className="col-span-2">Invoice ID</div>
                <div className="col-span-3">Client</div>
                <div className="col-span-2">Amount</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-2">Due Date</div>
                <div className="col-span-1 text-right">Actions</div>
              </div>

              {/* Table Rows */}
              <div className="divide-y divide-[#F0EFEB]">
                {effectiveInvoices.map((inv) => (
                  <div
                    key={inv.id}
                    onClick={() => router.push(`/invoices/${inv.id}`)}
                    className="px-5 py-3 grid grid-cols-12 items-center hover:bg-[#FAF9F6] cursor-pointer transition-colors text-xs"
                  >
                    {/* Invoice ID */}
                    <div className="col-span-2 text-gray-500 font-normal">
                      {inv.invoice_number || `INV-${String(inv.id).padStart(4, "0")}`}
                    </div>

                    {/* Client & Subtitle */}
                    <div className="col-span-3 min-w-0 pr-2">
                      <p className="font-semibold text-gray-900 truncate">
                        {inv.client_name}
                      </p>
                      <p className="text-[11px] text-gray-400 truncate mt-0.5">
                        {inv.service_summary || "Design Services"}
                      </p>
                    </div>

                    {/* Amount */}
                    <div className="col-span-2 font-bold text-gray-900">
                      {formatFullNaira(inv.amount)}
                    </div>

                    {/* Status Pill */}
                    <div className="col-span-2">
                      {renderStatusPill(inv.status)}
                    </div>

                    {/* Due Date */}
                    <div className="col-span-2 text-gray-500">
                      {inv.due_date}
                    </div>

                    {/* Actions */}
                    <div className="col-span-1 text-right flex justify-end">
                      <button
                        type="button"
                        aria-label="More options"
                        onClick={(e) => e.stopPropagation()}
                        className="p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-[#F3F2EE] transition-colors"
                      >
                        <Ellipsis className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right 1 Column: This Month & Recent Activity */}
          <div className="space-y-6">
            {/* This Month Card */}
            <div className="bg-white border border-[#EAE8E4] rounded-xl p-4 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-900">This Month</h3>
                <span className="text-xs text-gray-400 font-normal">May 2026</span>
              </div>

              {/* Nested Grey Box (CRITICAL) */}
              <div className="bg-[#F5F5F4] rounded-lg p-4 mt-2.5 mb-4">
                <p className="text-2xl font-bold text-gray-900 tracking-tight">
                  {formatFullNaira(thisMonthPaid || 620000)}
                </p>
                <p className="text-xs text-gray-400 mt-1">Total earned this month</p>
              </div>

              {/* Paid / Pending / Overdue Breakdown */}
              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Paid</span>
                  <span className="font-bold text-[#1E8E4E]">
                    {formatFullNaira(thisMonthPaid || 620000)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Pending</span>
                  <span className="font-bold text-[#D97706]">
                    {formatFullNaira(thisMonthPending || 190000)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Overdue</span>
                  <span className="font-bold text-[#DC2626]">
                    {formatFullNaira(thisMonthOverdue || 95000)}
                  </span>
                </div>
              </div>

              {/* Segmented Progress Bar */}
              <div className="h-2 rounded-full flex overflow-hidden mt-4 gap-0.5 bg-[#F5F5F4]">
                <div
                  style={{ width: `${paidPercent || 68}%` }}
                  className="bg-[#1E8E4E] rounded-l-full h-full"
                />
                <div
                  style={{ width: `${pendingPercent || 21}%` }}
                  className="bg-[#D97706] h-full"
                />
                <div
                  style={{ width: `${overduePercent || 11}%` }}
                  className="bg-[#DC2626] rounded-r-full h-full"
                />
              </div>
            </div>

            {/* Recent Activity Card */}
            <div className="bg-white border border-[#EAE8E4] rounded-xl p-4 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
              <h3 className="text-sm font-bold text-gray-900 mb-3.5">Recent Activity</h3>
              <div className="divide-y divide-[#F0EFEB]">
                {activities.map((act, idx) => {
                  const Icon = act.icon;
                  return (
                    <div key={idx} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${act.iconBg} ${act.iconColor}`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-gray-900 leading-tight truncate">
                          {act.title}
                        </p>
                        <p className="text-[11px] text-gray-400 mt-0.5 leading-tight">
                          {act.time}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}