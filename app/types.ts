export interface QuestionItem {
  id: number;
  question: string;
  options: {
    A: string;
    B: string;
    C: string;
  };
  /** A modell szerint olyan téma, ami a célban / korábbi válaszokban még nem szerepelt. */
  isNew?: boolean;
  /** Rövid magyar indoklás, miért új a téma (csak isNew esetén). */
  newReason?: string;
  /** A modell szerint kritikus téma: a válasz erősen befolyásolja a végleges promptot. */
  isCritical?: boolean;
  /** Rövid magyar indoklás, miért kritikus (csak isCritical esetén). */
  criticalReason?: string;
}

export type SelectedOptionKey = "A" | "B" | "C" | "D";

export interface UserAnswer {
  /** Egyetlen válasz esetén ez a kulcs; több kijelölésnél az első (visszafelé kompatibilitás). */
  selectedOption: SelectedOptionKey;
  /** Több kijelölt A/B/C opció (ha hiányzik, csak `selectedOption` számít). */
  selectedOptions?: ("A" | "B" | "C")[];
  customText?: string;
  /** Kiegészítés a kiválasztott A/B/C válaszhoz ("ez, de bővítve"). */
  extraText?: string;
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
