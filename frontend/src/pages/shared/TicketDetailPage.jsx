import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import QRCode from "react-qr-code";
import { ArrowLeft, Check, Copy, ImageOff, Loader2, MapPin, Ticket } from "lucide-react";
import eventApi from "../../services/api/events/eventApi";
import clubApi from "../../services/api/clubs/clubApi";
import { getServerOrigin } from "../../services/api/axiosClient";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";

const getImageUrl = (url) => {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) return url;
  return getServerOrigin() + url;
};

function formatDateTime(value) {
  if (!value) return { time: "Chưa xác định", date: "" };
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { time: value, date: "" };
  return {
    time: date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
    date: date.toLocaleDateString("vi-VN", { weekday: "long", day: "numeric", month: "long", year: "numeric" }),
  };
}

const REGISTRATION_STATUS_LABEL = {
  PENDING: "Chờ duyệt vé",
  PENDING_APPROVAL: "Chờ duyệt vé",
  REGISTERED: "Đã đăng ký",
  CONFIRMED: "Đã xác nhận",
  CANCELLED: "Đã hủy",
};

function translateRegistrationStatus(status) {
  if (!status) return "Đã đăng ký";
  return REGISTRATION_STATUS_LABEL[status] ?? status;
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

export default function TicketDetailPage() {
  const { registrationId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();

  const ticketsBasePath = { CLUB_LEADER: "/club-leader/tickets", VICE_LEADER: "/vice-leader/tickets" }[user?.role] || "/member/tickets";

  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("BANK_TRANSFER");
  const [paying, setPaying] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [actionError, setActionError] = useState("");
  const [copied, setCopied] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setNotFound(false);
      try {
        const [regRes, clubRes] = await Promise.all([
          eventApi.getMyRegistrationDetails(),
          clubApi.getAll(),
        ]);
        if (cancelled) return;
        const regs = Array.isArray(regRes) ? regRes : (regRes?.data ?? []);
        const clubs = Array.isArray(clubRes) ? clubRes : (clubRes?.data ?? clubRes?.content ?? []);
        const found = regs.find((item) => String(item.registrationId) === String(registrationId));
        if (!found) {
          setNotFound(true);
          return;
        }
        const club = clubs.find((c) => c.clubID === found.clubId);
        setTicket({ ...found, clubName: club?.name ?? "CLB FPTU" });
      } catch (err) {
        if (err?.code === "ERR_CANCELED" || err?.name === "CanceledError") return;
        setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [registrationId]);

  useEffect(() => {
    if (!showQrModal) return;
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setShowQrModal(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [showQrModal]);

  const copyTicketCode = async () => {
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(ticket.ticketCode);
      setCopied(true);
    } catch {
      if (fallbackCopy(ticket.ticketCode)) setCopied(true);
      else toast.error("Không thể sao chép mã vé. Vui lòng thử lại.");
    }
  };

  const confirmPayment = async () => {
    setPaying(true);
    setActionError("");
    try {
      await eventApi.confirmPayment(ticket.registrationId, {
        paymentMethod,
        transactionReference: ticket.paymentReference,
      });
      window.location.reload();
    } catch (err) {
      setActionError(err?.response?.data?.message || "Không thể xác nhận thanh toán.");
    } finally {
      setPaying(false);
    }
  };

  const cancelTicket = async () => {
    if (!window.confirm(`Hủy vé của ${ticket.ticketHolderName || "người tham gia này"}? Mã QR sẽ bị thu hồi.`)) return;
    setCancelling(true);
    setActionError("");
    try {
      await eventApi.cancelRegistration(ticket.registrationId);
      toast.success("Đã hủy vé và thu hồi mã QR.");
      navigate(ticketsBasePath, { replace: true });
    } catch (err) {
      setActionError(err?.response?.data?.message || "Không thể hủy vé.");
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[360px] items-center justify-center text-gray-400">
        <Loader2 size={30} className="animate-spin" />
      </div>
    );
  }

  if (notFound || !ticket) {
    return (
      <div>
        <button onClick={() => navigate(ticketsBasePath)} className="mb-4 inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-600 hover:border-[#e6430a] hover:text-[#e6430a]">
          <ArrowLeft size={15} /> Quay lại
        </button>
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-10 text-center text-sm text-gray-400">
          Không tìm thấy vé này.
        </div>
      </div>
    );
  }

  const ticketEligible = ticket.ticketEligible === true && Boolean(ticket.ticketCode);
  const isCancelled = ticket.registrationStatus === "CANCELLED";
  const startDateTime = formatDateTime(ticket.startDate);

  return (
    <div>
      <button onClick={() => navigate(ticketsBasePath)} className="mb-4 inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-600 hover:border-[#e6430a] hover:text-[#e6430a]">
        <ArrowLeft size={15} /> Quay lại
      </button>

      <div className="relative mx-auto max-w-[800px] overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        {isCancelled && (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
            <span className="-rotate-12 rounded-lg border-4 border-red-400/70 px-6 py-2 text-2xl font-black uppercase tracking-widest text-red-400/70">
              Vé đã hủy
            </span>
          </div>
        )}

        {/* 1. Tên sự kiện */}
        <div className="px-5 pt-5">
          <p className="m-0 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#E6430A]">
            <Ticket size={13} /> {ticket.clubName}
          </p>
          <h1 className="m-0 mt-1 text-xl font-bold leading-snug text-gray-950">{ticket.eventName}</h1>
        </div>

        {/* 2. Ảnh banner */}
        <div className="mt-4 aspect-[16/7] w-full bg-gray-100">
          {ticket.bannerUrl ? (
            <img src={getImageUrl(ticket.bannerUrl)} alt={ticket.eventName} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-gray-300">
              <ImageOff size={28} />
            </div>
          )}
        </div>

        <div className="space-y-4 p-5">
          {/* 3. Thời gian (trái) + QR (phải) */}
          <div className="grid grid-cols-[1fr_auto] items-center gap-4 rounded-xl border border-gray-100 bg-gray-50 p-4">
            <div>
              <p className="m-0 text-xs font-semibold uppercase tracking-wide text-gray-400">Thời gian</p>
              <p className="m-0 mt-1 text-sm font-bold text-gray-900">Lúc {startDateTime.time}</p>
              <p className="m-0 text-sm font-bold text-gray-900">{startDateTime.date}</p>
              <p className="m-0 mt-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Trạng thái vé</p>
              <p className="m-0 mt-1 text-sm font-bold text-gray-900">{isCancelled ? "Đã hủy" : translateRegistrationStatus(ticket.registrationStatus)}</p>
            </div>
            <div className="flex flex-col items-center gap-2">
              {ticketEligible ? (
                <button
                  type="button"
                  onClick={() => setShowQrModal(true)}
                  className="cursor-pointer rounded-lg bg-white p-2 shadow-sm transition hover:shadow-md"
                  aria-label="Phóng to mã QR để quét"
                >
                  <QRCode value={ticket.ticketCode} size={104} level="M" bgColor="#FFFFFF" fgColor="#0D1B3E" />
                </button>
              ) : (
                <div className="flex h-[120px] w-[120px] items-center justify-center rounded-lg border border-dashed border-gray-300 p-2 text-center text-[11px] text-gray-400">
                  Chưa có mã QR
                </div>
              )}
              {ticketEligible && (
                <button
                  type="button"
                  onClick={copyTicketCode}
                  className="flex items-center gap-1 text-[11px] font-semibold text-gray-500 hover:text-[#E6430A]"
                >
                  {copied ? <Check size={12} /> : <Copy size={12} />}
                  {copied ? "Đã sao chép" : "Sao chép mã"}
                </button>
              )}
            </div>
          </div>

          {/* 4. Nơi tổ chức */}
          <div className="flex items-start gap-2.5 rounded-xl border border-gray-100 p-4">
            <MapPin size={16} className="mt-0.5 shrink-0 text-gray-400" />
            <div>
              <p className="m-0 text-xs font-semibold uppercase tracking-wide text-gray-400">Nơi tổ chức</p>
              {ticket.venueName && (
                <p className="m-0 mt-1 text-sm font-bold text-gray-900">{ticket.venueName}</p>
              )}
              <p className="m-0 mt-0.5 text-sm font-medium text-gray-600">{ticket.location ?? "Chưa xác định"}</p>
            </div>
          </div>

          {/* 5. Thông tin người mua */}
          <div className="rounded-xl border border-gray-100 p-4">
            <p className="m-0 mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Thông tin người tham gia</p>
            <dl className="grid grid-cols-[90px_1fr] gap-y-1.5 text-sm">
              <dt className="text-gray-400">Họ tên</dt>
              <dd className="m-0 font-medium text-gray-900">{ticket.ticketHolderName ?? "Chưa có"}</dd>
              <dt className="text-gray-400">Email</dt>
              <dd className="m-0 break-all font-medium text-gray-900">{ticket.ticketHolderEmail ?? "Chưa có"}</dd>
              {ticket.ticketHolderPhone && (<>
                <dt className="text-gray-400">SĐT</dt>
                <dd className="m-0 font-medium text-gray-900">{ticket.ticketHolderPhone}</dd>
              </>)}
            </dl>
          </div>

          {ticket.paymentStatus === "PENDING" && (
            <div className="rounded-xl border border-orange-200 bg-orange-50 p-4">
              <p className="m-0 mb-1 font-bold text-orange-800">Thanh toán đang chờ</p>
              <p className="m-0 mb-2 text-sm text-orange-700">{Number(ticket.amountDue || 0).toLocaleString("vi-VN")} {ticket.paymentCurrency || "VND"}</p>
              <p className="m-0 mb-3 break-all text-xs text-gray-600">Mã đối chiếu: {ticket.paymentReference}</p>
              <select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)} className="mb-2 w-full rounded-lg border border-orange-200 bg-white p-2 text-sm">
                <option value="BANK_TRANSFER">Chuyển khoản ngân hàng</option>
                <option value="VNPAY">VNPay</option>
                <option value="MOMO">MoMo</option>
              </select>
              <button type="button" onClick={confirmPayment} disabled={paying} className="w-full rounded-lg border-0 bg-orange-600 px-3 py-2 text-sm font-bold text-white disabled:opacity-50">
                {paying ? "Đang xác nhận..." : "Xác nhận thanh toán"}
              </button>
            </div>
          )}

          {actionError && <p className="m-0 text-xs text-red-600">{actionError}</p>}

          {!isCancelled && (
            <button
              type="button"
              onClick={cancelTicket}
              disabled={cancelling || paying}
              className="w-full rounded-lg border border-red-300 bg-white px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              {cancelling ? "Đang hủy vé..." : "Hủy vé này"}
            </button>
          )}
        </div>
      </div>

      {showQrModal && ticketEligible && (
        <div
          role="presentation"
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-950/60 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setShowQrModal(false);
          }}
        >
          <div role="dialog" aria-modal="true" className="w-full max-w-xs rounded-2xl bg-white p-6 text-center shadow-2xl">
            <p className="m-0 mb-4 text-sm font-semibold text-gray-600">Đưa mã này cho ban tổ chức để quét</p>
            <div className="mx-auto w-fit rounded-xl border border-gray-100 bg-white p-3 shadow-sm">
              <QRCode value={ticket.ticketCode} size={240} level="M" bgColor="#FFFFFF" fgColor="#0D1B3E" />
            </div>
            <button
              type="button"
              onClick={() => setShowQrModal(false)}
              className="mt-5 w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50"
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
