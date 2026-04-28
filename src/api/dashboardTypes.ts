export type JsonRecord = Record<string, unknown>;

export type RawProfile = {
  userId?: number;
  fullName?: string | null;
  yearOfStudy?: unknown;
  year?: unknown;
  major?: string | null;
  skills?: unknown;
  interests?: unknown;
  bio?: string | null;
  biography?: string | null;
  projects?: unknown;
  links?: unknown;
  fypIdea?: string | null;
  ideas?: string | null;
  profilePicture?: string | null;
};

export type RawMatch = {
  matchId?: number;
  matchedUser?: RawProfile;
  lastMessagePreview?: string | null;
  hasUnreadMessages?: boolean;
  isNewMatch?: boolean;
  hasProfileUpdated?: boolean;
};

export type RawConversationMessage = {
  senderId?: number;
  content?: string;
};

export type RawConversation = {
  matchedUser?: RawProfile;
  messages?: RawConversationMessage[];
};
