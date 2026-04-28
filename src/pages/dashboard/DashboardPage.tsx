import React, { useEffect, useState } from "react";
import LeftPanel from "../../components/dashboard/LeftPanel";
import ProfileCard from "../../components/dashboard/ProfileCard";
import ChatPanel from "../../components/dashboard/ChatPanel";
import ConfirmModal from "../../components/dashboard/ConfirmModal";
import { dismissAnnualYearReview, getMyProfile, unwrapMyProfile } from "../../api/auth";
import type { ChatMessage, ChatThread, MatchedPerson, Profile } from "../../types/dashboard";
import { toEditableProfileDraft } from "../../utils/profileDraft";
import {
  fetchChatHistory,
  fetchMatches,
  fetchNextBrowseProfile,
  fetchUpdatedMatchProfile,
  likeProfile,
  passProfile,
  unmatchUser,
  blockUser,
  logoutUser,
} from "../../api/dashboard";

type ActiveTab = "chats" | "matches";

type RightView =
  | { type: "browse"; profile: Profile }
  | { type: "matchProfile"; person: MatchedPerson }
  | { type: "chat"; personId: number }
  | { type: "noMore" }
  | { type: "empty" };

type DashboardAccess =
  | { status: "checking" }
  | { status: "allowed" }
  | { status: "restricted"; yearLabel: string }
  | { status: "annualReview"; yearLabel: string; reviewDate: string; reviewYear: number };

interface ModalState {
  title: string;
  body: string;
  confirmLabel: string;
  onConfirm: () => void;
}

