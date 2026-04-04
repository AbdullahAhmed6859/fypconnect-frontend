import type { MatchedPerson, Profile, ChatThread } from "../types/dashboard";

// People who have already liked the current user (Matches tab)
export const DUMMY_MATCHES: MatchedPerson[] = [
  {
    id: 1,
    name: "Sarah Khan",
    major: "Computer Science",
    year: "Senior",
    matchStatus: "LIKED YOUR PROFILE!",
    fypIdea: "I want to build a drone to cure pollution.",
    bio: "I don't submit anything on time.",
    skills: ["Python", "SQL"],
    interests: ["Product Design", "Hardware"],
    hasExistingChat: true,
  },
  {
    id: 2,
    name: "Person X",
    major: "Computer Engineering",
    year: "Senior",
    matchStatus: "LIKED YOUR PROFILE!",
    fypIdea: "Embedded system for smart home automation.",
    bio: "Hardware enthusiast who occasionally writes code.",
    skills: ["C++", "Embedded Systems", "Arduino"],
    interests: ["IoT", "Hardware"],
    hasExistingChat: false,
  },
  {
    id: 3,
    name: "Person Y",
    major: "Computer & Network Design",
    year: "Senior",
    matchStatus: "MUTUAL LIKE!",
    fypIdea: "Distributed fault-tolerant messaging system.",
    bio: "I live in the terminal.",
    skills: ["Networking", "Linux", "Go"],
    interests: ["Systems", "Security"],
    hasExistingChat: false,
  },
  {
    id: 4,
    name: "Person A",
    major: "Electrical Engineering",
    year: "Senior",
    matchStatus: "MUTUAL LIKE!",
    fypIdea: "AI-assisted power grid optimisation.",
    bio: "Signal processing nerd.",
    skills: ["MATLAB", "Python", "Signal Processing"],
    interests: ["AI", "Power Systems"],
    hasExistingChat: true,
  },
  {
    id: 5,
    name: "Person B",
    major: "Computer & Hardware",
    year: "Senior",
    matchStatus: "LIKED YOUR PROFILE!",
    fypIdea: "Custom RISC-V processor implementation.",
    bio: "If it's not in Verilog, did it even happen?",
    skills: ["Verilog", "FPGA", "Computer Architecture"],
    interests: ["Computer Architecture", "Hardware Design"],
    hasExistingChat: false,
  },
];

// Random browse profiles shown on the right by default (GET /browse/next pool)
// These are separate from matches — they haven't liked the current user yet
export const DUMMY_BROWSE_POOL: Profile[] = [
  {
    id: 101,
    name: "Ali Raza",
    major: "Computer Science",
    year: "Junior",
    fypIdea: "Smart campus navigation using indoor positioning.",
    bio: "Building things that actually work.",
    skills: ["React", "Node.js", "TypeScript"],
    interests: ["Web Development", "UX Design"],
  },
  {
    id: 102,
    name: "Zara Ahmed",
    major: "Computer Science",
    year: "Senior",
    fypIdea: "NLP-based Urdu text summarisation.",
    bio: "Bilingual and caffeinated.",
    skills: ["Python", "NLP", "Transformers"],
    interests: ["AI", "Linguistics"],
  },
  {
    id: 103,
    name: "Omar Shaikh",
    major: "Electrical Engineering",
    year: "Junior",
    fypIdea: "Low-cost ECG monitoring wearable.",
    bio: "Biomedical track, heart-first.",
    skills: ["Analog Circuits", "C", "PCB Design"],
    interests: ["Biomedical", "Embedded Systems"],
  },
  {
    id: 104,
    name: "Hira Malik",
    major: "Social Development",
    year: "Senior",
    fypIdea: "Mobile platform for rural healthcare access.",
    bio: "Tech for social good.",
    skills: ["Research", "Figma", "React Native"],
    interests: ["Social Impact", "Healthcare"],
  },
  {
    id: 105,
    name: "Bilal Qureshi",
    major: "Computer Science",
    year: "Senior",
    fypIdea: "Peer-to-peer file sharing over local networks.",
    bio: "Network layer is the only layer.",
    skills: ["Rust", "Networking", "Linux"],
    interests: ["Systems Programming", "Open Source"],
  },
];

// Seed chat threads for people who already have an existing chat
export const DUMMY_CHAT_THREADS: ChatThread[] = [
  {
    personId: 1,
    chatStatus: "NEW MATCH!",
    messages: [
      { from: "them", text: "hey, i like ur idea" },
      { from: "me",   text: "thanks, what would change in it?" },
      { from: "them", text: "meray friend ko bhi lelo" },
    ],
  },
  {
    personId: 4,
    chatStatus: "REPLY BACK?",
    messages: [
      { from: "me",   text: "hey! saw your profile, really interesting project idea" },
      { from: "them", text: "thanks! yours too — what stack are you planning?" },
    ],
  },
];

// Automated replies pool — cycles through when the other person "responds"
export const AUTO_REPLIES = [
  "haha yeah that makes sense",
  "sounds good, let's catch up this week?",
  "ok but what's your timeline looking like",
  "yaar i was thinking the same thing",
  "have you talked to the prof about this yet",
  "interesting — send me the doc when it's ready",
  "nvm let's discuss in person",
  "lol ok",
  "actually that's a solid point",
  "bhai finalise karo pehle",
];
