"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Mic, Sparkles, ImageIcon, BookOpen, PenLine, Globe,
  RefreshCw, GraduationCap, ChevronDown, Volume2, Loader2
} from "lucide-react";
import {
  healthCheck, transcribeAudio, detectLanguage, explainConcept,
  generateQuiz, generateVisual,
  type LanguageInfo, type ExplainResponse, type QuizResponse, type VisualResponse,
} from "@/lib/api";
import { VoiceRecorder } from "@/lib/recorder";
import VoiceButton from "@/components/VoiceButton";
import LanguageBadge from "@/components/LanguageBadge";
import ExplanationPanel from "@/components/ExplanationPanel";
import QuizPanel from "@/components/QuizPanel";
import VisualPanel from "@/components/VisualPanel";
import AlertBanner from "@/components/AlertBanner";

// ─── Types ──────────────────────────────────────────────────────────────────

type RecorderState = "idle" | "recording" | "processing";
type ActiveTab = "explanation" | "visual" | "quiz";

const GRADE_OPTIONS = [
  "Class 1-2", "Class 3-5", "Class 6-8", "Class 9-10",
  "Class 11-12", "Undergraduate",
];

// ─── Feature cards ──────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: <Mic size={22} className="text-orange-500" />,
    bg: "bg-orange-50",
    title: "Voice First",
    desc: "Speak in Hindi, Hinglish, Tamil, or any Indian language",
  },
  {
    icon: <Sparkles size={22} className="text-indigo-500" />,
    bg: "bg-indigo-50",
    title: "AI Simplify",
    desc: "Ollama adapts concepts for your students' grade level",
  },
  {
    icon: <ImageIcon size={22} className="text-teal-500" />,
    bg: "bg-teal-50",
    title: "Visual Learning",
    desc: "Auto-generate classroom-ready educational diagrams",
  },
  {
    icon: <PenLine size={22} className="text-violet-500" />,
    bg: "bg-violet-50",
    title: "Quiz Studio",
    desc: "MCQ & short-answer assessments in seconds",
  },
];

// ─── Component ──────────────────────────────────────────────────────────────

