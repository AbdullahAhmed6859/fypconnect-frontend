import type { BlockedUserData, MyProfileData, PreferencesData, SetupOption } from "../api/auth";

export type EditableProject = {
  project_name: string;
  project_link: string;
};

export type EditableProfileDraft = {
  fullName: string;
  yearLabel: string;
  majorLabel: string;
  bio: string;
  fypIdea: string;
  links: string[];
  projects: EditableProject[];
  skills: string[];
  interests: string[];
  profilePicture: string | null;
  lastUpdatedLabel: string;
};

export type EditablePreferencesDraft = {
  preferredMajors: string[];
  preferredSkills: string[];
  preferredInterests: string[];
  blockedUsers: BlockedUser[];
  lastUpdatedLabel: string;
};

export type BlockedUser = {
  id: number;
  name: string;
  subtitle: string;
  major: string;
  year: string;
};

export const MAX_BIO_WORDS = 100;
export const MAX_FYP_IDEA_WORDS = 120;
export const MAX_PROFILE_IMAGE_BYTES = 5 * 1024 * 1024;

export function countWords(value: string) {
  return value.trim() ? value.trim().split(/\s+/).length : 0;
}

export function formatYearOfStudyLabel(value: unknown): string {
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

export function formatTimestamp(value?: string | null) {
  if (!value) return "Not yet saved";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Not yet saved";

  return parsed.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function toEditableProfileDraft(profile: MyProfileData | null): EditableProfileDraft {
  const data: Partial<MyProfileData> = profile ?? {};
  const links = extractLinks(data.links);
  const projects = Array.isArray(data.projects)
    ? data.projects.map((project) => ({
        project_name: project.project_name ?? "",
        project_link: project.project_link ?? "",
      }))
    : [];

  return {
    fullName: data.fullName?.trim() || "John Doe",
    yearLabel: formatYearOfStudyLabel(data.yearOfStudy),
    majorLabel: data.major?.trim() || "CS: Computer Science",
    bio: data.bio?.trim() || "",
    fypIdea: data.fypIdea?.trim() || "",
    links: links.length > 0 ? links : [""],
    projects: projects.length > 0 ? projects : [{ project_name: "", project_link: "" }],
    skills: Array.isArray(data.skills) && data.skills.length > 0 ? data.skills : [],
    interests: Array.isArray(data.interests) && data.interests.length > 0 ? data.interests : [],
    profilePicture: data.profilePicture ?? null,
    lastUpdatedLabel: formatTimestamp(data.updatedAt),
  };
}

export function toEditablePreferencesDraft(): EditablePreferencesDraft {
  return {
    preferredMajors: [],
    preferredSkills: [],
    preferredInterests: [],
    blockedUsers: [],
    lastUpdatedLabel: "Not yet saved",
  };
}

export function toEditablePreferencesDraftFromApi(
  preferences: PreferencesData | null,
  majors: SetupOption[],
  skills: SetupOption[],
  interests: SetupOption[],
  blockedUsers?: BlockedUser[],
) {
  const base = toEditablePreferencesDraft();
  if (!preferences) {
    return {
      ...base,
      blockedUsers: blockedUsers ?? [],
    };
  }

  return {
    preferredMajors: resolveSelectedLabels(preferences.preferredMajorIds, majors),
    preferredSkills: resolveSelectedLabels(preferences.preferredSkillIds, skills),
    preferredInterests: resolveSelectedLabels(preferences.preferredInterestIds, interests),
    blockedUsers: blockedUsers ?? [],
    lastUpdatedLabel: formatTimestamp(preferences.updatedAt),
  };
}

export function toBlockedUsers(items: BlockedUserData[]): BlockedUser[] {
  return items.map((item) => ({
    id: item.userId,
    name: item.fullName?.trim() || "Unnamed Student",
    subtitle: buildBlockedSubtitle(item.major, formatYearOfStudyLabel(item.yearOfStudy)),
    major: item.major?.trim() || "Undeclared",
    year: formatYearOfStudyLabel(item.yearOfStudy),
  }));
}

export function resolveSelectedIds(labels: string[], options: SetupOption[]) {
  const normalized = new Set(labels.map(normalizeLabel));
  return options
    .filter((option) => normalized.has(normalizeLabel(option.label)))
    .map((option) => option.id);
}

export function resolveSelectedLabels(ids: number[], options: SetupOption[]) {
  return options.filter((option) => ids.includes(option.id)).map((option) => option.label);
}

export function buildLinksPayload(links: string[]) {
  const payload: Record<string, string> = {};
  const seenDomains = new Set<string>();

  for (const rawUrl of links) {
    const trimmed = rawUrl.trim();
    if (!trimmed) continue;

    let parsed: URL;
    try {
      parsed = new URL(trimmed);
    } catch {
      throw new Error("Please enter valid URLs for your links.");
    }

    const host = parsed.hostname.toLowerCase();
    let key = "portfolio";

    if (host.includes("github.com")) key = "github";
    else if (host.includes("linkedin.com")) key = "linkedin";

    if (seenDomains.has(key)) {
      throw new Error("Please remove duplicate profile links.");
    }

    seenDomains.add(key);
    payload[key] = trimmed;
  }

  return payload;
}

export function validateAndBuildProjects(projects: EditableProject[]) {
  const cleanProjects: { project_name: string; project_link?: string | null }[] = [];
  const seenLinks = new Set<string>();

  for (const project of projects) {
    const name = project.project_name.trim();
    const link = project.project_link.trim();

    if (!name && !link) continue;

    if (!name) {
      throw new Error("Each project link must have a project name.");
    }

    if (link) {
      try {
        new URL(link);
      } catch {
        throw new Error("Please enter valid project URLs.");
      }

      const normalized = link.toLowerCase();
      if (seenLinks.has(normalized)) {
        throw new Error("Please remove duplicate project links.");
      }
      seenLinks.add(normalized);
    }

    cleanProjects.push({
      project_name: name,
      project_link: link || null,
    });
  }

  return cleanProjects;
}

function extractLinks(links: MyProfileData["links"]) {
  if (!links) return [];
  return Object.values(links).filter((value): value is string => Boolean(value));
}

function normalizeLabel(value: string) {
  return value.trim().toLowerCase();
}

function buildBlockedSubtitle(major: string | null | undefined, yearLabel: string) {
  const majorText = major?.trim() || "Undeclared";
  return `${majorText} ${yearLabel}`.trim();
}
