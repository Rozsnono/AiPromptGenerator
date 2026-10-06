"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { QuestionItem, AnswersState, SelectedOptionKey } from "../app/types";
import { HelpCircle, Sparkles, Send, ArrowRight, RotateCcw, Filter, CheckCircle2 } from "lucide-react";

interface QuestionsViewProps {
  questions: QuestionItem[];
  answers: AnswersState;
  onSelectOption: (questionId: number, optionKey: "A" | "B" | "C") => void;
  onCustomTextChange: (questionId: number, text: string) => void;
  onGenerateMoreQuestions: () => void;
  onGenerateFinalPrompt: () => void;
  isGeneratingQuestions: boolean;
  isSynthesizingPrompt: boolean;
  isCooldownActive: boolean;
  cooldownSeconds: number;
  hasApiKey: boolean;
  additionalGuidelines: string;
  onAdditionalGuidelinesChange: (val: string) => void;
}

export const QuestionsView: React.FC<QuestionsViewProps> = ({
  questions,
  answers,
  onSelectOption,
  onCustomTextChange,
  onGenerateMoreQuestions,
  onGenerateFinalPrompt,
  isGeneratingQuestions,
  isSynthesizingPrompt,
  isCooldownActive,
  cooldownSeconds,
  hasApiKey,
  additionalGuidelines,
  onAdditionalGuidelinesChange,
}) => {
  const [filterMode, setFilterMode] = useState<"all" | "unanswered">("all");

  const totalCount = questions.length;
  const answeredCount = Object.keys(answers).filter((id) => {
    const ans = answers[Number(id)];
    if (!ans) return false;
    if (ans.selectedOption === "D") {
      return Boolean(ans.customText && ans.customText.trim().length > 0);
    }
    return true;
  }).length;

  const progressPercent = totalCount > 0 ? Math.round((answeredCount / totalCount) * 100) : 0;

  const filteredQuestions = questions.filter((q) => {
    if (filterMode === "unanswered") {
      const ans = answers[q.id];
      if (!ans) return true;
      if (ans.selectedOption === "D" && (!ans.customText || !ans.customText.trim())) {
        return true;
      }
      return false;
    }
    return true;
  });

  const canSynthesize = hasApiKey && !isSynthesizingPrompt && !isGeneratingQuestions && !isCooldownActive;

  return (
    <section className="space-y-6">
      {/* Questionnaire Header & Progress Bar */}
      <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-md shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-950/80 border border-sky-800/60 flex items-center justify-center text-sky-400 font-bold text-sm">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-white flex items-center gap-2">
                <span>Pontosító Kérdések</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-sky-950 text-sky-300 border border-sky-800/60 font-mono">
                  {totalCount} kérdés
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Válassz a lehetőségek közül, vagy írj be egyéni választ a pontosabb promptért!
              </p>
            </div>
          </div>

          {/* Filter options */}
          <div className="flex items-center gap-2 self-start sm:self-auto bg-zinc-950/80 p-1 rounded-xl border border-zinc-800">
            <button
              type="button"
              onClick={() => setFilterMode("all")}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                filterMode === "all"
                  ? "bg-zinc-800 text-white shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Összes ({totalCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode("unanswered")}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                filterMode === "unanswered"
                  ? "bg-zinc-800 text-white shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Megválaszolatlan ({totalCount - answeredCount})
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />
              <span>Megválaszolva: <strong className="text-white font-mono">{answeredCount}</strong> / {totalCount}</span>
            </span>
            <span className="font-mono text-sky-400 font-semibold">{progressPercent}%</span>
          </div>
          <div className="w-full h-2 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800/80">
            <div
              className="h-full bg-gradient-to-r from-sky-500 to-indigo-500 transition-all duration-300 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Questions list */}
      <div className="space-y-4">
        {filteredQuestions.length === 0 ? (
          <div className="p-8 text-center bg-zinc-900/40 border border-zinc-800/60 rounded-2xl text-zinc-400 space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
            <p className="text-sm font-semibold text-zinc-200">Minden kérdésre válaszoltál!</p>
            <p className="text-xs text-zinc-500">
              Készen állsz a végleges Master Prompt generálására, vagy kérhetsz további kérdéseket is.
            </p>
          </div>
        ) : (
          filteredQuestions.map((q) => {
            const currentAnswer = answers[q.id];
            const selectedOpt = currentAnswer?.selectedOption;
            const isCustomSelected = selectedOpt === "D";
            const actualIndex = questions.findIndex((item) => item.id === q.id);

            return (
              <motion.div
                key={q.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-5 hover:border-zinc-700/80 transition-all shadow-sm space-y-4"
              >
                {/* Question Header */}
                <div className="flex items-start gap-3 flex-wrap w-full">
                  <span className="text-xs font-mono font-bold px-2 py-1 rounded-lg bg-zinc-800/90 text-sky-400 border border-zinc-700/70 shrink-0 mt-0.5">
                    #{actualIndex + 1}
                  </span>
                  <div className="flex-1 min-w-[200px]">
                    <h3 className="text-sm sm:text-base font-medium text-zinc-100 leading-snug">
                      {q.question}
                    </h3>
                  </div>
                  {selectedOpt && (
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-800/50 shrink-0">
                      Kiválasztva: {selectedOpt}
                    </span>
                  )}
                </div>

                {/* Predefined Options A, B, C */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                  {(["A", "B", "C"] as const).map((letter) => {
                    const isSelected = selectedOpt === letter;
                    const optionText = q.options[letter];

                    return (
                      <button
                        key={letter}
                        type="button"
                        onClick={() => onSelectOption(q.id, letter)}
                        className={`flex flex-col text-left p-3.5 rounded-xl border transition-all relative overflow-hidden group ${
                          isSelected
                            ? "bg-sky-950/40 border-sky-400/90 text-white shadow-sm ring-1 ring-sky-400/30"
                            : "bg-zinc-950/60 border-zinc-800/90 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-900/60"
                        }`}
                      >
                        <div className="flex items-center justify-between w-full mb-1.5">
                          <span
                            className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded ${
                              isSelected
                                ? "bg-sky-400 text-zinc-950"
                                : "bg-zinc-800 text-zinc-400 group-hover:text-zinc-200"
                            }`}
                          >
                            {letter}
                          </span>
                          <div
                            className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center transition-colors ${
                              isSelected
                                ? "border-sky-400 bg-sky-400 text-zinc-950"
                                : "border-zinc-700 bg-zinc-900"
                            }`}
                          >
                            {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-zinc-950" />}
                          </div>
                        </div>
                        <span className="text-xs sm:text-sm leading-relaxed text-zinc-300">
                          {optionText}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Option D: Custom Answer Input */}
                <div
                  className={`p-3 rounded-xl border transition-all ${
                    isCustomSelected
                      ? "bg-indigo-950/30 border-indigo-500/80 shadow-sm ring-1 ring-indigo-500/30"
                      : "bg-zinc-950/50 border-zinc-800/80 hover:border-zinc-700/60"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <span
                      className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded ${
                        isCustomSelected
                          ? "bg-indigo-400 text-zinc-950"
                          : "bg-zinc-800 text-zinc-400"
                      }`}
                    >
                      D
                    </span>
                    <span className="text-xs font-medium text-zinc-300">
                      Egyéni válasz (ha egyik fenti sem fedi le pontosan):
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    placeholder="Írd be a saját válaszodat..."
                    value={currentAnswer?.customText || ""}
                    onChange={(e) => onCustomTextChange(q.id, e.target.value)}
                    onFocus={() => {
                      if (selectedOpt !== "D") {
                        onCustomTextChange(q.id, currentAnswer?.customText || "");
                      }
                    }}
                    className={`w-full bg-zinc-950 border rounded-lg px-3 py-2 text-xs sm:text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none transition-all resize-y ${
                      isCustomSelected
                        ? "border-indigo-400/80 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
                        : "border-zinc-800 focus:border-sky-400"
                    }`}
                  />
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Additional Guidelines (Irányelvek) */}
      <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-5 shadow-sm space-y-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-sky-400" />
          <h3 className="text-sm font-semibold text-zinc-100">További irányelvek, megjegyzések</h3>
        </div>
        <p className="text-xs text-zinc-400">
          Van olyan szempont, amire nem kérdezett rá a rendszer, vagy amit mindenképp szeretnél belefoglalni a promptba?
        </p>
        <textarea
          rows={3}
          placeholder="Pl. Fontos, hogy a válasz lépésről lépésre legyen levezetve, és legyen benne egy humoros megjegyzés is..."
          value={additionalGuidelines}
          onChange={(e) => onAdditionalGuidelinesChange(e.target.value)}
          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs sm:text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400/40 transition-all resize-y"
        />
      </div>

      {/* Action Footer for Step 2 */}
      <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-zinc-800/80">
        <button
          type="button"
          onClick={onGenerateMoreQuestions}
          disabled={isGeneratingQuestions || isSynthesizingPrompt || isCooldownActive || !hasApiKey}
          className={`w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 border transition-all ${
            isGeneratingQuestions || isSynthesizingPrompt || isCooldownActive || !hasApiKey
              ? "bg-zinc-900 text-zinc-600 border-zinc-800 cursor-not-allowed"
              : "bg-zinc-900/90 border-zinc-700 text-zinc-200 hover:border-sky-500/50 hover:text-white"
          }`}
        >
          {isGeneratingQuestions ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
              <span>Újabb kérdések generálása...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-sky-400" />
              <span>+ További kérdések kérése</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={onGenerateFinalPrompt}
          disabled={!canSynthesize}
          className={`w-full sm:w-auto px-7 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2.5 transition-all shadow-md ${
            !canSynthesize
              ? "bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700/50"
              : "bg-sky-500 hover:bg-sky-400 text-zinc-950 shadow-sky-500/20 hover:scale-[1.01]"
          }`}
        >
          {isSynthesizingPrompt ? (
            <>
              <div className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
              <span>Mester Prompt szintetizálása...</span>
            </>
          ) : isCooldownActive ? (
            <>
              <RotateCcw className="w-4 h-4 animate-spin" />
              <span>Várakozás ({cooldownSeconds}s)</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>Végleges Mester Prompt Generálása</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </section>
  );
};
