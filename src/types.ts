export interface InterviewConfig {
  role: string;
  type: 'Behavioral' | 'Technical' | 'Mixed';
  difficulty: 'Easy' | 'Medium' | 'Hard';
  questionsCount: number;
  jobDescription: string;
}

export interface FeedbackDetail {
  score: number;
  strengths: string[];
  improvements: string[];
  modelAnswer: string;
}

export interface InterviewRound {
  question: string;
  answer: string;
  score: number;
  feedback: FeedbackDetail | null;
}

export interface CoachingReport {
  summaryStrengths: string[];
  summaryImprovements: string[];
  improvementPlan: string[];
}

export type AppScreen = 'setup' | 'interview' | 'report';
