"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import {
  Users,
  CircleAlert,
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  Ellipsis,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface ClientData {
  id: number;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  status: string; // "Active" | "Inactive"
  invoices_count?: number;
  total_billed?: number;
  outstanding?: number;
  last_invoice?: string;
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

// Standard demo clients matching clients Sapi.jpg
const DEMO_CLIENTS: ClientData[] = [
  {
    id: 1,
    name: "TechBridge Ltd",
    email: "hello@techbridge.ng",
    invoices_count: 3,
    total_billed: 395000,
    outstanding: 120000,
    last_invoice: "24th May 2026",
    status: "Active",
  },
  {
    id: 2,
    name: "Adaeze Okafor",
    email: "adaeze@gmail.com",
    invoices_count: 2,
    total_billed: 130000,
    outstanding: 85000,
    last_invoice: "24th May 2026",
    status: "Active",
  },
  {
    id: 3,
    name: "Kola Designs",
    email: "kola@koladesigns.co",
    invoices_count: 2,
    total_billed: 100000,
    outstanding: 55000,
    last_invoice: "24th May 2026",
    status: "Active",
  },
  {
    id: 4,
    name: "Emeka Eze",
    email: "emeka.eze@gmail.com",
    invoices_count: 1,
    total_billed: 50000,
    outstanding: 50000,
    last_invoice: "24th May 2026",
    status: "Active",
  },
  {
    id: 5,
    name: "Anumudu David",
    email: "anumudu@david.com",
    invoices_count: 1,
    total_billed: 75000,
    outstanding: 75000,
    last_invoice: "24th May 2026",
    status: "Active",
  },
  {
    id: 6,
    name: "Nkama Joshua",
    email: "joshua.wx@gmail.com",
    invoices_count: 1,
    total_billed: 180000,
    outstanding: 0,
    last_invoice: "24th May 2026",
    status: "Active",
  },
  {
    id: 7,
    name: "Nweke Emmanuel",
    email: "emizzy@gmail.com",
    invoices_count: 1,
    total_billed: 220000,
    outstanding: 0,
    last_invoice: "24th May 2026",
    status: "Inactive",
  },
  {
    id: 8,
    name: "Agha Uchenna",
    email: "agha.u@gmail.com",
    invoices_count: 1,
    total_billed: 220000,
    outstanding: 0,
    last_invoice: "24th May 2026",
    status: "Inactive",
  },
];

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function formatFullNaira(val: number): string {
  return `₦${Number(val || 0).toLocaleString("en-NG", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

function formatCompactNaira(val: number): string {
  if (!val || val === 0) return "₦0";
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

export default function ClientsPage() {
  const [clients, setClients] = useState<ClientData[]>([]);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTab, setFilterTab] = useState<"All" | "Active" | "Inactive">("All");

  useEffect(() => {
    const controller = new AbortController();

    async function loadData() {
      try {
        const [clientsRes, sumRes] = await Promise.all([
          fetch(`${API_BASE}/clients`, {
            signal: controller.signal,
            cache: "no-store",
          }),
          fetch(`${API_BASE}/dashboard/summary`, {
            signal: controller.signal,
            cache: "no-store",
          }),
        ]);

        if (clientsRes.ok) {
          const clientData: ClientData[] = await clientsRes.json();
          setClients(clientData.length > 0 ? clientData : DEMO_CLIENTS);
        } else {
          setClients(DEMO_CLIENTS);
        }

        if (sumRes.ok) {
          const sumData: DashboardSummary = await sumRes.json();
          setSummary(sumData);
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setClients(DEMO_CLIENTS);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadData();
    return () => controller.abort();
  }, []);

  // Compute metrics
  const totalClientsCount = clients.length;
  const activeClientsCount = clients.filter(
    (c) => c.status?.toLowerCase() === "active"
  ).length;
  const inactiveClientsCount = clients.filter(
    (c) => c.status?.toLowerCase() === "inactive"
  ).length;
  const totalOutstanding =
    summary?.total_outstanding ??
    clients.reduce((acc, c) => acc + (c.outstanding || 0), 0);
  const unpaidInvoicesCount = summary?.pending_count ?? 4;

  // Filter clients by search query and active tab
  const filteredClients = clients.filter((c) => {
    const matchesFilter =
      filterTab === "All"
        ? true
        : filterTab === "Active"
        ? c.status?.toLowerCase() === "active"
        : c.status?.toLowerCase() === "inactive";

    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  return (
    <AppShell>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Clients
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your clients and track their payment history
          </p>
        </div>

        <Link
          href="/clients/new"
          className="bg-[#C85228] hover:bg-[#B0451F] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-2xs flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Add Client</span>
        </Link>
      </div>

      {/* 3 Stat Cards Row */}
      <div className="grid grid-cols-3 gap-4 max-w-3xl mb-6">
        {/* Card 1: TOTAL CLIENTS */}
        <div className="bg-white border border-[#EAE8E4] rounded-xl p-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-gray-500">
            <Users className="w-3.5 h-3.5 text-gray-500" />
            <span className="text-[11px] font-semibold tracking-wider uppercase text-gray-500">
              TOTAL CLIENTS
            </span>
          </div>
          <div className="bg-[#F5F5F4] rounded-lg p-4 mt-2.5">
            <p className="text-2xl font-bold text-gray-900 tracking-tight">
              {totalClientsCount}
            </p>
            <p className="text-xs text-gray-500 mt-1">All time</p>
          </div>
        </div>

        {/* Card 2: ACTIVE CLIENTS */}
        <div className="bg-white border border-[#EAE8E4] rounded-xl p-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-gray-500">
            <Users className="w-3.5 h-3.5 text-[#1E8E4E]" />
            <span className="text-[11px] font-semibold tracking-wider uppercase text-gray-500">
              ACTIVE CLIENTS
            </span>
          </div>
          <div className="bg-[#F5F5F4] rounded-lg p-4 mt-2.5">
            <p className="text-2xl font-bold text-gray-900 tracking-tight">
              {activeClientsCount}
            </p>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs text-gray-500">This month</span>
              <span className="bg-[#EAF7EF] text-[#1E8E4E] text-[11px] font-semibold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                ↑ +2%
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: OUTSTANDING */}
        <div className="bg-white border border-[#EAE8E4] rounded-xl p-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-gray-500">
            <CircleAlert className="w-3.5 h-3.5 text-[#DC2626]" />
            <span className="text-[11px] font-semibold tracking-wider uppercase text-gray-500">
              OUTSTANDING
            </span>
          </div>
          <div className="bg-[#F5F5F4] rounded-lg p-4 mt-2.5">
            <p className="text-2xl font-bold text-gray-900 tracking-tight">
              {formatCompactNaira(totalOutstanding)}
            </p>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs text-gray-500">
                {unpaidInvoicesCount} unpaid invoices
              </span>
              <span className="bg-[#FDECEC] text-[#DC2626] text-[11px] font-semibold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                ↓ +2%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white border border-[#EAE8E4] rounded-xl p-5 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
        {/* Top bar inside table */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-gray-900">
            {totalClientsCount} Clients
          </h2>

          <div className="flex items-center gap-3">
            <div className="relative w-64">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search client"
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
          <button
            type="button"
            onClick={() => setFilterTab("All")}
            className={`px-3 py-1 rounded-md transition-all flex items-center gap-1.5 ${
              filterTab === "All"
                ? "bg-white text-gray-900 font-medium shadow-2xs"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            <span>All</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                filterTab === "All"
                  ? "bg-[#FBECE5] text-[#C85228]"
                  : "text-gray-400"
              }`}
            >
              {totalClientsCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFilterTab("Active")}
            className={`px-3 py-1 rounded-md transition-all flex items-center gap-1.5 ${
              filterTab === "Active"
                ? "bg-white text-gray-900 font-medium shadow-2xs"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            <span>Active</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                filterTab === "Active"
                  ? "bg-[#FBECE5] text-[#C85228]"
                  : "text-gray-400"
              }`}
            >
              {activeClientsCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFilterTab("Inactive")}
            className={`px-3 py-1 rounded-md transition-all flex items-center gap-1.5 ${
              filterTab === "Inactive"
                ? "bg-white text-gray-900 font-medium shadow-2xs"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            <span>Inactive</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                filterTab === "Inactive"
                  ? "bg-[#FBECE5] text-[#C85228]"
                  : "text-gray-400"
              }`}
            >
              {inactiveClientsCount}
            </span>
          </button>
        </div>

        {/* Table Header */}
        <div className="border-t border-b border-[#EAE8E4] py-3 px-2 text-xs font-medium text-gray-500 grid grid-cols-12 items-center">
          <div className="col-span-3">Client</div>
          <div className="col-span-1 text-center">Invoices</div>
          <div className="col-span-2 text-center">Total Billed</div>
          <div className="col-span-2 text-center">Outstanding</div>
          <div className="col-span-2">Last Invoice</div>
          <div className="col-span-1 text-center">Status</div>
          <div className="col-span-1 text-right">Actions</div>
        </div>

        {/* Table Rows */}
        <div className="divide-y divide-[#F0EFEB]">
          {filteredClients.map((client) => {
            const hasOutstanding = (client.outstanding || 0) > 0;
            const isActive = client.status?.toLowerCase() === "active";

            return (
              <div
                key={client.id}
                className="hover:bg-[#FAF9F6] py-3.5 px-2 grid grid-cols-12 items-center text-xs transition-colors"
              >
                {/* Client Avatar + Name & Email */}
                <div className="col-span-3 flex items-center gap-3 min-w-0 pr-2">
                  <div className="w-8 h-8 rounded-full bg-[#FBECE5] text-[#C85228] font-bold text-xs flex items-center justify-center shrink-0">
                    {getInitials(client.name)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 truncate">
                      {client.name}
                    </p>
                    <p className="text-[11px] text-gray-400 truncate mt-0.5">
                      {client.email}
                    </p>
                  </div>
                </div>

                {/* Invoices Count */}
                <div className="col-span-1 text-center text-gray-700 font-medium">
                  {client.invoices_count ?? 1}
                </div>

                {/* Total Billed */}
                <div className="col-span-2 text-center font-bold text-gray-900">
                  {formatFullNaira(client.total_billed || 0)}
                </div>

                {/* Outstanding */}
                <div
                  className={`col-span-2 text-center font-bold ${
                    hasOutstanding ? "text-[#DC2626]" : "text-gray-500 font-medium"
                  }`}
                >
                  {hasOutstanding
                    ? formatFullNaira(client.outstanding || 0)
                    : "₦0"}
                </div>

                {/* Last Invoice Date */}
                <div className="col-span-2 text-gray-500">
                  {client.last_invoice || "24th May 2026"}
                </div>

                {/* Status Pill */}
                <div className="col-span-1 flex justify-center">
                  {isActive ? (
                    <span className="bg-[#EAF7EF] text-[#1E8E4E] text-[11px] font-medium px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#1E8E4E]" />
                      Active
                    </span>
                  ) : (
                    <span className="bg-[#F3F4F6] text-[#6B7280] text-[11px] font-medium px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#6B7280]" />
                      Inactive
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="col-span-1 text-right flex justify-end">
                  <button
                    type="button"
                    aria-label="Actions"
                    className="p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-[#F3F2EE] transition-colors"
                  >
                    <Ellipsis className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Pagination Bar */}
        <div className="flex items-center justify-between pt-4 mt-2 border-t border-[#EAE8E4] text-xs text-gray-400">
          <span>
            Showing 1-{filteredClients.length} of {totalClientsCount} clients
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
