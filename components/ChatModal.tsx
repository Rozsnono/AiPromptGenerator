"use client";

import React, { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Bot, User, Sparkles } from "lucide-react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { QuestionItem, AnswersState } from "../app/types";
import toast from "react-hot-toast";
import { MarkdownRenderer } from "./MarkdownRenderer";

interface ChatModalProps {
  apiKey: string;
  selectedModel: string;
  originalGoal: string;
  finalPrompt: string;
  questions: QuestionItem[];
  answers: AnswersState;
}

interface ChatMessage {
  role: "user" | "model";
  text: string;
}

export const ChatModal: React.FC<ChatModalProps> = ({
  apiKey,
  selectedModel,
  originalGoal,
  finalPrompt,
  questions,
  answers,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!inputValue.trim()) return;
    if (!apiKey) {
      toast.error("API kulcs szükséges a chat használatához!");
      return;
    }

    const userText = inputValue.trim();
    setInputValue("");
    setMessages((prev) => [...prev, { role: "user", text: userText }]);
    setIsLoading(true);

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      
      const qaContext = questions
        .map((q) => {
          const ans = answers[q.id];
          const ansStr = ans
            ? ans.selectedOption === "D"
              ? ans.customText
              : q.options[ans.selectedOption as "A" | "B" | "C"]
            : "Nincs válasz";
          return `K: ${q.question}\nV: ${ansStr}`;
        })
        .join("\n\n");

      const systemInstruction = `Te egy AI Prompt Tervező asszisztens vagy.
A felhasználó a következő prompton dolgozik éppen. Segíts neki a prompttal kapcsolatos kérdéseiben.

Eredeti cél:
${originalGoal || "Még nincs megadva."}

Kérdések és válaszok:
${qaContext || "Még nincsenek kérdések."}

Jelenlegi végső prompt:
${finalPrompt || "Még nincs legenerálva."}
`;

      const model = genAI.getGenerativeModel({
        model: selectedModel,
        systemInstruction,
      });

      const history = messages.map((m) => ({
        role: m.role,
        parts: [{ text: m.text }],
      }));

      const chat = model.startChat({
        history,
        generationConfig: { temperature: 0.7 },
      });

      const result = await chat.sendMessage(userText);
      const responseText = result.response.text();

      setMessages((prev) => [...prev, { role: "model", text: responseText }]);
    } catch (error: any) {
      console.error("Chat error:", error);
      toast.error(`Hiba a chat során: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-4 right-4 sm:bottom-6 sm:right-6 w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-sky-600 hover:bg-sky-500 text-white flex items-center justify-center shadow-lg hover:scale-105 transition-all z-40 ${isOpen ? 'hidden' : ''}`}
        title="Prompt Asszisztens Chat"
      >
        <MessageCircle className="w-6 h-6" />
      </button>

      {/* Chat Modal */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 w-[calc(100vw-2rem)] sm:w-[380px] h-[500px] max-h-[80vh] bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden animate-in slide-in-from-bottom-5">
          {/* Header */}
          <div className="bg-zinc-950 p-4 border-b border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sky-400">
              <Sparkles className="w-4 h-4" />
              <h3 className="font-semibold text-sm">Prompt Asszisztens</h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-zinc-400 hover:text-white p-1 rounded-md transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-900/50">
            {messages.length === 0 ? (
              <div className="text-center text-zinc-500 text-xs mt-10 space-y-2">
                <Bot className="w-8 h-8 mx-auto opacity-50" />
                <p>Kérdezz bármit az eddigi promptról vagy a céljaidról!</p>
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl p-3 text-sm ${
                      msg.role === "user"
                        ? "bg-sky-600 text-white rounded-tr-sm"
                        : "bg-zinc-800 text-zinc-200 border border-zinc-700 rounded-tl-sm"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1 opacity-70 text-[10px] font-medium uppercase tracking-wider">
                      {msg.role === "user" ? (
                        <>
                          <User className="w-3 h-3" />
                          Te
                        </>
                      ) : (
                        <>
                          <Bot className="w-3 h-3" />
                          AI
                        </>
                      )}
                    </div>
                    {msg.role === "user" ? (
                      <div className="whitespace-pre-wrap leading-relaxed">{msg.text}</div>
                    ) : (
                      <div className="-mt-1">
                        <MarkdownRenderer content={msg.text} />
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-zinc-800 border border-zinc-700 rounded-2xl rounded-tl-sm p-3 text-sm text-zinc-400">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" />
                    <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce delay-100" />
                    <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce delay-200" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 bg-zinc-950 border-t border-zinc-800">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Írj egy üzenetet..."
                className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-sky-500 transition-colors"
              />
              <button
                onClick={handleSend}
                disabled={!inputValue.trim() || isLoading}
                className="w-9 h-9 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white flex items-center justify-center transition-colors"
              >
                <Send className="w-4 h-4 ml-0.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
