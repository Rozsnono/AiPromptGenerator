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
      title: "Cél & beállítás",
      subtitle: "Prompt és AI direktívák",
      icon: Edit3,
      enabled: true,
      done: hasQuestions,
    },
    {
      step: 2,
      title: "Kérdések",
      subtitle: hasQuestions ? `${answeredCount}/${totalQuestions} megválaszolva` : "Még nincs kérdés",
      icon: HelpCircle,
      enabled: hasQuestions,
      done: hasFinalPrompt,
    },
    {
      step: 3,
      title: "Mester Prompt",
      subtitle: hasFinalPrompt ? "Elkészült & használatra kész" : "Várakozás a generálásra",
      icon: Terminal,
      enabled: hasFinalPrompt,
      done: false,
    },
  ];

  return (
    <nav aria-label="Progress Stepper" className="w-full">
      <ol className="flex items-center gap-2 sm:gap-3">
        {steps.map((s, idx) => {
          const Icon = s.icon;
          const isActive = currentStep === s.step;

          return (
            <React.Fragment key={s.step}>
              <li className={isActive ? "min-w-0 shrink-0 sm:shrink" : "min-w-0"}>
                <button
                  type="button"
                  disabled={!s.enabled}
                  onClick={() => onSelectStep(s.step)}
                  aria-current={isActive ? "step" : undefined}
                  className={`flex items-center gap-2.5 py-1.5 rounded-xl text-left transition-all ${
                    s.enabled ? "cursor-pointer" : "cursor-not-allowed opacity-50"
                  }`}
                >
                  <span
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-semibold transition-colors ${
                      isActive
                        ? "bg-sky-500 text-zinc-950 font-bold shadow-sm shadow-sky-500/30"
                        : s.done
                        ? "bg-emerald-950/80 text-emerald-400 border border-emerald-700/50"
                        : "bg-zinc-900 text-zinc-500 border border-zinc-800"
                    }`}
                  >
                    {s.done && !isActive ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                  </span>
                  {/* Telefonon csak az aktív lépés címe látszik */}
                  <span className={`min-w-0 ${isActive ? "block" : "hidden sm:block"}`}>
                    <span
                      className={`block text-sm font-semibold truncate leading-tight ${
                        isActive ? "text-zinc-50" : "text-zinc-400"
                      }`}
                    >
                      {s.title}
                    </span>
                    <span className="hidden sm:block text-[11px] text-zinc-500 truncate mt-0.5">{s.subtitle}</span>
                  </span>
                </button>
              </li>
              {idx < steps.length - 1 && (
                <li aria-hidden className="flex-1 h-px bg-zinc-800 min-w-[12px]" />
              )}
            </React.Fragment>
          );
        })}
      </ol>
    </nav>
  );
};
