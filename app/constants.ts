import { ModelInfo, PresetItem, PromptConfig } from "./types";

export const DEFAULT_MODELS: ModelInfo[] = [
  { id: "gemini-1.5-flash", name: "Gemini 1.5 Flash (Gyors és ajánlott)" },
  { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro (Mély következtetés)" },
  { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash" },
  { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash" },
];

export const LOCAL_STORAGE_KEYS = {
  API_KEY: "ai_prompt_gen_api_key",
  MODEL: "ai_prompt_gen_model",
  CACHED_MODELS: "ai_prompt_gen_cached_models",
  USER_PROMPT: "ai_prompt_gen_input",
  PROMPT_CONFIG: "ai_prompt_gen_config",
  QUESTIONS: "ai_prompt_gen_questions",
  ANSWERS: "ai_prompt_gen_answers",
  FINAL_PROMPT: "ai_prompt_gen_final_prompt",
};

export const DEFAULT_SYNTHESIS_SYSTEM_INSTRUCTION = `You are a World-Class Principal AI Prompt Engineer and System Architect.
Your task is to take the user's initial objective along with their answers to the clarifying questions, and synthesize everything into a single, comprehensive, state-of-the-art Master Prompt.

CORE PRINCIPLES:
1. Output language: Follow the requested target language strictly.
2. Structure the final prompt logically using rich Markdown:
   - # [Master Prompt Title]
   - ## Role & Persona (Identity, specialized knowledge, mindset)
   - ## Core Objective (Clear, unambiguous mission statement)
   - ## Context & Architecture (Background details, environment, stack)
   - ## Strict Constraints & Rules (What to do, what NEVER to do)
   - ## Step-by-Step Execution Plan (Sequential instructions)
   - ## Output Format & Schema (Structure, code templates, or JSON if needed)
   - ## Edge Cases & Error Handling (Potential pitfalls and mitigation)
3. If some questions were skipped or left unanswered, infer the best modern industry practices.
4. Output ONLY the finalized prompt ready for production use, with zero conversational meta-commentary.`;

export const DEFAULT_QUESTIONS_SYSTEM_INSTRUCTION = `You are an Expert Prompt Engineer. Your goal is to ask deep, relevant, and clarifying questions to build the ultimate, highly-customized prompt for the user.
MANDATORY RULES:
1. You MUST formulate all questions and options in HUNGARIAN (magyarul).
2. Generate structured, high-impact clarifying questions based on the requested count.
3. For each question, provide exactly three pre-defined realistic options labelled "A", "B", and "C".
4. Output STRICT, valid JSON. No conversational text, no markdown decoration outside the JSON.
JSON format must be an array of objects:
[
  {
    "id": 1,
    "question": "Kérdés szövege magyarul?",
    "options": {
      "A": "Első opció",
      "B": "Második opció",
      "C": "Harmadik opció"
    }
  }
]`;

export const DEFAULT_PROMPT_CONFIG: PromptConfig = {
  targetLanguage: "en",
  tone: "technical",
  questionsCount: 4,
  knowledgeLevel: "intermediate",
  customSystemInstruction: DEFAULT_SYNTHESIS_SYSTEM_INSTRUCTION,
  customQuestionsInstruction: DEFAULT_QUESTIONS_SYSTEM_INSTRUCTION,
};

export const PRESETS: PresetItem[] = [
  {
    id: "fullstack-app",
    label: "Full-Stack Web Alkalmazás",
    badge: "Fejlesztés",
    description: "Komplett Next.js / Node.js alkalmazás specifikáció és architektúra.",
    prompt: "Egy modern, teljes körű full-stack webalkalmazást szeretnék készíteni Next.js (App Router), TypeScript, Tailwind CSS és PostgreSQL adatbázis alapokon, hitelesítéssel, reszponzív felülettel és tiszta kódarchitektúrával.",
    suggestedTone: "technical",
  },
  {
    id: "b2b-landing",
    label: "SaaS Landing Page",
    badge: "Marketing",
    description: "Konverzió-fókuszú értékesítési oldal B2B szoftverhez.",
    prompt: "Egy prémium minőségű, magas konverziójú B2B SaaS landing page struktúrát és szövegtervet szeretnék kidolgozni modern tech esztétikával, meggyőző értékajánlattal, funkcióbemutatókkal és társadalmi bizonyítékokkal.",
    suggestedTone: "business",
  },
  {
    id: "code-refactor",
    label: "Kód Refaktorálás & Audit",
    badge: "Tiszta Kód",
    description: "Teljesítmény- és kódminőség optimalizálás és biztonság.",
    prompt: "Egy meglévő kódmodul refaktorálását szeretném elvégezni a SOLID elvek, tiszta architektúra, robusztus típusbiztonság és optimális futási teljesítmény elérése érdekében.",
    suggestedTone: "technical",
  },
  {
    id: "system-architect",
    label: "AI Rendszer & RAG Pipeline",
    badge: "AI Architektúra",
    description: "Komplex AI ügynök vagy RAG munkafolyamat tervezése.",
    prompt: "Egy moduláris RAG (Retrieval-Augmented Generation) AI csővezetéket és intelligens agent workflow-t szeretnék felépíteni vektoros kereséssel, kontextus-újrarangsorolással és megbízható forráshivatkozásokkal.",
    suggestedTone: "comprehensive",
  },
  {
    id: "creative-story",
    label: "Kreatív Tartalom & Copy",
    badge: "Tartalom",
    description: "Meggyőző storytelling és kampánystratégia.",
    prompt: "Egy lebilincselő, professzionális bemutató narratívát és marketing kampányt szeretnék felépíteni egy új technológiai innováció piaci bevezetéséhez.",
    suggestedTone: "creative",
  },
];
