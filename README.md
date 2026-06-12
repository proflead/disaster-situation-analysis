# Disaster Situation Analysis and Response Planning

Disaster Situation Analysis and Response Planning is a Next.js application for disaster situation analysis and response planning in Timor-Leste. It helps Civil Protection Authority officers turn PDF and XLSX field reports into an operational briefing with extracted facts, risk assessment, action planning, resource gaps, contradiction checks, missing-information flags, map visualization, and exportable PDF/PPTX packages.

Author: [Vladislav Guzey](https://proflead.dev)

## Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Local Setup](#local-setup)
- [Environment Variables](#environment-variables)
- [Supabase Setup](#supabase-setup)
- [How Analysis Works](#how-analysis-works)
- [API Routes](#api-routes)
- [Exports](#exports)
- [Development Commands](#development-commands)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

## Overview

The app provides a single analysis workspace for emergency-management users. Officers upload disaster reports, SOPs, guidelines, or historical assessments as PDF or XLSX files. The system parses the uploaded documents, retrieves relevant context, sends the content to OpenAI for structured analysis, normalizes municipality names and map coordinates, then displays the results in dashboard tabs.

The generated analysis includes:

- Executive summary and situation overview
- Disaster type, affected municipalities, affected population, and confidence score
- Risk assessment across life safety, infrastructure, logistics, and public health
- Municipality-level action plans with responsible agencies, timelines, required resources, and citations
- Resource gap analysis with red/yellow/green status labels
- Contradictions between reports
- Missing-information register
- Map features for affected areas, roads, shelters, hospitals, schools, and critical infrastructure
- PDF briefing and five-slide PowerPoint executive deck

## Features

- Upload 1 to 20 PDF or XLSX files in one analysis batch.
- Support direct uploads up to 4 MB and Vercel Blob-backed uploads up to 25 MB total from the UI.
- Parse PDF text and spreadsheet rows into report text for analysis.
- Classify uploaded documents as report, SOP, guideline, or historical context based on filename and content.
- Use OpenAI structured JSON output to keep the UI and export pipeline predictable.
- Store optional document chunks, embeddings, and analyses in Supabase.
- Fall back to local keyword retrieval when Supabase or embedding storage is unavailable.
- Normalize Timor-Leste municipality aliases and coordinates before rendering map features.
- Export analysis results as PDF and PPTX files.

## Tech Stack

- Next.js 15 App Router
- React 19
- TypeScript
- Tailwind CSS
- Local shadcn-style UI primitives in `components/ui`
- OpenAI Responses API for structured analysis
- OpenAI embeddings for optional RAG retrieval
- Supabase Postgres, Storage, and pgvector for optional persistence
- Vercel Blob for larger client uploads
- React Leaflet and OpenStreetMap for map rendering
- `pdf-parse` for PDF extraction
- `read-excel-file` for XLSX extraction
- `pdf-lib` and `pptxgenjs` for exports

## Project Structure

```text
app/
  api/
    analyze/route.ts          Main analysis endpoint
    export/pdf/route.ts       PDF export endpoint
    export/pptx/route.ts      PowerPoint export endpoint
    uploads/blob/route.ts     Vercel Blob client-upload token endpoint
  globals.css                 Global Tailwind styles
  layout.tsx                  Root application layout
  page.tsx                    Dashboard entry route

components/
  dashboard/                  Main analysis workspace UI
  map/                        Leaflet map components
  ui/                         Shared UI primitives

lib/
  ai/                         OpenAI client, prompts, schemas, and analysis orchestration
  export/                     PDF and PPTX generation
  files/                      Upload file parsing helpers
  map/                        Map feature and coordinate normalization
  pdf/                        PDF parsing
  rag/                        Chunking and retrieval pipeline
  supabase/                   Supabase admin client
  types/                      Shared disaster analysis TypeScript types
  uploads/                    Upload size limits

supabase/
  schema.sql                  Tables, pgvector index, RPC, and RLS policies
```

## Local Setup

Install dependencies:

```bash
npm install
```

Create a local environment file:

```bash
cp .env.example .env.local
```

Add your OpenAI key to `.env.local`:

```bash
OPENAI_API_KEY=your_openai_api_key
```

The app can run locally with only `OPENAI_API_KEY`. Supabase is not required for the main demo workflow. Vercel Blob is only needed when you want larger browser uploads beyond the direct request limit.

Start the development server:

```bash
npm run dev
```

Open the app in your browser:

```text
http://localhost:3000
```

Run a quick smoke test:

1. Upload one PDF or XLSX disaster report.
2. Use a file that mentions a Timor-Leste municipality such as Dili, Baucau, Ermera, Lautem, or Liquica.
3. Click **Analyze**.
4. Review the generated summary, brief, action plan, gaps, and map.
5. Export the result as PDF or PPTX if needed.

Optional services:

- Add `BLOB_READ_WRITE_TOKEN` only if you need private Vercel Blob uploads for larger files.
- Add Supabase variables only if you want persisted analyses, stored document chunks, or vector retrieval.

## Environment Variables

```bash
OPENAI_API_KEY=
OPENAI_ANALYSIS_MODEL=gpt-5.5
OPENAI_EMBEDDING_MODEL=text-embedding-3-large
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_BUCKET=cpa-documents
BLOB_READ_WRITE_TOKEN=
```

| Variable | Required | Purpose |
| --- | --- | --- |
| `OPENAI_API_KEY` | Yes for analysis | Enables OpenAI structured analysis. Also used for embeddings when optional vector retrieval is configured. |
| `OPENAI_ANALYSIS_MODEL` | Optional | Model used by the Responses API. Defaults to `gpt-5.5` in this project. |
| `OPENAI_EMBEDDING_MODEL` | Optional | Embedding model used for Supabase-backed retrieval. Defaults to `text-embedding-3-large`. |
| `NEXT_PUBLIC_SUPABASE_URL` | Optional | Supabase project URL. Required for Supabase storage, document persistence, and vector retrieval. |
| `SUPABASE_SERVICE_ROLE_KEY` | Optional | Server-only key used for Supabase Storage and database writes. Do not expose this to the browser. |
| `SUPABASE_BUCKET` | Optional | Supabase Storage bucket name. Defaults to `cpa-documents`. |
| `BLOB_READ_WRITE_TOKEN` | Optional for small uploads, required for larger UI uploads | Enables Vercel Blob direct client uploads for batches over the direct request limit. |

Do not commit `.env.local` or service keys.

## Supabase Setup

Supabase is optional for basic analysis, but it enables persisted document chunks, vector retrieval, stored uploaded files, and saved analyses.

1. Create a Supabase project.
2. Open the Supabase SQL editor.
3. Run [`supabase/schema.sql`](supabase/schema.sql).
4. Create a private Storage bucket named `cpa-documents`, or set `SUPABASE_BUCKET` to a different bucket name.
5. Add `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to `.env.local` and to the deployment environment.

The schema creates:

- `analyses`: stores full generated analysis JSON.
- `documents`: stores chunked document text and 3072-dimensional embeddings.
- `match_documents`: SQL RPC used for vector similarity retrieval.
- RLS policies that allow service-role access only.

## How Analysis Works

1. The dashboard accepts PDF and XLSX files through the upload panel.
2. Files under 4 MB total are sent directly to `/api/analyze` as multipart form data.
3. Larger batches are uploaded privately through Vercel Blob, then analyzed by reference.
4. `/api/analyze` validates the file count and supported file types.
5. PDF and XLSX files are parsed into text.
6. Parsed documents are chunked for retrieval.
7. If OpenAI and Supabase are configured, chunks are embedded, inserted into Supabase, and retrieved through `match_documents`.
8. If vector retrieval is unavailable, the app uses local retrieval from the parsed chunks.
9. OpenAI receives the report text and retrieval context and returns JSON matching the schema in `lib/ai/schemas.ts`.
10. The app normalizes municipality names and map coordinates before returning the result to the UI.
11. The dashboard renders summary, brief, plan, gap, and map tabs.

## API Routes

### `POST /api/analyze`

Runs disaster report analysis.

Accepted request formats:

- `multipart/form-data` with one or more `files` entries.
- JSON body with stored upload references:

```json
{
  "uploads": [
    {
      "name": "flood-report.pdf",
      "url": "https://...",
      "contentType": "application/pdf"
    }
  ]
}
```

Response:

- `200`: `AnalysisResult` JSON.
- `400`: invalid file count or unsupported file type.
- `500`: parsing, retrieval, OpenAI, or persistence failure.

### `POST /api/uploads/blob`

Creates Vercel Blob client-upload tokens for private PDF/XLSX uploads.

This route requires `BLOB_READ_WRITE_TOKEN`. It accepts the request shape generated by `@vercel/blob/client`.

### `POST /api/export/pdf`

Accepts an `AnalysisResult` JSON body and returns:

```text
Content-Type: application/pdf
```

Download filename:

```text
Civil-Protection-Authority-Copilot-Briefing.pdf
```

### `POST /api/export/pptx`

Accepts an `AnalysisResult` JSON body and returns:

```text
Content-Type: application/vnd.openxmlformats-officedocument.presentationml.presentation
```

Download filename:

```text
Civil-Protection-Authority-Copilot-Executive-Briefing.pptx
```

## Exports

The dashboard enables export buttons after an analysis has completed.

- PDF export is built in `lib/export/pdf.ts`.
- PowerPoint export is built in `lib/export/ppt.ts`.
- Both export endpoints run on the Node.js runtime.
- `vercel.json` gives export routes a 30-second max duration.

## Development Commands

```bash
npm install
npm run dev
npm run typecheck
npm run build
npm run start
npm run lint
```

Command details:

- `npm install`: installs dependencies from `package-lock.json`.
- `npm run dev`: starts the local Next.js development server.
- `npm run typecheck`: runs TypeScript without emitting files.
- `npm run build`: creates a production build and validates the app.
- `npm run start`: serves the production build locally.
- `npm run lint`: runs the configured Next.js lint command.

There is no dedicated test framework configured yet. Use `npm run typecheck` and `npm run build` as the main verification commands for code changes.

## Deployment

The project is configured for Vercel.

1. Push the repository to GitHub.
2. Import the project into Vercel.
3. Add required environment variables in Vercel Project Settings.
4. Connect Vercel Blob if you need upload batches larger than the direct request limit.
5. Configure Supabase if you need persistence and vector retrieval.
6. Deploy the app.

`vercel.json` configures:

- `app/api/analyze/route.ts` with a 300-second max duration.
- `app/api/export/pdf/route.ts` with a 30-second max duration.
- `app/api/export/pptx/route.ts` with a 30-second max duration.

After changing environment variables, redeploy the project or restart the local development server.

## Troubleshooting

### `OPENAI_API_KEY is required`

Add `OPENAI_API_KEY` to `.env.local` or to the Vercel environment, then restart or redeploy the app.

### Upload token or Vercel Blob errors

Batches larger than the direct upload limit use Vercel Blob. Set `BLOB_READ_WRITE_TOKEN`, restart the local server, and redeploy production environments after adding the variable.

### Direct upload size errors

The analysis endpoint rejects direct multipart requests over 4 MB total. From the UI, batches over 4 MB use Blob upload automatically when Blob is configured. The UI allows up to 25 MB total.

### Supabase storage or RAG persistence errors

Confirm that:

- `supabase/schema.sql` has been run.
- The private storage bucket exists.
- `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set.
- The service role key is stored only in server-side environments.

If Supabase retrieval fails, the app logs a warning and falls back to local retrieval.

### Non-JSON model response

The app expects OpenAI to return JSON matching `lib/ai/schemas.ts`. If analysis fails with a non-JSON response, check `OPENAI_ANALYSIS_MODEL` and retry with a model that supports structured JSON output.

### Map points appear at municipality centroids

When exact coordinates are missing, invalid, or outside Timor-Leste bounds, the app places affected-area features at known municipality centroids. This keeps the map useful while making the fallback clear in the feature note.

## Security Notes

- Keep `.env.local`, service-role keys, and Blob tokens out of version control.
- `SUPABASE_SERVICE_ROLE_KEY` must only be used on the server.
- The Supabase schema enables row-level security and grants access through service-role policies.
- Uploaded files may contain sensitive emergency-response information. Use private buckets and private Blob uploads for production deployments.

## Builder Demo Tips

- Upload a current situation report plus a guideline or SOP PDF to show evidence-backed recommendations.
- Use files that mention multiple municipalities to demonstrate municipality detection and map normalization.
- Include conflicting figures between two reports to demonstrate contradiction detection.
- Export PDF and PPTX after analysis to show the complete briefing workflow.
