"use client";

import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Hero } from "@/components/home/Hero";
import { Filters } from "@/components/home/Filters";
import { PromotionList } from "@/components/home/PromotionList";
import { usePromotions } from "@/hooks/usePromotions";

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
        />

        <PromotionList
          promotions={filteredPromotions}
          loading={loading}
          hasMore={hasMore}
          onLoadMore={() => setPage(page + 1)}
        />
      </main>
    </div>
  );
}
