"use client";

import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Hero } from "@/components/home/Hero";
import { Filters } from "@/components/home/Filters";
import { PromotionList } from "@/components/home/PromotionList";
import { usePromotions } from "@/hooks/usePromotions";
import { Loader2 } from "lucide-react";

export default function Home() {
  const {
    promotions,
    loading,
    page,
    setPage,
    hasMore,
    source,
    changeSource,
    subreddit,
    changeSubreddit,
    useLlm,
    toggleLlm,
    findDeals,
    status,
    cooldown,
  } = usePromotions();

  const [activeFilter, setActiveFilter] = useState("All Deals");

  const filteredPromotions = promotions.filter((promo) => {
    if (activeFilter === "All Deals") return true;
    if (activeFilter === "Checking") return promo.offer_type === "Checking";
    if (activeFilter === "Savings") return promo.offer_type === "Savings";
    if (activeFilter === "No Fees") return promo.monthly_fees === 0;
    if (activeFilter === "High Bonus") return promo.bonus_amount >= 500;
    return true;
  });

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-gray-900 font-sans selection:bg-blue-100">
      <Header />

      <main className="max-w-5xl mx-auto px-6 py-12">
        <Hero />
        
        <Filters
          source={source}
          onSourceChange={changeSource}
          subreddit={subreddit}
          onSubredditChange={changeSubreddit}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          useLlm={useLlm}
          onToggleLlm={toggleLlm}
          loading={loading}
          cooldown={cooldown}
          onFindDeals={() => findDeals({ page: 1, source, subreddit, useLlm })}
        />

        {status && (
          <div className="max-w-5xl mx-auto px-6 py-4 flex justify-center">
            <div className="flex items-center justify-center gap-3 bg-white rounded-xl p-3 shadow-sm border border-gray-100 max-w-2xl w-full">
              <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
              <span className="text-sm text-gray-700">{status}</span>
            </div>
          </div>
        )}

        <PromotionList
          promotions={filteredPromotions}
          loading={loading}
          hasMore={hasMore}
          onLoadMore={() => findDeals({ page: page + 1, source, subreddit, useLlm })}
        />
      </main>
    </div>
  );
}
