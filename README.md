# Ondwira

Ondwira is one application for private social communication, workspaces, meetings, documents, jobs, applications, and permissioned agent connections.

The product has one account model and two contexts:

- **Social** for personal chats, updates, calls, contacts, and optional work discovery.
- **Work** for organisation-managed conversations, meetings, people, jobs, applications, and reports.

Profile, CV, job history, privacy, appearance, security, and external agent access are managed from Settings. There is no public feed and no separate professional or employer product experience.

## Technology

- Next.js 16 and React 19
- TypeScript and Tailwind CSS
- Supabase/PostgreSQL
- Server-authorized messaging with encrypted message bodies

## Local development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Current migration status

Legacy Profcaria routes and schemas remain temporarily as migration sources while their useful job and document workflows are moved into the unified Ondwira structure. New product navigation must not link to those legacy routes.
