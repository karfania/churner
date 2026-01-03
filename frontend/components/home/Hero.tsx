import { Sparkles } from "lucide-react";

export function Hero() {
  return (
    <div className="mb-16 text-center max-w-2xl mx-auto">
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold mb-6 border border-blue-100">
        <Sparkles className="w-3 h-3" />
        <span>New deals added daily</span>
      </div>
      <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6 text-gray-900">
        Maximize your money with the best bank bonuses.
      </h1>
      <p className="text-lg text-gray-600 mb-8 leading-relaxed">
        We aggregate and score the best bank account promotions so you can easily find the highest returns for your deposits.
      </p>
    </div>
  );
}
