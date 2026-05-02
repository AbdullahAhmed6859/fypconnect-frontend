// Matching preferences and blocked-user management for the current profile.
import { useEffect, useState } from "react";
import {
  getMyPreferences,
  unwrapPreferences,
  updateMyPreferences,
} from "../../api/preferencesApi";
import { getBlockedUsers, unblockUser } from "../../api/safetyApi";
import ConfirmModal from "../../components/dashboard/ConfirmModal";
import {
  resolveSelectedLabels,
  resolveSelectedIds,
  toBlockedUsers,
  toEditablePreferencesDraft,
  toEditablePreferencesDraftFromApi,
  type BlockedUser,
  type EditablePreferencesDraft,
} from "../../utils/profileDraft";
import {
  BlockedUsersEditor,
  ErrorBanner,
  LoadingBlock,
  ProfileShell,
  SearchableMultiSelect,
  SuccessBanner,
  edit,
  formStyles,
  match,
  useProfilePageState,
} from "./shared";
export function MatchSettingsPage() {
  const { loading, error, options } = useProfilePageState();
  const [form, setForm] = useState<EditablePreferencesDraft | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [previewUser, setPreviewUser] = useState<BlockedUser | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (loading || form || options.majors.length === 0) return;

    let active = true;

    async function loadPreferences() {
      try {
        const [preferencesEnvelope, blockedUsersEnvelope] = await Promise.all([
          getMyPreferences(),
          getBlockedUsers(),
        ]);
        const preferences = unwrapPreferences(preferencesEnvelope);
        if (!active) return;
        const blockedUsers = toBlockedUsers(blockedUsersEnvelope.data ?? []);

        setForm(
          toEditablePreferencesDraftFromApi(
            preferences,
            options.majors,
            options.skills,
            options.interests,
            blockedUsers,
          )
        );
      } catch (err: unknown) {
        const apiError = err as { message?: string };
        if (!active) return;

        setForm(toEditablePreferencesDraft());
        setFeedback({
          type: "error",
          message: apiError.message ?? "Could not load saved preferences.",
        });
      }
    }

    void loadPreferences();

    return () => {
      active = false;
    };
  }, [loading, form, options]);

  async function handleSave() {
    if (!form) return;

    const preferredMajorIds = resolveSelectedIds(form.preferredMajors, options.majors);
    const preferredSkillIds = resolveSelectedIds(form.preferredSkills, options.skills);
    const preferredInterestIds = resolveSelectedIds(form.preferredInterests, options.interests);

    setSaving(true);
    setFeedback(null);

    try {
      await updateMyPreferences({
        preferredMajorIds,
        preferredSkillIds,
        preferredInterestIds,
      });

      const refreshed = unwrapPreferences(await getMyPreferences());
      const updated = {
        ...toEditablePreferencesDraftFromApi(
          refreshed,
          options.majors,
          options.skills,
          options.interests,
        ),
        blockedUsers: form.blockedUsers,
      };
      setForm(updated);
      setFeedback({ type: "success", message: "Preferences saved successfully." });
    } catch (err: unknown) {
      const apiError = err as { message?: string };
      setFeedback({ type: "error", message: apiError.message ?? "Could not save your preferences." });
    } finally {
      setSaving(false);
    }
  }

  async function handleUnblock(userId: number) {
    if (!form) return;
    try {
      await unblockUser(userId);
      const next = {
        ...form,
        blockedUsers: form.blockedUsers.filter((user) => user.id !== userId),
      };
      setForm(next);
      setFeedback({ type: "success", message: "User unrestricted successfully." });
    } catch (err: unknown) {
      const apiError = err as { message?: string };
      setFeedback({ type: "error", message: apiError.message ?? "Could not unrestrict this user." });
    }
  }

  return (
    <ProfileShell
      title="Preferences & Restricted Users"
      helper="Update preferences to control who appears while browsing, and unrestrict users directly from this screen."
    >
      {loading || !form ? (
        <LoadingBlock label="Loading your match settings..." />
      ) : (
        <>
          {error && <ErrorBanner message={error} />}
          {feedback?.type === "error" && <ErrorBanner message={feedback.message} />}

          <div style={formStyles.form}>
            <SearchableMultiSelect
              label="Preferred Majors (Select All That Apply) (Optional)"
              placeholder="Search team members' majors"
              options={options.majors}
              selectedIds={resolveSelectedIds(form.preferredMajors, options.majors)}
              onChange={(ids) => setForm({ ...form, preferredMajors: resolveSelectedLabels(ids, options.majors) })}
            />

            <SearchableMultiSelect
              label="Preferred Skills (Select All That Apply) (Optional)"
              placeholder="Search skills that you're looking for"
              options={options.skills}
              selectedIds={resolveSelectedIds(form.preferredSkills, options.skills)}
              onChange={(ids) => setForm({ ...form, preferredSkills: resolveSelectedLabels(ids, options.skills) })}
            />

            <SearchableMultiSelect
              label="Preferred Interests (Select All That Apply) (Optional)"
              placeholder="Search interests that you're looking for"
              options={options.interests}
              selectedIds={resolveSelectedIds(form.preferredInterests, options.interests)}
              onChange={(ids) => setForm({ ...form, preferredInterests: resolveSelectedLabels(ids, options.interests) })}
            />

            <BlockedUsersEditor
              users={form.blockedUsers}
              onUnblock={(userId) => void handleUnblock(userId)}
              onPreview={setPreviewUser}
            />

            <div style={match.note}>
              View a restricted profile with the profile icon. Use the X button to unrestrict that user.
            </div>
          </div>

          <div style={edit.actionRow}>
            <button
              type="button"
              className="primary-btn"
              style={{ ...edit.primaryBtn, opacity: saving ? 0.7 : 1, cursor: saving ? "not-allowed" : "pointer" }}
              onClick={() => void handleSave()}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>

          <div style={edit.footerStatus}>
            {feedback?.type === "success" && <SuccessBanner message={feedback.message} />}
            <div style={edit.lastUpdated}>Last Updated: {form.lastUpdatedLabel}</div>
          </div>
        </>
      )}

      {previewUser && (
        <ConfirmModal
          title={previewUser.name}
          body={`${previewUser.major} ${previewUser.year}. This is the current restricted-user summary loaded from your account data.`}
          confirmLabel="Close"
          onConfirm={() => setPreviewUser(null)}
          onCancel={() => setPreviewUser(null)}
        />
      )}
    </ProfileShell>
  );
}




