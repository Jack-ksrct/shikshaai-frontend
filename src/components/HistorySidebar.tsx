import { X, Clock, Trash2, ImageIcon, BookOpen, PenLine } from "lucide-react";
import { type HistoryEntry } from "@/lib/api";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  history: HistoryEntry[];
  onSelect: (entry: HistoryEntry) => void;
  onClear: () => void;
  activeId: string | null;
}

export default function HistorySidebar({ isOpen, onClose, history, onSelect, onClear, activeId }: Props) {
  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-slate-900/20 z-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div className="fixed right-0 top-0 h-full w-80 bg-white shadow-2xl z-50 flex flex-col transform transition-transform border-l border-slate-200">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <Clock size={18} className="text-indigo-500" />
            <h2 className="font-bold text-slate-700">Recent Explorations</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-lg text-slate-500 transition">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {history.length === 0 ? (
            <div className="text-center text-slate-400 py-10 text-sm">
              <Clock size={32} className="mx-auto mb-2 opacity-50" />
              <p>No history yet.</p>
              <p className="text-xs mt-1">Your recent concepts will appear here.</p>
            </div>
          ) : (
            history.map((entry) => (
              <button
                key={entry.id}
                onClick={() => {
                  onSelect(entry);
                  onClose();
                }}
                className={`w-full text-left p-3 rounded-xl border transition ${
                  activeId === entry.id
                    ? "bg-indigo-50 border-indigo-200 shadow-sm"
                    : "bg-white border-slate-100 hover:border-indigo-100 hover:shadow-sm"
                }`}
              >
                <div className="flex justify-between items-start mb-1.5">
                  <span className="text-xs font-semibold text-slate-500">
                    {new Date(entry.timestamp).toLocaleDateString()}
                  </span>
                  {entry.langInfo && (
                    <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-medium">
                      {entry.langInfo.display_label}
                    </span>
                  )}
                </div>
                
                <p className="font-medium text-slate-800 text-sm line-clamp-2 leading-snug">
                  {entry.conceptText}
                </p>

                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-100">
                  {entry.explanation && <BookOpen size={12} className="text-indigo-400" title="Explanation" />}
                  {entry.visual && <ImageIcon size={12} className="text-teal-400" title="Visual Generated" />}
                  {entry.quiz && <PenLine size={12} className="text-violet-400" title="Quiz Generated" />}
                </div>
              </button>
            ))
          )}
        </div>

        {history.length > 0 && (
          <div className="p-4 border-t border-slate-100">
            <button
              onClick={onClear}
              className="w-full flex items-center justify-center gap-2 py-2 text-sm text-red-600 font-medium hover:bg-red-50 rounded-lg transition"
            >
              <Trash2 size={16} /> Clear History
            </button>
          </div>
        )}
      </div>
    </>
  );
}
