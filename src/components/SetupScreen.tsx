import React, { useState } from "react";
import { InterviewConfig } from "../types";
import { 
  Briefcase, 
  Settings, 
  FileText, 
  ArrowRight, 
  HelpCircle, 
  Sliders, 
  ListOrdered,
  Gauge
} from "lucide-react";
import { motion } from "motion/react";

interface SetupScreenProps {
  onStart: (config: InterviewConfig) => void;
}

const COMMON_ROLES = [
  "Frontend Engineer",
  "Full Stack Developer",
  "Product Manager",
  "Data Scientist",
  "UX/UI Designer",
  "Sales Representative",
  "HR Generalist"
];

export default function SetupScreen({ onStart }: SetupScreenProps) {
  const [role, setRole] = useState("");
  const [type, setType] = useState<'Behavioral' | 'Technical' | 'Mixed'>("Mixed");
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>("Medium");
  const [questionsCount, setQuestionsCount] = useState<number>(5);
  const [jobDescription, setJobDescription] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!role.trim()) return;
    onStart({
      role: role.trim(),
      type,
      difficulty,
      questionsCount,
      jobDescription: jobDescription.trim()
    });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-4xl mx-auto px-4"
      id="setup-screen"
    >
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xl shadow-slate-100/50 overflow-hidden">
        {/* Banner header inside setup card */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 px-6 py-6 text-white">
          <div className="flex items-center gap-2.5">
            <Sliders className="w-5 h-5 text-indigo-400" />
            <h2 className="font-display text-xl font-bold tracking-tight">Configure Your Interview Session</h2>
          </div>
          <p className="text-slate-300 text-sm mt-1">
            Build your high-fidelity, customized simulation. AI acts as an experienced lead for your target sector.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
          {/* Target Job Role Section */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-800 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-indigo-600" />
              Target Job Role *
              <span className="text-xs font-normal text-slate-400 font-sans">(What position is this for?)</span>
            </label>
            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g. Senior Frontend Developer, Data Analyst..."
              name="target-role"
              id="target-role-input"
              className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-sans"
              required
            />
            {/* Quick Suggestions Tag list */}
            <div className="flex flex-wrap gap-2 pt-1">
              <span className="text-xs text-slate-500 flex items-center mr-1">Suggestions:</span>
              {COMMON_ROLES.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                    role === r 
                      ? "bg-indigo-50 border-indigo-300 text-indigo-700 font-medium" 
                      : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:border-slate-300"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Interview Type Selection */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-800 flex items-center gap-2">
                <Settings className="w-4 h-4 text-indigo-600" />
                Interview Focus
              </label>
              <div className="flex flex-col gap-2">
                {(['Mixed', 'Behavioral', 'Technical'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={`w-full text-left px-4 py-2.5 rounded-xl border text-sm transition-all flex items-center justify-between ${
                      type === t
                        ? "bg-indigo-50/80 border-indigo-500 text-indigo-900 font-semibold shadow-sm"
                        : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300"
                    }`}
                  >
                    <span>{t}</span>
                    <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded font-mono">
                      {t === 'Mixed' ? 'Recommended' : t === 'Technical' ? 'Code/Systems' : 'STAR Method'}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Difficulty Level Selection */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-800 flex items-center gap-2">
                <Gauge className="w-4 h-4 text-indigo-600" />
                Target Difficulty
              </label>
              <div className="flex flex-col gap-2">
                {(['Easy', 'Medium', 'Hard'] as const).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDifficulty(d)}
                    className={`w-full text-left px-4 py-2.5 rounded-xl border text-sm transition-all flex items-center justify-between ${
                      difficulty === d
                        ? "bg-indigo-50/80 border-indigo-500 text-indigo-900 font-semibold shadow-sm"
                        : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300"
                    }`}
                  >
                    <span>{d}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                      d === 'Hard' ? 'text-red-600 bg-red-50' : d === 'Medium' ? 'text-amber-600 bg-amber-50' : 'text-emerald-600 bg-emerald-50'
                    }`}>
                      {d === 'Hard' ? 'Pressure' : d === 'Medium' ? 'Standard' : 'Warm-up'}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Number of Questions Selection */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-800 flex items-center gap-2">
                <ListOrdered className="w-4 h-4 text-indigo-600" />
                Total Questions
              </label>
              <div className="flex flex-col gap-2">
                {([3, 5, 7] as const).map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setQuestionsCount(q)}
                    className={`w-full text-left px-4 py-2.5 rounded-xl border text-sm transition-all flex items-center justify-between ${
                      questionsCount === q
                        ? "bg-indigo-50/80 border-indigo-500 text-indigo-900 font-semibold shadow-sm"
                        : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300"
                    }`}
                  >
                    <span>{q} Questions</span>
                    <span className="text-[10px] font-mono text-slate-500">
                      {q === 3 ? '~10 mins' : q === 5 ? '~20 mins' : '~30 mins'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Job Description (Optional) */}
          <div className="space-y-2 pt-2">
            <label className="block text-sm font-semibold text-slate-800 flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-600" />
              Target Job Description or Key Requirements
              <span className="text-xs font-normal text-slate-400 font-sans">(Optional)</span>
            </label>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste a summary, duties, or requirements of the job to let the AI formulate hyper-customized questions..."
              className="w-full h-28 px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-sans text-sm resize-none"
              name="job-description"
              id="job-desc-textarea"
            />
          </div>

          {/* Guidelines / Tips Card */}
          <div className="bg-slate-50 border border-slate-200/50 rounded-xl p-4 flex gap-3 text-xs text-slate-600">
            <HelpCircle className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-slate-800">Quick Tips for a Great Simulation:</p>
              <p>• Speak or type naturally. If using your voice, speak clearly near your microphone.</p>
              <p>• For Behavioral questions, answer with situations you have solved using the STAR method (Situation, Task, Action, Result).</p>
            </div>
          </div>

          {/* Action button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={!role.trim()}
              className={`w-full py-3.5 px-6 rounded-xl font-medium tracking-tight flex items-center justify-center gap-2 transition-all ${
                role.trim()
                  ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-200 cursor-pointer text-base"
                  : "bg-slate-150 text-slate-400 border border-slate-200 cursor-not-allowed text-sm"
              }`}
              id="btn-start-simulation"
            >
              <span>Begin AI Interview Mock Session</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}
