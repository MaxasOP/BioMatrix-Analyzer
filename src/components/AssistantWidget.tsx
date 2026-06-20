"use client";

import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import type { Session } from "@supabase/supabase-js";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";

export default function AssistantWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const supabase = createBrowserSupabaseClient();

  useEffect(() => {
    if (!supabase) return;
    void supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_, nextSession) => {
      setSession(nextSession);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const [chatInput, setChatInput] = useState("");

  // Use a stable ref for headers so that DefaultChatTransport reads the updated token on subsequent requests
  const headersRef = useRef<{ Authorization: string }>({ Authorization: "" });

  if (session?.access_token) {
    headersRef.current.Authorization = `Bearer ${session.access_token}`;
  } else {
    headersRef.current.Authorization = "";
  }

  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/assistant/chat",
      headers: headersRef.current,
    }),
  });

  const isLoading = status === "streaming";

  useEffect(() => {
    console.log("Rex debug - status:", status);
    console.log("Rex debug - messages:", messages);
    if (error) {
      console.error("Rex debug - error:", error);
    }
  }, [messages, status, error]);

  const handleFormSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!chatInput.trim()) return;
    sendMessage({ text: chatInput });
    setChatInput("");
  };

  // Auto-scroll to the bottom of the message container
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  // Only render if the user is authenticated (to match the API security)
  // if (!session) return null; // Widget rendered without auth gating

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {/* Floating Action Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-tr from-cyan-500 to-emerald-400 p-[1px] shadow-[0_8px_32px_rgba(6,182,212,0.35)] transition-all hover:scale-105 active:scale-95"
          aria-label="Open AI Assistant"
        >
          <div className="flex h-full w-full items-center justify-center rounded-full bg-slate-950 transition-colors group-hover:bg-slate-950/90">
            <svg
              className="h-6 w-6 text-cyan-400 transition-transform group-hover:rotate-12"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </div>
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500"></span>
          </span>
        </button>
      )}

      {/* Floating Chat Window */}
      {isOpen && (
        <div className="flex h-[520px] w-[360px] flex-col rounded-[24px] border border-white/10 bg-slate-950/80 shadow-[0_24px_64px_rgba(0,0,0,0.5)] backdrop-blur-xl animate-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/5 px-5 py-4">
            <div className="flex items-center gap-2.5">
              <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <div>
                <h3 className="text-sm font-semibold text-slate-100">Rex</h3>
                <p className="text-[10px] text-slate-400">RAG History Search Enabled</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-full p-1 text-slate-400 hover:bg-white/5 hover:text-slate-100 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 scrollbar-thin scrollbar-thumb-white/5">
            {messages.length === 0 && (
              <div className="flex h-full flex-col items-center justify-center text-center px-4 py-8">
                <div className="rounded-full bg-cyan-500/10 p-3 text-cyan-400">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                    />
                  </svg>
                </div>
                <h4 className="mt-3 text-sm font-medium text-slate-200">Ask your History</h4>
                <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                  Query your saved DNA/RNA sequence runs, mutation reports, or general bioinformatics concepts.
                </p>
              </div>
            )}

            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-6 ${
                    m.role === "user"
                      ? "bg-cyan-500 text-slate-950 font-medium rounded-tr-none"
                      : "bg-white/5 text-slate-200 rounded-tl-none border border-white/5"
                  }`}
                >
                  {m.parts.map((part, idx) => {
                    if (part.type === "text") {
                      return <span key={idx}>{part.text}</span>;
                    }
                    return null;
                  })}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                </span>
                BioMatrix AI is looking up history...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Form */}
          <form onSubmit={handleFormSubmit} className="border-t border-white/5 p-4 flex gap-2">
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Query history or ask biology..."
              className="flex-1 rounded-xl border border-white/10 bg-slate-900 px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 outline-none focus:border-cyan-500"
            />
            <button
              type="submit"
              disabled={isLoading || !chatInput.trim()}
              className="flex items-center justify-center rounded-xl bg-cyan-500 px-3.5 text-slate-950 transition hover:bg-cyan-400 disabled:opacity-50"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
