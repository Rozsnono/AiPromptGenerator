"use client";

import React from "react";
import { Check, Edit3, HelpCircle, Terminal } from "lucide-react";

interface StepperProps {
  currentStep: number;
  hasQuestions: boolean;
  hasFinalPrompt: boolean;
  onSelectStep: (step: number) => void;
  answeredCount: number;
  totalQuestions: number;
}

export const Stepper: React.FC<StepperProps> = ({
  currentStep,
  hasQuestions,
  hasFinalPrompt,
  onSelectStep,
  answeredCount,
  totalQuestions,
}) => {
  const steps = [
    {
      step: 1,
      title: "1. Cél & Rendszer Beállítás",
      subtitle: "Prompt és AI direktívák",
      icon: Edit3,
      enabled: true,
      done: hasQuestions,
    },
    {
      step: 2,
      title: "2. Kérdéssor & Válaszok",
      subtitle: hasQuestions ? `${answeredCount}/${totalQuestions} megválaszolva` : "Még nincs kérdés",
      icon: HelpCircle,
      enabled: hasQuestions,
      done: hasFinalPrompt,
    },
    {
      step: 3,
      title: "3. Mester Prompt",
      subtitle: hasFinalPrompt ? "Elkészült & használatra kész" : "Várakozás a generálásra",
      icon: Terminal,
      enabled: hasFinalPrompt,
      done: false,
    },
  ];

  return (
    <nav aria-label="Progress Stepper" className="w-full">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-1.5 bg-zinc-900/60 border border-zinc-800/80 rounded-2xl backdrop-blur-md">
        {steps.map((s) => {
          const Icon = s.icon;
          const isActive = currentStep === s.step;
          const isClickable = s.enabled;

          return (
            <button
              key={s.step}
              type="button"
              disabled={!isClickable}
              onClick={() => onSelectStep(s.step)}
              className={`flex items-center gap-3 p-2.5 sm:p-3 rounded-xl text-left transition-all relative ${
                isActive
                  ? "bg-zinc-800/90 text-white border border-sky-500/40 shadow-sm shadow-sky-500/10"
                  : isClickable
                  ? "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40 cursor-pointer"
                  : "text-zinc-600 cursor-not-allowed opacity-60"
              }`}
            >
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-semibold transition-colors ${
                  isActive
                    ? "bg-sky-500 text-zinc-950 font-bold"
                    : s.done
                    ? "bg-emerald-950/80 text-emerald-400 border border-emerald-700/50"
                    : "bg-zinc-800 text-zinc-500 border border-zinc-700/50"
                }`}
              >
                {s.done ? <Check className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs sm:text-sm font-semibold truncate leading-tight">
                  {s.title}
                </div>
                <div className="text-[11px] text-zinc-500 truncate mt-0.5">
                  {s.subtitle}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
