import { useState, useEffect } from "react";
import { InterviewConfig, InterviewRound, CoachingReport } from "../types";
import { 
  Trophy, 
  FileDown, 
  RotateCcw, 
  Loader2, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  FileText
} from "lucide-react";
import { motion } from "motion/react";

interface ReportScreenProps {
  config: InterviewConfig;
  history: InterviewRound[];
  onReset: () => void;
}

export default function ReportScreen({ config, history, onReset }: ReportScreenProps) {
  const [loadingReport, setLoadingReport] = useState<boolean>(true);
  const [report, setReport] = useState<CoachingReport | null>(null);
  const [errorReport, setErrorReport] = useState<string>("");

  // Calculate quantitative results
  const totalScore = history.reduce((sum, item) => sum + item.score, 0);
  const averageScore = history.length > 0 ? Number((totalScore / history.length).toFixed(1)) : 0;

  useEffect(() => {
    generateCoachPlan();
  }, [history]);

  const generateCoachPlan = async () => {
    setLoadingReport(true);
    setErrorReport("");
    try {
      const response = await fetch("/api/interview/generate-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: config.role,
          type: config.type,
          difficulty: config.difficulty,
          history: history
        })
      });

      if (!response.ok) {
        throw new Error("Unable to synthesize overall progress report.");
      }

      const reportData: CoachingReport = await response.json();
      setReport(reportData);
    } catch (err: any) {
      console.error(err);
      setErrorReport(err.message || "Failed to parse synthesized AI response.");
      // Fallback structured data
      setReport({
        summaryStrengths: [
          "Demonstrated genuine confidence answering situational prompts",
          "Balanced structure and clear vocabulary mapped across domains"
        ],
        summaryImprovements: [
          "Needs consistent application of the STAR method to quantify contributions",
          "Include technical trade-offs or alternative options evaluated in decisions"
        ],
        improvementPlan: [
          "Dedicate 15 minutes detailing situation backgrounds for your key resume items.",
          "Identify and isolate at least 3 concrete numeric parameters (revenue, scale, speed, savings) for each achievement.",
          "Practice delivering structured, active answers focusing on action choices first."
        ]
      });
    } finally {
      setLoadingReport(false);
    }
  };

  const downloadTextReport = () => {
    if (!report) return;

    let text = `========================================================
               AI INTERVIEW COACH REPORT
========================================================
Generated Date : ${new Date().toLocaleDateString()}
Target Role    : ${config.role}
Session Type   : ${config.type}
Base Level     : ${config.difficulty}
Rounds asked   : ${history.length} Questions

--------------------------------------------------------
OVERALL EVALUATION SCORE: ${averageScore} / 10
--------------------------------------------------------

TRANSCRIPT & EVALUATION DETAIL:
\n`;

    history.forEach((item, index) => {
      text += `[ROUND ${index + 1}]
Question : ${item.question}
Answer   : ${item.answer}
Score              : ${item.score}/10
Key Strengths     :
${item.feedback?.strengths.map(s => `  - ${s}`).join("\n") || ""}
Key Improvements  :
${item.feedback?.improvements.map(i => `  - ${i}`).join("\n") || ""}
Optimal Example Model Answer :
  "${item.feedback?.modelAnswer || ""}"

--------------------------------------------------------\n`;
    });

    text += `\nOVERALL SYNTHESIZED REPORT COGNITIVE ANALYSIS:
\n[TOP INTERVIEW STRENGTHS]
${report.summaryStrengths.map(s => `• ${s}`).join("\n")}

[TOP AREAS OF GROWTH]
${report.summaryImprovements.map(i => `• ${i}`).join("\n")}

[PERSONALIZED 3-STEP IMPROVEMENT PLAN]
${report.improvementPlan.map((p, idx) => `${idx + 1}. ${p}`).join("\n")}

========================================================
            Thank you for practicing with AI.
========================================================`;

    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `AI_Interview_Coach_Report_${config.role.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getScoreColorRange = (score: number) => {
    if (score >= 8) return {
      text: "text-emerald-600",
      bg: "bg-emerald-50",
      border: "border-emerald-200",
      accent: "from-emerald-500 to-teal-500",
      description: "Exceptional candidate performance ready for live loops!"
    };
    if (score >= 5) return {
      text: "text-amber-600",
      bg: "bg-amber-50",
      border: "border-amber-200",
      accent: "from-amber-500 to-orange-500",
      description: "Solid foundation. Some additional preparation loops advised."
    };
    return {
      text: "text-red-600",
      bg: "bg-red-50",
      border: "border-red-200",
      accent: "from-red-500 to-rose-500",
      description: "Requires deliberate structured study and STAR revisions."
    };
  };

  const statusStyle = getScoreColorRange(averageScore);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full max-w-4xl mx-auto px-4"
      id="report-screen"
    >
      <div className="space-y-6">
        {/* OVERALL SUMMARY HEADER HERO CARD */}
        <div className="bg-slate-900 text-white rounded-2xl p-6 md:p-8 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <Trophy className="w-48 h-48" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center relative z-10">
            {/* Score circle */}
            <div className="flex flex-col items-center justify-center text-center p-4 bg-white/5 rounded-xl border border-white/10 md:col-span-1">
              <span className="text-xs font-mono tracking-wider text-slate-300 uppercase">Overall Index</span>
              <div className="relative mt-3 mb-2 flex items-center justify-center">
                <div className="w-24 h-24 rounded-full border-4 border-indigo-500/30 flex flex-col items-center justify-center bg-indigo-950">
                  <span className="text-3xl font-mono font-bold">{averageScore}</span>
                  <span className="text-[10px] text-slate-400">score / 10</span>
                </div>
              </div>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
                {averageScore >= 8 ? "Advanced" : averageScore >= 5 ? "Intermediate" : "Revision Needed"}
              </span>
            </div>

            {/* Title & Key details */}
            <div className="space-y-3 md:col-span-2">
              <h3 className="font-display text-2xl font-bold tracking-tight">Mock Session Coaching Dossier</h3>
              <p className="text-slate-300 text-sm leading-relaxed">
                Excellent progression. We've mapped your verbal answers and textual inputs to state-of-the-art STAR parameters. Your aggregated score is <strong className="text-white">{averageScore}/10</strong>.
              </p>
              
              <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-400 font-mono">
                <div>Role: <span className="text-indigo-300 font-medium">{config.role}</span></div>
                <div className="hidden sm:block text-slate-600">|</div>
                <div>Focus: <span className="text-indigo-300 font-medium">{config.type}</span></div>
                <div className="hidden sm:block text-slate-600">|</div>
                <div>Difficulty: <span className="text-indigo-300 font-medium">{config.difficulty}</span></div>
              </div>

              {/* Action buttons on hero */}
              <div className="pt-3 flex flex-wrap gap-3">
                <button
                  onClick={downloadTextReport}
                  disabled={loadingReport}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold px-4 py-2.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <FileDown className="w-4 h-4" />
                  Download Complete Report
                </button>
                <button
                  onClick={onReset}
                  className="bg-white/10 hover:bg-white/15 border border-white/10 text-white text-xs font-semibold px-4 py-2.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  Start New Interview
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* DETAILED PER-QUESTION INSIGHTS BLOCK */}
        <div className="bg-white border border-slate-200/90 rounded-2xl shadow-md p-6">
          <h4 className="font-display font-bold text-slate-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-600" />
            Performance Breakdown Matrix
          </h4>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left font-sans text-sm border-collapse" id="matrix-table">
              <thead>
                <tr className="border-b border-slate-100 text-xs font-mono uppercase tracking-wider text-slate-500 bg-slate-50">
                  <th className="py-3 px-4 rounded-l-lg">Round</th>
                  <th className="py-3 px-4">Interviewer Question asked</th>
                  <th className="py-3 px-4 text-center rounded-r-lg">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {history.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-indigo-600">R-{idx + 1}</td>
                    <td className="py-3.5 px-4 max-w-md">
                      <p className="font-medium text-slate-800 line-clamp-2" title={item.question}>
                        "{item.question}"
                      </p>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-full border ${getScoreColorRange(item.score).bg} ${getScoreColorRange(item.score).text} ${getScoreColorRange(item.score).border}`}>
                        {item.score} / 10
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* AI SYNTHESIZED ACTION PLAN */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Synthesized overview details */}
          <div className="bg-white border border-slate-200/90 rounded-2xl shadow-md p-6 md:col-span-2 space-y-6">
            <h4 className="font-display font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              Strategic Feedback Synthesis
            </h4>

            {loadingReport ? (
              <div className="p-8 flex flex-col items-center justify-center text-center space-y-3">
                <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
                <p className="text-xs text-slate-500 font-sans">AI Lead is building chronological development maps...</p>
              </div>
            ) : report ? (
              <div className="space-y-5">
                {/* Strengths */}
                <div className="space-y-2.5">
                  <h5 className="text-xs font-mono font-semibold text-emerald-800 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Dominant Areas of Success
                  </h5>
                  <div className="space-y-2">
                    {report.summaryStrengths.map((str, i) => (
                      <div key={i} className="text-xs text-slate-600 bg-emerald-50/30 border border-emerald-100 p-3 rounded-xl leading-relaxed flex items-start gap-2">
                        <span className="text-emerald-500 text-lg leading-none select-none">•</span>
                        <span>{str}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Improvements */}
                <div className="space-y-2.5">
                  <h5 className="text-xs font-mono font-semibold text-amber-800 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                    Target areas for growth
                  </h5>
                  <div className="space-y-2">
                    {report.summaryImprovements.map((imp, i) => (
                      <div key={i} className="text-xs text-slate-600 bg-amber-50/30 border border-amber-100 p-3 rounded-xl leading-relaxed flex items-start gap-2">
                        <span className="text-amber-500 text-lg leading-none select-none">•</span>
                        <span>{imp}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500">Could not parse structured reports.</p>
            )}
          </div>

          {/* 3-Step chronological plan */}
          <div className="bg-indigo-950 text-white rounded-2xl p-6 shadow-md md:col-span-1 space-y-5">
            <div>
              <h4 className="font-display font-medium text-indigo-300 text-xs font-mono tracking-wider uppercase">Prep Strategy</h4>
              <p className="font-display text-base font-bold mt-1 text-white">Your 3-Step Journey</p>
            </div>

            {loadingReport ? (
              <div className="py-12 flex flex-col items-center justify-center text-center space-y-2">
                <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
                <span className="text-xs text-indigo-200">Structuring steps...</span>
              </div>
            ) : report ? (
              <div className="space-y-4">
                {report.improvementPlan.map((step, idx) => (
                  <div key={idx} className="flex gap-3 items-start">
                    <div className="bg-indigo-800 text-indigo-300 font-bold font-mono text-center rounded-lg h-6 w-6 shrink-0 flex items-center justify-center text-xs">
                      0{idx + 1}
                    </div>
                    <div>
                      <p className="text-xs text-slate-200 leading-relaxed font-sans">
                        {step}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-300">Action plan placeholder</p>
            )}

            <div className="pt-2 border-t border-indigo-900 flex justify-center">
              <span className="text-[10px] text-indigo-300 font-mono flex items-center gap-1.5 justify-center">
                <FileText className="w-3 h-3 text-amber-400" /> Fully aligned STAR format
              </span>
            </div>
          </div>
        </div>

        {/* BOTTOM RESET FORWARD TO START */}
        <div className="bg-white border border-slate-200/90 rounded-2xl shadow-sm p-6 text-center space-y-3">
          <p className="text-sm font-semibold text-slate-800">Ready to boost your metrics further?</p>
          <p className="text-xs text-slate-500 max-w-xl mx-auto font-sans leading-relaxed">
            The secret to perfect outcomes is repetition. You can launch a brand new simulation on alternative focus streams (Technical or Behavioral only) or different difficulty ranges.
          </p>
          <div className="pt-2">
            <button
              onClick={onReset}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-6 rounded-xl transition-all inline-flex items-center gap-1.5 cursor-pointer text-sm"
            >
              Reset Session Configuration
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
