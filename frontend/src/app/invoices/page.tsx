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
  Search,
  Filter,
  ArrowUpDown,
  Ellipsis,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface ApiInvoice {
  id: number;
  invoice_number?: string;
  client_name: string;
  service_summary?: string;
  amount: number;
  currency?: string;
  status: string;
  due_date: string;
}

const API_BASE = "http://127.0.0.1:8000";

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

function formatFullNaira(val: number): string {
  return `₦${Number(val || 0).toLocaleString("en-NG", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

export default function InvoicesListPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<ApiInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");

  useEffect(() => {
    const controller = new AbortController();

    async function loadInvoices() {
      try {
        const res = await fetch(`${API_BASE}/invoices`, {
          signal: controller.signal,
          cache: "no-store",
        });

        if (res.ok) {
          const data: ApiInvoice[] = await res.json();
          setInvoices(data.length > 0 ? data : DEMO_INVOICES);
        } else {
          setInvoices(DEMO_INVOICES);
        }
      } catch {
        setInvoices(DEMO_INVOICES);
      } finally {
        setLoading(false);
      }
    }

    loadInvoices();
    return () => controller.abort();
  }, []);

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

  const filteredInvoices = invoices.filter((inv) => {
    const matchesStatus =
      statusFilter === "All" ||
      inv.status.toLowerCase() === statusFilter.toLowerCase();
    const matchesSearch =
      inv.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inv.invoice_number &&
        inv.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  return (
    <AppShell>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Invoices
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Create, manage and track all your client invoices
          </p>
        </div>

        <Link
          href="/invoices/new"
          className="bg-[#C85228] hover:bg-[#B0451F] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-2xs flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Create Invoice</span>
        </Link>
      </div>

      {/* Main Table Container */}
      <div className="bg-white border border-[#EAE8E4] rounded-xl p-5 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
        {/* Top bar inside table */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-gray-900">
            {invoices.length} Invoices
          </h2>

          <div className="flex items-center gap-3">
            <div className="relative w-64">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search invoice or client"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#FAF9F6] border border-[#EAE8E4] rounded-lg pl-9 pr-3 py-1.5 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#C85228] transition-colors"
              />
            </div>

            <button
              type="button"
              className="border border-[#EAE8E4] bg-white hover:bg-[#FAF9F6] text-gray-700 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <Filter className="w-3.5 h-3.5 text-gray-500" />
              <span>Filter</span>
            </button>

            <button
              type="button"
              className="border border-[#EAE8E4] bg-white hover:bg-[#FAF9F6] text-gray-700 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-gray-500" />
              <span>Sort</span>
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="bg-[#F5F5F4] p-1 rounded-lg inline-flex gap-1 mb-4 text-xs">
          {["All", "Paid", "Unpaid", "Overdue", "Draft"].map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1 rounded-md transition-all ${
                statusFilter === tab
                  ? "bg-white text-gray-900 font-medium shadow-2xs"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Table Header */}
        <div className="bg-[#F5F5F4] text-xs text-gray-500 font-medium px-5 py-2.5 grid grid-cols-12 items-center border border-[#EAE8E4] rounded-lg mb-2">
          <div className="col-span-2">Invoice ID</div>
          <div className="col-span-3">Client</div>
          <div className="col-span-2">Amount</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2">Due Date</div>
          <div className="col-span-1 text-right">Actions</div>
        </div>

        {/* Table Rows */}
        <div className="divide-y divide-[#F0EFEB]">
          {filteredInvoices.map((inv) => (
            <div
              key={inv.id}
              onClick={() => router.push(`/invoices/${inv.id}`)}
              className="px-5 py-3 grid grid-cols-12 items-center hover:bg-[#FAF9F6] cursor-pointer transition-colors text-xs"
            >
              <div className="col-span-2 text-gray-500 font-normal">
                {inv.invoice_number || `INV-${String(inv.id).padStart(4, "0")}`}
              </div>

              <div className="col-span-3 min-w-0 pr-2">
                <p className="font-semibold text-gray-900 truncate">
                  {inv.client_name}
                </p>
                <p className="text-[11px] text-gray-400 truncate mt-0.5">
                  {inv.service_summary || "Design Services"}
                </p>
              </div>

              <div className="col-span-2 font-bold text-gray-900">
                {formatFullNaira(inv.amount)}
              </div>

              <div className="col-span-2">{renderStatusPill(inv.status)}</div>

              <div className="col-span-2 text-gray-500">{inv.due_date}</div>

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

        {/* Bottom Pagination Bar */}
        <div className="flex items-center justify-between pt-4 mt-2 border-t border-[#EAE8E4] text-xs text-gray-400">
          <span>
            Showing 1-{filteredInvoices.length} of {invoices.length} invoices
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled
              aria-label="Previous page"
              className="p-1.5 rounded border border-[#EAE8E4] text-gray-300 cursor-not-allowed bg-[#FAF9F6]"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="w-7 h-7 rounded border border-[#EAE8E4] bg-[#FAF9F6] text-gray-900 font-semibold flex items-center justify-center text-xs">
              1
            </span>
            <button
              type="button"
              disabled
              aria-label="Next page"
              className="p-1.5 rounded border border-[#EAE8E4] text-gray-300 cursor-not-allowed bg-[#FAF9F6]"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
