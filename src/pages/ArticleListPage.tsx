import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getArticlesByCategory } from "@dataconnect/generated";
import type { GetArticlesByCategoryData } from "@dataconnect/generated";
import dataConnect from "@/lib/dataconnect";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type Article = GetArticlesByCategoryData["articles"][number];

function ArticleCard({ article }: { article: Article }) {
  const navigate = useNavigate();
  const date = new Date(article.createdAt).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <Card
      className="cursor-pointer transition-shadow hover:shadow-md"
      onClick={() => navigate(`/wiki/article/${article.slug}`)}
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="line-clamp-2 text-base">{article.title}</CardTitle>
          {!article.isPublished && (
            <span className="shrink-0 rounded border px-1.5 py-0.5 text-xs text-muted-foreground">
              Draft
            </span>
          )}
        </div>
        <CardDescription className="text-xs">{date}</CardDescription>
      </CardHeader>
      <CardContent />
      <CardFooter className="text-xs text-muted-foreground">
        {article.author.email}
      </CardFooter>
    </Card>
  );
}

function SkeletonCard() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-4 w-3/4 rounded" />
        <Skeleton className="mt-1 h-3 w-1/3 rounded" />
      </CardHeader>
      <CardContent />
      <CardFooter>
        <Skeleton className="h-3 w-1/2 rounded" />
      </CardFooter>
    </Card>
  );
}

export default function ArticleListPage() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!categoryId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    getArticlesByCategory(dataConnect, { categoryId })
      .then((res: { data: GetArticlesByCategoryData }) => setArticles(res.data.articles))
      .catch((err: { message?: string }) => setError(err?.message ?? "Failed to load articles."))
      .finally(() => setLoading(false));
  }, [categoryId]);

  if (!categoryId) {
    return (
      <div className="p-8">
        <p className="text-muted-foreground">Select a category from the sidebar.</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      {error && (
        <p className="mb-4 text-sm text-destructive">{error}</p>
      )}

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : articles.length === 0 ? (
        <p className="text-muted-foreground">No articles in this category yet.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      )}
    </div>
  );
}