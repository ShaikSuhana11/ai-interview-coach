import { useState } from "react";
import { AppScreen, InterviewConfig, InterviewRound } from "./types";
import LandingHeader from "./components/LandingHeader";
import ThemeFooter from "./components/ThemeFooter";
import SetupScreen from "./components/SetupScreen";
import InterviewScreen from "./components/InterviewScreen";
import ReportScreen from "./components/ReportScreen";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  const [screen, setScreen] = useState<AppScreen>("setup");
  const [config, setConfig] = useState<InterviewConfig | null>(null);
  const [history, setHistory] = useState<InterviewRound[]>([]);

  const handleStartInterview = (selectedConfig: InterviewConfig) => {
    setConfig(selectedConfig);
    setHistory([]);
    setScreen("interview");
  };

  const handleFinishedInterview = (completedHistory: InterviewRound[]) => {
    setHistory(completedHistory);
    setScreen("report");
  };

  const handleReset = () => {
    setConfig(null);
    setHistory([]);
    setScreen("setup");
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col justify-between" id="app-container">
      {/* Visual background gradient mesh subtle accents */}
      <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* Primary header branding */}
      <div className="relative z-10 w-full">
        <LandingHeader />

        <main className="w-full pb-12">
          <AnimatePresence mode="wait">
            {screen === "setup" && (
              <motion.div
                key="setup-screen-wrapper"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
              >
                <SetupScreen onStart={handleStartInterview} />
              </motion.div>
            )}

            {screen === "interview" && config && (
              <motion.div
                key="interview-screen-wrapper"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
              >
                <InterviewScreen 
                  config={config} 
                  onFinished={handleFinishedInterview} 
                  onReset={handleReset} 
                />
              </motion.div>
            )}

            {screen === "report" && config && (
              <motion.div
                key="report-screen-wrapper"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
              >
                <ReportScreen 
                  config={config} 
                  history={history} 
                  onReset={handleReset} 
                />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Styled platform footer branding */}
      <ThemeFooter />
    </div>
  );
}
