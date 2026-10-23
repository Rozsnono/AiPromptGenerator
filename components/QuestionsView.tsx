"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { QuestionItem, AnswersState } from "../app/types";
import {
  isAnswered,
  selectedLetters,
  isQuestionLocked,
  isQuestionClosed,
  isCustomAnswer,
  isMultiAnswer,
} from "../app/answers";
import {
  Sparkles,
  Send,
  ArrowRight,
  RotateCcw,
  Filter,
  CheckCircle2,
  PlusCircle,
  Flag,
  Lock,
  Check,
  AlertTriangle,
  Clock,
  RotateCw,
} from "lucide-react";
import { ConfirmFinalModal } from "./ConfirmFinalModal";

/** A desktop (QuestionsView) és a mobil (QuestionsMobileChat) nézet közös propjai. */
export interface QuestionsViewProps {
  questions: QuestionItem[];
  answers: AnswersState;
  goalText: string;
  onSelectOption: (questionId: number, optionKey: "A" | "B" | "C") => void;
  onCustomTextChange: (questionId: number, text: string) => void;
  onExtraTextChange: (questionId: number, text: string) => void;
  onGenerateMoreQuestions: () => void;
  onGenerateFinalPrompt: () => void;
  isGeneratingQuestions: boolean;
  isSynthesizingPrompt: boolean;
  isCooldownActive: boolean;
  cooldownSeconds: number;
  hasApiKey: boolean;
  guidelines: Record<number, string>;
  onGuidelineChange: (questionId: number, val: string) => void;
  roundEnds: number[];
  /** "Később visszatérek" jelölésű kérdések azonosítói. */
  revisitIds: number[];
  onToggleRevisit: (questionId: number) => void;
  /** Lezárt körből újratárgyalásra feloldott kérdések azonosítói. */
  reopenedIds: number[];
  onToggleReopen: (questionId: number) => void;
}

/**
 * Desktop nézet (lg és felette): szerkesztői, tágas elrendezés nagy kérdésekkel,
 * jobb oldalon fix oldalsávval (haladás, cél, kérdés-navigáció, műveletek).
 */
