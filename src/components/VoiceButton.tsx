"use client";

import { Mic, MicOff, Loader2 } from "lucide-react";

type State = "idle" | "recording" | "processing";

interface Props {
  state: State;
  onClick: () => void;
}

export default function VoiceButton({ state, onClick }: Props) {
  return (
    <div className="flex flex-col items-center gap-4">
      {/* Outer pulse ring — only when recording */}
      <div className="relative flex items-center justify-center">
        {state === "recording" && (
          <>
            <div className="absolute w-36 h-36 rounded-full bg-red-500 opacity-20 mic-ring" />
            <div
              className="absolute w-28 h-28 rounded-full bg-red-400 opacity-25 mic-ring"
              style={{ animationDelay: "0.3s" }}
            />
          </>
        )}

        <button
          onClick={onClick}
          disabled={state === "processing"}
          aria-label={state === "recording" ? "Stop recording" : "Start recording"}
          className={`
            relative w-24 h-24 rounded-full flex items-center justify-center
            shadow-xl transition-all duration-200 focus:outline-none
            focus-visible:ring-4 focus-visible:ring-indigo-300
            disabled:opacity-60 disabled:cursor-not-allowed
            ${state === "recording" ? "mic-btn-recording scale-110" : "mic-btn-gradient"}
          `}
        >
          {state === "processing" ? (
            <Loader2 size={36} className="text-white spinner" />
          ) : state === "recording" ? (
            <MicOff size={36} className="text-white" />
          ) : (
            <Mic size={36} className="text-white" />
          )}
        </button>
      </div>

      {/* Waveform when recording */}
      {state === "recording" && (
        <div className="flex items-center gap-1 h-6">
          {[...Array(9)].map((_, i) => (
            <div
              key={i}
              className="wave-bar w-1 rounded-full bg-indigo-500"
              style={{ animationDelay: `${i * 0.08}s` }}
            />
          ))}
        </div>
      )}

      {/* Status label */}
      <p className="text-sm text-slate-500 font-medium">
        {state === "idle" && "Tap to start recording"}
        {state === "recording" && (
          <span className="text-red-600 font-semibold animate-pulse">
            🔴 Recording… tap to stop
          </span>
        )}
        {state === "processing" && (
          <span className="text-indigo-600 font-semibold">Transcribing…</span>
        )}
      </p>
    </div>
  );
}
