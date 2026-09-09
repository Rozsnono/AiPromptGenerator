"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Key,
  Trash2,
  Send,
  Copy,
  Check,
  RotateCcw,
  AlertCircle,
  HelpCircle,
  Eye,
  EyeOff,
  Cpu,
  RefreshCw,
  FileText,
  Layers,
  ArrowRight,
  Terminal,
} from "lucide-react";

// ==========================================
// Types and Interfaces
// ==========================================

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

const DEFAULT_MODELS: ModelInfo[] = [
  { id: "gemini-1.5-flash", name: "Gemini 1.5 Flash (Fast & Recommended)" },
  { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro (Deep Reasoning)" },
  { id: "gemini-3.5-flash", name: "Gemini 3.5 Flash" },
  { id: "gemini-3.5-flash-lite", name: "Gemini 3.5 Flash Lite" },
];

const LOCAL_STORAGE_KEYS = {
  API_KEY: "ai_prompt_gen_api_key",
  MODEL: "ai_prompt_gen_model",
  CACHED_MODELS: "ai_prompt_gen_cached_models",
  USER_PROMPT: "ai_prompt_gen_input",
  QUESTIONS: "ai_prompt_gen_questions",
  ANSWERS: "ai_prompt_gen_answers",
  FINAL_PROMPT: "ai_prompt_gen_final_prompt",
};

// ==========================================
// Main Component
// ==========================================

export default function AIPromptGeneratorPage() {
  const [mounted, setMounted] = useState(false);

  // API Key management
  const envApiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";
  const [customApiKey, setCustomApiKey] = useState<string>("");
  const [showKeyInput, setShowKeyInput] = useState<boolean>(false);
  const [keyVisible, setKeyVisible] = useState<boolean>(false);

  // Dynamic models management
  const [availableModels, setAvailableModels] = useState<ModelInfo[]>(DEFAULT_MODELS);
  const [selectedModel, setSelectedModel] = useState<string>("gemini-1.5-flash");
  const [isLoadingModels, setIsLoadingModels] = useState<boolean>(false);

  // Application state
  const [userInput, setUserInput] = useState<string>("");
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [answers, setAnswers] = useState<AnswersState>({});
  const [finalPrompt, setFinalPrompt] = useState<string>("");

  // Loading, cooldown, and UI states
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState<boolean>(false);
  const [isSynthesizingPrompt, setIsSynthesizingPrompt] = useState<boolean>(false);
  const [isCooldownActive, setIsCooldownActive] = useState<boolean>(false);
  const [cooldownSeconds, setCooldownSeconds] = useState<number>(0);
  const [copied, setCopied] = useState<boolean>(false);

  const cooldownTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Effective API key in use
  const activeApiKey = (customApiKey || envApiKey).trim();

  // ----------------------------------------------------
  // Dynamic Model Fetching based on API Key (REST API)
  // ----------------------------------------------------
  const fetchAvailableModels = useCallback(
    async (apiKeyToUse: string, showToast = false) => {
      const key = apiKeyToUse.trim();
      if (!key) return;

      setIsLoadingModels(true);
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(key)}`
        );

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData?.error?.message || `HTTP ${response.status}: Failed to fetch models`);
        }

        const data = await response.json();
        if (data && Array.isArray(data.models)) {
          const filtered: ModelInfo[] = data.models
            .filter((m: any) => {
              const methods: string[] = m.supportedGenerationMethods || [];
              const isGenerative = methods.includes("generateContent");
              const isGemini = typeof m.name === "string" && m.name.includes("gemini");
              return isGenerative && isGemini;
            })
            .map((m: any) => {
              const cleanId = m.name.replace(/^models\//, "");
              const displayName = m.displayName || cleanId;
              return {
                id: cleanId,
                name: displayName !== cleanId ? `${displayName} (${cleanId})` : cleanId,
                description: m.description,
              };
            });

          filtered.sort((a, b) => {
            const getScore = (id: string) => {
              if (id.includes("3.5-flash")) return 110;
              if (id.includes("2.0-flash")) return 100;
              if (id.includes("1.5-flash")) return 90;
              if (id.includes("1.5-pro")) return 80;
              if (id.includes("flash")) return 70;
              if (id.includes("pro")) return 60;
              return 10;
            };
            return getScore(b.id) - getScore(a.id);
          });

          if (filtered.length > 0) {
            setAvailableModels(filtered);
            try {
              localStorage.setItem(LOCAL_STORAGE_KEYS.CACHED_MODELS, JSON.stringify(filtered));
            } catch {}

            setSelectedModel((prev) => {
              const exists = filtered.some((m) => m.id === prev);
              if (exists) return prev;
              const defaultFlash = filtered.find((m) => m.id === "gemini-1.5-flash" || m.id.includes("flash"));
              return defaultFlash ? defaultFlash.id : filtered[0].id;
            });

            if (showToast) {
              toast.success(`${filtered.length} Gemini modell sikeresen betöltve az API kulcs alapján!`);
            }
          }
        }
      } catch (err: any) {
        console.warn("Failed to fetch models dynamically:", err);
        if (showToast) {
          toast.error(`Nem sikerült lekérni a modelleket: ${err?.message || "Hiba"}`);
        }
      } finally {
        setIsLoadingModels(false);
      }
    },
    []
  );

  // ----------------------------------------------------
  // LocalStorage Synchronization & Hydration handling
  // ----------------------------------------------------
  useEffect(() => {
    try {
      const storedKey = localStorage.getItem(LOCAL_STORAGE_KEYS.API_KEY);
      const storedModel = localStorage.getItem(LOCAL_STORAGE_KEYS.MODEL);
      const storedCachedModels = localStorage.getItem(LOCAL_STORAGE_KEYS.CACHED_MODELS);
      const storedInput = localStorage.getItem(LOCAL_STORAGE_KEYS.USER_PROMPT);
      const storedQuestions = localStorage.getItem(LOCAL_STORAGE_KEYS.QUESTIONS);
      const storedAnswers = localStorage.getItem(LOCAL_STORAGE_KEYS.ANSWERS);
      const storedFinal = localStorage.getItem(LOCAL_STORAGE_KEYS.FINAL_PROMPT);

      if (storedKey) setCustomApiKey(storedKey);
      if (storedCachedModels) {
        try {
          const parsed = JSON.parse(storedCachedModels);
          if (Array.isArray(parsed) && parsed.length > 0) setAvailableModels(parsed);
        } catch {}
      }
      if (storedModel) setSelectedModel(storedModel);
      if (storedInput) setUserInput(storedInput);
      if (storedQuestions) {
        try {
          const parsed = JSON.parse(storedQuestions);
          if (Array.isArray(parsed)) setQuestions(parsed);
        } catch { }
      }
      if (storedAnswers) {
        try {
          const parsed = JSON.parse(storedAnswers);
          if (parsed && typeof parsed === "object") setAnswers(parsed);
        } catch { }
      }
      if (storedFinal) setFinalPrompt(storedFinal);

      // Auto fetch models if key is present
      const effectiveKey = (storedKey || envApiKey).trim();
      if (effectiveKey) {
        fetchAvailableModels(effectiveKey, false);
      }
    } catch (err) {
      console.warn("Could not read from localStorage:", err);
    } finally {
      setMounted(true);
    }
  }, [envApiKey, fetchAvailableModels]);

  // Save states to LocalStorage
  useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem(LOCAL_STORAGE_KEYS.API_KEY, customApiKey);
      localStorage.setItem(LOCAL_STORAGE_KEYS.MODEL, selectedModel);
      localStorage.setItem(LOCAL_STORAGE_KEYS.USER_PROMPT, userInput);
      localStorage.setItem(LOCAL_STORAGE_KEYS.QUESTIONS, JSON.stringify(questions));
      localStorage.setItem(LOCAL_STORAGE_KEYS.ANSWERS, JSON.stringify(answers));
      localStorage.setItem(LOCAL_STORAGE_KEYS.FINAL_PROMPT, finalPrompt);
    } catch (err) {
      console.warn("Could not write to localStorage:", err);
    }
  }, [mounted, customApiKey, selectedModel, userInput, questions, answers, finalPrompt]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
    };
  }, []);

  // ----------------------------------------------------
  // Cooldown & Spam Protection Handler
  // ----------------------------------------------------
  const triggerCooldown = useCallback((durationSeconds: number = 3) => {
    setIsCooldownActive(true);
    setCooldownSeconds(durationSeconds);

    if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);

    let remaining = durationSeconds;
    cooldownTimerRef.current = setInterval(() => {
      remaining -= 1;
      setCooldownSeconds(remaining);
      if (remaining <= 0) {
        if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
        setIsCooldownActive(false);
      }
    }, 1000);
  }, []);

  // ----------------------------------------------------
  // Reset Action
  // ----------------------------------------------------
  const handleReset = () => {
    if (confirm("Are you sure you want to reset all inputs, questions, and generated prompt?")) {
      setUserInput("");
      setQuestions([]);
      setAnswers({});
      setFinalPrompt("");
      try {
        localStorage.removeItem(LOCAL_STORAGE_KEYS.USER_PROMPT);
        localStorage.removeItem(LOCAL_STORAGE_KEYS.QUESTIONS);
        localStorage.removeItem(LOCAL_STORAGE_KEYS.ANSWERS);
        localStorage.removeItem(LOCAL_STORAGE_KEYS.FINAL_PROMPT);
      } catch { }
      toast.success("Workspace cleared successfully!");
    }
  };

  // ----------------------------------------------------
  // JSON Extraction Helper
  // ----------------------------------------------------
  const cleanAndParseJSON = (rawText: string): any => {
    let clean = rawText.trim();
    // Remove markdown codeblock wrapper if present
    if (clean.startsWith("```")) {
      clean = clean.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
    }

    // Try finding outer array or object
    const firstBracket = clean.indexOf("[");
    const lastBracket = clean.lastIndexOf("]");
    const firstBrace = clean.indexOf("{");
    const lastBrace = clean.lastIndexOf("}");

    if (firstBracket !== -1 && lastBracket !== -1 && (firstBrace === -1 || firstBracket < firstBrace)) {
      clean = clean.substring(firstBracket, lastBracket + 1);
    } else if (firstBrace !== -1 && lastBrace !== -1) {
      clean = clean.substring(firstBrace, lastBrace + 1);
    }

    const parsed = JSON.parse(clean);
    if (Array.isArray(parsed)) return parsed;
    if (parsed && Array.isArray(parsed.questions)) return parsed.questions;
    return parsed;
  };

  // ----------------------------------------------------
  // Step 2: Generating Questions (AI Call 1 - Initial & Follow-up)
  // ----------------------------------------------------
  const handleGenerateQuestions = async (isFollowUp: boolean = false) => {
    if (!userInput.trim()) {
      toast.error("Kérlek írd le először, hogy mit szeretnél megvalósítani!");
      return;
    }

    if (!activeApiKey) {
      setShowKeyInput(true);
      toast.error("Gemini API kulcs szükséges! Add meg a fenti mezőben.");
      return;
    }

    setIsGeneratingQuestions(true);
    const maxRetries = 3;
    let attempt = 0;
    let success = false;

    // Different system prompt & context for initial vs follow-up
    let systemInstruction = "";
    let promptText = "";

    if (!isFollowUp || questions.length === 0) {
      systemInstruction = `You are an Expert Prompt Engineer. Your goal is to ask deep, relevant, and clarifying questions to build the ultimate, highly-customized prompt for the user.
MANDATORY RULES:
1. You MUST formulate all questions and options in HUNGARIAN (magyarul).
2. Generate 4 high-impact initial clarifying questions.
3. For each question, provide exactly three pre-defined options labelled "A", "B", and "C".
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

      promptText = `A felhasználó célja a következő feladat / prompt létrehozása:
"""
${userInput.trim()}
"""

Kérlek generálj 4 strukturált, mélyreható kérdést magyar nyelven (A, B, C opciókkal), hogy elindítsuk a prompt felépítését!`;
    } else {
      // Follow-up context based on previous questions and answers
      const previousQA = questions
        .map((q, idx) => {
          const userAns = answers[q.id];
          let ansText = "Még nem válaszolt";
          if (userAns) {
            if (userAns.selectedOption === "D") {
              ansText = `Egyéni válasz (D): "${userAns.customText || "Nincs kitöltve"}"`;
            } else {
              ansText = `Opció ${userAns.selectedOption}: "${q.options[userAns.selectedOption as "A" | "B" | "C"]}"`;
            }
          }
          return `Kérdés ${idx + 1}: "${q.question}"\nVálasz: ${ansText}`;
        })
        .join("\n\n");

      systemInstruction = `You are an Expert Prompt Engineer. The user is iteratively building a master prompt.
MANDATORY RULES:
1. You MUST formulate 3 to 4 NEW, deeper follow-up questions in HUNGARIAN (magyarul).
2. Do NOT repeat or duplicate any previous questions.
3. Dive into technical edge cases, constraints, integrations, styling, output formatting, or tone based on the user's prior answers.
4. For each question, provide exactly three pre-defined options labelled "A", "B", and "C".
5. Output STRICT, valid JSON array of objects with "question" and "options" (A, B, C).`;

      promptText = `A felhasználó eredeti célja:
"""
${userInput.trim()}
"""

Az eddig feltett kérdések és a felhasználó eddigi válaszai:
"""
${previousQA}
"""

Kérlek elemezd a fenti válaszokat, és generálj pontosan 3-4 ÚJ, mélyreható follow-up kérdést magyar nyelven (A, B, C opciókkal), amelyek az eddig még nem tisztázott részletekre fókuszálnak! Ne ismételd az eddigi kérdéseket!`;
    }

    while (attempt < maxRetries && !success) {
      attempt++;
      try {
        const genAI = new GoogleGenerativeAI(activeApiKey);
        const model = genAI.getGenerativeModel({
          model: selectedModel,
          generationConfig: {
            temperature: 0.5,
            responseMimeType: "application/json",
          },
          systemInstruction: systemInstruction,
        });

        const result = await model.generateContent(promptText);
        const responseText = result.response.text();
        const parsedData = cleanAndParseJSON(responseText);

        if (!Array.isArray(parsedData) || parsedData.length === 0) {
          throw new Error("Invalid structure or empty questions array returned from AI");
        }

        const validatedQuestions: QuestionItem[] = parsedData.map((item: any, idx: number) => {
          if (!item.question || !item.options || !item.options.A || !item.options.B || !item.options.C) {
            throw new Error(`Question #${idx + 1} has missing fields or options`);
          }
          return {
            id: item.id || idx + 1,
            question: String(item.question),
            options: {
              A: String(item.options.A),
              B: String(item.options.B),
              C: String(item.options.C),
            },
          };
        });

        if (!isFollowUp || questions.length === 0) {
          // Replace questions from scratch
          setQuestions(validatedQuestions);
          setAnswers({});
          setFinalPrompt("");
          toast.success(`${validatedQuestions.length} kérdés sikeresen legenerálva! Válaszolj rájuk, vagy kérhetsz még továbbiakat.`);
        } else {
          // Append new follow-up questions
          const currentCount = questions.length;
          const renumbered: QuestionItem[] = validatedQuestions.map((q, idx) => ({
            id: currentCount + idx + 1,
            question: q.question,
            options: q.options,
          }));
          setQuestions((prev) => [...prev, ...renumbered]);
          toast.success(`${renumbered.length} új follow-up kérdés hozzáadva!`);
        }

        success = true;
      } catch (err: any) {
        console.warn(`Attempt ${attempt} failed:`, err?.message || err);
        if (attempt >= maxRetries) {
          toast.error(
            `Nem sikerült legenerálni a kérdéseket ${maxRetries} próbálkozás után: ${err?.message || "Érvénytelen AI kimenet"}`
          );
          triggerCooldown(3);
        }
      }
    }

    setIsGeneratingQuestions(false);
  };

  // ----------------------------------------------------
  // Step 4: Synthesizing the Final Prompt (AI Call 2)
  // ----------------------------------------------------
  const handleGenerateFinalPrompt = async () => {
    if (!userInput.trim()) {
      toast.error("Az eredeti célleírás hiányzik.");
      return;
    }

    if (questions.length === 0) {
      toast.error("Kérlek előbb generáld le a kérdéseket!");
      return;
    }

    if (!activeApiKey) {
      setShowKeyInput(true);
      toast.error("Gemini API kulcs megadása szükséges.");
      return;
    }

    setIsSynthesizingPrompt(true);

    try {
      const genAI = new GoogleGenerativeAI(activeApiKey);
      const model = genAI.getGenerativeModel({
        model: selectedModel,
        generationConfig: {
          temperature: 0.5,
        },
        systemInstruction: `You are an Expert Prompt Engineer and Master Prompt Architect.
Your task is to take the user's initial objective along with their answers to the clarifying questions (which were asked in Hungarian), and synthesize everything into a single, comprehensive, state-of-the-art Master Prompt.

STRICT RULES:
1. The final generated prompt MUST BE IN ENGLISH, regardless of the Hungarian questions and inputs.
2. Structure the final prompt logically using rich Markdown (Title, Persona/Role, Objective, Context & Constraints, Step-by-Step Instructions, Desired Output Format, Examples, and Edge Cases).
3. If some questions were skipped or unanswered by the user, intelligently apply professional best practices.
4. Be deeply specific, actionable, and exhaustive. Craft it ready for production use in advanced AI models (such as Claude 3.5 Sonnet, GPT-4o, or Gemini 1.5 Pro).
5. Output ONLY the finalized prompt text with markdown formatting, with zero meta-commentary or conversational pleasantries before/after.`,
      });

      const answersSummary = questions
        .map((q, idx) => {
          const userAns = answers[q.id];
          let selectedText = "Nincs megválaszolva (használj iparági best practice-t)";
          if (userAns) {
            if (userAns.selectedOption === "D") {
              selectedText = `Egyéni válasz (D): "${userAns.customText || "Nincs kitöltve"}"`;
            } else {
              const optionLetter = userAns.selectedOption;
              const optionContent = q.options[optionLetter as "A" | "B" | "C"];
              selectedText = `Opció ${optionLetter}: "${optionContent}"`;
            }
          }
          return `Kérdés ${idx + 1}: "${q.question}"\nVálasztott opció: ${selectedText}`;
        })
        .join("\n\n");

      const synthesisPrompt = `User's Initial Goal / Description:
"""
${userInput.trim()}
"""

User's Clarifying Answers to the Questions:
"""
${answersSummary}
"""

Please synthesize all the above information into the ultimate, highly-refined Master Prompt in ENGLISH.`;

      const result = await model.generateContent(synthesisPrompt);
      const outputText = result.response.text();

      setFinalPrompt(outputText);
      toast.success("Final Master Prompt sikeresen elkészült angolul!");

      setTimeout(() => {
        document.getElementById("final-prompt-section")?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch (err: any) {
      console.error("Synthesis failed:", err);
      toast.error(`Nem sikerült előállítani a végleges promptot: ${err?.message || "Ismeretlen hiba"}`);
      triggerCooldown(3);
    } finally {
      setIsSynthesizingPrompt(false);
    }
  };

  // ----------------------------------------------------
  // Option Selection Handlers
  // ----------------------------------------------------
  const handleSelectOption = (questionId: number, optionKey: "A" | "B" | "C") => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: {
        selectedOption: optionKey,
        customText: prev[questionId]?.customText || "",
      },
    }));
  };

  const handleCustomTextChange = (questionId: number, text: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: {
        selectedOption: "D",
        customText: text,
      },
    }));
  };

  // ----------------------------------------------------
  // Copy to Clipboard
  // ----------------------------------------------------
  const handleCopy = async () => {
    if (!finalPrompt) return;
    try {
      await navigator.clipboard.writeText(finalPrompt);
      setCopied(true);
      toast.success("Prompt copied to clipboard!");
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      toast.error("Failed to copy to clipboard.");
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-400">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          <span>Loading AI Prompt Generator...</span>
        </div>
      </div>
    );
  }

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center py-8 px-4 sm:px-6 lg:px-8 selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Glow background effects */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-cyan-500/10 blur-[130px] pointer-events-none rounded-full" />
      <div className="fixed top-40 right-10 w-[500px] h-[300px] bg-fuchsia-500/10 blur-[140px] pointer-events-none rounded-full" />

      <div className="w-full max-w-5xl z-10 space-y-8">
        {/* =========================================================================
            HEADER & TOP CONTROLS
        ========================================================================= */}
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-zinc-800/80">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-cyan-500 to-fuchsia-500 flex items-center justify-center shadow-neon-cyan/50 shadow-md">
              <Sparkles className="w-6 h-6 text-zinc-950" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 via-zinc-100 to-fuchsia-400">
                AI Prompt Generator
              </h1>
              <p className="text-xs sm:text-sm text-zinc-400">
                Interactive Hungarian questionnaire &rarr; Master English Prompt synthesis via Gemini
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
            {/* Model Selector */}
            <div className="relative flex items-center bg-zinc-900/90 border border-zinc-800 rounded-lg px-2.5 py-1.5 focus-within:border-cyan-400 transition-colors shadow-sm">
              <Cpu className="w-4 h-4 text-cyan-400 mr-2 shrink-0" />
              <select
                aria-label="Select Gemini Model"
                value={selectedModel}
                disabled={isLoadingModels}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="bg-transparent text-xs text-zinc-200 focus:outline-none cursor-pointer max-w-[200px] sm:max-w-[260px] truncate pr-1"
              >
                {availableModels.map((m) => (
                  <option key={m.id} value={m.id} className="bg-zinc-900 text-zinc-200">
                    {m.name}
                  </option>
                ))}
              </select>

              {/* Refresh models button */}
              <button
                type="button"
                onClick={() => {
                  if (!activeApiKey) {
                    setShowKeyInput(true);
                    toast.error("Add meg az API kulcsot a modellek lekéréséhez!");
                    return;
                  }
                  fetchAvailableModels(activeApiKey, true);
                }}
                disabled={isLoadingModels}
                title="Modellek frissítése az API kulcs alapján"
                className="ml-1.5 p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-cyan-300 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingModels ? "animate-spin text-cyan-400" : ""}`} />
              </button>
            </div>

            {/* API Key Toggle/Status Button */}
            <button
              onClick={() => setShowKeyInput((prev) => !prev)}
              title={activeApiKey ? "API Key is set (Click to change)" : "API Key is missing (Click to set)"}
              className={`p-2 rounded-lg border transition-all ${activeApiKey
                  ? "bg-zinc-900/80 border-zinc-800 text-zinc-300 hover:border-cyan-400/50 hover:text-cyan-300"
                  : "bg-fuchsia-950/40 border-fuchsia-500/60 text-fuchsia-300 animate-pulse"
                }`}
            >
              <Key className="w-4 h-4" />
            </button>

            {/* Clear / Reset Button */}
            <button
              onClick={handleReset}
              title="Reset all inputs & storage"
              className="p-2 rounded-lg bg-zinc-900/80 border border-zinc-800 text-zinc-400 hover:text-rose-400 hover:border-rose-500/50 transition-all hover:bg-rose-950/20"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* =========================================================================
            API KEY INPUT BANNER (If env is missing or user toggles it)
        ========================================================================= */}
        {(!activeApiKey || showKeyInput) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-xl border ${!activeApiKey
                ? "bg-fuchsia-950/20 border-fuchsia-500/50 shadow-neon-fuchsia"
                : "bg-zinc-900/80 border-cyan-500/40 shadow-neon-cyan/20"
              } backdrop-blur-md`}
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm font-semibold text-zinc-200">
                  <Key className="w-4 h-4 text-cyan-400" />
                  <span>Google Gemini API Key</span>
                  {envApiKey && (
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                      Loaded from ENV
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-400">
                  Enter your key below. It stays strictly client-side in your browser storage and makes direct REST calls to Google Gemini.
                </p>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-80">
                  <input
                    type={keyVisible ? "text" : "password"}
                    placeholder="AIzaSy..."
                    value={customApiKey}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCustomApiKey(val);
                      if (val.trim().length > 15) {
                        fetchAvailableModels(val.trim(), false);
                      }
                    }}
                    className="w-full bg-zinc-950/90 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setKeyVisible(!keyVisible)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200"
                  >
                    {keyVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (activeApiKey) {
                      fetchAvailableModels(activeApiKey, true);
                    } else {
                      toast.error("Írj be egy érvényes API kulcsot!");
                    }
                  }}
                  disabled={isLoadingModels}
                  className="text-xs px-3 py-2 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 transition-colors shrink-0 flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingModels ? "animate-spin" : ""}`} />
                  <span>Modellek lekérése</span>
                </button>

                {customApiKey && (
                  <button
                    onClick={() => {
                      setCustomApiKey("");
                      toast.success("Custom API key cleared.");
                    }}
                    className="text-xs px-2.5 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* =========================================================================
            STEP 1: INITIAL INPUT
        ========================================================================= */}
        <section className="bg-zinc-900/60 border border-zinc-800/90 rounded-2xl p-6 backdrop-blur-md shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-300 font-bold text-xs border border-cyan-500/40">
                1
              </span>
              <h2 className="text-lg font-semibold text-zinc-100">Describe Your Goal or Initial Prompt</h2>
            </div>
            <span className="text-xs text-zinc-500">Step 1 of 3</span>
          </div>

          <p className="text-xs sm:text-sm text-zinc-400">
            Tell the AI what you want to create or solve (e.g., an SEO blog strategy, a full-stack Next.js app architecture, a marketing pitch, or a creative story).
          </p>

          <div className="relative">
            <textarea
              rows={4}
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="e.g. Egy modern, konverzió-optimalizált landing page-et szeretnék készíteni egy B2B SaaS szoftverhez, amivel növelhetjük az ingyenes próbaverzióra való feliratkozásokat..."
              className="w-full bg-zinc-950/70 border border-zinc-800 rounded-xl p-4 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all resize-y"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <div className="text-xs text-zinc-500 flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-zinc-400" />
              <span>Questions will be tailored dynamically in Hungarian (magyarul).</span>
            </div>

            <button
              onClick={() => handleGenerateQuestions(false)}
              disabled={!userInput.trim() || isGeneratingQuestions || isCooldownActive}
              className={`w-full sm:w-auto px-6 py-2.5 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all shadow-md ${!userInput.trim() || isGeneratingQuestions || isCooldownActive
                  ? "bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700/50"
                  : "bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-zinc-950 font-semibold shadow-neon-cyan/50 hover:shadow-neon-cyan"
                }`}
            >
              {isGeneratingQuestions ? (
                <>
                  <div className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                  <span>Kérdések generálása...</span>
                </>
              ) : isCooldownActive ? (
                <>
                  <RotateCcw className="w-4 h-4 animate-spin text-zinc-500" />
                  <span>Cooldown ({cooldownSeconds}s)</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Questions</span>
                </>
              )}
            </button>
          </div>
        </section>

        {/* =========================================================================
            STEP 2 & 3: QUESTIONS & OPTIONS UI (HUNGARIAN)
        ========================================================================= */}
        {questions.length > 0 && (
          <section className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-zinc-800/60">
              <div className="flex items-center gap-2.5">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-fuchsia-500/20 text-fuchsia-300 font-bold text-xs border border-fuchsia-500/40">
                  2
                </span>
                <div>
                  <h2 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
                    <span>Pontosító Kérdések</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/40 font-mono">
                      {questions.length} kérdés eddig
                    </span>
                  </h2>
                  <p className="text-xs text-zinc-400">
                    Válaszolj a számodra lényeges kérdésekre (A, B, C vagy egyéni D). Kérhetsz további kérdéseket (+), vagy amikor késznek érzed, azonnal generálhatod a végleges promptot!
                  </p>
                </div>
              </div>
              <span className="text-xs text-zinc-400 bg-zinc-900 border border-zinc-800 px-3 py-1 rounded-full self-start sm:self-auto font-mono">
                {Object.keys(answers).length} / {questions.length} megválaszolva
              </span>
            </div>

            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="space-y-6"
            >
              {questions.map((q, idx) => {
                const currentAnswer = answers[q.id];
                const selectedOpt = currentAnswer?.selectedOption;
                const isCustomSelected = selectedOpt === "D";

                return (
                  <motion.div
                    key={q.id || idx}
                    variants={itemVariants}
                    className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-5 hover:border-zinc-700/80 transition-colors shadow-lg"
                  >
                    {/* Question Header */}
                    <div className="flex items-start gap-3 mb-4">
                      <span className="text-xs font-mono font-bold px-2 py-1 rounded bg-zinc-800 text-cyan-400 border border-zinc-700/60 shrink-0 mt-0.5">
                        Q{idx + 1}
                      </span>
                      <h3 className="text-sm sm:text-base font-medium text-zinc-200 leading-snug">
                        {q.question}
                      </h3>
                    </div>

                    {/* Pre-defined Options A, B, C */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                      {(["A", "B", "C"] as const).map((letter) => {
                        const isSelected = selectedOpt === letter;
                        const optionText = q.options[letter];

                        return (
                          <button
                            key={letter}
                            type="button"
                            onClick={() => handleSelectOption(q.id, letter)}
                            className={`flex flex-col text-left p-3.5 rounded-xl border transition-all relative overflow-hidden group ${isSelected
                                ? "bg-cyan-950/30 border-cyan-400 text-white shadow-neon-cyan ring-1 ring-cyan-400/80"
                                : "bg-zinc-950/60 border-zinc-800 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-900/50"
                              }`}
                          >
                            <div className="flex items-center justify-between w-full mb-1.5">
                              <span
                                className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded ${isSelected
                                    ? "bg-cyan-400 text-zinc-950"
                                    : "bg-zinc-800 text-zinc-400 group-hover:text-zinc-200"
                                  }`}
                              >
                                {letter}
                              </span>
                              {isSelected && (
                                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                              )}
                            </div>
                            <span className="text-xs sm:text-sm leading-relaxed">
                              {optionText}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Option D: Custom Input (Frontend Injected) */}
                    <div
                      className={`p-3 rounded-xl border transition-all ${isCustomSelected
                          ? "bg-fuchsia-950/20 border-fuchsia-400 shadow-neon-fuchsia ring-1 ring-fuchsia-400/60"
                          : "bg-zinc-950/40 border-zinc-800/80 hover:border-zinc-700/60"
                        }`}
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <span
                          className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded ${isCustomSelected
                              ? "bg-fuchsia-500 text-zinc-950"
                              : "bg-zinc-800 text-zinc-400"
                            }`}
                        >
                          D
                        </span>
                        <span className="text-xs font-medium text-zinc-400">
                          Egyéni válasz (Custom response)
                        </span>
                      </div>
                      <input
                        type="text"
                        placeholder="Írd be a saját válaszodat, ha a fentiek nem pontosak..."
                        value={currentAnswer?.customText || ""}
                        onChange={(e) => handleCustomTextChange(q.id, e.target.value)}
                        onFocus={() => {
                          if (selectedOpt !== "D") {
                            handleCustomTextChange(q.id, currentAnswer?.customText || "");
                          }
                        }}
                        className={`w-full bg-zinc-950 border rounded-lg px-3 py-2 text-xs sm:text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none transition-all ${isCustomSelected
                            ? "border-fuchsia-400/80 focus:border-fuchsia-400 focus:ring-1 focus:ring-fuchsia-400"
                            : "border-zinc-800 focus:border-cyan-400"
                          }`}
                      />
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>

            {/* Step 4 Trigger: Ask More Questions OR Synthesize Prompt */}
            <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-zinc-800/80">
              <button
                type="button"
                onClick={() => handleGenerateQuestions(true)}
                disabled={isGeneratingQuestions || isSynthesizingPrompt || isCooldownActive || !activeApiKey}
                className={`w-full sm:w-auto px-5 py-3 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 border transition-all ${
                  isGeneratingQuestions || isSynthesizingPrompt || isCooldownActive || !activeApiKey
                    ? "bg-zinc-900 text-zinc-600 border-zinc-800 cursor-not-allowed"
                    : "bg-zinc-900/90 border-cyan-500/40 text-cyan-300 hover:bg-cyan-950/40 hover:border-cyan-400 shadow-neon-cyan/20"
                }`}
              >
                {isGeneratingQuestions ? (
                  <>
                    <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                    <span>Újabb kérdések generálása...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    <span>+ További kérdések feltevése</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleGenerateFinalPrompt}
                disabled={isSynthesizingPrompt || isGeneratingQuestions || isCooldownActive || !activeApiKey}
                className={`w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-3 transition-all shadow-lg ${
                  isSynthesizingPrompt || isGeneratingQuestions || isCooldownActive || !activeApiKey
                    ? "bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700/50"
                    : "bg-gradient-to-r from-fuchsia-500 to-cyan-500 hover:from-fuchsia-400 hover:to-cyan-400 text-zinc-950 shadow-neon-glow hover:scale-[1.01]"
                }`}
              >
                {isSynthesizingPrompt ? (
                  <>
                    <div className="w-5 h-5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                    <span>Mester Prompt szintetizálása angolul...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Kész vagyok &rarr; Végleges Prompt Generálása</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </section>
        )}

        {/* =========================================================================
            STEP 5: FINAL OUTPUT (ENGLISH MASTER PROMPT)
        ========================================================================= */}
        {finalPrompt && (
          <motion.section
            id="final-prompt-section"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 backdrop-blur-md shadow-2xl space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2.5">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-xs border border-emerald-500/40">
                  3
                </span>
                <div>
                  <h2 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
                    <Terminal className="w-5 h-5 text-cyan-400" />
                    Final Master Prompt (English)
                  </h2>
                  <p className="text-xs text-zinc-400">
                    Ready to copy into your favorite AI model (GPT-4o, Claude 3.5 Sonnet, Gemini Pro).
                  </p>
                </div>
              </div>

              <button
                onClick={handleCopy}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all border ${copied
                    ? "bg-emerald-950/60 border-emerald-500 text-emerald-300"
                    : "bg-zinc-800/90 border-zinc-700 text-zinc-200 hover:bg-zinc-700 hover:border-cyan-400 hover:text-cyan-300 shadow-md"
                  }`}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Copied to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy to Clipboard</span>
                  </>
                )}
              </button>
            </div>

            {/* Raw code block preview */}
            <div className="relative rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950/90">
              <div className="flex items-center justify-between px-4 py-2 bg-zinc-900/60 border-b border-zinc-800/70 text-[11px] font-mono text-zinc-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
                  <span className="ml-2">master_prompt.md</span>
                </span>
                <span>Markdown Raw Format</span>
              </div>
              <pre className="p-4 sm:p-5 text-xs sm:text-sm font-mono text-zinc-200 whitespace-pre-wrap break-words leading-relaxed max-h-[550px] overflow-y-auto selection:bg-cyan-500/40">
                {finalPrompt}
              </pre>
            </div>
          </motion.section>
        )}

        {/* Footer info */}
        <footer className="pt-6 pb-12 text-center text-xs text-zinc-500 border-t border-zinc-900">
          <p>Built with Next.js App Router, Tailwind CSS, Google Gemini REST API & Framer Motion.</p>
          <p className="mt-1">All logic strictly in a single copy-pasteable file (<code>app/page.tsx</code>).</p>
        </footer>
      </div>
    </div>
  );
}
