"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";

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

function formatFullNaira(val: number): string {
  return `₦${Number(val || 0).toLocaleString("en-NG", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

export default function InvoicesListPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<ApiInvoice[]>([]);
  const [, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
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

    async function loadInvoices() {
      try {
        let email = "default@sapi.com";
        try {
          const profile = JSON.parse(localStorage.getItem("sapi_user_profile") || "{}");
          if (profile.email) email = profile.email;
        } catch {}

        const res = await fetch(`${API_BASE}/invoices?owner_email=${encodeURIComponent(email)}`, {
          signal: controller.signal,
          cache: "no-store",
        });

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
          <img
            src="/icons/plus.svg"
            className="w-4 h-4 transition-transform duration-200 hover:scale-110"
            alt="Create Invoice"
          />
          <span>Create Invoice</span>
        </Link>
      </div>

      {/* Main Table or Empty State */}
      {invoices.length === 0 ? (
        /* Empty State */
        <div className="border-2 border-dashed border-[#E2E0D8] rounded-xl bg-white min-h-[420px] flex flex-col items-center justify-center text-center p-8">
          <div className="w-12 h-12 rounded-xl bg-[#F3F2EE] flex items-center justify-center text-gray-400 mb-3">
            <img
              src="/icons/ellipsis.svg"
              className="w-6 h-6 opacity-40"
              alt="No invoices"
            />
          </div>
          <h3 className="font-bold text-base text-gray-900">No invoices yet</h3>
          <p className="text-xs text-gray-500 max-w-sm mt-1 mb-5">
            Create your first invoice and start getting paid on time. It only takes a minute.
          </p>
          <Link
            href="/invoices/new"
            className="bg-[#C85228] hover:bg-[#B0451F] text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-2xs flex items-center gap-2"
          >
            <img
              src="/icons/plus.svg"
              className="w-4 h-4"
              alt="Create Invoice"
            />
            <span>Create Invoice</span>
          </Link>
        </div>
      ) : (
        <div className="bg-white border border-[#EAE8E4] rounded-xl p-5 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
          {/* Top bar inside table */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-gray-900">
              {invoices.length} Invoices
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
          <div className="bg-[#F5F5F4] px-5 py-2.5 grid grid-cols-12 items-center border border-[#EAE8E4] rounded-lg mb-2 text-xs text-[#8C8985] uppercase tracking-wider font-semibold">
            <div className="col-span-2">Invoice ID</div>
            <div className="col-span-3">Client</div>
            <div className="col-span-2">Amount</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2">Due Date</div>
            <div className="col-span-1 text-right">Actions</div>
          </div>

          {/* Table Rows or Filter Empty */}
          {filteredInvoices.length === 0 ? (
            <div className="py-12 text-center text-gray-500 text-xs">
              No invoices match your current filter or search.
            </div>
          ) : (
            <div className="divide-y divide-[#F0EFEB]">
              {filteredInvoices.map((inv) => (
                <div
                  key={inv.id}
                  onClick={() => router.push(`/invoices/${inv.id}`)}
                  className="px-5 py-3 grid grid-cols-12 items-center hover:bg-[#FAF9F6] cursor-pointer transition-colors text-xs relative"
                >
                  {/* Invoice ID */}
                  <div className="col-span-2 text-sm text-gray-600 font-normal">
                    {inv.invoice_number || `INV-${String(inv.id).padStart(4, "0")}`}
                  </div>

                  {/* Client Name & Service Summary */}
                  <div className="col-span-3 min-w-0 pr-2">
                    <p className="text-base font-bold text-gray-900 truncate">
                      {inv.client_name}
                    </p>
                    <p className="text-sm text-gray-600 truncate mt-0.5">
                      {inv.service_summary || "Design Services"}
                    </p>
                  </div>

                  {/* Amount */}
                  <div className="col-span-2 text-base font-bold text-gray-900">
                    {formatFullNaira(inv.amount)}
                  </div>

                  {/* Status */}
                  <div className="col-span-2">{renderStatusPill(inv.status)}</div>

                  {/* Due Date */}
                  <div className="col-span-2 text-sm text-gray-600">{inv.due_date}</div>

                  {/* Actions */}
                  <div
                    className="col-span-1 text-right flex justify-end relative"
                    data-action-menu
                  >
                    <button
                      type="button"
                      aria-label="More options"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveDropdown((prev) => (prev === inv.id ? null : inv.id));
                      }}
                      className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <img
                        src="/icons/ellipsis.svg"
                        className="w-4 h-4 transition-transform duration-200 hover:scale-110"
                        alt="More options"
                      />
                    </button>

                    {/* Absolute Positioned Dropdown */}
                    {activeDropdown === inv.id && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="absolute bg-white shadow-lg rounded-xl border border-[#EAE8E4] py-1 z-10 w-32 right-0 mt-2 text-left top-full"
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setActiveDropdown(null);
                            router.push(`/invoices/${inv.id}`);
                          }}
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
                          onClick={() => {
                            setActiveDropdown(null);
                          }}
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
                          onClick={() => {
                            setActiveDropdown(null);
                          }}
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
              ))}
            </div>
          )}

          {/* Bottom Pagination Bar */}
          {filteredInvoices.length > 0 && (
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
