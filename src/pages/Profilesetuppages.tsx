import React, { useRef, useState, useMemo, useEffect } from "react";
import {
  getProfileSetupOptions,
  logoutUser,
  setupProfile,
  type ProfileSetupOptions,
} from "../api/auth";

/**
 * FYPConnect — Profile Setup Pages
 *
 * State flows across pages via sessionStorage under the key "fypSetup".
 * Nothing is saved to the DB until "Complete Profile Setup" on Section D.
 * One atomic POST /profile/setup fires at the end.
 */

// ─────────────────────────────────────────────────────────────────────────────
//  Types
// ─────────────────────────────────────────────────────────────────────────────

type Option = { id: number; label: string };

type AcademicData = {
  fullName: string;
  yearId: number | "";
  majorId: number | "";
};

type MatchingData = {
  skillIds: number[];
  interestIds: number[];
};

type PreferenceData = {
  preferredMajorIds: number[];
  preferredSkillIds: number[];
  preferredInterestIds: number[];
};

type PersonalData = {
  bio: string;
  fypIdea: string;
  links: string[];
  projects: { project_name: string; project_link: string }[];
};

// ─────────────────────────────────────────────────────────────────────────────
//  sessionStorage helpers
// ─────────────────────────────────────────────────────────────────────────────

const STORAGE_KEY = "fypSetup";

type SetupDraft = {
  academic?: AcademicData;
  matching?: MatchingData;
  preferences?: PreferenceData;
};

function loadDraft(): SetupDraft {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveDraft(patch: Partial<SetupDraft>) {
  const current = loadDraft();
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ ...current, ...patch }));
}

function clearDraft() {
  sessionStorage.removeItem(STORAGE_KEY);
}

// ─────────────────────────────────────────────────────────────────────────────
//  Reference data loaded from the database
// ─────────────────────────────────────────────────────────────────────────────

const EMPTY_OPTIONS: ProfileSetupOptions = {
  years: [],
  majors: [],
  skills: [],
  interests: [],
};

