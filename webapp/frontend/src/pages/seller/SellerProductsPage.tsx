import { FormEvent, useCallback, useEffect, useState } from "react";

import { ConversationView } from "../../components/ConversationView";
import { PageHeader } from "../../components/ui/PageHeader";
import { MicButton } from "../../components/MicButton";
import { VoiceHints } from "../../components/VoiceHints";
import { api } from "../../lib/api";
import {
  LISTING_CATEGORIES,
  categoryLabel,
  type ListingCategory,
} from "../../lib/sellerSectors";
import { useListingsStreamVersion } from "../../hooks/useListingsStreamVersion";
import {
  useAuthDisplayName,
  useAuthSellerId,
  useAuthSellerSector,
} from "../../store/auth";
import { useConversation } from "../../store/conversation";
import type { Listing, ListingGuide } from "../../types";

export function SellerProductsPage() {
  const sellerSector = useAuthSellerSector();
  const sellerId = useAuthSellerId();
  const displayName = useAuthDisplayName();
  const streamTick = useListingsStreamVersion();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const listingSubmitted = useConversation((s) => s.listingSubmitted);
  const setListingSubmitted = useConversation((s) => s.setListingSubmitted);

  const [kind, setKind] = useState<"product" | "lodging">("product");
  const [category, setCategory] = useState<ListingCategory>(sellerSector ?? "rural");
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [guide, setGuide] = useState<ListingGuide | null>(null);
  const [location, setLocation] = useState("");
  const [stock, setStock] = useState("10");
  const [maxGuests, setMaxGuests] = useState("4");
  const [busy, setBusy] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [coverDataUrl, setCoverDataUrl] = useState<string | null>(null);
  const [extraPhotos, setExtraPhotos] = useState<string[]>([]);
  const [imagePromptKo, setImagePromptKo] = useState("");
  const [imagePromptEn, setImagePromptEn] = useState("");
  const [promptSummary, setPromptSummary] = useState<string | null>(null);
  const [aiHint, setAiHint] = useState<string | null>(null);
  const slots = useConversation((s) => s.slots);

  const reload = useCallback(
    () => api.getListings().then(setListings).catch(() => setListings([])),
    []
  );

  useEffect(() => {
    reload().finally(() => setLoading(false));
  }, [reload]);

  useEffect(() => {
    if (listingSubmitted) {
      reload();
    }
  }, [listingSubmitted, reload]);

  useEffect(() => {
    void reload();
  }, [streamTick, reload]);

  useEffect(() => {
    if (sellerSector) setCategory(sellerSector);
  }, [sellerSector]);

  useEffect(() => {
    if (slots.kind === "product" || slots.kind === "lodging") {
      setKind(slots.kind);
      if (slots.kind === "lodging") setCategory("lodging");
    }
    if (typeof slots.title === "string" && slots.title.trim()) {
      setTitle(slots.title.trim());
    }
    if (typeof slots.price === "number" && slots.price >= 0) {
      setPrice(String(slots.price));
    }
    if (typeof slots.location === "string" && slots.location.trim()) {
      setLocation(slots.location.trim());
    }
    if (typeof slots.description === "string" && slots.description.trim()) {
      setDescription(slots.description.trim());
    }
    if (slots.kind === "product" && typeof slots.stock === "number") {
      setStock(String(slots.stock));
    }
    if (slots.kind === "lodging" && typeof slots.max_guests === "number") {
      setMaxGuests(String(slots.max_guests));
    }
  }, [slots]);

  const fillPackageAi = async () => {
    const t = title.trim();
    const p = parseInt(price, 10) || 0;
    if (!t) {
      setAiHint("이름을 먼저 적어 주세요.");
      return;
    }
    setAiBusy(true);
    setAiHint(null);
    try {
      const r = await api.draftListingPackage({
        kind,
        title: t,
        price: p,
        location: location.trim(),
        category: kind === "lodging" && category !== "lodging" ? "lodging" : category,
      });
      setDescription(r.description);
      setGuide(r.guide);
      setAiHint("상품 소개·체험 포인트·이용 안내를 채웠습니다. 등록 후 쇼핑 상세에서 확인하세요.");
    } catch (e) {
      setAiHint(e instanceof Error ? e.message : "상품 정보를 만들지 못했습니다.");
    } finally {
      setAiBusy(false);
    }
  };

  const fillDescriptionAi = async () => {
    const t = title.trim();
    const p = parseInt(price, 10) || 0;
    if (!t) {
      setAiHint("이름을 먼저 적어 주세요.");
      return;
    }
    setAiBusy(true);
    setAiHint(null);
    try {
      const r = await api.draftListingDescription({
        kind,
        title: t,
        price: p,
        location: location.trim(),
      });
      setDescription(r.description);
    } catch (e) {
      setAiHint(e instanceof Error ? e.message : "설명을 만들지 못했습니다.");
    } finally {
      setAiBusy(false);
    }
  };

  const enhanceImagePrompt = async () => {
    const t = title.trim();
    if (!t) {
      setAiHint("이름을 먼저 적어 주세요.");
      return;
    }
    setAiBusy(true);
    setAiHint(null);
    setPromptSummary(null);
    try {
      const r = await api.enhanceImagePrompt({
        kind,
        title: t,
        location: location.trim(),
        category,
        description: description.trim(),
        user_hint: imagePromptKo.trim(),
      });
      setImagePromptEn(r.prompt_en);
      setPromptSummary(r.summary_ko);
    } catch (e) {
      setAiHint(e instanceof Error ? e.message : "프롬프트를 다듬지 못했습니다.");
    } finally {
      setAiBusy(false);
    }
  };

  const generateCoverAi = async () => {
    const t = title.trim();
    if (!t) {
      setAiHint("이름을 먼저 적어 주세요.");
      return;
    }
    setAiBusy(true);
    setAiHint(null);
    try {
      let promptEn = imagePromptEn.trim();
      if (!promptEn) {
        const enhanced = await api.enhanceImagePrompt({
          kind,
          title: t,
          location: location.trim(),
          category,
          description: description.trim(),
          user_hint: imagePromptKo.trim(),
        });
        promptEn = enhanced.prompt_en;
        setImagePromptEn(promptEn);
        setPromptSummary(enhanced.summary_ko);
      }
      const r = await api.draftListingImage({
        kind,
        title: t,
        location: location.trim(),
        category,
        description: description.trim(),
        prompt_en: promptEn,
      });
      setCoverDataUrl(`data:${r.mime_type};base64,${r.image_base64}`);
    } catch (e) {
      setAiHint(e instanceof Error ? e.message : "이미지를 만들지 못했습니다.");
    } finally {
      setAiBusy(false);
    }
  };

  const onPickExtraPhotos = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const reads: Promise<string>[] = [];
    Array.from(files)
      .slice(0, 8)
      .forEach((f) => {
        if (!f.type.startsWith("image/")) return;
        reads.push(
          new Promise((resolve, reject) => {
            const r = new FileReader();
            r.onload = () => resolve(String(r.result || ""));
            r.onerror = () => reject(new Error("read fail"));
            r.readAsDataURL(f);
          })
        );
      });
    try {
      const urls = await Promise.all(reads);
      setExtraPhotos((prev) => [...prev, ...urls].slice(0, 10));
    } catch {
      /* */
    }
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const created = await api.createListing({
        kind,
        category: kind === "lodging" && category !== "lodging" ? "lodging" : category,
        seller_id: sellerId ?? undefined,
        title: title.trim(),
        description: description.trim(),
        price: Math.max(0, parseInt(price, 10) || 0),
        location: location.trim(),
        stock: kind === "product" ? Math.max(0, parseInt(stock, 10) || 0) : null,
        max_guests:
          kind === "lodging" ? Math.max(1, parseInt(maxGuests, 10) || 4) : null,
        cover_image_base64: coverDataUrl
          ? coverDataUrl.includes(",")
            ? coverDataUrl.split(",", 2)[1]
            : coverDataUrl
          : undefined,
        guide: guide ?? undefined,
      });
      for (const data of extraPhotos) {
        const b64 = data.includes(",") ? data.split(",", 2)[1] : data;
        try {
          await api.addListingPhoto(created.id, { image_base64: b64 });
        } catch {
          /* skip */
        }
      }
      setTitle("");
      setPrice("");
      setDescription("");
      setGuide(null);
      setLocation("");
      setCoverDataUrl(null);
      setExtraPhotos([]);
      setImagePromptKo("");
      setImagePromptEn("");
      setPromptSummary(null);
      setAiHint(null);
      await reload();
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("이 글을 내릴까요?")) return;
    try {
      await api.deleteListing(id);
      await reload();
    } catch {
      /* */
    }
  };

  return (
    <div className="space-y-8">
      {listingSubmitted && (
        <div className="rounded-2xl border border-shop-teal/30 bg-shop-tealLight/60 p-5 flex flex-wrap items-center justify-between gap-3">
          <p className="font-semibold text-shop-tealDark">
            음성으로 등록이 완료되었습니다. 목록을 확인해 보세요.
          </p>
          <button
            type="button"
            className="btn-ghost text-shop-tealDark border-shop-teal/30"
            onClick={() => setListingSubmitted(false)}
          >
            닫기
          </button>
        </div>
      )}

      <PageHeader badge="공급자" title="상품 등록">
        {displayName}님 · 대표 업종{" "}
        <strong>{categoryLabel(sellerSector ?? "rural")}</strong>
        으로 로그인했습니다. 글마다 노출 카테고리를 고를 수 있고, 기본값은 대표 업종입니다.
      </PageHeader>

      <section className="card p-6 sm:p-8">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          <div className="rounded-2xl border border-brand-line bg-brand-cream/80 p-5">
            <h2 className="text-lg font-bold text-hades-text mb-2">음성으로 올리기</h2>
            <VoiceHints />
            <MicButton />
            <ConversationView />
          </div>

          <div>
            <h2 className="text-lg font-bold text-hades-text mb-4">손으로 입력하기</h2>
            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-hades-muted mb-1">
                  쇼핑몰 노출 카테고리
                </label>
                <select
                  className="input-field"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ListingCategory)}
                >
                  {LISTING_CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-hades-muted">
                  전체 메뉴(농촌·어촌 등)에 이렇게 분류됩니다. 숙박은 「숙소·캠핑」을 권장합니다.
                </p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-hades-muted mb-1">
                  종류
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setKind("product")}
                    className={
                      kind === "product" ? "btn-primary flex-1" : "btn-ghost flex-1"
                    }
                  >
                    상품
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setKind("lodging");
                      setCategory("lodging");
                    }}
                    className={
                      kind === "lodging" ? "btn-primary flex-1" : "btn-ghost flex-1"
                    }
                  >
                    숙박
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-hades-muted mb-1">
                  이름
                </label>
                <input
                  className="w-full rounded-xl border border-hades-line px-4 py-3 text-lg"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  placeholder="예: 올해 햅쌀 10키로"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-hades-muted mb-1">
                  가격 (원)
                </label>
                <input
                  className="w-full rounded-xl border border-hades-line px-4 py-3 text-lg"
                  inputMode="numeric"
                  value={price}
                  onChange={(e) => setPrice(e.target.value.replace(/\D/g, ""))}
                  required
                  placeholder="42000"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-hades-muted mb-1">
                  설명
                </label>
                <textarea
                  className="w-full rounded-xl border border-hades-line px-4 py-3 text-lg min-h-[100px]"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="어떤 물건인지, 왜 좋은지 적어 주세요."
                />
              </div>
              <div className="rounded-xl border border-violet-100 bg-violet-50/40 p-4 space-y-4">
                <p className="text-sm font-semibold text-hades-text">
                  AI로 채우기 — 루플처럼 체험 포인트·STEP·환불·인근 관광지까지 한 번에
                  (이름·가격·지역·카테고리 반영)
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="btn-primary text-base py-2.5 px-4"
                    disabled={busy || aiBusy}
                    onClick={() => void fillPackageAi()}
                  >
                    상품정보·이용안내 한번에 AI 작성
                  </button>
                  <button
                    type="button"
                    className="btn-ghost text-base py-2.5 px-4 border-purple-200 text-purple-900"
                    disabled={busy || aiBusy}
                    onClick={() => void fillDescriptionAi()}
                  >
                    설명만 짧게
                  </button>
                </div>
                {guide ? (
                  <p className="text-sm text-shop-tealDark bg-shop-tealLight/50 rounded-lg px-3 py-2">
                    이용 안내 준비됨 · 체험 포인트 {(guide.highlights ?? []).length}개 · STEP{" "}
                    {(guide.steps ?? []).length}단계
                    {(guide.nearby ?? []).length > 0
                      ? ` · 인근 관광지 ${(guide.nearby ?? []).length}곳`
                      : ""}
                  </p>
                ) : null}
                <div className="border-t border-violet-200/60 pt-4 space-y-2">
                  <label className="block text-sm font-semibold text-hades-text">
                    사진에 담을 장면 (한국어, 선택)
                  </label>
                  <input
                    className="input-field text-base"
                    value={imagePromptKo}
                    onChange={(e) => setImagePromptKo(e.target.value)}
                    placeholder="예: 바다에서 우럭 낚는 모습, 배 위에서"
                  />
                  <p className="text-xs text-hades-muted">
                    «우럭 낚시»처럼 짧게만 적어도 됩니다. «프롬프트 강화»가 체험·특산에 맞는
                    영문 지시문으로 바꿔 줍니다.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="btn-ghost text-sm py-2 px-3 border-indigo-200 text-indigo-900"
                      disabled={busy || aiBusy}
                      onClick={() => void enhanceImagePrompt()}
                    >
                      프롬프트 강화
                    </button>
                    <button
                      type="button"
                      className="btn-primary text-sm py-2 px-4"
                      disabled={busy || aiBusy}
                      onClick={() => void generateCoverAi()}
                    >
                      대표 사진 AI 생성
                    </button>
                  </div>
                  {promptSummary ? (
                    <p className="text-sm text-shop-tealDark bg-shop-tealLight/50 rounded-lg px-3 py-2">
                      {promptSummary}
                    </p>
                  ) : null}
                  {imagePromptEn ? (
                    <details className="text-xs text-hades-muted">
                      <summary className="cursor-pointer font-semibold text-hades-text">
                        AI에 보내는 영문 프롬프트 (확인용)
                      </summary>
                      <p className="mt-2 whitespace-pre-wrap break-words">{imagePromptEn}</p>
                    </details>
                  ) : null}
                </div>
                <p className="text-xs text-hades-muted leading-relaxed">
                  사진은 <strong>OpenAI</strong>(<code className="text-xs">OPENAI_API_KEY</code>)
                  로 생성합니다. 체험·낚시는 음식 접시 사진이 아니라 활동 장면으로 맞춥니다.
                </p>
                {aiHint ? (
                  <p className="text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                    {aiHint}
                  </p>
                ) : null}
                {coverDataUrl ? (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-hades-muted">미리보기</p>
                    <div className="rounded-xl overflow-hidden border border-hades-line bg-white max-w-md">
                      <img
                        src={coverDataUrl}
                        alt="AI로 생성한 대표 이미지 미리보기"
                        className="w-full h-auto object-cover aspect-[16/11]"
                      />
                    </div>
                    <button
                      type="button"
                      className="text-sm text-slate-600 underline"
                      onClick={() => setCoverDataUrl(null)}
                    >
                      사진 지우기
                    </button>
                  </div>
                ) : null}

                <div className="border-t border-violet-200/60 pt-4 space-y-2">
                  <label className="block text-sm font-semibold text-hades-text">
                    추가 사진 (최대 10장 — 갤러리)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => void onPickExtraPhotos(e.target.files)}
                    className="block w-full text-sm text-hades-muted file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border file:border-shop-teal/30 file:bg-shop-tealLight file:text-shop-tealDark file:font-semibold"
                  />
                  {extraPhotos.length > 0 && (
                    <ul className="mt-2 flex flex-wrap gap-2">
                      {extraPhotos.map((src, i) => (
                        <li key={i} className="relative">
                          <img
                            src={src}
                            alt=""
                            className="w-20 h-20 object-cover rounded-lg border border-hades-line"
                          />
                          <button
                            type="button"
                            className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-rose-600 text-white text-xs font-bold shadow"
                            onClick={() =>
                              setExtraPhotos((prev) => prev.filter((_, j) => j !== i))
                            }
                            aria-label="사진 빼기"
                          >
                            ×
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  <p className="text-xs text-hades-muted">
                    상세 페이지의 갤러리에 표시됩니다. 게시 후 상품 행에서도 더 추가할 수 있습니다.
                  </p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-hades-muted mb-1">
                  지역
                </label>
                <input
                  className="w-full rounded-xl border border-hades-line px-4 py-3 text-lg"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="경기 김제시"
                />
              </div>
              {kind === "product" ? (
                <div>
                  <label className="block text-sm font-semibold text-hades-muted mb-1">
                    재고 (개)
                  </label>
                  <input
                    className="w-full rounded-xl border border-hades-line px-4 py-3 text-lg"
                    inputMode="numeric"
                    value={stock}
                    onChange={(e) => setStock(e.target.value.replace(/\D/g, ""))}
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-semibold text-hades-muted mb-1">
                    최대 인원
                  </label>
                  <input
                    className="w-full rounded-xl border border-hades-line px-4 py-3 text-lg"
                    inputMode="numeric"
                    value={maxGuests}
                    onChange={(e) => setMaxGuests(e.target.value.replace(/\D/g, ""))}
                  />
                </div>
              )}
              <button type="submit" className="btn-primary w-full text-xl py-4" disabled={busy || aiBusy}>
                {busy ? "올리는 중…" : "게시하기"}
              </button>
            </form>
          </div>
        </div>

      </section>

      <section className="rounded-3xl border border-hades-line bg-white overflow-hidden shadow-md">
        <div className="px-6 py-4 border-b border-hades-line bg-slate-50/80">
          <h2 className="text-xl font-bold text-hades-text">지금 판매 중인 글</h2>
        </div>
        {loading ? (
          <p className="p-8 text-center text-hades-muted">불러오는 중…</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-base">
              <thead className="bg-slate-100/80 text-sm text-hades-muted">
                <tr>
                  <th className="px-4 py-3">종류</th>
                  <th className="px-4 py-3">제목</th>
                  <th className="px-4 py-3">가격</th>
                  <th className="px-4 py-3">지역</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {(sellerId ? listings.filter((r) => r.seller_id === sellerId) : listings)
                  .length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-hades-muted">
                      아직 올린 글이 없어요. 위에서 등록해 보세요.
                    </td>
                  </tr>
                ) : (
                (sellerId ? listings.filter((r) => r.seller_id === sellerId) : listings).map(
                  (row) => (
                  <tr key={row.id} className="border-t border-hades-line">
                    <td className="px-4 py-3">
                      {categoryLabel(row.category)} · {row.kind === "product" ? "상품" : "숙박"}
                    </td>
                    <td className="px-4 py-3 font-semibold">
                      {row.emoji} {row.title}
                    </td>
                    <td className="px-4 py-3">{row.price.toLocaleString()}원</td>
                    <td className="px-4 py-3 text-sm text-hades-muted">{row.location}</td>
                    <td className="px-4 py-3">
                        <button
                          type="button"
                          className="text-sm text-red-600 font-semibold hover:underline"
                          onClick={() => remove(row.id)}
                        >
                          내리기
                        </button>
                    </td>
                  </tr>
                ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
