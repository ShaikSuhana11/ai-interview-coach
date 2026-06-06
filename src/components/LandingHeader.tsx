import { Brain, Sparkles } from "lucide-react";

export default function LandingHeader() {
  return (
    <header className="w-full max-w-5xl mx-auto mb-8 px-4" id="app-header">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-slate-200/80 pb-5 pt-4">
        {/* Logo and Branding title */}
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white p-2.5 rounded-xl shadow-md shadow-indigo-100 flex items-center justify-center">
            <Brain className="w-6 h-6 animate-pulse-gentle" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              AI Interview Coach
              <span className="text-[10px] font-mono tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full font-semibold">
                PRO v1.2
              </span>
            </h1>
            <p className="text-sm text-slate-500 font-sans mt-0.5">
              Refine your answers, master the STAR framework, and build career-defining confidence.
            </p>
          </div>
        </div>

        {/* Status widget/badge */}
        <div className="mt-4 md:mt-0 flex items-center gap-2.5 bg-slate-50 border border-slate-200/60 rounded-full px-3.5 py-1.5 text-xs text-slate-600 font-mono">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span>Interviewer Online</span>
          <span className="text-slate-300">|</span>
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Gemini-3.5 Powered</span>
        </div>
      </div>
    </header>
  );
}
