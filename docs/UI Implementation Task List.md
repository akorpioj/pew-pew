Here's the full picture: React + Vite + TypeScript, Shadcn/ui (Button, Card, Input, Separator, Sheet, Sidebar, Skeleton, Tooltip), BlockNote, and the Data Connect SDK are all installed. Missing: Firebase SDK (`firebase` npm package) and a router.

---

## UI Implementation Task List

### Setup
- [X] **T1:** Install `firebase` (auth SDK) and `react-router-dom`
  ```powershell
  npm install firebase react-router-dom
  ```
- [X] **T2:** Create `src/lib/firebase.ts` — initialize the Firebase app with your project config
```
firebase apps:list
```
- [X] **T3:** Create `src/lib/dataconnect.ts` — initialize the Data Connect connector from `dataconnect-generated/`
Usage in any component:
```
import dataConnect from "@/lib/dataconnect";
import { getCategoryTree } from "@dataconnect/generated";

const result = await getCategoryTree(dataConnect);
```
- [X] **T4:** Clean up `App.tsx` / `App.css` boilerplate from Vite scaffold

---

### Authentication
- [X] **T5:** Create `src/contexts/AuthContext.tsx` — `onAuthStateChanged` listener, exposes `user`, `signIn`, `signOut`
- [X] **T6:** Create `src/pages/LoginPage.tsx` — Google sign-in button (using Shadcn `Button`), redirects on success
- [X] **T7:** Create `src/components/ProtectedRoute.tsx` — redirects to `/login` if `user` is null

The `CONFIGURATION_NOT_FOUND` error means Google Sign-In is not enabled in the Firebase Console. 
**Fix:**
1. Go to [Firebase Console](https://console.firebase.google.com) → select project <your-project>  
2. Click **Security** → **Authentication** in the left bottom sidebar
3. Click the **Sign-in method** tab
4. Click **Google** → toggle **Enable** → set your support email → click **Save**

Once enabled, also confirm `localhost` is in the authorized domains list (it should be there by default under Authentication → Settings → Authorized domains).

---

### Routing & App Shell
- [X] **T8:** Set up `react-router-dom` routes in `App.tsx`:
  - `/login` → `LoginPage`
  - `/` → redirect to `/wiki`
  - `/wiki` → `WikiLayout` (protected)
  - `/wiki/category/:categoryId` → `ArticleListPage`
  - `/wiki/article/:slug` → `ArticleViewPage`
  - `/wiki/edit/:slug?` → `ArticleEditorPage` (EXPERT only)
- [X] **T9:** Create `src/layouts/WikiLayout.tsx` — wraps the existing Shadcn `Sidebar` + main content area

---

### Category Sidebar
- [X] **T10:** Create `src/components/CategoryTree.tsx` — recursive component that renders categories from `useGetCategoryTree()` hook into `SidebarMenu` / `SidebarMenuItem` nodes
- [X] **T11:** Wire category click → navigate to `/wiki/category/:categoryId`
- [X] **T12:** Add "New Article" `SidebarMenuItem` (visible to EXPERTs only, based on auth role)

---

### Article List
- [X] **T13:** Create `src/pages/ArticleListPage.tsx` — calls `useGetArticlesByCategory($categoryId)`, renders articles as Shadcn `Card` grid
- [X] **T14:** Show `Skeleton` cards while loading

---

### Article View
- [X] **T15:** Create `src/pages/ArticleViewPage.tsx` — calls `useGetArticleBySlug($slug)`, renders BlockNote in read-only mode (`editable={false}`)
- [X] **T16:** Show article metadata (author, date, category breadcrumb) above the editor

---

### BlockNote Editor
- [X] **T17:** Create `src/components/Editor.tsx` — `useCreateBlockNote()` + `<BlockNoteView>`, exposes `getContent(): Block[]` via ref/callback
- [X] **T18:** Create `src/pages/ArticleEditorPage.tsx` — contains:
  - Title `Input`
  - Category `Select` (populated from `useGetCategoryTree()`)
  - `isPublished` toggle
  - `Editor` component
  - Save `Button`
- [X] **T19:** Wire Save button to `useUpsertArticle()` — pass `title`, `slug` (auto-derived from title), `content`, `categoryId`, `isPublished`
- [X] **T20:** Auto-generate `slug` from title (kebab-case, unique suffix if needed)

---

### AI Assistant Sheet
- [X] **T21:** Create `src/components/AiAssistantSheet.tsx` — uses the existing Shadcn `Sheet` component, contains a chat `Input` and scrollable response area
- [X] **T22:** Add a persistent trigger button (floating or in the header) to open the sheet
- [X] **T23:** Wire the query input → similarity search → Gemini response (stub with `"AI coming soon"` until Phase 4 is done)

---

### Polish
- [X] **T24:** Add `Tooltip` to icon-only buttons (New Article, AI trigger)
- [X] **T25:** Add `Separator` between sidebar sections (categories / actions)
- [X] **T26:** Implement error boundary / 404 page for unknown routes/slugs
- [X] **T27:** Verify EXPERT-only routes/actions are hidden from VIEWERs using the auth role from the JWT custom claim