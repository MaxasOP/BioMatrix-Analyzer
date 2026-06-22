# BioMatrix.AI – Premium Bioinformatics Platform

**Overview**

BioMatrix.AI is a cutting‑edge, agency‑grade bioinformatics suite built on **Next.js 16 (App Router)**, **Supabase** (with pgvector storage), and **Google Gemini** for AI‑driven insights. The platform delivers real‑time, AI‑enhanced genomic analysis via a premium, dark-mode-first user interface featuring custom-engineered cognitive AI agents.

---

## Advanced AI Agent Architecture

BioMatrix.AI integrates two key AI agents to assist researchers in interpreting genomic datasets and database history:

### 1. The RAG Agent (Rex)
Accessible via the user assistant chat widget, **Rex** is a retrieval-augmented generation agent that makes database history fully conversational:
- **Hybrid Retrieval**: Extracts both the last 20 raw analysis runs (for fast, chronological contextual questions) and utilizes 768-dimensional vector embeddings (`text-embedding-004`) to perform semantic searches.
- **pgvector Integration**: Executes the `match_analysis_history` Database RPC in Supabase to fetch the top 5 most semantically relevant historic records.
- **Intelligent Response**: Generates a unified response using `gemini-2.5-flash` with the retrieved historical context.

### 2. The SQL Agent
Located at `/api/ai-sql`, the **SQL Agent** enables direct, natural language database queries without requiring SQL knowledge:
- **Dynamic Translation**: Translates user prompts (e.g., *"Find the average GC content of my sequences"* or *"How many mutations were detected today?"*) into safe, optimized PostgreSQL `SELECT` statements.
- **JSONB Querying**: Expertly handles metric extraction from Supabase's `payload` JSONB column, including type casting (e.g., `(payload->'analysis'->>'gcPercentage')::numeric`).
- **Secure Execution**: Validates that only `SELECT` queries targeting the `analysis_history` table are executed, protecting database integrity before executing the query using the `sql` RPC function.

---

## Extraordinary Feature Set

- **Comprehensive Sequence Toolkit**:
  - Sequence validation, GC% calculation, and nucleotide counts.
  - DNA ↔ RNA transcription and complement generation.
  - Standard genetic code translation and full‑frame ORF detection.
  - Restriction enzyme site scanning with an integrated enzyme database.
  - Mutation detection and difference mapping between reference and query sequences.
  - AI-generated plain‑language explanations powered by Gemini.
- **Robust Database Persistence**:
  - Analysis histories are securely saved to Supabase under Row-Level Security (RLS) policies.
- **Premium UI/UX**:
  - Double‑bezel nested layout for optimal depth and visual focus.
  - Butter‑smooth transitions using custom cubic‑bezier timing functions.
  - Glass‑morphism, vibrant gradients, and elegant dark themes.

---

## Technical Stack

| Layer | Technology | Description / Role |
|-------|------------|--------------------|
| **Front‑end** | Next.js 16 (App Router) + React 18 | Multi-page layouts, Server Components, and responsive rendering. |
| **Styling** | Tailwind CSS + Custom CSS Variables | High-end visual system, custom bezier animations, and HSL custom colors. |
| **AI Integration** | Vercel AI SDK (`ai`) + `@ai-sdk/google` | Streams text generation and creates text embeddings via Gemini. |
| **Backend / Data** | Supabase (PostgreSQL) | Secure relational database, real-time client auth, and Edge Functions. |
| **Vector Search** | `pgvector` + Custom RPC Functions | Semantic vector comparison using 768-dimensional embeddings. |

---

## Getting Started

### 1. Installation

```bash
# Clone the repository and install dependencies
npm install

# Run the local development server
npm run dev
```

### 2. Environment Configuration

Create a `.env.local` file by copying `.env.local.example` and filling in the values:

```bash
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Google Gemini
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-2.5-flash

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
SUPABASE_TABLE=analysis_history
```

---

## Database & RPC Setup

Initialize your Supabase database schema and agent functions:

1. **Schema Initialization**: Run the contents of [supabase/schema.sql](file:///c:/Users/hp/Desktop/Bio/BioMatrix-Analyzer/supabase/schema.sql) in the Supabase SQL editor to create the `analysis_history` table and enable RLS.
2. **Vector Search & SQL RPC**: Execute [supabase/migration_vector.sql](file:///c:/Users/hp/Desktop/Bio/BioMatrix-Analyzer/supabase/migration_vector.sql) in the Supabase SQL editor to:
   - Enable the `pgvector` extension.
   - Register `match_analysis_history` and `match_all_analysis_history` for the RAG Agent.
   - Provide a safe execution interface (`sql` RPC function) for the SQL Agent.

---

## 💡 Developer Gotchas (Vercel AI SDK 5.0+ / 6.0+)

Keep these rules in mind when modifying AI or chat logic:

### 1. Provider API Key Mapping
By default, the `@ai-sdk/google` provider expects `GOOGLE_GENERATIVE_AI_API_KEY`. Because this project uses `GEMINI_API_KEY`:
- **Do not** import the default `google` object directly.
- **Do** instantiate it explicitly using `createGoogleGenerativeAI`:
  ```typescript
  import { createGoogleGenerativeAI } from "@ai-sdk/google";

  const google = createGoogleGenerativeAI({
    apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY,
  });
  ```

### 2. Client-to-Server Message Formats
The client-side `useChat` hook sends `UIMessage` objects (which structure content using the `parts` array), but server-side `streamText` expects standard `ModelMessage` objects (which require a `content` string):
- **Do not** pass the raw request `messages` body directly into `streamText`.
- **Do** convert them using the asynchronous `convertToModelMessages` helper:
  ```typescript
  import { convertToModelMessages } from "ai";

  const modelMessages = await convertToModelMessages(messages);
  ```
