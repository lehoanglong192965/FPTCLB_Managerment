import { useState, useRef, useEffect } from "react";
import { Bot, X, Send, ChevronDown, Sparkles } from "lucide-react";

/* ── Inline markdown parser ──────────────────────────────── */
function renderInline(text, baseKey = 0) {
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g;
  const parts = [];
  let lastIndex = 0;
  let match;
  let k = baseKey;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
    if (match[2])      parts.push(<strong key={k++}>{match[2]}</strong>);
    else if (match[3]) parts.push(<em key={k++}>{match[3]}</em>);
    else if (match[4]) parts.push(<code key={k++} className="bg-gray-100 rounded px-1 py-0 text-[12.5px] font-mono text-[#E6430A]">{match[4]}</code>);
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts.length ? parts : [text];
}

function MarkdownBlock({ text }) {
  const lines = text.split("\n");
  const nodes = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.trimStart().startsWith("```")) {
      const codeLines = [];
      i++;
      while (i < lines.length && !lines[i].trimStart().startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      nodes.push(
        <pre key={`cb${i}`} className="bg-[#1e1e2d] rounded-lg px-3.5 py-2.5 overflow-x-auto m-0">
          <code className="text-[12.5px] font-mono text-slate-200 whitespace-pre">{codeLines.join("\n")}</code>
        </pre>
      );
    } else if (line.startsWith("## ")) {
      nodes.push(<p key={i} className="m-0 text-[14px] font-bold text-gray-900">{renderInline(line.slice(3), i * 100)}</p>);
    } else if (line.startsWith("### ")) {
      nodes.push(<p key={i} className="m-0 text-[13.5px] font-semibold text-gray-700 border-b border-gray-100 pb-1">{renderInline(line.slice(4), i * 100)}</p>);
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      const items = [];
      while (i < lines.length && (lines[i].startsWith("- ") || lines[i].startsWith("* "))) {
        items.push(<li key={i}>{renderInline(lines[i].slice(2), i * 100)}</li>);
        i++;
      }
      nodes.push(<ul key={`ul${i}`} className="m-0 pl-[18px] flex flex-col gap-0.5 [&_li]:text-[13.5px] [&_li]:text-gray-900 [&_li]:leading-[1.55]">{items}</ul>);
      continue;
    } else if (/^\d+\.\s/.test(line)) {
      const items = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(<li key={i}>{renderInline(lines[i].replace(/^\d+\.\s/, ""), i * 100)}</li>);
        i++;
      }
      nodes.push(<ol key={`ol${i}`} className="m-0 pl-[18px] flex flex-col gap-0.5 [&_li]:text-[13.5px] [&_li]:text-gray-900 [&_li]:leading-[1.55]">{items}</ol>);
      continue;
    } else if (line.startsWith("> ")) {
      nodes.push(
        <blockquote key={i} className="m-0 px-3 py-1.5 border-l-[3px] border-[#E6430A] bg-[#FFF8F5] rounded-r-md text-[13px] text-gray-700 italic">
          {renderInline(line.slice(2), i * 100)}
        </blockquote>
      );
    } else if (line.trim() !== "") {
      nodes.push(<p key={i} className="m-0 text-[13.5px] leading-[1.6] text-gray-900">{renderInline(line, i * 100)}</p>);
    }

    i++;
  }

  return <div className="flex flex-col gap-1.5">{nodes}</div>;
}

/* ── Mock AI responses ───────────────────────────────────── */
const FALLBACK = {
  text: "Tôi có thể giúp bạn tra cứu thông tin về **câu lạc bộ**, **sự kiện**, **KPI**, và **quy trình** hoạt động tại FPTU. Hãy hỏi cụ thể hơn nhé!",
  citations: [],
};

