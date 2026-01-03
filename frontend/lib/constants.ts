export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export const SOURCES = [
  { id: "reddit", label: "Reddit" },
  { id: "doc", label: "Doctor of Credit" },
  { id: "nerdwallet", label: "NerdWallet" },
  { id: "bankrate", label: "Bankrate" },
  { id: "wallethub", label: "WalletHub" },
  { id: "google", label: "Google" },
];

export const SUBREDDITS = [
  { id: "bankbonuses", label: "r/bankbonuses" },
  { id: "churning", label: "r/churning" },
];

export const FILTERS = ["All Deals", "Checking", "Savings", "No Fees", "High Bonus"];
