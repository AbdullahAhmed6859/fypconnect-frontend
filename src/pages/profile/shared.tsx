/* eslint-disable react-refresh/only-export-components */
import React, { useEffect, useState } from "react";
import {
  getMyProfile,
  getProfileSetupOptions,
  logoutUser,
  unwrapMyProfile,
  type MyProfileData,
  type ProfileSetupOptions,
  type SetupOption,
} from "../../api/auth";
import {
  countWords,
  formatYearOfStudyLabel,
  type BlockedUser,
  type EditableProject,
} from "../../utils/profileDraft";
const EMPTY_OPTIONS: ProfileSetupOptions = {
  years: [],
  majors: [],
  skills: [],
  interests: [],
};

type PageState = {
  loading: boolean;
  error: string | null;
  profile: MyProfileData | null;
  options: ProfileSetupOptions;
};

type FieldErrors = Record<string, string>;

export function useProfilePageState() {
  const [state, setState] = useState<PageState>({
    loading: true,
    error: null,
    profile: null,
    options: EMPTY_OPTIONS,
  });

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const [profileEnvelope, options] = await Promise.all([
          getMyProfile(),
          getProfileSetupOptions(),
        ]);

        if (!active) return;

        setState({
          loading: false,
          error: null,
          profile: unwrapMyProfile(profileEnvelope),
          options,
        });
      } catch (err: unknown) {
        const apiError = err as { message?: string };

        try {
          const profileEnvelope = await getMyProfile();
          if (!active) return;

          setState({
            loading: false,
            error: apiError.message ?? "Could not load this page.",
            profile: unwrapMyProfile(profileEnvelope),
            options: EMPTY_OPTIONS,
          });
        } catch {
          if (!active) return;
          window.location.replace("/login");
        }
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, []);

  return state;
}

