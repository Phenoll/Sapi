"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Copy, Check, Mail, ExternalLink, X, CheckCircle2 } from "lucide-react";

interface SendInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: {
    id: number | string;
    invoice_number: string;
    client_name?: string;
    client_email?: string | null;
    amount?: number;
    currency?: string;
  };
  workspaceName?: string;
}

export default function SendInvoiceModal({
  isOpen,
  onClose,
  invoice,
  workspaceName,
}: SendInvoiceModalProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

  if (!isOpen) return null;

  const payUrl = `${origin}/pay/${invoice.id}`;
  const clientEmail = invoice.client_email || "";
  const brandName = workspaceName || "My Workspace";

  const emailSubject = encodeURIComponent(`Invoice ${invoice.invoice_number} from ${brandName}`);
  const emailBody = encodeURIComponent(
    `Hello,\n\nPlease find your invoice ${invoice.invoice_number} from ${brandName}.\n\nView and settle your invoice securely via Stellar USDC:\n${payUrl}\n\nThank you!`
  );
  const mailtoLink = `mailto:${clientEmail}?subject=${emailSubject}&body=${emailBody}`;

  const handleCopy = () => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(payUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleDone = () => {
    onClose();
    router.push(`/invoices/${invoice.id}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-white border border-[#EAE8E4] rounded-2xl shadow-2xl p-6 relative animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-400 hover:text-gray-700 p-1 rounded-lg transition-colors"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Icon + Title */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-[#EAF7EF] flex items-center justify-center text-[#1E8E4E]">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 tracking-tight">
              Invoice Ready to Send
            </h3>
            <p className="text-xs text-gray-500">
              Share the public payment link with {invoice.client_name || "your client"}
            </p>
          </div>
        </div>

        {/* Invoice Summary Pill */}
        <div className="bg-[#FAF9F6] border border-[#EAE8E4] rounded-xl p-3 mb-5 flex items-center justify-between text-xs">
          <div>
            <span className="text-gray-500">Invoice:</span>{" "}
            <span className="font-bold text-gray-900">{invoice.invoice_number}</span>
          </div>
          {invoice.amount !== undefined && (
            <div>
              <span className="text-gray-500">Amount:</span>{" "}
              <span className="font-bold text-[#C85228]">
                {invoice.currency === "USDC" ? "$" : "₦"}
                {Number(invoice.amount).toLocaleString()}
              </span>
            </div>
          )}
        </div>

        {/* Public Client Payment Link Box */}
        <div className="mb-5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#8C8985] mb-1.5">
            Public Client Payment URL
          </label>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-[#F5F5F4] border border-[#E5E4DF] rounded-lg px-3 py-2 text-xs font-mono text-gray-700 truncate select-all">
              {payUrl}
            </div>
            <button
              type="button"
              onClick={handleCopy}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 shadow-2xs whitespace-nowrap ${
                copied
                  ? "bg-[#1E8E4E] text-white"
                  : "bg-white border border-[#EAE8E4] text-gray-700 hover:bg-[#FAF9F6] hover:border-gray-400"
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-white" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-gray-500" />
                  <span>Copy Link</span>
                </>
              )}
            </button>
          </div>
          <p className="text-[11px] text-gray-400 mt-1">
            Clients can view, verify on Stellar testnet, or pay via Paystack at this secure URL without logging in.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5 pt-2 border-t border-[#EAE8E4]">
          <a
            href={mailtoLink}
            className="w-full bg-white hover:bg-[#FAF9F6] border border-[#EAE8E4] text-gray-800 font-medium py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-colors shadow-2xs"
          >
            <Mail className="w-4 h-4 text-[#C85228]" />
            <span>Send via Email {clientEmail ? `(${clientEmail})` : ""}</span>
          </a>

          <div className="flex items-center gap-2 pt-1">
            <a
              href={payUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 border border-[#EAE8E4] text-gray-700 bg-white hover:bg-gray-50 py-2.5 px-4 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5 text-gray-500" />
              <span>Preview Link</span>
            </a>

            <button
              type="button"
              onClick={handleDone}
              className="flex-1 bg-[#C85228] hover:bg-[#B0451F] text-white py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
            >
              <span>Done / View Invoice</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
