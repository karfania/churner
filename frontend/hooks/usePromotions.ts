import { useState, useEffect } from "react";
import { Promotion } from "@/types";
import { fetchPromotions } from "@/lib/api";

interface UsePromotionsProps {
  initialPage?: number;
  initialLimit?: number;
  initialSource?: string;
  initialSubreddit?: string;
  initialUseLlm?: boolean;
}

export function usePromotions({
  initialPage = 1,
  initialLimit = 10,
  initialSource = "reddit",
  initialSubreddit = "bankbonuses",
  initialUseLlm = false,
}: UsePromotionsProps = {}) {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(initialPage);
  const [hasMore, setHasMore] = useState(false);
  const [source, setSource] = useState(initialSource);
  const [subreddit, setSubreddit] = useState(initialSubreddit);
  const [useLlm, setUseLlm] = useState(initialUseLlm);

  useEffect(() => {
    const loadPromotions = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchPromotions({
          page,
          limit: initialLimit,
          source,
          subreddit: source === "reddit" ? subreddit : undefined,
          use_llm: useLlm,
        });
        setPromotions(data.promotions);
        setHasMore(data.has_more);
      } catch (err) {
        setError("Failed to load promotions");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadPromotions();
  }, [page, source, subreddit, useLlm, initialLimit]);

  const changeSource = (newSource: string) => {
    setSource(newSource);
    setPage(1);
  };

  const changeSubreddit = (newSubreddit: string) => {
    setSubreddit(newSubreddit);
    setPage(1);
  };

  const toggleLlm = () => {
    setUseLlm((prev) => !prev);
    setPage(1);
  };

  return {
    promotions,
    loading,
    error,
    page,
    setPage,
    hasMore,
    source,
    changeSource,
    subreddit,
    changeSubreddit,
    useLlm,
    toggleLlm,
  };
}
