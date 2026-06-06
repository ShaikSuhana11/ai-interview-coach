# AI Interview Coach 🚀

AI Interview Coach is a state-of-the-art, professional web application designed to help job candidates practice real-time interviews. It simulates a live recruiter, evaluates responses using quantitative grade logic, highlights areas of improvement, and delivers a robust, actionable coaching report.

## Key Features
*   **Contextual Question Engine**: Crafts highly representative situational and technical questions tailored specifically to a candidate's target job, selected difficulties, and exact job descriptions.
*   **Dual Response Input**: Supports typing responses keyboard-style or speaking aloud with automatic transcription using the browser's integrated Web Speech recognition API.
*   **Structured Real-Time Grading**: Returns a constructive 0-10 score, detailing 2 concrete areas of strength, 2 actionable improvements, and a high-caliber model answer for direct comparison.
*   **Interactive Voice Speech**: Supports audio narration for questions using the native browser speech synthesis API.
*   **Performance Adaptation**: Automatically adjusts follow-up questions dynamically to increase or relax difficulty based on the candidate's preceding answers.
*   **Synthesized Progress dossier**: Yields holistic session analytics and a chronological 3-step actionable study roadmap.

---

## 🛠️ Local Setup & Configuration

Follow these steps to run the application locally or prepare it for a custom launch:

### 1. Set up Environment Variables
Create a `.env` file in the root directory (or use the AI Studio Secrets Panel) and append your Gemini Api Key:
```env
GEMINI_API_KEY="your_actual_gemini_api_key_here"
```

### 2. Install Dependencies
Initialize and restore workspace packages:
```bash
npm install
```

### 3. Run the Development Server
Power up the combined full-stack Express & Vite dev server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🚀 Production Build & Deployment

To bundle both Client static assets and compile the serverless Node Express entrypoint:

```bash
# Formulate production bundles in /dist
npm run build

# Boot the node daemon server
npm start
```

---

## 💡 STAR Framework Methodology
This platform evaluates inputs against the **STAR (Situation, Task, Action, Result)** layout. For maximum scores, formulate answers by outlining:
1.  **Situation**: The corporate context, context requirements, or technical scenario.
2.  **Task**: Direct problem statements or challenges that required immediate action.
3.  **Action**: Precise steps you designed, technologies you executed, or strategies you initialized.
4.  **Result**: Countable metrics, percentage speed improvements, times saved, or client review scores achieved.
