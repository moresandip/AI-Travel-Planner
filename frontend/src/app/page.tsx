import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-indigo-500 selection:text-white">
      {/* Background Gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-900/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-900/20 rounded-full blur-[120px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 max-w-7xl mx-auto w-full px-6 py-6 flex justify-between items-center border-b border-slate-900">
        <div className="flex items-center gap-2">
          <span className="text-2xl">✈️</span>
          <span className="text-xl font-bold tracking-tight text-blue-400">
            AI Travel Planner
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-sm font-semibold hover:text-white text-slate-300 transition"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition shadow-lg shadow-indigo-600/20"
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 flex-1 max-w-7xl mx-auto w-full px-6 flex flex-col justify-center py-20 lg:py-32">
        <div className="max-w-3xl space-y-8">
          <div className="inline-flex items-center gap-2 bg-slate-900/80 border border-slate-800 rounded-full px-4 py-1.5 text-xs text-indigo-400 font-semibold backdrop-blur-md">
            <span>✨</span> Powered by Gemini 2.5 Flash
          </div>
          <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight leading-none text-white">
            Your Next Adventure,<br />
            <span className="text-indigo-400">
              Crafted by AI
            </span>
          </h1>
          <p className="text-lg lg:text-xl text-slate-400 leading-relaxed max-w-2xl">
            Generate custom day-by-day itineraries, estimate realistic budgets, discover optimized hotel suggestions, and pack perfectly with our climate-aware checklist helper.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/register"
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold px-8 py-4 rounded-xl text-center transition shadow-xl shadow-indigo-600/30"
            >
              Start Planning Now
            </Link>
            <Link
              href="/login"
              className="bg-slate-900/80 border border-slate-850 hover:bg-slate-800 text-slate-200 font-semibold px-8 py-4 rounded-xl text-center transition backdrop-blur-md"
            >
              Access Dashboard
            </Link>
          </div>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-24">
          <div className="bg-slate-900/40 border border-slate-850 p-8 rounded-2xl backdrop-blur-md hover:border-slate-700 transition">
            <div className="text-3xl mb-4">🗓️</div>
            <h3 className="text-lg font-bold text-white mb-2">Dynamic Day-by-Day</h3>
            <p className="text-sm text-slate-400">
              Get detailed timelines mapped precisely to your personal interests, from food exploration to extreme adventure.
            </p>
          </div>
          <div className="bg-slate-900/40 border border-slate-850 p-8 rounded-2xl backdrop-blur-md hover:border-slate-700 transition">
            <div className="text-3xl mb-4">💳</div>
            <h3 className="text-lg font-bold text-white mb-2">Budget Allocation</h3>
            <p className="text-sm text-slate-400">
              Receive smart cost estimates covering transport, hotels, food, and activities, dynamically balanced for your budget tier.
            </p>
          </div>
          <div className="bg-slate-900/40 border border-slate-850 p-8 rounded-2xl backdrop-blur-md hover:border-slate-700 transition">
            <div className="text-3xl mb-4">⛈️</div>
            <h3 className="text-lg font-bold text-white mb-2">Weather-Aware Packing</h3>
            <p className="text-sm text-slate-400">
              Our custom packing assistant generates checklists tailored to destination climates and custom itinerary activities.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-900 py-8 text-center text-xs text-slate-600">
        <p>© 2026 AI Travel Planner. Built for production excellence and user data enclave security.</p>
      </footer>
    </div>
  );
}
