import { PromotionResponse } from "@/types";
import { API_BASE_URL } from "./constants";

interface FetchPromotionsParams {
  page?: number;
  limit?: number;
  source?: string;
  subreddit?: string;
  use_llm?: boolean;
}

export async function fetchPromotions({
  page = 1,
  limit = 10,
  source = "reddit",
  subreddit,
  use_llm = false,
}: FetchPromotionsParams): Promise<PromotionResponse & { has_more: boolean }> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    source,
    use_llm: use_llm.toString(),
  });

  if (source === "reddit" && subreddit) {
    params.append("subreddit", subreddit);
  }

  const response = await fetch(`${API_BASE_URL}/promotions?${params.toString()}`);
  
  if (!response.ok) {
    throw new Error("Failed to fetch promotions");
  }

  return response.json();
}
