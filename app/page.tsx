"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

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
import { extensionSuffix, describeSelectedOptions, selectedLetters, isQuestionLocked, isAnswered } from "./answers";
import { generateClaudeText, listClaudeModels, describeClaudeError } from "./claude";
import { Header } from "../components/Header";
import { Stepper } from "../components/Stepper";
import { PromptConfigPanel } from "../components/PromptConfigPanel";
import { GoalView } from "../components/GoalView";
import { QuestionsView } from "../components/QuestionsView";
import { QuestionsMobileChat } from "../components/QuestionsMobileChat";
import { FinalPromptView } from "../components/FinalPromptView";
import { ChatModal } from "../components/ChatModal";

export default function AIPromptGeneratorPage() {
  const [mounted, setMounted] = useState(false);

  // API Key management
  const envApiKey = process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY || "";
  const [customApiKey, setCustomApiKey] = useState<string>("");

  // Models management
  const [availableModels, setAvailableModels] = useState<ModelInfo[]>(DEFAULT_MODELS);
  const [selectedModel, setSelectedModel] = useState<string>(DEFAULT_MODELS[0].id);
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
  // "Később térjünk vissza rá" jelölésű kérdések azonosítói
  const [revisitIds, setRevisitIds] = useState<number[]>([]);
  // Lezárt körből újratárgyalásra feloldott kérdések azonosítói
  const [reopenedIds, setReopenedIds] = useState<number[]>([]);
  // Elvetett ötletek (kérdések) azonosítói: nem kerülnek a promptba, és nem számítanak megválaszolatlannak
  const [droppedIds, setDroppedIds] = useState<number[]>([]);

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
        const filtered = await listClaudeModels(key);

        if (filtered.length > 0) {
          setAvailableModels(filtered);
          try {
            localStorage.setItem(LOCAL_STORAGE_KEYS.CACHED_MODELS, JSON.stringify(filtered));
          } catch {}

          setSelectedModel((prev) => {
            const exists = filtered.some((m) => m.id === prev);
            return exists ? prev : filtered[0].id;
          });

          if (showToast) {
            toast.success(`${filtered.length} Claude modell sikeresen betöltve!`);
          }
        }
      } catch (err: any) {
        console.warn("Failed to fetch models:", err);
        if (showToast) {
          toast.error(`Nem sikerült lekérni a modelleket: ${describeClaudeError(err)}`);
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
      const storedGuidelines = localStorage.getItem(LOCAL_STORAGE_KEYS.GUIDELINES);
      const storedRoundEnds = localStorage.getItem(LOCAL_STORAGE_KEYS.ROUND_ENDS);
      const storedRevisit = localStorage.getItem(LOCAL_STORAGE_KEYS.REVISIT);
      const storedReopened = localStorage.getItem(LOCAL_STORAGE_KEYS.REOPENED);
      const storedDropped = localStorage.getItem(LOCAL_STORAGE_KEYS.DROPPED);

      if (storedKey) setCustomApiKey(storedKey);
      if (storedCachedModels) {
        try {
          const parsed = JSON.parse(storedCachedModels);
          if (Array.isArray(parsed) && parsed.length > 0) setAvailableModels(parsed);
        } catch {}
      }
      // Régi (nem Claude) modellazonosítót nem töltünk vissza
      if (storedModel && storedModel.startsWith("claude")) setSelectedModel(storedModel);
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
      if (storedGuidelines) {
        try {
          const parsed = JSON.parse(storedGuidelines);
          if (parsed && typeof parsed === "object") setGuidelines(parsed);
        } catch {}
      }
      if (storedRoundEnds) {
        try {
          const parsed = JSON.parse(storedRoundEnds);
          if (Array.isArray(parsed)) setRoundEnds(parsed.filter((n) => typeof n === "number"));
        } catch {}
      }
      if (storedDropped) {
        try {
          const parsed = JSON.parse(storedDropped);
          if (Array.isArray(parsed)) setDroppedIds(parsed.filter((n) => typeof n === "number"));
        } catch {}
      }
      if (storedReopened) {
        try {
          const parsed = JSON.parse(storedReopened);
          if (Array.isArray(parsed)) setReopenedIds(parsed.filter((n) => typeof n === "number"));
        } catch {}
      }
      if (storedRevisit) {
        try {
          const parsed = JSON.parse(storedRevisit);
          if (Array.isArray(parsed)) setRevisitIds(parsed.filter((n) => typeof n === "number"));
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
      localStorage.setItem(LOCAL_STORAGE_KEYS.GUIDELINES, JSON.stringify(guidelines));
      localStorage.setItem(LOCAL_STORAGE_KEYS.ROUND_ENDS, JSON.stringify(roundEnds));
      localStorage.setItem(LOCAL_STORAGE_KEYS.REVISIT, JSON.stringify(revisitIds));
      localStorage.setItem(LOCAL_STORAGE_KEYS.REOPENED, JSON.stringify(reopenedIds));
      localStorage.setItem(LOCAL_STORAGE_KEYS.DROPPED, JSON.stringify(droppedIds));
    } catch (err) {
      console.warn("LocalStorage write warning:", err);
    }
  }, [mounted, customApiKey, selectedModel, userInput, promptConfig, questions, answers, finalPrompt, guidelines, roundEnds, revisitIds, reopenedIds, droppedIds]);

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
      setRevisitIds([]);
      setReopenedIds([]);
      setDroppedIds([]);
      setIsEnhancing(false);
      setCurrentStep(1);
      try {
        localStorage.removeItem(LOCAL_STORAGE_KEYS.USER_PROMPT);
        localStorage.removeItem(LOCAL_STORAGE_KEYS.QUESTIONS);
        localStorage.removeItem(LOCAL_STORAGE_KEYS.ANSWERS);
        localStorage.removeItem(LOCAL_STORAGE_KEYS.FINAL_PROMPT);
        localStorage.removeItem(LOCAL_STORAGE_KEYS.GUIDELINES);
        localStorage.removeItem(LOCAL_STORAGE_KEYS.ROUND_ENDS);
        localStorage.removeItem(LOCAL_STORAGE_KEYS.REVISIT);
        localStorage.removeItem(LOCAL_STORAGE_KEYS.REOPENED);
        localStorage.removeItem(LOCAL_STORAGE_KEYS.DROPPED);
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
      toast.error("Anthropic API kulcs szükséges a generáláshoz!");
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
          if (droppedIds.includes(q.id)) {
            return `Kérdés ${idx + 1}: "${q.question}"\nA felhasználó ezt az ötletet ELVETETTE – ne kérdezz rá újra, és ne javasolj hasonló irányt.`;
          }
          const userAns = answers[q.id];
          let ansText = "Még nem válaszolt";
          if (userAns) {
            if (userAns.selectedOption === "D") {
              ansText = `Egyéni válasz (D): "${userAns.customText || "Nincs kitöltve"}"`;
            } else {
              ansText = `${describeSelectedOptions(q, userAns)}${extensionSuffix(userAns)}`;
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

    let knowledgeInstruction = "";
    switch (promptConfig.knowledgeLevel) {
      case "none":
        knowledgeInstruction = "FONTOS: A kérdéseket úgy fogalmazd meg, hogy egy teljesen laikus, programozói tudással egyáltalán nem rendelkező személy is könnyen megértse őket! Minden opciót magyarázz el konyhanyelven, kerülve a szakzsargont.";
        break;
      case "beginner":
        knowledgeInstruction = "A kérdéseket egy kezdő programozó szintjén fogalmazd meg. Használhatsz alapvető fogalmakat, de a bonyolultabb architekturális vagy specifikus dolgokat röviden magyarázd el az opcióknál.";
        break;
      case "intermediate":
        knowledgeInstruction = "A kérdéseket egy haladó (medior) programozó szintjén fogalmazd meg. Nyugodtan használj szakzsargont és hivatkozz bevett gyakorlatokra.";
        break;
      case "advanced":
        knowledgeInstruction = "A kérdéseket egy senior/profi fejlesztő szintjén fogalmazd meg. Térj ki a legmélyebb technikai, architekturális, skálázhatósági és optimalizációs részletekre is. A laikus magyarázatokra semmi szükség.";
        break;
    }
    
    if (knowledgeInstruction) {
      promptText += `\n\n${knowledgeInstruction}`;
    }

    while (attempt < maxRetries && !success) {
      attempt++;
      try {
        const responseText = await generateClaudeText({
          apiKey: activeApiKey,
          model: selectedModel,
          system: `${systemInstruction}\n\nFONTOS: Kizárólag érvényes JSON tömbbel válaszolj, bármilyen kísérőszöveg vagy markdown kódblokk nélkül.\nHa egy kérdés kritikus téma, vagyis a válasza erősen meghatározza a végleges prompt minőségét, add hozzá az objektumhoz: "isCritical": true és "criticalReason": "egy rövid magyar mondat, miért kritikus". Csak a valóban kritikus kérdéseket jelöld.${
            isFollowUp && questions.length > 0
              ? `\nHa egy kérdés olyan témát nyit meg, ami az eredeti célban és az eddigi kérdés-válaszokban még NEM szerepelt, add hozzá az objektumhoz: "isNew": true és "newReason": "egy rövid magyar mondat, miért új téma". Egyébként ezeket a mezőket hagyd el.`
              : ""
          }`,
          prompt: promptText,
        });
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
            ...(item.isCritical === true
              ? {
                  isCritical: true,
                  criticalReason: typeof item.criticalReason === "string" ? item.criticalReason : undefined,
                }
              : {}),
            ...(item.isNew === true
              ? { isNew: true, newReason: typeof item.newReason === "string" ? item.newReason : undefined }
              : {}),
          };
        });

        if (!isFollowUp || questions.length === 0) {
          setQuestions(validatedQuestions);
          setAnswers({});
          setFinalPrompt("");
          setGuidelines({});
          setRoundEnds([]);
      setRevisitIds([]);
      setReopenedIds([]);
      setDroppedIds([]);
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
            isNew: q.isNew,
            newReason: q.newReason,
            isCritical: q.isCritical,
            criticalReason: q.criticalReason,
          }));
          setQuestions((prev) => [...prev, ...renumbered]);
          toast.success(`${renumbered.length} új kérdés hozzáadva!`);
        }

        success = true;
      } catch (err: any) {
        console.warn(`Attempt ${attempt} failed:`, err?.message || err);
        if (attempt >= maxRetries) {
          toast.error(`Nem sikerült legenerálni a kérdéseket: ${describeClaudeError(err)}`);
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
      toast.error("Anthropic API kulcs megadása szükséges.");
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

      const droppedSummary = questions
        .filter((q) => droppedIds.includes(q.id))
        .map((q) => `- ${q.question}`)
        .join("\n");

      const answersSummary = questions
        .map((q, idx) => {
          // Elvetett ötlet: nem kerül a promptba, csak a körhöz írt irányelve marad meg
          if (droppedIds.includes(q.id)) {
            return guidelines[q.id]
              ? `[User's Custom Guideline for the round ending at question ${idx + 1}: "${guidelines[q.id]}"]`
              : null;
          }
          const userAns = answers[q.id];
          let selectedText = "Nem válaszolt külön (alkalmazz iparági best practice-t)";
          if (userAns) {
            if (userAns.selectedOption === "D") {
              selectedText = `Egyéni válasz (D): "${userAns.customText || "Nincs megadva"}"`;
            } else {
              selectedText = `${describeSelectedOptions(q, userAns)}${extensionSuffix(userAns)}`;
            }
          }
          let roundGuideline = "";
          if (guidelines[q.id]) {
            roundGuideline = `\n[User's Custom Guideline inserted here: "${guidelines[q.id]}"]`;
          }
          return `Kérdés ${idx + 1}${q.isCritical ? " [KRITIKUS TÉMA – kiemelten kezeld]" : ""}: "${q.question}"\nVálasz: ${selectedText}${roundGuideline}`;
        })
        .filter((entry): entry is string => entry !== null)
        .join("\n\n");

      const synthesisPrompt = `${isEnhancing ? "User's Existing Prompt to Enhance:" : "User's Initial Goal:"}
"""
${userInput.trim()}
"""

User's Clarifying Answers to the Questions:
"""
${answersSummary}
"""
${
  droppedSummary
    ? `\nDISCARDED IDEAS (the user explicitly rejected these topics – do NOT include or imply them in the prompt):\n${droppedSummary}\n`
    : ""
}
Target Output Language: ${isEnglish ? "ENGLISH" : "HUNGARIAN"}
Tone: ${promptConfig.tone}

Please synthesize everything into the ultimate Master Prompt. ${
        isEnhancing
          ? "Ensure the original prompt is significantly improved, expanded and refined based on these answers and guidelines."
          : ""
      }`;

      const outputText = await generateClaudeText({
        apiKey: activeApiKey,
        model: selectedModel,
        system: systemInstruction,
        prompt: synthesisPrompt,
      });

      setFinalPrompt(outputText);
      setCurrentStep(3);
      toast.success("Végleges Master Prompt sikeresen elkészült!");

      setTimeout(() => {
        document.getElementById("final-prompt-section")?.scrollIntoView({ behavior: "smooth" });
      }, 150);
    } catch (err: any) {
      console.error("Synthesis failed:", err);
      toast.error(`Nem sikerült előállítani a végleges promptot: ${describeClaudeError(err)}`);
      triggerCooldown(3);
    } finally {
      setIsSynthesizingPrompt(false);
    }
  };

  // Option handlers
  // A lezárt körök (amik után már új kérdéseket kértünk) kérdései zároltak: nem módosíthatók.
  const handleSelectOption = (questionId: number, optionKey: "A" | "B" | "C") => {
    if (isQuestionLocked(questionId, roundEnds, reopenedIds)) return;
    setAnswers((prev) => {
      const current = prev[questionId];
      const letters = selectedLetters(current);
      // Kapcsolóként működik: újra kattintva a kijelölés megszűnik, több opció is kijelölhető
      const nextLetters = letters.includes(optionKey)
        ? letters.filter((l) => l !== optionKey)
        : [...letters, optionKey];

      if (nextLetters.length === 0) {
        const rest = { ...prev };
        delete rest[questionId];
        return rest;
      }
      const sorted = (["A", "B", "C"] as const).filter((l) => nextLetters.includes(l));
      return {
        ...prev,
        [questionId]: {
          selectedOption: sorted[0],
          selectedOptions: sorted,
          customText: current?.customText || "",
          // A kiegészítés a válasz egészére vonatkozik, ezért kijelöléskor megmarad
          extraText: current?.selectedOption !== "D" ? current?.extraText : undefined,
        },
      };
    });
  };

  const handleExtraTextChange = (questionId: number, text: string) => {
    if (isQuestionLocked(questionId, roundEnds, reopenedIds)) return;
    setAnswers((prev) => {
      const current = prev[questionId];
      // Kiegészíteni csak már kiválasztott A/B/C választ lehet
      if (!current || current.selectedOption === "D") return prev;
      return { ...prev, [questionId]: { ...current, extraText: text } };
    });
  };

  const handleToggleRevisit = (questionId: number) => {
    setRevisitIds((prev) =>
      prev.includes(questionId) ? prev.filter((id) => id !== questionId) : [...prev, questionId]
    );
  };

  const handleToggleDrop = (questionId: number) => {
    if (isQuestionLocked(questionId, roundEnds, reopenedIds)) return;
    setDroppedIds((prev) =>
      prev.includes(questionId) ? prev.filter((id) => id !== questionId) : [...prev, questionId]
    );
  };

  const handleToggleReopen = (questionId: number) => {
    setReopenedIds((prev) =>
      prev.includes(questionId) ? prev.filter((id) => id !== questionId) : [...prev, questionId]
    );
  };

  const handleGuidelineChange = (questionId: number, text: string) => {
    if (isQuestionLocked(questionId, roundEnds, reopenedIds)) return;
    setGuidelines((prev) => ({ ...prev, [questionId]: text }));
  };

  const handleCustomTextChange = (questionId: number, text: string) => {
    if (isQuestionLocked(questionId, roundEnds, reopenedIds)) return;
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
      <div className="min-h-screen bg-background flex items-center justify-center text-zinc-400">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium">AiPromptGenerator betöltése...</span>
        </div>
      </div>
    );
  }

  // Az elvetett ötletek is "lezártnak" számítanak a haladásban
  const answeredCount = questions.filter(
    (q) => isAnswered(answers[q.id]) || droppedIds.includes(q.id)
  ).length;

  return (
    <div className="min-h-screen bg-background text-zinc-100 flex flex-col items-center py-8 px-4 sm:px-6 lg:px-8 selection:bg-sky-500/30 selection:text-sky-200">
      {/* Subtle ambient light accents */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-sky-500/5 blur-[120px] pointer-events-none rounded-full" />
      <div className="fixed top-40 right-10 w-[450px] h-[250px] bg-indigo-500/5 blur-[130px] pointer-events-none rounded-full" />

      <div className="w-full max-w-4xl lg:max-w-6xl z-10 space-y-6">
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
          <GoalView
            userInput={userInput}
            onChangeUserInput={setUserInput}
            isEnhancing={isEnhancing}
            onChangeEnhancing={setIsEnhancing}
            promptConfig={promptConfig}
            onChangeConfig={setPromptConfig}
            onApplyPreset={handleApplyPreset}
            onGenerate={() => handleGenerateQuestions(false)}
            onKeyDown={handleKeyDown}
            isGenerating={isGeneratingQuestions}
            isCooldownActive={isCooldownActive}
            cooldownSeconds={cooldownSeconds}
          />
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
            {/* Telefon/tablet: chat-szerű nézet; gép (lg+): kétoszlopos szerkesztői nézet */}
            <div className="lg:hidden">
              <QuestionsMobileChat
                questions={questions}
              answers={answers}
              onSelectOption={handleSelectOption}
              onCustomTextChange={handleCustomTextChange}
              onExtraTextChange={handleExtraTextChange}
              onGenerateMoreQuestions={() => handleGenerateQuestions(true)}
              onGenerateFinalPrompt={handleGenerateFinalPrompt}
              isGeneratingQuestions={isGeneratingQuestions}
              isSynthesizingPrompt={isSynthesizingPrompt}
              isCooldownActive={isCooldownActive}
              cooldownSeconds={cooldownSeconds}
              hasApiKey={Boolean(activeApiKey)}
              guidelines={guidelines}
              onGuidelineChange={handleGuidelineChange}
              revisitIds={revisitIds}
              onToggleRevisit={handleToggleRevisit}
              reopenedIds={reopenedIds}
              onToggleReopen={handleToggleReopen}
              droppedIds={droppedIds}
              onToggleDrop={handleToggleDrop}
              roundEnds={roundEnds}
              goalText={userInput}
              />
            </div>
            <div className="hidden lg:block">
              <QuestionsView
                questions={questions}
              answers={answers}
              onSelectOption={handleSelectOption}
              onCustomTextChange={handleCustomTextChange}
              onExtraTextChange={handleExtraTextChange}
              onGenerateMoreQuestions={() => handleGenerateQuestions(true)}
              onGenerateFinalPrompt={handleGenerateFinalPrompt}
              isGeneratingQuestions={isGeneratingQuestions}
              isSynthesizingPrompt={isSynthesizingPrompt}
              isCooldownActive={isCooldownActive}
              cooldownSeconds={cooldownSeconds}
              hasApiKey={Boolean(activeApiKey)}
              guidelines={guidelines}
              onGuidelineChange={handleGuidelineChange}
              revisitIds={revisitIds}
              onToggleRevisit={handleToggleRevisit}
              reopenedIds={reopenedIds}
              onToggleReopen={handleToggleReopen}
              droppedIds={droppedIds}
              onToggleDrop={handleToggleDrop}
              roundEnds={roundEnds}
              goalText={userInput}
              />
            </div>
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
            AiPromptGenerator • Anthropic Claude API & Next.js App Router
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
