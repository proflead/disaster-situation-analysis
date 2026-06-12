# Repository Guidelines

## Project Structure & Module Organization

This is a Next.js 15 App Router application for the Civil Protection Authority Copilot. Application routes live in `app/`, with server endpoints under `app/api/analyze`, `app/api/export/pdf`, and `app/api/export/pptx`. Reusable React UI is in `components/`, grouped by domain such as `components/dashboard`, `components/map`, and `components/ui`. Shared business logic lives in `lib/`, including AI prompts and schemas in `lib/ai`, PDF parsing in `lib/pdf`, exports in `lib/export`, RAG utilities in `lib/rag`, Supabase access in `lib/supabase`, and shared types in `lib/types`. Static assets belong in `public/`; database setup is in `supabase/schema.sql`.

## Build, Test, and Development Commands

- `npm install`: install dependencies from `package-lock.json`.
- `npm run dev`: start the local Next.js development server.
- `npm run build`: create a production build and run type validation.
- `npm run start`: serve the production build locally.
- `npm run typecheck`: run TypeScript without emitting files.
- `npm run lint`: run the configured Next.js lint command.

## Coding Style & Naming Conventions

Use TypeScript and React function components. Prefer explicit exported types for shared data structures in `lib/types`. Follow the existing two-space indentation, double quotes, and semicolon style. Components use PascalCase file exports; utility modules use lowercase or domain names such as `normalize.ts`, `pipeline.ts`, and `server.ts`. Keep Tailwind classes local to components and use `components/ui` primitives before adding new UI patterns.

## Testing Guidelines

There is no dedicated test framework configured yet. For now, validate changes with `npm run typecheck` and `npm run build`. When adding tests, place focused tests beside the module or in a clear `__tests__` folder, and name files with `.test.ts` or `.test.tsx`.

## Commit & Pull Request Guidelines

Keep commit messages concise and action-oriented, for example `Add export error handling` or `Refine map municipality matching`. Pull requests should include a short description, user-visible impact, verification commands run, linked issues when applicable, and screenshots or recordings for UI changes.

## Security & Configuration Tips

Do not commit `.env.local` or service keys. Required deployment variables include `OPENAI_API_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_BUCKET`, `OPENAI_ANALYSIS_MODEL`, and `OPENAI_EMBEDDING_MODEL`. Run `supabase/schema.sql` and create the private storage bucket before testing deployed analysis workflows.
