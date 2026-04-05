# pew-pew — Private Expert Wiki

A private, invitation-only knowledge base where experts publish structured, block-based articles. Features a built-in AI assistant that answers questions strictly from the wiki's own content using a RAG (Retrieval-Augmented Generation) pipeline powered by Gemini.

---

## Features

- **Block-based editing** via BlockNote — content stored as structured JSONB, not raw HTML
- **Category-first navigation** — unlimited nesting via a self-referencing category tree
- **Role-based access control** — ADMIN / EXPERT / VIEWER roles enforced at the database level via Firebase Data Connect `@auth` directives
- **Semantic search** — articles are embedded with `text-embedding-004` (768-dim) and searched using pgvector cosine similarity
- **AI assistant** — a slide-out chat panel that answers questions grounded exclusively in wiki content (no hallucinations from outside knowledge)
- **Version history** — every publish event creates an immutable `Revision` snapshot
- **App Check** — blocks non-web clients from querying the database

---

## Tech Stack

| Layer | Choice |
|---|---|
| Frontend | React 19 + Vite + TypeScript |
| UI | Shadcn/ui (Base UI + Tailwind CSS v4) |
| Editor | BlockNote v0.47 |
| Database | Firebase Data Connect (Cloud SQL PostgreSQL + pgvector) |
| Auth | Firebase Authentication (Google Sign-In + Custom Claims) |
| Functions | Firebase Functions v2 (Node 20, TypeScript) |
| AI framework | Firebase Genkit v1.31 |
| AI model | Gemini 2.5 Flash (generation) + `text-embedding-004` (embeddings) |

---

## Project Structure

```
pew-pew/
├── src/
│   ├── components/             # Shared UI components (Editor, AiAssistantSheet, …)
│   ├── context/                # AuthContext (Firebase Auth state)
│   ├── lib/                    # firebase.ts, dataconnect.ts, functions.ts
│   ├── pages/                  # LoginPage, ArticleListPage, ArticleViewPage, ArticleEditorPage
│   └── dataconnect-generated/  # Auto-generated type-safe SDK (do not edit)
├── dataconnect/
│   ├── schema/schema.gql       # PostgreSQL schema (User, Category, Article, Revision)
│   └── connectors/
│       ├── queries.gql         # Read operations (category tree, articles, revisions)
│       └── mutations.gql       # Write operations (upsert/delete articles, categories, revisions)
├── functions/src/
│   ├── index.ts                # Cloud Functions entry point
│   ├── genkit.ts               # Shared Genkit `ai` instance
│   ├── embedArticle.ts         # Genkit flow: flatten BlockNote → embed → write vector
│   ├── flattenBlocks.ts        # BlockNote Block[] → plain string
│   ├── searchWiki.ts           # Server-side vector similarity search (Admin SDK)
│   ├── searchWikiByQuery.ts    # HTTPS callable: embed question + return top articles
│   ├── ragAnswer.ts            # Genkit flow + callable: grounded Gemini answer
│   ├── askWiki.ts              # Combined callable: embed → search → ragAnswer
│   ├── setUserRole.ts          # ADMIN-only callable to set custom claims
│   └── syncUserOnSignup.ts     # beforeUserCreated trigger: set VIEWER claim + upsert User row
└── docs/                       # Architecture, SDD, and Implementation Plan
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- Firebase CLI: `npm install -g firebase-tools`
- Docker (for the local emulator's PostgreSQL instance)
- A Firebase project on the **Blaze (pay-as-you-go)** plan

### 1. Clone and install

```powershell
git clone <repo-url>
cd pew-pew
npm install
cd functions && npm install && cd ..
```

### 2. Configure Firebase

```powershell
firebase login
firebase use pew-bab23   # or your own project ID
```

### 3. Run locally

```powershell
# Start the Firebase emulators (PostgreSQL + Functions + Auth + Data Connect)
firebase emulators:start

# In a second terminal — start the Vite dev server
npm run dev
```

### 4. Bootstrap your ADMIN account

After signing in for the first time, promote your account to ADMIN so you can manage roles and publish articles:

```powershell
cd functions
npx ts-node --project tsconfig.json scripts/bootstrap-admin.ts <your-firebase-uid>
```

Your Firebase UID can be found in the Firebase Console → Authentication, or by running:

```powershell
firebase auth:export users.json --project <project-id>
```

---

## Deployment

### Apply the database schema to Cloud SQL

```powershell
firebase dataconnect:sql:diff    # review changes
firebase dataconnect:sql:migrate # apply to production
```

### Set the Gemini API key secret

```powershell
firebase functions:secrets:set GEMINI_API_KEY
```

### Build and deploy

```powershell
npm run build
firebase deploy --only hosting,dataconnect,functions
```

---

## AI Assistant

The chat panel (sparkle icon in the top bar) uses a two-step RAG pipeline:

1. **Step 1 (`searchWikiByQuery`)** — the user's question is embedded server-side and the top 3 most relevant published articles are retrieved via cosine similarity search.
2. **Step 2 (`ragAnswer`)** — article content is flattened and injected into a grounded Gemini prompt: *"Answer ONLY using the provided wiki context."*

The embedding and vector search happen entirely server-side inside Cloud Functions because the `Vector` input type cannot be serialised by the Data Connect client SDK.

---

## Roles

| Role | Can read | Can write | Can manage |
|---|---|---|---|
| VIEWER | ✅ (email verified) | ✗ | ✗ |
| EXPERT | ✅ | Own articles | ✗ |
| ADMIN | ✅ | Any article | Users, categories |

Roles are stored as Firebase Auth custom claims (`auth.token.role`) and enforced by `@auth` expressions on every Data Connect mutation and query.

---

## Regenerating the client SDK

Run this after any change to `schema.gql`, `queries.gql`, or `mutations.gql`:

```powershell
firebase dataconnect:sdk:generate
```

The generated files in `src/dataconnect-generated/` are committed to source control (they contain no secrets).
