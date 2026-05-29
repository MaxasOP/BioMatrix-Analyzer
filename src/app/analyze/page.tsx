import { Suspense } from "react";

import AnalyzeClient from "./AnalyzeClient";

export default function AnalyzePage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-6xl px-6 py-12 text-slate-200">
          Loading analysis tools...
        </main>
      }
    >
      <AnalyzeClient />
    </Suspense>
  );
}