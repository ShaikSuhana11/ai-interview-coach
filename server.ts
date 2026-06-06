import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Body parser
  app.use(express.json());

  // Lazy initialize GoogleGenAI client to avoid crashing when key is missing on startup
  let aiClient: GoogleGenAI | null = null;
  function getAi(): GoogleGenAI {
    if (!aiClient) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY environment variable is required. Please add it via the Secrets panel.");
      }
      aiClient = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
    }
    return aiClient;
  }

  // --- API ROUTE 1: NEXT QUESTION ---
  app.post("/api/interview/next-question", async (req, res) => {
    try {
      const {
        role,
        type,
        difficulty,
        totalQuestions,
        currentQuestionIndex,
        history = [],
        jobDescription = ""
      } = req.body;

      if (!role) {
        return res.status(400).json({ error: "Target job role is required." });
      }

      const ai = getAi();

      // Build context of previous conversation
      let historyText = "";
      if (history.length > 0) {
        historyText = history.map((h: any, idx: number) => {
          return `Round ${idx + 1}:
- Interviewer Question: "${h.question}"
- Candidate Answer: "${h.answer || "[No answer provided]"}"
- Answer Score: ${h.score}/10`;
        }).join("\n\n");
      } else {
        historyText = "No previous questions have been asked yet. This is the very first question.";
      }

      const prompt = `You are a professional hiring manager and expert technical/behavioral interviewer.
You are conducting a job interview with a candidate.

INTERVIEW CONFIGURATION:
- Target Job Role: ${role}
- Selected Interview Type: ${type} (Behavioral, Technical, or Mixed)
- Base Difficulty Level: ${difficulty}
- Target Total Rounds: ${totalQuestions}
- Current Round index: ${currentQuestionIndex + 1} of ${totalQuestions}
${jobDescription ? `- Contextual Job Description details:\n"""\n${jobDescription}\n"""` : ""}

CURRENT INTERVIEW PROGRESS & CONVERSATION HISTORY:
${historyText}

INSTRUCTIONS:
1. Generate the next highly specific, realistic, and tailored mock interview question.
2. It MUST fit the requested job role ("${role}"), selected interview type ("${type}"), and difficulty details.
3. It MUST be natural, engaging, and build upon the conversation if possible. Avoid boring, boilerplate questions.
4. Adapt the difficulty dynamically: if the candidate's last answer scored 8 or higher, you can make the next question slightly more challenging or ask an advanced follow-up. If they scored 4 or less, make the next question slightly more supportive or fundamental.
5. NEVER repeat any of the questions asked in previous rounds. Keep the conversation flowing logically.
`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              question: {
                type: Type.STRING,
                description: "The next tailorable mock interview question to ask the candidate."
              }
            },
            required: ["question"]
          }
        }
      });

      const text = response.text;
      if (!text) {
        throw new Error("No response text received from Gemini API");
      }

      const result = JSON.parse(text.trim());
      res.json(result);
    } catch (error: any) {
      console.error("Error in next-question endpoint:", error);
      res.status(500).json({
        error: error.message || "Failed to generate interview question.",
        fallback: "Can you tell me about a challenging situation you faced in your professional career, how you resolved it, and what you learned?"
      });
    }
  });

  // --- API ROUTE 2: EVALUATE ANSWER ---
  app.post("/api/interview/evaluate-answer", async (req, res) => {
    try {
      const {
        role,
        type,
        difficulty,
        question,
        answer,
        history = []
      } = req.body;

      if (!question) {
        return res.status(400).json({ error: "Interviewer question is required to evaluate." });
      }

      const ai = getAi();

      // Trim and inspect empty answers
      const cleanedAnswer = (answer || "").trim();
      if (!cleanedAnswer) {
        return res.json({
          score: 0,
          strengths: ["None (No answer was provided by the candidate)"],
          improvements: ["Please provide a written or spoken reply to receive useful feedback."],
          modelAnswer: "A great answer would elaborate on your experience, methodology, or situational approach and directly solve the requested interviewer challenge."
        });
      }

      const prompt = `You are a professional recruiter and skilled performance coach.
Review the candidate's response to the interview question below, in the context of the requested target role, and evaluate it rigorously but constructively.

ROLE & INTERVIEW KEY DETAILS:
- Target Job Role: ${role}
- Selected Difficulty: ${difficulty}
- Interview Type: ${type}

EVALUATION CHALLENGE:
- Interviewer Question: "${question}"
- Candidate Answer: "${cleanedAnswer}"

INSTRUCTIONS:
1. Grade the answer honestly but constructively. Score it strictly from 0 to 10 (where 0 means non-responsive or blank, and 10 means a perfect industry-expert model answer).
2. Detail exactly two (2) specific and clear structural strengths of the answer. Highlight what the candidate did well (e.g. structure, use of STAR method, technologies mentioned, or core soft skills).
3. Detail exactly two (2) specific, actionable growth opportunities or areas to improve. Make them constructive, pointing exactly to what was missed (e.g. lack of metric results, missing error-handling, too brief).
4. Provide a customized, concise, and highly polished "stronger answer" model example showing how a top-tier candidate should answer this question under identical criteria. Reference what the user said but elevate the terminology, metrics, and structure. Keep it to 3-4 sentences max.
`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              score: {
                type: Type.INTEGER,
                description: "The evaluation score out of 10 representing candidate performance."
              },
              strengths: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Exactly two bullet-pointed strengths identified in the answer."
              },
              improvements: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Exactly two actionable steps/areas for improvement."
              },
              modelAnswer: {
                type: Type.STRING,
                description: "An improved, highly professional model answer example tailored to the exact question."
              }
            },
            required: ["score", "strengths", "improvements", "modelAnswer"]
          }
        }
      });

      const text = response.text;
      if (!text) {
        throw new Error("No response received from evaluator.");
      }

      const result = JSON.parse(text.trim());
      res.json(result);
    } catch (error: any) {
      console.error("Error in evaluate-answer endpoint:", error);
      res.status(500).json({
        error: error.message || "Failed to evaluate answer.",
        fallback: {
          score: 7,
          strengths: ["Demonstrated genuine willingness to share professional experience", "Clear and understandable communication"],
          improvements: ["Use the STAR method (Situation, Task, Action, Result) to add structure", "Double down on sharing actual metrics or measurable results achieved"],
          modelAnswer: "A complete answer would explicitly define a structured Situation, outline the direct challenges (Task), map your proactive actions (Action), and state countable professional outcomes (Result)."
        }
      });
    }
  });

  // --- API ROUTE 3: GENERATE REPORT ---
  app.post("/api/interview/generate-report", async (req, res) => {
    try {
      const { role, type, difficulty, history = [] } = req.body;

      if (!history || history.length === 0) {
        return res.status(400).json({ error: "Cannot generate a report for an empty interview history." });
      }

      const ai = getAi();

      const summaryLogs = history.map((item: any, i: number) => {
        return `Round ${i + 1}:
- Question: "${item.question}"
- Answer: "${item.answer || ""}"
- Score: ${item.score}/10
- Feedback Strengths: ${JSON.stringify(item.feedback?.strengths || [])}
- Feedback Improvements: ${JSON.stringify(item.feedback?.improvements || [])}`;
      }).join("\n\n");

      const prompt = `Review the entire transcript and evaluations of a completed mock interview to formulate a final comprehensive coaching report & personalized, actionable 3-step improvement plan.

CONTEXT DETAILS:
- Target Job Role: ${role}
- Selected Difficulty: ${difficulty}
- Interview Type: ${type}

INTERVIEW ROUND LOGS:
${summaryLogs}

INSTRUCTIONS:
1. Synthesize the candidate's performance across all rounds.
2. Outline the top 2 overall interview strengths summarized from all answers.
3. Outline the top 2 overall areas of growth or improvement summarized from all feedback comments.
4. Construct a personalized, highly actionable, chronological 3-step improvement plan. Each of the 3 steps should be discrete, practical tasks suitable for this job profile to prepare them for their upcoming real-world interview.
`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summaryStrengths: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Exactly two core interview strengths summarized across the whole session."
              },
              summaryImprovements: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Exactly two key growth fields or overall improvements summarized."
              },
              improvementPlan: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Exactly three practical sequential steps requested to prepare for key role details."
              }
            },
            required: ["summaryStrengths", "summaryImprovements", "improvementPlan"]
          }
        }
      });

      const text = response.text;
      if (!text) {
        throw new Error("No response received from report generator.");
      }

      const result = JSON.parse(text.trim());
      res.json(result);
    } catch (error: any) {
      console.error("Error in generate-report endpoint:", error);
      res.status(500).json({
        error: error.message || "Failed to generate summary report.",
        fallback: {
          summaryStrengths: ["Clear determination to share relevant past experiences", "Good articulation of professional background"],
          summaryImprovements: ["Struggled to deliver standardized answers utilizing STAR frameworks", "Would benefit from specifying concrete product outcomes and deliverables"],
          improvementPlan: [
            "Prepare 3 distinct past projects and formulate them according to the Situation, Task, Action, Result (STAR) framework.",
            "Write down core metrics, percentage increases, times saved, or client scores achieved to append to situational technical questions.",
            "Schedule a recurring timing check while talking to keep each verbal answer concise, active, and strictly under two minutes."
          ]
        }
      });
    }
  });

  // Serve static assets or mount Vite in development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // SPA Fallback for client routes
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`AI Interview Coach server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