function useSetupOptions() {
  const [options, setOptions] = useState<ProfileSetupOptions>(EMPTY_OPTIONS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadOptions() {
      try {
        const data = await getProfileSetupOptions();
        if (!active) return;

        const hasRequiredData =
          data.years.length > 0 &&
          data.majors.length > 0 &&
          data.skills.length > 0 &&
          data.interests.length > 0;

        if (!hasRequiredData) {
          setError("Profile setup reference data is missing in the database.");
          return;
        }

        setOptions(data);
      } catch (err: unknown) {
        const apiError = err as { message?: string };
        if (active) {
          setError(apiError.message ?? "Could not load profile setup data.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadOptions();

    return () => {
      active = false;
    };
  }, []);

  return { options, loading, error };
}

// ─────────────────────────────────────────────────────────────────────────────
//  SetupShell
// ─────────────────────────────────────────────────────────────────────────────

function SetupShell({
  sectionLabel,
  children,
}: {
  sectionLabel: string;
  children: React.ReactNode;
}) {
  async function handleLogout() {
    try {
      await logoutUser();
    } finally {
      clearDraft();
      window.location.href = "/login";
    }
  }

  return (
    <div style={sh.page}>
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        .setup-card { animation: fadeSlideUp 0.3s ease both; }
        .opt-row:hover { background: #f5f0fc !important; }
        .setup-btn-outline:hover:not(:disabled) { background: #f5f0fc !important; border-color: #45276e !important; }
        .setup-btn-primary:hover:not(:disabled) { background: #45276e !important; }
        .setup-btn-sm:hover { background: #f5f0fc !important; }
        .btn-logout-hover:hover { border-color: #e74c3c !important; color: #e74c3c !important; }
        input:focus, textarea:focus, select:focus {
          border-color: #5D3891 !important;
          box-shadow: 0 0 0 3px rgba(93,56,145,0.12) !important;
          outline: none !important;
          background: #fff !important;
        }
        select option:checked { background: #ede4f8; }
        select[size]:focus { border-color: #5D3891 !important; }
      `}</style>

      <nav style={sh.topnav}>
        <div style={sh.navBrand}>
          FYP<span style={{ color: "#F99417" }}>Connect</span>
        </div>
        <button
          className="btn-logout-hover"
          style={sh.btnLogout}
          type="button"
          onClick={handleLogout}
        >
          Logout
        </button>
      </nav>

      <div style={sh.body}>
        <div style={sh.card} className="setup-card">
          <div style={sh.warnBanner}>
            Please note that no partial progress is saved until the setup is complete.
          </div>
          <h2 style={sh.sectionHeading}>{sectionLabel}</h2>
          {children}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  SearchableMultiSelect
// ─────────────────────────────────────────────────────────────────────────────

function SetupDataState({
  sectionLabel,
  loading,
  error,
}: {
  sectionLabel: string;
  loading: boolean;
  error: string | null;
}) {
  if (!loading && !error) return null;

  return (
    <SetupShell sectionLabel={sectionLabel}>
      <div style={f.form}>
        {loading && <p style={f.helperText}>Loading setup data...</p>}
        {error && <div style={f.errorBanner} role="alert">{error}</div>}
      </div>
    </SetupShell>
  );
}

function SearchableMultiSelect({
  label,
  placeholder,
  options,
  selectedIds,
  onChange,
  listHeight = 132,
}: {
  label: string;
  placeholder: string;
  options: Option[];
  selectedIds: number[];
  onChange: (ids: number[]) => void;
  listHeight?: number;
}) {
  const [query, setQuery] = useState("");

  const displayOptions = useMemo<Option[]>(() => {
    return options.filter((o) =>
      o.label.toLowerCase().includes(query.toLowerCase())
    );
  }, [options, query]);

  function toggle(id: number) {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((x) => x !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  }

  return (
    <div style={f.fieldBlock}>
      <label style={f.label}>{label}</label>
      <div style={f.searchBar}>
        <SearchIcon />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          style={f.searchInput}
        />
        <ChevronIcon />
      </div>
      <div style={{ ...f.optionList, height: listHeight, overflowY: "auto" }}>
        {displayOptions.map((o) => {
          const sel = selectedIds.includes(o.id);
          return (
            <button
              key={o.id}
              type="button"
              className="opt-row"
              onClick={() => toggle(o.id)}
              style={{
                ...f.optionRow,
                background: sel ? "#ede4f8" : "#ffffff",
                fontWeight: sel ? 600 : 400,
                color: sel ? "#5D3891" : "#1a1a2e",
              }}
            >
              {o.label}
            </button>
          );
        })}
        {displayOptions.length === 0 && (
          <div style={f.noResults}>No matches found.</div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  LabeledTextarea
// ─────────────────────────────────────────────────────────────────────────────

function LabeledTextarea({
  label,
  value,
  onChange,
  maxWords,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  maxWords: number;
  placeholder?: string;
}) {
  const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0;
  const over = wordCount > maxWords;

  return (
    <div style={f.fieldBlock}>
      <div style={f.labelLineRow}>
        <label style={f.label}>{label}</label>
        <span style={f.horizRule} />
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        style={{ ...f.textarea, borderColor: over ? "#e74c3c" : "#E8E2E2" }}
      />
      <div style={{ ...f.wordCount, color: over ? "#e74c3c" : "#9999aa" }}>
        {wordCount}/{maxWords} words used
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Icons
// ─────────────────────────────────────────────────────────────────────────────

function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
      <circle cx="6.5" cy="6.5" r="5" stroke="#9999aa" strokeWidth="1.5" />
      <path d="M10.5 10.5l3 3" stroke="#9999aa" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0 }}>
      <path d="M2 4l4 4 4-4" stroke="#9999aa" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function AvatarPlaceholder() {
  return (
    <svg width="82" height="82" viewBox="0 0 82 82" fill="none">
      <circle cx="41" cy="41" r="37" stroke="#1a1a2e" strokeWidth="3" />
      <circle cx="41" cy="30" r="10" stroke="#1a1a2e" strokeWidth="3" />
      <path d="M20 58c4-9 13-14 21-14s17 5 21 14" stroke="#1a1a2e" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Links payload helper
// ─────────────────────────────────────────────────────────────────────────────

function buildLinksPayload(links: string[]) {
  const result: { github?: string; linkedin?: string; portfolio?: string } = {};
  for (const url of links) {
    const u = url.trim().toLowerCase();
    if (!u) continue;
    if (u.includes("github") && !result.github) {
      result.github = url.trim();
    } else if (u.includes("linkedin") && !result.linkedin) {
      result.linkedin = url.trim();
    } else if (!result.portfolio) {
      result.portfolio = url.trim();
    }
  }
  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
//  PAGE A — Academic Identity
// ─────────────────────────────────────────────────────────────────────────────

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
        sectionLabel="Section A: Academic Identity"
        loading={loading}
        error={optionsError}
      />
    );
  }

  return (
    <SetupShell sectionLabel="Section A: Academic Identity">
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
              <option value="" disabled>Select year…</option>
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

        <p style={f.infoText}>
          Browsing and matching are available to Juniors and Seniors only.
          You can still set up your profile for later use.
        </p>

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
          Setup My Matching Basis
        </button>
      </div>
    </SetupShell>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  PAGE B — Matching Basis
// ─────────────────────────────────────────────────────────────────────────────

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
        sectionLabel="Section B: Matching Basis"
        loading={loading}
        error={optionsError}
      />
    );
  }

  return (
    <SetupShell sectionLabel="Section B: Matching Basis">
      <div style={f.form}>
        <SearchableMultiSelect
          label="My Skills (Select All That Apply)"
          placeholder="Search skills"
          options={options.skills}
          selectedIds={form.skillIds}
          onChange={(ids) => setForm((p) => ({ ...p, skillIds: ids }))}
          listHeight={132}
        />

        <SearchableMultiSelect
          label="My Interests (Select All That Apply)"
          placeholder="Search interests"
          options={options.interests}
          selectedIds={form.interestIds}
          onChange={(ids) => setForm((p) => ({ ...p, interestIds: ids }))}
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
          Setup My Team Preferences
        </button>
      </div>
    </SetupShell>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  PAGE C — Discovery Preferences
// ─────────────────────────────────────────────────────────────────────────────

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
        sectionLabel="Section C: Discovery Preferences (Optional)"
        loading={loading}
        error={optionsError}
      />
    );
  }

  return (
    <SetupShell sectionLabel="Section C: Discovery Preferences (Optional)">
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
          listHeight={155}
        />

        <SearchableMultiSelect
          label="Preferred Interests (Select All That Apply) (Optional)"
          placeholder="Search interests that you're looking for"
          options={options.interests}
          selectedIds={form.preferredInterestIds}
          onChange={(ids) => setForm((p) => ({ ...p, preferredInterestIds: ids }))}
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
          Add Additional Details About Me
        </button>
      </div>
    </SetupShell>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  PAGE D — Personal Context + final submit
// ─────────────────────────────────────────────────────────────────────────────

export function ProfileSetupPersonalPage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreviewUrl(URL.createObjectURL(file));
  }

  function updateLink(i: number, v: string) {
    setForm((p) => ({ ...p, links: p.links.map((l, idx) => (idx === i ? v : l)) }));
  }

  function removeLink(i: number) {
    setForm((p) => ({ ...p, links: p.links.filter((_, idx) => idx !== i) }));
  }

  function updateProject(i: number, field: "project_name" | "project_link", v: string) {
    setForm((p) => ({
      ...p,
      projects: p.projects.map((pr, idx) =>
        idx === i ? { ...pr, [field]: v } : pr
      ),
    }));
  }

  async function handleComplete() {
    const draft = loadDraft();

    const academic = draft.academic;
    const matching = draft.matching;

    // Guard: if somehow landed here without completing earlier sections
    if (
      !academic ||
      !academic.fullName.trim() ||
      academic.yearId === "" ||
      academic.majorId === ""
    ) {
      setError("Missing academic info. Please go back to Section A.");
      return;
    }
    if (!matching || matching.skillIds.length === 0 || matching.interestIds.length === 0) {
      setError("Missing skills/interests. Please go back to Section B.");
      return;
    }

    const preferences = draft.preferences ?? {
      preferredMajorIds: [],
      preferredSkillIds: [],
      preferredInterestIds: [],
    };

    // Filter out empty projects
    const cleanProjects = form.projects.filter((p) => p.project_name.trim());

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
      links: buildLinksPayload(form.links),
      projects: cleanProjects,
      profilePicture: null, // no upload endpoint yet
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
    <SetupShell sectionLabel="Section D: Personal Context (Optional)">
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
        </div>

        <LabeledTextarea
          label="My Bio (Optional)"
          value={form.bio}
          onChange={(v) => setForm((p) => ({ ...p, bio: v }))}
          maxWords={100}
          placeholder="Tell potential teammates about yourself…"
        />

        <LabeledTextarea
          label="FYP/Thesis Idea (Optional)"
          value={form.fypIdea}
          onChange={(v) => setForm((p) => ({ ...p, fypIdea: v }))}
          maxWords={120}
          placeholder="Describe your final year project idea…"
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
                ×
              </button>
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
              <div key={i} style={f.tableRow}>
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
          {submitting ? "Saving…" : "Complete Profile Setup"}
        </button>

      </div>
    </SetupShell>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Shell styles
// ─────────────────────────────────────────────────────────────────────────────

const sh: Record<string, React.CSSProperties> = {
  page: {
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    fontFamily: "'DM Sans', sans-serif",
    background: "#F5F5F5",
  },
  topnav: {
    height: "58px",
    flexShrink: 0,
    background: "#ffffff",
    borderBottom: "1px solid #E8E2E2",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 24px",
    boxShadow: "0 2px 12px rgba(93,56,145,0.06)",
    zIndex: 50,
  },
  navBrand: {
    fontFamily: "'Fraunces', serif",
    fontWeight: 700,
    fontSize: "20px",
    color: "#5D3891",
    letterSpacing: "-0.4px",
    userSelect: "none",
  },
  btnLogout: {
    padding: "7px 18px",
    border: "1.5px solid #E8E2E2",
    borderRadius: "8px",
    background: "#ffffff",
    fontFamily: "'DM Sans', sans-serif",
    fontSize: "13px",
    fontWeight: 600,
    color: "#6b6b7b",
    cursor: "pointer",
    transition: "all 0.15s ease",
  },
  body: {
    flex: 1,
    overflowY: "auto",
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
    padding: "36px 20px 60px",
  },
  card: {
    background: "#ffffff",
    borderRadius: "16px",
    padding: "36px 44px 44px",
    width: "100%",
    maxWidth: "520px",
    boxShadow: "0 8px 40px rgba(93,56,145,0.12)",
    border: "1px solid #E8E2E2",
  },
  warnBanner: {
    background: "#F99417",
    color: "#ffffff",
    borderRadius: "8px",
    padding: "10px 14px",
    fontSize: "13px",
    fontWeight: 600,
    marginBottom: "24px",
    lineHeight: "1.4",
    textAlign: "center",
    fontStyle: "italic",
    animation: "fadeIn 0.2s ease",
  },
  sectionHeading: {
    fontFamily: "'Fraunces', serif",
    fontWeight: 700,
    fontSize: "20px",
    color: "#5D3891",
    textDecoration: "underline",
    textAlign: "center",
    marginBottom: "28px",
    letterSpacing: "-0.3px",
  },
};

// ─────────────────────────────────────────────────────────────────────────────
//  Form element styles
// ─────────────────────────────────────────────────────────────────────────────

const f: Record<string, React.CSSProperties> = {
  form: { display: "flex", flexDirection: "column" },
  fieldBlock: { marginBottom: "20px" },
  label: {
    display: "block",
    fontSize: "13px",
    fontWeight: 600,
    color: "#1a1a2e",
    letterSpacing: "0.1px",
    marginBottom: "7px",
  },
  input: {
    width: "100%",
    padding: "11px 14px",
    border: "1.5px solid #E8E2E2",
    borderRadius: "8px",
    fontSize: "14px",
    fontFamily: "'DM Sans', sans-serif",
    color: "#1a1a2e",
    background: "#fafafa",
    outline: "none",
    transition: "border-color 0.15s ease, box-shadow 0.15s ease",
    boxSizing: "border-box",
  },
  selectWrap: { position: "relative", display: "flex", alignItems: "center" },
  select: {
    width: "100%",
    padding: "11px 36px 11px 14px",
    border: "1.5px solid #E8E2E2",
    borderRadius: "8px",
    fontSize: "14px",
    fontFamily: "'DM Sans', sans-serif",
    color: "#1a1a2e",
    background: "#fafafa",
    outline: "none",
    appearance: "none",
    cursor: "pointer",
    transition: "border-color 0.15s ease, box-shadow 0.15s ease",
  },
  selectChevron: {
    position: "absolute",
    right: "12px",
    pointerEvents: "none",
    display: "flex",
    alignItems: "center",
  },
  listbox: {
    width: "100%",
    border: "1.5px solid #E8E2E2",
    borderRadius: "8px",
    fontSize: "14px",
    fontFamily: "'DM Sans', sans-serif",
    color: "#1a1a2e",
    background: "#fafafa",
    outline: "none",
    padding: "4px 0",
    cursor: "pointer",
    transition: "border-color 0.15s ease, box-shadow 0.15s ease",
  },
  searchBar: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "0 12px",
    height: "40px",
    border: "1.5px solid #E8E2E2",
    borderBottom: "none",
    borderTopLeftRadius: "8px",
    borderTopRightRadius: "8px",
    background: "#fafafa",
  },
  searchInput: {
    flex: 1,
    border: "none",
    outline: "none",
    fontSize: "14px",
    fontFamily: "'DM Sans', sans-serif",
    color: "#1a1a2e",
    background: "transparent",
  },
  optionList: {
    border: "1.5px solid #E8E2E2",
    borderBottomLeftRadius: "8px",
    borderBottomRightRadius: "8px",
    background: "#ffffff",
  },
  optionRow: {
    width: "100%",
    display: "block",
    border: "none",
    borderBottom: "1px solid #f0ecf8",
    textAlign: "left",
    padding: "7px 12px",
    fontSize: "14px",
    fontFamily: "'DM Sans', sans-serif",
    cursor: "pointer",
    transition: "background 0.1s ease",
  },
  noResults: { padding: "10px 12px", fontSize: "13px", color: "#9999aa" },
  labelLineRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "0",
  },
  horizRule: { flex: 1, height: "1px", background: "#6b6b7b", opacity: 0.3 },
  textarea: {
    width: "100%",
    padding: "10px 14px",
    border: "1.5px solid #E8E2E2",
    borderTop: "none",
    borderBottomLeftRadius: "8px",
    borderBottomRightRadius: "8px",
    fontSize: "14px",
    fontFamily: "'DM Sans', sans-serif",
    color: "#1a1a2e",
    background: "#fafafa",
    outline: "none",
    resize: "none",
    lineHeight: "1.5",
    transition: "border-color 0.15s ease",
    boxSizing: "border-box",
  },
  wordCount: {
    textAlign: "right",
    fontSize: "12px",
    marginTop: "5px",
    fontStyle: "italic",
    transition: "color 0.15s ease",
  },
  infoText: {
    fontSize: "13px",
    color: "#6b6b7b",
    textAlign: "center",
    lineHeight: "1.5",
    marginBottom: "16px",
  },
  helperText: {
    fontSize: "13px",
    color: "#6b6b7b",
    textAlign: "center",
    lineHeight: "1.5",
    marginBottom: "18px",
    marginTop: "-4px",
  },
  restrictionNote: {
    marginBottom: "16px",
    padding: "11px 14px",
    borderRadius: "8px",
    background: "#f5f0fc",
    color: "#5D3891",
    fontSize: "13px",
    lineHeight: "1.5",
    textAlign: "center",
    border: "1px solid #ddd3eb",
    fontWeight: 500,
  },
  errorBanner: {
    background: "#F99417",
    color: "#ffffff",
    borderRadius: "8px",
    padding: "10px 14px",
    fontSize: "13px",
    fontWeight: 600,
    marginBottom: "18px",
    lineHeight: "1.4",
    animation: "fadeIn 0.2s ease",
  },
  btnPrimary: {
    display: "block",
    width: "100%",
    padding: "13px",
    background: "#5D3891",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    fontSize: "15px",
    fontWeight: 600,
    fontFamily: "'DM Sans', sans-serif",
    cursor: "pointer",
    transition: "background 0.15s ease",
    marginTop: "4px",
  },
  btnOutline: {
    display: "block",
    margin: "0 auto",
    minWidth: "210px",
    padding: "12px 22px",
    border: "1.5px solid #5D3891",
    borderRadius: "8px",
    background: "#ffffff",
    color: "#5D3891",
    fontFamily: "'DM Sans', sans-serif",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
    transition: "background 0.15s ease, border-color 0.15s ease",
  },
  btnSm: {
    padding: "8px 16px",
    border: "1.5px solid #E8E2E2",
    borderRadius: "8px",
    background: "#ffffff",
    color: "#1a1a2e",
    fontFamily: "'DM Sans', sans-serif",
    fontSize: "13px",
    fontWeight: 600,
    cursor: "pointer",
    transition: "background 0.15s ease",
  },
  avatarWrap: { display: "flex", justifyContent: "center", marginBottom: "14px" },
  avatarImg: {
    width: "82px",
    height: "82px",
    borderRadius: "50%",
    objectFit: "cover",
    border: "2px solid #ddd3eb",
  },
  linkRow: { position: "relative", marginBottom: "10px" },
  removeLinkBtn: {
    position: "absolute",
    right: "10px",
    top: "50%",
    transform: "translateY(-50%)",
    width: "26px",
    height: "26px",
    border: "none",
    background: "transparent",
    fontSize: "20px",
    lineHeight: "1",
    cursor: "pointer",
    color: "#6b6b7b",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 0,
  },
  rightAlign: { display: "flex", justifyContent: "flex-end", marginTop: "8px" },
  tableWrap: {
    border: "1.5px solid #E8E2E2",
    borderRadius: "8px",
    overflow: "hidden",
    background: "#ffffff",
  },
  tableHead: {
    display: "grid",
    gridTemplateColumns: "1fr 1.5fr",
    background: "#f5f0fc",
    borderBottom: "1.5px solid #E8E2E2",
  },
  tableHeadLeft: {
    padding: "9px 12px",
    fontSize: "13px",
    fontWeight: 600,
    color: "#5D3891",
    borderRight: "1.5px solid #E8E2E2",
    textAlign: "center",
  },
  tableHeadRight: {
    padding: "9px 12px",
    fontSize: "13px",
    fontWeight: 600,
    color: "#5D3891",
    textAlign: "center",
  },
  tableRow: { display: "grid", gridTemplateColumns: "1fr 1.5fr" },
  tableInputLeft: {
    border: "none",
    borderRight: "1.5px solid #E8E2E2",
    borderBottom: "1px solid #f0ecf8",
    padding: "9px 12px",
    fontSize: "14px",
    fontFamily: "'DM Sans', sans-serif",
    color: "#1a1a2e",
    background: "#fafafa",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
  },
  tableInputRight: {
    border: "none",
    borderBottom: "1px solid #f0ecf8",
    padding: "9px 12px",
    fontSize: "14px",
    fontFamily: "'DM Sans', sans-serif",
    color: "#1a1a2e",
    background: "#fafafa",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
  },
};
