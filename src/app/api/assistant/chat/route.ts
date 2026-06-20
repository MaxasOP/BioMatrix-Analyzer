import { google } from "@ai-sdk/google";
import { embed, streamText, type ModelMessage } from "ai";
import { NextResponse } from "next/server";

import { SUPABASE_TABLE, createSupabaseClient } from "@/lib/supabase";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function getUserFromRequest(request: Request) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length)
    : null;
  const supabase = createSupabaseClient(token);

  if (!supabase || !token) {
    return { supabase, user: null };
  }

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    return { supabase, user: null };
  }

  return { supabase, user: data.user };
}

export async function POST(request: Request) {
  const { supabase, user } = await getUserFromRequest(request);
  // // if (!supabase || !user) {
//   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
// }
  // If user is not authenticated, we proceed without personalized context.
  // The vector search will be skipped as there is no user ID.
  // This allows the widget to be used anonymously.

//   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
// }
// No unauthorized return; continue processing

  let body: { messages?: ModelMessage[] } | null = null;
  try {
    body = await request.json();
  } catch {
    body = null;
  }

  const messages = body?.messages || [];
  const lastMessage = messages[messages.length - 1];

  if (!lastMessage) {
    return NextResponse.json({ error: "No messages found" }, { status: 400 });
  }

  // Safely extract string content from possible shapes of content
  let contentText = "";
  if (typeof lastMessage.content === "string") {
    contentText = lastMessage.content;
  } else if (Array.isArray(lastMessage.content)) {
    contentText = lastMessage.content
      .map((part) => (part.type === "text" ? part.text : ""))
      .join(" ");
  }

  // 1. Generate query embedding for the last user message
  let queryVector: number[] | null = null;
  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (geminiApiKey && contentText.trim()) {
    try {
      const { embedding } = await embed({
        model: google.textEmbeddingModel("text-embedding-004"),
        value: contentText,
      });
      queryVector = embedding;
    } catch (err) {
      console.error("Assistant embedding failed:", err);
    }
  }

  // 2. Vector search in database restricted to the current user
  let contextText = "No relevant saved analysis records found in your history.";
  if (queryVector && user) {
    try {
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;

      if (serviceRoleKey && url) {
        const svc = createServiceClient(url, serviceRoleKey, {
          auth: { persistSession: false, autoRefreshToken: false },
        });

        const { data, error } = await svc.rpc("match_analysis_history", {
          query_embedding: queryVector,
          match_threshold: 0.2,
          match_count: 5,
          owner_user_id: user.id,
        });

        if (!error && data && data.length > 0) {
          contextText = data
            .map((row: any, i: number) => {
              const analysis = row.payload?.analysis || {};
              const mutations = row.payload?.mutationSummary || {};
              return `Record #${i + 1} (Saved at: ${row.created_at}):
 - Preview: ${row.sequence_preview}
 - Type: ${analysis.sequenceType || "Unknown"}
 - Length: ${analysis.length || 0} bp
 - GC Content: ${analysis.gcPercentage ? Number(analysis.gcPercentage).toFixed(2) : "0"}%
 - ORFs: ${analysis.orfs ? analysis.orfs.length : 0}
 - Mutations: Total=${mutations.total || 0}, Subs=${mutations.substitutions || 0}, Ins=${mutations.insertions || 0}, Dels=${mutations.deletions || 0}`;
            })
            .join("\n\n");
        }
      }
    } catch (err) {
      console.error("Assistant search failed:", err);
    }
  }

  // 3. Setup Vercel AI SDK streaming response
  const systemPrompt = `You are the BioMatrix Assistant.
Help the researcher analyze and understand their saved sequence history.
Use the following context from their history when answering their question.
If the retrieved history is not related to their question, reply based on general bioinformatics knowledge.

Retrieved User Context:
${contextText}`;

  const result = streamText({
    model: google("gemini-2.5-flash"),
    system: systemPrompt,
    messages,
  });

  return result.toUIMessageStreamResponse();
}
