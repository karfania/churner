"use client";

import React from "react";
import { useBookmarks } from "@/hooks/useBookmarks";
import { PromotionCard } from "@/components/promotions/PromotionCard";
import { Header } from "@/components/layout/Header";

export default function SavedPage() {
  const { bookmarks, clearBookmarks } = useBookmarks();

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-gray-900 font-sans selection:bg-blue-100">
      <Header />

      <main className="max-w-5xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Saved Deals</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => clearBookmarks()}
              className="text-sm px-3 py-1.5 rounded-md bg-red-50 text-red-600 border border-red-100 hover:bg-red-100"
            >
              Clear All
            </button>
          </div>
        </div>

        {bookmarks.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500">You have no saved deals yet. Click the bookmark icon on a deal to save it.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {bookmarks.map((b) => (
              <PromotionCard key={b.id} promotion={b} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
