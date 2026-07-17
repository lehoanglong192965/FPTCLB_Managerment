import { useEffect, useRef, useState } from "react";
import {
  Bot,
  ChevronDown,
  Info,
  LogIn,
  RefreshCw,
  Send,
  Sparkles,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import axiosClient, {
  TokenService,
} from "../../services/api/axiosClient";

const SUGGESTED_QUESTIONS = [
  "Quy trình tổ chức sự kiện là gì?",
  "CLB cần nộp báo cáo khi nào?",
  "Cách tham gia CLB?",
  "KPI CLB được tính như thế nào?",
];

let messageSequence = 0;

function createId() {
  messageSequence += 1;
  return `ai-chat-${Date.now()}-${messageSequence}`;
}

function buildHistory(messages) {
  return messages
    .filter((message) => !message.localOnly)
    .filter((message) => message.completedTurn)
    .filter(
      (message) =>
        message.status === "success" || message.status === "fallback",
    )
    .filter(
      (message) =>
        message.role === "user" ||
        message.role === "assistant" ||
        message.role === "bot",
    )
    .filter((message) => message.text?.trim())
    .map((message) => ({
      role: message.role === "user" ? "user" : "assistant",
      content: message.text.trim(),
    }))
    .slice(-10);
}

function getErrorDisplay(error) {
  const status = error?.response?.status;

  if (status === 401) {
    return {
      text: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để sử dụng Trợ lý AI.",
      canRetry: false,
      showLogin: true,
    };
  }

  if (status === 403) {
    return {
      text: "Bạn không có quyền sử dụng trợ lý AI ở khu vực này.",
      canRetry: false,
      showLogin: false,
    };
  }

  if (status === 429) {
    return {
      text: "Bạn đang hỏi quá nhanh. Vui lòng thử lại sau khoảng 1 phút.",
      canRetry: false,
      showLogin: false,
    };
  }

  return {
    text: "Trợ lý AI đang gặp sự cố kết nối. Vui lòng thử lại.",
    canRetry: true,
    showLogin: false,
  };
}

function renderInline(text, baseKey = 0) {
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g;
  const parts = [];
  let lastIndex = 0;
  let match;
  let key = baseKey;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    if (match[2]) {
      parts.push(<strong key={key++}>{match[2]}</strong>);
    } else if (match[3]) {
      parts.push(<em key={key++}>{match[3]}</em>);
    } else if (match[4]) {
      parts.push(
        <code
          key={key++}
          className="rounded bg-gray-100 px-1 py-0 font-mono text-[12.5px] text-[#E6430A]"
        >
          {match[4]}
        </code>,
      );
    }
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  return parts.length ? parts : [text];
}

function MarkdownBlock({ text }) {
  const safeText = typeof text === "string" ? text : "";
  const lines = safeText.split("\n");
  const nodes = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];

    if (line.trimStart().startsWith("```")) {
      const codeLines = [];
      index += 1;
      while (
        index < lines.length &&
        !lines[index].trimStart().startsWith("```")
      ) {
        codeLines.push(lines[index]);
        index += 1;
      }
      nodes.push(
        <pre
          key={`code-${index}`}
          className="m-0 overflow-x-auto rounded-lg bg-[#1e1e2d] px-3.5 py-2.5"
        >
          <code className="whitespace-pre font-mono text-[12.5px] text-slate-200">
            {codeLines.join("\n")}
          </code>
        </pre>,
      );
    } else if (line.startsWith("## ")) {
      nodes.push(
        <p key={index} className="m-0 text-[14px] font-bold text-gray-900">
          {renderInline(line.slice(3), index * 100)}
        </p>,
      );
    } else if (line.startsWith("### ")) {
      nodes.push(
        <p
          key={index}
          className="m-0 border-b border-gray-100 pb-1 text-[13.5px] font-semibold text-gray-700"
        >
          {renderInline(line.slice(4), index * 100)}
        </p>,
      );
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      const items = [];
      while (
        index < lines.length &&
        (lines[index].startsWith("- ") || lines[index].startsWith("* "))
      ) {
        items.push(
          <li key={index}>
            {renderInline(lines[index].slice(2), index * 100)}
          </li>,
        );
        index += 1;
      }
      nodes.push(
        <ul
          key={`list-${index}`}
          className="m-0 flex flex-col gap-0.5 pl-[18px] [&_li]:text-[13.5px] [&_li]:leading-[1.55] [&_li]:text-gray-900"
        >
          {items}
        </ul>,
      );
      continue;
    } else if (/^\d+\.\s/.test(line)) {
      const items = [];
      while (index < lines.length && /^\d+\.\s/.test(lines[index])) {
        items.push(
          <li key={index}>
            {renderInline(
              lines[index].replace(/^\d+\.\s/, ""),
              index * 100,
            )}
          </li>,
        );
        index += 1;
      }
      nodes.push(
        <ol
          key={`ordered-list-${index}`}
          className="m-0 flex flex-col gap-0.5 pl-[18px] [&_li]:text-[13.5px] [&_li]:leading-[1.55] [&_li]:text-gray-900"
        >
          {items}
        </ol>,
      );
      continue;
    } else if (line.startsWith("> ")) {
      nodes.push(
        <blockquote
          key={index}
          className="m-0 rounded-r-md border-l-[3px] border-[#E6430A] bg-[#FFF8F5] px-3 py-1.5 text-[13px] italic text-gray-700"
        >
          {renderInline(line.slice(2), index * 100)}
        </blockquote>,
      );
    } else if (line.trim() !== "") {
      nodes.push(
        <p
          key={index}
          className="m-0 text-[13.5px] leading-[1.6] text-gray-900"
        >
          {renderInline(line, index * 100)}
        </p>,
      );
    }

    index += 1;
  }

  return <div className="flex flex-col gap-1.5">{nodes}</div>;
}

