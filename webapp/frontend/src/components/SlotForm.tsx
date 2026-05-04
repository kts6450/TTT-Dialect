import { useEffect, useState } from "react";

import { api } from "../lib/api";
import { useConversation } from "../store/conversation";
import type { Experience } from "../types";

/**
 * 음성 + 클릭 병행 — 현재 비어있는 슬롯의 빠른 입력 UI를 메인 영역에 표시.
 * 슬롯이 채워지면 자동으로 다음 단계 UI로 넘어간다.
 */
export function SlotForm() {
  const slots = useConversation((s) => s.slots);
  const reservation = useConversation((s) => s.reservation);
  const mergeSlots = useConversation((s) => s.mergeSlots);
  const [experiences, setExperiences] = useState<Experience[]>([]);

  useEffect(() => {
    api.getExperiences().then(setExperiences).catch(() => {});
  }, []);

  if (reservation) return null;

  const allFilled =
    slots.experience_id &&
    slots.date &&
    slots.time &&
    slots.headcount &&
    slots.contact_name &&
    slots.contact_phone;
  if (allFilled) return null; // 다 채워지면 ConfirmCard로 위임

  return (
    <div className="card p-5 border-hades-gold/15">
      <div className="text-sm text-hades-muted mb-3">
        말씀하시거나, 아래에서 직접 골라주세요
      </div>

      {!slots.experience_id && (
        <ExperiencePick experiences={experiences} onPick={(id) => mergeSlots({ experience_id: id })} />
      )}
      {slots.experience_id && !slots.date && (
        <DatePick onPick={(date) => mergeSlots({ date })} />
      )}
      {slots.experience_id && slots.date && !slots.time && (
        <TimePick onPick={(time) => mergeSlots({ time })} />
      )}
      {slots.experience_id && slots.date && slots.time && !slots.headcount && (
        <HeadcountPick onPick={(headcount) => mergeSlots({ headcount })} />
      )}
      {slots.experience_id &&
        slots.date &&
        slots.time &&
        slots.headcount &&
        !slots.contact_name && (
          <NamePick onPick={(contact_name) => mergeSlots({ contact_name })} />
        )}
      {slots.experience_id &&
        slots.date &&
        slots.time &&
        slots.headcount &&
        slots.contact_name &&
        !slots.contact_phone && (
          <PhonePick onPick={(contact_phone) => mergeSlots({ contact_phone })} />
        )}
    </div>
  );
}

// ── 체험 선택: 인기 6개만 그리드 (전체는 사이드 카탈로그) ──────
function ExperiencePick({
  experiences,
  onPick,
}: {
  experiences: Experience[];
  onPick: (id: string) => void;
}) {
  const top = experiences.slice(0, 6);
  return (
    <Section title="어떤 체험을 하시겠어요?">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {top.map((e) => (
          <button
            key={e.id}
            onClick={() => onPick(e.id)}
            className="border border-white/10 hover:border-hades-gold/50 rounded-xl p-3 text-left transition-colors"
          >
            <div className="text-2xl">{e.emoji}</div>
            <div className="font-semibold text-base mt-1">{e.name}</div>
          </button>
        ))}
      </div>
      <div className="text-sm text-hades-muted mt-2">
        오른쪽 카탈로그에서 다른 체험도 고르실 수 있어요
      </div>
    </Section>
  );
}

// ── 날짜 선택: 빠른 옵션 + 직접 입력 ────────────────────────
function DatePick({ onPick }: { onPick: (d: string) => void }) {
  const today = new Date();
  const opts = [
    { label: "내일", offset: 1 },
    { label: "모레", offset: 2 },
    { label: "이번 주 토요일", offset: nextWeekday(today, 6, false) },
    { label: "다음 주 토요일", offset: nextWeekday(today, 6, true) },
  ];
  const [custom, setCustom] = useState("");

  return (
    <Section title="언제 가시겠어요?">
      <div className="flex flex-wrap gap-2 mb-3">
        {opts.map((o) => {
          const d = addDays(today, o.offset);
          return (
            <button
              key={o.label}
              onClick={() => onPick(toIso(d))}
              className="bg-hades-surface hover:bg-hades-gold/20 rounded-xl px-4 py-2 text-base border border-white/10"
            >
              {o.label}
              <span className="ml-2 text-sm text-hades-muted">
                ({d.getMonth() + 1}월 {d.getDate()}일)
              </span>
            </button>
          );
        })}
      </div>
      <div className="flex gap-2">
        <input
          type="date"
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          className="bg-hades-surface border border-white/10 rounded-xl px-3 py-2 text-base flex-1"
        />
        <button
          disabled={!custom}
          onClick={() => onPick(custom)}
          className="btn-primary px-5"
        >
          확인
        </button>
      </div>
    </Section>
  );
}