export default function DashboardPage() {
  const [myProfileName, setMyProfileName] = useState("Me");
  const [myProfilePicture, setMyProfilePicture] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>("matches");
  const [matches, setMatches] = useState<MatchedPerson[]>([]);
  const [startedChatIds, setStartedChatIds] = useState<Set<number>>(new Set());
  const [dashboardAccess, setDashboardAccess] = useState<DashboardAccess>({ status: "checking" });
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
    getMyProfile()
      .then((envelope) => {
        const profile = unwrapMyProfile(envelope);
        const editableProfile = toEditableProfileDraft(profile);
        setMyProfileName(editableProfile.fullName || "Me");
        setMyProfilePicture(editableProfile.profilePicture);
        if (!profile?.profileCompleted) {
          window.location.href = "/profile/setup/academic";
          return;
        }

        const yearLabel = formatYearOfStudy(profile.yearOfStudy);
        if (yearLabel === "Freshman" || yearLabel === "Sophomore") {
          setDashboardAccess({ status: "restricted", yearLabel });
          setLoadingDashboard(false);
          return;
        }

        if (profile.annualYearReview?.required) {
          setDashboardAccess({
            status: "annualReview",
            yearLabel,
            reviewDate: profile.annualYearReview.reviewDate,
            reviewYear: profile.annualYearReview.reviewYear,
          });
          setLoadingDashboard(false);
          return;
        }

        setDashboardAccess({ status: "allowed" });
      })
      .catch(() => {
        window.location.href = "/login";
      });
  }, []);

  useEffect(() => {
    if (dashboardAccess.status !== "allowed") return;

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
  }, [dashboardAccess.status]);

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

  async function handleSelectMatch(personId: number) {
    const person = matches.find((p) => p.id === personId);
    if (!person) return;

    setSelectedMatchId(personId);
    setSelectedChatId(null);
    setRightView({ type: "matchProfile", person });

    try {
      const updatedPerson = await fetchUpdatedMatchProfile(person);
      setMatches((prev) =>
        prev.map((match) => (match.id === personId ? updatedPerson : match))
      );
      setRightView({ type: "matchProfile", person: updatedPerson });
    } catch (err: unknown) {
      showActionError(err, "Could not refresh this profile.");
    }
  }

  async function handleStartChat(personId: number) {
    await openChat(personId);
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
      body: "This will remove the match from both chat lists.",
      confirmLabel: "Unmatch",
      onConfirm: async () => {
        try {
          await unmatchUser(person.matchId ?? person.id);
          executeRemove(personId);
        } catch (err: unknown) {
          showActionError(err, "Could not unmatch this user.");
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
      body: "This will block the user and close the chat.",
      confirmLabel: "Block",
      onConfirm: async () => {
        try {
          await blockUser(person.id);
          executeRemove(personId);
        } catch (err: unknown) {
          showActionError(err, "Could not block this user.");
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

  async function handleIgnoreAnnualReview() {
    try {
      await dismissAnnualYearReview();
      setDashboardAccess({ status: "allowed" });
      setLoadingDashboard(true);
    } catch (err: unknown) {
      showActionError(err, "Could not dismiss the year-of-study reminder.");
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
            onPass={() => handleUnmatch(rightView.person.id)}
            contextLabel={`${rightView.person.matchStatus} Start a chat to move this match into Chats, or remove the match with X.`}
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
            onError={(message) => setDashboardError(message)}
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
              onClick={() => (window.location.href = "/profile/me")}
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

  function renderRestrictedDashboard(yearLabel: string) {
    return (
      <div style={s.restrictedState}>
        <div style={s.restrictedBox}>
          <div style={s.restrictedTitle}>Update Year of Study</div>
          <p style={s.restrictedBody}>
            As per our records, you are currently a {yearLabel}.
          </p>
          <p style={s.restrictedBody}>
            Browsing and matching features are restricted for Juniors and Seniors only.
          </p>
          <button
            type="button"
            style={s.btnUpdateProfile}
            onClick={() => (window.location.href = "/profile/me/edit")}
          >
            Edit Year of Study
          </button>
        </div>
      </div>
    );
  }

  function renderAnnualReviewDashboard(access: Extract<DashboardAccess, { status: "annualReview" }>) {
    return (
      <div style={s.restrictedState}>
        <div style={s.restrictedBox}>
          <div style={s.restrictedTitle}>Review Year of Study</div>
          <p style={s.restrictedBody}>
            As per our records of {access.reviewDate}, you are currently a {access.yearLabel}. If this is outdated,
            please update your records manually.
          </p>
          <div style={s.reviewActions}>
            <button
              type="button"
              style={s.btnUpdateProfile}
              onClick={handleIgnoreAnnualReview}
            >
              Ignore and Proceed
            </button>
            <button
              type="button"
              style={s.btnUpdateProfile}
              onClick={() => (window.location.href = "/profile/me/edit")}
            >
              Edit Year of Study
            </button>
          </div>
        </div>
      </div>
    );
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
            onClick={() => (window.location.href = "/profile/me")}
            title="View / edit your profile"
          >
            {myProfilePicture ? (
              <img src={myProfilePicture} alt={`${myProfileName} avatar`} style={s.navAvatarImage} />
            ) : (
              <div style={s.navAvatar}>{getAvatarInitials(myProfileName)}</div>
            )}
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
          {dashboardAccess.status === "allowed" && (
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
          )}

          <div style={s.rightPanel}>
            {loadingDashboard ? (
              <div style={s.emptyState}>
                <div style={s.emptyTitle}>Loading dashboard...</div>
              </div>
            ) : dashboardAccess.status === "restricted" ? (
              renderRestrictedDashboard(dashboardAccess.yearLabel)
            ) : dashboardAccess.status === "annualReview" ? (
              renderAnnualReviewDashboard(dashboardAccess)
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

function formatYearOfStudy(value: unknown): string {
  if (value === null || value === undefined || value === "") return "Year N/A";

  const text = String(value).trim();
  const numeric = Number(text.replace(/^year\s*/i, ""));
  const labels: Record<number, string> = {
    1: "Freshman",
    2: "Sophomore",
    3: "Junior",
    4: "Senior",
  };

  return labels[numeric] ?? text;
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
  navAvatarImage: {
    width: "34px",
    height: "34px",
    borderRadius: "50%",
    objectFit: "cover",
    border: "2px solid #ddd3eb",
    background: "#ffffff",
    flexShrink: 0,
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
  restrictedState: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
    textAlign: "center",
    overflow: "hidden",
  },
  restrictedBox: {
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
  restrictedTitle: {
    fontFamily: "'Fraunces', serif",
    fontSize: "20px",
    fontWeight: 700,
    color: "#1a1a2e",
  },
  restrictedBody: {
    maxWidth: "430px",
    fontSize: "14px",
    lineHeight: 1.6,
    color: "#6b6b7b",
    fontWeight: 400,
  },
  reviewActions: {
    display: "flex",
    justifyContent: "center",
    gap: "16px",
    flexWrap: "wrap",
    marginTop: "6px",
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

function getAvatarInitials(name: string) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return initials || "ME";
}

