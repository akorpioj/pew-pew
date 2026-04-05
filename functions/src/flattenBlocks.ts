/**
 * Minimal BlockNote Block type definitions (matches BlockNote v0.47 JSON schema).
 * We cannot import from BlockNote inside the Cloud Functions bundle, so we
 * replicate only the fields we actually walk.
 */
interface InlineContent {
  type: string;
  text?: string;
}

interface Block {
  id?: string;
  type?: string;
  content?: InlineContent[];
  children?: Block[];
}

/**
 * Recursively walks a BlockNote `Block[]` and returns a plain string
 * suitable for embedding.
 *
 * - Text runs (`content[].type === "text"`) are joined as-is.
 * - A newline is appended after each block so paragraphs are word-separated.
 * - Nested `children` blocks are flattened in document order.
 *
 * Non-text inline items (images, links) are silently skipped — only the
 * text runs contribute to the embedding.
 */
export function flattenBlocks(blocks: Block[]): string {
  const parts: string[] = [];

  function walkBlock(block: Block): void {
    if (Array.isArray(block.content)) {
      for (const item of block.content) {
        if (item.type === "text" && item.text) {
          parts.push(item.text);
        }
      }
    }
    if (Array.isArray(block.children)) {
      for (const child of block.children) {
        walkBlock(child);
      }
    }
    parts.push("\n");
  }

  for (const block of blocks) {
    walkBlock(block);
  }

  return parts.join("").trim();
}
