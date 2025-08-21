import { useMemo, useState } from "react";

// These already exist in your /components folder
import ConnectPinterest from "./components/ConnectPinterest";
import BoardSelect from "./components/BoardSelect";
import ScheduleForm from "./components/ScheduleForm";

export default function App() {
  // read ?pro=1 from the URL
  const isPro = useMemo(() => {
    const p = new URLSearchParams(window.location.search);
    return p.get("pro") === "1";
  }, []);

  // hold the selected board id for the scheduler
  const [boardId, setBoardId] = useState("");

  return (
    <main className="min-h-screen bg-[var(--pp-bg)] text-[var(--pp-ink)]">
      {/* TOP BAR */}
      <div className="max-w-5xl mx-auto px-6 py-6">
        <header className="pp-card flex items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <img
              src="/logo.svg"
              alt="Pin Pilot"
              className="w-10 h-10"
            />
            <h1 className="text-xl sm:text-2xl font-semibold text-[var(--pp-primary)]">
              Pin Pilot
            </h1>
          </div>

          <nav className="hidden sm:flex items-center gap-2">
            <a href="https://pinpilotapp.com" className="pp-btn pp-btn-ghost">
              Home
            </a>
            <a href="https://pinpilotapp.com/#pricing" className="pp-btn pp-btn-ghost">
              Pricing
            </a>
            <a href="https://pinpilotapp.com/blog" className="pp-btn pp-btn-ghost">
              Blog
            </a>
          </nav>
        </header>
      </div>

      {/* HERO / STATUS */}
      <div className="max-w-5xl mx-auto px-6">
        {!isPro ? (
          <section className="pp-card space-y-4">
            <h2 className="text-lg font-semibold">Welcome 👋</h2>
            <p>
              You’re on the <b>Free</b> version. Upgrade to unlock{" "}
              <span className="font-medium">Pinterest connect</span> and{" "}
              <span className="font-medium">auto-scheduling</span>.
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href="?pro=1"
                className="pp-btn pp-btn-primary"
              >
                Enable Pro (preview)
              </a>
              <a
                href="https://pinpilotapp.com/#pricing"
                className="pp-btn pp-btn-ghost"
              >
                See plans
              </a>
            </div>
          </section>
        ) : (
          <section className="pp-card space-y-2">
            <div className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-[var(--pp-accent)]" />
              <p className="font-medium">Pro features enabled for this session.</p>
            </div>
            <p className="text-sm opacity-80">
              Remove <code>?pro=1</code> from the URL to view the Free screen.
            </p>
          </section>
        )}
      </div>

      {/* MAIN GRID */}
      {isPro && (
        <div className="max-w-5xl mx-auto px-6 mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT COLUMN: Connect + Boards */}
          <section className="lg:col-span-1 space-y-6">
            <div className="pp-card space-y-4">
              <h3 className="text-lg font-semibold text-[var(--pp-primary)]">
                1) Connect Pinterest
              </h3>
              <ConnectPinterest />
            </div>

            <div className="pp-card space-y-4">
              <h3 className="text-lg font-semibold text-[var(--pp-primary)]">
                2) Choose a Board
              </h3>
              {/* BoardSelect should call onSelect with a board id */}
              <BoardSelect onSelect={(id: string) => setBoardId(id)} />
              <p className="text-sm opacity-80">
                Selected Board ID: <span className="font-mono">{boardId || "—"}</span>
              </p>
            </div>
          </section>

          {/* RIGHT: Scheduler */}
          <section className="lg:col-span-2">
            <div className="pp-card space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-[var(--pp-primary)]">
                  3) Schedule a Pin
                </h3>
                <a
                  href="https://pinpilotapp.com/#how-it-works"
                  className="pp-btn pp-btn-ghost"
                  target="_blank"
                  rel="noreferrer"
                >
                  How it works
                </a>
              </div>

              {/* Your scheduler already expects selectedBoardId */}
              <ScheduleForm selectedBoardId={boardId} />
            </div>
          </section>
        </div>
      )}

      {/* FOOTER */}
      <footer className="max-w-5xl mx-auto px-6 py-10">
        <div className="pp-card-pad text-sm opacity-80">
          © {new Date().getFullYear()} Pin Pilot &middot{" "}
          <a className="underline" href="https://pinpilotapp.com/#privacy-policy">
            Privacy
          </a>{" "}
          ·{" "}
          <a className="underline" href="https://pinpilotapp.com/#terms-of-service">
            Terms
          </a>
        </div>
      </footer>
    </main>
  );
}