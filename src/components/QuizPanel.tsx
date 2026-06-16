"use client";

import { useState } from "react";
import { CheckCircle2, XCircle, HelpCircle, PenLine } from "lucide-react";
import type { MCQQuestion, ShortAnswerQuestion } from "@/lib/api";

interface Props {
  mcqQuestions: MCQQuestion[];
  shortAnswerQuestions: ShortAnswerQuestion[];
}

export default function QuizPanel({ mcqQuestions, shortAnswerQuestions }: Props) {
  const [mcqAnswers, setMcqAnswers] = useState<Record<number, string>>({});
  const [mcqSubmitted, setMcqSubmitted] = useState<Record<number, boolean>>({});
  const [saAnswers, setSaAnswers] = useState<Record<number, string>>({});
  const [saSubmitted, setSaSubmitted] = useState<Record<number, boolean>>({});
  const [score, setScore] = useState<number | null>(null);

  if (!mcqQuestions.length && !shortAnswerQuestions.length) {
    return (
      <div className="flex flex-col items-center justify-center py-14 text-slate-400 gap-3">
        <PenLine size={40} className="opacity-40" />
        <p className="text-sm">Quiz will appear after you explain a concept</p>
      </div>
    );
  }

  const submitAll = () => {
    const allMcqDone = mcqQuestions.every((_, i) => mcqAnswers[i]);
    const newSubmits: Record<number, boolean> = {};
    mcqQuestions.forEach((_, i) => { newSubmits[i] = true; });
    setMcqSubmitted(newSubmits);

    const newSaSubmits: Record<number, boolean> = {};
    shortAnswerQuestions.forEach((_, i) => { newSaSubmits[i] = true; });
    setSaSubmitted(newSaSubmits);

    const correct = mcqQuestions.filter(
      (q, i) => mcqAnswers[i]?.startsWith(q.correct_answer)
    ).length;
    setScore(correct);
  };

  const reset = () => {
    setMcqAnswers({});
    setMcqSubmitted({});
    setSaAnswers({});
    setSaSubmitted({});
    setScore(null);
  };

  return (
    <div className="space-y-6">
      {/* Score banner */}
      {score !== null && (
        <div className="bg-gradient-to-r from-indigo-500 to-indigo-700 text-white rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="font-bold text-lg">
              🎉 Score: {score} / {mcqQuestions.length} MCQs
            </p>
            <p className="text-indigo-200 text-sm">
              {score === mcqQuestions.length ? "Perfect! Shabash! 🌟" : "Keep practising! You can do it! 💪"}
            </p>
          </div>
          <button
            onClick={reset}
            className="bg-white text-indigo-600 font-semibold text-sm px-4 py-2 rounded-lg hover:bg-indigo-50 transition"
          >
            Try Again
          </button>
        </div>
      )}

      {/* MCQ section */}
      {mcqQuestions.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-semibold text-slate-700 flex items-center gap-2">
            <HelpCircle size={16} className="text-indigo-500" />
            Multiple Choice Questions
          </h3>
          {mcqQuestions.map((q, qi) => {
            const submitted = mcqSubmitted[qi];
            const chosen = mcqAnswers[qi];
            const isCorrect = chosen?.startsWith(q.correct_answer);

            return (
              <div
                key={qi}
                className={`border rounded-xl p-4 transition-all ${
                  !submitted
                    ? "border-slate-200 bg-white"
                    : isCorrect
                    ? "border-green-200 bg-green-50"
                    : "border-red-200 bg-red-50"
                }`}
              >
                <p className="text-sm font-medium text-slate-800 mb-3">
                  <span className="text-indigo-500 font-bold mr-1">Q{qi + 1}.</span>
                  {q.question}
                </p>

                <div className="space-y-2">
                  {q.options.map((opt, oi) => {
                    const optLetter = opt.charAt(0);
                    const isChosen = chosen === opt;
                    const isCorrectOpt = optLetter === q.correct_answer;

                    let optClass =
                      "border rounded-lg px-3 py-2 text-sm cursor-pointer flex items-center gap-2 transition-all ";
                    if (!submitted) {
                      optClass += isChosen
                        ? "bg-indigo-100 border-indigo-400 text-indigo-700 font-medium"
                        : "bg-slate-50 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50";
                    } else {
                      if (isCorrectOpt)
                        optClass += "bg-green-100 border-green-400 text-green-800 font-medium";
                      else if (isChosen && !isCorrectOpt)
                        optClass += "bg-red-100 border-red-400 text-red-700";
                      else
                        optClass += "bg-white border-slate-200 text-slate-500";
                    }

                    return (
                      <div
                        key={oi}
                        className={optClass}
                        onClick={() => !submitted && setMcqAnswers((p) => ({ ...p, [qi]: opt }))}
                      >
                        {submitted && isCorrectOpt && <CheckCircle2 size={14} className="text-green-600 shrink-0" />}
                        {submitted && isChosen && !isCorrectOpt && <XCircle size={14} className="text-red-500 shrink-0" />}
                        {opt}
                      </div>
                    );
                  })}
                </div>

                {submitted && (
                  <div className={`mt-3 text-xs p-2.5 rounded-lg ${isCorrect ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                    {isCorrect ? "✓ Correct! " : `✗ Correct answer: ${q.correct_answer}. `}
                    {q.explanation}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Short answer section */}
      {shortAnswerQuestions.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-semibold text-slate-700 flex items-center gap-2">
            <PenLine size={16} className="text-orange-500" />
            Short Answer Questions
          </h3>
          {shortAnswerQuestions.map((q, qi) => {
            const submitted = saSubmitted[qi];
            return (
              <div key={qi} className="border border-slate-200 bg-white rounded-xl p-4">
                <p className="text-sm font-medium text-slate-800 mb-3">
                  <span className="text-orange-500 font-bold mr-1">Q{qi + 1}.</span>
                  {q.question}
                </p>
                <textarea
                  disabled={submitted}
                  value={saAnswers[qi] ?? ""}
                  onChange={(e) => setSaAnswers((p) => ({ ...p, [qi]: e.target.value }))}
                  placeholder="Type your answer here…"
                  rows={3}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-indigo-400 disabled:bg-slate-50 disabled:text-slate-500"
                />
                {submitted && (
                  <div className="mt-3 text-xs bg-indigo-50 border border-indigo-200 text-indigo-700 p-2.5 rounded-lg">
                    <span className="font-semibold">Model Answer: </span>
                    {q.model_answer}
                    {q.keywords.length > 0 && (
                      <span className="block mt-1 text-indigo-500">
                        Key words: {q.keywords.join(", ")}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Submit button */}
      {score === null && (
        <button
          onClick={submitAll}
          className="w-full bg-gradient-to-r from-orange-500 to-indigo-600 text-white font-semibold py-3 rounded-xl hover:opacity-90 transition text-sm"
        >
          ✦ Submit Quiz
        </button>
      )}
    </div>
  );
}