export default function Home() {
  // Health / config
  const [configErrors, setConfigErrors] = useState<string[]>([]);
  const [backendError, setBackendError] = useState<string | null>(null);

  // Input
  const [conceptText, setConceptText] = useState("");
  const [gradeLevel, setGradeLevel] = useState("Class 6-8");
  const [gradeOpen, setGradeOpen] = useState(false);

  // Voice
  const [recorderState, setRecorderState] = useState<RecorderState>("idle");
  const [micError, setMicError] = useState<string | null>(null);
  const recorderRef = useRef<VoiceRecorder | null>(null);

  // Language
  const [langInfo, setLangInfo] = useState<LanguageInfo | null>(null);
  const [detecting, setDetecting] = useState(false);

  // Results
  const [activeTab, setActiveTab] = useState<ActiveTab>("explanation");
  const [explanation, setExplanation] = useState<ExplainResponse | null>(null);
  const [quiz, setQuiz] = useState<QuizResponse | null>(null);
  const [visual, setVisual] = useState<VisualResponse | null>(null);

  // Loading states per action
  const [explainLoading, setExplainLoading] = useState(false);
  const [quizLoading, setQuizLoading] = useState(false);
  const [visualLoading, setVisualLoading] = useState(false);
  const [explainError, setExplainError] = useState<string | null>(null);
  const [quizError, setQuizError] = useState<string | null>(null);
  const [visualError, setVisualError] = useState<string | null>(null);

  // ── Health check on mount ──────────────────────────────────────────────────
  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    healthCheck()
      .then((h) => setConfigErrors(h.config_errors ?? []))
      .catch(() => setBackendError(`Cannot connect to ShikshaAI backend at ${apiUrl}. Is it running?`));
  }, []);

  // ── Detect language while typing (debounced 800ms) ─────────────────────────
  useEffect(() => {
    if (!conceptText.trim() || conceptText.length < 6) {
      setLangInfo(null);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        setDetecting(true);
        const info = await detectLanguage(conceptText);
        setLangInfo(info);
      } catch {
        // silently ignore
      } finally {
        setDetecting(false);
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [conceptText]);

  // ── Voice recording ────────────────────────────────────────────────────────
  const handleVoiceClick = useCallback(async () => {
    setMicError(null);

    if (recorderState === "recording") {
      // Stop → transcribe
      setRecorderState("processing");
      try {
        const blob = await recorderRef.current!.stop();
        const result = await transcribeAudio(blob, gradeLevel);
        setConceptText(result.text);
        setLangInfo(result.language_info);
      } catch (e: any) {
        setMicError(e.message ?? "Transcription failed");
      } finally {
        setRecorderState("idle");
        recorderRef.current = null;
      }
    } else {
      // Start recording
      try {
        const recorder = new VoiceRecorder();
        await recorder.start();
        recorderRef.current = recorder;
        setRecorderState("recording");
      } catch (e: any) {
        if (e.name === "NotAllowedError") {
          setMicError("Microphone permission denied. Please allow mic access in your browser.");
        } else {
          setMicError(e.message ?? "Could not start recording");
        }
      }
    }
  }, [recorderState, gradeLevel]);

  // ── Explain ────────────────────────────────────────────────────────────────
  const handleExplain = async () => {
    if (!conceptText.trim()) return;
    setExplainError(null);
    setExplainLoading(true);
    setActiveTab("explanation");

    try {
      // Ensure we have language info
      let lang = langInfo;
      if (!lang) {
        lang = await detectLanguage(conceptText);
        setLangInfo(lang);
      }

      const result = await explainConcept(conceptText, lang, gradeLevel);
      setExplanation(result);
      // Reset downstream results when new concept explained
      setQuiz(null);
      setVisual(null);
      setQuizError(null);
      setVisualError(null);
    } catch (e: any) {
      setExplainError(e.message ?? "Failed to generate explanation");
    } finally {
      setExplainLoading(false);
    }
  };

  // ── Quiz ───────────────────────────────────────────────────────────────────
  const handleQuiz = async () => {
    if (!explanation) return;
    setQuizError(null);
    setQuizLoading(true);
    setActiveTab("quiz");

    try {
      const result = await generateQuiz(conceptText, explanation.explanation, langInfo!);
      setQuiz(result);
    } catch (e: any) {
      setQuizError(e.message ?? "Quiz generation failed");
    } finally {
      setQuizLoading(false);
    }
  };

  // ── Visual ─────────────────────────────────────────────────────────────────
  const handleVisual = async () => {
    if (!explanation) return;
    setVisualError(null);
    setVisualLoading(true);
    setActiveTab("visual");

    try {
      const result = await generateVisual(conceptText, explanation.explanation);
      setVisual(result);
    } catch (e: any) {
      setVisualError(e.message ?? "Visual generation failed");
    } finally {
      setVisualLoading(false);
    }
  };

  // ── Reset ──────────────────────────────────────────────────────────────────
  const handleReset = () => {
    setConceptText("");
    setLangInfo(null);
    setExplanation(null);
    setQuiz(null);
    setVisual(null);
    setExplainError(null);
    setQuizError(null);
    setVisualError(null);
    setActiveTab("explanation");
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── Top Nav ── */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg mic-btn-gradient flex items-center justify-center">
              <GraduationCap size={18} className="text-white" />
            </div>
            <div>
              <span className="font-bold text-slate-800 text-sm leading-none">ShikshaAI Bharat</span>
              <p className="text-xs text-slate-400 leading-none">Classroom Copilot</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Grade selector */}
            <div className="relative">
              <button
                onClick={() => setGradeOpen((p) => !p)}
                className="flex items-center gap-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition text-slate-700"
              >
                {gradeLevel} <ChevronDown size={13} />
              </button>
              {gradeOpen && (
                <div className="absolute right-0 top-9 bg-white border border-slate-200 rounded-xl shadow-xl z-50 w-44 py-1 text-sm">
                  {GRADE_OPTIONS.map((g) => (
                    <button
                      key={g}
                      onClick={() => { setGradeLevel(g); setGradeOpen(false); }}
                      className={`w-full text-left px-4 py-2 hover:bg-indigo-50 hover:text-indigo-700 transition ${g === gradeLevel ? "text-indigo-600 font-semibold" : "text-slate-700"}`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={handleReset}
              title="Clear everything"
              className="text-slate-400 hover:text-slate-600 transition p-1.5 rounded-lg hover:bg-slate-100"
            >
              <RefreshCw size={16} />
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-5">

        {/* ── Errors & warnings ── */}
        {backendError && <AlertBanner errors={[backendError]} type="error" />}
        {configErrors.length > 0 && <AlertBanner errors={configErrors} type="warning" />}

        {/* ── Feature cards ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {FEATURES.map((f) => (
            <div key={f.title} className={`${f.bg} rounded-xl p-4 card-lift`}>
              <div className="mb-2">{f.icon}</div>
              <p className="font-semibold text-slate-800 text-sm">{f.title}</p>
              <p className="text-slate-500 text-xs mt-0.5 leading-snug">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* ── Main 2-column layout ── */}
        <div className="grid md:grid-cols-[360px,1fr] gap-5">

          {/* LEFT — Input panel */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-5">
            {/* Voice section */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Mic size={15} className="text-indigo-500" />
                <span className="font-semibold text-slate-700 text-sm">Voice Assistant</span>
              </div>
              <p className="text-xs text-slate-400 mb-4">
                Tap the microphone and speak naturally — Hinglish, Tamil, Hindi, English & more
              </p>

              <VoiceButton state={recorderState} onClick={handleVoiceClick} />

              {micError && (
                <p className="mt-3 text-xs text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  ⚠ {micError}
                </p>
              )}
            </div>

            <div className="border-t border-slate-100" />

            {/* Text input */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Globe size={14} className="text-slate-400" />
                <span className="text-xs font-medium text-slate-600">Or type your concept</span>
                {detecting && <Loader2 size={12} className="spinner text-slate-400" />}
              </div>

              <textarea
                value={conceptText}
                onChange={(e) => setConceptText(e.target.value)}
                placeholder={`Try: "Photosynthesis kya hoti hai?" or "Explain Newton's laws simply"`}
                rows={4}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition placeholder:text-slate-300"
              />

              {/* Language detection badge */}
              <LanguageBadge info={langInfo} />
            </div>

            {/* Action buttons */}
            <div className="space-y-2">
              {/* Detect + Explain */}
              <button
                onClick={handleExplain}
                disabled={!conceptText.trim() || explainLoading}
                className="w-full bg-gradient-to-r from-orange-500 to-indigo-600 text-white font-semibold py-2.5 rounded-xl text-sm hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {explainLoading ? (
                  <><Loader2 size={15} className="spinner" /> Explaining…</>
                ) : (
                  <><Sparkles size={15} /> ✦ Explain Concept</>
                )}
              </button>

              {/* Generate Visual — enabled only after explanation */}
              <button
                onClick={handleVisual}
                disabled={!explanation || visualLoading}
                className="w-full bg-teal-50 border border-teal-200 text-teal-700 font-medium py-2 rounded-xl text-sm hover:bg-teal-100 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {visualLoading ? (
                  <><Loader2 size={14} className="spinner" /> Generating…</>
                ) : (
                  <><ImageIcon size={14} /> Generate Visual</>
                )}
              </button>

              {/* Generate Quiz */}
              <button
                onClick={handleQuiz}
                disabled={!explanation || quizLoading}
                className="w-full bg-violet-50 border border-violet-200 text-violet-700 font-medium py-2 rounded-xl text-sm hover:bg-violet-100 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {quizLoading ? (
                  <><Loader2 size={14} className="spinner" /> Generating…</>
                ) : (
                  <><PenLine size={14} /> Generate Quiz</>
                )}
              </button>
            </div>
          </div>

          {/* RIGHT — Output panel */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            {/* Tabs */}
            <div className="flex border-b border-slate-200">
              {(["explanation", "visual", "quiz"] as ActiveTab[]).map((tab) => {
                const icons: Record<ActiveTab, React.ReactNode> = {
                  explanation: <BookOpen size={14} />,
                  visual: <ImageIcon size={14} />,
                  quiz: <PenLine size={14} />,
                };
                const labels: Record<ActiveTab, string> = {
                  explanation: "Explanation",
                  visual: "Visual",
                  quiz: "Quiz",
                };
                const hasContent: Record<ActiveTab, boolean> = {
                  explanation: !!explanation,
                  visual: !!visual,
                  quiz: !!quiz,
                };

                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex items-center gap-1.5 px-5 py-3 text-sm font-medium transition border-b-2 -mb-px ${
                      activeTab === tab
                        ? "border-indigo-500 text-indigo-600"
                        : "border-transparent text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    {icons[tab]}
                    {labels[tab]}
                    {hasContent[tab] && (
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block ml-0.5" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto p-5">
              {activeTab === "explanation" && (
                <>
                  {explainError && (
                    <AlertBanner errors={[explainError]} type="error" />
                  )}
                  <ExplanationPanel
                    explanation={explanation?.explanation ?? ""}
                    languageInfo={langInfo}
                  />
                </>
              )}

              {activeTab === "visual" && (
                <>
                  {visualError && (
                    <AlertBanner errors={[visualError]} type="error" />
                  )}
                  <VisualPanel
                    imageBase64={visual?.image_base64 ?? null}
                    prompt={visual?.prompt ?? null}
                  />
                </>
              )}

              {activeTab === "quiz" && (
                <>
                  {quizError && (
                    <AlertBanner errors={[quizError]} type="error" />
                  )}
                  <QuizPanel
                    mcqQuestions={quiz?.mcq_questions ?? []}
                    shortAnswerQuestions={quiz?.short_answer_questions ?? []}
                  />
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <p className="text-center text-xs text-slate-400 pb-4">
          ShikshaAI Bharat 2.0 · Built for India's 250M school students · शिक्षा सबके लिए
        </p>
      </div>
    </div>
  );
}
