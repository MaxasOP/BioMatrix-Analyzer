import { NextResponse } from "next/server";

import { SUPABASE_TABLE, createSupabaseClient } from "@/lib/supabase";

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

  const { data, error } = await supabase
    .from(SUPABASE_TABLE)
    .insert({
      user_id: user.id,
      sequence_preview: body.sequence_preview,
      payload: body.payload,
    })
    .select("id, created_at, sequence_preview, payload")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ item: data });
}
