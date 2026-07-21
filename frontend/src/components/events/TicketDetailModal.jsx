import { useEffect, useState } from "react";
import QRCode from "react-qr-code";
import { Check, Copy, Ticket, X } from "lucide-react";
import eventApi from "../../services/api/events/eventApi";

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
  let copied;
  try {
    copied = document.execCommand("copy");
  } finally {
    document.body.removeChild(input);
  }
  return copied;
}

export default function TicketDetailModal({ ticket, onClose }) {
  const [paymentMethod, setPaymentMethod] = useState("BANK_TRANSFER");
  const [paying, setPaying] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState("");
  const [cancelling, setCancelling] = useState(false);
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

  const confirmPayment = async () => {
    setPaying(true);
    setPaymentError("");
    try {
      await eventApi.confirmPayment(ticket.registrationId, {
        paymentMethod,
        transactionReference: ticket.paymentReference,
      });
      window.location.reload();
    } catch (error) {
      setPaymentError(error?.response?.data?.message || "Không thể xác nhận thanh toán.");
    } finally {
      setPaying(false);
    }
  };

  const cancelTicket = async () => {
    if (!window.confirm(`Hủy vé của ${ticket.ticketHolderName || 'người tham gia này'}? Mã QR sẽ bị thu hồi.`)) return;
    setCancelling(true);
    setPaymentError("");
    try {
      await eventApi.cancelRegistration(ticket.registrationId);
      window.location.reload();
    } catch (error) {
      setPaymentError(error?.response?.data?.message || "Không thể hủy vé.");
    } finally {
      setCancelling(false);
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
            {ticket.ticketHolderName && <>
              <dt className="text-slate-500">Chủ vé</dt>
              <dd className="font-medium text-slate-800">{ticket.ticketHolderName}</dd>
            </>}
            {ticket.ticketHolderEmail && <>
              <dt className="text-slate-500">Email</dt>
              <dd className="break-all font-medium text-slate-800">{ticket.ticketHolderEmail}</dd>
            </>}
          </dl>

          {ticket.paymentStatus === "PENDING" && (
            <div className="mb-4 rounded-xl border border-orange-200 bg-orange-50 p-4">
              <p className="mb-1 font-bold text-orange-800">Thanh toán đang chờ</p>
              <p className="mb-2 text-sm text-orange-700">{Number(ticket.amountDue || 0).toLocaleString("vi-VN")} {ticket.paymentCurrency || "VND"}</p>
              <p className="mb-3 break-all text-xs text-slate-600">Mã đối chiếu: {ticket.paymentReference}</p>
              <select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)} className="mb-2 w-full rounded-lg border border-orange-200 bg-white p-2 text-sm">
                <option value="BANK_TRANSFER">Chuyển khoản ngân hàng</option>
                <option value="VNPAY">VNPay</option>
                <option value="MOMO">MoMo</option>
              </select>
              {paymentError && <p className="mb-2 text-xs text-red-600">{paymentError}</p>}
              <button type="button" onClick={confirmPayment} disabled={paying} className="w-full rounded-lg border-0 bg-orange-600 px-3 py-2 text-sm font-bold text-white disabled:opacity-50">
                {paying ? "Đang xác nhận..." : "Xác nhận thanh toán"}
              </button>
            </div>
          )}

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
          {ticket.registrationStatus !== "CANCELLED" && (
            <button type="button" onClick={cancelTicket} disabled={cancelling || paying} className="w-full rounded-lg border border-red-300 bg-white px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50">
              {cancelling ? 'Đang hủy vé...' : 'Hủy vé này'}
            </button>
          )}
          {paymentError && ticket.paymentStatus !== "PENDING" && <p className="text-xs text-red-600">{paymentError}</p>}
        </div>
      </section>
    </div>
  );
}
