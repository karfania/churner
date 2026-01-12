import { Wallet } from "lucide-react";
import Link from "next/link";

export function Header() {
  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
      <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="bg-blue-600 p-1.5 rounded-lg">
            <Wallet className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight">Churner</span>
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
          <a href="#" className="hover:text-gray-900 transition-colors">Checking</a>
          <a href="#" className="hover:text-gray-900 transition-colors">Savings</a>
          <a href="#" className="hover:text-gray-900 transition-colors">Credit Cards</a>
          <Link href="/saved" className="hover:text-gray-900 transition-colors">Saved</Link>
        </nav>
        <div className="flex items-center gap-3">
          <button className="bg-gray-900 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-gray-800 transition-colors">
            Subscribe
          </button>
        </div>
      </div>
    </header>
  );
}
