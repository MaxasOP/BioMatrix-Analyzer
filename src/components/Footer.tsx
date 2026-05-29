export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-white/5">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-8 text-sm text-[var(--ink-soft)] sm:flex-row sm:items-center sm:justify-between">
        <p>BioMatrix AI · DNA/RNA analysis, AI summaries, and cloud history</p>
        <p>Built with Next.js, Supabase, and Gemini</p>
      </div>
    </footer>
  );
}