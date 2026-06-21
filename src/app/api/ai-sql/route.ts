import { generateText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createAdminSupabaseClient } from '@/lib/supabase-admin';

export const runtime = 'edge'; // fast edge runtime

/**
 * POST /api/ai-sql
 * Accepts a JSON body: { prompt: string }
 * Returns generated SQL (and optionally query results).
 */
export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();
    if (!prompt || typeof prompt !== 'string') {
      return new Response(JSON.stringify({ error: 'Missing or invalid prompt' }), { status: 400 });
    }

    // Generate SQL using Gemini (or any LLM supported by Vercel AI SDK)
    const google = createGoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY! });
    const model = google('gemini-2.5-flash');
    const { text } = await generateText({ 
      model, 
      system: 'You are a PostgreSQL expert. The user wants to query the `analysis_history` table. Return ONLY a valid SELECT SQL query. Do not wrap it in markdown block quotes (```sql). The table schema is: id (uuid), created_at (timestamptz), user_id (uuid), sequence_preview (text), payload (jsonb). The `payload` contains { "analysis": { "sequenceType": string, "length": number, "gcPercentage": number, "counts": object }, "mutationSummary": { "total": number, "substitutions": number, "insertions": number, "deletions": number } }. If querying metrics, extract from payload and explicitly cast them, e.g., (payload->\'analysis\'->>\'gcPercentage\')::numeric.',
      prompt 
    });
    // Remove potential markdown code block wrappers
    let sql = text.trim();
    if (sql.startsWith('```sql')) sql = sql.substring(6);
    if (sql.startsWith('```')) sql = sql.substring(3);
    if (sql.endsWith('```')) sql = sql.substring(0, sql.length - 3);
    sql = sql.trim();
    // For safety, we only allow SELECT queries on the `analysis_history` table.
    const isSelect = /^\s*SELECT\s+/i.test(sql);
    if (!isSelect) {
      return new Response(JSON.stringify({ error: 'Only SELECT queries are allowed.' }), { status: 403 });
    }

    const supabase = createAdminSupabaseClient();
    // Execute raw SQL via rpc. Supabase provides a `sql` RPC for raw queries.
    const { data, error } = await supabase.rpc('sql', { query: sql });
    if (error) {
      return new Response(JSON.stringify({ error: error.message, sql }), { status: 500 });
    }

    return new Response(JSON.stringify({ sql, result: data }), { status: 200 });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message ?? 'Unexpected error' }), { status: 500 });
  }
}
