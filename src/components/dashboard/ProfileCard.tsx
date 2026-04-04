import React from "react";
import type { Profile } from "../../types/dashboard";

interface ProfileCardProps {
  profile: Profile;
  onLike: () => void;
  onPass: () => void;
  contextLabel?: string;
}

// Shared profile card used in both the browse feed and matches tab.
// ✓ = like/like-back, ✕ = pass (permanent).
// The header and action buttons are always visible — only the body scrolls.
export default function ProfileCard({ profile, onLike, onPass, contextLabel }: ProfileCardProps) {
  return (
    <div style={s.wrapper}>
      <div style={s.card}>

        {/* Header — fixed, never scrolls away */}
        <div style={s.header}>
          <div style={s.avatar}>👤</div>
          <div>
            <div style={s.name}>{profile.name}</div>
            <div style={s.meta}>{profile.major} · {profile.year}</div>
          </div>
        </div>

        {/* Body — the only part that scrolls */}
        <div style={s.body}>
          {profile.fypIdea && (
            <div style={s.field}>
              <div style={s.label}>FYP Idea</div>
              <div style={s.value}>"{profile.fypIdea}"</div>
            </div>
          )}
          {profile.bio && (
            <div style={s.field}>
              <div style={s.label}>Bio</div>
              <div style={s.value}>"{profile.bio}"</div>
            </div>
          )}
          <div style={s.field}>
            <div style={s.label}>Skills</div>
            <div style={s.tagRow}>
              {profile.skills.map((skill) => (
                <span key={skill} style={s.tagPurple}>{skill}</span>
              ))}
            </div>
          </div>
          <div style={s.field}>
            <div style={s.label}>Interests</div>
            <div style={s.tagRow}>
              {profile.interests.map((interest) => (
                <span key={interest} style={s.tagGold}>{interest}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Action row — pinned at the bottom, always visible */}
        <div style={s.actionArea}>
          {contextLabel && <p style={s.contextLabel}>{contextLabel}</p>}
          <div style={s.actionRow}>
            <button
              style={s.btnPass}
              onClick={onPass}
              title="Pass — this profile won't appear again"
              aria-label="Pass"
            >
              ✕
            </button>
            <button
              style={s.btnLike}
              onClick={onLike}
              title="Like — express interest"
              aria-label="Like"
            >
              ✓
            </button>
          </div>
          <p style={s.passNote}>Passed profiles will never appear again.</p>
        </div>

      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  // Fills the right panel — does NOT scroll itself
  wrapper: {
    flex: 1,
    padding: "24px",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    minHeight: 0,
  },
  // Card fills available height and manages its own internal layout
  card: {
    background: "#ffffff",
    borderRadius: "14px",
    border: "1px solid #E8E2E2",
    boxShadow: "0 4px 24px rgba(93,56,145,0.07)",
    animation: "fadeSlideUp 0.25s ease both",
    display: "flex",
    flexDirection: "column",
    flex: 1,
    minHeight: 0,       // critical — lets flex children shrink correctly
    overflow: "hidden", // clips rounded corners cleanly
  },
  header: {
    background: "linear-gradient(135deg, #5D3891 0%, #45276e 100%)",
    padding: "24px 28px",
    display: "flex",
    alignItems: "center",
    gap: "16px",
    flexShrink: 0,
  },
  avatar: {
    width: "60px", height: "60px", borderRadius: "50%",
    background: "rgba(255,255,255,0.15)",
    border: "3px solid rgba(255,255,255,0.4)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: "26px", flexShrink: 0,
  },
  name: {
    fontFamily: "'Fraunces', serif",
    fontSize: "20px", fontWeight: 700,
    color: "#fff", marginBottom: "3px",
  },
  meta: {
    fontSize: "13px",
    color: "rgba(255,255,255,0.8)",
  },
  // Scrollable section — grows to fill space between header and actions
  body: {
    padding: "20px 28px",
    overflowY: "auto",
    flex: 1,
    minHeight: 0,
  },
  field: {
    marginBottom: "14px",
  },
  label: {
    fontSize: "11px", fontWeight: 700,
    color: "#9999aa", textTransform: "uppercase",
    letterSpacing: "0.8px", marginBottom: "5px",
  },
  value: {
    fontSize: "14px", color: "#1a1a2e", lineHeight: 1.5,
    fontStyle: "italic",
  },
  tagRow: {
    display: "flex", flexWrap: "wrap", gap: "6px",
  },
  tagPurple: {
    padding: "4px 10px", borderRadius: "20px",
    background: "#f0eaf8", color: "#5D3891",
    fontSize: "12px", fontWeight: 600,
  },
  tagGold: {
    padding: "4px 10px", borderRadius: "20px",
    background: "#fff4e0", color: "#F99417",
    fontSize: "12px", fontWeight: 600,
  },
  // Always pinned to the bottom of the card
  actionArea: {
    borderTop: "1px solid #E8E2E2",
    padding: "16px 28px 20px",
    textAlign: "center",
    flexShrink: 0,
    background: "#ffffff",
  },
  contextLabel: {
    fontSize: "12px", color: "#9999aa",
    fontStyle: "italic", marginBottom: "12px",
  },
  actionRow: {
    display: "flex",
    justifyContent: "center",
    gap: "32px",
    marginBottom: "10px",
  },
  btnPass: {
    width: "62px", height: "62px", borderRadius: "50%",
    border: "2px solid #fde8e8",
    background: "#fff", color: "#e74c3c",
    fontSize: "22px", cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    boxShadow: "0 4px 14px rgba(0,0,0,0.08)",
    transition: "transform 0.15s ease, box-shadow 0.15s ease",
    fontFamily: "inherit",
  },
  btnLike: {
    width: "62px", height: "62px", borderRadius: "50%",
    border: "none",
    background: "#5D3891", color: "#fff",
    fontSize: "22px", cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    boxShadow: "0 4px 14px rgba(93,56,145,0.3)",
    transition: "transform 0.15s ease, background 0.15s ease",
    fontFamily: "inherit",
  },
  passNote: {
    fontSize: "11px", color: "#9999aa",
    fontStyle: "italic",
  },
};