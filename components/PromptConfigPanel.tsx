"use client";

import React, { useState } from "react";
import { Sliders, Globe, MessageSquare, BookOpen, RotateCcw, ChevronDown, ChevronUp, Check, Shield } from "lucide-react";
import { PromptConfig, PromptTone, TargetLanguage } from "../app/types";
import { DEFAULT_PROMPT_CONFIG, DEFAULT_SYNTHESIS_SYSTEM_INSTRUCTION, DEFAULT_QUESTIONS_SYSTEM_INSTRUCTION } from "../app/constants";

interface PromptConfigPanelProps {
  config: PromptConfig;
  onChangeConfig: (newConfig: PromptConfig) => void;
}

export const PromptConfigPanel: React.FC<PromptConfigPanelProps> = ({
  config,
  onChangeConfig,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showAdvancedInstructions, setShowAdvancedInstructions] = useState(false);

  const toneOptions: { id: PromptTone; label: string; desc: string }[] = [
    { id: "technical", label: "Technikai & Fejlesztői", desc: "Tiszta kód, architektúra és konkrét szabványok" },
    { id: "business", label: "Üzleti & B2B SaaS", desc: "Konverzió, értékajánlat és stratégiai fókusz" },
    { id: "comprehensive", label: "Kimerítő & Architektúra", desc: "Minden részletre kiterjedő, lépésről lépésre" },
    { id: "creative", label: "Kreatív & Storytelling", desc: "Meggyőző stílus, narratíva és flow" },
    { id: "concise", label: "Tömör & Lényegretörő", desc: "Felesleges sallangok nélkül, direkt utasítások" },
  ];

  const handleResetToDefaults = () => {
    onChangeConfig({ ...DEFAULT_PROMPT_CONFIG });
  };

  const isModifiedFromDefault =
    config.targetLanguage !== DEFAULT_PROMPT_CONFIG.targetLanguage ||
    config.tone !== DEFAULT_PROMPT_CONFIG.tone ||
    config.questionsCount !== DEFAULT_PROMPT_CONFIG.questionsCount ||
    config.customSystemInstruction !== DEFAULT_SYNTHESIS_SYSTEM_INSTRUCTION ||
    config.customQuestionsInstruction !== DEFAULT_QUESTIONS_SYSTEM_INSTRUCTION;

  return (
    <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/50 backdrop-blur-md overflow-hidden transition-all">
      {/* Header toggle */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-zinc-800/30 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-sky-950/60 border border-sky-800/50 flex items-center justify-center text-sky-400">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-zinc-100">
                Prompt & Rendszer-beállítások (System Prompt Setup)
              </span>
              {isModifiedFromDefault && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-sky-950 text-sky-400 border border-sky-800/50">
                  Egyedi
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-400">
              Célnyelv ({config.targetLanguage === "en" ? "Angol" : "Magyar"}), stílus (
              {toneOptions.find((t) => t.id === config.tone)?.label}), {config.questionsCount} kérdés körönként
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-zinc-400">
          <span className="text-xs hidden sm:inline-block">
            {isOpen ? "Összecsukás" : "Testreszabás"}
          </span>
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {/* Expandable Configuration Body */}
      {isOpen && (
        <div className="p-4 sm:p-5 border-t border-zinc-800/70 space-y-5 bg-zinc-950/40">
          {/* Target Language and Questions Count */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Target Output Language */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-sky-400" />
                <span>Generált Mester Prompt Célnyelve</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onChangeConfig({ ...config, targetLanguage: "en" })}
                  className={`p-2.5 rounded-xl border text-left text-xs transition-all flex items-center justify-between ${
                    config.targetLanguage === "en"
                      ? "bg-sky-950/50 border-sky-500/80 text-white shadow-sm ring-1 ring-sky-500/30"
                      : "bg-zinc-900/70 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                  }`}
                >
                  <div>
                    <div className="font-semibold text-zinc-200">English (Ajánlott)</div>
                    <div className="text-[11px] text-zinc-400">Legjobb Claude, GPT-4o és Gemini számára</div>
                  </div>
                  {config.targetLanguage === "en" && <Check className="w-4 h-4 text-sky-400 shrink-0" />}
                </button>

                <button
                  type="button"
                  onClick={() => onChangeConfig({ ...config, targetLanguage: "hu" })}
                  className={`p-2.5 rounded-xl border text-left text-xs transition-all flex items-center justify-between ${
                    config.targetLanguage === "hu"
                      ? "bg-sky-950/50 border-sky-500/80 text-white shadow-sm ring-1 ring-sky-500/30"
                      : "bg-zinc-900/70 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                  }`}
                >
                  <div>
                    <div className="font-semibold text-zinc-200">Magyar (Hungarian)</div>
                    <div className="text-[11px] text-zinc-400">Teljesen magyar nyelvű Master Prompt</div>
                  </div>
                  {config.targetLanguage === "hu" && <Check className="w-4 h-4 text-sky-400 shrink-0" />}
                </button>
              </div>
            </div>

            {/* Questions count per round */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-sky-400" />
                <span>Kérdések száma körönként</span>
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[3, 4, 6, 9].map((count) => {
                  const isSelected = config.questionsCount === count;
                  return (
                    <button
                      key={count}
                      type="button"
                      onClick={() => onChangeConfig({ ...config, questionsCount: count })}
                      className={`py-2 px-3 rounded-xl border text-xs font-semibold text-center transition-all ${
                        isSelected
                          ? "bg-sky-500 text-zinc-950 border-sky-400 shadow-sm"
                          : "bg-zinc-900/70 border-zinc-800 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-800/60"
                      }`}
                    >
                      {count} kérdés
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] text-zinc-500">
                Az AI pontosan ennyi mélyreható kérdést tesz fel a válaszadáshoz.
              </p>
            </div>
          </div>

          {/* Prompt Tone / Archetype */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-sky-400" />
              <span>Prompt Fókusz & Stílus (Tone & Archetype)</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {toneOptions.map((tone) => {
                const isSelected = config.tone === tone.id;
                return (
                  <button
                    key={tone.id}
                    type="button"
                    onClick={() => onChangeConfig({ ...config, tone: tone.id })}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? "bg-sky-950/40 border-sky-500/70 text-white shadow-sm ring-1 ring-sky-500/20"
                        : "bg-zinc-900/60 border-zinc-800/80 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-semibold text-zinc-200">
                      <span>{tone.label}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-sky-400" />}
                    </div>
                    <div className="text-[11px] text-zinc-500 mt-0.5 leading-snug">
                      {tone.desc}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Advanced: Direct System Instructions Editor */}
          <div className="pt-2 border-t border-zinc-800/60 space-y-3">
            <button
              type="button"
              onClick={() => setShowAdvancedInstructions(!showAdvancedInstructions)}
              className="flex items-center gap-2 text-xs font-medium text-sky-400 hover:text-sky-300 transition-colors"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>
                {showAdvancedInstructions
                  ? "AI Rendszerutasítások (System Instructions) elrejtése"
                  : "Haladó: AI Rendszerutasítások megtekintése & közvetlen szerkesztése"}
              </span>
              {showAdvancedInstructions ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            {showAdvancedInstructions && (
              <div className="space-y-4 pt-1 animate-in fade-in">
                {/* Synthesis system instruction */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-zinc-400">
                    <span className="font-semibold text-zinc-300">
                      1. Master Prompt Szintetizáló Rendszerutasítás:
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        onChangeConfig({
                          ...config,
                          customSystemInstruction: DEFAULT_SYNTHESIS_SYSTEM_INSTRUCTION,
                        })
                      }
                      className="text-[11px] text-zinc-500 hover:text-zinc-300 flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Alapértelmezettre</span>
                    </button>
                  </div>
                  <textarea
                    rows={6}
                    value={config.customSystemInstruction}
                    onChange={(e) =>
                      onChangeConfig({
                        ...config,
                        customSystemInstruction: e.target.value,
                      })
                    }
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs font-mono text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-sky-500 transition-colors leading-relaxed resize-y"
                  />
                  <p className="text-[10px] text-zinc-500">
                    Ezt az utasítást kapja a Gemini a válaszok összefoglalásakor és a mester prompt megírásakor.
                  </p>
                </div>

                {/* Questions system instruction */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-zinc-400">
                    <span className="font-semibold text-zinc-300">
                      2. Kérdésgeneráló Rendszerutasítás:
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        onChangeConfig({
                          ...config,
                          customQuestionsInstruction: DEFAULT_QUESTIONS_SYSTEM_INSTRUCTION,
                        })
                      }
                      className="text-[11px] text-zinc-500 hover:text-zinc-300 flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Alapértelmezettre</span>
                    </button>
                  </div>
                  <textarea
                    rows={6}
                    value={config.customQuestionsInstruction}
                    onChange={(e) =>
                      onChangeConfig({
                        ...config,
                        customQuestionsInstruction: e.target.value,
                      })
                    }
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs font-mono text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-sky-500 transition-colors leading-relaxed resize-y"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Reset all button */}
          {isModifiedFromDefault && (
            <div className="flex items-center justify-end pt-2 border-t border-zinc-800/60">
              <button
                type="button"
                onClick={handleResetToDefaults}
                className="text-xs text-zinc-400 hover:text-white flex items-center gap-1.5 px-3 py-1 rounded-lg hover:bg-zinc-800/60 transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Minden prompt-beállítás visszaállítása alapértelmezettre</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