const RESPONSES = [
  {
    match: ["clb", "câu lạc bộ", "club", "danh sách clb"],
    text: `## Câu lạc bộ đang hoạt động\n\nHiện tại FPTU có **6 CLB** đang hoạt động:\n\n- **FPTU IT Club** — Công nghệ thông tin\n- **Melody Club** — Âm nhạc\n- **FPTU FC** — Bóng đá\n- **Art Club** — Mỹ thuật\n- **Debate Club** — Tranh biện\n- **Photography Club** — Nhiếp ảnh\n\nĐể tham gia, vào mục **Câu Lạc Bộ** và nhấn *Đăng ký tham gia*.`,
    citations: [
      { title: "Danh sách CLB học kỳ 2025", url: "#" },
      { title: "Quy chế hoạt động CLB", url: "#" },
    ],
  },
  {
    match: ["sự kiện", "event", "lịch", "upcoming"],
    text: `## Sự kiện sắp diễn ra\n\nCác sự kiện nổi bật trong tháng:\n\n1. **Code War 2026** — 15/07, Hall A\n2. **Acoustic Night** — 22/07, Sân FPT\n3. **IT Workshop** — 28/07, Phòng Lab\n\n> Đăng ký sự kiện trước ít nhất **3 ngày** để đảm bảo suất tham dự.`,
    citations: [
      { title: "Lịch sự kiện tháng 7/2026", url: "#" },
      { title: "Quy trình đăng ký sự kiện", url: "#" },
    ],
  },
  {
    match: ["kpi", "xếp hạng", "điểm thi đua", "ranking"],
    text: `## Chỉ số KPI CLB\n\nKPI được tính dựa trên 4 tiêu chí:\n\n- **Số thành viên hoạt động** (30%)\n- **Số sự kiện tổ chức** (25%)\n- **Tỉ lệ tham gia sự kiện** (25%)\n- **Báo cáo định kỳ đúng hạn** (20%)\n\n> CLB có dưới **5 thành viên** sẽ bị hạ trạng thái *Inactive* tự động.`,
    citations: [
      { title: "Bộ tiêu chí KPI CLB 2025", url: "#" },
    ],
  },
  {
    match: ["quy trình", "thủ tục", "quy định", "quy chế", "hướng dẫn"],
    text: `## Quy trình hoạt động CLB\n\n### Tổ chức sự kiện\n\n1. Trưởng CLB tạo đề xuất sự kiện trên hệ thống\n2. IC-PDP xem xét và phê duyệt trong **3 ngày làm việc**\n3. CLB tổ chức và nộp báo cáo sau sự kiện\n\n### Kết nạp thành viên\n\n- Thành viên đăng ký qua hệ thống\n- Trưởng CLB phê duyệt trong **5 ngày làm việc**\n- Thành viên nhận thông báo kết quả qua email`,
    citations: [
      { title: "Quy chế hoạt động CLB FPTU", url: "#" },
      { title: "Hướng dẫn tổ chức sự kiện", url: "#" },
    ],
  },
  {
    match: ["tham gia", "gia nhập", "đăng ký tham gia", "join"],
    text: `## Cách gia nhập CLB\n\nBạn làm theo các bước sau:\n\n1. Vào mục **Câu Lạc Bộ** trên thanh menu\n2. Chọn CLB muốn tham gia và xem thông tin\n3. Nhấn nút **Đăng ký tham gia**\n4. Chờ Trưởng CLB xét duyệt (tối đa 5 ngày)\n\n> Mỗi sinh viên được tham gia tối đa **2 CLB** trong cùng một học kỳ.`,
    citations: [
      { title: "Quy định tham gia CLB FPTU", url: "#" },
    ],
  },
  {
    match: ["báo cáo", "report", "nộp báo cáo"],
    text: `## Báo cáo hoạt động CLB\n\nCLB cần nộp **2 loại báo cáo**:\n\n- **Báo cáo định kỳ** — nộp vào đầu mỗi tháng, mô tả hoạt động tháng trước\n- **Báo cáo sự kiện** — nộp trong vòng **5 ngày** sau khi sự kiện kết thúc\n\nBáo cáo trễ hạn sẽ **trừ điểm KPI** của CLB.`,
    citations: [
      { title: "Mẫu báo cáo định kỳ", url: "#" },
      { title: "Hướng dẫn nộp báo cáo sự kiện", url: "#" },
    ],
  },
];

