// Dashboard data contracts shared by the page and its panels.

export interface Profile {
  id: number;
  name: string;
  major: string;
  year: string;
  profilePicture?: string | null;
  fypIdea?: string;
  bio?: string;
  skills: string[];
  interests: string[];
  projects?: unknown[];
  links?: Record<string, string>;
}

export interface MatchedPerson extends Profile {
  matchId?: number;
  matchStatus: "LIKED YOUR PROFILE!" | "MUTUAL LIKE!";
  hasExistingChat: boolean;
  lastMessagePreview?: string | null;
  hasUnreadMessages?: boolean;
  isNewMatch?: boolean;
  hasProfileUpdated?: boolean;
}

export interface ChatMessage {
  from: "me" | "them";
  text: string;
}

export interface ChatThread {
  personId: number;
  messages: ChatMessage[];
  chatStatus: "NEW MATCH!" | "NEW MESSAGES!" | "PROFILE UPDATED!" | "REPLY BACK?" | "SENT" | "SEEN";
}
