import React, { useState, useEffect } from "react";
import LeftPanel from "../components/dashboard/LeftPanel";
import ProfileCard from "../components/dashboard/ProfileCard";
import ChatPanel from "../components/dashboard/ChatPanel";
import ConfirmModal from "../components/dashboard/ConfirmModal";
import type { MatchedPerson, Profile, ChatMessage, ChatThread } from "../types/dashboard";
import { DUMMY_MATCHES, DUMMY_CHAT_THREADS, DUMMY_BROWSE_POOL } from "../data/dashboardData";
import {
  likeProfile,
  passProfile,
  likeBackMatch,
  passMatch,
  unmatchUser,
  blockUser,
  logoutUser,
} from "../api/dashboard";

type ActiveTab = "chats" | "matches";

// What's shown on the right panel
type RightView =
  | { type: "browse";  profile: Profile }
  | { type: "matchProfile"; person: MatchedPerson }
  | { type: "chat";    personId: number }
  | { type: "noMore" }
  | { type: "empty" };

interface ModalState {
  title: string;
  body: string;
  confirmLabel: string;
  onConfirm: () => void;
}

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("matches");

  // --- Matches state ---
  // IDs passed or liked in the Matches tab
  const [rejectedMatchIds, setRejectedMatchIds] = useState<Set<number>>(new Set());
  const [acceptedMatchIds, setAcceptedMatchIds] = useState<Set<number>>(new Set());

  // --- Browse state ---
  // IDs already liked/passed in the browse feed
  const [browsedIds, setBrowsedIds] = useState<Set<number>>(new Set());
  // Which browse profile is currently shown (persists when user opens a match profile)
  const [currentBrowseProfile, setCurrentBrowseProfile] = useState<Profile | null>(null);

  // --- Chat state ---
  // Map of personId → ChatThread (messages + status)
  const [chatThreads, setChatThreads] = useState<Map<number, ChatThread>>(() => {
    const map = new Map<number, ChatThread>();
    DUMMY_CHAT_THREADS.forEach((t) => map.set(t.personId, t));
    return map;
  });

  // --- Right panel ---
  const [rightView, setRightView] = useState<RightView>({ type: "empty" });

  // --- Selected IDs for left panel highlight ---
  const [selectedMatchId, setSelectedMatchId] = useState<number | null>(null);
  const [selectedChatId, setSelectedChatId] = useState<number | null>(null);

  // --- Modal ---
  const [modal, setModal] = useState<ModalState | null>(null);

  // On mount: load the first browse profile so the right side isn't blank
  useEffect(() => {
    const first = DUMMY_BROWSE_POOL.find((p) => !browsedIds.has(p.id));
    if (first) {
      setCurrentBrowseProfile(first);
      setRightView({ type: "browse", profile: first });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Derived lists
  const pendingMatches = DUMMY_MATCHES.filter(
    (p) => !rejectedMatchIds.has(p.id) && !acceptedMatchIds.has(p.id)
  );

  // People with active chats: those with existing chats + those just accepted
  const chatPeople = DUMMY_MATCHES.filter(
    (p) =>
      (p.hasExistingChat || acceptedMatchIds.has(p.id)) &&
      !rejectedMatchIds.has(p.id)
  );

  // ── Tab switching ──
  function handleTabChange(tab: ActiveTab) {
    setActiveTab(tab);
    setSelectedMatchId(null);
    setSelectedChatId(null);
    // When switching back to matches, restore the browse profile on the right
    if (tab === "matches") {
      if (currentBrowseProfile && !browsedIds.has(currentBrowseProfile.id)) {
        setRightView({ type: "browse", profile: currentBrowseProfile });
      } else {
        const next = DUMMY_BROWSE_POOL.find((p) => !browsedIds.has(p.id));
        if (next) {
          setCurrentBrowseProfile(next);
          setRightView({ type: "browse", profile: next });
        } else {
          setRightView({ type: "noMore" });
        }
      }
    } else {
      setRightView({ type: "empty" });
    }
  }

  // ── Browse feed: like ──
  async function handleBrowseLike(profileId: number) {
    await likeProfile(profileId);
    const updated = new Set(browsedIds).add(profileId);
    setBrowsedIds(updated);
    advanceBrowseFeed(updated);
  }

  // ── Browse feed: pass ──
  async function handleBrowsePass(profileId: number) {
    await passProfile(profileId);
    const updated = new Set(browsedIds).add(profileId);
    setBrowsedIds(updated);
    advanceBrowseFeed(updated);
  }

  function advanceBrowseFeed(excluded: Set<number>) {
    const next = DUMMY_BROWSE_POOL.find((p) => !excluded.has(p.id));
    if (next) {
      setCurrentBrowseProfile(next);
      setRightView({ type: "browse", profile: next });
    } else {
      setCurrentBrowseProfile(null);
      setRightView({ type: "noMore" });
    }
    setSelectedMatchId(null);
  }

  // ── Matches tab: open a profile ──
  function handleSelectMatch(personId: number) {
    const person = DUMMY_MATCHES.find((p) => p.id === personId)!;
    setSelectedMatchId(personId);
    setSelectedChatId(null);
    setRightView({ type: "matchProfile", person });
  }

  // ── Matches tab: like back → open chat ──
  async function handleLikeBackMatch(personId: number) {
    await likeBackMatch(personId);
    const updated = new Set(acceptedMatchIds).add(personId);
    setAcceptedMatchIds(updated);

    // Ensure a chat thread exists
    if (!chatThreads.has(personId)) {
      const newThread: ChatThread = { personId, messages: [], chatStatus: "NEW MATCH!" };
      setChatThreads((prev) => new Map(prev).set(personId, newThread));
    }

    // Switch to chats tab and open the chat
    setActiveTab("chats");
    setSelectedChatId(personId);
    setSelectedMatchId(null);
    setRightView({ type: "chat", personId });
  }

  // ── Matches tab: pass ──
  async function handlePassMatch(personId: number) {
    await passMatch(personId);
    const updated = new Set(rejectedMatchIds).add(personId);
    setRejectedMatchIds(updated);
    setSelectedMatchId(null);

    // Go back to whichever browse profile was showing before
    if (currentBrowseProfile && !browsedIds.has(currentBrowseProfile.id)) {
      setRightView({ type: "browse", profile: currentBrowseProfile });
    } else {
      const next = DUMMY_BROWSE_POOL.find((p) => !browsedIds.has(p.id));
      if (next) {
        setCurrentBrowseProfile(next);
        setRightView({ type: "browse", profile: next });
      } else {
        setRightView({ type: "noMore" });
      }
    }
  }

  // ── Chats tab: open a chat ──
  function handleSelectChat(personId: number) {
    setSelectedChatId(personId);
    setSelectedMatchId(null);
    setRightView({ type: "chat", personId });
  }

  // ── Chat: messages update ──
  function handleMessagesUpdate(personId: number, updated: ChatMessage[]) {
    setChatThreads((prev) => {
      const existing = prev.get(personId);
      const next = new Map(prev);
      next.set(personId, {
        personId,
        messages: updated,
        chatStatus: existing?.chatStatus ?? "SENT",
      });
      return next;
    });
  }

  // ── Unmatch ──
  function handleUnmatch(personId: number) {
    const person = DUMMY_MATCHES.find((p) => p.id === personId)!;
    setModal({
      title: `Unmatch ${person.name}?`,
      body: "This will remove the match from both chat lists. You can match again in the future, but previous messages won't be restored.",
      confirmLabel: "Unmatch",
      onConfirm: async () => {
        await unmatchUser(personId);
        executeRemove(personId);
      },
    });
  }

  // ── Block ──
  function handleBlock(personId: number) {
    const person = DUMMY_MATCHES.find((p) => p.id === personId)!;
    setModal({
      title: `Block ${person.name}?`,
      body: "Blocking will unmatch you immediately and prevent any future matching. You can unblock them later in Match Settings.",
      confirmLabel: "Block",
      onConfirm: async () => {
        await blockUser(personId);
        executeRemove(personId);
      },
    });
  }

  function executeRemove(personId: number) {
    setModal(null);
    setRejectedMatchIds((prev) => new Set(prev).add(personId));
    setAcceptedMatchIds((prev) => { const s = new Set(prev); s.delete(personId); return s; });
    setSelectedChatId(null);
    setSelectedMatchId(null);
    setRightView({ type: "empty" });
  }

  // ── Logout ──
  async function handleLogout() {
    await logoutUser();
    // In real app: clear token and navigate to /login
    alert("Logged out! (navigate to /login)");
  }

  // ── Right panel renderer ──
  function renderRight() {
    switch (rightView.type) {

      case "browse":
        return (
          <ProfileCard
            profile={rightView.profile}
            onLike={() => handleBrowseLike(rightView.profile.id)}
            onPass={() => handleBrowsePass(rightView.profile.id)}
            contextLabel="Browse — like to express interest, pass to skip permanently."
          />
        );

      case "matchProfile": {
        const person = rightView.person;
        return (
          <ProfileCard
            profile={person}
            onLike={() => handleLikeBackMatch(person.id)}
            onPass={() => handlePassMatch(person.id)}
            contextLabel={`${person.matchStatus} Like back to start a chat.`}
          />
        );
      }

      case "chat": {
        const person = DUMMY_MATCHES.find((p) => p.id === rightView.personId)!;
        const thread = chatThreads.get(rightView.personId);
        return (
          <ChatPanel
            person={person}
            messages={thread?.messages ?? []}
            onMessagesUpdate={(msgs) => handleMessagesUpdate(rightView.personId, msgs)}
            onUnmatch={() => handleUnmatch(rightView.personId)}
            onBlock={() => handleBlock(rightView.personId)}
          />
        );
      }

      case "noMore":
        return (
          <div style={s.emptyState}>
            <div style={s.emptyIcon}>🔍</div>
            <div style={s.emptyTitle}>No More Profiles To Show.</div>
            <p style={s.emptyBody}>
              You have seen all available profiles matching your current preferences
              and interaction history.<br /><br />
              Consider updating your profile and preferences or unblocking users to
              continue browsing.
            </p>
            <button
              style={s.btnUpdateProfile}
              onClick={() => alert("Navigate to profile editor (not built yet)")}
            >
              Update My Profile
            </button>
          </div>
        );

      case "empty":
      default:
        return (
          <div style={s.emptyState}>
            <div style={s.emptyIcon}>💬</div>
            <div style={s.emptyTitle}>Select a chat</div>
            <p style={s.emptyBody}>Choose a conversation from the left to start messaging.</p>
          </div>
        );
    }
  }

  return (
    <>
      {/* Keyframe injections */}
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        .person-row-hover:hover { background: #F5F5F5 !important; }
        .btn-pass-hover:hover   { transform: scale(1.1); box-shadow: 0 6px 20px rgba(231,76,60,0.25) !important; }
        .btn-like-hover:hover   { transform: scale(1.1); background: #45276e !important; }
        .btn-send-hover:hover   { background: #45276e !important; }
        .btn-unmatch-hover:hover { border-color: #e74c3c !important; color: #e74c3c !important; }
        .btn-block-hover:hover  { border-color: #c0392b !important; background: #fde8e8 !important; color: #c0392b !important; }
        .btn-logout-hover:hover { border-color: #e74c3c !important; color: #e74c3c !important; }
      `}</style>

      <div style={s.page}>

        {/* ── Top Nav ── */}
        <nav style={s.topnav}>
          {/* "Me" — placeholder for profile edit */}
          <button
            style={s.navMe}
            onClick={() => alert("Edit Profile screen coming soon.")}
            title="View / edit your profile"
          >
            <div style={s.navAvatar}>👤</div>
            <span>Me</span>
          </button>

          {/* Brand — reloads dashboard (current page) */}
          <div
            style={s.navBrand}
            onClick={() => window.location.reload()}
            title="Home"
          >
            FYP<span style={{ color: "#F99417" }}>Connect</span>
          </div>

          <button className="btn-logout-hover" style={s.btnLogout} onClick={handleLogout}>
            Logout
          </button>
        </nav>

        {/* ── Main layout ── */}
        <div style={s.main}>
          <LeftPanel
            activeTab={activeTab}
            onTabChange={handleTabChange}
            pendingMatches={pendingMatches}
            onSelectMatch={handleSelectMatch}
            selectedMatchId={selectedMatchId}
            chatPeople={chatPeople}
            chatThreads={chatThreads}
            onSelectChat={handleSelectChat}
            selectedChatId={selectedChatId}
          />

          <div style={s.rightPanel}>
            {renderRight()}
          </div>
        </div>

      </div>

      {/* Confirmation modal */}
      {modal && (
        <ConfirmModal
          title={modal.title}
          body={modal.body}
          confirmLabel={modal.confirmLabel}
          onConfirm={modal.onConfirm}
          onCancel={() => setModal(null)}
        />
      )}
    </>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: {
    height: "100vh", display: "flex", flexDirection: "column",
    fontFamily: "'DM Sans', sans-serif",
    background: "#F5F5F5", overflow: "hidden",
  },
  topnav: {
    height: "58px", flexShrink: 0,
    background: "#ffffff", borderBottom: "1px solid #E8E2E2",
    display: "flex", alignItems: "center", padding: "0 20px", gap: "16px",
    boxShadow: "0 2px 12px rgba(93,56,145,0.06)",
    zIndex: 50,
  },
  navMe: {
    display: "flex", alignItems: "center", gap: "8px",
    background: "none", border: "none", cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif",
    fontSize: "14px", fontWeight: 600, color: "#1a1a2e",
    padding: "4px 8px", borderRadius: "8px",
    transition: "color 0.15s ease",
  },
  navAvatar: {
    width: "34px", height: "34px", borderRadius: "50%",
    background: "#f0eaf8", border: "2px solid #5D3891",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: "16px", color: "#5D3891", flexShrink: 0,
  },
  navBrand: {
    flex: 1, textAlign: "center",
    fontFamily: "'Fraunces', serif",
    fontWeight: 700, fontSize: "20px",
    color: "#5D3891", letterSpacing: "-0.4px",
    cursor: "pointer", userSelect: "none",
  },
  btnLogout: {
    padding: "7px 18px",
    border: "1.5px solid #E8E2E2", borderRadius: "8px",
    background: "#ffffff",
    fontFamily: "'DM Sans', sans-serif",
    fontSize: "13px", fontWeight: 600, color: "#6b6b7b",
    cursor: "pointer", transition: "all 0.15s ease",
  },
  main: {
    flex: 1, display: "flex", overflow: "hidden",
  },
  rightPanel: {
    flex: 1, display: "flex", flexDirection: "column",
    overflow: "hidden", background: "#F5F5F5",
  },
  emptyState: {
    flex: 1, display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center",
    textAlign: "center", padding: "40px", gap: "12px",
  },
  emptyIcon: { fontSize: "48px", opacity: 0.3, marginBottom: "4px" },
  emptyTitle: {
    fontFamily: "'Fraunces', serif",
    fontSize: "20px", fontWeight: 700, color: "#1a1a2e",
  },
  emptyBody: {
    fontSize: "14px", color: "#6b6b7b",
    lineHeight: 1.6, maxWidth: "320px",
  },
  btnUpdateProfile: {
    marginTop: "8px", padding: "10px 24px",
    border: "1.5px solid #5D3891", borderRadius: "20px",
    background: "#ffffff", color: "#5D3891",
    fontFamily: "'DM Sans', sans-serif",
    fontSize: "14px", fontWeight: 600, cursor: "pointer",
    transition: "all 0.15s ease",
  },
};