function TypingDots() {
  return (
    <div className="rounded-[4px_14px_14px_14px] border border-gray-200 bg-white px-3 py-2.5 shadow-sm">
      <div className="flex items-center gap-1 px-0.5 py-1.5">
        <span className="ai-typing-dot block h-1.5 w-1.5 rounded-full bg-gray-300 animate-[typingBounce_1.2s_infinite_ease-in-out] motion-reduce:animate-none" />
        <span className="ai-typing-dot block h-1.5 w-1.5 rounded-full bg-gray-300 animate-[typingBounce_1.2s_infinite_ease-in-out_150ms] motion-reduce:animate-none" />
        <span className="ai-typing-dot block h-1.5 w-1.5 rounded-full bg-gray-300 animate-[typingBounce_1.2s_infinite_ease-in-out_300ms] motion-reduce:animate-none" />
      </div>
    </div>
  );
}

export default function AiChat() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: "ai-chat-welcome",
      turnId: null,
      role: "assistant",
      text: "Xin chào! Tôi là **Trợ lý AI FPTU Clubs**.\n\nTôi có thể giúp bạn tra cứu thông tin trong Kho Tri Thức về *câu lạc bộ*, *sự kiện*, *KPI* và *quy trình* hoạt động.",
      citations: [],
      status: "local",
      localOnly: true,
      completedTurn: false,
      retryText: null,
      createdAt: "local-welcome",
    },
  ]);

  const bottomRef = useRef(null);
  const textareaRef = useRef(null);
  const requestPendingRef = useRef(false);
  const isGuest = !TokenService.getAccess();
  const hasConversation = messages.some((message) => !message.localOnly);

  useEffect(() => {
    if (!open) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    bottomRef.current?.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
    });
    textareaRef.current?.focus();
  }, [messages, open]);

  const completeTurn = ({ turnId, assistantMessageId, response }) => {
    const responseStatus =
      response.status === "Fallback" ? "fallback" : "success";
    const citations = Array.isArray(response.citations)
      ? response.citations
      : [];

    setMessages((currentMessages) =>
      currentMessages.map((message) => {
        if (message.turnId !== turnId) return message;

        if (message.id === assistantMessageId) {
          return {
            ...message,
            text: response.answer,
            citations,
            status: responseStatus,
            completedTurn: true,
            retryText: null,
            canRetry: false,
            showLogin: false,
          };
        }

        return {
          ...message,
          status: responseStatus,
          completedTurn: true,
        };
      }),
    );
  };

  const failTurn = ({ turnId, assistantMessageId, text, error }) => {
    const errorDisplay = getErrorDisplay(error);

    setMessages((currentMessages) =>
      currentMessages.map((message) => {
        if (message.turnId !== turnId) return message;

        if (message.id === assistantMessageId) {
          return {
            ...message,
            text: errorDisplay.text,
            citations: [],
            status: "error",
            completedTurn: false,
            retryText: text,
            canRetry: errorDisplay.canRetry,
            showLogin: errorDisplay.showLogin,
          };
        }

        return {
          ...message,
          status: "error",
          completedTurn: false,
        };
      }),
    );
  };

  const requestTurn = async ({
    turnId,
    assistantMessageId,
    text,
    history,
  }) => {
    try {
      // Lớp giao diện (Frontend) xử lý gửi câu hỏi cho AI Chatbot.
      // Đầu vào: Câu hỏi văn bản của người dùng (text) và bộ nhớ ngữ cảnh (history - tối đa 5 lượt hội thoại gần nhất).
      // Đầu ra: Gọi API POST đến /v1/ai/chat, nhận về phản hồi của AI kèm theo danh sách tài liệu tham khảo (citations) và hiển thị lên giao diện.
      const response = await axiosClient.post("/v1/ai/chat", {
        message: text,
        history,
      });

      if (typeof response?.answer !== "string" || !response.answer.trim()) {
        throw new Error("AI_CHAT_EMPTY_RESPONSE");
      }

      completeTurn({ turnId, assistantMessageId, response });
    } catch (error) {
      failTurn({ turnId, assistantMessageId, text, error });
    } finally {
      requestPendingRef.current = false;
      setLoading(false);
    }
  };

  const sendMessage = async (rawText) => {
    const text = typeof rawText === "string" ? rawText.trim() : "";
    if (!text || loading || requestPendingRef.current) return;
    if (!TokenService.getAccess()) return;

    const history = buildHistory(messages);
    const turnId = createId();
    const userMessageId = createId();
    const assistantMessageId = createId();

    requestPendingRef.current = true;
    setLoading(true);
    setMessages((currentMessages) => [
      ...currentMessages,
      {
        id: userMessageId,
        turnId,
        role: "user",
        text,
        citations: [],
        status: "pending",
        localOnly: false,
        completedTurn: false,
        retryText: null,
        createdAt: userMessageId,
      },
      {
        id: assistantMessageId,
        turnId,
        role: "assistant",
        text: "",
        citations: [],
        status: "pending",
        localOnly: false,
        completedTurn: false,
        retryText: null,
        createdAt: assistantMessageId,
      },
    ]);
    setInput("");

    await requestTurn({ turnId, assistantMessageId, text, history });
  };

  const retryTurn = async (message) => {
    const text = message.retryText?.trim();
    if (!text || loading || requestPendingRef.current) return;
    if (!TokenService.getAccess()) return;

    const history = buildHistory(messages);

    requestPendingRef.current = true;
    setLoading(true);
    setMessages((currentMessages) =>
      currentMessages.map((currentMessage) => {
        if (currentMessage.turnId !== message.turnId) return currentMessage;

        if (currentMessage.id === message.id) {
          return {
            ...currentMessage,
            text: "",
            citations: [],
            status: "pending",
            completedTurn: false,
            canRetry: false,
            showLogin: false,
          };
        }

        return {
          ...currentMessage,
          status: "pending",
          completedTurn: false,
        };
      }),
    );

    await requestTurn({
      turnId: message.turnId,
      assistantMessageId: message.id,
      text,
      history,
    });
  };

  const onKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage(input);
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
        @media (prefers-reduced-motion: reduce) {
          .ai-panel-animate, .ai-typing-dot { animation: none; }
        }
      `}</style>

      <button
        className={`fixed bottom-4 right-3 z-[1000] flex h-[54px] w-[54px] cursor-pointer items-center justify-center rounded-full border-none text-white transition-[transform,box-shadow] duration-200 motion-reduce:transition-none sm:bottom-7 sm:right-7 ${
          open
            ? "bg-gray-600 shadow-[0_4px_16px_rgba(0,0,0,0.2)]"
            : "bg-gradient-to-br from-[#F37021] to-[#E6430A] shadow-[0_4px_20px_rgba(230,67,10,0.45)] hover:scale-[1.08] hover:shadow-[0_6px_28px_rgba(230,67,10,0.55)] motion-reduce:hover:scale-100"
        }`}
        onClick={() => setOpen((currentOpen) => !currentOpen)}
        aria-label={open ? "Đóng Trợ lý AI" : "Mở Trợ lý AI"}
      >
        {open ? <ChevronDown size={22} /> : <Bot size={22} />}
      </button>

      {open ? (
        <div
          className="ai-panel-animate fixed bottom-[84px] left-3 right-3 z-[999] flex h-[min(600px,calc(100dvh-108px))] w-auto flex-col overflow-hidden rounded-[20px] bg-white shadow-[0_8px_40px_rgba(0,0,0,0.14)] motion-reduce:animate-none sm:bottom-[94px] sm:left-auto sm:right-7 sm:w-[400px]"
          role="dialog"
          aria-label="Trợ lý AI Kho Tri Thức"
        >
          <div className="flex flex-shrink-0 items-center justify-between bg-gradient-to-br from-[#F37021] to-[#E6430A] px-4 py-3.5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 text-white">
                <Sparkles size={15} />
              </div>
              <div>
                <p className="m-0 text-[14px] font-bold leading-[1.3] text-white">
                  Trợ lý AI
                </p>
                <div className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-green-400" />
                  <p className="m-0 text-[11px] text-white/70">
                    FPTU Clubs Knowledge Assistant
                  </p>
                </div>
              </div>
            </div>
            <button
              className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border-none bg-white/15 text-white transition-colors hover:bg-white/28 motion-reduce:transition-none"
              onClick={() => setOpen(false)}
              aria-label="Đóng Trợ lý AI"
            >
              <X size={16} />
            </button>
          </div>

          <div
            className="ai-messages flex flex-1 flex-col gap-4 overflow-y-auto bg-[#FAFAFA] px-3.5 py-4"
            aria-live="polite"
          >
            {messages.map((message) => {
              const isUser = message.role === "user";
              const isFallback = message.status === "fallback";
              const isError = message.status === "error";

              return (
                <div
                  key={message.id}
                  className={`flex items-start gap-2 ${
                    isUser ? "flex-row-reverse" : ""
                  }`}
                >
                  {!isUser ? (
                    <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#F37021] to-[#E6430A] text-[10px] font-bold text-white">
                      AI
                    </div>
                  ) : null}
                  <div
                    className={`flex max-w-[84%] flex-col gap-1.5 ${
                      isUser ? "items-end" : ""
                    }`}
                  >
                    {message.status === "pending" && !isUser ? (
                      <TypingDots />
                    ) : (
                      <div
                        className={`px-3 py-2.5 text-[13.5px] leading-[1.55] ${
                          isUser
                            ? "rounded-[14px_4px_14px_14px] bg-gradient-to-br from-[#F37021] to-[#E6430A] text-white"
                            : isFallback
                              ? "rounded-[4px_14px_14px_14px] border border-amber-200 bg-amber-50 shadow-sm"
                              : isError
                                ? "rounded-[4px_14px_14px_14px] border border-red-200 bg-red-50 shadow-sm"
                                : "rounded-[4px_14px_14px_14px] border border-gray-200 bg-white shadow-sm"
                        }`}
                      >
                        {isFallback && message.citations?.length > 0 ? (
                          <div className="mb-1.5 flex items-center gap-1 text-[11px] font-semibold text-amber-700">
                            <Info size={13} />
                            Thông tin tham khảo
                          </div>
                        ) : null}
                        {isUser ? (
                          <p className="m-0 text-[13.5px] leading-[1.6] text-white">
                            {message.text}
                          </p>
                        ) : (
                          <MarkdownBlock text={message.text} />
                        )}
                      </div>
                    )}

                    {message.citations?.length > 0 ? (
                      <div className="flex flex-wrap items-center gap-1 pl-0.5">
                        <span className="flex-shrink-0 text-[11px] text-gray-400">
                          Nguồn:
                        </span>
                        {message.citations.map((citation, citationIndex) => {
                          const title =
                            citation.title?.trim() ||
                            `Tài liệu #${citation.archiveId}`;
                          return (
                            <span
                              key={`${citation.archiveId}-${citation.chunkIndex}-${citationIndex}`}
                              className="inline-flex items-center gap-1 rounded-full border border-[#FFD0BB] bg-[#FFF3EE] px-2 py-0.5 text-[11px] font-medium text-[#E6430A]"
                            >
                              {title} · chunk #{citation.chunkIndex}
                            </span>
                          );
                        })}
                      </div>
                    ) : null}

                    {message.canRetry ? (
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 self-start rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-[12px] font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none"
                        onClick={() => retryTurn(message)}
                        disabled={loading}
                      >
                        <RefreshCw size={13} />
                        Thử lại
                      </button>
                    ) : null}

                    {message.showLogin ? (
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 self-start rounded-lg bg-[#E6430A] px-2.5 py-1.5 text-[12px] font-semibold text-white"
                        onClick={() => navigate("/login")}
                      >
                        <LogIn size={13} />
                        Đăng nhập lại
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })}

            {!hasConversation ? (
              <div className="flex flex-wrap gap-2 pl-9">
                {SUGGESTED_QUESTIONS.map((question) => (
                  <button
                    key={question}
                    type="button"
                    className="rounded-full border border-orange-200 bg-white px-2.5 py-1.5 text-left text-[11.5px] text-[#C43C0A] transition-colors hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none"
                    onClick={() => sendMessage(question)}
                    disabled={loading}
                  >
                    {question}
                  </button>
                ))}
              </div>
            ) : null}

            {isGuest ? (
              <div className="ml-9 rounded-xl border border-orange-200 bg-orange-50 p-3 text-[12.5px] text-gray-700">
                <p className="m-0 leading-[1.5]">
                  Bạn cần đăng nhập để sử dụng Trợ lý AI Kho Tri Thức.
                </p>
                <button
                  type="button"
                  className="mt-2 inline-flex items-center gap-1 rounded-lg bg-[#E6430A] px-2.5 py-1.5 text-[12px] font-semibold text-white"
                  onClick={() => navigate("/login")}
                >
                  <LogIn size={13} />
                  Đăng nhập để hỏi AI
                </button>
              </div>
            ) : null}

            <div ref={bottomRef} />
          </div>

          <div className="flex flex-shrink-0 items-end gap-2 border-t border-[#F0F0F0] bg-white px-3 py-2.5">
            <textarea
              ref={textareaRef}
              className="ai-textarea max-h-[100px] flex-1 resize-none overflow-y-auto rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 font-[inherit] text-[13.5px] leading-[1.5] text-gray-900 outline-none transition-[border-color,background] duration-150 disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none"
              placeholder="Hỏi bất cứ điều gì... (Enter để gửi)"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={onKeyDown}
              rows={1}
              disabled={loading}
            />
            <button
              className="flex h-9 w-9 flex-shrink-0 cursor-pointer items-center justify-center rounded-[10px] border-none bg-gradient-to-br from-[#F37021] to-[#E6430A] text-white transition-[opacity,transform] duration-150 hover:enabled:scale-[1.06] hover:enabled:opacity-90 disabled:cursor-not-allowed disabled:opacity-35 motion-reduce:transition-none motion-reduce:hover:scale-100"
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || loading}
              aria-label="Gửi câu hỏi"
            >
              <Send size={15} />
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
