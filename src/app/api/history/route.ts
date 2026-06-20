import { NextResponse } from "next/server";
import { google } from "@ai-sdk/google";
import { embed } from "ai";

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

export async function GET(request: Request) {
  const { supabase, user } = await getUserFromRequest(request);
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase is not configured." },
      { status: 503 }
    );
  }

  if (!user) {
    return NextResponse.json(
      { error: "Sign in to view your cloud history." },
      { status: 401 }
    );
  }

  const { data, error } = await supabase
    .from(SUPABASE_TABLE)
    .select("id, created_at, sequence_preview, payload")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ items: data ?? [] });
}

export async function POST(request: Request) {
  const { supabase, user } = await getUserFromRequest(request);
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase is not configured." },
      { status: 503 }
    );
  }

  if (!user) {
    return NextResponse.json(
      { error: "Sign in to save your work to the cloud." },
      { status: 401 }
    );
  }

  let body: { sequence_preview?: string; payload?: unknown } | null = null;
  try {
    body = await request.json();
  } catch {
    body = null;
  }

  if (!body?.sequence_preview || !body.payload) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  // Construct textual representation of the sequence analysis to create embeddings
  const payloadObj = (body.payload || {}) as Record<string, any>;
  const analysis = payloadObj.analysis || {};
  const mutationSummary = payloadObj.mutationSummary || {};

  const textToEmbed = [
    `Sequence Preview: ${body.sequence_preview}`,
    `Type: ${analysis.sequenceType || "Unknown"}`,
    `Length: ${analysis.length || 0} bases`,
    `GC%: ${analysis.gcPercentage ? Number(analysis.gcPercentage).toFixed(2) : "0"}%`,
    `ORFs found: ${analysis.orfs ? analysis.orfs.length : 0}`,
    mutationSummary.total
      ? `Mutations: Total=${mutationSummary.total}, Substitutions=${mutationSummary.substitutions || 0}, Insertions=${mutationSummary.insertions || 0}, Deletions=${mutationSummary.deletions || 0}`
      : "No mutations compared/detected.",
  ].join("\n");

  let embeddingVector: number[] | null = null;
  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (geminiApiKey) {
    try {
      const { embedding } = await embed({
        model: google.textEmbeddingModel("text-embedding-004"),
        value: textToEmbed,
      });
      embeddingVector = embedding;
    } catch (err) {
      console.error("Failed to generate embedding for sequence history", err);
    }
  }

  // Prefer using a server-side service role key to perform inserts so Row Level Security
  // policies do not reject the request due to missing auth context. If a service role key
  // is not available, attempt to insert using the user's token (may fail if RLS is enabled
  // and the auth JWT isn't forwarded correctly).
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (serviceRoleKey) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!url) {
      return NextResponse.json({ error: "Supabase URL not configured." }, { status: 503 });
    }

    const svc = createServiceClient(url, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data, error } = await svc
      .from(SUPABASE_TABLE)
      .insert({
        user_id: user.id,
        sequence_preview: body.sequence_preview,
        payload: body.payload,
        embedding: embeddingVector,
      })
      .select("id, created_at, sequence_preview, payload")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ item: data });
  }

  // Fallback: try using the client created from the incoming token. This will
  // only work if the JWT is correctly forwarded and RLS allows the insert.
  const { data, error } = await supabase
    .from(SUPABASE_TABLE)
    .insert({
      user_id: user.id,
      sequence_preview: body.sequence_preview,
      payload: body.payload,
      embedding: embeddingVector,
    })
    .select("id, created_at, sequence_preview, payload")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ item: data });
}

export async function DELETE(request: Request) {
  const { supabase, user } = await getUserFromRequest(request);
  if (!supabase) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  if (!user) {
    return NextResponse.json({ error: "Sign in to manage your cloud history." }, { status: 401 });
  }

  let body: { id?: string } | null = null;
  try {
    body = await request.json();
  } catch {
    body = null;
  }

  const id = body?.id;
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Prefer service role to perform delete but constrain by user_id to avoid deleting other users' rows.
  if (serviceRoleKey) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!url) {
      return NextResponse.json({ error: "Supabase URL not configured." }, { status: 503 });
    }

    const svc = createServiceClient(url, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // Delete only where id matches AND user_id matches the requesting user
    const { data, error } = await svc
      .from(SUPABASE_TABLE)
      .delete()
      .match({ id, user_id: user.id })
      .select("id")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: "Not found or not permitted" }, { status: 404 });
    }

    return NextResponse.json({ deleted: data });
  }

  // Fallback: attempt delete using the user's token (will require RLS policy allowing delete by owner)
  const { data, error } = await supabase.from(SUPABASE_TABLE).delete().eq("id", id).select("id").single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Not found or not permitted" }, { status: 404 });
  }

  return NextResponse.json({ deleted: data });
}
