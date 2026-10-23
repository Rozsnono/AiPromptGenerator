"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Bot, Send, Sparkles, Flag, PlusCircle, Pencil, RotateCcw, ArrowRight } from "lucide-react";
import { QuestionsViewProps } from "./QuestionsView";
import { isAnswered, displayAnswerText } from "../app/answers";
import { ConfirmFinalModal } from "./ConfirmFinalModal";

/**
 * Mobil / tablet nézet (lg alatt): chat-szerű kérdezés. A kérdések asszisztens-buborékként
 * jönnek egymás után, a válaszok felhasználói buborékok. Alul a saját (D) válasz írására
 * szolgáló mező van; ha minden megvan, a műveletgombok.
 */
export const QuestionsMobileChat: React.FC<QuestionsViewProps> = ({
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
}) => {
  const [composerText, setComposerText] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const totalCount = questions.length;
  const answeredCount = questions.filter((q) => isAnswered(answers[q.id])).length;
  const progressPercent = totalCount > 0 ? Math.round((answeredCount / totalCount) * 100) : 0;

  // Az első megválaszolatlan kérdés indexe; ha nincs, minden kérdés megvan.
  const firstOpen = questions.findIndex((q) => !isAnswered(answers[q.id]));
  const activeIndex = firstOpen === -1 ? totalCount : firstOpen;
  const editingIndex = editingId === null ? -1 : questions.findIndex((q) => q.id === editingId);
  // Amelyik kérdésre épp válaszolni lehet (aktív, vagy szerkesztés alatt álló)
  const targetQuestion = editingIndex !== -1 ? questions[editingIndex] : questions[activeIndex];

  const busy = isGeneratingQuestions || isSynthesizingPrompt || isCooldownActive;
  const canSynthesize = hasApiKey && !busy;

  // Új kérdésnél / válasznál a szál aljára görgetünk
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [activeIndex, totalCount, editingId]);

  const sendCustom = () => {
    const text = composerText.trim();
    if (!text || !targetQuestion) return;
    onCustomTextChange(targetQuestion.id, text);
    setComposerText("");
    setEditingId(null);
  };

  const chooseOption = (id: number, letter: "A" | "B" | "C") => {
    onSelectOption(id, letter);
    setEditingId(null);
  };

  const visibleQuestions = questions.slice(0, Math.min(activeIndex + 1, totalCount));

  return (
    <section className="relative pb-44">
      {/* Fix fejléc: haladás + generálás */}
      <div className="sticky top-0 z-20 -mx-1 px-1 pt-2 pb-3 bg-background/90 backdrop-blur-md">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs text-zinc-400">
              Megválaszolva{" "}
              <strong className="font-mono text-zinc-50">
                {answeredCount}/{totalCount}
              </strong>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowConfirm(true)}
            disabled={!canSynthesize}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
              canSynthesize
                ? "bg-sky-500 text-zinc-950 active:bg-sky-400"
                : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>Generálás</span>
          </button>
        </div>
        <div className="mt-2 h-1 bg-zinc-900 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-sky-500 to-indigo-500 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <div className="space-y-4 pt-2">
        {/* Bevezető: az asszisztens üdvözlése + a felhasználó célja */}
        <Bubble side="bot">
          Szia! Néhány pontosító kérdést teszek fel a promptodhoz. Koppints egy válaszra, vagy írd le saját
          szavaiddal alul.
        </Bubble>
        {goalText.trim() && (
          <Bubble side="user">
            <span className="line-clamp-3">{goalText}</span>
          </Bubble>
        )}

        {visibleQuestions.map((q, idx) => {
          const ans = answers[q.id];
          const answered = isAnswered(ans);
          const isEditing = editingId === q.id;
          const showOptions = !answered || isEditing;
          const isRoundEnd = roundEnds.includes(q.id) || q.id === questions[questions.length - 1].id;

          return (
            <React.Fragment key={q.id}>
              {/* Kérdés (asszisztens) */}
              <Bubble side="bot">
                <div className="text-[11px] font-mono text-zinc-500 mb-1">#{idx + 1}</div>
                <div className="text-[15px] leading-snug text-zinc-100">{q.question}</div>
                {q.isNew && (
                  <div className="mt-2 flex items-start gap-1.5 text-[11px] text-amber-300 bg-amber-950/30 border border-amber-800/50 rounded-lg px-2 py-1.5">
                    <Flag className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>
                      <strong className="font-semibold">Új téma</strong>
                      {q.newReason ? ` – ${q.newReason}` : " – korábban még nem szerepelt."}
                    </span>
                  </div>
                )}
              </Bubble>

              {/* Válaszlehetőségek */}
              {showOptions && (
                <div className="pl-10 space-y-2">
                  {(["A", "B", "C"] as const).map((letter) => (
                    <button
                      key={letter}
                      type="button"
                      onClick={() => chooseOption(q.id, letter)}
                      className="w-full text-left flex items-start gap-3 p-3.5 rounded-2xl border border-zinc-800 bg-zinc-900/60 active:bg-sky-950/50 active:border-sky-500/60 transition-colors"
                    >
                      <span className="text-xs font-mono font-bold px-1.5 py-0.5 rounded bg-zinc-800 text-sky-400 shrink-0">
                        {letter}
                      </span>
                      <span className="text-sm leading-relaxed text-zinc-200">{q.options[letter]}</span>
                    </button>
                  ))}
                  <div className="text-[11px] text-zinc-500 px-1">
                    …vagy írd le saját szavaiddal lent.
                  </div>
                </div>
              )}

              {/* Válasz (felhasználó) */}
              {answered && !isEditing && (
                <div className="flex flex-col items-end gap-1.5">
                  <Bubble side="user">
                    <div className="text-[11px] font-mono text-white/70 mb-0.5">{ans!.selectedOption}</div>
                    <div>{displayAnswerText(q, ans)}</div>
                    {ans!.selectedOption !== "D" && ans!.extraText?.trim() && (
                      <div className="mt-1.5 pt-1.5 border-t border-white/25 text-[13px] text-white/90">
                        + {ans!.extraText}
                      </div>
                    )}
                  </Bubble>

                  {ans!.selectedOption !== "D" && ans!.extraText !== undefined && (
                    <textarea
                      rows={2}
                      autoFocus={ans!.extraText === ""}
                      placeholder="Kiegészítés a válaszhoz..."
                      value={ans!.extraText}
                      onChange={(e) => onExtraTextChange(q.id, e.target.value)}
                      className="w-[85%] bg-zinc-950 border border-sky-800/60 rounded-2xl px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-sky-400 resize-none"
                    />
                  )}

                  <div className="flex items-center gap-3 text-[11px] text-zinc-500">
                    {ans!.selectedOption !== "D" && ans!.extraText === undefined && (
                      <button
                        type="button"
                        onClick={() => onExtraTextChange(q.id, "")}
                        className="flex items-center gap-1 text-sky-400 active:text-sky-300"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        Kiegészítem
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setEditingId(q.id)}
                      className="flex items-center gap-1 active:text-zinc-300"
                    >
                      <Pencil className="w-3 h-3" />
                      Módosítom
                    </button>
                  </div>
                </div>
              )}

              {/* Irányelv a kör végén (csak ha a kérdés már megvan) */}
              {isRoundEnd && answered && idx < activeIndex && (
                <Bubble side="bot">
                  <div className="text-sm text-zinc-200 mb-2">
                    Van még olyan szempont ehhez a körhöz, amit hozzáadnál?
                  </div>
                  <textarea
                    rows={2}
                    placeholder="Pl. Legyen lépésről lépésre levezetve..."
                    value={guidelines[q.id] || ""}
                    onChange={(e) => onGuidelineChange(q.id, e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-sky-400 resize-none"
                  />
                </Bubble>
              )}
            </React.Fragment>
          );
        })}

        {activeIndex === totalCount && (
          <Bubble side="bot">
            Kész vagy! 🎉 Generálhatod a végleges Mester Promptot, vagy kérhetsz még kérdéseket.
          </Bubble>
        )}
        <div ref={endRef} />
      </div>

      {/* Alsó sáv: saját válasz írása / műveletek */}
      <div className="fixed bottom-0 inset-x-0 z-30 bg-zinc-950/95 backdrop-blur-md border-t border-zinc-800 px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        {targetQuestion ? (
          <div className="flex items-end gap-2 max-w-4xl mx-auto">
            <textarea
              rows={1}
              value={composerText}
              onChange={(e) => setComposerText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendCustom();
                }
              }}
              placeholder={
                editingIndex !== -1 ? "Új saját válasz erre a kérdésre..." : "Saját válasz (D)..."
              }
              className="flex-1 max-h-28 bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-sky-400 resize-none"
            />
            <button
              type="button"
              onClick={sendCustom}
              disabled={!composerText.trim()}
              aria-label="Válasz küldése"
              className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                composerText.trim() ? "bg-sky-500 text-zinc-950 active:bg-sky-400" : "bg-zinc-800 text-zinc-600"
              }`}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex gap-2 max-w-4xl mx-auto">
            <button
              type="button"
              onClick={onGenerateMoreQuestions}
              disabled={busy || !hasApiKey}
              className={`flex-1 px-3 py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 border ${
                busy || !hasApiKey
                  ? "bg-zinc-900 text-zinc-600 border-zinc-800"
                  : "bg-zinc-900 border-zinc-700 text-zinc-200 active:border-sky-500/50"
              }`}
            >
              {isGeneratingQuestions ? (
                <div className="w-4 h-4 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 text-sky-400" />
              )}
              <span>Még kérdések</span>
            </button>
            <button
              type="button"
              onClick={() => setShowConfirm(true)}
              disabled={!canSynthesize}
              className={`flex-1 px-3 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 ${
                canSynthesize ? "bg-sky-500 text-zinc-950 active:bg-sky-400" : "bg-zinc-800 text-zinc-500"
              }`}
            >
              {isSynthesizingPrompt ? (
                <div className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
              ) : isCooldownActive ? (
                <>
                  <RotateCcw className="w-4 h-4 animate-spin" />
                  <span>{cooldownSeconds}s</span>
                </>
              ) : (
                <>
                  <span>Generálás</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        )}
      </div>

      <ConfirmFinalModal
        open={showConfirm}
        answeredCount={answeredCount}
        totalCount={totalCount}
        onCancel={() => setShowConfirm(false)}
        onConfirm={() => {
          setShowConfirm(false);
          onGenerateFinalPrompt();
        }}
      />
    </section>
  );
};

/** Chat-buborék: `bot` balra avatarral, `user` jobbra. */
const Bubble: React.FC<{ side: "bot" | "user"; children: React.ReactNode }> = ({ side, children }) => {
  if (side === "user") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-end"
      >
        <div className="max-w-[85%] bg-sky-600 text-white text-sm leading-relaxed rounded-2xl rounded-br-md px-3.5 py-2.5 break-words">
          {children}
        </div>
      </motion.div>
    );
  }
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex items-start gap-2">
      <div className="w-8 h-8 rounded-full bg-sky-950 border border-sky-800/60 flex items-center justify-center text-sky-400 shrink-0">
        <Bot className="w-4 h-4" />
      </div>
      <div className="max-w-[85%] bg-zinc-900 border border-zinc-800 text-sm text-zinc-300 rounded-2xl rounded-tl-md px-3.5 py-2.5 break-words">
        {children}
      </div>
    </motion.div>
  );
};
