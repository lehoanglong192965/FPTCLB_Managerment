import { useState, useEffect } from "react";
import { Ticket, Search, Loader2 } from "lucide-react";
import EventCard from "../../components/events/EventCard";
import eventApi from "../../services/api/events/eventApi";
import clubApi from "../../services/api/clubs/clubApi";
import contributionApi from "../../services/api/contribution/contributionApi";
import TicketDetailModal from "../../components/events/TicketDetailModal";

const FILTER_TABS = [
  { key: "all",        label: "Tất cả"       },
  { key: "registered", label: "Đã đăng ký"   },
  { key: "ongoing",    label: "Đang làm BTC" },
];

const isAppealWindowStatus = (status) =>
  status === "APPEAL_WINDOW" || status === "APPEAL_OPEN";

export default function MemberMyTickets() {
  const [search, setSearch]       = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [tickets, setTickets]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");
  const [selectedTicket, setSelectedTicket] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const fetchTickets = async () => {
      setError("");
      try {
        const [regRes, assignRes, clubRes] = await Promise.all([
          eventApi.getMyRegistrationDetails(),
          eventApi.getMyAssignments(),
          clubApi.getAll(),
        ]);

        const regs    = Array.isArray(regRes)    ? regRes    : (regRes.data    || []);
        const assigns = Array.isArray(assignRes) ? assignRes : (assignRes.data || []);
        const clubList = Array.isArray(clubRes)  ? clubRes   : (clubRes.data   || []);

        const mappedRegs = regs.map((registration) => {
          const e = { ...registration, eventID: registration.eventId, clubID: registration.clubId };
          const clubObj = clubList.find((c) => c.clubID === e.clubID);
          return {
            id: e.eventID,
            title: e.eventName,
            club: clubObj ? clubObj.name : "CLB FPTU",
            color: clubObj ? clubObj.color : "#E6430A",
            emoji: clubObj ? clubObj.emoji : "🎫",
            date: e.startDate ? new Date(e.startDate).toLocaleDateString("vi-VN") : "",
            time: e.startDate ? new Date(e.startDate).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) : "",
            location: e.location || "Chưa xếp phòng",
            bannerUrl: e.bannerUrl ?? null,
            ticketStatus: "registered",
            registrationId: e.registrationId,
            eventId: e.eventId,
            clubId: e.clubId,
            eventName: e.eventName,
            startDate: e.startDate,
            endDate: e.endDate,
            eventStatus: e.eventStatus,
            registrationStatus: e.registrationStatus,
            participantType: e.participantType,
            ticketCode: e.ticketCode,
            ticketIssuedAt: e.ticketIssuedAt,
            ticketEligible: e.ticketEligible === true,
            registeredAt: e.registeredAt,
          };
        });

        const mappedAssigns = assigns.map((e) => {
          const clubObj = clubList.find((c) => c.clubID === e.clubID);
          return {
            id: e.eventID,
            title: e.eventName,
            club: clubObj ? clubObj.name : "CLB FPTU",
            color: clubObj ? clubObj.color : "#2563EB",
            emoji: clubObj ? clubObj.emoji : "🛠️",
            date: e.startDate ? new Date(e.startDate).toLocaleDateString("vi-VN") : "",
            time: e.startDate ? new Date(e.startDate).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) : "",
            location: e.location || "Chưa xếp phòng",
            bannerUrl: e.bannerUrl ?? null,
            ticketStatus: "ongoing",
          };
        });

        // Gộp, ưu tiên vai trò BTC nếu trùng event
        const combined = [...mappedAssigns];
        mappedRegs.forEach((r) => {
          if (!combined.some((t) => t.id === r.id)) {
            combined.push(r);
          }
        });
        mappedRegs.forEach((registration) => {
          const assignedTicket = combined.find((ticket) => ticket.id === registration.id);
          if (assignedTicket && assignedTicket !== registration) {
            Object.assign(assignedTicket, registration, { ticketStatus: assignedTicket.ticketStatus });
          }
        });


        const appealChecks = await Promise.all(
          combined
            .filter((ticket) => ticket.ticketStatus === "ongoing")
            .map(async (ticket) => {
              try {
                const batchRes = await contributionApi.getBatch(ticket.id);
                const batch = batchRes?.data ?? batchRes;
                return [ticket.id, isAppealWindowStatus(batch?.status)];
              } catch {
                return [ticket.id, false];
              }
            })
        );
        const appealOpenIds = new Set(appealChecks.filter(([, open]) => open).map(([id]) => id));

        if (cancelled) return;
        setTickets(combined.map((ticket) => ({
          ...ticket,
          canAppealContribution: ticket.ticketStatus === "ongoing" && appealOpenIds.has(ticket.id),
        })));
      } catch (err) {
        if (cancelled || err?.code === "ERR_CANCELED" || err?.name === "CanceledError") return;
        setError(err?.response?.data?.message ?? "Không thể tải danh sách vé. Vui lòng thử lại.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchTickets();
    return () => { cancelled = true; };
  }, []);

  const filtered = tickets.filter((e) => {
    const matchSearch = e.title.toLowerCase().includes(search.toLowerCase()) ||
                        e.club.toLowerCase().includes(search.toLowerCase());
    const matchTab    = activeTab === "all" || e.ticketStatus === activeTab;
    return matchSearch && matchTab;
  });

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Vé Của Tôi</h1>
        <p className="page-subtitle">Các sự kiện bạn đã đăng ký tham gia</p>
      </div>

      <div className="content-card">
        {/* Search */}
        <div className="relative mb-4" style={{ maxWidth: 360 }}>
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            className="w-full pl-[38px] pr-3.5 py-2.5 border-[1.5px] border-gray-200 rounded-[10px] text-sm outline-none bg-gray-50 box-border font-[inherit] transition-colors focus:border-[#e6430a] focus:bg-white placeholder:text-gray-400"
            placeholder="Tìm kiếm sự kiện..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Filter tabs */}
        <div className="flex gap-0 border-b-2 border-gray-200 mb-5">
          {FILTER_TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-[18px] py-2.5 text-sm font-medium border-b-2 -mb-0.5 cursor-pointer transition-colors duration-150 font-[inherit] bg-transparent ${
                  isActive ? "text-[#e6430a] border-[#e6430a] font-semibold" : "text-gray-500 border-transparent hover:text-[#e6430a]"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="text-center py-10">
            <Loader2 className="animate-spin inline text-gray-400" size={28} />
            <p className="text-sm text-gray-400 mt-2">Đang tải vé...</p>
          </div>
        ) : (
          <>
            <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 16 }}>
              {filtered.length} vé
            </p>
            {error ? (
              <div className="page-placeholder">
                <Ticket size={48} className="page-placeholder-icon" />
                <p className="page-placeholder-label" style={{ color: "#dc2626" }}>{error}</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="page-placeholder">
                <Ticket size={48} className="page-placeholder-icon" />
                <p className="page-placeholder-label">
                  {tickets.length === 0
                    ? "Bạn chưa đăng ký sự kiện nào."
                    : "Không tìm thấy kết quả."}
                </p>
              </div>
            ) : (
              <div className="grid gap-6" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
                {filtered.map((ev) => (
                  <div key={`${ev.ticketStatus}-${ev.registrationId ?? ev.id}`} className="space-y-2">
                    <EventCard event={ev} />
                    {ev.registrationId != null && (
                      <button
                        type="button"
                        onClick={() => setSelectedTicket(ev)}
                        className="flex w-full items-center justify-center gap-2 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-sm font-semibold text-orange-700 transition hover:bg-orange-100"
                      >
                        <Ticket size={15} />
                        {ev.ticketEligible ? "Open QR ticket" : "View ticket status"}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
      {selectedTicket && (
        <TicketDetailModal ticket={selectedTicket} onClose={() => setSelectedTicket(null)} />
      )}
    </div>
  );
}
