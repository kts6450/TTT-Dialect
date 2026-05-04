import { CatalogPanel } from "./components/CatalogPanel";
import { ConfirmCard } from "./components/ConfirmCard";
import { ConversationView } from "./components/ConversationView";
import { Header } from "./components/Header";
import { HelpHints } from "./components/HelpHints";
import { MicButton } from "./components/MicButton";
import { ReceiptCard } from "./components/ReceiptCard";
import { SlotForm } from "./components/SlotForm";
import { SlotPanel } from "./components/SlotPanel";
import { Stepper } from "./components/Stepper";
import { useConversation } from "./store/conversation";

export default function App() {
  const reservation = useConversation((s) => s.reservation);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* 진행 단계 막대 */}
      <div className="px-6 py-3 border-b border-white/5 bg-hades-bg/40">
        <div className="max-w-7xl mx-auto">
          <Stepper />
        </div>
      </div>

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 메인 — 음성 인터랙션 */}
        <section className="lg:col-span-7 flex flex-col gap-5">
          {reservation ? (
            <ReceiptCard />
          ) : (
            <>
              <ConfirmCard />
              <HelpHints />
              <MicButton />
              <SlotForm />
              <ConversationView />
            </>
          )}
        </section>

        {/* 사이드 — 예약 정보 + 카탈로그 */}
        <aside className="lg:col-span-5 flex flex-col gap-4">
          <SlotPanel />
          <CatalogPanel />
        </aside>
      </main>

      <footer className="px-8 py-4 text-center text-sm text-hades-muted/70 border-t border-white/5">
        Hades — 학습된 방언/노인 음성 인식 + Claude 대화. 시연용 데모.
      </footer>
    </div>
  );
}
