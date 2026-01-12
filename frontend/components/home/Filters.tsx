import { SOURCES, SUBREDDITS, FILTERS } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface FiltersProps {
  source: string;
  onSourceChange: (source: string) => void;
  subreddit: string;
  onSubredditChange: (subreddit: string) => void;
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  useLlm: boolean;
  onToggleLlm: () => void;
  onFindDeals?: () => void;
}

export function Filters({
  source,
  onSourceChange,
  subreddit,
  onSubredditChange,
  activeFilter,
  onFilterChange,
  useLlm,
  onToggleLlm,
  onFindDeals,
}: FiltersProps) {
  return (
    <div className="space-y-8 mb-12">
      {/* Source Selection Controls */}
      <div className="flex flex-col md:flex-row items-center justify-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100 max-w-2xl mx-auto min-w-0">
        <div className="flex items-center gap-2 w-full md:w-auto min-w-0">
          <label className="text-sm font-medium text-gray-500 truncate">Source:</label>
          <div className="relative w-full md:w-48 min-w-0">
            <select
              value={source}
              onChange={(e) => onSourceChange(e.target.value)}
              className="block w-full appearance-none bg-gray-100 border border-gray-200 text-sm font-medium text-gray-900 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 truncate"
            >
              {SOURCES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 text-gray-500">
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 011.08 1.04l-4.25 4.25a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>

        {source === "reddit" && (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-500">Subreddit:</span>
            <select
              value={subreddit}
              onChange={(e) => onSubredditChange(e.target.value)}
              className="bg-gray-100 border-none text-sm font-medium text-gray-900 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500"
            >
              {SUBREDDITS.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.label}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex items-center gap-2 border-l pl-4 ml-2">
          <span className="text-sm font-medium text-gray-500">Use LLM:</span>
          <button
            onClick={onToggleLlm}
            className={cn(
              "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
              useLlm ? "bg-blue-600" : "bg-gray-200"
            )}
          >
            <span
              className={cn(
                "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                useLlm ? "translate-x-6" : "translate-x-1"
              )}
            />
          </button>
        </div>

        <div className="ml-2">
          <button
            onClick={() => onFindDeals && onFindDeals()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium shadow-sm hover:bg-blue-700"
          >
            Find deals
          </button>
        </div>
      </div>

      {/* Category Filters */}
      <div className="flex flex-wrap justify-center gap-2">
        {FILTERS.map((filter) => (
          <button
            key={filter}
            onClick={() => onFilterChange(filter)}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium transition-all border",
              activeFilter === filter
                ? "bg-gray-900 text-white border-gray-900"
                : "bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
            )}
          >
            {filter}
          </button>
        ))}
      </div>
    </div>
  );
}
