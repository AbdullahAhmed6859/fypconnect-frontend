import React, { useEffect, useState } from "react";
import LeftPanel from "../components/dashboard/LeftPanel";
import ProfileCard from "../components/dashboard/ProfileCard";
import ChatPanel from "../components/dashboard/ChatPanel";
import ConfirmModal from "../components/dashboard/ConfirmModal";
import { getProfileStatus } from "../api/auth";
import type { ChatMessage, ChatThread, MatchedPerson, Profile } from "../types/dashboard";
import {
  fetchChatHistory,
  fetchMatches,
  fetchNextBrowseProfile,
  likeProfile,
  passProfile,
  unmatchUser,
  blockUser,
  logoutUser,
} from "../api/dashboard";

type ActiveTab = "chats" | "matches";

type RightView =
  | { type: "browse"; profile: Profile }
  | { type: "matchProfile"; person: MatchedPerson }
  | { type: "chat"; personId: number }
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
  const [matches, setMatches] = useState<MatchedPerson[]>([]);
  const [startedChatIds, setStartedChatIds] = useState<Set<number>>(new Set());
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [dashboardError, setDashboardError] = useState<string | null>(null);

  const [browsedIds, setBrowsedIds] = useState<Set<number>>(new Set());
  const [currentBrowseProfile, setCurrentBrowseProfile] = useState<Profile | null>(null);

  const [chatThreads, setChatThreads] = useState<Map<number, ChatThread>>(new Map());
  const [rightView, setRightView] = useState<RightView>({ type: "empty" });
  const [selectedMatchId, setSelectedMatchId] = useState<number | null>(null);
  const [selectedChatId, setSelectedChatId] = useState<number | null>(null);
  const [modal, setModal] = useState<ModalState | null>(null);

  useEffect(() => {
    getProfileStatus()
      .then(({ profileCompleted }) => {
        if (!profileCompleted) window.location.href = "/profile/setup/academic";
      })
      .catch(() => {
        window.location.href = "/login";
      });
  }, []);

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      setLoadingDashboard(true);
      setDashboardError(null);

      try {
        const [loadedMatches, firstProfile] = await Promise.all([
          fetchMatches(),
          fetchNextBrowseProfile([]),
        ]);

        if (!active) return;
        setMatches(loadedMatches);

        if (firstProfile) {
          setCurrentBrowseProfile(firstProfile);
          setRightView({ type: "browse", profile: firstProfile });
        } else {
          setRightView({ type: "noMore" });
        }
      } catch (err: unknown) {
        if (!active) return;
        showActionError(err, "Could not load dashboard data.");
        setRightView({ type: "empty" });
      } finally {
        if (active) setLoadingDashboard(false);
      }
    }

    void loadDashboard();

    return () => {
      active = false;
    };
  }, []);

  const newMatches = matches.filter((person) => !hasStartedChat(person));
  const chatPeople = matches.filter((person) => hasStartedChat(person));

  function hasStartedChat(person: MatchedPerson) {
    const thread = chatThreads.get(person.id);
    return (
      startedChatIds.has(person.id) ||
      Boolean(person.lastMessagePreview) ||
      Boolean(thread && thread.messages.length > 0)
    );
  }

  function handleTabChange(tab: ActiveTab) {
    setActiveTab(tab);
    setSelectedMatchId(null);
    setSelectedChatId(null);

    if (tab === "matches") {
      restoreBrowseView();
    } else {
      setRightView({ type: "empty" });
    }
  }

  function restoreBrowseView() {
    if (currentBrowseProfile && !browsedIds.has(currentBrowseProfile.id)) {
      setRightView({ type: "browse", profile: currentBrowseProfile });
    } else {
      setRightView({ type: "noMore" });
    }
  }

  async function handleBrowseLike(profileId: number) {
    try {
      const result = await likeProfile(profileId);
      const updated = new Set(browsedIds).add(profileId);
      setBrowsedIds(updated);

      if (result.isMutualMatch) {
        setMatches(await fetchMatches());
      }

      await advanceBrowseFeed(updated);
    } catch (err: unknown) {
      showActionError(err, "Could not like this profile.");
    }
  }

  async function handleBrowsePass(profileId: number) {
    try {
      await passProfile(profileId);
      const updated = new Set(browsedIds).add(profileId);
      setBrowsedIds(updated);
      await advanceBrowseFeed(updated);
    } catch (err: unknown) {
      showActionError(err, "Could not pass this profile.");
    }
  }

  async function advanceBrowseFeed(excluded: Set<number>) {
    try {
      const next = await fetchNextBrowseProfile([...excluded]);
      if (next) {
        setCurrentBrowseProfile(next);
        setRightView({ type: "browse", profile: next });
      } else {
        setCurrentBrowseProfile(null);
        setRightView({ type: "noMore" });
      }
      setSelectedMatchId(null);
    } catch (err: unknown) {
      showActionError(err, "Could not load the next profile.");
    }
  }

  function handleSelectMatch(personId: number) {
    const person = matches.find((p) => p.id === personId);
    if (!person) return;

    setSelectedMatchId(personId);
    setSelectedChatId(null);
    setRightView({ type: "matchProfile", person });
  }

  async function handleStartChat(personId: number) {
    await openChat(personId);
  }

  function handleDismissNewMatch() {
    setModal({
      title: "Action not available yet",
      body: "The backend does not expose unmatch or dismiss for mutual matches yet.",
      confirmLabel: "OK",
      onConfirm: () => setModal(null),
    });
  }

  function handleSelectChat(personId: number) {
    void openChat(personId);
  }

  async function openChat(personId: number) {
    const person = matches.find((p) => p.id === personId);
    if (!person) return;

    setStartedChatIds((prev) => new Set(prev).add(personId));
    setActiveTab("chats");
    setSelectedChatId(personId);
    setSelectedMatchId(null);
    setRightView({ type: "chat", personId });

    if (!person.matchId || chatThreads.has(personId)) return;

    try {
      const thread = await fetchChatHistory(person.matchId);
      if (thread) {
        setChatThreads((prev) => new Map(prev).set(personId, thread));
      }
    } catch (err: unknown) {
      showActionError(err, "Could not load this conversation.");
    }
  }

  function handleMessagesUpdate(personId: number, updated: ChatMessage[]) {
    setStartedChatIds((prev) => new Set(prev).add(personId));
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

  function handleUnmatch(personId: number) {
    const person = matches.find((p) => p.id === personId);
    if (!person) return;

    setModal({
      title: `Unmatch ${person.name}?`,
      body: "This will remove the match from both chat lists. This backend action is not available yet.",
      confirmLabel: "Unmatch",
      onConfirm: async () => {
        try {
          await unmatchUser(person.matchId ?? person.id);
          executeRemove(personId);
        } catch (err: unknown) {
          showActionError(err, "Unmatch is not available yet.");
          setModal(null);
        }
      },
    });
  }

  function handleBlock(personId: number) {
    const person = matches.find((p) => p.id === personId);
    if (!person) return;

    setModal({
      title: `Block ${person.name}?`,
      body: "Blocking is not available in the backend yet.",
      confirmLabel: "Block",
      onConfirm: async () => {
        try {
          await blockUser(person.matchId ?? person.id);
          executeRemove(personId);
        } catch (err: unknown) {
          showActionError(err, "Block is not available yet.");
          setModal(null);
        }
      },
    });
  }

  function executeRemove(personId: number) {
    setModal(null);
    setMatches((prev) => prev.filter((person) => person.id !== personId));
    setStartedChatIds((prev) => {
      const next = new Set(prev);
      next.delete(personId);
      return next;
    });
    setSelectedChatId(null);
    setSelectedMatchId(null);
    setRightView({ type: "empty" });
  }

  async function handleLogout() {
    try {
      await logoutUser();
    } finally {
      window.location.href = "/login";
    }
  }

  function showActionError(err: unknown, fallback: string) {
    const apiError = err as { message?: string };
    setDashboardError(apiError.message ?? fallback);
  }

  function renderRight() {
    switch (rightView.type) {
      case "browse":
        return (
          <ProfileCard
            profile={rightView.profile}
            onLike={() => handleBrowseLike(rightView.profile.id)}
            onPass={() => handleBrowsePass(rightView.profile.id)}
            contextLabel="Browse - like to express interest, pass to skip permanently."
          />
        );

      case "matchProfile":
        return (
          <ProfileCard
            profile={rightView.person}
            onLike={() => handleStartChat(rightView.person.id)}
            onPass={handleDismissNewMatch}
            contextLabel={`${rightView.person.matchStatus} Start a chat to move this match into Chats.`}
          />
        );

      case "chat": {
        const person = matches.find((p) => p.id === rightView.personId);
        const thread = chatThreads.get(rightView.personId);
        if (!person) return null;

        return (
          <ChatPanel
            person={person}
            matchId={person.matchId ?? person.id}
            messages={thread?.messages ?? []}
            onMessagesUpdate={(msgs) => handleMessagesUpdate(rightView.personId, msgs)}
            onUnmatch={() => handleUnmatch(rightView.personId)}
            onBlock={() => handleBlock(rightView.personId)}
          />
        );
      }

      case "noMore":
        return (
          <div style={s.noMoreState}>
            <div style={s.noMoreBox}>
              <div style={s.noMoreTitle}>No More Profiles To Show.</div>
              <p style={s.noMoreBody}>
                You have seen all available profiles matching your current preferences
                and interaction history.
              </p>
              <p style={s.noMoreBody}>
                Consider updating your profile and preferences or unblocking users to
                continue browsing.
              </p>
            </div>
            <button
              type="button"
              style={s.btnUpdateProfile}
              onClick={() => alert("Edit Profile screen coming soon.")}
            >
              Update My Profile
            </button>
          </div>
        );

      case "empty":
      default:
        return (
          <div style={s.noMoreState}>
            <div style={s.noMoreBox}>
              <div style={s.noMoreTitle}>Select a chat</div>
              <p style={s.noMoreBody}>
                Choose a conversation from the left to start messaging.
              </p>
            </div>
          </div>
        );
    }
  }

  return (
    <>
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
        {dashboardError && (
          <div style={s.errorToast} role="alert">
            <span>{dashboardError}</span>
            <button style={s.errorClose} onClick={() => setDashboardError(null)}>
              x
            </button>
          </div>
        )}

        <nav style={s.topnav}>
          <button
            style={s.navMe}
            onClick={() => alert("Edit Profile screen coming soon.")}
            title="View / edit your profile"
          >
            <div style={s.navAvatar}>Me</div>
            <span>Me</span>
          </button>

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

        <div style={s.main}>
          <LeftPanel
            activeTab={activeTab}
            onTabChange={handleTabChange}
            pendingMatches={newMatches}
            onSelectMatch={handleSelectMatch}
            selectedMatchId={selectedMatchId}
            chatPeople={chatPeople}
            chatThreads={chatThreads}
            onSelectChat={handleSelectChat}
            selectedChatId={selectedChatId}
          />

          <div style={s.rightPanel}>
            {loadingDashboard ? (
              <div style={s.emptyState}>
                <div style={s.emptyTitle}>Loading dashboard...</div>
              </div>
            ) : (
              renderRight()
            )}
          </div>
        </div>
      </div>

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
    background: "#F5F5F5", overflow: "hidden", position: "relative",
  },
  errorToast: {
    position: "absolute", top: "70px", right: "20px", zIndex: 120,
    maxWidth: "360px", background: "#ffffff", color: "#1a1a2e",
    border: "1px solid #F99417", borderLeft: "5px solid #F99417",
    borderRadius: "8px", padding: "12px 14px", display: "flex",
    alignItems: "center", gap: "12px", boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
    fontSize: "13px", lineHeight: 1.4,
  },
  errorClose: {
    border: "none", background: "none", color: "#6b6b7b",
    cursor: "pointer", fontSize: "14px", fontWeight: 700,
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
    fontSize: "11px", color: "#5D3891", flexShrink: 0, fontWeight: 700,
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
  emptyIcon: { fontSize: "22px", opacity: 0.45, marginBottom: "4px", fontWeight: 700 },
  emptyTitle: {
    fontFamily: "'Fraunces', serif",
    fontSize: "20px", fontWeight: 700, color: "#1a1a2e",
  },
  emptyBody: {
    fontSize: "14px", color: "#6b6b7b",
    lineHeight: 1.6, maxWidth: "320px",
  },
  noMoreState: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
    textAlign: "center",
    overflow: "hidden",
  },
  noMoreBox: {
    width: "100%",
    maxWidth: "760px",
    flex: 1,
    minHeight: 0,
    border: "1px solid #E8E2E2",
    borderRadius: "14px",
    background: "#ffffff",
    boxShadow: "0 4px 24px rgba(93,56,145,0.07)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "18px",
    padding: "32px 44px",
    animation: "fadeSlideUp 0.25s ease both",
  },
  noMoreTitle: {
    fontFamily: "'Fraunces', serif",
    fontSize: "20px",
    fontWeight: 700,
    color: "#1a1a2e",
  },
  noMoreBody: {
    maxWidth: "430px",
    fontSize: "14px",
    lineHeight: 1.6,
    color: "#6b6b7b",
    fontWeight: 400,
  },
  btnUpdateProfile: {
    marginTop: "18px",
    padding: "10px 24px",
    border: "1.5px solid #5D3891",
    borderRadius: "20px",
    background: "#ffffff",
    color: "#5D3891",
    fontFamily: "'DM Sans', sans-serif",
    fontSize: "14px",
    fontWeight: 600,
    lineHeight: 1.2,
    cursor: "pointer",
    flexShrink: 0,
    transition: "all 0.15s ease",
  },
};
