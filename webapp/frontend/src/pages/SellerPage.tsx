import { FormEvent, useEffect, useState } from "react";

import { ConversationView } from "../components/ConversationView";
import { MicButton } from "../components/MicButton";
import { VoiceHints } from "../components/VoiceHints";
import { api } from "../lib/api";
import { useConversation } from "../store/conversation";
import type { Listing } from "../types";

export function SellerPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const listingSubmitted = useConversation((s) => s.listingSubmitted);
  const setListingSubmitted = useConversation((s) => s.setListingSubmitted);

  const [kind, setKind] = useState<"product" | "lodging">("product");
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [stock, setStock] = useState("10");
  const [maxGuests, setMaxGuests] = useState("4");
  const [busy, setBusy] = useState(false);

  const reload = () =>
    api.getListings().then(setListings).catch(() => setListings([]));

  useEffect(() => {
    reload().finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (listingSubmitted) {
      reload();
    }
  }, [listingSubmitted]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.createListing({
        kind,
        title: title.trim(),
        description: description.trim(),
        price: Math.max(0, parseInt(price, 10) || 0),
        location: location.trim(),
        stock: kind === "product" ? Math.max(0, parseInt(stock, 10) || 0) : null,
        max_guests:
          kind === "lodging" ? Math.max(1, parseInt(maxGuests, 10) || 4) : null,
      });
      setTitle("");
      setPrice("");
      setDescription("");
      setLocation("");
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
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 flex flex-wrap items-center justify-between gap-3">
          <p className="font-semibold text-emerald-900">
            음성으로 등록이 완료되었습니다. 목록을 확인해 보세요.
          </p>
          <button
            type="button"
            className="btn-ghost text-emerald-800 border-emerald-200"
            onClick={() => setListingSubmitted(false)}
          >
            닫기
          </button>
        </div>
      )}

      <section className="rounded-3xl border border-hades-line bg-white p-6 sm:p-8 shadow-md">
        <h1 className="text-2xl sm:text-3xl font-bold text-hades-text">판매자 모드</h1>
        <p className="mt-2 text-lg text-hades-muted max-w-2xl leading-relaxed">
          글씨가 불편하시면 옆의 마이크로 말씀만 하셔도 됩니다. 상품이면 실물을,
          민박이면 숙박이라고 먼저 말씀해 주시면 돼요.
        </p>

        <div className="mt-8 grid grid-cols-1 xl:grid-cols-2 gap-8">
          <div className="rounded-2xl border border-blue-100 bg-blue-50/30 p-5">
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
                    onClick={() => setKind("lodging")}
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
              <button type="submit" className="btn-primary w-full text-xl py-4" disabled={busy}>
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
                {listings.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-hades-muted">
                      아직 올린 글이 없어요. 위에서 등록해 보세요.
                    </td>
                  </tr>
                ) : (
                listings.map((row) => (
                  <tr key={row.id} className="border-t border-hades-line">
                    <td className="px-4 py-3">
                      {row.kind === "product" ? "상품" : "숙박"}
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
