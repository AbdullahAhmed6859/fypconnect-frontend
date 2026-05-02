// Multi-step profile setup flow used before a student can access matching.
import React, { useRef, useState } from "react";
import { setupProfile } from "../../api/profileApi";
import {
  AvatarPlaceholder,
  FieldError,
  LabeledTextarea,
  MAX_BIO_WORDS,
  MAX_FYP_IDEA_WORDS,
  MAX_PROFILE_IMAGE_BYTES,
  SearchableMultiSelect,
  SetupDataState,
  SetupShell,
  buildLinksPayload,
  ChevronIcon,
  classifyLink,
  clearDraft,
  countWords,
  f,
  normalizeUrl,
  loadDraft,
  readFileAsDataUrl,
  saveDraft,
  useSetupOptions,
  validateAndBuildProjects,
  type AcademicData,
  type FieldErrors,
  type MatchingData,
  type PersonalData,
  type PreferenceData,
} from "./shared";
export function ProfileSetupAcademicPage() {
  const { options, loading, error: optionsError } = useSetupOptions();
  const draft = loadDraft();
  const [form, setForm] = useState<AcademicData>(
    draft.academic ?? { fullName: "", yearId: "", majorId: "" }
  );
  const [error, setError] = useState<string | null>(null);

  const selectedYear = options.years.find((year) => year.id === form.yearId);
  const isRestricted =
    selectedYear?.value !== undefined && selectedYear.value <= 2;

  function handleNext() {
    if (!form.fullName.trim()) {
      setError("Please enter your full name.");
      return;
    }
    if (form.yearId === "") {
      setError("Please select your year of study.");
      return;
    }
    if (form.majorId === "") {
      setError("Please select your major.");
      return;
    }
    setError(null);
    saveDraft({ academic: form });
    window.location.href = "/profile/setup/matching";
  }

  if (loading || optionsError) {
    return (
      <SetupDataState
        sectionLabel="Step 1: Your Basic Info"
        loading={loading}
        error={optionsError}
      />
    );
  }

  return (
    <SetupShell sectionLabel="Step 1: Your Basic Info">
      <div style={f.form}>
        <div style={f.fieldBlock}>
          <label style={f.label}>Full Name</label>
          <input
            type="text"
            placeholder="Your full name"
            value={form.fullName}
            onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))}
            style={f.input}
            autoFocus
          />
        </div>

        <div style={f.fieldBlock}>
          <label style={f.label}>Year Of Study</label>
          <div style={f.selectWrap}>
            <select
              value={form.yearId}
              onChange={(e) =>
                setForm((p) => ({ ...p, yearId: Number(e.target.value) }))
              }
              style={f.select}
            >
              <option value="" disabled>Select year...</option>
              {options.years.map((y) => (
                <option key={y.id} value={y.id}>{y.label}</option>
              ))}
            </select>
            <span style={f.selectChevron}><ChevronIcon /></span>
          </div>
        </div>

        <div style={f.fieldBlock}>
          <label style={f.label}>Major</label>
          <select
            value={form.majorId}
            onChange={(e) =>
              setForm((p) => ({ ...p, majorId: Number(e.target.value) }))
            }
            size={6}
            style={f.listbox}
          >
            {options.majors.map((m) => (
              <option key={m.id} value={m.id}>{m.label}</option>
            ))}
          </select>
        </div>

        {isRestricted && (
          <div style={f.restrictionNote}>
            You can complete setup now, but browsing will stay locked until
            you become a Junior or Senior.
          </div>
        )}

        {error && (
          <div style={f.errorBanner} role="alert">{error}</div>
        )}

        <button
          type="button"
          className="setup-btn-outline"
          style={f.btnOutline}
          onClick={handleNext}
        >
          Add My Skills and Interests
        </button>
      </div>
    </SetupShell>
  );
}

