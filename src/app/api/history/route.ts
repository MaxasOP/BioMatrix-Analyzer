import { NextResponse } from "next/server";

import { SUPABASE_TABLE, createSupabaseClient } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = createSupabaseClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase is not configured." },
      { status: 503 }
    );
  }

  const { data, error } = await supabase
    .from(SUPABASE_TABLE)
    .select("id, created_at, sequence_preview, payload")
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ items: data ?? [] });
}

export async function POST(request: Request) {
  const supabase = createSupabaseClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase is not configured." },
      { status: 503 }
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
