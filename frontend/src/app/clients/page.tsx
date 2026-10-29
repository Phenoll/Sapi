"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";

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

function formatCompactNaira(val: number): string {
  if (val >= 1000000) {
    return `₦${(val / 1000000).toFixed(1)}M`;
  }
  if (val >= 1000) {
    return `₦${(val / 1000).toFixed(0)}k`;
  }
  return `₦${val.toLocaleString()}`;
}

function formatFullNaira(val: number): string {
  return `₦${Number(val || 0).toLocaleString("en-NG", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

function getInitials(name: string): string {
  if (!name) return "CL";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export default function ClientsPage() {
  const [clients, setClients] = useState<ClientData[]>([]);
  const [, setLoading] = useState(true);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTab, setFilterTab] = useState<"All" | "Active" | "Inactive">("All");
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest("[data-action-menu]")) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    async function loadData() {
      try {
        let email = "default@sapi.com";
        try {
          const profile = JSON.parse(localStorage.getItem("sapi_user_profile") || "{}");
          if (profile.email) email = profile.email;
        } catch {}

        const [clientsRes, sumRes] = await Promise.all([
          fetch(`${API_BASE}/clients?owner_email=${encodeURIComponent(email)}`, {
            signal: controller.signal,
            cache: "no-store",
          }),
          fetch(`${API_BASE}/dashboard/summary?owner_email=${encodeURIComponent(email)}`, {
            signal: controller.signal,
            cache: "no-store",
          }),
        ]);

        if (clientsRes.ok) {
          const clientData: ClientData[] = await clientsRes.json();
          setClients(Array.isArray(clientData) ? clientData : []);
        } else {
          setClients([]);
        }

        if (sumRes.ok) {
          const sumData: DashboardSummary = await sumRes.json();
          setSummary(sumData);
        }
      } catch {
        if (!controller.signal.aborted) {
          setClients([]);
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

  // Compute live metrics
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
  const unpaidInvoicesCount = summary?.pending_count ?? 0;

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
          <img
            src="/icons/plus.svg"
            className="w-4 h-4 transition-transform duration-200 hover:scale-110"
            alt="Add Client"
          />
          <span>Add Client</span>
        </Link>
      </div>

      {/* 3 Stat Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mb-6">
        {/* Card 1: TOTAL CLIENTS */}
        <div className="bg-white border border-[#EAE8E4] rounded-xl p-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-gray-500">
            <img
              src="/icons/users.svg"
              className="w-4 h-4 transition-transform duration-200 hover:scale-110"
              alt="Users"
            />
            <span className="text-xs text-[#8C8985] uppercase tracking-wider font-semibold">
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
            <img
              src="/icons/users-green.svg"
              className="w-4 h-4 transition-transform duration-200 hover:scale-110"
              alt="Active Users"
            />
            <span className="text-xs text-[#8C8985] uppercase tracking-wider font-semibold">
              ACTIVE CLIENTS
            </span>
          </div>
          <div className="bg-[#F5F5F4] rounded-lg p-4 mt-2.5">
            <p className="text-2xl font-bold text-gray-900 tracking-tight">
              {activeClientsCount}
            </p>
            <p className="text-xs text-gray-500 mt-1">Active accounts</p>
          </div>
        </div>

        {/* Card 3: OUTSTANDING */}
        <div className="bg-white border border-[#EAE8E4] rounded-xl p-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-gray-500">
            <img
              src="/icons/alert-circle.svg"
              className="w-4 h-4 transition-transform duration-200 hover:scale-110"
              alt="Outstanding"
            />
            <span className="text-xs text-[#8C8985] uppercase tracking-wider font-semibold">
              OUTSTANDING
            </span>
          </div>
          <div className="bg-[#F5F5F4] rounded-lg p-4 mt-2.5">
            <p className="text-2xl font-bold text-gray-900 tracking-tight">
              {formatCompactNaira(totalOutstanding)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {unpaidInvoicesCount} unpaid invoices
            </p>
          </div>
        </div>
      </div>

      {/* Main Table or Empty State */}
      {clients.length === 0 ? (
        /* Empty State */
        <div className="border-2 border-dashed border-[#E2E0D8] rounded-xl bg-white min-h-[380px] flex flex-col items-center justify-center text-center p-8">
          <div className="w-12 h-12 rounded-xl bg-[#F3F2EE] flex items-center justify-center text-gray-400 mb-3">
            <img
              src="/icons/users.svg"
              className="w-6 h-6 opacity-40"
              alt="Clients"
            />
          </div>
          <h3 className="font-bold text-base text-gray-900">No clients yet</h3>
          <p className="text-xs text-gray-500 max-w-sm mt-1 mb-5">
            Add your first client to start creating invoices and tracking payments.
          </p>
          <Link
            href="/clients/new"
            className="bg-[#C85228] hover:bg-[#B0451F] text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-2xs flex items-center gap-2"
          >
            <img src="/icons/plus.svg" className="w-4 h-4" alt="Add Client" />
            <span>Add Client</span>
          </Link>
        </div>
      ) : (
        <div className="bg-white border border-[#EAE8E4] rounded-xl p-5 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
          {/* Top bar inside table */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-gray-900">
              {totalClientsCount} Clients
            </h2>

            <div className="flex items-center gap-3">
              <div className="relative w-64">
                <img
                  src="/icons/search.svg"
                  className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none transition-transform duration-200 hover:scale-110"
                  alt="Search"
                />
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
                <img
                  src="/icons/filter.svg"
                  className="w-4 h-4 transition-transform duration-200 hover:scale-110"
                  alt="Filter"
                />
                <span>Filter</span>
              </button>

              <button
                type="button"
                className="border border-[#EAE8E4] bg-white hover:bg-[#FAF9F6] text-gray-700 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
              >
                <img
                  src="/icons/sort.svg"
                  className="w-4 h-4 transition-transform duration-200 hover:scale-110"
                  alt="Sort"
                />
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
          <div className="border-t border-b border-[#EAE8E4] py-3 px-2 grid grid-cols-12 items-center text-xs text-[#8C8985] uppercase tracking-wider font-semibold">
            <div className="col-span-3">Client</div>
            <div className="col-span-1 text-center">Invoices</div>
            <div className="col-span-2 text-center">Total Billed</div>
            <div className="col-span-2 text-center">Outstanding</div>
            <div className="col-span-2">Last Invoice</div>
            <div className="col-span-1 text-center">Status</div>
            <div className="col-span-1 text-right">Actions</div>
          </div>

          {/* Table Rows or Filter Empty */}
          {filteredClients.length === 0 ? (
            <div className="py-12 text-center text-gray-500 text-xs">
              No clients match your filter.
            </div>
          ) : (
            <div className="divide-y divide-[#F0EFEB]">
              {filteredClients.map((client) => {
                const hasOutstanding = (client.outstanding || 0) > 0;
                const isActive = client.status?.toLowerCase() === "active";

                return (
                  <div
                    key={client.id}
                    className="hover:bg-[#FAF9F6] py-3.5 px-2 grid grid-cols-12 items-center text-xs transition-colors relative"
                  >
                    {/* Client Avatar + Name & Email */}
                    <div className="col-span-3 flex items-center gap-3 min-w-0 pr-2">
                      <div className="w-8 h-8 rounded-full bg-[#FBECE5] text-[#C85228] font-bold text-xs flex items-center justify-center shrink-0">
                        {getInitials(client.name)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-base font-bold text-gray-900 truncate">
                          {client.name}
                        </p>
                        <p className="text-sm text-gray-600 truncate mt-0.5">
                          {client.email}
                        </p>
                      </div>
                    </div>

                    {/* Invoices Count */}
                    <div className="col-span-1 text-center text-gray-700 font-medium">
                      {client.invoices_count ?? 0}
                    </div>

                    {/* Total Billed */}
                    <div className="col-span-2 text-center text-base font-bold text-gray-900">
                      {formatFullNaira(client.total_billed || 0)}
                    </div>

                    {/* Outstanding */}
                    <div
                      className={`col-span-2 text-center text-base font-bold ${
                        hasOutstanding ? "text-[#DC2626]" : "text-gray-900"
                      }`}
                    >
                      {hasOutstanding
                        ? formatFullNaira(client.outstanding || 0)
                        : "₦0"}
                    </div>

                    {/* Last Invoice Date */}
                    <div className="col-span-2 text-sm text-gray-600">
                      {client.last_invoice || "—"}
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
                    <div
                      className="col-span-1 text-right flex justify-end relative"
                      data-action-menu
                    >
                      <button
                        type="button"
                        aria-label="Actions"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveDropdown((prev) =>
                            prev === client.id ? null : client.id
                          );
                        }}
                        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <img
                          src="/icons/ellipsis.svg"
                          className="w-4 h-4 transition-transform duration-200 hover:scale-110"
                          alt="Actions"
                        />
                      </button>

                      {/* Absolute positioned Action Dropdown */}
                      {activeDropdown === client.id && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="absolute bg-white shadow-lg rounded-xl border border-[#EAE8E4] py-1 z-10 w-32 right-0 mt-2 text-left top-full"
                        >
                          <button
                            type="button"
                            onClick={() => setActiveDropdown(null)}
                            className="w-full px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors"
                          >
                            <img
                              src="/icons/edit.svg"
                              className="w-3.5 h-3.5 transition-transform duration-200 hover:scale-110"
                              alt="Edit"
                            />
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveDropdown(null)}
                            className="w-full px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors"
                          >
                            <img
                              src="/icons/copy.svg"
                              className="w-3.5 h-3.5 transition-transform duration-200 hover:scale-110"
                              alt="Duplicate"
                            />
                            <span>Duplicate</span>
                          </button>
                          <div className="border-t border-[#EAE8E4] my-1" />
                          <button
                            type="button"
                            onClick={() => setActiveDropdown(null)}
                            className="w-full px-4 py-2 text-xs font-medium text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                          >
                            <img
                              src="/icons/trash.svg"
                              className="w-3.5 h-3.5 transition-transform duration-200 hover:scale-110"
                              alt="Delete"
                            />
                            <span>Delete</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Bottom Pagination Bar */}
          {filteredClients.length > 0 && (
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
                  <img
                    src="/icons/chevron-left.svg"
                    className="w-4 h-4 transition-transform duration-200 hover:scale-110 opacity-40"
                    alt="Previous"
                  />
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
                  <img
                    src="/icons/chevron-right.svg"
                    className="w-4 h-4 transition-transform duration-200 hover:scale-110 opacity-40"
                    alt="Next"
                  />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </AppShell>
  );
}
