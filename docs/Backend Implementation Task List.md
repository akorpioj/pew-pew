# Backend Implementation Task List

Current state: Phase 1–3 frontend complete. The tasks below cover everything needed to finish
Phases 4–6 as described in the Implementation Plan and Architecture documents.

---

## Phase 4 — AI & Search (The "Brain")

### 4.1 Schema: add `@auth` directives to lock down Data Connect operations
(IMPLEMENTED 2026/04/05)
The current `schema.gql`, `queries.gql`, and `mutations.gql` use `@auth(level: USER)` uniformly.
The SDD specifies per-role expressions that are still missing.

- [X] **B1:** Add `@auth` write-guard to `UpsertArticle` mutation — restrict to EXPERT/ADMIN only:
  ```graphql
  @auth(expr: "auth.token.role == 'EXPERT' || auth.token.role == 'ADMIN'")
  ```
- [X] **B2:** Add ownership check to update path of `UpsertArticle` — author can only edit their own articles:
  ```graphql
  @auth(expr: "(auth.token.role == 'ADMIN') || (auth.token.role == 'EXPERT' && auth.uid == item.authorId)")
  ```
  *(requires a separate `UpdateArticle` mutation for the ownership expression to reference `item`)*
- [X] **B3:** Add `DeleteArticle` mutation with ADMIN-only `@auth` guard
- [X] **B4:** Add `SearchWiki` similarity-search query (see §4.3 below) with `@auth(level: USER)`
- [X] **B5:** Add `@auth(level: USER_EMAIL_VERIFIED)` to all read queries (`GetCategoryTree`, `GetArticlesByCategory`, `GetArticleBySlug`) — tighten from `USER` to verified email
- [X] **B6:** Add `UpsertCategory` and `DeleteCategory` mutations restricted to ADMIN only
- [X] **B7:** Add `UpsertUser` mutation (upsert by `auth.uid`) for first-login user record creation, restricted to `@auth(level: USER)`
- [X] **B8:** Re-run `firebase dataconnect:sdk:generate` after every GQL change to regenerate the type-safe SDK

---

### 4.2 Genkit embedding flow (Vector Ingestion)

The `embedding` column in the `Article` table is currently never populated — the UpsertArticle
mutation explicitly omits it. This flow provides the "write path" for embeddings.

- [X] **B9:** Create a `functions/` directory and initialize a Node.js/TypeScript Firebase Functions project:
  ```powershell
  mkdir functions
  cd functions
  npm init -y
  npm install -D typescript ts-node
  npm install firebase-admin firebase-functions @genkit-ai/firebase @genkit-ai/googleai genkit
  ```
- [X] **B10:** Create `functions/src/index.ts` exporting a `Firestore`-triggered or HTTPS-callable Genkit flow `embedArticle`:
  1. Accept `{ articleId: string, content: Block[] }` as input
  2. Flatten BlockNote JSON blocks to plain text (recursive walk over `block.content[].text`)
  3. Call `embed()` with `googleai/text-embedding-004` (768-dimension, replacing deprecated `textEmbeddingGecko`)
  4. Write the resulting vector back to the Article row via the Data Connect Admin SDK or a direct Cloud SQL update
- [X] **B11:** Create `functions/src/flattenBlocks.ts` utility — given a `Block[]`, return a plain `string` (strip formatting, concatenate text runs, handle nested blocks)
- [X] **B12:** Wire `embedArticle` to trigger automatically after `UpsertArticle` succeeds:
  - Option A (recommended): Make it an HTTPS-callable function; call it from the React `handleSave` in `ArticleEditorPage` after the upsert resolves
  - Option B: Use a Firestore document write as a trigger (requires mirroring Data Connect writes to Firestore — more complex)
- [X] **B13:** Update `ArticleEditorPage.tsx` to call the `embedArticle` function after a successful save (if Option A chosen in B12):
  ```ts
  const embedArticle = httpsCallable(functions, "embedArticle");
  await embedArticle({ articleId: result.data.article_upsert.id, content });
  ```
