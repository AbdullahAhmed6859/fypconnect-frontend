import { useMemo, useState, type CSSProperties } from "react";
import { deleteMyAccount } from "../../api/safetyApi";
import ConfirmModal from "../../components/dashboard/ConfirmModal";
import { toEditableProfileDraft } from "../../utils/profileDraft";
import {
  ErrorBanner,
  LoadingBlock,
  ProfileHeroImage,
  ProfileShell,
  overview,
  useProfilePageState,
} from "./shared";

type ModalState =
  | {
      type: "confirm";
      title: string;
      body: string;
      confirmLabel?: string;
      onConfirm?: () => void;
    }
  | { type: "type-delete" };

export function MyProfileOverviewPage() {
  const { loading, error, profile } = useProfilePageState();
  const [modal, setModal] = useState<ModalState | null>(null);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);

  const draft = useMemo(() => toEditableProfileDraft(profile), [profile]);
  const summaryRows = [
    { label: "FYP Idea", value: draft.fypIdea || "No FYP idea added yet." },
    { label: "Bio", value: draft.bio || "No bio added yet." },
    { label: "Skills", value: draft.skills.length ? draft.skills.join(", ") : "No skills selected yet." },
    { label: "Interests", value: draft.interests.length ? draft.interests.join(", ") : "No interests selected yet." },
    { label: "Links", value: draft.links.filter(Boolean).length ? draft.links.filter(Boolean).join(" | ") : "No links added yet." },
  ];

  return (
    <ProfileShell
      title="My Profile"
      helper="This is how your profile appears to other users. Email and password stay separate from this page."
    >
      {loading ? (
        <LoadingBlock label="Loading your profile..." />
      ) : (
        <>
          {error && <ErrorBanner message={error} />}

          <div style={overview.profilePanel}>
            <div style={overview.imagePane}>
              <ProfileHeroImage image={draft.profilePicture} label={draft.fullName} />
            </div>

            <div style={overview.infoPane}>
              <div style={overview.name}>{draft.fullName}</div>
              <div style={overview.meta}>{draft.majorLabel} ? {draft.yearLabel}</div>

              <div style={overview.scrollArea}>
                {summaryRows.map((row) => (
                  <div key={row.label} style={overview.summaryRow}>
                    <div style={overview.summaryLabel}>{row.label}</div>
                    <div style={overview.summaryValue}>{row.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={overview.buttonRow}>
            <button
              type="button"
              className="danger-btn"
              style={overview.deleteBtn}
              onClick={() =>
                setModal({
                  type: "confirm",
                  title: "Delete account",
                  body: "This will permanently delete your account and disable your active matches.",
                  confirmLabel: "Delete",
                  onConfirm: () => {
                    setDeleteConfirmationText("");
                    setModal({ type: "type-delete" });
                  },
                })
              }
            >
              Delete Account
            </button>
            <button
              type="button"
              className="ghost-btn"
              style={overview.centerActionBtn}
              onClick={() => (window.location.href = "/profile/me/edit")}
            >
              Edit Profile
            </button>
            <button
              type="button"
              className="ghost-btn"
              style={overview.actionBtn}
              onClick={() => (window.location.href = "/profile/me/match-settings")}
            >
              Preferences &<br />Restricted Users
            </button>
          </div>

          <div style={overview.lastUpdated}>Last Updated: {draft.lastUpdatedLabel}</div>
        </>
      )}

      {modal?.type === "confirm" && (
        <ConfirmModal
          title={modal.title}
          body={modal.body}
          confirmLabel={modal.confirmLabel ?? "OK"}
          onConfirm={modal.onConfirm ?? (() => setModal(null))}
          onCancel={() => setModal(null)}
        />
      )}

      {modal?.type === "type-delete" && (
        <ConfirmModal
          title="Type DELETE"
          body="Type DELETE to confirm account deletion."
          confirmLabel={deletingAccount ? "Deleting..." : "Delete"}
          confirmDisabled={deleteConfirmationText !== "DELETE" || deletingAccount}
          onConfirm={async () => {
            if (deleteConfirmationText !== "DELETE" || deletingAccount) return;

            try {
              setDeletingAccount(true);
              await deleteMyAccount();
            } finally {
              window.location.href = "/login";
            }
          }}
          onCancel={() => {
            if (deletingAccount) return;
            setDeleteConfirmationText("");
            setModal(null);
          }}
        >
          <input
            autoFocus
            value={deleteConfirmationText}
            onChange={(event) => setDeleteConfirmationText(event.target.value)}
            placeholder="DELETE"
            style={deleteConfirmStyles.input}
          />
        </ConfirmModal>
      )}
    </ProfileShell>
  );
}

const deleteConfirmStyles: Record<string, CSSProperties> = {
  input: {
    width: "100%",
    boxSizing: "border-box",
    border: "1.5px solid #E8E2E2",
    borderRadius: "8px",
    padding: "11px 12px",
    marginBottom: "18px",
    fontFamily: "'DM Sans', sans-serif",
    fontSize: "14px",
    color: "#1a1a2e",
    outline: "none",
  },
};
