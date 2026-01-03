"use client";

import { Promotion } from "@/types";
import { cn } from "@/lib/utils";
import { ExternalLink, Info, DollarSign, Calendar } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface PromotionCardProps {
    promotion: Promotion;
}

export function PromotionCard({ promotion }: PromotionCardProps) {
    const [showDetails, setShowDetails] = useState(false);

    const getScoreColor = (score: number) => {
        if (score >= 80) return "text-emerald-600 bg-emerald-50 border-emerald-200";
        if (score >= 60) return "text-amber-600 bg-amber-50 border-amber-200";
        return "text-rose-600 bg-rose-50 border-rose-200";
    };

    return (
        <motion.div 
            layout
            className="group relative bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden"
        >
            <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                                {promotion.offer_type}
                            </span>
                            <span className="text-xs font-medium text-gray-400">
                                {promotion.bank_name}
                            </span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                            {promotion.currency}{promotion.bonus_amount} Bonus
                        </h3>
                    </div>
                    <div 
                        className={cn(
                            "flex flex-col items-center justify-center w-12 h-12 rounded-xl border cursor-help transition-colors",
                            getScoreColor(promotion.score)
                        )}
                        title="Churner Score"
                        onClick={() => setShowDetails(!showDetails)}
                    >
                        <span className="text-sm font-bold">{promotion.score}</span>
                    </div>
                </div>

                <p className={cn("text-gray-600 text-sm mb-6", showDetails ? "" : "line-clamp-2")}>
                    {promotion.description}
                </p>

                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="flex items-start gap-2">
                        <DollarSign className="w-4 h-4 text-gray-400 mt-0.5" />
                        <div>
                            <p className="text-xs text-gray-500">Min Deposit</p>
                            <p className="text-sm font-medium text-gray-900">
                                {promotion.min_deposit > 0 ? `$${promotion.min_deposit.toLocaleString()}` : "None"}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-start gap-2">
                        <Calendar className="w-4 h-4 text-gray-400 mt-0.5" />
                        <div>
                            <p className="text-xs text-gray-500">Hold Period</p>
                            <p className="text-sm font-medium text-gray-900">
                                {promotion.holding_period_days} Days
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <button 
                        onClick={() => setShowDetails(!showDetails)}
                        className="text-sm font-medium text-gray-500 hover:text-gray-900 flex items-center gap-1 transition-colors"
                    >
                        <Info className="w-4 h-4" />
                        {showDetails ? "Hide Details" : "Details"}
                    </button>
                    <a 
                        href={promotion.promotion_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                    >
                        Get Deal
                        <ExternalLink className="w-4 h-4" />
                    </a>
                </div>
            </div>

            <AnimatePresence>
                {showDetails && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="bg-gray-50 border-t border-gray-100 px-6 py-4"
                    >
                        <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wider mb-2">Score Breakdown</h4>
                        <ul className="space-y-1">
                            {promotion.score_breakdown?.split("; ").map((item, i) => (
                                <li key={i} className="text-sm text-gray-600 flex items-center gap-2">
                                    <div className="w-1 h-1 rounded-full bg-blue-400" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
