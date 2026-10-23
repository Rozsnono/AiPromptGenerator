"use client";

import React from "react";
import { motion } from "framer-motion";
import { Bot, Sparkles, ArrowRight, RotateCcw, Lightbulb, Send, HelpCircle } from "lucide-react";
import { PromptConfig, PresetItem } from "../app/types";
import { PRESETS } from "../app/constants";
import { PromptConfigPanel } from "./PromptConfigPanel";

interface GoalViewProps {
  userInput: string;
  onChangeUserInput: (value: string) => void;
  isEnhancing: boolean;
  onChangeEnhancing: (value: boolean) => void;
  promptConfig: PromptConfig;
  onChangeConfig: (cfg: PromptConfig) => void;
  onApplyPreset: (preset: PresetItem) => void;
  onGenerate: () => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  isGenerating: boolean;
  isCooldownActive: boolean;
  cooldownSeconds: number;
}

const KNOWLEDGE_LABELS: Record<PromptConfig["knowledgeLevel"], string> = {
  none: "Laikus",
  beginner: "Kezdő",
  intermediate: "Haladó",
  advanced: "Szakértő",
};

const TONE_LABELS: Record<PromptConfig["tone"], string> = {
  technical: "Technikai",
  business: "Üzleti",
  comprehensive: "Kimerítő",
  creative: "Kreatív",
  concise: "Tömör",
};

/**
 * 1. lépés: cél megadása. Desktopon (lg+) szerkesztői elrendezés oldalsávval,
 * telefonon/tableten chat-szerű nézet alsó beviteli sávval – a 2. és 3. lépéssel azonos nyelven.
 */
