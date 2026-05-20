import type { Listing } from "../types";

const GRADIENTS = [
  "from-teal-600 via-cyan-700 to-slate-900",
  "from-emerald-600 via-teal-800 to-slate-900",
  "from-cyan-600 via-blue-800 to-slate-900",
  "from-green-700 via-emerald-900 to-slate-950",
  "from-teal-700 via-cyan-900 to-indigo-950",
  "from-emerald-800 via-teal-900 to-slate-900",
];

/** 시드·새 글 모두 쓸 수 있는 고정 매핑 + 종류별 풀 */
const COVER_BY_ID: Record<string, string> = {
  "seed-rice-10kg":
    "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1600&q=85",
  "seed-hanok-night":
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=85",
  "seed-honey":
    "https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=1600&q=85",
  "seed-guesthouse":
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=85",
};

const PRODUCT_POOL = [
  "https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=1600&q=85",
  "https://images.unsplash.com/photo-1599599810769-bcde5a160d32?auto=format&fit=crop&w=1600&q=85",
  "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=1600&q=85",
  "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1600&q=85",
  "https://images.unsplash.com/photo-1560493676-04071c284f91?auto=format&fit=crop&w=1600&q=85",
];

const LODGING_POOL = [
  "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1600&q=85",
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1600&q=85",
  "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=1600&q=85",
  "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1600&q=85",
  "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1600&q=85",
];

function hashId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = Math.imul(31, h) + id.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

export function listingHeroGradient(listing: Pick<Listing, "id">): string {
  return GRADIENTS[hashId(listing.id) % GRADIENTS.length];
}

/** 카드·상세 커버 사진 — 서버에 저장된 AI/업로드 이미지 우선 */
export function listingCoverPhoto(listing: Listing): string {
  const raw = listing.cover_image_url;
  if (raw && typeof raw === "string" && raw.trim()) {
    const u = raw.trim();
    if (u.startsWith("http://") || u.startsWith("https://")) return u;
    return u.startsWith("/") ? u : `/${u}`;
  }
  const known = COVER_BY_ID[listing.id];
  if (known) return known;
  const pool = listing.kind === "product" ? PRODUCT_POOL : LODGING_POOL;
  return pool[hashId(listing.id) % pool.length];
}

export function listingDemoViewCount(id: string): number {
  const h = hashId(id);
  return 320 + (h % 2100);
}

export function listingDemoRating(id: string): string {
  const v = 46 + (hashId(id) % 5);
  return (v / 10).toFixed(1);
}

export function listingReviewCount(id: string): number {
  return 8 + (hashId(id) % 112);
}
