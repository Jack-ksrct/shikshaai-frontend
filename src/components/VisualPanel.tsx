"use client";

import { ImageIcon, Download } from "lucide-react";

interface Props {
  imageBase64: string | null;
  prompt: string | null;
}

export default function VisualPanel({ imageBase64, prompt }: Props) {
  if (!imageBase64) {
    return (
      <div className="flex flex-col items-center justify-center py-14 text-slate-400 gap-3">
        <ImageIcon size={40} className="opacity-40" />
        <p className="text-sm">Visual diagram will appear here</p>
        <p className="text-xs text-slate-400">Explain a concept first, then click "Generate Visual"</p>
      </div>
    );
  }

  const dataUrl = `data:image/png;base64,${imageBase64}`;

  const download = () => {
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = "shikshaai-visual.png";
    a.click();
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ImageIcon size={16} className="text-teal-500" />
          <span className="font-semibold text-slate-700 text-sm">Educational Diagram</span>
        </div>
        <button
          onClick={download}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 border border-slate-200 px-2.5 py-1.5 rounded-lg hover:bg-slate-50 transition"
        >
          <Download size={13} /> Save
        </button>
      </div>

      <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={dataUrl}
          alt="Educational visual diagram"
          className="w-full object-contain max-h-96"
        />
      </div>

      {prompt && (
        <p className="text-xs text-slate-400 italic px-1">
          Generated from: "{prompt.slice(0, 120)}{prompt.length > 120 ? "…" : ""}"
        </p>
      )}
    </div>
  );
}