export const GoalView: React.FC<GoalViewProps> = ({
  userInput,
  onChangeUserInput,
  isEnhancing,
  onChangeEnhancing,
  promptConfig,
  onChangeConfig,
  onApplyPreset,
  onGenerate,
  onKeyDown,
  isGenerating,
  isCooldownActive,
  cooldownSeconds,
}) => {
  const canGenerate = Boolean(userInput.trim()) && !isGenerating && !isCooldownActive;

  const modeSwitch = (
    <div className="inline-flex p-1 bg-zinc-900/70 border border-zinc-800 rounded-xl gap-1">
      {([false, true] as const).map((enhance) => (
        <button
          key={String(enhance)}
          type="button"
          onClick={() => onChangeEnhancing(enhance)}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
            isEnhancing === enhance
              ? "bg-sky-500/20 text-sky-400 border border-sky-500/30"
              : "text-zinc-400 hover:text-zinc-200 border border-transparent"
          }`}
        >
          {enhance ? "Meglévő prompt átírása" : "Új prompt létrehozása"}
        </button>
      ))}
    </div>
  );

  const placeholder = isEnhancing
    ? "Másold be ide a meglévő promptodat, amit javítani szeretnél..."
    : "Pl. Egy modern, konverzió-optimalizált landing page-et szeretnék készíteni egy B2B SaaS szoftverhez...";

  const generateLabel = isGenerating ? (
    <>
      <div className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
      <span>Kérdések generálása...</span>
    </>
  ) : isCooldownActive ? (
    <>
      <RotateCcw className="w-4 h-4 animate-spin" />
      <span>Várakozás ({cooldownSeconds}s)</span>
    </>
  ) : (
    <>
      <Sparkles className="w-4 h-4" />
      <span>Kérdéssor generálása</span>
      <ArrowRight className="w-4 h-4" />
    </>
  );

  return (
    <>
      {/* ======================= DESKTOP (lg+) ======================= */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="hidden lg:grid grid-cols-[minmax(0,1fr)_300px] gap-12"
      >
        <div className="min-w-0 space-y-8">
          <header className="pb-8 border-b border-zinc-800/70">
            <h2 className="text-3xl font-semibold tracking-tight text-zinc-50">Mit szeretnél létrehozni?</h2>
            <p className="mt-2 text-base text-zinc-400 max-w-xl">
              Írd le, mit szeretnél elérni az AI modellel – a többit a pontosító kérdések és a végleges Mester
              Prompt oldják meg.
            </p>
          </header>

          <div className="space-y-4">
            {modeSwitch}
            <textarea
              rows={9}
              value={userInput}
              onChange={(e) => onChangeUserInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder={placeholder}
              className="w-full bg-zinc-950/80 border border-zinc-800 rounded-2xl p-5 text-base text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400/40 transition-all resize-y leading-relaxed"
            />
            <div className="flex items-center justify-between text-xs text-zinc-500 font-mono px-1">
              <span>{userInput.length} karakter</span>
              <span>Tipp: ⌘ + Enter a gyors indításhoz</span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-zinc-500">
              <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
              <span>Gyors sablonok</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => onApplyPreset(preset)}
                  className="px-3.5 py-2 rounded-xl bg-zinc-900/60 border border-zinc-800 hover:border-sky-500/50 hover:bg-zinc-900 text-sm text-zinc-300 hover:text-zinc-50 transition-all flex items-center gap-2"
                >
                  <span className="text-[10px] font-mono text-sky-400">{preset.badge}</span>
                  <span>{preset.label}</span>
                </button>
              ))}
            </div>
          </div>

          <PromptConfigPanel config={promptConfig} onChangeConfig={onChangeConfig} />
        </div>

        <aside className="self-start sticky top-6 space-y-6">
          <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-5 space-y-4">
            <div className="text-xs uppercase tracking-wider text-zinc-500">Beállítások</div>
            <dl className="space-y-2.5 text-sm">
              {[
                ["Mód", isEnhancing ? "Átírás" : "Új prompt"],
                ["Célnyelv", promptConfig.targetLanguage === "en" ? "Angol" : "Magyar"],
                ["Stílus", TONE_LABELS[promptConfig.tone]],
                ["Tudásszint", KNOWLEDGE_LABELS[promptConfig.knowledgeLevel]],
                ["Kérdés / kör", String(promptConfig.questionsCount)],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between">
                  <dt className="text-zinc-500">{k}</dt>
                  <dd className="text-zinc-100 font-medium">{v}</dd>
                </div>
              ))}
            </dl>
          </div>

          <button
            type="button"
            onClick={onGenerate}
            disabled={!canGenerate}
            className={`w-full px-5 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2.5 transition-all shadow-md ${
              canGenerate
                ? "bg-sky-500 hover:bg-sky-400 text-zinc-950 shadow-sky-500/20"
                : "bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700/50"
            }`}
          >
            {generateLabel}
          </button>
          <p className="text-xs text-zinc-500 flex items-start gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
            <span>A kérdések magyar nyelven, körönként {promptConfig.questionsCount} db jelennek meg.</span>
          </p>
        </aside>
      </motion.section>

      {/* ======================= TELEFON / TABLET (lg alatt) ======================= */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="lg:hidden pb-36 space-y-4"
      >
        <div className="flex items-start gap-2">
          <div className="w-8 h-8 rounded-full bg-sky-950 border border-sky-800/60 flex items-center justify-center text-sky-400 shrink-0">
            <Bot className="w-4 h-4" />
          </div>
          <div className="max-w-[85%] bg-zinc-900 border border-zinc-800 text-sm text-zinc-300 rounded-2xl rounded-tl-md px-3.5 py-2.5">
            Szia! Mit szeretnél létrehozni? Írd le a célodat alul, vagy válassz egy sablont – utána pár
            pontosító kérdést teszek fel.
          </div>
        </div>

        <div className="pl-10 space-y-3">
          <div className="flex gap-2 overflow-x-auto pb-1 -mr-4 pr-4 snap-x">
            {PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => onApplyPreset(preset)}
                className="shrink-0 snap-start px-3 py-2 rounded-2xl bg-zinc-900/70 border border-zinc-800 active:border-sky-500/60 text-xs text-zinc-300 flex items-center gap-1.5"
              >
                <span className="text-[10px] font-mono text-sky-400">{preset.badge}</span>
                <span>{preset.label}</span>
              </button>
            ))}
          </div>
          {modeSwitch}
        </div>

        <PromptConfigPanel config={promptConfig} onChangeConfig={onChangeConfig} />
      </motion.section>

      {/* Alsó beviteli sáv (telefon/tablet) */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-zinc-950/95 backdrop-blur-md border-t border-zinc-800 px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="flex items-end gap-2 max-w-4xl mx-auto">
          <textarea
            rows={2}
            value={userInput}
            onChange={(e) => onChangeUserInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={placeholder}
            className="flex-1 max-h-32 bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-sky-400 resize-none"
          />
          <button
            type="button"
            onClick={onGenerate}
            disabled={!canGenerate}
            aria-label="Kérdéssor generálása"
            className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 transition-colors ${
              canGenerate ? "bg-sky-500 text-zinc-950 active:bg-sky-400" : "bg-zinc-800 text-zinc-600"
            }`}
          >
            {isGenerating ? (
              <div className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
            ) : isCooldownActive ? (
              <span className="text-xs font-mono">{cooldownSeconds}</span>
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </>
  );
};
