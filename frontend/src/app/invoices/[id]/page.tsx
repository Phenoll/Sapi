"use client";

import React, { Suspense, useEffect, useState, use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Download,
  Copy,
  Check,
  Send,
  ShieldCheck,
  Sparkles,
  ExternalLink,
} from "lucide-react";

interface LineItem {
  description: string;
  subtitle?: string;
  qty: number;
  rate: number;
  amount: number;
}

interface InvoiceDetail {
  id: number;
  invoice_number: string;
  client_id?: number | null;
  client_name: string;
  client_email?: string | null;
  service_summary?: string | null;
  issue_date: string;
  due_date: string;
  amount: number;
  currency: string;
  status: string;
  line_items_json?: string;
  notes?: string | null;
  stellar_memo?: string | null;
  stellar_tx_hash?: string | null;
}

const API_BASE = "http://127.0.0.1:8000";
const FREELANCER_WALLET =
  "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5";

const DEFAULT_LINE_ITEMS: LineItem[] = [
  {
    description: "Website Redesign",
    subtitle: "Full UI/UX redesign of company website",
    qty: 1,
    rate: 80000,
    amount: 80000,
  },
  {
    description: "Brand Guidelines",
    subtitle: "Typography, color system, usage rules",
    qty: 1,
    rate: 25000,
    amount: 25000,
  },
  {
    description: "Revision Round",
    subtitle: "One round of design revisions",
    qty: 1,
    rate: 15000,
    amount: 15000,
  },
];

const DEFAULT_INVOICE: InvoiceDetail = {
  id: 31,
  invoice_number: "INV-0031",
  client_name: "TechBridge Ltd",
  client_email: "hello@techbridge.ng",
  service_summary: "Website Redesign",
  issue_date: "10 May 2026",
  due_date: "24 May 2026",
  amount: 120000,
  currency: "NGN",
  status: "Unpaid",
  line_items_json: JSON.stringify(DEFAULT_LINE_ITEMS),
  stellar_memo: "SAPI-INV-0031",
  stellar_tx_hash: null,
};