- [X] **B14:** Add `functions/tsconfig.json`, `.eslintrc.js`, and update root `firebase.json` to include `"functions": { "source": "functions" }`

---

### 4.3 Data Connect: Similarity Search query

- [X] **B15:** Add `embedding` field to the `Article` table:
  > **Note:** The current `schema.gql` has the field named `embedding`; the generated SDK uses `contentEmbedding`. Re-generate.
- [X] **B16:** Add `SearchWiki` query to `queries.gql` using pgvector cosine similarity:
  ```graphql
  query SearchWiki($vector: Vector!) @auth(level: USER) {
    articles_similaritySearch(
      compare: { field: embedding, vector: $vector }
      limit: 3
      where: { isPublished: { eq: true } }
    ) {
      id
      title
      slug
      content
    }
  }
  ```
- [X] **B17:** Re-run `firebase dataconnect:sdk:generate` to get the `searchWiki(dc, vars)` function
- [X] **B18:** Wire `SearchWiki` into `AiAssistantSheet.tsx`:
  1. Vectorize the user query via the `embedArticle` function (or a dedicated `embedQuery` callable)
  2. Call `searchWiki(dataConnect, { vector })` to retrieve top-3 articles
  3. Send retrieved content as context to the Gemini API call (replaces the `"AI coming soon"` stub)

---

### 4.4 Gemini RAG response (AI Assistant)

- [ ] **B19:** Create `functions/src/ragAnswer.ts` — an HTTPS-callable Genkit flow:
  1. Accept `{ question: string, contextArticles: { title: string, content: Block[] }[] }`
  2. Flatten article content to text (`flattenBlocks` utility)
  3. Build a grounded prompt: *"Answer only using the provided expert context. Context: …"*
  4. Call `generate()` with `googleai/gemini-2.0-flash` and return `{ answer: string }`
- [ ] **B20:** Update `AiAssistantSheet.tsx` to replace the `queryAi` stub with a two-step call:
  - Step 1: embed the query → `searchWiki` → retrieve context articles
  - Step 2: call `ragAnswer` with question + context → display response

---

## Phase 5 — Security & Access Control

### 5.1 Custom Claims (Role injection)

Without custom claims set, the JWT `auth.token.role` expression in @auth directives will always be `undefined`.

- [X] **B21:** Create `functions/src/setUserRole.ts` — an HTTPS-callable Firebase Function (ADMIN only):
  ```ts
  // Sets { role: 'EXPERT' | 'ADMIN' | 'VIEWER' } on any uid
  // Caller must themselves be ADMIN (verified via their own ID token)
  export const setUserRole = onCall(async (request) => {
    // verify caller is ADMIN
    // admin.auth().setCustomUserClaims(uid, { role })
  });
  ```
  To bootstrap yourself as ADMIN:
1. Download a service account key from Firebase Console → Project Settings → Service Accounts
2. Save it as functions/scripts/service-account-key.json
3. Run: npx ts-node --project tsconfig.json scripts/bootstrap-admin.ts <your-uid>
Get your uid (localId):
npx firebase-tools@latest auth:export users.json --project pew-bab23 Get-Content users.json | Select-String "localId|email"
- [X] **B22:** Create `functions/src/syncUserOnSignup.ts` — an `onDocumentCreated` or `beforeUserCreated` Auth trigger that:
  1. Sets the default claim `{ role: 'VIEWER' }` for every new sign-up
  2. Upserts a `User` row in Data Connect (so the FK from Article → User is always satisfiable)
- [X] **B23:** Document the one-time bootstrap command to make yourself ADMIN:
  ```ts
  // Run once in Firebase Admin SDK (e.g. a local script):
  admin.auth().setCustomUserClaims("<your-uid>", { role: "ADMIN" });
  ```
  Add this as a `functions/scripts/bootstrap-admin.ts` script.

