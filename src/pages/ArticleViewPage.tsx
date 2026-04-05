import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getArticleBySlug } from "@dataconnect/generated";
import type { GetArticleBySlugData } from "@dataconnect/generated";
import dataConnect from "@/lib/dataconnect";
import { useAuth } from "@/contexts/AuthContext";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteViewRaw as BlockNoteView } from "@blocknote/react";
import type { Block } from "@blocknote/core";
import "@blocknote/react/style.css";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { PencilIcon } from "lucide-react";

type Article = NonNullable<GetArticleBySlugData["article"]>;

// ── Metadata row ──────────────────────────────────────────────────────────────
function ArticleMeta({ article }: { article: Article }) {
  const navigate = useNavigate();
  const { role } = useAuth();

  const date = new Date(article.createdAt).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const canEdit = role === "EXPERT" || role === "ADMIN";

  return (
    <div className="mb-6 space-y-3">
      <div className="flex items-start justify-between gap-4">
        <h1 className="text-2xl font-semibold leading-tight">{article.title}</h1>
        {canEdit && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/wiki/edit/${article.slug}`)}
            className="shrink-0"
          >
            <PencilIcon className="mr-1.5 size-3.5" />
            Edit
          </Button>
        )}
      </div>

      {/* T16: breadcrumb + metadata */}
      <nav className="text-sm text-muted-foreground" aria-label="Breadcrumb">
        <span
          className="cursor-pointer hover:underline"
          onClick={() => navigate(`/wiki/category/${article.category.id}`)}
        >
          {article.category.name}
        </span>
        <span className="mx-1.5">/</span>
        <span>{article.title}</span>
      </nav>

      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <span>{article.author.email}</span>
        <span>·</span>
        <time dateTime={article.createdAt}>{date}</time>
        {!article.isPublished && (
          <span className="rounded border px-1.5 py-0.5">Draft</span>
        )}
      </div>

      <Separator />
    </div>
  );
}

// ── Read-only BlockNote view ──────────────────────────────────────────────────
function ArticleBody({ content }: { content: unknown }) {
  const blocks = useMemo<Block[]>(() => {
    if (Array.isArray(content)) return content as Block[];
    return [];
  }, [content]);

  const editor = useCreateBlockNote({ initialContent: blocks.length ? blocks : undefined });

  return (
    <BlockNoteView
      editor={editor}
      editable={false}
      theme="light"
    />
  );
}

// ── Loading skeleton ──────────────────────────────────────────────────────────
function ArticleViewSkeleton() {
  return (
    <div className="p-6 space-y-4">
      <Skeleton className="h-7 w-2/3 rounded" />
      <Skeleton className="h-4 w-1/3 rounded" />
      <Skeleton className="h-3 w-1/4 rounded" />
      <Separator />
      <div className="space-y-2 pt-2">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-4 rounded" style={{ width: `${85 - i * 5}%` }} />
        ))}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ArticleViewPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;

    setLoading(true);
    setError(null);

    getArticleBySlug(dataConnect, { slug })
      .then((res: { data: GetArticleBySlugData }) => {
        if (!res.data.article) {
          navigate("/wiki", { replace: true });
        } else {
          setArticle(res.data.article);
        }
      })
      .catch((err: { message?: string }) =>
        setError(err?.message ?? "Failed to load article.")
      )
      .finally(() => setLoading(false));
  }, [slug, navigate]);

  if (loading) return <ArticleViewSkeleton />;

  if (error) {
    return (
      <div className="p-6">
        <p className="text-sm text-destructive">{error}</p>
      </div>
    );
  }

  if (!article) return null;

  return (
    <article className="mx-auto max-w-3xl p-6">
      <ArticleMeta article={article} />
      <ArticleBody content={article.content} />
    </article>
  );
}