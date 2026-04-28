import React from "react";
import type { MatchedPerson, ChatThread } from "../../types/dashboard";

type ActiveTab = "chats" | "matches";

interface LeftPanelProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;  pendingMatches: MatchedPerson[];
  onSelectMatch: (id: number) => void;
  selectedMatchId: number | null;  chatPeople: MatchedPerson[];
  chatThreads: Map<number, ChatThread>;
  onSelectChat: (id: number) => void;
  selectedChatId: number | null;
}

export default function LeftPanel({
  activeTab,
  onTabChange,
  pendingMatches,
  onSelectMatch,
  selectedMatchId,
  chatPeople,
  chatThreads,
  onSelectChat,
  selectedChatId,
}: LeftPanelProps) {
  return (
    <div style={s.panel}>
      <div style={s.tabBar}>
        <button
          style={{ ...s.tab, ...(activeTab === "chats" ? s.tabActive : {}) }}
          onClick={() => onTabChange("chats")}
        >
          Chats
        </button>
        <button
          style={{ ...s.tab, ...(activeTab === "matches" ? s.tabActive : {}) }}
          onClick={() => onTabChange("matches")}
        >
          New Matches
        </button>
      </div>
      <div style={s.list}>
        {activeTab === "matches" ? (
          pendingMatches.length === 0 ? (
            <p style={s.emptyNote}>No new matches.</p>
          ) : (
            pendingMatches.map((person) => (
              <PersonRow
                key={person.id}
                name={`${person.name} - ${person.major.split(" ")[0]} ${person.year}`}
                subLabel={person.matchStatus}
                subClass={person.matchStatus.includes("MUTUAL") ? "mutual" : "liked"}
                isActive={selectedMatchId === person.id}
                onClick={() => onSelectMatch(person.id)}
              />
            ))
          )
        ) : (
          chatPeople.length === 0 ? (
            <p style={s.emptyNote}>No chats yet. Start a chat from New Matches.</p>
          ) : (
            chatPeople.map((person) => {
              const thread = chatThreads.get(person.id);
              const status = getPersonStatus(person, thread);
              return (
                <PersonRow
                  key={person.id}
                  name={`${person.name} - ${person.major.split(" ")[0]} ${person.year}`}
                  subLabel={status}
                  subClass={getChatStatusClass(status)}
                  isActive={selectedChatId === person.id}
                  onClick={() => onSelectChat(person.id)}
                />
              );
            })
          )
        )}
      </div>
    </div>
  );
}

function getChatStatusClass(status: string): string {
  if (status === "NEW MATCH!")     return "newmatch";
  if (status === "NEW MESSAGES!")  return "messages";
  if (status === "PROFILE UPDATED!") return "updated";
  return "muted";
}

function getPersonStatus(person: MatchedPerson, thread?: ChatThread): string {
  if (person.hasUnreadMessages) return "NEW MESSAGES!";
  if (person.hasProfileUpdated) return "PROFILE UPDATED!";
  if (person.isNewMatch) return "NEW MATCH!";
  return thread?.chatStatus ?? "SENT";
}function PersonRow({
  name, subLabel, subClass, isActive, onClick,
}: {
  name: string;
  subLabel: string;
  subClass: string;
  isActive: boolean;
  onClick: () => void;
}) {
  const subColour: Record<string, string> = {
    mutual:   "#F99417",
    liked:    "#5D3891",
    newmatch: "#2ecc71",
    messages: "#5D3891",
    updated:  "#F99417",
    muted:    "#9999aa",
  };

  return (
    <div
      style={{
        ...s.row,
        ...(isActive ? s.rowActive : {}),
      }}
      onClick={onClick}
    >
      <div style={s.rowAvatar}>👤</div>
      <div style={s.rowInfo}>
        <div style={s.rowName}>{name}</div>
        <div style={{ ...s.rowSub, color: subColour[subClass] ?? "#9999aa" }}>
          {subLabel}
        </div>
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  panel: {
    width: "268px", flexShrink: 0,
    background: "#ffffff",
    borderRight: "1px solid #E8E2E2",
    display: "flex", flexDirection: "column",
    overflow: "hidden",
  },
  tabBar: {
    display: "flex",
    borderBottom: "1px solid #E8E2E2",
    flexShrink: 0,
  },
  tab: {
    flex: 1, padding: "13px 8px",
    background: "none", border: "none",
    fontFamily: "'DM Sans', sans-serif",
    fontSize: "13px", fontWeight: 600,
    color: "#6b6b7b", cursor: "pointer",
    borderBottom: "3px solid transparent",
    marginBottom: "-1px",
    transition: "all 0.15s ease",
  },
  tabActive: {
    color: "#5D3891",
    borderBottomColor: "#5D3891",
    background: "#f0eaf8",
  },
  list: {
    flex: 1, overflowY: "auto",
    padding: "6px 0",
  },
  emptyNote: {
    padding: "20px",
    fontSize: "13px", color: "#9999aa",
    textAlign: "center", fontStyle: "italic",
  },
  row: {
    display: "flex", alignItems: "center", gap: "10px",
    padding: "10px 14px",
    cursor: "pointer",
    borderLeft: "3px solid transparent",
    transition: "background 0.12s ease, border-color 0.12s ease",
  },
  rowActive: {
    background: "#f0eaf8",
    borderLeftColor: "#5D3891",
  },
  rowAvatar: {
    width: "40px", height: "40px", borderRadius: "50%",
    background: "#E8E2E2",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: "18px", color: "#6b6b7b",
    flexShrink: 0,
    border: "2px solid #E8E2E2",
  },
  rowInfo: { flex: 1, minWidth: 0 },
  rowName: {
    fontSize: "13px", fontWeight: 600, color: "#1a1a2e",
    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
  },
  rowSub: {
    fontSize: "11px", fontWeight: 600,
    marginTop: "2px", fontStyle: "italic",
    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
  },
};

