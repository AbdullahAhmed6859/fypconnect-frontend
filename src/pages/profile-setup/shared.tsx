/* eslint-disable react-refresh/only-export-components */
import React, { useEffect, useMemo, useState } from "react";
import { logoutUser } from "../../api/authApi";
import {
  getProfileSetupOptions,
  type ProfileSetupOptions,
} from "../../api/profileApi";
export type Option = { id: number; label: string; userCount?: number };

export type AcademicData = {
  fullName: string;
  yearId: number | "";
  majorId: number | "";
};

export type MatchingData = {
  skillIds: number[];
  interestIds: number[];
};

export type PreferenceData = {
  preferredMajorIds: number[];
  preferredSkillIds: number[];
  preferredInterestIds: number[];
};

export type PersonalData = {
  bio: string;
  fypIdea: string;
  links: string[];
  projects: { project_name: string; project_link: string }[];
};

export type FieldErrors = Record<string, string>;

export const MAX_PROFILE_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_BIO_WORDS = 100;
export const MAX_FYP_IDEA_WORDS = 120;

const STORAGE_KEY = "fypSetup";

export type SetupDraft = {
  academic?: AcademicData;
  matching?: MatchingData;
  preferences?: PreferenceData;
};

export function loadDraft(): SetupDraft {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveDraft(patch: Partial<SetupDraft>) {
  const current = loadDraft();
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ ...current, ...patch }));
}

export function clearDraft() {
  sessionStorage.removeItem(STORAGE_KEY);
}

const EMPTY_OPTIONS: ProfileSetupOptions = {
  years: [],
  majors: [],
  skills: [],
  interests: [],
};

export function useSetupOptions() {
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

export function SetupShell({
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

export function SetupDataState({
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

export function SearchableMultiSelect({
  label,
  placeholder,
  options,
  selectedIds,
  onChange,
  countKind,
  listHeight = 132,
}: {
  label: string;
  placeholder: string;
  options: Option[];
  selectedIds: number[];
  onChange: (ids: number[]) => void;
  countKind?: "skill" | "interest";
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
              <span>{o.label}</span>
              {countKind && o.userCount !== undefined && (
                <span style={f.optionCount}>
                  {" "}
                  ({o.userCount} {o.userCount === 1 ? "user" : "users"} share this {countKind})
                </span>
              )}
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

export function LabeledTextarea({
  label,
  value,
  onChange,
  maxWords,
  placeholder,
  error,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  maxWords: number;
  placeholder?: string;
  error?: string;
}) {
  const wordCount = countWords(value);
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
      <FieldError message={error} />
    </div>
  );
}

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <div style={f.fieldError} role="alert">
      {message}
    </div>
  );
}

export function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
      <circle cx="6.5" cy="6.5" r="5" stroke="#9999aa" strokeWidth="1.5" />
      <path d="M10.5 10.5l3 3" stroke="#9999aa" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function ChevronIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0 }}>
      <path d="M2 4l4 4 4-4" stroke="#9999aa" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function AvatarPlaceholder() {
  return (
    <svg width="82" height="82" viewBox="0 0 82 82" fill="none">
      <circle cx="41" cy="41" r="37" stroke="#1a1a2e" strokeWidth="3" />
      <circle cx="41" cy="30" r="10" stroke="#1a1a2e" strokeWidth="3" />
      <path d="M20 58c4-9 13-14 21-14s17 5 21 14" stroke="#1a1a2e" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function buildLinksPayload(links: string[]) {
  const result: { github?: string; linkedin?: string; portfolio?: string } = {};
  const seenUrls = new Set<string>();
  const seenKinds = new Set<string>();

  for (const [index, rawUrl] of links.entries()) {
    if (!rawUrl.trim()) continue;

    const url = normalizeUrl(rawUrl, `Link ${index + 1}`);
    const kind = classifyLink(url);

    if (seenUrls.has(url.toLowerCase())) {
      throw new Error("Please remove duplicate profile links.");
    }
    if (seenKinds.has(kind)) {
      throw new Error(`Please add only one ${kind} link.`);
    }

    seenUrls.add(url.toLowerCase());
    seenKinds.add(kind);
    result[kind] = url;
  }

  return result;
}

export function validateAndBuildProjects(projects: PersonalData["projects"]) {
  const seenNames = new Set<string>();
  const seenLinks = new Set<string>();

  return projects.reduce<{ project_name: string; project_link?: string | null }[]>(
    (cleanProjects, project, index) => {
      const name = project.project_name.trim();
      const rawLink = project.project_link.trim();

      if (!name && !rawLink) return cleanProjects;
      if (!name) throw new Error(`Project ${index + 1} needs a project name.`);

      const normalizedName = name.toLowerCase();
      if (seenNames.has(normalizedName)) {
        throw new Error("Please remove duplicate project names.");
      }
      seenNames.add(normalizedName);

      let projectLink: string | null = null;
      if (rawLink) {
        projectLink = normalizeUrl(rawLink, `Project ${index + 1} link`);
        if (seenLinks.has(projectLink.toLowerCase())) {
          throw new Error("Please remove duplicate project links.");
        }
        seenLinks.add(projectLink.toLowerCase());
      }

      cleanProjects.push({ project_name: name, project_link: projectLink });
      return cleanProjects;
    },
    []
  );
}

export function normalizeUrl(value: string, field: string): string {
  try {
    const parsed = new URL(value.trim());
    if (!["http:", "https:"].includes(parsed.protocol)) {
      throw new Error();
    }

    parsed.hash = "";
    return parsed.toString().replace(/\/$/, "");
  } catch {
    throw new Error(`${field} must be a valid http or https URL.`);
  }
}

export function classifyLink(url: string): "github" | "linkedin" | "portfolio" {
  const host = new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  if (host === "github.com") return "github";
  if (host === "linkedin.com") return "linkedin";
  return "portfolio";
}

export function countWords(value: string) {
  return value.trim() ? value.trim().split(/\s+/).length : 0;
}

export function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read that image file."));
    reader.readAsDataURL(file);
  });
}

export const sh: Record<string, React.CSSProperties> = {
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

export const f: Record<string, React.CSSProperties> = {
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
  optionCount: {
    fontSize: "12px",
    fontStyle: "italic",
    fontWeight: 400,
    color: "#7b7288",
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
    background: "#e74c3c",
    color: "#ffffff",
    borderRadius: "8px",
    padding: "10px 14px",
    fontSize: "13px",
    fontWeight: 600,
    marginBottom: "18px",
    lineHeight: "1.4",
    animation: "fadeIn 0.2s ease",
  },
  fieldError: {
    background: "#fde8e8",
    color: "#c0392b",
    border: "1px solid #f5b7b1",
    borderRadius: "8px",
    padding: "8px 10px",
    fontSize: "12px",
    fontWeight: 600,
    lineHeight: "1.35",
    marginTop: "8px",
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
  tableErrorRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1.5fr",
    gap: "8px",
    padding: "8px",
    borderBottom: "1px solid #f0ecf8",
    background: "#fff7f7",
  },
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



