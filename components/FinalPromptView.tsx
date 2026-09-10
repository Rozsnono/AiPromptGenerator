"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Terminal, Copy, Check, Download, Edit3, Eye, Code, RotateCcw } from "lucide-react";
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

  return (
    <motion.section
      id="final-prompt-section"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-5 sm:p-6 backdrop-blur-md shadow-xl space-y-4"
    >
      {/* Header bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-950/80 border border-emerald-800/60 flex items-center justify-center text-emerald-400">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-semibold text-white">
                Final Master Prompt
              </h2>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800/60">
                {targetLanguage === "hu" ? "Magyar" : "English"}
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Közvetlenül bemásolható Claude-ba, ChatGPT-be (GPT-4o), vagy Gemini-be.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Mode Switcher */}
          <div className="flex items-center bg-zinc-950 p-1 rounded-xl border border-zinc-800">
            <button
              type="button"
              onClick={() => setViewMode("preview")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                viewMode === "preview"
                  ? "bg-zinc-800 text-white shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Előnézet</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("raw")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                viewMode === "raw"
                  ? "bg-zinc-800 text-white shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              <span>Nyers Markdown</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("edit")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                viewMode === "edit"
                  ? "bg-zinc-800 text-white shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Szerkesztés</span>
            </button>
          </div>

          {/* Download button */}
          <button
            type="button"
            onClick={handleDownload}
            title="Letöltés .md fájlként"
            className="p-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700 transition-colors"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Copy button */}
          <button
            type="button"
            onClick={handleCopy}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 border transition-all ${
              copied
                ? "bg-emerald-950/80 border-emerald-500 text-emerald-300 shadow-sm"
                : "bg-sky-500 hover:bg-sky-400 text-zinc-950 border-sky-400 font-bold shadow-sm"
            }`}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Másolva!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Másolás</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Content Display */}
      <div className="relative rounded-xl border border-zinc-800 bg-zinc-950/80 overflow-hidden">
        {viewMode === "preview" && (
          <div className="p-5 sm:p-6 text-zinc-200 max-h-[600px] overflow-y-auto leading-relaxed selection:bg-sky-500/30">
            <MarkdownRenderer content={prompt} />
          </div>
        )}

        {viewMode === "raw" && (
          <pre className="p-5 sm:p-6 text-xs sm:text-sm font-mono text-zinc-300 whitespace-pre-wrap break-words leading-relaxed max-h-[600px] overflow-y-auto selection:bg-sky-500/30">
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

      {/* Footer Stats & Regenerate Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 text-xs text-zinc-400 border-t border-zinc-800/60">
        <div className="flex items-center gap-4 flex-wrap font-mono text-[11px]">
          <span>Karakter: <strong className="text-zinc-200">{charCount}</strong></span>
          <span>Szavak: <strong className="text-zinc-200">{wordCount}</strong></span>
          <span>Becsült token: <strong className="text-sky-400">~{estimatedTokens}</strong></span>
          <span className="hidden md:inline-block text-zinc-500">Modell: {modelName}</span>
        </div>

        <button
          type="button"
          onClick={onRegenerate}
          disabled={isSynthesizing}
          className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1.5 self-start sm:self-auto hover:underline"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${isSynthesizing ? "animate-spin" : ""}`} />
          <span>Prompt újragenerálása az eddigi válaszokból</span>
        </button>
      </div>
    </motion.section>
  );
};
