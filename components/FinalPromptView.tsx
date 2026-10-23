"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Copy, Check, Download, Edit3, Eye, Code, RotateCcw, Bot } from "lucide-react";
import { MarkdownRenderer } from "./MarkdownRenderer";
import toast from "react-hot-toast";

interface FinalPromptViewProps {
  prompt: string;
  onUpdatePrompt: (newPrompt: string) => void;
  onRegenerate: () => void;
  isSynthesizing: boolean;
  modelName: string;
  targetLanguage: string;
}

export const FinalPromptView: React.FC<FinalPromptViewProps> = ({
  prompt,
  onUpdatePrompt,
  onRegenerate,
  isSynthesizing,
  modelName,
  targetLanguage,
}) => {
  const [viewMode, setViewMode] = useState<"preview" | "raw" | "edit">("preview");
  const [copied, setCopied] = useState(false);

  // Statistics calculation
  const charCount = prompt.length;
  const wordCount = prompt.trim() ? prompt.trim().split(/\s+/).length : 0;
  const estimatedTokens = Math.round(charCount / 3.8);

  const handleCopy = async () => {
    if (!prompt) return;
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      toast.success("Prompt sikeresen másolva a vágólapra!");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error("Nem sikerült a másolás.");
    }
  };

  const handleDownload = () => {
    if (!prompt) return;
    try {
      const blob = new Blob([prompt], { type: "text/markdown;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `master_prompt_${Date.now()}.md`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("Fájl letöltve (master_prompt.md)");
    } catch {
      toast.error("Hiba történt a letöltés során.");
    }
  };

  const modes = [
    { id: "preview", label: "Előnézet", icon: Eye },
    { id: "raw", label: "Markdown", icon: Code },
    { id: "edit", label: "Szerkesztés", icon: Edit3 },
  ] as const;

  const modeSwitch = (
    <div className="inline-flex items-center bg-zinc-900/70 p-1 rounded-xl border border-zinc-800">
      {modes.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          onClick={() => setViewMode(id)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            viewMode === id ? "bg-zinc-800 text-zinc-50 shadow-sm" : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <Icon className="w-3.5 h-3.5" />
          {/* Telefonon csak az aktív mód felirata látszik, hogy ne legyen vízszintes görgetés */}
          <span className={viewMode === id ? "" : "hidden sm:inline"}>{label}</span>
        </button>
      ))}
    </div>
  );

  const content = (
    <div className="relative rounded-2xl border border-zinc-800 bg-zinc-950/80 overflow-hidden">
      {viewMode === "preview" && (
        <div className="p-5 sm:p-6 text-zinc-200 max-h-[70vh] overflow-y-auto leading-relaxed selection:bg-sky-500/30">
          <MarkdownRenderer content={prompt} />
        </div>
      )}
      {viewMode === "raw" && (
        <pre className="p-5 sm:p-6 text-xs sm:text-sm font-mono text-zinc-300 whitespace-pre-wrap break-words leading-relaxed max-h-[70vh] overflow-y-auto selection:bg-sky-500/30">
          {prompt}
        </pre>
      )}
      {viewMode === "edit" && (
        <textarea
          rows={18}
          value={prompt}
          onChange={(e) => onUpdatePrompt(e.target.value)}
          className="w-full bg-transparent p-5 sm:p-6 text-xs sm:text-sm font-mono text-zinc-200 focus:outline-none resize-y leading-relaxed"
          placeholder="Itt módosíthatod közvetlenül a generált promptot..."
        />
      )}
    </div>
  );

  const copyButtonClass = `px-4 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 border transition-all ${
    copied
      ? "bg-emerald-950/80 border-emerald-500 text-emerald-300"
      : "bg-sky-500 hover:bg-sky-400 text-zinc-950 border-sky-400 shadow-sm shadow-sky-500/20"
  }`;
  const copyContent = copied ? (
    <>
      <Check className="w-4 h-4 text-emerald-400" />
      <span>Másolva!</span>
    </>
  ) : (
    <>
      <Copy className="w-4 h-4" />
      <span>Másolás</span>
    </>
  );

  return (
    <motion.section id="final-prompt-section" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      {/* ======================= DESKTOP (lg+) ======================= */}
      <div className="hidden lg:grid grid-cols-[minmax(0,1fr)_300px] gap-12">
        <div className="min-w-0 space-y-6">
          <header className="pb-8 border-b border-zinc-800/70">
            <div className="flex items-center gap-3">
              <h2 className="text-3xl font-semibold tracking-tight text-zinc-50">Kész a Mester Prompt</h2>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800/60">
                {targetLanguage === "hu" ? "Magyar" : "English"}
              </span>
            </div>
            <p className="mt-2 text-base text-zinc-400 max-w-xl">
              Közvetlenül bemásolható Claude-ba, ChatGPT-be (GPT-4o), vagy Gemini-be.
            </p>
          </header>
          {modeSwitch}
          {content}
        </div>

        <aside className="self-start sticky top-6 space-y-6">
          <div className="space-y-2.5">
            <button type="button" onClick={handleCopy} className={`w-full ${copyButtonClass}`}>
              {copyContent}
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="w-full px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 border border-zinc-700 bg-zinc-900/90 text-zinc-200 hover:border-sky-500/50 hover:text-zinc-50 transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Letöltés (.md)</span>
            </button>
            <button
              type="button"
              onClick={onRegenerate}
              disabled={isSynthesizing}
              className="w-full px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 border border-zinc-800 text-sky-400 hover:text-sky-300 hover:border-zinc-700 disabled:opacity-60 transition-all"
            >
              <RotateCcw className={`w-4 h-4 ${isSynthesizing ? "animate-spin" : ""}`} />
              <span>Újragenerálás</span>
            </button>
          </div>

          <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-5 space-y-3 text-sm">
            <div className="text-xs uppercase tracking-wider text-zinc-500">Statisztika</div>
            {[
              ["Karakter", String(charCount)],
              ["Szavak", String(wordCount)],
              ["Becsült token", `~${estimatedTokens}`],
            ].map(([k, v]) => (
              <div key={k} className="flex items-center justify-between">
                <span className="text-zinc-500">{k}</span>
                <span className="font-mono text-zinc-100">{v}</span>
              </div>
            ))}
            <div className="pt-2 border-t border-zinc-800/70 text-xs text-zinc-500 break-all">Modell: {modelName}</div>
          </div>
        </aside>
      </div>

      {/* ======================= TELEFON / TABLET (lg alatt) ======================= */}
      <div className="lg:hidden pb-28 space-y-4">
        <div className="flex items-start gap-2">
          <div className="w-8 h-8 rounded-full bg-sky-950 border border-sky-800/60 flex items-center justify-center text-sky-400 shrink-0">
            <Bot className="w-4 h-4" />
          </div>
          <div className="max-w-[85%] bg-zinc-900 border border-zinc-800 text-sm text-zinc-300 rounded-2xl rounded-tl-md px-3.5 py-2.5">
            Kész a Mester Promptod! 🎉 ({targetLanguage === "hu" ? "Magyar" : "English"}, ~{estimatedTokens} token)
          </div>
        </div>

        <div className="pl-10 space-y-3">
          {modeSwitch}
          {content}
          <p className="text-[11px] font-mono text-zinc-500">
            {charCount} karakter · {wordCount} szó · {modelName}
          </p>
        </div>
      </div>

      {/* Alsó műveletsáv (telefon/tablet) */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-zinc-950/95 backdrop-blur-md border-t border-zinc-800 px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="flex gap-2 max-w-4xl mx-auto">
          <button type="button" onClick={handleCopy} className={`flex-1 ${copyButtonClass}`}>
            {copyContent}
          </button>
          <button
            type="button"
            onClick={handleDownload}
            aria-label="Letöltés .md fájlként"
            className="w-12 rounded-xl flex items-center justify-center border border-zinc-700 bg-zinc-900 text-zinc-200"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onRegenerate}
            disabled={isSynthesizing}
            aria-label="Prompt újragenerálása"
            className="w-12 rounded-xl flex items-center justify-center border border-zinc-800 bg-zinc-900 text-sky-400 disabled:opacity-60"
          >
            <RotateCcw className={`w-4 h-4 ${isSynthesizing ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>
    </motion.section>
  );
};