export function ProfileSetupMatchingPage() {
  const { options, loading, error: optionsError } = useSetupOptions();
  const draft = loadDraft();
  const [form, setForm] = useState<MatchingData>(
    draft.matching ?? { skillIds: [], interestIds: [] }
  );
  const [error, setError] = useState<string | null>(null);

  const canProceed = form.skillIds.length > 0 && form.interestIds.length > 0;

  function handleNext() {
    if (!canProceed) {
      setError("Please select at least one skill and one interest.");
      return;
    }
    setError(null);
    saveDraft({ matching: form });
    window.location.href = "/profile/setup/preferences";
  }

  if (loading || optionsError) {
    return (
      <SetupDataState
        sectionLabel="Step 2: Your Skills and Interests"
        loading={loading}
        error={optionsError}
      />
    );
  }

  return (
    <SetupShell sectionLabel="Step 2: Your Skills and Interests">
      <div style={f.form}>
        <SearchableMultiSelect
          label="My Skills (Select All That Apply)"
          placeholder="Search skills"
          options={options.skills}
          selectedIds={form.skillIds}
          onChange={(ids) => setForm((p) => ({ ...p, skillIds: ids }))}
          countKind="skill"
          listHeight={132}
        />

        <SearchableMultiSelect
          label="My Interests (Select All That Apply)"
          placeholder="Search interests"
          options={options.interests}
          selectedIds={form.interestIds}
          onChange={(ids) => setForm((p) => ({ ...p, interestIds: ids }))}
          countKind="interest"
          listHeight={110}
        />

        <p style={f.helperText}>
          Select at least one skill and one interest.{" "}
          <em>You can update these later.</em>
        </p>

        {error && (
          <div style={f.errorBanner} role="alert">{error}</div>
        )}

        <button
          type="button"
          className="setup-btn-outline"
          style={{
            ...f.btnOutline,
            opacity: canProceed ? 1 : 0.45,
            cursor: canProceed ? "pointer" : "not-allowed",
          }}
          onClick={handleNext}
        >
          Choose Teammate Preferences
        </button>
      </div>
    </SetupShell>
  );
}

export function ProfileSetupPreferencesPage() {
  const { options, loading, error: optionsError } = useSetupOptions();
  const draft = loadDraft();
  const [form, setForm] = useState<PreferenceData>(
    draft.preferences ?? {
      preferredMajorIds: [],
      preferredSkillIds: [],
      preferredInterestIds: [],
    }
  );

  function handleNext() {
    saveDraft({ preferences: form });
    window.location.href = "/profile/setup/personal";
  }

  if (loading || optionsError) {
    return (
      <SetupDataState
        sectionLabel="Step 3: Teammate Preferences (Optional)"
        loading={loading}
        error={optionsError}
      />
    );
  }

  return (
    <SetupShell sectionLabel="Step 3: Teammate Preferences (Optional)">
      <div style={f.form}>
        <SearchableMultiSelect
          label="Preferred Majors (Select All That Apply) (Optional)"
          placeholder="Search team members' majors"
          options={options.majors}
          selectedIds={form.preferredMajorIds}
          onChange={(ids) => setForm((p) => ({ ...p, preferredMajorIds: ids }))}
          listHeight={148}
        />

        <SearchableMultiSelect
          label="Preferred Skills (Select All That Apply) (Optional)"
          placeholder="Search skills that you're looking for"
          options={options.skills}
          selectedIds={form.preferredSkillIds}
          onChange={(ids) => setForm((p) => ({ ...p, preferredSkillIds: ids }))}
          countKind="skill"
          listHeight={155}
        />

        <SearchableMultiSelect
          label="Preferred Interests (Select All That Apply) (Optional)"
          placeholder="Search interests that you're looking for"
          options={options.interests}
          selectedIds={form.preferredInterestIds}
          onChange={(ids) => setForm((p) => ({ ...p, preferredInterestIds: ids }))}
          countKind="interest"
          listHeight={112}
        />

        <p style={f.helperText}>
          All preferences are optional. These filter who you see while browsing.{" "}
          <em>You can update preferences later.</em>
        </p>

        <button
          type="button"
          className="setup-btn-outline"
          style={f.btnOutline}
          onClick={handleNext}
        >
          Add Profile Details
        </button>
      </div>
    </SetupShell>
  );
}

