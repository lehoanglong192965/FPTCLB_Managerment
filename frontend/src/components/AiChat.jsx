import { useState, useRef, useEffect } from "react";
import { Bot, X, Send, ChevronDown, Sparkles } from "lucide-react";
import "../assets/css/aiChat.css";

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
    else if (match[4]) parts.push(<code key={k++} className="ai-icode">{match[4]}</code>);
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
        <pre key={`cb${i}`} className="ai-codeblock">
          <code>{codeLines.join("\n")}</code>
        </pre>
      );
    } else if (line.startsWith("## ")) {
      nodes.push(<p key={i} className="ai-h2">{renderInline(line.slice(3), i * 100)}</p>);
    } else if (line.startsWith("### ")) {
      nodes.push(<p key={i} className="ai-h3">{renderInline(line.slice(4), i * 100)}</p>);
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      const items = [];
      while (i < lines.length && (lines[i].startsWith("- ") || lines[i].startsWith("* "))) {
        items.push(<li key={i}>{renderInline(lines[i].slice(2), i * 100)}</li>);
        i++;
      }
      nodes.push(<ul key={`ul${i}`} className="ai-ul">{items}</ul>);
      continue;
    } else if (/^\d+\.\s/.test(line)) {
      const items = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(<li key={i}>{renderInline(lines[i].replace(/^\d+\.\s/, ""), i * 100)}</li>);
        i++;
      }
      nodes.push(<ol key={`ol${i}`} className="ai-ol">{items}</ol>);
      continue;
    } else if (line.startsWith("> ")) {
      nodes.push(
        <blockquote key={i} className="ai-quote">
          {renderInline(line.slice(2), i * 100)}
        </blockquote>
      );
    } else if (line.trim() !== "") {
      nodes.push(<p key={i} className="ai-p">{renderInline(line, i * 100)}</p>);
    }

    i++;
  }

  return <div className="ai-markdown">{nodes}</div>;
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
    <div className="ai-bubble ai-bubble-bot">
      <div className="ai-typing">
        <span /><span /><span />
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
      {/* Floating button */}
      <button
        className={`ai-fab${open ? " ai-fab-open" : ""}`}
        onClick={() => setOpen((v) => !v)}
        aria-label="Trợ lý AI"
      >
        {open ? <ChevronDown size={22} /> : <Bot size={22} />}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="ai-panel">
          {/* Header */}
          <div className="ai-panel-header">
            <div className="ai-header-left">
              <div className="ai-header-icon">
                <Sparkles size={15} />
              </div>
              <div>
                <p className="ai-header-title">Trợ lý AI</p>
                <div className="ai-status-row">
                  <span className="ai-status-dot" />
                  <p className="ai-header-sub">FPTU Clubs Assistant</p>
                </div>
              </div>
            </div>
            <button className="ai-close-btn" onClick={() => setOpen(false)}>
              <X size={16} />
            </button>
          </div>

          {/* Messages */}
          <div className="ai-messages">
            {messages.map((msg) => (
              <div key={msg.id} className={`ai-msg-row ai-msg-${msg.role}`}>
                {msg.role === "bot" && <div className="ai-bot-avatar">AI</div>}
                <div className="ai-msg-content">
                  <div className={`ai-bubble ai-bubble-${msg.role}`}>
                    {msg.role === "bot"
                      ? <MarkdownBlock text={msg.text} />
                      : <p className="ai-p">{msg.text}</p>
                    }
                  </div>
                  {msg.citations?.length > 0 && (
                    <div className="ai-citations">
                      <span className="ai-cite-label">Nguồn:</span>
                      {msg.citations.map((c, i) => (
                        <a key={i} href={c.url} className="ai-cite-chip" target="_blank" rel="noreferrer">
                          {c.title}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {typing && (
              <div className="ai-msg-row ai-msg-bot">
                <div className="ai-bot-avatar">AI</div>
                <TypingDots />
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="ai-input-area">
            <textarea
              ref={textareaRef}
              className="ai-textarea"
              placeholder="Hỏi bất cứ điều gì... (Enter để gửi)"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKey}
              rows={1}
              disabled={typing}
            />
            <button
              className="ai-send-btn"
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