### 5.2 App Check

- [ ] **B24:** Enable App Check in the Firebase Console (use reCAPTCHA v3 for web)
- [ ] **B25:** Add App Check initialization to `src/lib/firebase.ts`:
  ```ts
  import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";
  initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider("<site-key>"),
    isTokenAutoRefreshEnabled: true,
  });
  ```
- [ ] **B26:** Enable App Check enforcement in the Firebase Console for Data Connect and Functions

### 5.3 Revisions table (Version History)

The Architecture doc specifies an immutable Revisions log but it is absent from the current schema.

- [ ] **B27:** Add `Revision` table to `schema.gql`:
  ```graphql
  type Revision @table {
    id: UUID! @default(expr: "uuidV4()")
    article: Article!
    content: Any!          # snapshot of BlockNote JSON at publish time
    savedAt: Timestamp! @default(expr: "request.time")
    savedBy: User!
  }
  ```
- [ ] **B28:** Add `CreateRevision` mutation restricted to EXPERT/ADMIN; call it from the `embedArticle` flow (or `ArticleEditorPage`) each time `isPublished: true`
- [ ] **B29:** Add `GetRevisionsByArticle($articleId: UUID!)` query
- [ ] **B30:** Implement a "Version History" slide-out Sheet in the article editor (optional — deferred to after core AI is working)

---

## Phase 6 — Deployment

### 6.1 Cloud SQL migration

- [ ] **B31:** Review schema diff before applying to production:
  ```powershell
  firebase dataconnect:sql:diff
  ```
- [ ] **B32:** Apply schema to live Cloud SQL instance:
  ```powershell
  firebase dataconnect:sql:migrate
  ```
  Enable `schemaValidation: "STRICT"` in `dataconnect.yaml` after migration is confirmed clean.

### 6.2 Firebase Hosting + Functions deployment

- [ ] **B33:** Build the React app and deploy hosting + Data Connect + Functions together:
  ```powershell
  npm run build
  firebase deploy --only hosting,dataconnect,functions
  ```
- [ ] **B34:** Set environment variables / secrets for Functions (Gemini API key):
  ```powershell
  firebase functions:secrets:set GEMINI_API_KEY
  ```
  Reference in code via `process.env.GEMINI_API_KEY` (Functions v2 automatically injects secrets).

### 6.3 CI/CD

- [ ] **B35:** Create `.github/workflows/deploy.yml` — GitHub Actions workflow:
  - Trigger: push to `main`
  - Steps: `npm ci` → `npm run build` → `firebase deploy --only hosting,dataconnect` (Functions deployed separately on function-source change)
  - Store `FIREBASE_SERVICE_ACCOUNT` as a GitHub secret

---

## Dependency Order (Critical Path)

```
B1–B8  (lock down GQL auth)
  └─► B31–B32  (migrate locked schema to Cloud SQL)
        └─► B9–B14  (Genkit functions scaffold)
              └─► B21–B23  (custom claims — needed before @auth exprs work)
                    └─► B15–B17  (similarity search query + SDK regen)
                          └─► B18–B20  (wire RAG into AI sheet)
                                └─► B24–B26  (App Check — last, on stable prod)

B27–B29  (Revisions) can be done in parallel with B9–B14
B33–B35  (deploy + CI)  after everything above is green
```

---

## Quick-win order for a solo developer

1. **B21–B23** first — without custom claims, no `@auth` role expression will ever pass, blocking all auth-gated features
2. **B1–B8** — add the missing `@auth` guards and mutations; run `sdk:generate`
3. **B9–B14** — scaffold Genkit; get `embedArticle` working locally against the emulator
4. **B15–B18** — add `SearchWiki`; confirm similarity search returns results
5. **B19–B20** — replace the AI stub with real RAG
6. **B24–B26** — enable App Check (do last, so it doesn't block local dev)
7. **B27–B29** — add Revisions (version history)
8. **B31–B35** — migrate and deploy to production
