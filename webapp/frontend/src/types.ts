export type Role = "user" | "assistant";

export interface Turn {
  role: Role;
  content: string;
}

export interface Slots {
  experience_id?: string;
  date?: string;
  time?: string;
  headcount?: number;
  contact_name?: string;
  contact_phone?: string;
}

export interface VoiceTurnResponse {
  user_text: string;
  reply: string;
  slots: Slots;
  intent: string;
  ready_to_confirm: boolean;
  tts_url: string;
}

export interface Experience {
  id: string;
  name: string;
  category: string;
  region: string;
  emoji: string;
  description: string;
  duration_min: number;
  price: number;
  location: string;
  capacity: number;
  schedule: string[];
  keywords: string[];
}

export interface Brand {
  name: string;
  tagline: string;
  description: string;
}

export interface VoiceStatus {
  asr_backend: string;
  llm_configured: boolean;
}

export interface Reservation {
  code: string;
  created_at: string;
  experience_id: string;
  date?: string;
  time?: string;
  headcount?: number;
  contact_name?: string;
  contact_phone?: string;
}
