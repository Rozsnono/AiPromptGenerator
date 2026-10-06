"use client";

import React, { useState } from "react";
import { Sparkles, Cpu, RefreshCw, Key, Trash2, Check, Eye, EyeOff, X, ExternalLink } from "lucide-react";
import { ModelInfo } from "../app/types";

interface HeaderProps {
  availableModels: ModelInfo[];
  selectedModel: string;
  onSelectModel: (modelId: string) => void;
  isLoadingModels: boolean;
  onRefreshModels: () => void;
  customApiKey: string;
  onUpdateApiKey: (key: string) => void;
  envApiKey: string;
  onResetWorkspace: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  availableModels,
  selectedModel,
  onSelectModel,
  isLoadingModels,
  onRefreshModels,
  customApiKey,
  onUpdateApiKey,
  envApiKey,
  onResetWorkspace,
}) => {
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [tempKey, setTempKey] = useState(customApiKey);
  const [showPassword, setShowPassword] = useState(false);

  const activeApiKey = (customApiKey || envApiKey).trim();
  const hasKey = Boolean(activeApiKey);

  const handleOpenKeyModal = () => {
    setTempKey(customApiKey);
    setShowKeyModal(true);
  };

  const handleSaveKey = () => {
    onUpdateApiKey(tempKey.trim());
    setShowKeyModal(false);
  };

  const handleClearKey = () => {
    setTempKey("");
    onUpdateApiKey("");
  };

  return (
    <>
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-zinc-800/80">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-sky-500/20 ring-1 ring-white/10">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                AiPromptGenerator
              </h1>
              <span className="text-[10px] uppercase font-mono tracking-wider px-1.5 py-0.5 rounded bg-sky-950/60 text-sky-400 border border-sky-800/60">
                v2.0
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Interaktív kérdéssor &rarr; Professzionális Master Prompt Gemini alapokon
            </p>
          </div>
        </div>

        {/* Action controls */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-start sm:justify-end flex-wrap">
          {/* Model selector */}
          <div className="relative flex items-center bg-zinc-900/90 border border-zinc-800 rounded-xl px-3 py-1.5 focus-within:border-sky-500/60 transition-colors shadow-sm">
            <Cpu className="w-3.5 h-3.5 text-sky-400 mr-2 shrink-0" />
            <select
              aria-label="Gemini Modell Kiválasztása"
              value={selectedModel}
              disabled={isLoadingModels}
              onChange={(e) => onSelectModel(e.target.value)}
              className="bg-transparent text-xs text-zinc-200 focus:outline-none cursor-pointer max-w-[170px] sm:max-w-[210px] truncate pr-1"
            >
              {availableModels.map((m) => (
                <option key={m.id} value={m.id} className="bg-zinc-900 text-zinc-200">
                  {m.name}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={onRefreshModels}
              disabled={isLoadingModels}
              title="Elérhető modellek frissítése az API kulcs alapján"
              className="ml-1.5 p-1 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-sky-300 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingModels ? "animate-spin text-sky-400" : ""}`} />
            </button>
          </div>

          {/* API Key button */}
          <button
            type="button"
            onClick={handleOpenKeyModal}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
              hasKey
                ? "bg-zinc-900/80 border-zinc-800 text-zinc-300 hover:border-zinc-700 hover:text-white"
                : "bg-amber-950/40 border-amber-500/50 text-amber-300 hover:bg-amber-950/60 animate-pulse"
            }`}
          >
            <Key className={`w-3.5 h-3.5 ${hasKey ? "text-emerald-400" : "text-amber-400"}`} />
            <span>{hasKey ? "API Kulcs" : "Kulcs szükséges"}</span>
          </button>

          {/* Reset button */}
          <button
            type="button"
            onClick={onResetWorkspace}
            title="Munkaterület törlése és visszaállítása"
            className="p-2 rounded-xl bg-zinc-900/80 border border-zinc-800 text-zinc-400 hover:text-rose-400 hover:border-rose-500/40 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* API Key Modal / Dialog */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-sky-950/60 border border-sky-800/50 flex items-center justify-center">
                  <Key className="w-4 h-4 text-sky-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Google Gemini API Kulcs</h3>
                  <p className="text-xs text-zinc-400">Biztonságosan tárolva a böngésződben</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowKeyModal(false)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {envApiKey && (
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800/80 text-xs">
                <span className="text-zinc-400">Környezeti változóból (.env):</span>
                <span className="text-[11px] font-mono text-emerald-400 font-semibold bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40">
                  Aktív (Loaded)
                </span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300">
                Egyéni Gemini API kulcs:
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={tempKey}
                  onChange={(e) => setTempKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-sky-500 font-mono pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
              <div className="flex items-center justify-between pt-1">
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-sky-400 hover:underline flex items-center gap-1"
                >
                  <span>Ingyenes API kulcs igénylése Google AI Studio-ban</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
                {tempKey && (
                  <button
                    type="button"
                    onClick={handleClearKey}
                    className="text-[11px] text-rose-400 hover:underline"
                  >
                    Törlés
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setShowKeyModal(false)}
                className="px-3.5 py-1.5 rounded-xl text-xs text-zinc-400 hover:text-white"
              >
                Mégse
              </button>
              <button
                type="button"
                onClick={handleSaveKey}
                className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-sky-500 hover:bg-sky-400 text-zinc-950 flex items-center gap-1.5 transition-colors"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Mentés</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
