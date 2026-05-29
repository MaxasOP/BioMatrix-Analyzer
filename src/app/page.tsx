import Link from "next/link";

const cards = [
  {
    href: "/analyze",
    title: "Analyze",
    description: "Paste DNA/RNA, compare sequences, and get AI interpretation.",
  },
  {
    href: "/generator",
    title: "Generate",
    description: "Create test inputs and open them directly in the analyzer.",
  },
  {
    href: "/history",
    title: "History",
    description: "Restore saved analyses from your cloud workspace.",
  },
  {
    href: "/profile",
    title: "Profile",
    description: "Sign in and keep each user’s analyses separate.",
  },
];

export default function Home() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <section className="grid gap-8 rounded-[32px] border border-white/10 bg-white/5 p-8 shadow-[0_18px_60px_rgba(0,0,0,0.12)] backdrop-blur-xl lg:grid-cols-[1.1fr_0.9fr]">
        <div className="grid gap-6">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-cyan-300">BioMatrix AI</p>
            <h1 className="mt-3 text-4xl font-semibold leading-tight sm:text-6xl">
              A cleaner way to work with sequence tools
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--ink-soft)] sm:text-lg">
              The app is now split into focused pages so the analyzer, generator, history,
              and profile each have their own space.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/analyze"
              className="rounded-full bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
            >
              Open analyzer
            </Link>
            <Link
              href="/profile"
              className="rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-slate-100 transition hover:bg-white/10"
            >
              Sign in
            </Link>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {cards.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="rounded-3xl border border-white/10 bg-white/5 p-5 transition hover:-translate-y-1 hover:bg-white/10"
            >
              <h2 className="text-lg font-semibold text-slate-100">{card.title}</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">
                {card.description}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}