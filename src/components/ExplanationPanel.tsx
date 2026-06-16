"use client";

import { useState } from "react";
import { Volume2, VolumeX, Loader2, BookOpen } from "lucide-react";
import { synthesizeSpeech, playAudioBase64 } from "@/lib/api";
import type { LanguageInfo } from "@/lib/api";

interface Props {
  explanation: string;
  languageInfo: LanguageInfo | null;
}

export default function ExplanationPanel({ explanation, languageInfo }: Props) {
  const [ttsState, setTtsState] = useState<"idle" | "loading" | "playing">("idle");
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [ttsError, setTtsError] = useState<string | null>(null);

  const handleTTS = async () => {
    if (ttsState === "playing" && currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      setCurrentAudio(null);
      setTtsState("idle");
      return;
    }

    setTtsError(null);
    setTtsState("loading");
    try {
      const res = await synthesizeSpeech(
        explanation,
        languageInfo?.primary_language ?? "Hindi",
        languageInfo?.code_mix_type ?? null
      );
      const audio = playAudioBase64(res.audio_base64);
      setCurrentAudio(audio);
      setTtsState("playing");
      audio.onended = () => {
        setTtsState("idle");
        setCurrentAudio(null);
      };
      audio.onerror = () => {
        setTtsState("idle");
        setTtsError("Audio playback failed.");
      };
    } catch (e: any) {
      setTtsError(e.message ?? "TTS failed");
      setTtsState("idle");
    }
  };

  if (!explanation) {
    return (
      <div className="flex flex-col items-center justify-center py-14 text-slate-400 gap-3">
        <BookOpen size={40} className="opacity-40" />
        <p className="text-sm">Explanation will appear here</p>
        <p className="text-xs text-slate-400">Ask a question using voice or text input</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen size={18} className="text-indigo-500" />
          <span className="font-semibold text-slate-700">AI Explanation</span>
          {languageInfo && (
            <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-medium">
              {languageInfo.display_label || languageInfo.primary_language}
            </span>
          )}
        </div>

        {/* TTS button */}
        <button
          onClick={handleTTS}
          disabled={ttsState === "loading"}
          title={ttsState === "playing" ? "Stop speaking" : "Listen in your language"}
          className={`
            flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
            transition-all duration-150
            ${ttsState === "playing"
              ? "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100"
              : "bg-indigo-50 text-indigo-600 border border-indigo-200 hover:bg-indigo-100"
            }
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
        >
          {ttsState === "loading" ? (
            <><Loader2 size={14} className="spinner" /> Generating…</>
          ) : ttsState === "playing" ? (
            <><VolumeX size={14} /> Stop</>
          ) : (
            <><Volume2 size={14} /> Listen</>
          )}
        </button>
      </div>

      {/* Explanation text */}
      <div className="bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 rounded-xl p-5">
        <p className="text-slate-700 leading-relaxed text-sm whitespace-pre-wrap">
          {explanation}
        </p>
      </div>

      {ttsError && (
        <p className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          ⚠ TTS error: {ttsError}
        </p>
      )}
    </div>
  );
}
