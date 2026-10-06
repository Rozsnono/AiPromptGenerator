"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ArrowRight, RotateCcw, HelpCircle, Layers, Lightbulb } from "lucide-react";

import {
  QuestionItem,
  AnswersState,
  ModelInfo,
  PromptConfig,
  PresetItem,
} from "./types";
import {
  DEFAULT_MODELS,
  LOCAL_STORAGE_KEYS,
  DEFAULT_PROMPT_CONFIG,
  PRESETS,
} from "./constants";
import { Header } from "../components/Header";
import { Stepper } from "../components/Stepper";
import { PromptConfigPanel } from "../components/PromptConfigPanel";
import { QuestionsView } from "../components/QuestionsView";
import { FinalPromptView } from "../components/FinalPromptView";
import { ChatModal } from "../components/ChatModal";

export default function AIPromptGeneratorPage() {
  const [mounted, setMounted] = useState(false);

  // API Key management
  const envApiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";
  const [customApiKey, setCustomApiKey] = useState<string>("");

  // Models management
  const [availableModels, setAvailableModels] = useState<ModelInfo[]>(DEFAULT_MODELS);
  const [selectedModel, setSelectedModel] = useState<string>("gemini-1.5-flash");
  const [isLoadingModels, setIsLoadingModels] = useState<boolean>(false);

  // Application workflow state
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isEnhancing, setIsEnhancing] = useState<boolean>(false);
  const [userInput, setUserInput] = useState<string>("");
  const [promptConfig, setPromptConfig] = useState<PromptConfig>(DEFAULT_PROMPT_CONFIG);
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [answers, setAnswers] = useState<AnswersState>({});
  const [finalPrompt, setFinalPrompt] = useState<string>("");
  const [guidelines, setGuidelines] = useState<Record<number, string>>({});
  const [roundEnds, setRoundEnds] = useState<number[]>([]);

  // Async & cooldown states
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState<boolean>(false);
  const [isSynthesizingPrompt, setIsSynthesizingPrompt] = useState<boolean>(false);
  const [isCooldownActive, setIsCooldownActive] = useState<boolean>(false);
  const [cooldownSeconds, setCooldownSeconds] = useState<number>(0);

  const cooldownTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Active key in use
  const activeApiKey = (customApiKey || envApiKey).trim();

  // ----------------------------------------------------
  // Dynamic Model Fetching
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
              if (id.includes("2.5-flash")) return 120;
              if (id.includes("2.0-flash")) return 110;
              if (id.includes("1.5-flash")) return 100;
              if (id.includes("1.5-pro")) return 90;
              if (id.includes("flash")) return 80;
              if (id.includes("pro")) return 70;
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
              const defaultFlash = filtered.find((m) => m.id.includes("flash"));
              return defaultFlash ? defaultFlash.id : filtered[0].id;
            });

            if (showToast) {
              toast.success(`${filtered.length} Gemini modell sikeresen betöltve!`);
            }
          }
        }
      } catch (err: any) {
        console.warn("Failed to fetch models:", err);
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
  // LocalStorage Hydration
  // ----------------------------------------------------
  useEffect(() => {
    try {
      const storedKey = localStorage.getItem(LOCAL_STORAGE_KEYS.API_KEY);
      const storedModel = localStorage.getItem(LOCAL_STORAGE_KEYS.MODEL);
      const storedCachedModels = localStorage.getItem(LOCAL_STORAGE_KEYS.CACHED_MODELS);
      const storedInput = localStorage.getItem(LOCAL_STORAGE_KEYS.USER_PROMPT);
      const storedConfig = localStorage.getItem(LOCAL_STORAGE_KEYS.PROMPT_CONFIG);
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
      if (storedConfig) {
        try {
          const parsed = JSON.parse(storedConfig);
          if (parsed && typeof parsed === "object") {
            setPromptConfig({ ...DEFAULT_PROMPT_CONFIG, ...parsed });
          }
        } catch {}
      }
      if (storedQuestions) {
        try {
          const parsed = JSON.parse(storedQuestions);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setQuestions(parsed);
            setCurrentStep(2);
          }
        } catch {}
      }
      if (storedAnswers) {
        try {
          const parsed = JSON.parse(storedAnswers);
          if (parsed && typeof parsed === "object") setAnswers(parsed);
        } catch {}
      }
      if (storedFinal) {
        setFinalPrompt(storedFinal);
        setCurrentStep(3);
      }

      const effectiveKey = (storedKey || envApiKey).trim();
      if (effectiveKey) {
        fetchAvailableModels(effectiveKey, false);
      }
    } catch (err) {
      console.warn("LocalStorage read warning:", err);
    } finally {
      setMounted(true);
    }
  }, [envApiKey, fetchAvailableModels]);

  // Persist state changes
  useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem(LOCAL_STORAGE_KEYS.API_KEY, customApiKey);
      localStorage.setItem(LOCAL_STORAGE_KEYS.MODEL, selectedModel);
      localStorage.setItem(LOCAL_STORAGE_KEYS.USER_PROMPT, userInput);
      localStorage.setItem(LOCAL_STORAGE_KEYS.PROMPT_CONFIG, JSON.stringify(promptConfig));
      localStorage.setItem(LOCAL_STORAGE_KEYS.QUESTIONS, JSON.stringify(questions));
      localStorage.setItem(LOCAL_STORAGE_KEYS.ANSWERS, JSON.stringify(answers));
      localStorage.setItem(LOCAL_STORAGE_KEYS.FINAL_PROMPT, finalPrompt);
    } catch (err) {
      console.warn("LocalStorage write warning:", err);
    }
  }, [mounted, customApiKey, selectedModel, userInput, promptConfig, questions, answers, finalPrompt]);

  // Cleanup timers
  useEffect(() => {
    return () => {
      if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
    };
  }, []);

  // Cooldown handler
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

  // Reset workspace
  const handleReset = () => {
    if (confirm("Biztosan törölni szeretnéd a teljes munkamenetet és a generált promptot?")) {
      setUserInput("");
      setQuestions([]);
      setAnswers({});
      setFinalPrompt("");
      setGuidelines({});
      setRoundEnds([]);
      setIsEnhancing(false);
      setCurrentStep(1);
      try {
        localStorage.removeItem(LOCAL_STORAGE_KEYS.USER_PROMPT);
        localStorage.removeItem(LOCAL_STORAGE_KEYS.QUESTIONS);
        localStorage.removeItem(LOCAL_STORAGE_KEYS.ANSWERS);
        localStorage.removeItem(LOCAL_STORAGE_KEYS.FINAL_PROMPT);
      } catch {}
      toast.success("Munkaterület sikeresen visszaállítva!");
    }
  };

  // Robust JSON parser helper
  const cleanAndParseJSON = (rawText: string): any => {
    let clean = rawText.trim();
    if (clean.startsWith("```")) {
      clean = clean.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
    }

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
  // Step 1 -> 2: Generate Questions (AI Call 1)
  // ----------------------------------------------------
  const handleGenerateQuestions = async (isFollowUp: boolean = false) => {
    if (!userInput.trim()) {
      toast.error("Kérlek írd le először a célodat vagy a kiinduló promptot!");
      return;
    }

    if (!activeApiKey) {
      toast.error("Google Gemini API kulcs szükséges a generáláshoz!");
      return;
    }

    setIsGeneratingQuestions(true);
    const maxRetries = 3;
    let attempt = 0;
    let success = false;

    let systemInstruction = promptConfig.customQuestionsInstruction || "";
    let promptText = "";

    const questionCount = promptConfig.questionsCount || 4;

    if (!isFollowUp || questions.length === 0) {
      if (isEnhancing) {
        promptText = `A felhasználó egy meglévő promptot szeretne továbbfejleszteni, finomhangolni.
A meglévő prompt:
"""
${userInput.trim()}
"""

A prompt kívánt stílusa/tónusa: ${promptConfig.tone}
A végleges prompt célnyelve: ${promptConfig.targetLanguage === "en" ? "Angol (English)" : "Magyar (Hungarian)"}

Kérlek generálj pontosan ${questionCount} darab strukturált, mélyreható kérdést magyar nyelven (A, B, C opciókkal), amelyek segítenek kideríteni, hogyan lehetne a meglévő promptot a leghatékonyabban javítani és kiegészíteni!`;
      } else {
        promptText = `A felhasználó célja a következő feladat / prompt létrehozása:
"""
${userInput.trim()}
"""

A prompt kívánt stílusa/tónusa: ${promptConfig.tone}
A végleges prompt célnyelve: ${promptConfig.targetLanguage === "en" ? "Angol (English)" : "Magyar (Hungarian)"}

Kérlek generálj pontosan ${questionCount} darab strukturált, mélyreható kérdést magyar nyelven (A, B, C opciókkal), amelyek segítenek a legpontosabb prompt felépítésében!`;
      }
    } else {
      // Follow-up context
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
          
          let roundGuideline = "";
          if (guidelines[q.id]) {
            roundGuideline = `\n[Ezen a ponton a felhasználó az alábbi irányelvet adta meg: "${guidelines[q.id]}"]`;
          }
          
          return `Kérdés ${idx + 1}: "${q.question}"\nVálasz: ${ansText}${roundGuideline}`;
        })
        .join("\n\n");

      promptText = `A felhasználó eredeti célja:
"""
${userInput.trim()}
"""

Az eddig feltett kérdések és válaszok:
"""
${previousQA}
"""

Kérlek generálj pontosan 3 új, mélyebb follow-up kérdést magyar nyelven (A, B, C opciókkal), amelyek az eddig még tisztázatlan részletekre fókuszálnak! Ne ismételd a korábbi kérdéseket!`;
    }

    if (promptConfig.beginnerFriendlyQuestions) {
      promptText += `\n\nFONTOS: A kérdéseket úgy fogalmazd meg, hogy egy teljesen kezdő, vagy programozói tudással egyáltalán nem rendelkező személy is könnyen megértse őket! Kerüld a túlzott technikai szakzsargont, és ha szükséges, röviden magyarázd el az opciók jelentését konyhanyelven.`;
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
          throw new Error("Érvénytelen vagy üres kérdéstömb érkezett a modelltől");
        }

        const validatedQuestions: QuestionItem[] = parsedData.map((item: any, idx: number) => {
          if (!item.question || !item.options || !item.options.A || !item.options.B || !item.options.C) {
            throw new Error(`Kérdés #${idx + 1} hiányos mezőket tartalmaz`);
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
          setQuestions(validatedQuestions);
          setAnswers({});
          setFinalPrompt("");
          setGuidelines({});
          setRoundEnds([]);
          setCurrentStep(2);
          toast.success(`${validatedQuestions.length} kérdés sikeresen előállítva!`);
        } else {
          const currentCount = questions.length;
          const lastQuestionId = questions[currentCount - 1].id;
          setRoundEnds((prev) => Array.from(new Set([...prev, lastQuestionId])));
          
          const renumbered: QuestionItem[] = validatedQuestions.map((q, idx) => ({
            id: currentCount + idx + 1,
            question: q.question,
            options: q.options,
          }));
          setQuestions((prev) => [...prev, ...renumbered]);
          toast.success(`${renumbered.length} új kérdés hozzáadva!`);
        }

        success = true;
      } catch (err: any) {
        console.warn(`Attempt ${attempt} failed:`, err?.message || err);
        if (attempt >= maxRetries) {
          toast.error(`Nem sikerült legenerálni a kérdéseket: ${err?.message || "Hiba"}`);
          triggerCooldown(3);
        }
      }
    }

    setIsGeneratingQuestions(false);
  };

  // ----------------------------------------------------
  // Step 2 -> 3: Synthesize Final Prompt (AI Call 2)
  // ----------------------------------------------------
  const handleGenerateFinalPrompt = async () => {
    if (!userInput.trim()) {
      toast.error("Az eredeti célleírás hiányzik.");
      return;
    }

    if (questions.length === 0) {
      toast.error("Kérlek generálj kérdéseket előbb!");
      return;
    }

    if (!activeApiKey) {
      toast.error("Gemini API kulcs megadása szükséges.");
      return;
    }

    setIsSynthesizingPrompt(true);

    try {
      const isEnglish = promptConfig.targetLanguage === "en";

      const systemInstruction = `${promptConfig.customSystemInstruction}

STRICT LANGUAGE DIRECTIVE:
${
  isEnglish
    ? "1. The finalized prompt MUST BE 100% IN ENGLISH, regardless of the Hungarian questionnaire."
    : "1. The finalized prompt MUST BE 100% IN HUNGARIAN (Magyar nyelven)."
}
2. Tone & Architecture Focus: ${promptConfig.tone.toUpperCase()}.
3. Synthesize the user's objective and all answered questions into an immaculate, ready-to-run Master Prompt.`;

      const answersSummary = questions
        .map((q, idx) => {
          const userAns = answers[q.id];
          let selectedText = "Nem válaszolt külön (alkalmazz iparági best practice-t)";
          if (userAns) {
            if (userAns.selectedOption === "D") {
              selectedText = `Egyéni válasz (D): "${userAns.customText || "Nincs megadva"}"`;
            } else {
              const optionLetter = userAns.selectedOption;
              const optionContent = q.options[optionLetter as "A" | "B" | "C"];
              selectedText = `Opció ${optionLetter}: "${optionContent}"`;
            }
          }
          let roundGuideline = "";
          if (guidelines[q.id]) {
            roundGuideline = `\n[User's Custom Guideline inserted here: "${guidelines[q.id]}"]`;
          }
          return `Kérdés ${idx + 1}: "${q.question}"\nVálasz: ${selectedText}${roundGuideline}`;
        })
        .join("\n\n");

      const synthesisPrompt = `${isEnhancing ? "User's Existing Prompt to Enhance:" : "User's Initial Goal:"}
"""
${userInput.trim()}
"""

User's Clarifying Answers to the Questions:
"""
${answersSummary}
"""

Target Output Language: ${isEnglish ? "ENGLISH" : "HUNGARIAN"}
Tone: ${promptConfig.tone}

Please synthesize everything into the ultimate Master Prompt. ${
        isEnhancing
          ? "Ensure the original prompt is significantly improved, expanded and refined based on these answers and guidelines."
          : ""
      }`;

      const genAI = new GoogleGenerativeAI(activeApiKey);
      const model = genAI.getGenerativeModel({
        model: selectedModel,
        generationConfig: {
          temperature: 0.5,
        },
        systemInstruction: systemInstruction,
      });

      const result = await model.generateContent(synthesisPrompt);
      const outputText = result.response.text();

      setFinalPrompt(outputText);
      setCurrentStep(3);
      toast.success("Végleges Master Prompt sikeresen elkészült!");

      setTimeout(() => {
        document.getElementById("final-prompt-section")?.scrollIntoView({ behavior: "smooth" });
      }, 150);
    } catch (err: any) {
      console.error("Synthesis failed:", err);
      toast.error(`Nem sikerült előállítani a végleges promptot: ${err?.message || "Ismeretlen hiba"}`);
      triggerCooldown(3);
    } finally {
      setIsSynthesizingPrompt(false);
    }
  };

  // Option handlers
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

  // Apply preset
  const handleApplyPreset = (preset: PresetItem) => {
    setUserInput(preset.prompt);
    setPromptConfig((prev) => ({
      ...prev,
      tone: preset.suggestedTone,
    }));
    toast.success(`"${preset.label}" sablon betöltve!`);
  };

  // Keyboard shortcut handler (Cmd+Enter or Ctrl+Enter in Step 1)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      if (userInput.trim() && !isGeneratingQuestions && !isCooldownActive) {
        handleGenerateQuestions(false);
      }
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#090a0f] flex items-center justify-center text-zinc-400">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium">AiPromptGenerator betöltése...</span>
        </div>
      </div>
    );
  }

  const answeredCount = Object.keys(answers).filter((id) => {
    const ans = answers[Number(id)];
    if (!ans) return false;
    if (ans.selectedOption === "D") {
      return Boolean(ans.customText && ans.customText.trim().length > 0);
    }
    return true;
  }).length;

  return (
    <div className="min-h-screen bg-[#090a0f] text-zinc-100 flex flex-col items-center py-8 px-4 sm:px-6 lg:px-8 selection:bg-sky-500/30 selection:text-sky-200">
      {/* Subtle ambient light accents */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-sky-500/5 blur-[120px] pointer-events-none rounded-full" />
      <div className="fixed top-40 right-10 w-[450px] h-[250px] bg-indigo-500/5 blur-[130px] pointer-events-none rounded-full" />

      <div className="w-full max-w-4xl z-10 space-y-6">
        {/* Header */}
        <Header
          availableModels={availableModels}
          selectedModel={selectedModel}
          onSelectModel={setSelectedModel}
          isLoadingModels={isLoadingModels}
          onRefreshModels={() => {
            if (!activeApiKey) {
              toast.error("Add meg az API kulcsot a modellek lekéréséhez!");
              return;
            }
            fetchAvailableModels(activeApiKey, true);
          }}
          customApiKey={customApiKey}
          onUpdateApiKey={(key) => {
            setCustomApiKey(key);
            if (key.trim().length > 15) {
              fetchAvailableModels(key.trim(), true);
            }
          }}
          envApiKey={envApiKey}
          onResetWorkspace={handleReset}
        />

        {/* Stepper Navigation */}
        <Stepper
          currentStep={currentStep}
          hasQuestions={questions.length > 0}
          hasFinalPrompt={Boolean(finalPrompt)}
          onSelectStep={(step) => setCurrentStep(step)}
          answeredCount={answeredCount}
          totalQuestions={questions.length}
        />

        {/* =========================================================================
            STEP 1: GOAL DEFINITION & PROMPT SETUP
        ========================================================================= */}
        {currentStep === 1 && (
          <motion.section
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            {/* Main Goal Card */}
            <div className="bg-zinc-900/60 border border-zinc-800/90 rounded-2xl p-5 sm:p-6 backdrop-blur-md shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="flex items-center justify-center w-7 h-7 rounded-xl bg-sky-500/20 text-sky-300 font-bold text-xs border border-sky-500/40">
                    1
                  </span>
                  <h2 className="text-base sm:text-lg font-semibold text-white">
                    Kiinduló Cél vagy Prompt Leírása
                  </h2>
                </div>
                <span className="text-xs text-zinc-500 font-mono">1. Lépés a 3-ból</span>
              </div>

              <p className="text-xs sm:text-sm text-zinc-400">
                Írd le, hogy pontosan mit szeretnél elérni az AI modellel (pl. Next.js webalkalmazás terv, konverziós SaaS landing page, kód refaktorálás, vagy marketing kampány).
              </p>

              {/* Quick Presets */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-400">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                  <span>Gyors sablonok (1-kattintásos indítás):</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleApplyPreset(preset)}
                      className="px-3 py-1.5 rounded-xl bg-zinc-950/80 border border-zinc-800 hover:border-sky-500/50 hover:bg-zinc-800/50 text-xs text-zinc-300 hover:text-white transition-all flex items-center gap-1.5 shadow-sm"
                    >
                      <span className="text-[10px] font-mono text-sky-400 font-medium">[{preset.badge}]</span>
                      <span>{preset.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Mode Selection */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-1.5 sm:gap-2 p-1.5 bg-zinc-950/50 border border-zinc-800 rounded-xl w-full sm:w-fit mt-4">
                <button
                  type="button"
                  onClick={() => setIsEnhancing(false)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    !isEnhancing
                      ? "bg-sky-500/20 text-sky-400 border border-sky-500/30"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  Új prompt létrehozása
                </button>
                <button
                  type="button"
                  onClick={() => setIsEnhancing(true)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isEnhancing
                      ? "bg-sky-500/20 text-sky-400 border border-sky-500/30"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  Meglévő prompt átírása
                </button>
              </div>

              {/* Textarea */}
              <div className="relative pt-2">
                <textarea
                  rows={5}
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={isEnhancing ? "Másold be ide a meglévő promptodat, amit javítani szeretnél..." : "e.g. Egy modern, konverzió-optimalizált landing page-et szeretnék készíteni egy B2B SaaS szoftverhez..."}
                  className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl p-4 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400/40 transition-all resize-y leading-relaxed"
                />
                <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-1.5 px-1 font-mono">
                  <span>{userInput.length} karakter</span>
                  <span className="hidden sm:inline">Tipp: ⌘ + Enter a gyors indításhoz</span>
                </div>
              </div>

              {/* Advanced Prompt & System Instructions Panel */}
              <div className="pt-2">
                <PromptConfigPanel
                  config={promptConfig}
                  onChangeConfig={(newCfg) => setPromptConfig(newCfg)}
                />
              </div>

              {/* Action button */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-zinc-800/70">
                <div className="text-xs text-zinc-500 flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-sky-400" />
                  <span>
                    A kérdések {promptConfig.questionsCount} db struktúrában, magyar nyelven fognak megjelenni.
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleGenerateQuestions(false)}
                  disabled={!userInput.trim() || isGeneratingQuestions || isCooldownActive}
                  className={`w-full sm:w-auto px-6 py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2.5 transition-all shadow-md ${
                    !userInput.trim() || isGeneratingQuestions || isCooldownActive
                      ? "bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700/50"
                      : "bg-sky-500 hover:bg-sky-400 text-zinc-950 shadow-sky-500/20 hover:scale-[1.01]"
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
                      <span>Kérdéssor Generálása</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.section>
        )}

        {/* =========================================================================
            STEP 2: QUESTIONS & QA TUNING
        ========================================================================= */}
        {currentStep === 2 && questions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
          >
            <QuestionsView
              questions={questions}
              answers={answers}
              onSelectOption={handleSelectOption}
              onCustomTextChange={handleCustomTextChange}
              onGenerateMoreQuestions={() => handleGenerateQuestions(true)}
              onGenerateFinalPrompt={handleGenerateFinalPrompt}
              isGeneratingQuestions={isGeneratingQuestions}
              isSynthesizingPrompt={isSynthesizingPrompt}
              isCooldownActive={isCooldownActive}
              cooldownSeconds={cooldownSeconds}
              hasApiKey={Boolean(activeApiKey)}
              guidelines={guidelines}
              onGuidelineChange={(qId, text) => setGuidelines(prev => ({ ...prev, [qId]: text }))}
              roundEnds={roundEnds}
            />
          </motion.div>
        )}

        {/* =========================================================================
            STEP 3: FINAL SYNTHESIZED MASTER PROMPT
        ========================================================================= */}
        {currentStep === 3 && finalPrompt && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
          >
            <FinalPromptView
              prompt={finalPrompt}
              onUpdatePrompt={setFinalPrompt}
              onRegenerate={handleGenerateFinalPrompt}
              isSynthesizing={isSynthesizingPrompt}
              modelName={selectedModel}
              targetLanguage={promptConfig.targetLanguage}
            />
          </motion.div>
        )}

        {/* Footer */}
        <footer className="pt-8 pb-12 text-center text-xs text-zinc-500 border-t border-zinc-900/80 space-y-1">
          <p className="font-medium text-zinc-400">
            AiPromptGenerator • Google Gemini REST API & Next.js App Router
          </p>
          <p className="text-[11px] text-zinc-600">
            Letisztult munkafolyamat, testreszabható rendszerpromptok és pontosító kérdések.
          </p>
        </footer>
      </div>

      {questions.length > 0 && (
        <ChatModal
          apiKey={activeApiKey}
          selectedModel={selectedModel}
          originalGoal={userInput}
          finalPrompt={finalPrompt}
          questions={questions}
          answers={answers}
        />
      )}
    </div>
  );
}
