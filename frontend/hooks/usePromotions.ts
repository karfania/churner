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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(initialPage);
  const [hasMore, setHasMore] = useState(false);
  const [source, setSource] = useState(initialSource);
  const [subreddit, setSubreddit] = useState(initialSubreddit);
  const [useLlm, setUseLlm] = useState(initialUseLlm);
  const [hasSearched, setHasSearched] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(false);

  // Simple client-side cache to return immediate results when returning to a query
  const cacheKey = (p: number, src: string, sub?: string, llm?: boolean) => `promos_${src}_${sub || ''}_${llm}_${p}_${initialLimit}`;

  const loadFromCache = (p: number, src: string, sub?: string, llm?: boolean) => {
    const k = cacheKey(p, src, sub, llm);
    const cached = typeof window !== "undefined" ? sessionStorage.getItem(k) : null;
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        setPromotions(parsed.promotions || []);
        setHasMore(parsed.has_more || false);
        setHasSearched(true);
        setError(null);
        return true;
      } catch (e) {
        return false;
      }
    }
    setPromotions([]);
    setHasMore(false);
    setHasSearched(false);
    return false;
  };

  // Manual fetch — only when user explicitly requests
  const findDeals = async (opts?: { page?: number; source?: string; subreddit?: string; useLlm?: boolean }) => {
    // Prevent execution if already loading or in cooldown
    if (loading || cooldown) return;

    // Activate cooldown for 3 seconds
    setCooldown(true);
    setTimeout(() => {
      setCooldown(false);
    }, 3000);
    const p = opts?.page ?? page;
    const src = opts?.source ?? source;
    const sub = opts?.subreddit ?? subreddit;
    const llmFlag = opts?.useLlm ?? useLlm;

    const k = cacheKey(p, src, sub, llmFlag);
    const cached = typeof window !== "undefined" ? sessionStorage.getItem(k) : null;
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (p <= 1) {
          setPromotions(parsed.promotions || []);
        } else {
          setPromotions((prev) => [...prev, ...(parsed.promotions || [])]);
        }
        setHasMore(parsed.has_more || false);
        setHasSearched(true);
        setPage(p);
        return parsed;
      } catch (e) {
        // fall through to fetch
      }
    }

    setLoading(true);
    setError(null);
    setStatus(`Scraping ${src}...`);

    try {
      const data = await fetchPromotions({
        page: p,
        limit: initialLimit,
        source: src,
        subreddit: src === "reddit" ? sub : undefined,
        use_llm: llmFlag,
      });

      // If loading page 1 (fresh search), replace promotions. Otherwise append.
      if (p <= 1) {
        setPromotions(data.promotions);
      } else {
        setPromotions((prev) => [...prev, ...(data.promotions || [])]);
      }

      setHasMore(data.has_more);
      setHasSearched(true);
      setPage(p);

      try {
        if (typeof window !== "undefined") {
          sessionStorage.setItem(k, JSON.stringify(data));
        }
      } catch {}

      // Update status while organizing
      setStatus("Organizing results...");

      // small delay to allow UI to render organization step
      await new Promise((r) => setTimeout(r, 300));

      // Indicate background scraping is running (server will fetch other sources)
      setStatus("Background scraping running — additional deals will appear shortly");

      // Keep the status visible for a short time, then clear but keep 'hasSearched'
      setTimeout(() => setStatus(null), 3000);

      return data;
    } catch (err) {
      setError("Failed to load promotions");
      console.error(err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const changeSource = (newSource: string) => {
    setSource(newSource);
    setPage(1);
    loadFromCache(1, newSource, subreddit, useLlm);
  };

  const changeSubreddit = (newSubreddit: string) => {
    setSubreddit(newSubreddit);
    setPage(1);
    loadFromCache(1, source, newSubreddit, useLlm);
  };

  const toggleLlm = () => {
    const newLlm = !useLlm;
    setUseLlm(newLlm);
    setPage(1);
    loadFromCache(1, source, subreddit, newLlm);
  };

  return {
    promotions,
    loading,
    error,
    page,
    setPage,
    hasMore,
    cooldown,
    source,
    changeSource,
    subreddit,
    changeSubreddit,
    useLlm,
    toggleLlm,
    findDeals,
    hasSearched,
    status,
  };
}
