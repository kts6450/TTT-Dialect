export type Role = "user" | "assistant";

export interface Turn {
  role: Role;
  content: string;
}

export type VoiceMode = "consumer" | "seller";

export interface ConsumerSlots {
  listing_id?: string;
  quantity?: number;
  contact_name?: string;
  contact_phone?: string;
}

export interface SellerSlots {
  kind?: "product" | "lodging";
  title?: string;
  price?: number;
  description?: string;
  location?: string;
  stock?: number;
  max_guests?: number;
  emoji?: string;
}

export type VoiceSlots = ConsumerSlots & SellerSlots & Record<string, unknown>;

export interface VoiceTurnResponse {
  user_text: string;
  reply: string;
  slots: VoiceSlots;
  intent: string;
  ready_to_confirm: boolean;
  tts_url: string;
}

export interface Listing {
  id: string;
  seller_id: string;
  kind: "product" | "lodging";
  title: string;
  description: string;
  price: number;
  emoji: string;
  location: string;
  stock: number | null;
  max_guests: number | null;
  created_at: string;
}

export interface Brand {
  name: string;
  name_en?: string;
  tagline: string;
  description: string;
}

export interface VoiceStatus {
  asr_backend: string;
  llm_configured: boolean;
}

export interface CartLine {
  listingId: string;
  quantity: number;
}

export interface OrderLine {
  listing_id: string;
  title: string;
  kind: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}

export interface Order {
  id: string;
  created_at: string;
  buyer_name: string;
  buyer_phone: string;
  items: OrderLine[];
  total: number;
  payment_status: string;
  payment: {
    method: string;
    transaction_id: string;
    paid_at: string;
    message: string;
  } | null;
}