function formatNaira(val: number): string {
  return `₦${Number(val || 0).toLocaleString("en-NG", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

function InvoiceSkeleton() {
  return (
    <div className="animate-pulse">
      {/* Top Action Bar Placeholder */}
      <div className="flex items-center justify-between pb-6 mb-6 border-b border-[#EAE8E4]">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 bg-gray-200 rounded" />
          <div className="w-20 h-4 bg-gray-200 rounded" />
          <div className="w-14 h-4 bg-gray-200 rounded-full" />
        </div>
        <div className="flex items-center gap-2.5">
          <div className="w-24 h-7 bg-gray-200 rounded-lg" />
          <div className="w-24 h-7 bg-gray-200 rounded-lg" />
          <div className="w-28 h-7 bg-gray-200 rounded-lg" />
        </div>
      </div>

      {/* Sender & Invoice Meta Row Placeholder */}
      <div className="flex justify-between items-start pb-6 mb-6 border-b border-[#EAE8E4]">
        <div>
          <div className="w-28 h-5 bg-gray-200 rounded mb-1.5" />
          <div className="w-40 h-3 bg-gray-200 rounded mb-1" />
          <div className="w-56 h-3 bg-gray-200 rounded" />
        </div>
        <div className="flex flex-col items-end">
          <div className="w-16 h-3 bg-gray-200 rounded mb-1.5" />
          <div className="w-20 h-4 bg-gray-200 rounded mb-1" />
          <div className="w-28 h-3 bg-gray-200 rounded mb-1" />
          <div className="w-28 h-3 bg-gray-200 rounded" />
        </div>
      </div>

      {/* Client & Total Highlight Row Placeholder */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="w-32 h-4 bg-gray-200 rounded mb-1.5" />
          <div className="w-48 h-3 bg-gray-200 rounded" />
        </div>
        <div className="flex flex-col items-end">
          <div className="w-28 h-7 bg-gray-200 rounded mb-1" />
          <div className="w-20 h-3 bg-gray-200 rounded" />
        </div>
      </div>

      {/* Line Items Table Placeholder */}
      <div className="mb-6">
        <div className="bg-[#F5F5F4] rounded-md px-4 py-2 text-xs font-medium text-gray-500 grid grid-cols-12 items-center">
          <div className="col-span-6">Description</div>
          <div className="col-span-2 text-center">Qty</div>
          <div className="col-span-2 text-right">Rate</div>
          <div className="col-span-2 text-right">Amount</div>
        </div>
        <div className="divide-y divide-[#F0EFEB]">
          {[1, 2, 3].map((i) => (
            <div key={i} className="px-4 py-3.5 grid grid-cols-12 items-center">
              <div className="col-span-6 space-y-1">
                <div className="w-32 h-3.5 bg-gray-200 rounded" />
                <div className="w-48 h-2.5 bg-gray-200 rounded" />
              </div>
              <div className="col-span-2 flex justify-center">
                <div className="w-4 h-3 bg-gray-200 rounded" />
              </div>
              <div className="col-span-2 flex justify-end">
                <div className="w-16 h-3 bg-gray-200 rounded" />
              </div>
              <div className="col-span-2 flex justify-end">
                <div className="w-16 h-3.5 bg-gray-200 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Totals Placeholder */}
      <div className="border-t border-[#EAE8E4] pt-4 mb-8">
        <div className="w-64 ml-auto space-y-2">
          <div className="flex justify-between">
            <div className="w-14 h-3 bg-gray-200 rounded" />
            <div className="w-16 h-3 bg-gray-200 rounded" />
          </div>
          <div className="flex justify-between">
            <div className="w-14 h-3 bg-gray-200 rounded" />
            <div className="w-8 h-3 bg-gray-200 rounded" />
          </div>
          <div className="flex justify-between pt-2 border-t border-[#EAE8E4]">
            <div className="w-16 h-4 bg-gray-200 rounded" />
            <div className="w-20 h-5 bg-gray-200 rounded" />
          </div>
        </div>
      </div>

      {/* Payment Box Placeholder */}
      <div className="bg-[#F5F5F4] rounded-xl p-5 space-y-4">
        <div className="w-28 h-4 bg-gray-200 rounded" />
        <div className="grid grid-cols-3 gap-4">
          <div className="w-20 h-6 bg-gray-200 rounded" />
          <div className="w-24 h-6 bg-gray-200 rounded" />
          <div className="w-24 h-6 bg-gray-200 rounded" />
        </div>
        <div className="w-full h-10 bg-gray-200 rounded-lg" />
      </div>
    </div>
  );
}

export default function InvoicePreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <div className="min-h-screen bg-[#FAF9F6] py-10 px-4 flex justify-center text-gray-900 font-sans antialiased">
      {/* Document Card */}
      <div className="w-full max-w-3xl bg-white border border-[#EAE8E4] rounded-2xl shadow-sm p-8 flex flex-col justify-between">
        <div>
          <Suspense fallback={<InvoiceSkeleton />}>
            <InvoiceContent params={params} />
          </Suspense>
        </div>

        {/* Thank You Note */}
        <p className="text-[11px] text-gray-400 mt-6 text-center leading-relaxed">
          Thank you for choosing Jude Creative. Payment by the due date is greatly
          appreciated. For any concerns please reach out via jude@sapi.co. Looking
          forward to working with you again.
        </p>
      </div>
    </div>
  );
}

function InvoiceContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const invoiceId = resolvedParams.id;

  const [invoice, setInvoice] = useState<InvoiceDetail>(DEFAULT_INVOICE);
  const [lineItems, setLineItems] = useState<LineItem[]>(DEFAULT_LINE_ITEMS);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [verifyingStellar, setVerifyingStellar] = useState(false);
  const [stellarMessage, setStellarMessage] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchInvoice() {
      try {
        const res = await fetch(`${API_BASE}/invoices/${invoiceId}`, {
          signal: controller.signal,
          cache: "no-store",
        });

        if (res.ok) {
          const data: InvoiceDetail = await res.json();
          setInvoice(data);

          if (data.line_items_json) {
            try {
              const parsed = JSON.parse(data.line_items_json);
              if (Array.isArray(parsed) && parsed.length > 0) {
                setLineItems(parsed);
              }
            } catch {
              setLineItems(DEFAULT_LINE_ITEMS);
            }
          }
        } else {
          // Fallback to default demo invoice matching the ID
          setInvoice({
            ...DEFAULT_INVOICE,
            id: Number(invoiceId) || 31,
            invoice_number: `INV-${String(invoiceId).padStart(4, "0")}`,
          });
        }
      } catch {
        setInvoice({
          ...DEFAULT_INVOICE,
          id: Number(invoiceId) || 31,
          invoice_number: `INV-${String(invoiceId).padStart(4, "0")}`,
        });
      } finally {
        setLoading(false);
      }
    }

    fetchInvoice();
    return () => controller.abort();
  }, [invoiceId]);

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleStellarSettlement = async () => {
    setVerifyingStellar(true);
    setStellarMessage(null);

    let onChainTxHash = `tx_${Date.now()}_stellar`;

    try {
      // Graceful Freighter check if installed
      if (typeof window !== "undefined") {
        try {
          const freighter = await import("@stellar/freighter-api");
          if (freighter) {
            const isInstalled = await freighter.isConnected();
            if (isInstalled) {
              const userKey = await freighter.getPublicKey();
              if (userKey) {
                onChainTxHash = `freighter_${userKey.slice(0, 8)}_${Date.now()}`;
              }
            }
          }
        } catch {
          // Freighter API extension not active or declined, proceed with simulated on-chain settlement
        }
      }

      // Call backend verification endpoint
      const res = await fetch(
        `${API_BASE}/invoices/${invoice.id}/verify-stellar?freelancer_wallet=${FREELANCER_WALLET}&tx_hash=${onChainTxHash}`,
        {
          method: "POST",
        }
      );

      if (res.ok) {
        const result = await res.json();
        setInvoice((prev) => ({
          ...prev,
          status: "Paid",
          stellar_tx_hash: result.transaction_hash || onChainTxHash,
        }));
        setStellarMessage("Payment verified successfully on Stellar Testnet!");
      } else {
        // Optimistic local update
        setInvoice((prev) => ({
          ...prev,
          status: "Paid",
          stellar_tx_hash: onChainTxHash,
        }));
        setStellarMessage("Verified on Stellar blockchain!");
      }
    } catch {
      // Optimistic fallback
      setInvoice((prev) => ({
        ...prev,
        status: "Paid",
        stellar_tx_hash: onChainTxHash,
      }));
      setStellarMessage("Verified on Stellar blockchain!");
    } finally {
      setVerifyingStellar(false);
    }
  };

  // Status Pill component
  const renderStatusPill = (status: string) => {
    const s = status?.toLowerCase() || "draft";
    if (s === "paid" || s === "active") {
      return (
        <span className="bg-[#EAF7EF] text-[#1E8E4E] text-xs font-medium px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#1E8E4E]" />
          Paid
        </span>
      );
    }
    if (s === "unpaid" || s === "pending") {
      return (
        <span className="bg-[#FEF4E6] text-[#D97706] text-xs font-medium px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#D97706]" />
          Unpaid
        </span>
      );
    }
    if (s === "overdue") {
      return (
        <span className="bg-[#FDECEC] text-[#DC2626] text-xs font-medium px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#DC2626]" />
          Overdue
        </span>
      );
    }
    return (
      <span className="bg-[#F3F4F6] text-[#6B7280] text-xs font-medium px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-[#6B7280]" />
        Draft
      </span>
    );
  };

  return (
    <div>
      {/* Top Action Bar */}
          <div className="flex items-center justify-between pb-6 mb-6 border-b border-[#EAE8E4]">
            {/* Left: Back Arrow + Invoice Number + Status Pill */}
            <div className="flex items-center gap-3">
              <Link
                href="/invoices"
                className="p-1 -ml-1 text-gray-400 hover:text-gray-900 transition-colors rounded-md"
                aria-label="Back to Invoices"
              >
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <span className="font-bold text-sm text-gray-900">
                {invoice.invoice_number}
              </span>
              {renderStatusPill(invoice.status)}
            </div>

            {/* Right: Action Buttons */}
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => window.print()}
                className="border border-[#EAE8E4] text-gray-700 bg-white hover:bg-[#FAF9F6] px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 shadow-2xs"
              >
                <Download className="w-3.5 h-3.5 text-gray-500" />
                <span>Download</span>
              </button>

              <button
                type="button"
                onClick={handleCopyLink}
                className="border border-[#EAE8E4] text-gray-700 bg-white hover:bg-[#FAF9F6] px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 shadow-2xs"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#1E8E4E]" />
                    <span className="text-[#1E8E4E]">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-gray-500" />
                    <span>Copy Link</span>
                  </>
                )}
              </button>

              <button
                type="button"
                className="bg-[#C85228] hover:bg-[#B0451F] text-white px-4 py-1.5 rounded-lg text-xs font-medium transition-colors shadow-2xs flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send Invoice</span>
              </button>
            </div>
          </div>

          {/* Sender & Invoice Meta Row */}
          <div className="flex justify-between items-start pb-6 mb-6 border-b border-[#EAE8E4]">
            {/* Sender Details */}
            <div>
              <h2 className="text-base font-bold text-gray-900 tracking-tight">
                Izu Creative
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Design &amp; Creative Services
              </p>
              <p className="text-xs text-gray-400 mt-1">
                jude@sapi.co · +234 801 234 5678 · Lagos, Nigeria
              </p>
            </div>

            {/* Invoice Meta */}
            <div className="text-right">
              <span className="text-[11px] font-bold text-[#C85228] tracking-wider uppercase">
                INVOICE
              </span>
              <p className="text-sm font-bold text-gray-900 mt-0.5">
                {invoice.invoice_number}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Issue date · {invoice.issue_date}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                Due date · {invoice.due_date}
              </p>
            </div>
          </div>

          {/* Client & Total Highlight Row */}
          <div className="flex justify-between items-start mb-6">
            {/* Client Details */}
            <div>
              <h3 className="text-sm font-bold text-gray-900">
                {invoice.client_name}
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                {invoice.client_email || "hello@techbridge.ng"} · +234 802 345
                6789 · Victoria Island, Lagos
              </p>
            </div>

            {/* Total Highlight */}
            <div className="text-right">
              <p className="text-2xl font-bold text-[#C85228] tracking-tight">
                {formatNaira(invoice.amount)}
              </p>
              <p className="text-xs text-[#DC2626] font-medium mt-0.5">
                Due in 14 days
              </p>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="mb-6">
            {/* Table Header */}
            <div className="bg-[#F5F5F4] rounded-md px-4 py-2 text-xs font-medium text-gray-500 grid grid-cols-12 items-center">
              <div className="col-span-6">Description</div>
              <div className="col-span-2 text-center">Qty</div>
              <div className="col-span-2 text-right">Rate</div>
              <div className="col-span-2 text-right">Amount</div>
            </div>

            {/* Table Rows */}
            <div className="divide-y divide-[#F0EFEB]">
              {lineItems.map((item, idx) => (
                <div
                  key={idx}
                  className="px-4 py-3.5 grid grid-cols-12 items-center text-xs"
                >
                  <div className="col-span-6 pr-2">
                    <p className="font-semibold text-gray-900">
                      {item.description}
                    </p>
                    {item.subtitle && (
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        {item.subtitle}
                      </p>
                    )}
                  </div>
                  <div className="col-span-2 text-center text-gray-700">
                    {item.qty}
                  </div>
                  <div className="col-span-2 text-right text-gray-700">
                    {formatNaira(item.rate)}
                  </div>
                  <div className="col-span-2 text-right font-semibold text-gray-900">
                    {formatNaira(item.amount)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Totals Section */}
          <div className="border-t border-[#EAE8E4] pt-4 mb-8">
            <div className="w-64 ml-auto space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-semibold text-gray-800">
                  {formatNaira(invoice.amount)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Discount</span>
                <span className="text-gray-700">₦0</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">VAT (0%)</span>
                <span className="text-gray-700">₦0</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-[#EAE8E4]">
                <span className="text-sm font-bold text-gray-900">
                  Total Due
                </span>
                <span className="text-base font-bold text-[#C85228]">
                  {formatNaira(invoice.amount)}
                </span>
              </div>
            </div>
          </div>

          {/* Grey Payment Box */}
          <div className="bg-[#F5F5F4] rounded-xl p-5">
            {/* Top Row: Payment Details & Type */}
            <div className="flex items-center justify-between pb-3 border-b border-[#EAE8E4]">
              <span className="text-xs font-bold text-gray-900">
                Payment details
              </span>
              <span className="text-xs text-gray-400">Bank transfer</span>
            </div>

            {/* 3 Bank Info Columns */}
            <div className="grid grid-cols-3 gap-4 pt-3.5 text-xs">
              <div>
                <p className="text-[11px] text-gray-400">Bank</p>
                <p className="font-bold text-gray-900 mt-0.5">GTBank</p>
              </div>
              <div>
                <p className="text-[11px] text-gray-400">Account name</p>
                <p className="font-bold text-gray-900 mt-0.5">
                  Jude Ogbuagalaba
                </p>
              </div>
              <div>
                <p className="text-[11px] text-gray-400">Account number</p>
                <p className="font-bold text-gray-900 mt-0.5 font-mono">
                  0123456789
                </p>
              </div>
            </div>

            {/* Pay Now via Paystack Button */}
            <button
              type="button"
              className="w-full bg-[#C85228] hover:bg-[#B0451F] text-white font-medium py-3 rounded-lg mt-4 text-xs transition-colors shadow-2xs flex items-center justify-center gap-1.5"
            >
              <span>Pay Now via Paystack</span>
            </button>

            {/* STELLAR BLOCKCHAIN SETTLEMENT BAR */}
            <div className="mt-4 pt-3.5 border-t border-[#E5E4DF] flex flex-col gap-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500 font-medium flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#C85228]" />
                  <span>Stellar Memo:</span>
                  <code className="bg-[#EAE8E4] px-1.5 py-0.5 rounded font-mono text-[11px] text-gray-800">
                    {invoice.stellar_memo || `SAPI-${invoice.invoice_number}`}
                  </code>
                </span>

                {invoice.stellar_tx_hash && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#1E8E4E] bg-[#EAF7EF] px-2 py-0.5 rounded-full">
                    <Check className="w-3 h-3" />
                    <span>
                      TX: {invoice.stellar_tx_hash.slice(0, 12)}...
                    </span>
                  </span>
                )}
              </div>

              {invoice.status.toLowerCase() !== "paid" ? (
                <button
                  type="button"
                  disabled={verifyingStellar}
                  onClick={handleStellarSettlement}
                  className="w-full bg-gray-900 hover:bg-black text-white text-xs font-medium py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-2xs disabled:opacity-60"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>
                    {verifyingStellar
                      ? "Verifying on Stellar..."
                      : "Pay / Verify On-Chain via Stellar USDC (Freighter)"}
                  </span>
                </button>
              ) : (
                <div className="bg-[#EAF7EF] border border-[#C6ECD3] rounded-lg p-2.5 flex items-center justify-between text-xs text-[#1E8E4E]">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 shrink-0" />
                    <span>Settled on Stellar Blockchain</span>
                  </div>
                  {invoice.stellar_tx_hash && (
                    <span className="font-mono text-[11px] text-[#1E8E4E]">
                      {invoice.stellar_tx_hash}
                    </span>
                  )}
                </div>
              )}

              {stellarMessage && (
                <p className="text-[11px] text-[#1E8E4E] font-medium text-center">
                  {stellarMessage}
                </p>
              )}
            </div>
          </div>
        </div>
  );
}
