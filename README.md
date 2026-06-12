# Civil Protection Authority Copilot

Civil Protection Authority Copilot is a production-quality MVP for Timor-Leste Civil Protection Authority officers. It turns uploaded disaster PDFs into a municipal situation briefing, action plan, resource gap analysis, contradiction list, missing-information register, map view, PDF package, and five-slide PowerPoint briefing.

## Stack

- Next.js 15 App Router, TypeScript, TailwindCSS, shadcn-style local UI components
- OpenAI Responses API with structured JSON output
- Supabase Storage, Postgres, and pgvector for RAG
- PDF parsing with pdf-parse
- React Leaflet and OpenStreetMap
- PDF export with pdfkit
- PowerPoint export with pptxgenjs
- Vercel deployment config

## Quick Start

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000.

The app starts with an empty analysis workspace. Upload PDFs and click Analyze to run live PDF parsing, RAG retrieval, and OpenAI structured analysis. OPENAI_API_KEY is required for analysis.

## Environment Variables

```bash
OPENAI_API_KEY=sk-...
OPENAI_ANALYSIS_MODEL=gpt-5.5
OPENAI_EMBEDDING_MODEL=text-embedding-3-large
NEXT_PUBLIC_SUPABASE_URL=https://PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_BUCKET=cpa-documents
```

OPENAI_ANALYSIS_MODEL defaults to the requested gpt-5.5 model slug and can be changed without code edits.

## Supabase Setup

1. Create a Supabase project.
2. Run supabase/schema.sql in the SQL editor.
3. Create a private storage bucket named cpa-documents, or set SUPABASE_BUCKET to another bucket name.
4. Add the service role key to Vercel as SUPABASE_SERVICE_ROLE_KEY.

The app inserts uploaded files into Supabase Storage, stores chunks in documents, uses embeddings for match_documents, and stores full analyses in analyses.

## AI Prompting Strategy

Prompts are separated in lib/ai/prompts.ts:

- Document extraction
- Situation summarization
- Action plan generation
- Resource gap analysis
- Contradiction detection

lib/ai/schemas.ts defines the structured output schema used by the Responses API. Recommendations include SOP/guideline citations when RAG context is available.

## Main Workflow

1. Drag and drop 1-20 PDF files.
2. Click Analyze.
3. Review detected municipalities, confidence, missing information, contradictions, summary, action plan, resource gaps, and map layers.
4. Export the briefing package as PDF or the five-slide executive deck as PowerPoint.

## Deployment

1. Push the repo to GitHub.
2. Import it into Vercel.
3. Add the environment variables above.
4. Deploy.

vercel.json configures longer durations for analysis and export routes.

## Notes for Builder Lab Demo

- Upload PDFs that mention municipalities such as Dili, Baucau, Ermera, Lautem/Lautém, or Liquica/Liquiçá to demonstrate automatic municipality detection.
- Include an SOP or guideline PDF so action-plan recommendations can display citations.
- Show the contradiction panel and missing-information card to emphasize decision support rather than pure summarization.
- Export PDF and PPTX after analysis to demonstrate measurable briefing-time reduction.
