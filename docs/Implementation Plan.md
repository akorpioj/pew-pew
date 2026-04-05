**Phase 1: Environment & Infrastructure**

**Goal:** Set up the cloud and local foundations.

* **Task 1.1: Firebase Project Initialization**

  * **Action:** Go to the [Firebase Console](https://console.firebase.google.com/), create a new project, and enable **Blaze (Pay-as-you-go) Plan** (required for Cloud SQL).  
  * **Action:** In your terminal, run npm install -g firebase-tools, then firebase login.  
  * **Action:** Create a project folder and run firebase init dataconnect. Select "Use an existing project".

* **Task 1.2: Local Emulator Setup**  
  * **Action:** Ensure Docker is running. Start the emulators with firebase emulators:start.  
  * **Instruction:** This provides a local PostgreSQL instance and a Data Connect UI to test your GraphQL queries without incurring costs.

### ---

**Phase 2: Database & API Layer**

**Goal:** Define the wiki's "Filing Cabinet" structure.

* **Task 2.1: Define the Schema**  
  * **Action:** Open dataconnect/schema/schema.gql. Define the User, Category, and Article tables as per the Design Document.  
  * **Key Detail:** Ensure the Article table has a content: Any\! field (for BlockNote JSON) and embedding: Vector(768) for Gemini search.  
* **Task 2.2: Write Operations**  
  * **Action:** In dataconnect/queries.gql, write a recursive query to fetch the category tree.  
  * **Action:** In dataconnect/mutations.gql, write the upsertArticle mutation.  
  * **Instruction:** Run firebase dataconnect:sdk:generate to create your type-safe React hooks.

### ---

**Phase 3: Frontend & Editor Construction**

**Goal:** Build the interface experts will actually use.

* **Task 3.1: React & Shadcn/ui Setup**  
  * **Action:** Scaffold with Vite: npm create vite@latest my-wiki \-- \--template react-ts.  
  * **Action:** Follow the [Shadcn/ui installation guide](https://ui.shadcn.com/docs/installation/vite). Install the Sidebar, Button, Card, and Sheet components.  
* **Task 3.2: Implement BlockNote**  
  * **Action:** Install @blocknote/core and @blocknote/react.  
  * **Action:** Create an Editor component. Configure it to use editor.document to extract the JSON.  
  * **Instruction:** Bind the "Save" button to the useUpsertArticle() hook generated in Task 2.2.

### ---

**Phase 4: AI & Search (The "Brain")**

**Goal:** Turn static articles into a searchable AI assistant.

* **Task 4.1: Vector Ingestion (The "Embedder")**  
  * **Action:** Setup **Firebase Genkit**. Create a flow that triggers when an Article is updated.  
  * **Action:** Inside the flow, use textEmbeddingGecko or gemini-3-flash to generate a vector from the article text.  
  * **Action:** Update the embedding column in your Article table with the result.  
* **Task 4.2: RAG Assistant UI**  
  * **Action:** Create a Shadcn Sheet (sidebar). Add a text input for the user.  
  * **Action:** Implement the **Similarity Search** query in Data Connect to find relevant blocks.  
  * **Action:** Send the results to **Gemini 3 Flash** to generate the final response.

### ---

**Phase 5: Security & Access Control**

**Goal:** Ensure "Private" means private.

* **Task 5.1: Custom Claims for Roles**  
  * **Action:** Create a simple Firebase Cloud Function called setAdminClaim.  
  * **Action:** Use the Firebase Admin SDK to set { role: 'EXPERT' } on your own UID to give yourself access.  
* **Task 5.2: Database Locking (@auth)**  
  * **Action:** Add @auth(expr: "auth.token.role \== 'EXPERT'") to your Article mutations in Data Connect.  
  * **Action:** Add @auth(level: USER\_EMAIL\_VERIFIED) to your queries to ensure only logged-in members of your team can read the wiki.

### ---

**Phase 6: Final Deployment**

**Goal:** Move from local development to production.

* **Task 6.1: Cloud SQL Migration**  
  * **Action:** Run firebase dataconnect:sql:diff to review changes, then firebase dataconnect:sql:migrate to push your schema to the live PostgreSQL instance.  
* **Task 6.2: Frontend Hosting**  
  * **Action:** Run npm run build and firebase deploy \--only hosting,dataconnect.  
  * **Instruction:** Enable **App Check** in the Firebase Console to ensure only your website can access the database.

### ---

**Solo Dev Success Checklist**

* \[ \] **Day 1-3:** Can I save a basic "Hello World" block from the editor to the database?  
* \[ \] **Day 7:** Can I navigate the category tree in the sidebar?  
* \[ \] **Day 10:** Does the AI Assistant respond correctly based on a specific article I just wrote?  
* \[ \] **Day 14:** Can I log in as a "Viewer" and verify I *cannot* edit articles?