export const QuestionsView: React.FC<QuestionsViewProps> = ({
  questions,
  answers,
  goalText,
  onSelectOption,
  onCustomTextChange,
  onExtraTextChange,
  onGenerateMoreQuestions,
  onGenerateFinalPrompt,
  isGeneratingQuestions,
  isSynthesizingPrompt,
  isCooldownActive,
  cooldownSeconds,
  hasApiKey,
  guidelines,
  onGuidelineChange,
  roundEnds,
  revisitIds,
  onToggleRevisit,
  reopenedIds,
  onToggleReopen,
}) => {
  const [filterMode, setFilterMode] = useState<"all" | "unanswered" | "revisit">("all");
  const [showConfirm, setShowConfirm] = useState(false);

  const totalCount = questions.length;
  const answeredCount = questions.filter((q) => isAnswered(answers[q.id])).length;
  const progressPercent = totalCount > 0 ? Math.round((answeredCount / totalCount) * 100) : 0;

  const filteredQuestions = questions.filter((q) => {
    if (filterMode === "unanswered") return !isAnswered(answers[q.id]);
    if (filterMode === "revisit") return revisitIds.includes(q.id);
    return true;
  });

  // Számlálók az oldalsáv jelmagyarázatához és a megerősítő ablakhoz
  const criticalCount = questions.filter((q) => q.isCritical).length;
  const newCount = questions.filter((q) => q.isNew).length;
  const revisitCount = questions.filter((q) => revisitIds.includes(q.id)).length;
  const reopenedCount = questions.filter((q) => isQuestionClosed(q.id, roundEnds) && reopenedIds.includes(q.id)).length;
  const customCount = questions.filter((q) => isCustomAnswer(answers[q.id])).length;
  const multiCount = questions.filter((q) => isMultiAnswer(answers[q.id])).length;
  const criticalUnanswered = questions.filter((q) => q.isCritical && !isAnswered(answers[q.id])).length;

  const busy = isGeneratingQuestions || isSynthesizingPrompt || isCooldownActive;
  const canSynthesize = hasApiKey && !busy;

  const scrollToQuestion = (id: number) => {
    setFilterMode("all");
    // a szűrő visszaváltása után kell a DOM-nak frissülnie
    setTimeout(() => {
      document.getElementById(`q-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 30);
  };

  return (
    <section className="grid grid-cols-[minmax(0,1fr)_300px] gap-12">
      {/* ---------------- Fő oszlop: kérdések ---------------- */}
      <div className="min-w-0">
        <header className="pb-8 border-b border-zinc-800/70">
          <h2 className="text-3xl font-semibold tracking-tight text-zinc-50">Pontosító kérdések</h2>
          <p className="mt-2 text-base text-zinc-400 max-w-xl">
            Válassz egy lehetőséget, egészítsd ki, vagy írd le saját szavaiddal – minél pontosabb vagy,
            annál jobb lesz a végleges prompt.
          </p>
        </header>

        {filteredQuestions.length === 0 ? (
          <div className="py-16 text-center text-zinc-400 space-y-2">
            <CheckCircle2 className="w-9 h-9 text-emerald-400 mx-auto" />
            <p className="text-base font-semibold text-zinc-200">Minden kérdésre válaszoltál!</p>
            <p className="text-sm text-zinc-500">
              Generálhatod a végleges Mester Promptot, vagy kérhetsz további kérdéseket.
            </p>
          </div>
        ) : (
          filteredQuestions.map((q) => {
            const currentAnswer = answers[q.id];
            const letters = selectedLetters(currentAnswer);
            const isCustomSelected = currentAnswer?.selectedOption === "D";
            const closed = isQuestionClosed(q.id, roundEnds);
            const reopened = closed && reopenedIds.includes(q.id);
            const locked = isQuestionLocked(q.id, roundEnds, reopenedIds);
            const actualIndex = questions.findIndex((item) => item.id === q.id);
            const isRoundEnd = roundEnds.includes(q.id) || q.id === questions[questions.length - 1].id;

            return (
              <React.Fragment key={q.id}>
                <motion.article
                  id={`q-${q.id}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`scroll-mt-6 py-9 border-b border-zinc-800/60 space-y-5 ${locked ? "opacity-75" : ""}`}
                >
                  <div className="flex items-start gap-5">
                    <span className="font-mono text-3xl font-light text-zinc-600 leading-none pt-1 w-12 shrink-0">
                      {String(actualIndex + 1).padStart(2, "0")}
                    </span>
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-start justify-between gap-4">
                        <h3 className="flex-1 min-w-0 text-xl font-medium text-zinc-100 leading-snug">{q.question}</h3>
                        <div className="shrink-0 flex items-center gap-1.5">
                        {closed && (
                          <button
                            type="button"
                            onClick={() => onToggleReopen(q.id)}
                            aria-pressed={reopened}
                            title={reopened ? "Újratárgyalás – kattints a visszazáráshoz" : "Újratárgyalás – lezárt kör kérdésének újranyitása"}
                            aria-label="Újratárgyalás"
                            className={`w-8 h-8 flex items-center justify-center rounded-lg border transition-all ${
                              reopened
                                ? "bg-amber-950/40 border-amber-500/60 text-amber-300"
                                : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-600"
                            }`}
                          >
                            <RotateCw className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onToggleRevisit(q.id)}
                          disabled={locked}
                          aria-pressed={revisitIds.includes(q.id)}
                          title={revisitIds.includes(q.id) ? "Később visszatérek – kattints a jelölés törléséhez" : "Később visszatérek – jelöld meg a kérdést"}
                          aria-label="Később visszatérek"
                          className={`w-8 h-8 flex items-center justify-center rounded-lg border transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                            revisitIds.includes(q.id)
                              ? "bg-sky-950/50 border-sky-500/60 text-sky-300"
                              : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-600"
                          }`}
                        >
                          <Clock className="w-4 h-4" />
                        </button>
                        </div>
                      </div>
                      {locked && (
                        <div className="inline-flex items-center gap-1.5 mr-2 text-xs text-zinc-400 bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5">
                          <Lock className="w-3.5 h-3.5" />
                          <span>Lezárt kör – nem módosítható</span>
                        </div>
                      )}
                      {reopened && (
                        <div className="inline-flex items-center gap-1.5 mr-2 text-xs text-amber-300 bg-amber-950/30 border border-amber-800/50 rounded-lg px-2.5 py-1.5">
                          <RotateCw className="w-3.5 h-3.5" />
                          <span>Újratárgyalás alatt – a válasz módosítható</span>
                        </div>
                      )}
                      {q.isCritical && (
                        <div className="inline-flex items-start gap-1.5 mr-2 text-xs text-rose-300 bg-rose-950/30 border border-rose-800/50 rounded-lg px-2.5 py-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                          <span>
                            <strong className="font-semibold">Kritikus téma</strong>
                            {q.criticalReason ? ` – ${q.criticalReason}` : " – ez erősen befolyásolja a végleges promptot."}
                          </span>
                        </div>
                      )}
                      {q.isNew && (
                        <div className="inline-flex items-start gap-1.5 text-xs text-amber-300 bg-amber-950/30 border border-amber-800/50 rounded-lg px-2.5 py-1.5">
                          <Flag className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                          <span>
                            <strong className="font-semibold">Új téma</strong>
                            {q.newReason ? ` – ${q.newReason}` : " – korábban még nem szerepelt."}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pl-[68px] space-y-4">
                    {/* A / B / C opciók (több is kijelölhető) */}
                    {!locked && (
                      <div className="text-xs text-zinc-500">Több opció is kijelölhető.</div>
                    )}
                    <div className="grid grid-cols-3 gap-3">
                      {(["A", "B", "C"] as const).map((letter) => {
                        const isSelected = letters.includes(letter);
                        return (
                          <button
                            key={letter}
                            type="button"
                            onClick={() => onSelectOption(q.id, letter)}
                            disabled={locked}
                            aria-pressed={isSelected}
                            className={`text-left p-4 rounded-2xl border transition-all group disabled:cursor-not-allowed ${
                              isSelected
                                ? "bg-sky-950/40 border-sky-400/80 text-zinc-50 ring-1 ring-sky-400/30"
                                : "bg-zinc-900/40 border-zinc-800 text-zinc-300 hover:border-zinc-600 hover:bg-zinc-900/70"
                            }`}
                          >
                            <span className="flex items-center justify-between mb-2">
                              <span
                                className={`inline-block text-xs font-mono font-bold px-1.5 py-0.5 rounded ${
                                  isSelected
                                    ? "bg-sky-400 text-zinc-950"
                                    : "bg-zinc-800 text-zinc-400 group-hover:text-zinc-200"
                                }`}
                              >
                                {letter}
                              </span>
                              <span
                                className={`w-4 h-4 rounded border flex items-center justify-center ${
                                  isSelected ? "bg-sky-400 border-sky-400 text-zinc-950" : "border-zinc-700"
                                }`}
                              >
                                {isSelected && <Check className="w-3 h-3" />}
                              </span>
                            </span>
                            <span className="block text-sm leading-relaxed">{q.options[letter]}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Kiegészítés a kiválasztott A/B/C válaszhoz */}
                    {letters.length > 0 && (

                      <div className="space-y-1.5">
                        {currentAnswer?.extraText === undefined ? (
                          <button
                            type="button"
                            onClick={() => onExtraTextChange(q.id, "")}
                            disabled={locked}
                            className="disabled:hidden flex items-center gap-1.5 text-sm text-sky-400 hover:text-sky-300"
                          >
                            <PlusCircle className="w-4 h-4" />
                            <span>Ez a válasz, de kiegészíteném…</span>
                          </button>
                        ) : (
                          <>
                            <label className="text-xs font-medium text-zinc-400">
                              Kiegészítés a(z) {letters.join(", ")} válaszhoz
                            </label>
                            <textarea
                              rows={2}
                              placeholder="Pl. ...de ezen belül legyen kiemelt a..."
                              value={currentAnswer.extraText}
                              disabled={locked}
                              onChange={(e) => onExtraTextChange(q.id, e.target.value)}
                              className="w-full bg-zinc-950 border border-sky-800/60 rounded-xl px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-sky-400 transition-all resize-y"
                            />
                          </>
                        )}
                      </div>
                    )}

                    {/* D: egyéni válasz */}
                    <div className="space-y-1.5">
                      <label className="flex items-center gap-2 text-xs font-medium text-zinc-400">
                        <span
                          className={`font-mono font-bold px-1.5 py-0.5 rounded ${
                            isCustomSelected ? "bg-indigo-400 text-zinc-950" : "bg-zinc-800 text-zinc-400"
                          }`}
                        >
                          D
                        </span>
                        <span>Vagy írd le saját szavaiddal</span>
                      </label>
                      <textarea
                        rows={2}
                        placeholder="Írd be a saját válaszodat..."
                        value={currentAnswer?.customText || ""}
                        disabled={locked}
                        onChange={(e) => onCustomTextChange(q.id, e.target.value)}
                        className={`w-full bg-zinc-950 border rounded-xl px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none transition-all resize-y ${
                          isCustomSelected
                            ? "border-indigo-400/80 focus:border-indigo-400 ring-1 ring-indigo-500/30"
                            : "border-zinc-800 focus:border-sky-400"
                        }`}
                      />
                    </div>
                  </div>
                </motion.article>

                {isRoundEnd && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="my-8 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6 space-y-3"
                  >
                    <div className="flex items-center gap-2">
                      <Filter className="w-4 h-4 text-sky-400" />
                      <h3 className="text-sm font-semibold text-zinc-100">
                        További irányelvek, megjegyzések ehhez a körhöz
                      </h3>
                    </div>
                    <p className="text-sm text-zinc-400">
                      Van olyan szempont, amire nem kérdezett rá a rendszer ebben a blokkban, vagy amit még
                      hozzáadnál? Ezt figyelembe veszi a következő kérdéseknél és a véglegesítésnél is.
                    </p>
                    <textarea
                      rows={3}
                      placeholder="Pl. Fontos, hogy a válasz lépésről lépésre legyen levezetve..."
                      value={guidelines[q.id] || ""}
                      disabled={locked}
                      onChange={(e) => onGuidelineChange(q.id, e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-sky-400 transition-all resize-y"
                    />
                  </motion.div>
                )}
              </React.Fragment>
            );
          })
        )}
      </div>

      {/* ---------------- Oldalsáv ---------------- */}
      <aside className="self-start sticky top-6 space-y-6">
        <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-5 space-y-4">
          <div className="flex items-end justify-between">
            <div>
              <div className="text-xs uppercase tracking-wider text-zinc-500">Haladás</div>
              <div className="text-3xl font-semibold text-zinc-50 font-mono">
                {answeredCount}
                <span className="text-zinc-600"> / {totalCount}</span>
              </div>
            </div>
            <span className="font-mono text-sky-400 font-semibold">{progressPercent}%</span>
          </div>
          <div className="w-full h-1.5 bg-zinc-950 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-sky-500 to-indigo-500 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {goalText.trim() && (
            <div className="pt-3 border-t border-zinc-800/70">
              <div className="text-xs uppercase tracking-wider text-zinc-500 mb-1">Cél</div>
              <p className="text-sm text-zinc-300 line-clamp-4">{goalText}</p>
            </div>
          )}
        </div>

        {/* Kérdés-navigáció */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-zinc-500">Kérdések</span>
            <div className="flex items-center gap-1 bg-zinc-950/80 p-0.5 rounded-lg border border-zinc-800">
              {(["all", "unanswered", "revisit"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setFilterMode(mode)}
                  className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-all ${
                    filterMode === mode ? "bg-zinc-800 text-zinc-50" : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  {mode === "all"
                    ? "Mind"
                    : mode === "unanswered"
                    ? `Nyitott (${totalCount - answeredCount})`
                    : `Később (${revisitCount})`}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {questions.map((q, idx) => {
              const done = isAnswered(answers[q.id]);
              const revisit = revisitIds.includes(q.id);
              const custom = isCustomAnswer(answers[q.id]);
              const multi = isMultiAnswer(answers[q.id]);
              const reopenedQ = isQuestionClosed(q.id, roundEnds) && reopenedIds.includes(q.id);
              const hints = [
                q.isCritical && "kritikus téma",
                q.isNew && "új téma",
                revisit && "később visszatérek",
                custom && "egyéni válasz",
                multi && "több kijelölt válasz",
                reopenedQ && "újratárgyalás alatt",
              ].filter(Boolean);
              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => scrollToQuestion(q.id)}
                  title={`${q.question}${hints.length ? ` (${hints.join(", ")})` : ""}`}
                  className={`relative w-10 h-10 rounded-lg text-xs font-mono font-semibold border transition-all ${
                    q.isCritical
                      ? "border-rose-500/60"
                      : done
                      ? "border-sky-500/40"
                      : "border-zinc-800 hover:border-zinc-600"
                  } ${done ? "bg-sky-500/15 text-sky-300" : "bg-zinc-900 text-zinc-500"}`}
                >
                  {idx + 1}
                  {/* Jobb felső sarok: kritikus / új téma / később */}
                  <span className="absolute -top-1.5 -right-1.5 flex gap-0.5">
                    {q.isCritical && (
                      <span className="w-3.5 h-3.5 rounded-full bg-rose-500 text-white text-[9px] leading-none flex items-center justify-center font-bold">
                        !
                      </span>
                    )}
                    {q.isNew && <span className="w-3.5 h-3.5 rounded-full bg-amber-400 border border-zinc-950" />}
                    {revisit && (
                      <span className="w-3.5 h-3.5 rounded-full bg-sky-500 text-white flex items-center justify-center">
                        <Clock className="w-2.5 h-2.5" />
                      </span>
                    )}
                  </span>
                  {reopenedQ && (
                    <span className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 rounded-full bg-amber-500 text-white flex items-center justify-center">
                      <RotateCw className="w-2.5 h-2.5" />
                    </span>
                  )}
                  {/* Bal alsó sarok: egyéni / több válasz */}
                  {(custom || multi) && (
                    <span
                      className={`absolute -bottom-1.5 -left-1.5 min-w-[14px] h-3.5 px-0.5 rounded text-[9px] leading-none flex items-center justify-center font-bold ${
                        custom ? "bg-indigo-500 text-white" : "bg-emerald-500 text-white"
                      }`}
                    >
                      {custom ? "D" : `×${selectedLetters(answers[q.id]).length}`}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Jelmagyarázat (csak a ténylegesen előforduló jelölések) */}
          <ul className="space-y-1 text-[11px] text-zinc-500">
            {criticalCount > 0 && (
              <li className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-full bg-rose-500 text-white text-[9px] flex items-center justify-center font-bold">!</span>
                kritikus téma ({criticalCount})
              </li>
            )}
            {newCount > 0 && (
              <li className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-full bg-amber-400" /> új téma ({newCount})
              </li>
            )}
            {revisitCount > 0 && (
              <li className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-full bg-sky-500 text-white flex items-center justify-center">
                  <Clock className="w-2.5 h-2.5" />
                </span>
                később visszatérek ({revisitCount})
              </li>
            )}
            {reopenedCount > 0 && (
              <li className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-full bg-amber-500 text-white flex items-center justify-center">
                  <RotateCw className="w-2.5 h-2.5" />
                </span>
                újratárgyalás alatt ({reopenedCount})
              </li>
            )}
            {customCount > 0 && (
              <li className="flex items-center gap-1.5">
                <span className="min-w-[14px] h-3.5 px-0.5 rounded bg-indigo-500 text-white text-[9px] flex items-center justify-center font-bold">D</span>
                egyéni válasz ({customCount})
              </li>
            )}
            {multiCount > 0 && (
              <li className="flex items-center gap-1.5">
                <span className="min-w-[14px] h-3.5 px-0.5 rounded bg-emerald-500 text-white text-[9px] flex items-center justify-center font-bold">×2</span>
                több kijelölt válasz ({multiCount})
              </li>
            )}
          </ul>
        </div>

        {/* Műveletek */}
        <div className="space-y-2.5">
          <button
            type="button"
            onClick={() => setShowConfirm(true)}
            disabled={!canSynthesize}
            className={`w-full px-5 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2.5 transition-all shadow-md ${
              !canSynthesize
                ? "bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700/50"
                : "bg-sky-500 hover:bg-sky-400 text-zinc-950 shadow-sky-500/20"
            }`}
          >
            {isSynthesizingPrompt ? (
              <>
                <div className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                <span>Szintetizálás...</span>
              </>
            ) : isCooldownActive ? (
              <>
                <RotateCcw className="w-4 h-4 animate-spin" />
                <span>Várakozás ({cooldownSeconds}s)</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Mester Prompt generálása</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onGenerateMoreQuestions}
            disabled={busy || !hasApiKey}
            className={`w-full px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 border transition-all ${
              busy || !hasApiKey
                ? "bg-zinc-900 text-zinc-600 border-zinc-800 cursor-not-allowed"
                : "bg-zinc-900/90 border-zinc-700 text-zinc-200 hover:border-sky-500/50 hover:text-zinc-50"
            }`}
          >
            {isGeneratingQuestions ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
                <span>Újabb kérdések...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-sky-400" />
                <span>+ További kérdések kérése</span>
              </>
            )}
          </button>
        </div>
      </aside>

      <ConfirmFinalModal
        open={showConfirm}
        answeredCount={answeredCount}
        totalCount={totalCount}
        criticalUnanswered={criticalUnanswered}
        revisitCount={revisitCount}
        onCancel={() => setShowConfirm(false)}
        onConfirm={() => {
          setShowConfirm(false);
          onGenerateFinalPrompt();
        }}
      />
    </section>
  );
};
