import type {
  MyProfileData,
  PreferencesData,
  ProfileSetupOptions,
  RawSetupOption,
  SetupOption,
} from "./profileTypes";
import type { ApiEnvelope, ApiError } from "./client";

export function unwrapMyProfile(
  envelope: ApiEnvelope<{ data: MyProfileData } | MyProfileData>
): MyProfileData | null {
  const data = envelope.data;
  if (!data) return null;
  if ("profileCompleted" in data) return data;
  return data.data;
}

export function unwrapPreferences(
  envelope: ApiEnvelope<{ data: PreferencesData } | PreferencesData | null>
): PreferencesData | null {
  const data = envelope.data;
  if (!data) return null;
  if ("preferredMajorIds" in data) return data;
  return data.data;
}

export function normalizeSetupEnvelope(
  envelope: ApiEnvelope<
    { data: Record<keyof ProfileSetupOptions, RawSetupOption[]> } |
    Record<keyof ProfileSetupOptions, RawSetupOption[]>
  >
): ProfileSetupOptions {
  const data = envelope.data;

  if (!data) {
    throw { code: 500, message: "Profile setup options were not returned." } as ApiError;
  }

  const rawOptions = "years" in data ? data : data.data;

  return {
    years: normalizeSetupOptions(rawOptions.years).map((year) => ({
      ...year,
      label: formatYearOfStudyLabel(year.value ?? year.label),
    })),
    majors: normalizeSetupOptions(rawOptions.majors),
    skills: normalizeSetupOptions(rawOptions.skills),
    interests: normalizeSetupOptions(rawOptions.interests),
  };
}

function normalizeSetupOptions(options: RawSetupOption[]): SetupOption[] {
  return options.map((option) => ({
    id: option.id,
    label: option.label ?? option.name ?? String(option.id),
    value: option.value,
    userCount: option.userCount,
  }));
}

function formatYearOfStudyLabel(value: unknown): string {
  const text = String(value ?? "").trim();
  const numeric = Number(text.replace(/^year\s*/i, ""));
  const labels: Record<number, string> = {
    1: "Freshman",
    2: "Sophomore",
    3: "Junior",
    4: "Senior",
  };

  return labels[numeric] ?? text;
}
