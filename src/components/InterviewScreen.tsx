import React, { useState, useEffect, useRef } from "react";
import { InterviewConfig, InterviewRound, FeedbackDetail } from "../types";
import { 
  Mic, 
  MicOff, 
  RotateCcw, 
  ArrowRight, 
  Loader2, 
  Volume2, 
  VolumeX, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles,
  Info
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface InterviewScreenProps {
  config: InterviewConfig;
  onFinished: (history: InterviewRound[]) => void;
  onReset: () => void;
}

export default function InterviewScreen({ config, onFinished, onReset }: InterviewScreenProps) {
  const [currentRoundIndex, setCurrentRoundIndex] = useState<number>(0);
  const [history, setHistory] = useState<InterviewRound[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<string>("");
  const [userAnswer, setUserAnswer] = useState<string>("");
  
  // Audio Playback state (TTS of questions for premium feedback feel)
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isSpeechSupported, setIsSpeechSupported] = useState<boolean>(false);

  // Speech Recognition state
  const [isListening, setIsListening] = useState<boolean>(false);
  const [recognitionError, setRecognitionError] = useState<string>("");
  const recognitionRef = useRef<any>(null);

  // Network & UI states
  const [isLoadingQuestion, setIsLoadingQuestion] = useState<boolean>(true);
  const [isSubmittingAnswer, setIsSubmittingAnswer] = useState<boolean>(false);
  const [currentFeedback, setCurrentFeedback] = useState<FeedbackDetail | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    // Check Speech Synthesis support
    if (typeof window !== "undefined" && window.speechSynthesis) {
      setIsSpeechSupported(true);
    }

    // Initialize Web Speech API Speech Recognition
    if (typeof window !== "undefined") {
      const SpeechRecognition = 
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.continuous = true;
        rec.interimResults = true;
        rec.lang = "en-US";

        rec.onstart = () => {
          setIsListening(true);
          setRecognitionError("");
        };

        rec.onerror = (event: any) => {
          console.error("Speech Recognition error:", event.error);
          if (event.error === "not-allowed") {
            setRecognitionError("Microphone access denied. Please check site permissions.");
          } else {
            setRecognitionError(`Recognition issue: ${event.error}`);
          }
          setIsListening(false);
        };

        rec.onend = () => {
          setIsListening(false);
        };

        rec.onresult = (event: any) => {
          let interimTranscript = "";
          let finalTranscript = "";

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            } else {
              interimTranscript += event.results[i][0].transcript;
            }
          }

          if (finalTranscript) {
            setUserAnswer(prev => prev + (prev.endsWith(" ") || prev === "" ? "" : " ") + finalTranscript);
          }
        };

        recognitionRef.current = rec;
      }
    }

    // Fetch the very first question
    fetchNextQuestion(0, []);

    // Cleanup speech on unmount
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const fetchNextQuestion = async (index: number, currentHistory: InterviewRound[]) => {
    setIsLoadingQuestion(true);
    setErrorMessage("");
    setCurrentFeedback(null);
    setUserAnswer("");
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }

    try {
      const response = await fetch("/api/interview/next-question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: config.role,
          type: config.type,
          difficulty: config.difficulty,
          totalQuestions: config.questionsCount,
          currentQuestionIndex: index,
          history: currentHistory.map(h => ({
            question: h.question,
            answer: h.answer,
            score: h.score
          })),
          jobDescription: config.jobDescription
        })
      });

      if (!response.ok) {
        throw new Error("Failed to load interview question. Please try again.");
      }

      const data = await response.json();
      setCurrentQuestion(data.question || data.fallback);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "Network error. Reconnecting to interview coach...");
      // Self-healing fallback question
      setCurrentQuestion("Tell me about a time you encountered a significant roadblock in a project. How did you identify it, and what concrete steps did you take to resolve it?");
    } finally {
      setIsLoadingQuestion(false);
    }
  };

  const handleSpeakQuestion = () => {
    if (!isSpeechSupported || !currentQuestion) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(currentQuestion);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Web Speech recognition is not fully supported in this browser. Please type your response.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        setRecognitionError("");
        recognitionRef.current.start();
      } catch (err) {
        console.error("Failed to start speech recognition", err);
      }
    }
  };

  const handleSubmitAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingAnswer || isLoadingQuestion) return;

    const trimmed = userAnswer.trim();
    if (!trimmed) {
      setErrorMessage("Please enter or dictate an answer before submitting.");
      return;
    }

    // Stop listening if recording
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
    }

    // Stop any speech synthesis
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }

    setIsSubmittingAnswer(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/interview/evaluate-answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: config.role,
          type: config.type,
          difficulty: config.difficulty,
          question: currentQuestion,
          answer: trimmed,
          history: history
        })
      });

      if (!response.ok) {
        throw new Error("Server was unable to evaluate your response. Attempting recovery...");
      }

      const feedback: FeedbackDetail = await response.json();
      setCurrentFeedback(feedback);

      // Append round detail to list
      const newRound: InterviewRound = {
        question: currentQuestion,
        answer: trimmed,
        score: feedback.score,
        feedback: feedback
      };
      setHistory(prev => [...prev, newRound]);

    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "Failed to process evaluation.");
      
      // Fallback feedback on complete timeout/failure to avoid locking user out
      const fallbackFeedback: FeedbackDetail = {
        score: 7,
        strengths: ["Communicated the answer clearly", "Relevant domain background highlighted"],
        improvements: ["Provide more granular metrics", "Leverage the STAR structure for higher clarity"],
        modelAnswer: "A stellar response would emphasize quantitative deliverables, active problem resolution, and key lessons."
      };
      setCurrentFeedback(fallbackFeedback);

      const newRound: InterviewRound = {
        question: currentQuestion,
        answer: trimmed,
        score: 7,
        feedback: fallbackFeedback
      };
      setHistory(prev => [...prev, newRound]);
    } finally {
      setIsSubmittingAnswer(false);
    }
  };

  const handleNextRound = () => {
    const nextIdx = currentRoundIndex + 1;
    if (nextIdx >= config.questionsCount) {
      // Completed last question, navigate to Report
      onFinished([...history]);
    } else {
      setCurrentRoundIndex(nextIdx);
      fetchNextQuestion(nextIdx, [...history]);
    }
  };

  // Score color builder
  const getScoreColorClasses = (score: number) => {
    if (score >= 8) return {
      badge: "bg-emerald-50 text-emerald-800 border-emerald-200",
      text: "text-emerald-700",
      circle: "border-emerald-500 text-emerald-600 bg-emerald-50"
    };
    if (score >= 5) return {
      badge: "bg-amber-50 text-amber-800 border-amber-200",
      text: "text-amber-700",
      circle: "border-amber-500 text-amber-600 bg-amber-50"
    };
    return {
      badge: "bg-red-50 text-red-800 border-red-200",
      text: "text-red-700",
      circle: "border-red-500 text-red-600 bg-red-50"
    };
  };

  const progressPercent = Math.min(((currentRoundIndex + 1) / config.questionsCount) * 100, 100);

  return (
    <div className="w-full max-w-4xl mx-auto px-4" id="interview-screen">
      {/* Top Session Progress Bar and Header */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xl shadow-slate-100/50 p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-600">
              Active Simulation ({config.type} focuses)
            </span>
            <h3 className="font-display text-lg font-bold text-slate-800 mt-0.5">
              Target Position: <span className="text-indigo-950 font-semibold">{config.role}</span>
            </h3>
          </div>
          <div className="text-right flex items-center gap-3 self-start sm:self-center">
            <span className="text-sm font-sans font-medium text-slate-500">
              Question <strong className="text-slate-800">{currentRoundIndex + 1}</strong> of {config.questionsCount}
            </span>
            <button
              onClick={onReset}
              className="text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-100 px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Session
            </button>
          </div>
        </div>

        {/* Progress bar container */}
        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.4 }}
            className="h-full bg-indigo-600 rounded-full"
          />
        </div>
      </div>

      <div className="space-y-6">
        {/* INTERVIEWER SECTION (Visual AI representation) */}
        <AnimatePresence mode="wait">
          {isLoadingQuestion ? (
            <motion.div 
              key="loading-question"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-white border border-slate-200/90 rounded-2xl p-8 shadow-sm flex flex-col items-center justify-center text-center space-y-4"
            >
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
              <div>
                <p className="text-sm font-semibold text-slate-800">Interviewer is formulating the next question...</p>
                <p className="text-xs text-slate-500 mt-1 max-w-md">
                  Analyzing previous score dynamics to tailor the level of challenge realistically.
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="question-box"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-slate-200/95 rounded-2xl shadow-xl shadow-slate-100/50 overflow-hidden relative"
            >
              {/* Voice narration header bar */}
              <div className="bg-slate-50 border-b border-slate-200/50 px-5 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-indigo-600 animate-pulse"></div>
                  <span className="text-xs font-semibold text-slate-600 tracking-tight">AI Lead Recruiter Speaks</span>
                </div>
                {isSpeechSupported && (
                  <button
                    onClick={handleSpeakQuestion}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-lg border flex items-center gap-1.5 transition-all outline-none ${
                      isSpeaking 
                        ? "bg-red-50 border-red-200 text-red-700 hover:bg-red-100" 
                        : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300"
                    }`}
                  >
                    {isSpeaking ? (
                      <>
                        <VolumeX className="w-3.5 h-3.5" />
                        Stop Narration
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-3.5 h-3.5" />
                        Listen verbally
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* actual structured question */}
              <div className="p-6 md:p-8">
                <p className="font-display text-lg md:text-xl font-medium text-slate-800 leading-relaxed">
                  "{currentQuestion}"
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* CANDIDATE ANSWER BOX (User Input) */}
        {!errorMessage && !currentFeedback && !isLoadingQuestion && (
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-slate-200 rounded-2xl shadow-lg shadow-slate-100/50 p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <label className="block text-sm font-semibold text-slate-800">
                Your Professional Answer *
              </label>

              {/* Dictation Support status bar */}
              {recognitionRef.current ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-sans">
                    {isListening ? "Recording voice active..." : "Voice input ready"}
                  </span>
                  <button
                    onClick={toggleListening}
                    type="button"
                    className={`p-2 rounded-xl border flex items-center justify-center transition-all cursor-pointer relative ${
                      isListening
                        ? "bg-red-500 border-red-600 text-white shadow-md shadow-red-200"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                    title={isListening ? "Stop voice dictation" : "Dictate response verbally"}
                  >
                    {isListening && (
                      <span className="absolute inset-0 rounded-xl bg-red-400 animate-pulse-ring" />
                    )}
                    {isListening ? <MicOff className="w-4 h-4 relative z-10" /> : <Mic className="w-4 h-4 relative z-10" />}
                  </button>
                </div>
              ) : (
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Info className="w-3 h-3" /> Voice helper optimized for Chrome/Edge
                </span>
              )}
            </div>

            {recognitionError && (
              <p className="text-xs text-red-600 bg-red-50 p-2 rounded-lg font-medium">
                {recognitionError}
              </p>
            )}

            <form onSubmit={handleSubmitAnswer} className="space-y-4">
              <textarea
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                placeholder="Formulate your structured response here... Remember to share context, concrete steps, and direct outcomes."
                className="w-full h-44 px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-sans text-sm resize-none"
                name="candidate-answer"
                id="cand-answer-textarea"
                disabled={isSubmittingAnswer}
              ></textarea>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={isSubmittingAnswer || !userAnswer.trim()}
                  className={`px-6 py-2.5 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                    userAnswer.trim() && !isSubmittingAnswer
                      ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-150 cursor-pointer"
                      : "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                  }`}
                  id="btn-evaluate"
                >
                  {isSubmittingAnswer ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Evaluating content...
                    </>
                  ) : (
                    <>
                      <span>Submit and Evaluate Answer</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {/* LOADING SUBMISSION STATE */}
        {isSubmittingAnswer && (
          <div className="bg-indigo-950 text-white p-8 rounded-2xl shadow-xl flex flex-col items-center justify-center text-center space-y-4">
            <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
            <div className="space-y-1 max-w-md">
              <h4 className="font-display font-bold text-base">Grading response metrics...</h4>
              <p className="text-xs text-slate-300">
                Gemini is cross-referencing industry standards, evaluating structural logic, and tailoring constructive feedback improvements.
              </p>
            </div>
          </div>
        )}

        {/* Error State Banner */}
        {errorMessage && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3 text-sm text-red-800">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <div>
              <p className="font-semibold">Unable to process current action</p>
              <p className="text-xs mt-1 text-red-600">{errorMessage}</p>
              <button
                onClick={() => {
                  setErrorMessage("");
                  if (currentFeedback) {
                    handleNextRound();
                  } else {
                    fetchNextQuestion(currentRoundIndex, history);
                  }
                }}
                className="mt-2 text-xs font-semibold text-indigo-700 bg-white border border-indigo-200 px-3 py-1 rounded-lg hover:bg-indigo-50 transition-colors cursor-pointer"
              >
                Retry Action
              </button>
            </div>
          </div>
        )}

        {/* FEEDBACK REVEAL SECTION */}
        {currentFeedback && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6"
            id="evaluation-box"
          >
            <div className="bg-white border-2 border-slate-200/90 rounded-2xl shadow-xl shadow-slate-100/50 overflow-hidden">
              {/* Header block detailing score */}
              <div className="bg-slate-50 border-b border-slate-200/60 p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-indigo-100 text-indigo-700 rounded-lg">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-display font-bold text-slate-800">Automated Answer Assessment</h4>
                    <p className="text-xs text-slate-500 font-sans">Objective criteria score compiled immediately by AI Coach</p>
                  </div>
                </div>

                {/* Score circle badge */}
                <div className="flex items-center gap-3">
                  <span className="text-sm font-sans font-medium text-slate-500">Evaluation Score:</span>
                  <div className={`text-base font-bold font-mono px-4 py-1.5 rounded-full border shadow-sm ${getScoreColorClasses(currentFeedback.score).badge}`}>
                    {currentFeedback.score} / 10
                  </div>
                </div>
              </div>

              {/* Feedbacks grids */}
              <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-6 border-b border-slate-150">
                {/* STRENGTHS */}
                <div className="space-y-3">
                  <h5 className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    Key Strengths Identifed
                  </h5>
                  <div className="space-y-2.5">
                    {currentFeedback.strengths.map((str, idx) => (
                      <div key={idx} className="bg-emerald-50/50 border border-emerald-100 p-3 rounded-xl text-xs text-slate-700 leading-normal flex items-start gap-2">
                        <span className="text-base leading-none text-emerald-600 mt-0.5">•</span>
                        <span>{str}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* AREAS OF ACTIONABLE IMPROVEMENT */}
                <div className="space-y-3">
                  <h5 className="text-xs font-mono font-bold uppercase tracking-wider text-amber-700 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Actionable Improvements
                  </h5>
                  <div className="space-y-2.5">
                    {currentFeedback.improvements.map((imp, idx) => (
                      <div key={idx} className="bg-amber-50/50 border border-amber-100 p-3 rounded-xl text-xs text-slate-700 leading-normal flex items-start gap-2">
                        <span className="text-base leading-none text-amber-600 mt-0.5">•</span>
                        <span>{imp}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* MODEL ANSWER */}
              <div className="bg-slate-50/50 p-6 md:p-8 space-y-3">
                <h5 className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-700 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  Premium Model Answer Example
                </h5>
                <p className="text-xs text-slate-600 leading-relaxed font-sans bg-white border border-slate-200/60 p-4 rounded-xl italic">
                  "{currentFeedback.modelAnswer}"
                </p>
                <p className="text-[10px] text-slate-400 font-sans mt-1">
                  💡 Tip: Incorporate keywords and structured progressions matched above when handling real interviews for highest compliance scores.
                </p>
              </div>
            </div>

            {/* NEXT ROUND ACTION BUTTON */}
            <div className="flex justify-end">
              <button
                onClick={handleNextRound}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-8 rounded-xl shadow-md shadow-indigo-150 transition-all flex items-center gap-2 cursor-pointer"
                id="btn-next-question"
              >
                <span>
                  {currentRoundIndex + 1 === config.questionsCount 
                    ? "Generate Final Coaching Report" 
                    : "Proceed to Next Question"
                  }
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
