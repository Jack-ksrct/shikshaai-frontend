// API client for ShikshaAI Bharat backend

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface LanguageInfo {
  primary_language: string;
  secondary_languages: string[];
  code_mix_type: string | null;
  script: string;
  confidence: number;
  language_style_note: string;
  display_label: string;
}

export interface TranscribeResponse {
  text: string;
  language: string;
  language_probability: number;
  language_info: LanguageInfo;
}

export interface ExplainResponse {
  explanation: string;
  topic: string;
}

export interface MCQQuestion {
  question: string;
  options: string[];
  correct_answer: string;
  explanation: string;
}

export interface ShortAnswerQuestion {
  question: string;
  model_answer: string;
  keywords: string[];
}

export interface QuizResponse {
  mcq_questions: MCQQuestion[];
  short_answer_questions: ShortAnswerQuestion[];
}

export interface VisualResponse {
  image_base64: string;
  prompt: string;
}

export interface TTSResponse {
  audio_base64: string;
  voice: string;
}

export interface HealthResponse {
  status: string;
  config_errors: string[];
  ollama_model: string;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const err = await res.json();
      detail = err.detail || detail;
    } catch {}
    throw new Error(detail);
  }
  return res.json() as Promise<T>;
}

export async function healthCheck(): Promise<HealthResponse> {
  const res = await fetch(`${BASE}/api/health`);
  return handleResponse<HealthResponse>(res);
}

export async function transcribeAudio(
  audioBlob: Blob,
  gradeLevel = "Class 6-8"
): Promise<TranscribeResponse> {
  const form = new FormData();
  form.append("file", audioBlob, "recording.webm");
  form.append("grade_level", gradeLevel);
  const res = await fetch(`${BASE}/api/transcribe`, { method: "POST", body: form });
  return handleResponse<TranscribeResponse>(res);
}

export async function detectLanguage(
  text: string,
  whisperLang?: string
): Promise<LanguageInfo> {
  const res = await fetch(`${BASE}/api/detect-language`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, whisper_lang: whisperLang ?? null }),
  });
  return handleResponse<LanguageInfo>(res);
}

export async function explainConcept(
  text: string,
  languageInfo: LanguageInfo,
  gradeLevel = "Class 6-8"
): Promise<ExplainResponse> {
  const res = await fetch(`${BASE}/api/explain`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, language_info: languageInfo, grade_level: gradeLevel }),
  });
  return handleResponse<ExplainResponse>(res);
}

export async function generateQuiz(
  conceptText: string,
  explanation: string,
  languageInfo: LanguageInfo
): Promise<QuizResponse> {
  const res = await fetch(`${BASE}/api/quiz`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ concept_text: conceptText, explanation, language_info: languageInfo }),
  });
  return handleResponse<QuizResponse>(res);
}

export async function generateVisual(
  conceptText: string,
  explanation: string
): Promise<VisualResponse> {
  const res = await fetch(`${BASE}/api/visual`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ concept_text: conceptText, explanation }),
  });
  return handleResponse<VisualResponse>(res);
}

export async function synthesizeSpeech(
  text: string,
  primaryLanguage: string,
  codeMixType?: string | null
): Promise<TTSResponse> {
  const res = await fetch(`${BASE}/api/tts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text,
      primary_language: primaryLanguage,
      code_mix_type: codeMixType ?? null,
    }),
  });
  return handleResponse<TTSResponse>(res);
}

/** Play base64 mp3 audio in the browser */
export function playAudioBase64(base64: string): HTMLAudioElement {
  const audio = new Audio(`data:audio/mp3;base64,${base64}`);
  audio.play().catch((e) => console.warn("Audio play error:", e));
  return audio;
}
