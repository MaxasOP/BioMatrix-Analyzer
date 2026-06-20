# BioMatrix.AI – Premium Bioinformatics Platform

**Overview**

BioMatrix.AI is a cutting‑edge, agency‑grade bioinformatics suite built on a **Next.js 16 (App Router)** front‑end, **Supabase** backend for secure analysis history, and **Google Gemini 1.5‑Flash** for AI‑driven explanations. The platform delivers **real‑time, AI‑enhanced genomic analysis** with a **high‑end visual design** inspired by the *high‑end‑visual‑design* skill: double‑bezel layout, custom cubic‑bezier motion, and “Absolute Zero” anti‑patterns for flawless UI/UX.

---

## Extraordinary Feature Set

- **Hybrid Retrieval‑Augmented Generation (RAG)**: Combines the 20 most recent analysis summaries with semantic vector matches via a Supabase RPC (`match_analysis_history`). This yields ultra‑relevant AI responses while preserving context continuity.
- **Dynamic Authentication Propagation**: Asynchronous Supabase token handling ensures secure API calls without race conditions, using a `headersRef` in the Assistant widget.
- **Comprehensive Sequence Toolkit**:
  - Validation, GC% calculation, nucleotide counts.
  - DNA ↔ RNA transcription, complement generation.
  - Full‑frame ORF detection with visual markers.
  - Restriction enzyme site scanning (integrated enzyme database).
  - Mutation detection between reference and query sequences.
  - AI‑generated plain‑language explanations powered by Gemini.
- **Robust History Storage**: All analyses are persisted in Supabase, enabling replay, audit trails, and user‑specific dashboards.
- **High‑End UI/UX**:
  - Double‑bezel nested architecture for depth perception.
  - Custom cubic‑bezier animations delivering buttery‑smooth transitions.
  - Dark‑mode‑first design with glass‑morphism cards and vibrant gradients.
  - Typography from Google Fonts *Inter* with responsive scaling.
  - Micro‑animations on hover/focus for enhanced interactivity.
- **Extensible Architecture**: Easily plug in additional AI models, custom analysis pipelines, or third‑party databases (e.g., Ensembl, ChEMBL) via the modular Next.js API routes.

---

## Technical Stack

| Layer | Technology | Reasoning |
|-------|------------|-----------|
| **Front‑end** | Next.js 16 (App Router) + React 18 + Tailwind CSS | Enables server‑side rendering, fast navigation, and utility‑first styling while supporting the premium design system.
| **AI Integration** | @ai-sdk/google (`createGoogleGenerativeAI`) with `GEMINI_API_KEY` | Provides state‑of‑the‑art generative AI with low latency and deep integration.
| **Backend / Data** | Supabase (PostgreSQL, Edge Functions) | Secure, scalable storage; RPC for vector similarity; real‑time auth.
| **Vector Search** | pgvector extension + custom RPC `match_analysis_history` | Fast semantic similarity across analysis embeddings.
| **Styling** | Tailwind CSS, custom CSS variables, HSL color palette, glass‑morphism | Delivers the agency‑level visual polish mandated by the visual‑design skill.
| **Deployment** | Vercel (Edge) + Supabase (Managed) | Zero‑config CI/CD, global edge network, auto‑scaling.
| **Testing** | Jest + React Testing Library | Ensure reliability of core utilities and UI components.

---

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Ensure the following environment variables are set (see `.env.local.example`):

- `GEMINI_API_KEY` – Google Gemini API key (required).
- `NEXT_PUBLIC_SUPABASE_URL` & `NEXT_PUBLIC_SUPABASE_ANON_KEY` – Supabase project credentials.
- `SUPABASE_TABLE` *(optional)* – Table name for analysis history (default: `analysis_history`).

---

## Deployment Guide

1. **Create a Supabase project** and execute `supabase/schema.sql` to set up tables and the `match_analysis_history` RPC.
2. **Push the repo to Vercel**:
   - Set the root directory to `./`.
   - Add the same env vars in Vercel’s dashboard or link the Supabase integration.
3. **Enable Edge Functions** for optimal AI streaming latency.

---

## Design Philosophy

The UI follows the **high‑end‑visual‑design** skill guidelines:
- **Double‑Bezel Layout**: Nested containers create depth, guiding user focus.
- **Custom Motion**: All transitions use `cubic-bezier(0.4, 0, 0.2, 1)` for a natural feel.
- **Anti‑Pattern “Absolute Zero”**: Avoids unnecessary opacity changes, ensuring crisp rendering on high‑resolution displays.

---

## Contributing

Contributions must respect the visual and architectural standards outlined above. Submit pull requests with:
- Updated design tokens in `src/styles/theme.css`.
- Unit tests for new analysis modules.
- Documentation updates reflecting any new features.

---

## License

MIT License – free for commercial and academic use.

---

*BioMatrix.AI sets a new benchmark for bioinformatics tooling, delivering enterprise‑grade AI explanations, premium UI/UX, and a robust hybrid RAG engine—all within a modern, serverless stack.* 

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

