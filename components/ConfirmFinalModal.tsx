"use client";

import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Send, X } from "lucide-react";

interface ConfirmFinalModalProps {
  open: boolean;
  answeredCount: number;
  totalCount: number;
  onCancel: () => void;
  onConfirm: () => void;
}

/** "Biztos kész vagy?" megerősítő ablak a végleges Mester Prompt generálása előtt. */
export const ConfirmFinalModal: React.FC<ConfirmFinalModalProps> = ({
  open,
  answeredCount,
  totalCount,
  onCancel,
  onConfirm,
}) => {
  // Esc zárja az ablakot
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={onCancel}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-final-title"
            initial={{ scale: 0.95, y: 10 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 10 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl p-5 space-y-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-sky-950/80 border border-sky-800/60 flex items-center justify-center text-sky-400">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h3 id="confirm-final-title" className="text-base font-semibold text-zinc-50">
                  Biztos kész vagy?
                </h3>
              </div>
              <button
                type="button"
                onClick={onCancel}
                aria-label="Bezárás"
                className="text-zinc-400 hover:text-zinc-50 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-sm text-zinc-300">
              {answeredCount} / {totalCount} kérdésre válaszoltál.
              {answeredCount < totalCount
                ? ` A megválaszolatlan ${totalCount - answeredCount} kérdésnél a modell általános best practice-t alkalmaz.`
                : " Minden kérdést megválaszoltál."}{" "}
              Biztosan elindítod a végleges Mester Prompt generálását?
            </p>

            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold border border-zinc-700 bg-zinc-900 text-zinc-200 hover:border-zinc-500 hover:text-zinc-50 transition-all"
              >
                Még nem, vissza a kérdésekhez
              </button>
              <button
                type="button"
                autoFocus
                onClick={onConfirm}
                className="px-4 py-2.5 rounded-xl text-sm font-bold bg-sky-500 hover:bg-sky-400 text-zinc-950 flex items-center justify-center gap-2 transition-all"
              >
                <Send className="w-4 h-4" />
                <span>Igen, generálás</span>
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
