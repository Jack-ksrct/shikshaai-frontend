import type { LanguageInfo } from "@/lib/api";

interface Props {
  info: LanguageInfo | null;
}

export default function LanguageBadge({ info }: Props) {
  if (!info) return null;

  const label = info.display_label || info.primary_language;
  const script = info.script || "";
  const isMixed = !!info.code_mix_type;

  return (
    <div className="flex items-center gap-2 flex-wrap mt-2">
      <span className="inline-flex items-center gap-1.5 bg-indigo-100 text-indigo-700 text-xs font-semibold px-2.5 py-1 rounded-full">
        <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block" />
        {label}
      </span>
      {script && (
        <span className="inline-flex items-center bg-slate-100 text-slate-600 text-xs px-2.5 py-1 rounded-full">
          {script}
        </span>
      )}
      {isMixed && (
        <span className="inline-flex items-center bg-orange-100 text-orange-700 text-xs font-medium px-2.5 py-1 rounded-full">
          ✦ Code-Mixed
        </span>
      )}
      {info.confidence > 0 && (
        <span className="text-slate-400 text-xs">
          {Math.round(info.confidence * 100)}% confidence
        </span>
      )}
    </div>
  );
}
