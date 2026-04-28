export interface MyProfileData {
  profileCompleted: boolean;
  yearOfStudy?: string | number | null;
  id?: number;
  fullName?: string | null;
  major?: string | null;
  skills?: string[];
  interests?: string[];
  bio?: string | null;
  projects?: { project_name: string; project_link?: string | null }[];
  links?: Record<string, string>;
  fypIdea?: string | null;
  profilePicture?: string | null;
  createdAt?: string;
  profileCompletedAt?: string | null;
  updatedAt?: string;
  annualYearReview?: {
    required: boolean;
    reviewDate: string;
    reviewYear: number;
    dismissedYear?: number | null;
  };
  [key: string]: unknown;
}

export interface ProfileSetupPayload {
  fullName: string;
  yearId: number;
  majorId: number;
  skills: number[];
  interests: number[];
  preferredMajorIds: number[];
  preferredSkillIds: number[];
  preferredInterestIds: number[];
  bio: string | null;
  fypIdea: string | null;
  links: {
    github?: string;
    linkedin?: string;
    portfolio?: string;
  };
  projects: {
    project_name: string;
    project_link?: string | null;
  }[];
  profilePicture: string | null;
}

export interface ProfileSetupData {
  message: string;
  data: {
    profileId: number;
    profileCompleted: boolean;
    eligibleForBrowsing: boolean;
  };
}

export interface SetupOption {
  id: number;
  label: string;
  value?: number;
  userCount?: number;
}

export interface ProfileSetupOptions {
  years: SetupOption[];
  majors: SetupOption[];
  skills: SetupOption[];
  interests: SetupOption[];
}

export interface UpdateProfilePayload {
  fullName?: string;
  yearId?: number;
  majorId?: number;
  skills?: number[];
  interests?: number[];
  preferredMajorIds?: number[];
  preferredSkillIds?: number[];
  preferredInterestIds?: number[];
  bio?: string | null;
  fypIdea?: string | null;
  links?: {
    github?: string;
    linkedin?: string;
    portfolio?: string;
  };
  projects?: {
    project_name: string;
    project_link?: string | null;
  }[];
  profilePicture?: string | null;
}

export interface PreferencesData {
  preferredMajorIds: number[];
  preferredSkillIds: number[];
  preferredInterestIds: number[];
  updatedAt?: string | null;
}

export interface BlockedUserData {
  userId: number;
  fullName: string | null;
  major: string | null;
  yearOfStudy: number | null;
  profilePicture?: string | null;
  blockedAt?: string | null;
}

export interface RawSetupOption {
  id: number;
  label?: string;
  name?: string;
  value?: number;
  userCount?: number;
}