export function ProfileShell({
  title,
  helper,
  children,
}: {
  title: string;
  helper?: React.ReactNode;
  children: React.ReactNode;
}) {
  async function handleLogout() {
    try {
      await logoutUser();
    } finally {
      window.location.href = "/login";
    }
  }

  return (
    <div style={shell.page}>
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        .profile-card { animation: fadeSlideUp 0.28s ease both; }
        .ghost-btn:hover:not(:disabled) { background: #f5f0fc !important; border-color: #45276e !important; color: #45276e !important; }
        .primary-btn:hover:not(:disabled) { background: #45276e !important; }
        .danger-btn:hover:not(:disabled) { background: #fff4f4 !important; border-color: #e74c3c !important; color: #e74c3c !important; }
        .icon-btn:hover:not(:disabled) { background: #f5f0fc !important; }
        .user-row:hover { background: #faf7ff !important; }
        input:focus, textarea:focus, select:focus {
          border-color: #5D3891 !important;
          box-shadow: 0 0 0 3px rgba(93,56,145,0.12) !important;
          outline: none !important;
          background: #fff !important;
        }
      `}</style>

      <nav style={shell.topnav}>
        <button type="button" style={shell.homeBtn} onClick={() => (window.location.href = "/dashboard")}>
          <HomeIcon />
          <span>Dashboard</span>
        </button>

        <div style={shell.navBrand}>
          FYP<span style={{ color: "#F99417" }}>Connect</span>
        </div>

        <button className="ghost-btn" type="button" style={shell.logoutBtn} onClick={handleLogout}>
          Logout
        </button>
      </nav>

      <main style={shell.body}>
        <div style={shell.card} className="profile-card">
          <h1 style={shell.title}>{title}</h1>
          {helper && <div style={shell.banner}>{helper}</div>}
          {children}
        </div>
      </main>
    </div>
  );
}

export function LabeledInput({
  label,
  value,
  onChange,
  error,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  return (
    <div style={formStyles.fieldBlock}>
      <label style={formStyles.label}>{label}</label>
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        style={formStyles.input}
      />
      <FieldError message={error} />
    </div>
  );
}

export function LabeledSelect({
  label,
  value,
  options,
  onChange,
  placeholder,
  error,
}: {
  label: string;
  value: string;
  options: SetupOption[];
  onChange: (value: string) => void;
  placeholder: string;
  error?: string;
}) {
  return (
    <div style={formStyles.fieldBlock}>
      <label style={formStyles.label}>{label}</label>
      <div style={formStyles.selectWrap}>
        <select value={value} onChange={(event) => onChange(event.target.value)} style={formStyles.select}>
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option key={option.id} value={option.label}>
              {label === "Year of Study" ? formatYearOfStudyLabel(option.value ?? option.label) : option.label}
            </option>
          ))}
        </select>
        <div style={formStyles.selectChevron}>
          <ChevronIcon />
        </div>
      </div>
      <FieldError message={error} />
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
  onChange: (value: string) => void;
  maxWords: number;
  placeholder?: string;
  error?: string;
}) {
  const wordCount = countWords(value);
  const overLimit = wordCount > maxWords;

  return (
    <div style={formStyles.fieldBlock}>
      <div style={formStyles.labelLineRow}>
        <label style={formStyles.label}>{label}</label>
        <span style={formStyles.horizRule} />
      </div>
      <textarea
        rows={3}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        style={{ ...formStyles.textarea, borderColor: overLimit ? "#e74c3c" : "#E8E2E2" }}
      />
      <div style={{ ...formStyles.wordCount, color: overLimit ? "#e74c3c" : "#9999aa" }}>
        {wordCount}/{maxWords} words used
      </div>
      <FieldError message={error} />
    </div>
  );
}

export function SearchableMultiSelect({
  label,
  placeholder,
  options,
  selectedIds,
  onChange,
}: {
  label: string;
  placeholder: string;
  options: SetupOption[];
  selectedIds: number[];
  onChange: (ids: number[]) => void;
}) {
  const [query, setQuery] = useState("");

  const selectedOptions = options.filter((option) => selectedIds.includes(option.id));
  const displayOptions = options.filter((option) =>
    option.label.toLowerCase().includes(query.toLowerCase())
  );

  function toggle(id: number) {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((value) => value !== id));
      return;
    }
    onChange([...selectedIds, id]);
  }

  return (
    <div style={formStyles.fieldBlock}>
      <label style={formStyles.label}>{label}</label>

      {selectedOptions.length > 0 && (
        <div style={multi.selectedRow}>
          {selectedOptions.map((option) => (
            <button key={option.id} type="button" className="icon-btn" style={multi.selectedTag} onClick={() => toggle(option.id)}>
              {option.label}
              <span style={multi.selectedTagX}>x</span>
            </button>
          ))}
        </div>
      )}

      <div style={formStyles.searchBar}>
        <SearchIcon />
        <input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={placeholder}
          style={formStyles.searchInput}
        />
        <ChevronIcon />
      </div>

      <div style={formStyles.optionList}>
        {displayOptions.length === 0 ? (
          <div style={formStyles.noResults}>No matches found.</div>
        ) : (
          displayOptions.map((option) => {
            const selected = selectedIds.includes(option.id);
            return (
              <button
                key={option.id}
                type="button"
                className="user-row"
                onClick={() => toggle(option.id)}
                style={{
                  ...multi.optionRow,
                  background: selected ? "#ede4f8" : "#ffffff",
                  color: selected ? "#5D3891" : "#1a1a2e",
                  fontWeight: selected ? 600 : 400,
                }}
              >
                <span>{option.label}</span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

export function LinksEditor({
  links,
  onAdd,
  onChange,
  onRemove,
  fieldErrors,
}: {
  links: string[];
  onAdd: () => void;
  onChange: (index: number, value: string) => void;
  onRemove: (index: number) => void;
  fieldErrors: FieldErrors;
}) {
  return (
    <div style={formStyles.fieldBlock}>
      <label style={formStyles.label}>My Links (Optional)</label>
      {links.map((link, index) => (
        <div key={index} style={formStyles.linkRow}>
          <input
            type="text"
            value={link}
            onChange={(event) => onChange(index, event.target.value)}
            style={{ ...formStyles.input, marginBottom: 0, paddingRight: "42px" }}
            placeholder="Profile or portfolio URL"
          />
          <button type="button" style={formStyles.removeLinkBtn} onClick={() => onRemove(index)} aria-label="Remove link">
            x
          </button>
          <FieldError message={fieldErrors[`link-${index}`]} />
        </div>
      ))}
      <div style={formStyles.rightAlign}>
        <button type="button" className="ghost-btn" style={edit.smallBtn} onClick={onAdd}>
          Add Another Link
        </button>
      </div>
    </div>
  );
}

export function ProjectsEditor({
  projects,
  onAdd,
  onChange,
  fieldErrors,
}: {
  projects: EditableProject[];
  onAdd: () => void;
  onChange: (index: number, key: keyof EditableProject, value: string) => void;
  fieldErrors: FieldErrors;
}) {
  return (
    <div style={formStyles.fieldBlock}>
      <label style={formStyles.label}>Featured Projects (Optional)</label>
      <div style={formStyles.tableWrap}>
        <div style={formStyles.tableHead}>
          <div style={formStyles.tableHeadLeft}>Project Name</div>
          <div style={formStyles.tableHeadRight}>URL (Github/Portfolio/Other)</div>
        </div>

        {projects.map((project, index) => (
          <React.Fragment key={index}>
            <div style={formStyles.tableRow}>
              <input
                type="text"
                value={project.project_name}
                onChange={(event) => onChange(index, "project_name", event.target.value)}
                style={formStyles.tableInputLeft}
              />
              <input
                type="text"
                value={project.project_link}
                onChange={(event) => onChange(index, "project_link", event.target.value)}
                style={formStyles.tableInputRight}
              />
            </div>
            {(fieldErrors[`project-${index}-name`] || fieldErrors[`project-${index}-link`]) && (
              <div style={formStyles.tableErrorRow}>
                <FieldError message={fieldErrors[`project-${index}-name`]} />
                <FieldError message={fieldErrors[`project-${index}-link`]} />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>

      <div style={formStyles.rightAlign}>
        <button type="button" className="ghost-btn" style={edit.smallBtn} onClick={onAdd}>
          Add Another Project
        </button>
      </div>
    </div>
  );
}

export function BlockedUsersEditor({
  users,
  onUnblock,
  onPreview,
}: {
  users: BlockedUser[];
  onUnblock: (id: number) => void;
  onPreview: (user: BlockedUser) => void;
}) {
  const [query, setQuery] = useState("");

  const filteredUsers = users.filter((user) =>
    `${user.name} ${user.subtitle}`.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div style={formStyles.fieldBlock}>
      <label style={formStyles.label}>Unblock Users (Select to unblock) (Optional)</label>

      <div style={formStyles.searchBar}>
        <SearchIcon />
        <input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search blocked users"
          style={formStyles.searchInput}
        />
      </div>

      <div style={formStyles.optionList}>
        {filteredUsers.length === 0 ? (
          <div style={formStyles.noResults}>No blocked users found.</div>
        ) : (
          filteredUsers.map((user) => (
            <div key={user.id} style={blocked.row}>
              <div style={blocked.nameBlock}>
                <div style={blocked.name}>{user.name}</div>
                <div style={blocked.subtitle}>{user.subtitle}</div>
              </div>
              <div style={blocked.actions}>
                <button type="button" className="icon-btn" style={blocked.iconBtn} onClick={() => onPreview(user)} aria-label={`View ${user.name}`}>
                  <UserIcon />
                </button>
                <button type="button" className="icon-btn" style={blocked.iconBtn} onClick={() => onUnblock(user.id)} aria-label={`Unblock ${user.name}`}>
                  x
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export function LoadingBlock({ label }: { label: string }) {
  return (
    <div style={loadingStyles.wrap}>
      <div style={loadingStyles.title}>{label}</div>
    </div>
  );
}

export function ErrorBanner({ message }: { message: string }) {
  return <div style={statusStyles.error}>{message}</div>;
}

export function SuccessBanner({ message }: { message: string }) {
  return <div style={statusStyles.success}>{message}</div>;
}

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <div style={statusStyles.fieldError}>{message}</div>;
}

export function ProfileAvatar({
  image,
  label,
  size,
  textSize,
}: {
  image: string | null;
  label: string;
  size: number;
  textSize: number;
}) {
  if (image) {
    return (
      <img
        src={image}
        alt={`${label} profile`}
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          objectFit: "cover",
          border: "2px solid #ddd3eb",
          background: "#ffffff",
        }}
      />
    );
  }

  const initials = label
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "ME";

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: "#f0eaf8",
        border: "2px solid #5D3891",
        color: "#5D3891",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 700,
        fontSize: textSize,
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  );
}

export function ProfileHeroImage({ image, label }: { image: string | null; label: string }) {
  if (image) {
    return <img src={image} alt={`${label} preview`} style={overview.heroImage} />;
  }

  return (
    <div style={overview.heroPlaceholder}>
      <ProfileAvatar image={null} label={label} size={130} textSize={36} />
      <div style={overview.heroPlaceholderText}>Profile picture preview</div>
    </div>
  );
}

export function findOptionIdByLabel(label: string, options: SetupOption[]) {
  return options.find((option) => option.label === label)?.id;
}

export function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read the selected image."));
    reader.readAsDataURL(file);
  });
}

export function HomeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M2 7.4 8 2l6 5.4" stroke="#5D3891" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 6.9V14h8V6.9" stroke="#5D3891" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
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

export function UserIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="5" r="3" stroke="#6b6b7b" strokeWidth="1.4" />
      <path d="M3 14c.8-2.2 2.8-3.5 5-3.5s4.2 1.3 5 3.5" stroke="#6b6b7b" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export const shell: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
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
    padding: "0 20px",
    gap: "16px",
    boxShadow: "0 2px 12px rgba(93,56,145,0.06)",
    zIndex: 50,
  },
  homeBtn: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    border: "none",
    background: "none",
    color: "#5D3891",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: 600,
    fontFamily: "'DM Sans', sans-serif",
  },
  navBrand: {
    flex: 1,
    textAlign: "center",
    fontFamily: "'Fraunces', serif",
    fontWeight: 700,
    fontSize: "20px",
    color: "#5D3891",
    letterSpacing: "-0.4px",
    userSelect: "none",
  },
  logoutBtn: {
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
    padding: "28px 20px 48px",
  },
  card: {
    background: "#ffffff",
    borderRadius: "16px",
    padding: "28px 34px 36px",
    width: "100%",
    maxWidth: "980px",
    boxShadow: "0 8px 40px rgba(93,56,145,0.12)",
    border: "1px solid #E8E2E2",
  },
  title: {
    fontFamily: "'Fraunces', serif",
    fontWeight: 700,
    fontSize: "28px",
    color: "#5D3891",
    textAlign: "center",
    marginBottom: "16px",
    letterSpacing: "-0.4px",
  },
  banner: {
    maxWidth: "680px",
    margin: "0 auto 24px",
    background: "#F99417",
    color: "#ffffff",
    borderRadius: "8px",
    padding: "10px 14px",
    fontSize: "13px",
    fontWeight: 600,
    lineHeight: "1.4",
    textAlign: "center",
    fontStyle: "italic",
  },
};

export const statusStyles: Record<string, React.CSSProperties> = {
  error: {
    background: "#e74c3c",
    color: "#ffffff",
    borderRadius: "8px",
    padding: "10px 14px",
    fontSize: "13px",
    fontWeight: 600,
    marginBottom: "18px",
    lineHeight: "1.4",
  },
  success: {
    background: "#f5f0fc",
    color: "#5D3891",
    border: "1px solid #ddd3eb",
    borderRadius: "8px",
    padding: "10px 14px",
    fontSize: "13px",
    fontWeight: 600,
    marginBottom: 0,
    lineHeight: "1.4",
    textAlign: "center",
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
  },
};

export const loadingStyles: Record<string, React.CSSProperties> = {
  wrap: {
    minHeight: "320px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
  },
  title: {
    fontSize: "16px",
    fontWeight: 600,
    color: "#5D3891",
  },
};

export const formStyles: Record<string, React.CSSProperties> = {
  form: { display: "flex", flexDirection: "column" },
  fieldBlock: { marginBottom: "22px" },
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
  searchBar: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "0 12px",
    minHeight: "40px",
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
    padding: "10px 0",
  },
  optionList: {
    border: "1.5px solid #E8E2E2",
    borderBottomLeftRadius: "8px",
    borderBottomRightRadius: "8px",
    background: "#ffffff",
    maxHeight: "220px",
    overflowY: "auto",
  },
  noResults: { padding: "10px 12px", fontSize: "13px", color: "#9999aa" },
  labelLineRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: 0,
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
    resize: "vertical",
    minHeight: "96px",
    lineHeight: "1.5",
    transition: "border-color 0.15s ease",
    boxSizing: "border-box",
  },
  wordCount: {
    textAlign: "right",
    fontSize: "12px",
    marginTop: "5px",
    fontStyle: "italic",
  },
  linkRow: { position: "relative", marginBottom: "10px" },
  removeLinkBtn: {
    position: "absolute",
    right: "10px",
    top: "50%",
    transform: "translateY(-50%)",
    width: "24px",
    height: "24px",
    border: "none",
    background: "transparent",
    fontSize: "18px",
    lineHeight: 1,
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

export const overview: Record<string, React.CSSProperties> = {
  profilePanel: {
    display: "grid",
    gridTemplateColumns: "minmax(280px, 1fr) minmax(280px, 1fr)",
    border: "1px solid #E8E2E2",
    borderRadius: "14px",
    overflow: "hidden",
    minHeight: "360px",
  },
  imagePane: {
    borderRight: "1px solid #E8E2E2",
    background: "#fafafa",
    padding: "24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  infoPane: {
    padding: "28px 28px 22px",
    display: "flex",
    flexDirection: "column",
    minHeight: 0,
  },
  heroImage: {
    width: "100%",
    maxWidth: "360px",
    aspectRatio: "1 / 1",
    objectFit: "cover",
    borderRadius: "16px",
    border: "1px solid #E8E2E2",
    background: "#ffffff",
  },
  heroPlaceholder: {
    width: "100%",
    maxWidth: "360px",
    aspectRatio: "1 / 1",
    borderRadius: "16px",
    border: "1px dashed #cdbfe1",
    background: "linear-gradient(180deg, #fbf9ff 0%, #f5f0fc 100%)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "14px",
    padding: "24px",
  },
  heroPlaceholderText: {
    color: "#6b6b7b",
    fontSize: "13px",
    fontStyle: "italic",
    textAlign: "center",
  },
  name: {
    textAlign: "center",
    fontFamily: "'Fraunces', serif",
    fontWeight: 700,
    fontSize: "28px",
    color: "#1a1a2e",
    marginBottom: "6px",
  },
  meta: {
    textAlign: "center",
    fontSize: "18px",
    color: "#6b6b7b",
    fontStyle: "italic",
    marginBottom: "18px",
  },
  scrollArea: {
    flex: 1,
    overflowY: "auto",
    paddingRight: "6px",
  },
  summaryRow: {
    marginBottom: "18px",
  },
  summaryLabel: {
    fontSize: "14px",
    fontWeight: 700,
    color: "#5D3891",
    marginBottom: "6px",
  },
  summaryValue: {
    fontSize: "15px",
    lineHeight: 1.6,
    color: "#1a1a2e",
  },
  buttonRow: {
    display: "grid",
    gridTemplateColumns: "1fr auto 1fr",
    alignItems: "start",
    gap: "16px",
    marginTop: "20px",
  },
  deleteBtn: {
    minWidth: "170px",
    padding: "12px 22px",
    border: "1.5px solid #E8E2E2",
    borderRadius: "10px",
    background: "#ffffff",
    color: "#6b6b7b",
    fontSize: "15px",
    fontWeight: 600,
    fontFamily: "'DM Sans', sans-serif",
    cursor: "pointer",
    justifySelf: "start",
  },
  actionBtn: {
    minWidth: "230px",
    padding: "12px 22px",
    border: "1.5px solid #5D3891",
    borderRadius: "10px",
    background: "#ffffff",
    color: "#5D3891",
    fontSize: "15px",
    fontWeight: 600,
    lineHeight: 1.25,
    textAlign: "center",
    whiteSpace: "normal",
    fontFamily: "'DM Sans', sans-serif",
    cursor: "pointer",
    justifySelf: "end",
  },
  centerActionBtn: {
    minWidth: "170px",
    padding: "12px 22px",
    border: "1.5px solid #5D3891",
    borderRadius: "10px",
    background: "#ffffff",
    color: "#5D3891",
    fontSize: "15px",
    fontWeight: 600,
    lineHeight: 1.25,
    textAlign: "center",
    fontFamily: "'DM Sans', sans-serif",
    cursor: "pointer",
    justifySelf: "center",
  },
  lastUpdated: {
    marginTop: "18px",
    textAlign: "center",
    fontSize: "13px",
    color: "#6b6b7b",
    fontStyle: "italic",
  },
};

export const edit: Record<string, React.CSSProperties> = {
  avatarWrap: {
    display: "flex",
    justifyContent: "center",
    marginBottom: "14px",
  },
  uploadRow: {
    display: "flex",
    justifyContent: "center",
    marginBottom: "18px",
  },
  uploadBtn: {
    padding: "10px 18px",
    border: "1.5px solid #E8E2E2",
    borderRadius: "8px",
    background: "#ffffff",
    color: "#1a1a2e",
    fontFamily: "'DM Sans', sans-serif",
    fontSize: "13px",
    fontWeight: 600,
    cursor: "pointer",
  },
  actionRow: {
    display: "flex",
    justifyContent: "center",
    gap: "16px",
    flexWrap: "wrap",
    marginTop: "10px",
  },
  primaryBtn: {
    minWidth: "180px",
    padding: "12px 22px",
    border: "none",
    borderRadius: "8px",
    background: "#5D3891",
    color: "#ffffff",
    fontFamily: "'DM Sans', sans-serif",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
  },
  smallBtn: {
    padding: "8px 16px",
    border: "1.5px solid #E8E2E2",
    borderRadius: "8px",
    background: "#ffffff",
    color: "#1a1a2e",
    fontFamily: "'DM Sans', sans-serif",
    fontSize: "13px",
    fontWeight: 600,
    cursor: "pointer",
  },
  lastUpdated: {
    textAlign: "center",
    fontSize: "13px",
    color: "#6b6b7b",
    fontStyle: "italic",
  },
  footerStatus: {
    marginTop: "18px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "10px",
  },
};

export const multi: Record<string, React.CSSProperties> = {
  selectedRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    marginBottom: "10px",
  },
  selectedTag: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    padding: "6px 10px",
    border: "1px solid #ddd3eb",
    borderRadius: "18px",
    background: "#f5f0fc",
    color: "#5D3891",
    fontSize: "12px",
    fontWeight: 600,
    cursor: "pointer",
  },
  selectedTagX: {
    color: "#7b7288",
    fontSize: "12px",
    textTransform: "uppercase",
  },
  optionRow: {
    width: "100%",
    display: "block",
    border: "none",
    borderBottom: "1px solid #f0ecf8",
    textAlign: "left",
    padding: "9px 12px",
    fontSize: "14px",
    fontFamily: "'DM Sans', sans-serif",
    cursor: "pointer",
    transition: "background 0.1s ease",
  },
};

export const blocked: Record<string, React.CSSProperties> = {
  row: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
    padding: "10px 12px",
    borderBottom: "1px solid #f0ecf8",
  },
  nameBlock: {
    minWidth: 0,
  },
  name: {
    fontSize: "14px",
    fontWeight: 600,
    color: "#1a1a2e",
  },
  subtitle: {
    fontSize: "12px",
    color: "#6b6b7b",
    marginTop: "2px",
  },
  actions: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  iconBtn: {
    width: "28px",
    height: "28px",
    border: "none",
    background: "transparent",
    borderRadius: "6px",
    cursor: "pointer",
    color: "#6b6b7b",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "18px",
    lineHeight: 1,
  },
};

export const match: Record<string, React.CSSProperties> = {
  note: {
    fontSize: "13px",
    color: "#6b6b7b",
    textAlign: "center",
    lineHeight: 1.5,
    fontStyle: "italic",
    marginTop: "4px",
  },
};


