import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing GEMINI_API_KEY" },
      { status: 503 }
    );
  }

  let body: { sequence?: string; summary?: unknown } | null = null;
  try {
    body = await request.json();
  } catch {
    body = null;
  }

  if (!body?.sequence || !body.summary) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const modelName = process.env.GEMINI_MODEL ?? "gemini-1.5-flash";
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: modelName });

  const prompt = `You are BioMatrix AI, a clear and concise bioinformatics tutor.\n\nSequence (truncated if needed):\n${body.sequence}\n\nStructured summary (JSON):\n${JSON.stringify(body.summary, null, 2)}\n\nReturn:\n1) Plain-language interpretation for a student.\n2) Key stats and biological implications.\n3) Any caution about low complexity or short sequences.\nKeep it under 180 words.`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    return NextResponse.json({ text });
  } catch {
    return NextResponse.json(
      { error: "Gemini request failed" },
      { status: 500 }
    );
  }
}
