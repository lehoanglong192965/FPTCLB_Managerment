import { useEffect, useState } from "react";
import QRCode from "react-qr-code";
import { Check, Copy, Ticket, X } from "lucide-react";

function formatDateTime(value) {
  if (!value) return "Not available";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString("vi-VN", { dateStyle: "medium", timeStyle: "short" });
}

function fallbackCopy(text) {
  const input = document.createElement("textarea");
  input.value = text;
  input.setAttribute("readonly", "");
  input.style.position = "fixed";
  input.style.opacity = "0";
  document.body.appendChild(input);
  input.select();
  let copied = false;
  try {
    copied = document.execCommand("copy");
  } finally {
    document.body.removeChild(input);
  }
  return copied;
}

export default function TicketDetailModal({ ticket, onClose }) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState("");
  const ticketEligible = ticket?.ticketEligible === true && Boolean(ticket?.ticketCode);

  useEffect(() => {
    const closeOnEscape = (event) => {
      if (event.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  if (!ticket) return null;

  const copyTicketCode = async () => {
    setCopyError("");
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(ticket.ticketCode);
      setCopied(true);
    } catch {
      if (fallbackCopy(ticket.ticketCode)) setCopied(true);
      else setCopyError("Unable to copy the ticket code. Please try again.");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose?.();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="ticket-detail-title"
        className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex items-start justify-between bg-[#0D1B3E] px-5 py-4 text-white">
          <div className="min-w-0 pr-4">
            <p className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-orange-200">
              <Ticket size={15} /> Event ticket
            </p>
            <h2 id="ticket-detail-title" className="line-clamp-2 text-base font-bold">
              {ticket.eventName ?? ticket.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onClose?.()}
            className="rounded-lg p-1.5 text-slate-200 transition hover:bg-white/10 hover:text-white"
            aria-label="Close ticket"
          >
            <X size={19} />
          </button>
        </div>

        <div className="space-y-4 p-5">
          <dl className="grid grid-cols-[100px_1fr] gap-x-3 gap-y-2 text-sm">
            <dt className="text-slate-500">Time</dt>
            <dd className="font-medium text-slate-800">{formatDateTime(ticket.startDate ?? ticket.date)}</dd>
            <dt className="text-slate-500">Location</dt>
            <dd className="font-medium text-slate-800">{ticket.location ?? "Not available"}</dd>
            <dt className="text-slate-500">Status</dt>
            <dd className="font-medium text-slate-800">{ticket.registrationStatus ?? "Registered"}</dd>
          </dl>

          {ticketEligible ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="mb-3 text-center text-sm font-semibold text-emerald-800">
                Show this QR ticket to event staff at check-in.
              </p>
              <div className="mx-auto w-fit rounded-xl bg-white p-3 shadow-sm">
                <QRCode value={ticket.ticketCode} size={216} level="M" bgColor="#FFFFFF" fgColor="#0D1B3E" />
              </div>
              <button
                type="button"
                onClick={copyTicketCode}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-emerald-300 bg-white px-3 py-2 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100"
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? "Ticket code copied" : "Copy ticket code"}
              </button>
              {copyError && <p className="mt-2 text-center text-xs text-red-600" role="alert">{copyError}</p>}
            </div>
          ) : (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              The QR code is available only after your registration is confirmed and the ticket remains active.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
