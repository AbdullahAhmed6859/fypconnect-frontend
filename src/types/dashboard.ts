// Shared types across dashboard components

export interface Profile {
  id: number;
  name: string;
  major: string;
  year: string;
  fypIdea?: string;
  bio?: string;
  skills: string[];
  interests: string[];
}

export interface MatchedPerson extends Profile {
  // Status label shown in the left panel list
  matchStatus: "LIKED YOUR PROFILE!" | "MUTUAL LIKE!";
  // Whether this person already has a chat thread with the current user
  hasExistingChat: boolean;
}

export interface ChatMessage {
  from: "me" | "them";
  text: string;
}

export interface ChatThread {
  personId: number;
  messages: ChatMessage[];
  // Chat-specific status shown in left panel
  chatStatus: "NEW MATCH!" | "NEW MESSAGES!" | "PROFILE UPDATED!" | "REPLY BACK?" | "SENT" | "SEEN";
}
