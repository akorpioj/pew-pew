import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { Block } from "@blocknote/core";
import {
  getArticleBySlug,
  getCategoryTree,
  upsertArticle,
} from "@dataconnect/generated";
import type {
  GetArticleBySlugData,
  GetCategoryTreeData,
} from "@dataconnect/generated";
import dataConnect from "@/lib/dataconnect";
import Editor, { type EditorHandle } from "@/components/Editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

// ── T20: slug generation ──────────────────────────────────────────────────────
function toSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function uniqueSlug(title: string): string {
  return `${toSlug(title)}-${Date.now().toString(36)}`;
}

// ── Flat category list for <select> ──────────────────────────────────────────
type CategoryNode = GetCategoryTreeData["categories"][number];

interface FlatCategory {
  id: string;
  label: string;
}

function flattenCategories(
  nodes: CategoryNode[],
  depth = 0
): FlatCategory[] {
  const result: FlatCategory[] = [];
  for (const node of nodes) {
    result.push({ id: node.id, label: "\u00A0".repeat(depth * 4) + node.name });
    if (node.children.length) {
      result.push(...flattenCategories(node.children as CategoryNode[], depth + 1));
    }
  }
  return result;
}

// ── Loading skeleton ──────────────────────────────────────────────────────────
function EditorSkeleton() {
  return (
    <div className="mx-auto max-w-3xl space-y-4 p-6">
      <Skeleton className="h-9 w-full rounded" />
      <Skeleton className="h-9 w-48 rounded" />
      <Skeleton className="h-3 w-32 rounded" />
      <Skeleton className="mt-4 h-64 w-full rounded" />
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ArticleEditorPage() {
  const { slug } = useParams<{ slug?: string }>();
  const navigate = useNavigate();
  const editorRef = useRef<EditorHandle>(null);
  const isEditing = Boolean(slug);

  // Form state
  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [isPublished, setIsPublished] = useState(false);
  const [existingId, setExistingId] = useState<string | undefined>(undefined);
  const [existingSlug, setExistingSlug] = useState<string | undefined>(undefined);
  const [initialBlocks, setInitialBlocks] = useState<Block[] | undefined>(undefined);

  // Loading / error state
  const [loadingArticle, setLoadingArticle] = useState(isEditing);
  const [categories, setCategories] = useState<FlatCategory[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load categories once
  useEffect(() => {
    getCategoryTree(dataConnect)
      .then((res: { data: GetCategoryTreeData }) => {
        const flat = flattenCategories(res.data.categories);
        setCategories(flat);
        if (!isEditing && flat.length) setCategoryId(flat[0].id);
      })
      .catch(console.error);
  }, [isEditing]);

  // Load existing article in edit mode
  useEffect(() => {
    if (!slug) return;

    getArticleBySlug(dataConnect, { slug })
      .then((res: { data: GetArticleBySlugData }) => {
        const article = res.data.article;
        if (!article) {
          navigate("/wiki", { replace: true });
          return;
        }
        setTitle(article.title);
        setCategoryId(article.category.id);
        setIsPublished(article.isPublished);
        setExistingId(article.id);
        setExistingSlug(article.slug);
        setInitialBlocks(Array.isArray(article.content) ? (article.content as Block[]) : undefined);
      })
      .catch((err: { message?: string }) =>
        setError(err?.message ?? "Failed to load article.")
      )
      .finally(() => setLoadingArticle(false));
  }, [slug, navigate]);

  // T19: Save handler
  const handleSave = async () => {
    if (!title.trim()) { setError("Title is required."); return; }
    if (!categoryId) { setError("Please select a category."); return; }

    setError(null);
    setSaving(true);

    const content = editorRef.current?.getContent() ?? [];
    const finalSlug = existingSlug ?? uniqueSlug(title); // T20

    try {
      const result = await upsertArticle(dataConnect, {
        id: existingId ?? null,
        title: title.trim(),
        slug: finalSlug,
        content,
        categoryId,
        isPublished,
      });
      navigate(`/wiki/article/${finalSlug}`);
      // consume result to satisfy linter
      void result;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save article.";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loadingArticle) return <EditorSkeleton />;

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-6">
      <h2 className="text-lg font-semibold">
        {isEditing ? "Edit Article" : "New Article"}
      </h2>

      <Separator />

      {/* Title */}
      <div className="space-y-1">
        <label htmlFor="article-title" className="text-sm font-medium">
          Title
        </label>
        <Input
          id="article-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Article title"
        />
      </div>

      {/* Category */}
      <div className="space-y-1">
        <label htmlFor="article-category" className="text-sm font-medium">
          Category
        </label>
        <select
          id="article-category"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {categories.length === 0 && (
            <option value="" disabled>
              Loading categories…
            </option>
          )}
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.label}
            </option>
          ))}
        </select>
      </div>

      {/* Published toggle */}
      <div className="flex items-center gap-2">
        <input
          id="article-published"
          type="checkbox"
          checked={isPublished}
          onChange={(e) => setIsPublished(e.target.checked)}
          className="size-4 rounded border-input accent-primary"
        />
        <label htmlFor="article-published" className="text-sm font-medium">
          Published
        </label>
      </div>

      <Separator />

      {/* T17: BlockNote editor */}
      <div className="min-h-64 rounded-md border border-input">
        {/* Mount editor only once initialBlocks are ready (edit mode) or immediately (new mode) */}
        {(!isEditing || initialBlocks !== undefined || !loadingArticle) && (
          <Editor ref={editorRef} initialContent={initialBlocks} />
        )}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex justify-end gap-2 pb-8">
        <Button variant="outline" onClick={() => navigate(-1)} disabled={saving}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "Save"}
        </Button>
      </div>
    </div>
  );
}