/** 쇼핑몰 메가메뉴·공급자 업종과 동일한 분류 */
export type ListingCategory =
  | "experience"
  | "rural"
  | "fishing"
  | "craft"
  | "leisure"
  | "lodging";

export const LISTING_CATEGORIES: {
  id: ListingCategory;
  label: string;
  short: string;
  sellerId: string;
  emoji: string;
}[] = [
  { id: "rural", label: "농촌 · 특산", short: "농촌", sellerId: "seller-rural", emoji: "🌾" },
  { id: "fishing", label: "어촌 · 해산", short: "어촌", sellerId: "seller-fishing", emoji: "🐟" },
  { id: "craft", label: "공예 · 전통", short: "공예", sellerId: "seller-craft", emoji: "🎨" },
  { id: "leisure", label: "휴양 · 레저", short: "휴양·레저", sellerId: "seller-leisure", emoji: "⛺" },
  {
    id: "experience",
    label: "체험 패키지",
    short: "체험",
    sellerId: "seller-experience",
    emoji: "🧺",
  },
  { id: "lodging", label: "숙소 · 캠핑", short: "숙박", sellerId: "seller-lodging", emoji: "🏡" },
];

export function sectorById(id: ListingCategory) {
  return LISTING_CATEGORIES.find((s) => s.id === id);
}

export function categoryLabel(id: ListingCategory | string | undefined): string {
  return sectorById(id as ListingCategory)?.short ?? "기타";
}