// ── 시간 선택 ──────────────────────────────────────────────
function TimePick({ onPick }: { onPick: (t: string) => void }) {
  const slots = ["10:00", "11:00", "13:00", "14:00", "15:00", "16:00", "18:00"];
  return (
    <Section title="몇 시에 가시겠어요?">
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {slots.map((t) => (
          <button
            key={t}
            onClick={() => onPick(t)}
            className="bg-hades-surface hover:bg-hades-gold/20 rounded-xl py-3 text-lg font-semibold border border-white/10"
          >
            {humanTime(t)}
          </button>
        ))}
      </div>
    </Section>
  );
}

// ── 인원 ───────────────────────────────────────────────────
function HeadcountPick({ onPick }: { onPick: (n: number) => void }) {
  const [n, setN] = useState(1);
  return (
    <Section title="몇 분이서 가시나요?">
      <div className="flex items-center gap-4">
        <button
          onClick={() => setN((v) => Math.max(1, v - 1))}
          className="bg-hades-surface rounded-xl w-14 h-14 text-3xl border border-white/10"
        >
          −
        </button>
        <div className="text-4xl font-bold text-hades-gold w-20 text-center">
          {n}
        </div>
        <button
          onClick={() => setN((v) => Math.min(10, v + 1))}
          className="bg-hades-surface rounded-xl w-14 h-14 text-3xl border border-white/10"
        >
          +
        </button>
        <div className="text-lg text-hades-muted">명</div>
        <button onClick={() => onPick(n)} className="btn-primary ml-auto">
          확인
        </button>
      </div>
    </Section>
  );
}

// ── 이름 ───────────────────────────────────────────────────
function NamePick({ onPick }: { onPick: (s: string) => void }) {
  const [v, setV] = useState("");
  return (
    <Section title="예약자 성함은요?">
      <div className="flex gap-2">
        <input
          value={v}
          onChange={(e) => setV(e.target.value)}
          placeholder="홍길동"
          className="bg-hades-surface border border-white/10 rounded-xl px-4 py-3 text-lg flex-1"
          autoFocus
        />
        <button
          disabled={!v.trim()}
          onClick={() => onPick(v.trim())}
          className="btn-primary px-6"
        >
          확인
        </button>
      </div>
    </Section>
  );
}

// ── 연락처 ──────────────────────────────────────────────────
function PhonePick({ onPick }: { onPick: (s: string) => void }) {
  const [v, setV] = useState("");
  return (
    <Section title="연락처를 알려주세요">
      <div className="flex gap-2">
        <input
          value={v}
          onChange={(e) => setV(e.target.value)}
          placeholder="010-1234-5678"
          className="bg-hades-surface border border-white/10 rounded-xl px-4 py-3 text-lg flex-1"
          inputMode="tel"
          autoFocus
        />
        <button
          disabled={!v.trim()}
          onClick={() => onPick(v.trim())}
          className="btn-primary px-6"
        >
          확인
        </button>
      </div>
    </Section>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-lg font-semibold mb-3 text-hades-text">{title}</div>
      {children}
    </div>
  );
}

// ── 유틸 ────────────────────────────────────────────────────
function addDays(d: Date, n: number) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function toIso(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** 다음 dow(0=일,6=토)까지 며칠. nextWeek=true면 그 다음 주. */
function nextWeekday(d: Date, dow: number, nextWeek: boolean) {
  const cur = d.getDay();
  let diff = (dow - cur + 7) % 7;
  if (diff === 0) diff = 7;
  if (nextWeek) diff += 7;
  return diff;
}

function humanTime(t: string) {
  const [h] = t.split(":").map(Number);
  if (h < 12) return `오전 ${h}시`;
  if (h === 12) return "낮 12시";
  return `오후 ${h - 12}시`;
}
