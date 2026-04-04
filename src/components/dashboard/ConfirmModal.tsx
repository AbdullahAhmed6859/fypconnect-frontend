import React from "react";

interface ConfirmModalProps {
  title: string;
  body: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  title,
  body,
  confirmLabel,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <div style={s.overlay} onClick={onCancel}>
      <div style={s.box} onClick={(e) => e.stopPropagation()}>
        <div style={s.title}>{title}</div>
        <p style={s.body}>{body}</p>
        <div style={s.actions}>
          <button style={s.cancel} onClick={onCancel}>Cancel</button>
          <button style={s.confirm} onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  overlay: {
    position: "fixed", inset: 0,
    background: "rgba(0,0,0,0.45)",
    display: "flex", alignItems: "center", justifyContent: "center",
    zIndex: 200,
    animation: "fadeIn 0.15s ease",
  },
  box: {
    background: "#ffffff",
    borderRadius: "14px",
    padding: "32px 28px",
    width: "100%", maxWidth: "380px",
    boxShadow: "0 16px 48px rgba(0,0,0,0.18)",
    animation: "fadeSlideUp 0.2s ease both",
    textAlign: "center",
  },
  title: {
    fontFamily: "'Fraunces', serif",
    fontSize: "18px", fontWeight: 700,
    color: "#1a1a2e", marginBottom: "10px",
  },
  body: {
    fontSize: "13px", color: "#6b6b7b",
    lineHeight: 1.6, marginBottom: "24px",
  },
  actions: { display: "flex", gap: "10px" },
  cancel: {
    flex: 1, padding: "11px",
    border: "1.5px solid #E8E2E2", borderRadius: "8px",
    background: "none", color: "#6b6b7b",
    fontFamily: "'DM Sans', sans-serif",
    fontSize: "14px", fontWeight: 600, cursor: "pointer",
    transition: "all 0.15s ease",
  },
  confirm: {
    flex: 1, padding: "11px",
    border: "none", borderRadius: "8px",
    background: "#e74c3c", color: "#fff",
    fontFamily: "'DM Sans', sans-serif",
    fontSize: "14px", fontWeight: 600, cursor: "pointer",
    transition: "background 0.15s ease",
  },
};
