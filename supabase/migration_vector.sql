-- Enable vector extension
create extension if not exists vector;

-- Add embedding column to analysis_history (768 dimensions for Gemini text-embedding-004)
alter table analysis_history add column if not exists embedding vector(768);

-- Create a helper function for cosine similarity matching
create or replace function match_analysis_history (
  query_embedding vector(768),
  match_threshold float,
  match_count int,
  owner_user_id uuid
)
returns table (
  id uuid,
  created_at timestamptz,
  sequence_preview text,
  payload jsonb,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    analysis_history.id,
    analysis_history.created_at,
    analysis_history.sequence_preview,
    analysis_history.payload,
    1 - (analysis_history.embedding <=> query_embedding) as similarity
  from analysis_history
  where analysis_history.user_id = owner_user_id
    and 1 - (analysis_history.embedding <=> query_embedding) > match_threshold
  order by analysis_history.embedding <=> query_embedding
  limit match_count;
end;
$$;

-- Create a helper function for matching across all users (for global Slackbot queries)
create or replace function match_all_analysis_history (
  query_embedding vector(768),
  match_threshold float,
  match_count int
)
returns table (
  id uuid,
  created_at timestamptz,
  sequence_preview text,
  payload jsonb,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    analysis_history.id,
    analysis_history.created_at,
    analysis_history.sequence_preview,
    analysis_history.payload,
    1 - (analysis_history.embedding <=> query_embedding) as similarity
  from analysis_history
  where 1 - (analysis_history.embedding <=> query_embedding) > match_threshold
  order by analysis_history.embedding <=> query_embedding
  limit match_count;
end;
$$;

