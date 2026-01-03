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
}: FiltersProps) {
  return (
    <div className="space-y-8 mb-12">
      {/* Source Selection Controls */}
      <div className="flex flex-col md:flex-row items-center justify-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100 max-w-2xl mx-auto">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-500">Source:</span>
          <div className="flex bg-gray-100 p-1 rounded-lg">
            {SOURCES.map((s) => (
              <button
                key={s.id}
                onClick={() => onSourceChange(s.id)}
                className={cn(
                  "px-3 py-1.5 text-sm font-medium rounded-md transition-all",
                  source === s.id
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                )}
              >
                {s.label}
              </button>
            ))}
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
