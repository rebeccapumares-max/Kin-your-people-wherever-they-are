export interface FamilyMember {
  id: string;
  name: string;
  avatar: string;
  city: string;
  timezone: string; // e.g. "Europe/Madrid", "America/New_York", "Asia/Tokyo", "Europe/Rome"
  typicalSchedule: {
    startHour: number; // e.g. 8 (8 AM)
    endHour: number; // e.g. 22 (10 PM)
  };
  birthday: string; // MM-DD
  anniversary?: string; // MM-DD
  relation: string; // e.g. "Grandmother", "Cousin", "Father", "You"
  quietMode: boolean;
  languages: string[];
}

export type MomentType = 'photo' | 'voice' | 'note';

export interface Memory {
  id: string;
  title: string;
  type: MomentType;
  date: string; // YYYY-MM-DD
  authorId: string;
  personId?: string; // Tagged member (optional)
  photoUrl?: string;
  audioUrl?: string; // Simulated link
  content?: string;
  tags: string[];
  isCapsule?: boolean;
  unlockDate?: string; // YYYY-MM-DD for capsule
}

export interface Recipe {
  id: string;
  name: string;
  coverUrl: string;
  voiceUrl?: string; // Grandma's instruction audio
  taughtById: string; // ID of the person who passed it down
  passedDownFromId?: string; // optional ancestor
  ingredients: string[];
  instructions: string[];
  tags: string[];
  annotations: Array<{
    id: string;
    authorId: string;
    text: string;
    date: string;
  }>;
}

export interface Postcard {
  id: string;
  photoUrl: string;
  message: string; // Max 150 chars
  senderId: string;
  recipientId: string;
  sentDate: string; // YYYY-MM-DD
  delayDays: number; // 3, 5, or 7
  arrivalDate: string; // YYYY-MM-DD
  status: 'pending' | 'delivered';
  price: number; // e.g., 2.50 or 3.50
}

export interface VoiceChainMessage {
  id: string;
  senderId: string;
  duration: number; // seconds
  timestamp: string; // Date string
  audioUrl?: string;
  transcript?: string;
}

export interface VoiceChain {
  id: string;
  title: string;
  participants: string[]; // member IDs
  messages: VoiceChainMessage[];
  updatedAt: string;
  unreadBy: string[]; // member IDs who haven't listened to the latest addition
}

export interface VisitFund {
  id: string;
  name: string;
  destinationCity: string;
  targetAmount: number;
  currentAmount: number;
  participants: string[]; // member IDs
  flightStatus: {
    originCity: string;
    currentPrice: number;
    targetPrice: number;
    trend: 'down' | 'up' | 'stable';
    lastChecked: string;
  };
  milestones: Array<{
    percentage: number;
    title: string;
    unlocked: boolean;
    momentMsg?: string;
  }>;
  itinerary: string[];
  packingList: Array<{ item: string; packed: boolean; assignedId?: string }>;
}

export interface UserState {
  activeMemberId: string;
  tier: 'free' | 'family' | 'heirloom';
  postcardCredits: number;
  postcardsPackCount: number; // owned packs
}
