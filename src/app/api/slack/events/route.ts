import { NextResponse } from "next/server";
import { WebClient } from "@slack/web-api";
import { google } from "@ai-sdk/google";
import { embed, generateText } from "ai";
import { createClient } from "@supabase/supabase-js";

import { verifySlackSignature } from "@/lib/slack-crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const slackSigningSecret = process.env.SLACK_SIGNING_SECRET;
const slackBotToken = process.env.SLACK_BOT_TOKEN;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function POST(request: Request) {
  if (!slackSigningSecret || !slackBotToken || !supabaseUrl || !supabaseServiceKey) {
    console.error("Missing Slack or Supabase environment configuration.");
    return NextResponse.json({ error: "Service unconfigured" }, { status: 503 });
  }

  // Clone request to read raw body for verification
  const rawBody = await request.clone().text();
  const timestamp = request.headers.get("x-slack-request-timestamp") || "";
  const signature = request.headers.get("x-slack-signature") || "";

  // Verify signature
  const isValid = verifySlackSignature({
    signingSecret: slackSigningSecret,
    rawBody,
    timestamp,
    signature,
  });

  if (!isValid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let body: any;
  try {
    body = JSON.parse(rawBody);
  } catch (err) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Handle URL verification challenge from Slack
  if (body.type === "url_verification") {
    return new Response(body.challenge, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }

  // Handle Slack Events
  if (body.type === "event_callback" && body.event) {
    const event = body.event;

    // Ignore bot messages to prevent loops
    if (event.bot_id || event.subtype === "bot_message") {
      return NextResponse.json({ ok: true });
    }

    // Process app mentions or direct messages
    const isAppMention = event.type === "app_mention";
    const isDirectMessage = event.type === "message" && event.channel_type === "im";

    if (isAppMention || isDirectMessage) {
      // Fire-and-forget background execution
      handleSlackEventAsync(event, body.api_app_id).catch((err) => {
        console.error("Error processing Slack event:", err);
      });
    }
  }

  return NextResponse.json({ ok: true });
}

async function handleSlackEventAsync(event: any, appId: string) {
  const slackClient = new WebClient(slackBotToken);

  // Clean the prompt (remove bot mention tags e.g. <@U12345678>)
  const cleanPrompt = event.text.replace(/<@[A-Z0-9]+>/g, "").trim();

  if (!cleanPrompt) {
    await slackClient.chat.postMessage({
      channel: event.channel,
      text: "Hello! Ask me anything about the sequence history database, e.g., 'Do we have any sequences with high GC content?' or 'Did we analyze any mutations today?'",
      thread_ts: event.thread_ts || event.ts,
    });
    return;
  }

  // 1. Generate query embedding
  let queryVector: number[] | null = null;
  try {
    const { embedding } = await embed({
      model: google.textEmbeddingModel("text-embedding-004"),
      value: cleanPrompt,
    });
    queryVector = embedding;
  } catch (err) {
    console.error("Embedding generation failed:", err);
  }

  // 2. Query Supabase vector similarity search
  let contextText = "No relevant sequence history records were found.";
  if (queryVector) {
    try {
      const svc = createClient(supabaseUrl!, supabaseServiceKey!, {
        auth: { persistSession: false, autoRefreshToken: false },
      });

      // Call the match_all_analysis_history database function
      const { data, error } = await svc.rpc("match_all_analysis_history", {
        query_embedding: queryVector,
        match_threshold: 0.2, // Low threshold to get relevant context
        match_count: 5,
      });

      if (error) {
        console.error("Supabase RPC match failed:", error.message);
      } else if (data && data.length > 0) {
        contextText = data
          .map((row: any, i: number) => {
            const analysis = row.payload?.analysis || {};
            const mutations = row.payload?.mutationSummary || {};
            return `Record #${i + 1} (Saved at: ${row.created_at}):
- Sequence Preview: ${row.sequence_preview}
- Sequence Type: ${analysis.sequenceType || "Unknown"}
- Length: ${analysis.length || 0} bp
- GC Content: ${analysis.gcPercentage ? Number(analysis.gcPercentage).toFixed(2) : "0"}%
- ORFs: ${analysis.orfs ? analysis.orfs.length : 0}
- Mutations: Total=${mutations.total || 0}, Substitutions=${mutations.substitutions || 0}, Insertions=${mutations.insertions || 0}, Deletions=${mutations.deletions || 0}`;
          })
          .join("\n\n");
      }
    } catch (err) {
      console.error("Supabase search operation failed:", err);
    }
  }

  // 3. Generate response using Vercel AI SDK
  const systemMessage = `You are BioMatrix AI, a helpful Slackbot assistant linked to a sequence analysis database.
Use the following retrieved context from the analysis history database to answer the user's question.
If the retrieved context does not contain enough info to answer, state that but answer as best as you can using general bioinformatics knowledge.

Retrieved Context:
${contextText}

Guidelines:
- Keep the response clean, well-formatted, and readable in Slack markdown.
- Be concise (aim for under 200 words).
- Use bullet points where appropriate.`;

  const { text } = await generateText({
    model: google("gemini-2.5-flash"),
    system: systemMessage,
    prompt: cleanPrompt,
  });

  // 4. Send response to Slack
  await slackClient.chat.postMessage({
    channel: event.channel,
    text,
    thread_ts: event.thread_ts || event.ts,
  });
}
