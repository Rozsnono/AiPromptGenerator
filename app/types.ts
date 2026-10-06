export interface QuestionItem {
  id: number;
  question: string;
  options: {
    A: string;
    B: string;
    C: string;
  };
}

export type SelectedOptionKey = "A" | "B" | "C" | "D";

export interface UserAnswer {
  selectedOption: SelectedOptionKey;
  customText?: string;
}

export interface AnswersState {
  [questionId: number]: UserAnswer;
}

export interface ModelInfo {
  id: string;
  name: string;
  description?: string;
}

export type TargetLanguage = "en" | "hu";

export type PromptTone = "technical" | "business" | "comprehensive" | "creative" | "concise";

export type KnowledgeLevel = "none" | "beginner" | "intermediate" | "advanced";

export interface PromptConfig {
  targetLanguage: TargetLanguage;
  tone: PromptTone;
  questionsCount: number;
  knowledgeLevel: KnowledgeLevel;
  customSystemInstruction: string;
  customQuestionsInstruction: string;
}

export interface PresetItem {
  id: string;
  label: string;
  badge: string;
  description: string;
  prompt: string;
  suggestedTone: PromptTone;
}
