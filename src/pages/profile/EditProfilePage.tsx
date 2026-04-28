import React, { useEffect, useRef, useState } from "react";
import { getMyProfile, unwrapMyProfile, updateMyProfile } from "../../api/auth";
import {
  MAX_BIO_WORDS,
  MAX_FYP_IDEA_WORDS,
  MAX_PROFILE_IMAGE_BYTES,
  buildLinksPayload,
  countWords,
  isHttpUrl,
  resolveSelectedIds,
  resolveSelectedLabels,
  toEditableProfileDraft,
  validateAndBuildProjects,
  type EditableProject,
  type EditableProfileDraft,
} from "../../utils/profileDraft";
import {
  ErrorBanner,
  FieldError,
  LabeledInput,
  LabeledSelect,
  LabeledTextarea,
  LinksEditor,
  LoadingBlock,
  ProfileAvatar,
  ProfileShell,
  ProjectsEditor,
  SearchableMultiSelect,
  SuccessBanner,
  edit,
  findOptionIdByLabel,
  formStyles,
  readFileAsDataUrl,
  useProfilePageState,
} from "./shared";

type FieldErrors = Record<string, string>;
export function EditProfilePage() {
  const { loading, error, profile, options } = useProfilePageState();
  const [form, setForm] = useState<EditableProfileDraft | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!loading && !form) {
      setForm(toEditableProfileDraft(profile));
    }
  }, [loading, profile, form]);

  const yearOptions = options.years;
  const majorOptions = options.majors;

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !form) return;

    if (file.size > MAX_PROFILE_IMAGE_BYTES) {
      setFieldErrors((prev) => ({
        ...prev,
        image: "Profile picture must be 5MB or smaller.",
      }));
      return;
    }

    if (!file.type.startsWith("image/")) {
      setFieldErrors((prev) => ({
        ...prev,
        image: "Please upload a valid image file.",
      }));
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);
      setForm({ ...form, profilePicture: dataUrl });
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next.image;
        return next;
      });
    } catch (err: unknown) {
      const apiError = err as { message?: string };
      setFieldErrors((prev) => ({
        ...prev,
        image: apiError.message ?? "Could not read the selected image.",
      }));
    }
  }

  function updateLink(index: number, value: string) {
    if (!form) return;
    const nextLinks = form.links.map((link, current) => (current === index ? value : link));
    setForm({ ...form, links: nextLinks });
    clearFieldError(`link-${index}`);
  }

  function removeLink(index: number) {
    if (!form) return;
    const nextLinks = form.links.filter((_, current) => current !== index);
    setForm({ ...form, links: nextLinks.length > 0 ? nextLinks : [""] });
    clearFieldError(`link-${index}`);
  }

  function updateProject(index: number, key: keyof EditableProject, value: string) {
    if (!form) return;
    const nextProjects = form.projects.map((project, current) =>
      current === index ? { ...project, [key]: value } : project
    );
    setForm({ ...form, projects: nextProjects });
    clearFieldError(`project-${index}-name`);
    clearFieldError(`project-${index}-link`);
  }

  function validateForm() {
    if (!form) return false;

    const nextErrors: FieldErrors = {};

    if (!form.fullName.trim()) {
      nextErrors.fullName = "Please enter your full name.";
    }

    if (!form.yearLabel.trim() || form.yearLabel === "Year N/A") {
      nextErrors.yearLabel = "Please select your year of study.";
    }

    if (!form.majorLabel.trim()) {
      nextErrors.majorLabel = "Please select your major.";
    }

    if (countWords(form.bio) > MAX_BIO_WORDS) {
      nextErrors.bio = `Bio must be ${MAX_BIO_WORDS} words or fewer.`;
    }

    if (countWords(form.fypIdea) > MAX_FYP_IDEA_WORDS) {
      nextErrors.fypIdea = `FYP/thesis idea must be ${MAX_FYP_IDEA_WORDS} words or fewer.`;
    }

    form.links.forEach((link, index) => {
      const trimmed = link.trim();
      if (!trimmed) return;

      if (!isHttpUrl(trimmed)) {
        nextErrors[`link-${index}`] = "Please enter a valid http or https URL.";
      }
    });

    form.projects.forEach((project, index) => {
      const name = project.project_name.trim();
      const link = project.project_link.trim();

      if (!name && !link) return;

      if (!name) {
        nextErrors[`project-${index}-name`] = "Project name is required when a project row is used.";
      }

      if (link) {
        if (!isHttpUrl(link)) {
          nextErrors[`project-${index}-link`] = "Please enter a valid http or https project URL.";
        }
      }
    });

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function clearFieldError(key: string) {
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  async function handleSave() {
    if (!form) return;
    if (!validateForm()) {
      setFeedback(null);
      return;
    }

    const yearId = findOptionIdByLabel(form.yearLabel, yearOptions);
    const majorId = findOptionIdByLabel(form.majorLabel, majorOptions);
    const skillIds = resolveSelectedIds(form.skills, options.skills);
    const interestIds = resolveSelectedIds(form.interests, options.interests);

    if (!yearId) {
      setFieldErrors((prev) => ({ ...prev, yearLabel: "Please select your year of study." }));
      return;
    }

    if (!majorId) {
      setFieldErrors((prev) => ({ ...prev, majorLabel: "Please select your major." }));
      return;
    }

    if (skillIds.length === 0) {
      setFeedback({ type: "error", message: "Please keep at least one skill on your profile." });
      return;
    }

    if (interestIds.length === 0) {
      setFeedback({ type: "error", message: "Please keep at least one interest on your profile." });
      return;
    }

    let linksPayload;
    let projectsPayload;
    try {
      linksPayload = buildLinksPayload(form.links);
      projectsPayload = validateAndBuildProjects(form.projects);
    } catch (err: unknown) {
      const apiError = err as { message?: string };
      setFeedback({ type: "error", message: apiError.message ?? "Please check your profile details." });
      return;
    }

    setSaving(true);
    setFeedback(null);

    try {
      await updateMyProfile({
        fullName: form.fullName.trim(),
        yearId,
        majorId,
        skills: skillIds,
        interests: interestIds,
        bio: form.bio.trim() || null,
        fypIdea: form.fypIdea.trim() || null,
        links: linksPayload,
        projects: projectsPayload,
        profilePicture: form.profilePicture,
      });

      const refreshedProfile = unwrapMyProfile(await getMyProfile());
      const refreshedForm = toEditableProfileDraft(refreshedProfile);
      setForm(refreshedForm);
      setFeedback({ type: "success", message: "Profile changes saved successfully." });
    } catch (err: unknown) {
      const apiError = err as { message?: string };
      setFeedback({ type: "error", message: apiError.message ?? "Could not save your profile changes." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <ProfileShell
      title="Edit Profile"
      helper="Changes to skills, interests, projects, bio, FYP idea, or links will affect how your profile appears."
    >
      {loading || !form ? (
        <LoadingBlock label="Loading your editable profile..." />
      ) : (
        <>
          {error && <ErrorBanner message={error} />}
          {feedback?.type === "error" && <ErrorBanner message={feedback.message} />}

          <div style={edit.avatarWrap}>
            <ProfileAvatar image={form.profilePicture} label={form.fullName} size={108} textSize={30} />
          </div>

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={handleFileChange}
          />

          <div style={edit.uploadRow}>
            <button type="button" className="ghost-btn" style={edit.uploadBtn} onClick={() => fileRef.current?.click()}>
              Add / Update Profile Picture
            </button>
          </div>
          <FieldError message={fieldErrors.image} />

          <div style={formStyles.form}>
            <LabeledInput
              label="Full Name"
              value={form.fullName}
              onChange={(value) => {
                setForm({ ...form, fullName: value });
                clearFieldError("fullName");
              }}
              error={fieldErrors.fullName}
            />

            <LabeledSelect
              label="Year of Study"
              value={form.yearLabel}
              options={yearOptions}
              onChange={(value) => {
                setForm({ ...form, yearLabel: value });
                clearFieldError("yearLabel");
              }}
              placeholder="Select your year"
              error={fieldErrors.yearLabel}
            />

            <LabeledSelect
              label="Major"
              value={form.majorLabel}
              options={majorOptions}
              onChange={(value) => {
                setForm({ ...form, majorLabel: value });
                clearFieldError("majorLabel");
              }}
              placeholder="Select your major"
              error={fieldErrors.majorLabel}
            />

            <LabeledTextarea
              label="My Bio (Optional)"
              value={form.bio}
              onChange={(value) => {
                setForm({ ...form, bio: value });
                clearFieldError("bio");
              }}
              maxWords={MAX_BIO_WORDS}
              placeholder="Tell potential teammates about yourself..."
              error={fieldErrors.bio}
            />

            <LabeledTextarea
              label="FYP/Thesis Idea (Optional)"
              value={form.fypIdea}
              onChange={(value) => {
                setForm({ ...form, fypIdea: value });
                clearFieldError("fypIdea");
              }}
              maxWords={MAX_FYP_IDEA_WORDS}
              placeholder="Describe your final year project idea..."
              error={fieldErrors.fypIdea}
            />

            <LinksEditor
              links={form.links}
              onAdd={() => setForm({ ...form, links: [...form.links, ""] })}
              onChange={updateLink}
              onRemove={removeLink}
              fieldErrors={fieldErrors}
            />

            <ProjectsEditor
              projects={form.projects}
              onAdd={() =>
                setForm({
                  ...form,
                  projects: [...form.projects, { project_name: "", project_link: "" }],
                })
              }
              onChange={updateProject}
              fieldErrors={fieldErrors}
            />

            <SearchableMultiSelect
              label="My Skills (Select All That Apply)"
              placeholder="Search skills"
              options={options.skills}
              selectedIds={resolveSelectedIds(form.skills, options.skills)}
              onChange={(ids) => setForm({ ...form, skills: resolveSelectedLabels(ids, options.skills) })}
            />

            <SearchableMultiSelect
              label="My Interests (Select All That Apply)"
              placeholder="Search interests"
              options={options.interests}
              selectedIds={resolveSelectedIds(form.interests, options.interests)}
              onChange={(ids) => setForm({ ...form, interests: resolveSelectedLabels(ids, options.interests) })}
            />
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
    </ProfileShell>
  );
}

