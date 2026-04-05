**Architectural Design: Private Expert Wiki (2026)**

## **1\. Executive Summary**

The goal is to build a high-fidelity, private knowledge base where experts can publish structured, block-based content. The system uses **Firebase Data Connect** (PostgreSQL) to maintain complex relationships and **Gemini 1.5/3** to power an intelligent assistant that answers questions based strictly on the wiki's internal data.

## **2\. The 2026 Technology Stack**

| Layer | Component | Choice |
| :---- | :---- | :---- |
| **Frontend** | Framework | **React (Vite)** with **TypeScript** |
| **UI Library** | Components | **Shadcn/ui** (Tailwind CSS) |
| **Editor** | Content Creation | **BlockNote** (Block-based JSON output) |
| **Primary DB** | Relational / Vector | **Firebase Data Connect (PostgreSQL \+ pgvector)** |
| **AI Engine** | LLM / Embeddings | **Gemini 1.5 Pro** (via Firebase AI Logic) |
| **Auth/Security** | Identity & Access | **Firebase Auth** (Custom Claims) \+ **App Check** |

## ---

**3\. Data Architecture (Relational \+ Vector)**

Unlike traditional wikis, this architecture treats content as **structured data** rather than raw text.

### **3.1 Database Schema (Simplified GraphQL/SQL)**

The schema is defined in schema.gql and managed by Firebase Data Connect.

* **Users Table:** Stores IDs, emails, and roles (ADMIN, EXPERT, VIEWER).  
* **Articles Table:**  
  * content: **JSONB** column storing the BlockNote block array.  
  * embedding: **Vector(768)** column for AI similarity search.  
  * metadata: Title, slug, and timestamps.  
* **Categories Table:** Self-referencing table for "Category-first" hierarchy.  
  * parent\_id: Allows for unlimited nesting (e.g., *Engineering \> Software \> Architecture*).  
* **Revisions Table:** Immutable log of every "Publish" event for version control.

### **3.2 Data Integrity**

Using **PostgreSQL** ensures that if a category is deleted, you can prevent "orphaned" articles. All expert citations are validated via **Foreign Keys**, ensuring the wiki never has broken internal links.

## ---

**4\. AI & RAG Strategy (The Assistant)**

The "Private" nature of the wiki requires a strict **Retrieval-Augmented Generation (RAG)** pipeline to prevent the AI from hallucinating or leaking external info.

### **4.1 The Ingestion Pipeline**

When an expert publishes:

1. **Flattening:** The BlockNote JSON is converted to plain text.  
2. **Vectorization:** A Firebase Function sends text to the **Gemini Embedding Model**.  
3. **Storage:** The resulting vector is stored in the Articles table alongside the content.

### **4.2 The Retrieval Mechanism**

When a user asks a question in the **Shadcn Sheet assistant**:

1. The query is vectorized.  
2. A **Similarity Search** is performed in Postgres using the Cosine Distance operator ($\<=\>$).

3. **Grounding:** The top 3 most relevant "blocks" are retrieved and injected into the Gemini prompt as context.

## ---

**5\. Security & Private Access Control**

As a solo dev, security must be "set and forget."

### **5.1 Identity & Roles**

* **Authentication:** Managed via Firebase Auth.

* **Custom Claims:** Roles are injected into the User's JWT (JSON Web Token).

* **App Check:** Prevents any non-React client (like a script or bot) from querying the database.

### **5.2 Database Security (@auth)**

Security is enforced at the **Data Connect** level using @auth directives:

GraphQL

\# Example: Only Experts can create articles  
mutation CreateArticle($data: Article\_insert\_input\!)   
  @auth(expr: "auth.token.role \== 'EXPERT'") {  
  article\_insert(data: $data)  
}

## ---

**6\. Frontend Layout (Shadcn/ui)**

The UI is designed for high readability and expert utility:

* **The Sidebar:** A recursive component that renders the Categories table into a nested navigation tree.  
* **The Editor Workspace:** A full-width BlockNoteView wrapped in a Shadcn Card, providing a clean, focused writing environment.  
* **The Version History:** A slide-out Sheet that allows experts to compare the current JSON content with previous rows in the Revisions table.

## ---

**7\. Scalability for the Solo Developer**

This architecture minimizes "Maintenance Debt":

* **Serverless:** No servers to patch. Firebase handles scaling the Postgres instance (Cloud SQL).  
* **Type-Safety:** The generated SDK ensures that a change in the database never silently breaks the React frontend.  
* **Predictable Cost:** Since the app is private, traffic is controlled. You pay for the Cloud SQL instance and a small amount for Gemini API calls.

### ---

**Final Implementation Checklist**

1. \[ \] Initialize **Firebase Data Connect** with a Cloud SQL Postgres instance.

2. \[ \] Set up **BlockNote** in React to output JSON.  
3. \[ \] Configure **Firebase Auth** with a "Pre-shared key" or Admin-only sign-up to keep the wiki private.  
4. \[ \] Deploy a **Genkit** flow to handle automated vectorization on article save.  
5. \[ \] Build the **Shadcn Sidebar** using a flat-to-nested array utility for categories.