function getResponse(input) {
  const lower = input.toLowerCase();
  for (const r of RESPONSES) {
    if (r.match.some((kw) => lower.includes(kw))) return r;
  }
  return FALLBACK;
}

/* ── Typing indicator ────────────────────────────────────── */
function TypingDots() {
  return (
    <div className="px-3 py-2.5 rounded-[4px_14px_14px_14px] bg-white border border-gray-200 shadow-sm">
      <div className="flex items-center gap-1 py-1.5 px-0.5">
        <span className="w-1.5 h-1.5 rounded-full bg-gray-300 block animate-[typingBounce_1.2s_infinite_ease-in-out]" />
        <span className="w-1.5 h-1.5 rounded-full bg-gray-300 block animate-[typingBounce_1.2s_infinite_ease-in-out_150ms]" />
        <span className="w-1.5 h-1.5 rounded-full bg-gray-300 block animate-[typingBounce_1.2s_infinite_ease-in-out_300ms]" />
      </div>
    </div>
  );
}

/* ── Main component ──────────────────────────────────────── */
export default function AiChat() {
  const [open, setOpen]       = useState(false);
  const [input, setInput]     = useState("");
  const [typing, setTyping]   = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 0,
      role: "bot",
      text: "Xin chào! Tôi là **Trợ lý AI FPTU Clubs**.\n\nTôi có thể giúp bạn tra cứu thông tin về *câu lạc bộ*, *sự kiện*, *KPI* và *quy trình* hoạt động. Hãy hỏi tôi bất cứ điều gì!",
      citations: [],
    },
  ]);

  const bottomRef   = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing, open]);

  const send = () => {
    const text = input.trim();
    if (!text || typing) return;

    setMessages((p) => [...p, { id: Date.now(), role: "user", text, citations: [] }]);
    setInput("");
    setTyping(true);

    const delay = 1000 + Math.random() * 800;
    setTimeout(() => {
      const res = getResponse(text);
      setTyping(false);
      setMessages((p) => [
        ...p,
        { id: Date.now() + 1, role: "bot", text: res.text, citations: res.citations },
      ]);
    }, delay);
  };

  const onKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <>
      <style>{`
        @keyframes typingBounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.45; }
          40% { transform: translateY(-5px); opacity: 1; }
        }
        @keyframes aiPanelIn {
          from { opacity: 0; transform: translateY(18px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .ai-panel-animate { animation: aiPanelIn 0.25s cubic-bezier(0.34,1.3,0.64,1); }
        .ai-messages::-webkit-scrollbar { width: 4px; }
        .ai-messages::-webkit-scrollbar-track { background: transparent; }
        .ai-messages::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 4px; }
        .ai-textarea:focus { border-color: #F37021; background: #fff; box-shadow: 0 0 0 3px rgba(243,112,33,0.1); }
        .ai-textarea::placeholder { color: #b0b7c3; }
      `}</style>

      {/* Floating button */}
      <button
        className={`fixed bottom-7 right-7 w-[54px] h-[54px] rounded-full text-white border-none cursor-pointer flex items-center justify-center z-[1000] transition-[transform,box-shadow] duration-200 hover:scale-[1.08] ${open ? "bg-gray-600 shadow-[0_4px_16px_rgba(0,0,0,0.2)]" : "bg-gradient-to-br from-[#F37021] to-[#E6430A] shadow-[0_4px_20px_rgba(230,67,10,0.45)] hover:shadow-[0_6px_28px_rgba(230,67,10,0.55)]"}`}
        onClick={() => setOpen((v) => !v)}
        aria-label="Trợ lý AI"
      >
        {open ? <ChevronDown size={22} /> : <Bot size={22} />}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="ai-panel-animate fixed bottom-[94px] right-7 w-[380px] h-[530px] bg-white rounded-[20px] shadow-[0_8px_40px_rgba(0,0,0,0.14)] flex flex-col z-[999] overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3.5 bg-gradient-to-br from-[#F37021] to-[#E6430A] flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-white">
                <Sparkles size={15} />
              </div>
              <div>
                <p className="text-[14px] font-bold text-white m-0 leading-[1.3]">Trợ lý AI</p>
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />
                  <p className="text-[11px] text-white/70 m-0">FPTU Clubs Assistant</p>
                </div>
              </div>
            </div>
            <button
              className="w-7 h-7 rounded-md bg-white/15 border-none text-white cursor-pointer flex items-center justify-center transition-colors hover:bg-white/28"
              onClick={() => setOpen(false)}
            >
              <X size={16} />
            </button>
          </div>

          {/* Messages */}
          <div className="ai-messages flex-1 overflow-y-auto px-3.5 py-4 flex flex-col gap-4 bg-[#FAFAFA]">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex gap-2 items-start ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                {msg.role === "bot" && (
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#F37021] to-[#E6430A] text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                    AI
                  </div>
                )}
                <div className={`flex flex-col gap-1.5 max-w-[84%] ${msg.role === "user" ? "items-end" : ""}`}>
                  <div className={`px-3 py-2.5 text-[13.5px] leading-[1.55] ${msg.role === "bot" ? "bg-white border border-gray-200 rounded-[4px_14px_14px_14px] shadow-sm" : "bg-gradient-to-br from-[#F37021] to-[#E6430A] text-white rounded-[14px_4px_14px_14px]"}`}>
                    {msg.role === "bot"
                      ? <MarkdownBlock text={msg.text} />
                      : <p className="m-0 text-[13.5px] leading-[1.6] text-white">{msg.text}</p>
                    }
                  </div>
                  {msg.citations?.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1 pl-0.5">
                      <span className="text-[11px] text-gray-400 flex-shrink-0">Nguồn:</span>
                      {msg.citations.map((c, i) => (
                        <a
                          key={i}
                          href={c.url}
                          className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#FFF3EE] border border-[#FFD0BB] rounded-full text-[11px] text-[#E6430A] no-underline font-medium transition-colors hover:bg-[#FFE4D4]"
                          target="_blank"
                          rel="noreferrer"
                        >
                          {c.title}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {typing && (
              <div className="flex gap-2 items-start">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#F37021] to-[#E6430A] text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  AI
                </div>
                <TypingDots />
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-3 py-2.5 border-t border-[#F0F0F0] flex items-end gap-2 flex-shrink-0 bg-white">
            <textarea
              ref={textareaRef}
              className="ai-textarea flex-1 border border-gray-200 rounded-xl px-3 py-2 text-[13.5px] font-[inherit] text-gray-900 bg-gray-50 resize-none outline-none max-h-[100px] overflow-y-auto transition-[border-color,background] duration-150 leading-[1.5] disabled:opacity-60 disabled:cursor-not-allowed"
              placeholder="Hỏi bất cứ điều gì... (Enter để gửi)"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKey}
              rows={1}
              disabled={typing}
            />
            <button
              className="w-9 h-9 rounded-[10px] bg-gradient-to-br from-[#F37021] to-[#E6430A] border-none text-white flex items-center justify-center cursor-pointer flex-shrink-0 transition-[opacity,transform] duration-150 hover:enabled:opacity-90 hover:enabled:scale-[1.06] disabled:opacity-35 disabled:cursor-not-allowed"
              onClick={send}
              disabled={!input.trim() || typing}
              aria-label="Gửi"
            >
              <Send size={15} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
