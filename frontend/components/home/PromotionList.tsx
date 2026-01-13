import { Promotion } from "@/types";
import { PromotionCard } from "@/components/promotions/PromotionCard";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

interface PromotionListProps {
  promotions: Promotion[];
  loading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
}

export function PromotionList({ promotions, loading, hasMore, onLoadMore }: PromotionListProps) {
  return (
    <>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {promotions.map((promo) => (
          <PromotionCard key={promo.id} promotion={promo} />
        ))}
      </div>

      {promotions.length === 0 && !loading && (
        <div className="text-center py-20">
          <p className="text-gray-500">No promotions found matching your criteria.</p>
        </div>
      )}

      {hasMore && (
        <div className="mt-12 text-center">
          <button
            onClick={onLoadMore}
            disabled={loading}
            className="bg-white border border-gray-200 text-gray-900 px-6 py-3 rounded-xl font-medium hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Load More Deals
          </button>
        </div>
      )}
    </>
  );
}
