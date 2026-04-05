import { getDataConnect } from "firebase-admin/data-connect";

const connectorConfig = {
  location: "europe-north1",
  serviceId: "pew-pew",
  connector: "pew-pew-connector",
};

/**
 * Shape of each article returned by the similarity search.
 * `content` is the raw BlockNote JSON (Any! column).
 */
export interface SearchResult {
  id: string;
  title: string;
  slug: string;
  content: unknown;
}

interface SearchWikiResponse {
  articles_embedding_similarity: SearchResult[];
}

interface SearchVariables {
  vector: number[];
  limit: number;
}

/**
 * Server-side vector similarity search over published articles.
 *
 * Uses the Data Connect Admin SDK to execute a raw `executeGraphqlRead`
 * call — bypassing the client connector SDK which cannot serialise Vector
 * input types. This function is called internally by the `ragAnswer` flow.
 *
 * @param vector  Pre-computed 768-dim embedding (from text-embedding-004).
 * @param limit   Maximum number of results (default 3).
 * @returns       Top articles sorted by COSINE similarity to the query vector.
 */
export async function searchWiki(
  vector: number[],
  limit = 3
): Promise<SearchResult[]> {
  const dc = getDataConnect(connectorConfig);

  // Data Connect generates `articles_embedding_similarity` for the `embedding`
  // Vector column. The Admin SDK passes `vector` as a plain JSON array —
  // the GQL type annotation ($vector: Vector!) is accepted server-side.
  const result = await dc.executeGraphqlRead<SearchWikiResponse, SearchVariables>(
    `query SearchWiki($vector: Vector!, $limit: Int!) {
      articles_embedding_similarity(
        compare: $vector
        method: COSINE
        where: { isPublished: { eq: true } }
        limit: $limit
      ) {
        id
        title
        slug
        content
      }
    }`,
    { variables: { vector, limit } }
  );

  return result.data.articles_embedding_similarity ?? [];
}