export function ProfileSetupPersonalPage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [profilePictureData, setProfilePictureData] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const [form, setForm] = useState<PersonalData>({
    bio: "",
    fypIdea: "",
    links: [""],
    projects: [
      { project_name: "", project_link: "" },
      { project_name: "", project_link: "" },
      { project_name: "", project_link: "" },
    ],
  });

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next.image;
      return next;
    });

    if (!file.type.startsWith("image/")) {
      setPreviewUrl(null);
      setProfilePictureData(null);
      setFieldErrors((prev) => ({ ...prev, image: "Please upload a valid image file." }));
      return;
    }

    if (file.size > MAX_PROFILE_IMAGE_BYTES) {
      setPreviewUrl(null);
      setProfilePictureData(null);
      setFieldErrors((prev) => ({ ...prev, image: "Profile picture must be 5 MB or smaller." }));
      return;
    }

    try {
      setProfilePictureData(await readFileAsDataUrl(file));
      setPreviewUrl(URL.createObjectURL(file));
    } catch (err: unknown) {
      const e = err as { message?: string };
      setFieldErrors((prev) => ({
        ...prev,
        image: e.message ?? "Could not read that image file.",
      }));
    }
  }

  function updateLink(i: number, v: string) {
    setForm((p) => ({ ...p, links: p.links.map((l, idx) => (idx === i ? v : l)) }));
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[`link-${i}`];
      return next;
    });
  }

  function removeLink(i: number) {
    setForm((p) => ({ ...p, links: p.links.filter((_, idx) => idx !== i) }));
    setFieldErrors((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((key) => {
        if (key.startsWith("link-")) delete next[key];
      });
      return next;
    });
  }

  function updateProject(i: number, field: "project_name" | "project_link", v: string) {
    setForm((p) => ({
      ...p,
      projects: p.projects.map((pr, idx) =>
        idx === i ? { ...pr, [field]: v } : pr
      ),
    }));
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[`project-${i}-name`];
      delete next[`project-${i}-link`];
      return next;
    });
  }

  function validatePersonalDetails() {
    const errors: FieldErrors = {};

    if (countWords(form.bio) > MAX_BIO_WORDS) {
      errors.bio = `Bio must be ${MAX_BIO_WORDS} words or fewer.`;
    }
    if (countWords(form.fypIdea) > MAX_FYP_IDEA_WORDS) {
      errors.fypIdea = `FYP/thesis idea must be ${MAX_FYP_IDEA_WORDS} words or fewer.`;
    }

    const seenLinks = new Set<string>();
    const seenKinds = new Set<string>();
    form.links.forEach((link, index) => {
      if (!link.trim()) return;
      try {
        const normalized = normalizeUrl(link, `Link ${index + 1}`);
        const kind = classifyLink(normalized);
        if (seenLinks.has(normalized.toLowerCase())) {
          errors[`link-${index}`] = "This link is already added.";
        } else if (seenKinds.has(kind)) {
          errors[`link-${index}`] = `Only one ${kind} link can be added.`;
        }
        seenLinks.add(normalized.toLowerCase());
        seenKinds.add(kind);
      } catch (err: unknown) {
        errors[`link-${index}`] = (err as Error).message;
      }
    });

    const seenProjectNames = new Set<string>();
    const seenProjectLinks = new Set<string>();
    form.projects.forEach((project, index) => {
      const name = project.project_name.trim();
      const link = project.project_link.trim();
      if (!name && !link) return;

      if (!name) {
        errors[`project-${index}-name`] = "Add a project name or clear this row.";
      } else if (seenProjectNames.has(name.toLowerCase())) {
        errors[`project-${index}-name`] = "This project name is already added.";
      }
      if (name) seenProjectNames.add(name.toLowerCase());

      if (link) {
        try {
          const normalized = normalizeUrl(link, `Project ${index + 1} link`);
          if (seenProjectLinks.has(normalized.toLowerCase())) {
            errors[`project-${index}-link`] = "This project link is already added.";
          }
          seenProjectLinks.add(normalized.toLowerCase());
        } catch (err: unknown) {
          errors[`project-${index}-link`] = (err as Error).message;
        }
      }
    });

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleComplete() {
    const draft = loadDraft();

    const academic = draft.academic;
    const matching = draft.matching;
    if (
      !academic ||
      !academic.fullName.trim() ||
      academic.yearId === "" ||
      academic.majorId === ""
    ) {
      setError("Missing basic info. Please go back to Step 1.");
      return;
    }
    if (!matching || matching.skillIds.length === 0 || matching.interestIds.length === 0) {
      setError("Missing skills/interests. Please go back to Step 2.");
      return;
    }

    if (!validatePersonalDetails()) {
      setError(null);
      return;
    }

    const preferences = draft.preferences ?? {
      preferredMajorIds: [],
      preferredSkillIds: [],
      preferredInterestIds: [],
    };

    let linksPayload;
    let cleanProjects;
    try {
      linksPayload = buildLinksPayload(form.links);
      cleanProjects = validateAndBuildProjects(form.projects);
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message ?? "Please check your profile details.");
      return;
    }

    const payload = {
      fullName: academic.fullName.trim(),
      yearId: academic.yearId as number,
      majorId: academic.majorId as number,
      skills: matching.skillIds,
      interests: matching.interestIds,
      preferredMajorIds: preferences.preferredMajorIds,
      preferredSkillIds: preferences.preferredSkillIds,
      preferredInterestIds: preferences.preferredInterestIds,
      bio: form.bio.trim() || null,
      fypIdea: form.fypIdea.trim() || null,
      links: linksPayload,
      projects: cleanProjects,
      profilePicture: profilePictureData,
    };

    setSubmitting(true);
    setError(null);

    try {
      await setupProfile(payload);
      clearDraft();
      window.location.href = "/dashboard";
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message ?? "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SetupShell sectionLabel="Step 4: Profile Details (Optional)">
      <div style={f.form}>

        <div style={f.avatarWrap}>
          {previewUrl ? (
            <img src={previewUrl} alt="Profile preview" style={f.avatarImg} />
          ) : (
            <AvatarPlaceholder />
          )}
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={handleFileChange}
        />

        <div style={{ textAlign: "center", marginBottom: "22px" }}>
          <button
            type="button"
            className="setup-btn-sm"
            style={f.btnSm}
            onClick={() => fileRef.current?.click()}
          >
            Upload Profile Picture (Optional)
          </button>
          <FieldError message={fieldErrors.image} />
        </div>

        <LabeledTextarea
          label="My Bio (Optional)"
          value={form.bio}
          onChange={(v) => {
            setForm((p) => ({ ...p, bio: v }));
            setFieldErrors((prev) => {
              const next = { ...prev };
              delete next.bio;
              return next;
            });
          }}
          maxWords={MAX_BIO_WORDS}
          placeholder="Tell potential teammates about yourself..."
          error={fieldErrors.bio}
        />

        <LabeledTextarea
          label="FYP/Thesis Idea (Optional)"
          value={form.fypIdea}
          onChange={(v) => {
            setForm((p) => ({ ...p, fypIdea: v }));
            setFieldErrors((prev) => {
              const next = { ...prev };
              delete next.fypIdea;
              return next;
            });
          }}
          maxWords={MAX_FYP_IDEA_WORDS}
          placeholder="Describe your final year project idea..."
          error={fieldErrors.fypIdea}
        />

        <div style={f.fieldBlock}>
          <label style={f.label}>My Links (Optional)</label>
          {form.links.map((link, i) => (
            <div key={i} style={f.linkRow}>
              <input
                type="text"
                value={link}
                onChange={(e) => updateLink(i, e.target.value)}
                style={{ ...f.input, paddingRight: "40px", marginBottom: 0 }}
                placeholder="Profile or portfolio URL"
              />
              <button
                type="button"
                style={f.removeLinkBtn}
                onClick={() => removeLink(i)}
                aria-label="Remove link"
              >
                x
              </button>
              <FieldError message={fieldErrors[`link-${i}`]} />
            </div>
          ))}
          <div style={f.rightAlign}>
            <button
              type="button"
              className="setup-btn-sm"
              style={f.btnSm}
              onClick={() => setForm((p) => ({ ...p, links: [...p.links, ""] }))}
            >
              Add Another Link
            </button>
          </div>
        </div>

        <div style={f.fieldBlock}>
          <label style={f.label}>Featured Projects (Optional)</label>
          <div style={f.tableWrap}>
            <div style={f.tableHead}>
              <div style={f.tableHeadLeft}>Project Name</div>
              <div style={f.tableHeadRight}>URL (Github/Portfolio/Other)</div>
            </div>
            {form.projects.map((pr, i) => (
              <React.Fragment key={i}>
                <div style={f.tableRow}>
                  <input
                    type="text"
                    value={pr.project_name}
                    onChange={(e) => updateProject(i, "project_name", e.target.value)}
                    style={f.tableInputLeft}
                  />
                  <input
                    type="text"
                    value={pr.project_link}
                    onChange={(e) => updateProject(i, "project_link", e.target.value)}
                    style={f.tableInputRight}
                  />
                </div>
                {(fieldErrors[`project-${i}-name`] || fieldErrors[`project-${i}-link`]) && (
                  <div style={f.tableErrorRow}>
                    <FieldError message={fieldErrors[`project-${i}-name`]} />
                    <FieldError message={fieldErrors[`project-${i}-link`]} />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
          <div style={f.rightAlign}>
            <button
              type="button"
              className="setup-btn-sm"
              style={f.btnSm}
              onClick={() =>
                setForm((p) => ({
                  ...p,
                  projects: [...p.projects, { project_name: "", project_link: "" }],
                }))
              }
            >
              Add Another Project
            </button>
          </div>
        </div>

        <p style={f.helperText}>All details can be updated later.</p>

        {error && (
          <div style={f.errorBanner} role="alert">{error}</div>
        )}

        <button
          type="button"
          className="setup-btn-primary"
          style={{
            ...f.btnPrimary,
            opacity: submitting ? 0.7 : 1,
            cursor: submitting ? "not-allowed" : "pointer",
          }}
          disabled={submitting}
          onClick={handleComplete}
        >
          {submitting ? "Saving..." : "Complete Profile Setup"}
        </button>

      </div>
    </SetupShell>
  );
}
