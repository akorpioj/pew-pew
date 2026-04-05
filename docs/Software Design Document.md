**Software Design Document: Private Expert Wiki (v1.0)**

## **1\. System Overview**

A private knowledge-sharing platform where experts publish structured, block-based articles. The system features a "Category-first" organizational structure and a built-in AI assistant that performs Retrieval-Augmented Generation (RAG) to provide answers grounded in the wiki's internal data.

## **2\. Design Goals**

* **Data Integrity:** Use a relational schema to manage complex expert citations and category hierarchies.  
* **Privacy:** Strict Role-Based Access Control (RBAC) at the database level.  
* **AI-Native:** Seamlessly integrate vector embeddings for semantic search and AI assistance.

* **Developer Velocity:** Minimize boilerplate using auto-generated type-safe SDKs.

## **3\. Technology Stack**

| Component | Choice | Justification |
| :---- | :---- | :---- |
| **Frontend** | React 19+ / Shadcn/ui | Component-based architecture with high-fidelity UI primitives. |
| **Editor** | BlockNote | Notion-style block editing with structured JSON output. |
| **Database** | Firebase Data Connect | Managed PostgreSQL with native GraphQL and @auth directives. |
| **Vector DB** | pgvector (PostgreSQL) | Stores high-dimensional embeddings alongside relational data. |
| **AI Model** | Gemini 3 Flash | Frontier-class speed and performance for RAG and auto-tagging. |
| **AI Framework** | Firebase Genkit | Orchestrates the flow between the database, Gemini, and the client. |

## ---

**4\. Data Modeling**

### **4.1 Relational Schema (schema.gql)**

The schema utilizes PostgreSQL's JSONB for content and vector for AI features.

GraphQL

\# Article Table  
type Article @table {  
  id: UUID\! @default(expr: "uuidV4()")  
  title: String\!  
  slug: String\! @unique  
  content: Any\!                 \# BlockNote JSON array (JSONB)  
  content\_embedding: Vector(768) \# pgvector for Semantic Search  
  category: Category\!  
  author: User\!  
  isPublished: Boolean\! @default(value: false)  
  createdAt: Timestamp\! @default(expr: "request.time")  
}

\# Nested Category Table  
type Category @table {  
  id: Int\! @default(expr: "nextval('category\_id\_seq')")  
  name: String\!  
  parent: Category              \# Self-reference for hierarchy  
  description: String  
}

\# User Table (Sync with Firebase Auth)  
type User @table {  
  id: String\! @primaryKey       \# Firebase Auth UID  
  email: String\!  
  role: String\!                 \# ADMIN, EXPERT, VIEWER  
}

## ---

**5\. Architectural Components**

### **5.1 Content Management (BlockNote \+ JSONB)**

* **Operation:** Experts edit in a block-based environment. Upon "Publish," the React app sends the editor.document JSON array to Postgres.  
* **Advantage:** Unlike HTML strings, JSON blocks allow Gemini to target and edit specific sections of an article without re-processing the entire document.

### **5.2 AI Assistant (RAG Pipeline)**

The system uses a **Retrieval-Augmented Generation** flow:

1. **Ingestion:** A Firebase Trigger captures a new article, flattens the JSON to text, and calls Gemini to generate a 768-dimension embedding.  
2. **Retrieval:** When a user asks a question via the Shadcn/ui Sidebar, a Data Connect query performs a Cosine Similarity search:

   GraphQL  
   query SearchWiki($vector: Vector\!) {  
     articles\_similaritySearch(vector: $vector, limit: 3\) {  
       title  
       content  
     }  
   }

3. **Augmentation:** The retrieved content is fed to **Gemini 3 Flash** with a system prompt: *"Answer only using the provided expert context."*

### **5.3 Security Design**

* **Operation-Level Auth:** Security is defined in mutations.gql and queries.gql.  
* **Authorization Expression:**  
  GraphQL  
  mutation UpdateArticle($id: UUID\!, $data: Article\_update\_input\!)  
    @auth(expr: "auth.token.role \== 'EXPERT' && auth.uid \== existing.authorId") {  
    article\_update(id: $id, data: $data)  
  }

* **App Check:** Validates that incoming requests originate only from the registered React web app, mitigating scraping attempts.

## ---

**6\. UI/UX Design (Shadcn/ui)**

* **Main Navigation:** A recursive Sidebar component fetching the Category tree.  
* **Article View:** Uses Shadcn's Typography and Accordion for references.  
* **AI Sheet:** A Sheet (Drawer) component on the right side for the persistent Gemini Assistant chat.  
* **Admin Dashboard:** A DataTable component for managing users and bulk-categorizing articles.

## **7\. Development & Deployment**

1. **Local Environment:** Use the **Firebase Emulator Suite** to test Postgres and Genkit logic locally.

2. **CI/CD:** GitHub Actions deploy Data Connect schemas and React builds to Firebase Hosting.  
3. **Monitoring:** Firebase Console provides real-time logs for Gemini API usage and Postgres query performance.
