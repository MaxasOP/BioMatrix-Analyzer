# BioMatrix AI (Web)

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
cd web
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

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
2. Set the root directory to `web`.
3. Add the env vars above or connect the Supabase integration.
4. Deploy.
