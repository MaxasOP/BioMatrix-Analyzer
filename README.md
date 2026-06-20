# BioMatrix.AI 

Bioinformatics platform built with Next.js, Supabase, and Gemini. Analyze DNA/RNA sequences, detect mutations, find ORFs, map restriction enzymes, and generate AI explanations.

## Features
- Sequence validation, GC% and nucleotide counts
- DNA to RNA transcription and complement
- Protein translation (standard genetic code)
- ORF finder across reading frames
- Restriction enzyme site scanning
- Mutation detection between two sequences
- Gemini-powered plain-language explanations
- Supabase analysis history storage

## Getting started
```bash
npm install
npm run dev
```



## Environment variables
Copy the example file and fill in your keys:

```bash
cp .env.local.example .env.local
```

Required for Gemini:
- `GEMINI_API_KEY`
- `GEMINI_MODEL` (optional, defaults to `gemini-1.5-flash`)

Required for Supabase history:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_TABLE` (optional, defaults to `analysis_history`)

## Supabase setup
1. Create a Supabase project.
2. Run [supabase/schema.sql](supabase/schema.sql) in the SQL editor.
3. Add the Supabase env vars locally and in Vercel.

## Deploy on Vercel
1. Import the repo in Vercel.
2. Set the root directory to `./`.
3. Add the env vars above or connect the Supabase integration.
4. Deploy.

---

## 💡 Vercel AI SDK 5.0+ / 6.0+ Developer Gotchas

When extending the AI Assistant or adding other chat interfaces in this codebase, keep these rules in mind to prevent runtime failures:

### 1. Provider API Key Mapping
By default, the `@ai-sdk/google` provider tries to retrieve `GOOGLE_GENERATIVE_AI_API_KEY`. Since this project uses `GEMINI_API_KEY` in environment variables:
- **Do not** import the default `google` object directly.
- **Do** instantiate it explicitly using `createGoogleGenerativeAI`:
  ```typescript
  import { createGoogleGenerativeAI } from "@ai-sdk/google";

  const google = createGoogleGenerativeAI({
    apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY,
  });
  ```

### 2. Client-to-Server Message Formats
The client-side `useChat` hook operates on `UIMessage` objects (which structure content using the `parts` array). The server-side `streamText` function expects standard `ModelMessage` objects (which require a `content` field):
- **Do not** pass the raw request `messages` body directly into `streamText`.
- **Do** convert them using the asynchronous `convertToModelMessages` helper:
  ```typescript
  import { convertToModelMessages } from "ai";

  const modelMessages = await convertToModelMessages(messages);
  ```
- Use `modelMessages` for both `streamText` and any text extraction (e.g. accessing `lastMessage.content`).

