import { useState, useEffect } from "react";
import { Promotion } from "@/types";
import * as store from "@/hooks/bookmarksStore";

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<Promotion[]>(() => store.getBookmarks());

  useEffect(() => {
    const unsub = store.subscribe(() => {
      setBookmarks(store.getBookmarks());
    });

    // ensure initial load
    setBookmarks(store.getBookmarks());

    return () => unsub();
  }, []);

  const isBookmarked = (id: string) => store.isBookmarked(id);
  const addBookmark = (p: Promotion) => store.addBookmark(p);
  const removeBookmark = (id: string) => store.removeBookmark(id);
  const toggleBookmark = (p: Promotion) => store.toggleBookmark(p);
  const clearBookmarks = () => store.clearBookmarks();

  return { bookmarks, isBookmarked, addBookmark, removeBookmark, toggleBookmark, clearBookmarks };
}
