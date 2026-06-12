create extension if not exists vector;

create table if not exists public.analyses (
  id uuid primary key,
  uploaded_files text[] not null default '{}',
  analysis jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.documents (
  id bigserial primary key,
  source text not null,
  document_type text not null check (document_type in ('report', 'sop', 'guideline', 'historical')),
  section text not null,
  content text not null,
  embedding vector(3072),
  created_at timestamptz not null default now()
);

create index if not exists documents_embedding_idx
  on public.documents using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

create or replace function public.match_documents(
  query_embedding vector(3072),
  match_count int default 6
)
returns table (
  id bigint,
  source text,
  document_type text,
  section text,
  content text,
  similarity float
)
language sql stable
as $$
  select
    documents.id,
    documents.source,
    documents.document_type,
    documents.section,
    documents.content,
    1 - (documents.embedding <=> query_embedding) as similarity
  from public.documents
  where documents.embedding is not null
  order by documents.embedding <=> query_embedding
  limit match_count;
$$;

alter table public.analyses enable row level security;
alter table public.documents enable row level security;

create policy "service role full access analyses" on public.analyses
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create policy "service role full access documents" on public.documents
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
