import { Promotion } from "@/types";

const STORAGE_KEY = "churner_bookmarks";

let bookmarks: Promotion[] = [];
const subscribers: Array<() => void> = [];

function loadFromStorage() {
  try {
    const raw = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    bookmarks = raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Failed to load bookmarks", e);
    bookmarks = [];
  }
}

function saveToStorage() {
  try {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks));
    }
  } catch (e) {
    console.error("Failed to save bookmarks", e);
  }
}

export function getBookmarks(): Promotion[] {
  if (typeof window !== "undefined" && bookmarks.length === 0) {
    loadFromStorage();
  }
  return bookmarks.slice();
}

export function subscribe(fn: () => void) {
  subscribers.push(fn);
  return () => {
    const idx = subscribers.indexOf(fn);
    if (idx >= 0) subscribers.splice(idx, 1);
  };
}

function notify() {
  subscribers.forEach((s) => {
    try { s(); } catch (e) { /* ignore */ }
  });
}

export function addBookmark(promo: Promotion) {
  if (bookmarks.some((p) => p.id === promo.id)) return;
  bookmarks = [promo, ...bookmarks];
  saveToStorage();
  notify();
}

export function removeBookmark(id: string) {
  bookmarks = bookmarks.filter((p) => p.id !== id);
  saveToStorage();
  notify();
}

export function clearBookmarks() {
  bookmarks = [];
  saveToStorage();
  notify();
}

export function isBookmarked(id: string) {
  return bookmarks.some((p) => p.id === id);
}

export function toggleBookmark(promo: Promotion) {
  if (isBookmarked(promo.id)) removeBookmark(promo.id);
  else addBookmark(promo);
}
