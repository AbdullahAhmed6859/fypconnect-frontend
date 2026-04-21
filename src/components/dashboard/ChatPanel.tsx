import React, { useEffect, useRef, useState } from "react";
import type { MatchedPerson, ChatMessage } from "../../types/dashboard";
import { sendChatMessage } from "../../api/dashboard";

interface ChatPanelProps {
  person: MatchedPerson;
  matchId: number;
  messages: ChatMessage[];
  onMessagesUpdate: (updated: ChatMessage[]) => void;
  onUnmatch: () => void;
  onBlock: () => void;
}

export default function ChatPanel({
  person,
  matchId,
  messages,
  onMessagesUpdate,
  onUnmatch,
  onBlock,
}: ChatPanelProps) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const MAX_CHARS = 1000;

  // Scroll to bottom whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-focus the input when this panel mounts
  useEffect(() => {
    textareaRef.current?.focus();
  }, [person.id]);

  async function handleSend() {
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    setSending(true);
    setText("");

    // Optimistically add the message immediately
    const sent: ChatMessage = { from: "me", text: trimmed };
    const withSent = [...messages, sent];
    onMessagesUpdate(withSent);

    try {
      await sendChatMessage(matchId, trimmed);
    } catch {
      onMessagesUpdate(messages);
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div style={s.panel}>

      {/* Header */}
      <div style={s.header}>
        <div style={s.headerAvatar}>👤</div>
        <div style={s.headerInfo}>
          <div style={s.headerName}>{person.name}</div>
          <div style={s.headerMeta}>{person.major} · {person.year}</div>
        </div>
      </div>

      {/* Messages */}
      <div style={s.messagesArea}>
        {messages.length === 0 ? (
          <p style={s.emptyMsg}>Say hello! 👋</p>
        ) : (
          messages.map((msg, i) => (
            <div key={i} style={{ ...s.msgRow, justifyContent: msg.from === "me" ? "flex-end" : "flex-start" }}>
              <div
                style={{
                  ...s.bubble,
                  ...(msg.from === "me" ? s.bubbleMe : s.bubbleThem),
                }}
              >
                {msg.text}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Char counter */}
      <div style={s.charCount}>{MAX_CHARS - text.length} characters remaining</div>

      {/* Input bar */}
      <div style={s.inputBar}>
        <textarea
          ref={textareaRef}
          style={s.textarea}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message… (Enter to send, Shift+Enter for new line)"
          maxLength={MAX_CHARS}
          rows={1}
        />
        <button
          style={{ ...s.sendBtn, opacity: sending || !text.trim() ? 0.5 : 1 }}
          onClick={handleSend}
          disabled={sending || !text.trim()}
          aria-label="Send"
        >
          →
        </button>
      </div>

      {/* Unmatch / Block */}
      <div style={s.actionsRow}>
        <button style={s.btnUnmatch} onClick={onUnmatch}>Unmatch User</button>
        <button style={s.btnBlock} onClick={onBlock}>Block User</button>
      </div>
      <p style={s.footnote}>
        Blocked users will never appear again unless unblocked in Match Settings. · Matching again will not restore previous messages.
      </p>

    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  panel: {
    flex: 1, display: "flex", flexDirection: "column", overflow: "hidden",
    animation: "fadeSlideUp 0.25s ease both",
  },
  header: {
    background: "#ffffff", borderBottom: "1px solid #E8E2E2",
    padding: "14px 20px",
    display: "flex", alignItems: "center", gap: "12px",
    flexShrink: 0,
  },
  headerAvatar: {
    width: "38px", height: "38px", borderRadius: "50%",
    background: "#f0eaf8", border: "2px solid #5D3891",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: "16px", flexShrink: 0,
  },
  headerInfo: { flex: 1 },
  headerName: {
    fontFamily: "'Fraunces', serif",
    fontSize: "16px", fontWeight: 700, color: "#1a1a2e",
  },
  headerMeta: { fontSize: "12px", color: "#6b6b7b", fontStyle: "italic" },
  messagesArea: {
    flex: 1, overflowY: "auto",
    padding: "20px 20px 12px",
    display: "flex", flexDirection: "column", gap: "10px",
  },
  emptyMsg: {
    margin: "auto", fontSize: "13px",
    color: "#9999aa", fontStyle: "italic", textAlign: "center",
  },
  msgRow: {
    display: "flex",
    animation: "fadeIn 0.2s ease",
  },
  bubble: {
    maxWidth: "68%", padding: "10px 14px",
    borderRadius: "16px", fontSize: "13px", lineHeight: 1.5,
  },
  bubbleMe: {
    background: "#5D3891", color: "#fff",
    borderBottomRightRadius: "4px",
  },
  bubbleThem: {
    background: "#ffffff", color: "#1a1a2e",
    border: "1px solid #E8E2E2",
    borderBottomLeftRadius: "4px",
  },
  charCount: {
    fontSize: "11px", color: "#9999aa",
    textAlign: "right", padding: "0 20px 4px",
    flexShrink: 0,
  },
  inputBar: {
    background: "#ffffff", borderTop: "1px solid #E8E2E2",
    padding: "12px 16px",
    display: "flex", gap: "10px", alignItems: "flex-end",
    flexShrink: 0,
  },
  textarea: {
    flex: 1, resize: "none",
    border: "1.5px solid #E8E2E2", borderRadius: "10px",
    padding: "10px 14px",
    fontFamily: "'DM Sans', sans-serif",
    fontSize: "13px", color: "#1a1a2e",
    background: "#F5F5F5", outline: "none",
    minHeight: "42px", maxHeight: "100px",
    lineHeight: 1.4,
    transition: "border-color 0.15s ease",
  },
  sendBtn: {
    width: "40px", height: "40px",
    background: "#5D3891", color: "#fff",
    border: "none", borderRadius: "10px",
    cursor: "pointer", fontSize: "18px",
    display: "flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0,
    transition: "background 0.15s ease",
    fontFamily: "inherit",
  },
  actionsRow: {
    borderTop: "1px solid #E8E2E2",
    padding: "10px 16px",
    display: "flex", gap: "10px",
    background: "#ffffff", flexShrink: 0,
  },
  btnUnmatch: {
    flex: 1, padding: "9px",
    borderRadius: "8px", border: "1.5px solid #E8E2E2",
    background: "none", color: "#6b6b7b",
    fontFamily: "'DM Sans', sans-serif",
    fontSize: "13px", fontWeight: 600, cursor: "pointer",
    transition: "all 0.15s ease",
  },
  btnBlock: {
    flex: 1, padding: "9px",
    borderRadius: "8px", border: "1.5px solid #E8E2E2",
    background: "none", color: "#6b6b7b",
    fontFamily: "'DM Sans', sans-serif",
    fontSize: "13px", fontWeight: 600, cursor: "pointer",
    transition: "all 0.15s ease",
  },
  footnote: {
    fontSize: "10px", color: "#9999aa",
    textAlign: "center", padding: "6px 16px 10px",
    fontStyle: "italic", background: "#ffffff",
    borderTop: "1px solid #E8E2E2", flexShrink: 0,
  },
};
