import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import { interviewAPI } from "../services/api";
import toast from "react-hot-toast";

/* ══════════════════════════════════════════════════
   AI AVATAR — animated states: idle / thinking /
                speaking / listening
══════════════════════════════════════════════════ */
const AIAvatar = ({ state }) => {
  const pulseMap = {
    idle: "bg-[#0c5273]",
    thinking: "bg-amber-500",
    speaking: "bg-green-500",
    listening: "bg-purple-500",
  };
  const labelMap = {
    idle: "Idle",
    thinking: "Thinking…",
    speaking: "Speaking",
    listening: "Listening…",
  };

  return (
    <div className="flex flex-col items-center gap-3 select-none">
      {/* Outer pulse ring */}
      <div className="relative">
        {(state === "speaking" || state === "listening") && (
          <span
            className={`absolute inset-0 rounded-full ${pulseMap[state]} opacity-30 animate-ping`}
          />
        )}
        {/* Avatar circle */}
        <div
          className={`relative w-28 h-28 rounded-full flex items-center justify-center shadow-xl
          transition-all duration-500
          ${
            state === "speaking"
              ? "bg-gradient-to-br from-green-400 to-green-600 scale-105"
              : state === "listening"
                ? "bg-gradient-to-br from-purple-400 to-purple-600 scale-105"
                : state === "thinking"
                  ? "bg-gradient-to-br from-amber-400 to-amber-600"
                  : "bg-gradient-to-br from-[#0c5273] to-[#0a3d55]"
          }`}
        >
          {/* Face */}
          <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
            {/* Head */}
            <circle cx="30" cy="22" r="14" fill="white" fillOpacity="0.9" />
            {/* Eyes */}
            <circle
              cx="25"
              cy="20"
              r="2.2"
              fill={state === "thinking" ? "#f59e0b" : "#1e3a5f"}
            />
            <circle
              cx="35"
              cy="20"
              r="2.2"
              fill={state === "thinking" ? "#f59e0b" : "#1e3a5f"}
            />
            {/* Thinking dots */}
            {state === "thinking" && (
              <>
                <circle
                  cx="26"
                  cy="19"
                  r=".8"
                  fill="white"
                  className="animate-pulse"
                />
                <circle
                  cx="36"
                  cy="19"
                  r=".8"
                  fill="white"
                  className="animate-pulse"
                />
              </>
            )}
            {/* Mouth — changes with state */}
            {state === "speaking" ? (
              <ellipse cx="30" cy="27" rx="4" ry="2.5" fill="#1e3a5f" />
            ) : state === "listening" ? (
              <path
                d="M26 27 Q30 29.5 34 27"
                stroke="#1e3a5f"
                strokeWidth="1.8"
                strokeLinecap="round"
                fill="none"
              />
            ) : (
              <path
                d="M26 26.5 Q30 28.5 34 26.5"
                stroke="#1e3a5f"
                strokeWidth="1.8"
                strokeLinecap="round"
                fill="none"
              />
            )}
            {/* Body */}
            <path
              d="M14 48 Q14 38 30 38 Q46 38 46 48"
              fill="white"
              fillOpacity="0.7"
            />
            {/* Tie */}
            <path d="M28 38 L30 44 L32 38" fill="#0c5273" opacity="0.8" />
          </svg>

          {/* Speaking wave bars */}
          {state === "speaking" && (
            <div className="absolute -bottom-1 flex gap-0.5 items-end">
              {[3, 5, 7, 5, 3].map((h, i) => (
                <div
                  key={i}
                  className="w-1 bg-white rounded-full animate-bounce"
                  style={{ height: `${h}px`, animationDelay: `${i * 0.1}s` }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="text-center">
        <p className="text-sm font-bold text-gray-800">AI HR Interviewer</p>
        <span
          className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full mt-1
          ${
            state === "speaking"
              ? "bg-green-100 text-green-700"
              : state === "listening"
                ? "bg-purple-100 text-purple-700"
                : state === "thinking"
                  ? "bg-amber-100 text-amber-700"
                  : "bg-gray-100 text-gray-500"
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full
            ${
              state === "speaking"
                ? "bg-green-500 animate-pulse"
                : state === "listening"
                  ? "bg-purple-500 animate-pulse"
                  : state === "thinking"
                    ? "bg-amber-500 animate-pulse"
                    : "bg-gray-400"
            }`}
          />
          {labelMap[state]}
        </span>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════
   TIMER
══════════════════════════════════════════════════ */
const CountdownTimer = ({ totalSec, onExpire }) => {
  const [rem, setRem] = useState(totalSec);
  const ref = useRef(null);

  useEffect(() => {
    setRem(totalSec);
    ref.current = setInterval(() => {
      setRem((r) => {
        if (r <= 1) {
          clearInterval(ref.current);
          onExpire();
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(ref.current);
  }, [totalSec]);

  const m = String(Math.floor(rem / 60)).padStart(2, "0");
  const s = String(rem % 60).padStart(2, "0");
  const pct = ((totalSec - rem) / totalSec) * 100;
  const critical = rem < 60;

  return (
    <div
      className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 transition-colors
      ${critical ? "border-red-400 bg-red-50" : "border-gray-200 bg-white"}`}
    >
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        className={critical ? "text-red-500" : "text-[#0c5273]"}
      >
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
        <polyline
          points="12 6 12 12 16 14"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
      <span
        className={`font-mono font-bold text-lg ${critical ? "text-red-600 animate-pulse" : "text-gray-800"}`}
      >
        {m}:{s}
      </span>
    </div>
  );
};

/* ══════════════════════════════════════════════════
   SETUP FORM
══════════════════════════════════════════════════ */
const DURATIONS = [5, 10, 15, 20, 30];

const SetupForm = ({ onStart }) => {
  const [jobRole, setJobRole] = useState("");
  const [jobDesc, setJobDesc] = useState("");
  const [duration, setDuration] = useState(15);
  const [loading, setLoading] = useState(false);

  const handleStart = async () => {
    if (!jobRole.trim()) {
      toast.error("Please enter the job role");
      return;
    }
    if (!jobDesc.trim()) {
      toast.error("Please enter the job description");
      return;
    }
    setLoading(true);
    try {
      await onStart(jobRole.trim(), jobDesc.trim(), duration);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-[#0c5273]/10 rounded-2xl flex items-center justify-center mx-auto">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              className="text-[#0c5273]"
            >
              <path
                d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
              <circle
                cx="9"
                cy="7"
                r="4"
                stroke="currentColor"
                strokeWidth="1.8"
              />
              <path
                d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            AI HR Live Interview
          </h1>
          <p className="text-gray-500 text-sm">
            Powered by Google Gemini · Voice + Text · Real-time feedback
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5 shadow-sm">
          {/* Job Role */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Job Role <span className="text-red-500">*</span>
            </label>
            <input
              value={jobRole}
              onChange={(e) => setJobRole(e.target.value)}
              placeholder="e.g., React Developer, Data Analyst, Business Analyst"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0c5273]/20 focus:border-[#0c5273]"
            />
          </div>

          {/* Job Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Job Description / Skills <span className="text-red-500">*</span>
            </label>
            <textarea
              value={jobDesc}
              onChange={(e) => setJobDesc(e.target.value)}
              rows={5}
              placeholder={`e.g., We are looking for a React Developer with:\n• 2+ years of React.js experience\n• Strong knowledge of JavaScript, REST APIs\n• Experience with Git, Agile methodologies\n• Good communication skills`}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#0c5273]/20 focus:border-[#0c5273]"
            />
            <p className="text-xs text-gray-400 mt-1">
              The AI will tailor all questions to this role and description.
            </p>
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Interview Duration
            </label>
            <div className="flex flex-wrap gap-2">
              {DURATIONS.map((d) => (
                <button
                  key={d}
                  onClick={() => setDuration(d)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-all ${
                    duration === d
                      ? "border-[#0c5273] bg-[#0c5273] text-white"
                      : "border-gray-200 text-gray-600 hover:border-[#0c5273]/40"
                  }`}
                >
                  {d} min
                </button>
              ))}
            </div>
          </div>

          {/* Tips */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-1.5 text-xs text-blue-700">
            <p className="font-bold text-blue-800">Before you start:</p>
            <p>🎤 Allow microphone access when prompted</p>
            <p>🔊 Make sure your speakers/headphones are working</p>
            <p>
              💬 The AI will speak questions aloud — you respond verbally or
              type
            </p>
            <p>
              🎧 <strong>Auto-Listen (default ON):</strong> Mic auto-starts
              after AI speaks. Pause speaking to auto-submit.
            </p>
            <p>⏱️ Timer begins immediately after the first question loads</p>
          </div>

          <button
            onClick={handleStart}
            disabled={loading}
            className="w-full bg-[#0c5273] hover:bg-[#0a4561] text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-60 flex items-center justify-center gap-2 text-sm"
          >
            {loading ? (
              <>
                <svg
                  className="animate-spin w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeDasharray="30"
                    strokeDashoffset="10"
                  />
                </svg>{" "}
                Starting Interview…
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <polygon points="5 3 19 12 5 21 5 3" fill="currentColor" />
                </svg>{" "}
                Start Interview
              </>
            )}
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
};

/* ══════════════════════════════════════════════════
   RESULT SCREEN
══════════════════════════════════════════════════ */
const ResultScreen = ({ session, onRetry }) => {
  const navigate = useNavigate();
  const s = session?.scores || {};
  const scoreItems = [
    {
      label: "Overall",
      value: s.overall,
      color: "text-[#0c5273]",
      bg: "bg-[#0c5273]/10",
    },
    {
      label: "Communication",
      value: s.communication,
      color: "text-green-700",
      bg: "bg-green-50",
    },
    {
      label: "Fluency",
      value: s.fluency,
      color: "text-blue-700",
      bg: "bg-blue-50",
    },
    {
      label: "Role Knowledge",
      value: s.roleKnowledge,
      color: "text-purple-700",
      bg: "bg-purple-50",
    },
    {
      label: "Answer Relevance",
      value: s.answerRelevance,
      color: "text-indigo-700",
      bg: "bg-indigo-50",
    },
    {
      label: "Behavioral Skills",
      value: s.behavioralSkills,
      color: "text-teal-700",
      bg: "bg-teal-50",
    },
    {
      label: "Professionalism",
      value: s.professionalism,
      color: "text-amber-700",
      bg: "bg-amber-50",
    },
  ];

  const overall = s.overall ?? 0;
  const circumference = 2 * Math.PI * 42;

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Hero */}
        <div
          className={`rounded-2xl p-8 text-center ${
            overall >= 75
              ? "bg-gradient-to-br from-green-50 to-emerald-100 border border-green-200"
              : overall >= 50
                ? "bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-200"
                : "bg-gradient-to-br from-orange-50 to-red-100 border border-red-200"
          }`}
        >
          {/* Circular score */}
          <div className="relative w-32 h-32 mx-auto mb-4">
            <svg
              width="128"
              height="128"
              viewBox="0 0 128 128"
              className="-rotate-90"
            >
              <circle
                cx="64"
                cy="64"
                r="42"
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="10"
              />
              <circle
                cx="64"
                cy="64"
                r="42"
                fill="none"
                stroke={
                  overall >= 75
                    ? "#10b981"
                    : overall >= 50
                      ? "#3b82f6"
                      : "#f97316"
                }
                strokeWidth="10"
                strokeDasharray={circumference}
                strokeDashoffset={
                  circumference - (overall / 100) * circumference
                }
                strokeLinecap="round"
                style={{ transition: "stroke-dashoffset 1.5s ease" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-gray-900">
                {overall}
              </span>
              <span className="text-xs text-gray-500">/100</span>
            </div>
          </div>
          <h1 className="text-xl font-bold text-gray-900">
            Interview Completed!
          </h1>
          <p className="text-gray-600 text-sm mt-1">
            Role: <span className="font-semibold">{session?.jobRole}</span> ·
            Duration: {session?.durationMinutes} min · Questions:{" "}
            {session?.qa?.length ?? 0}
          </p>
        </div>

        {/* Score grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {scoreItems.slice(1).map((item) => (
            <div
              key={item.label}
              className={`rounded-xl p-3 text-center ${item.bg}`}
            >
              <p className={`text-xl font-bold ${item.color}`}>
                {item.value ?? "—"}
              </p>
              <p className="text-[10px] text-gray-600 font-medium mt-0.5">
                {item.label}
              </p>
            </div>
          ))}
        </div>

        {/* Strengths / Improvements / Recommendations */}
        {[
          {
            title: "✅ Strengths",
            items: session?.strengths,
            bg: "bg-green-50 border-green-200",
            text: "text-green-800",
          },
          {
            title: "📈 Needs Improvement",
            items: session?.improvements,
            bg: "bg-orange-50 border-orange-200",
            text: "text-orange-800",
          },
          {
            title: "💡 AI Recommendations",
            items: session?.recommendations,
            bg: "bg-blue-50 border-blue-200",
            text: "text-blue-800",
          },
        ].map(
          (sec) =>
            sec.items?.length > 0 && (
              <div
                key={sec.title}
                className={`rounded-xl border p-5 ${sec.bg}`}
              >
                <h3 className={`font-bold text-sm mb-3 ${sec.text}`}>
                  {sec.title}
                </h3>
                <ul className="space-y-1.5">
                  {sec.items.map((item, i) => (
                    <li key={i} className="flex gap-2 text-sm text-gray-700">
                      <span className="mt-1 flex-shrink-0">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ),
        )}

        {/* Q&A Review */}
        {session?.qa?.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="font-bold text-sm text-gray-800">
                Interview Transcript
              </h3>
            </div>
            <div className="divide-y divide-gray-100">
              {session.qa.map((item, i) => (
                <div key={i} className="p-5 space-y-2">
                  <p className="text-xs font-bold text-[#0c5273]">Q{i + 1}</p>
                  <p className="text-sm font-medium text-gray-800">
                    {item.question}
                  </p>
                  <div className="bg-gray-50 rounded-lg px-4 py-2.5">
                    <p className="text-xs font-semibold text-gray-500 mb-1">
                      Your answer:
                    </p>
                    <p className="text-sm text-gray-700">
                      {item.answer || (
                        <em className="text-gray-400">No answer given</em>
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-3 justify-center pb-4">
          <button
            onClick={onRetry}
            className="px-5 py-2.5 border-2 border-[#0c5273] text-[#0c5273] rounded-xl text-sm font-semibold hover:bg-[#0c5273]/5 transition-colors"
          >
            Try Again
          </button>
          <button
            onClick={() => navigate("/hr-prep/interview-history")}
            className="px-5 py-2.5 bg-[#0c5273] text-white rounded-xl text-sm font-semibold hover:bg-[#0a4561] transition-colors"
          >
            View All History →
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
};

/* ══════════════════════════════════════════════════
   MAIN INTERVIEW SCREEN
══════════════════════════════════════════════════ */
export default function LiveInterviewPage() {
  const navigate = useNavigate();

  // ─ phases: setup | interview | evaluating | result
  const [phase, setPhase] = useState("setup");
  const [sessionId, setSessionId] = useState(null);
  const [question, setQuestion] = useState("");
  const [questionNo, setQuestionNo] = useState(1);
  const [jobRole, setJobRoleState] = useState("");
  const [duration, setDurationState] = useState(15);
  const [avatarState, setAvatarState] = useState("idle"); // idle|thinking|speaking|listening
  const [transcript, setTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [timerKey, setTimerKey] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [autoListen, setAutoListen] = useState(true);
  const [silenceThreshold, setSilenceThreshold] = useState(2500);

  const recognitionRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);
  const sessionIdRef = useRef(null);
  const startTimeRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const lastSpeechTimeRef = useRef(null);
  const autoListenRef = useRef(true);
  const finalTranscriptRef = useRef("");
  const submitAnswerRef = useRef(null);
  const answerFromSpeechRef = useRef(false);
  const startListeningRef = useRef(null);

  useEffect(() => {
    autoListenRef.current = autoListen;
  }, [autoListen]);

  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  const handleSilenceDetected = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, []);

  const resetSilenceTimer = useCallback(() => {
    clearSilenceTimer();
    lastSpeechTimeRef.current = Date.now();
    silenceTimerRef.current = setTimeout(() => {
      const hasSpeech = finalTranscriptRef.current.trim().length > 0;
      if (hasSpeech) {
        handleSilenceDetected();
      }
    }, silenceThreshold);
  }, [clearSilenceTimer, handleSilenceDetected, silenceThreshold]);

  /* ── Speech Synthesis — speak question aloud ── */
  const speak = useCallback(
    (text) => {
      if (!synthRef.current) return;
      synthRef.current.cancel();
      const utt = new SpeechSynthesisUtterance(text);
      utt.rate = 0.92;
      utt.pitch = 1.0;
      utt.volume = 1.0;
      utt.onstart = () => setAvatarState("speaking");
      utt.onend = () => {
        setAvatarState("idle");
        if (autoListenRef.current && phase === "interview") {
          setTimeout(() => startListeningRef.current?.(), 350);
        }
      };
      synthRef.current.speak(utt);
    },
    [phase],
  );

  /* ── Speech Recognition ── */
  const startListening = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      toast.error(
        "Speech recognition not supported in this browser. Please type your answer.",
      );
      return;
    }
    if (synthRef.current?.speaking) synthRef.current.cancel();

    answerFromSpeechRef.current = true;
    finalTranscriptRef.current = "";
    lastSpeechTimeRef.current = Date.now();

    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (e) => {
      let interim = "",
        final = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) {
          final += t;
          finalTranscriptRef.current += t;
        } else {
          interim += t;
        }
      }
      if (final || interim) {
        resetSilenceTimer();
      }
      setTranscript((prev) => {
        const clean = prev.replace(/\s*\[.*?\]/g, "");
        return clean + final + (interim ? ` [${interim}]` : "");
      });
    };
    recognition.onerror = (e) => {
      if (e.error !== "no-speech") toast.error(`Mic error: ${e.error}`);
    };
    recognition.onend = () => {
      clearSilenceTimer();
      setIsListening(false);
      setAvatarState("idle");
      setTranscript((prev) => {
        const clean = prev.replace(/\s*\[.*?\]/g, "").trim();
        finalTranscriptRef.current = clean;
        return clean;
      });
      if (
        autoListenRef.current &&
        finalTranscriptRef.current.trim().length > 0
      ) {
        setTimeout(() => {
          submitAnswerRef.current?.();
        }, 300);
      }
    };

    recognition.start();
    recognitionRef.current = recognition;
    setIsListening(true);
    setAvatarState("listening");
    resetSilenceTimer();
  }, [clearSilenceTimer, resetSilenceTimer]);

  useEffect(() => {
    startListeningRef.current = startListening;
  }, [startListening]);

  const stopListening = useCallback(() => {
    clearSilenceTimer();
    recognitionRef.current?.stop();
    setIsListening(false);
    setAvatarState("idle");
  }, [clearSilenceTimer]);

  /* ── Start interview ── */
  const handleStart = async (role, jd, dur) => {
    try {
      setAvatarState("thinking");
      const { data } = await interviewAPI.start({
        jobRole: role,
        jobDescription: jd,
        durationMinutes: dur,
      });
      setSessionId(data.sessionId);
      sessionIdRef.current = data.sessionId;
      setJobRoleState(role);
      setDurationState(dur);
      setQuestion(data.question);
      setQuestionNo(data.questionNo);
      setStartTime(Date.now());
      startTimeRef.current = Date.now();
      setTimerKey((k) => k + 1);
      setPhase("interview");
      setTimeout(() => speak(data.question), 400);
    } catch (err) {
      setAvatarState("idle");
      toast.error(err.response?.data?.message || "Failed to start interview");
    }
  };

  /* ── Submit answer → get next question ── */
  const handleSubmitAnswer = async () => {
    if (submitting) return;
    const ans = transcript.trim();
    const isSpeech = answerFromSpeechRef.current;
    stopListening();
    setSubmitting(true);
    setAvatarState("thinking");

    try {
      const timeTaken = Math.round(
        (Date.now() - (startTime || Date.now())) / 1000,
      );
      const { data } = await interviewAPI.answer(sessionIdRef.current, {
        answer: ans,
        timeTaken,
        isSpeech,
      });
      setQuestion(data.question);
      setQuestionNo(data.questionNo);
      setTranscript("");
      finalTranscriptRef.current = "";
      answerFromSpeechRef.current = false;
      setStartTime(Date.now());
      setTimeout(() => speak(data.question), 300);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to get next question");
      setAvatarState("idle");
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    submitAnswerRef.current = handleSubmitAnswer;
  }, [handleSubmitAnswer]);

  /* ── Timer expired / manual end ── */
  const handleInterviewEnd = useCallback(async () => {
    if (phase !== "interview") return;
    stopListening();
    synthRef.current?.cancel();
    clearSilenceTimer();

    // Save last unanswered question if any
    if (transcript.trim()) {
      try {
        await interviewAPI.answer(sessionIdRef.current, {
          answer: transcript.trim(),
          timeTaken: 0,
          isSpeech: answerFromSpeechRef.current,
        });
      } catch {}
    }

    answerFromSpeechRef.current = false;
    finalTranscriptRef.current = "";

    setPhase("evaluating");
    setAvatarState("thinking");
    toast("Interview ended — evaluating your performance…", { icon: "🤖" });

    try {
      const actualDuration = Math.round(
        (Date.now() - (startTimeRef.current || Date.now())) / 1000,
      );
      await interviewAPI.complete(sessionIdRef.current, { actualDuration });
      const { data } = await interviewAPI.evaluate(sessionIdRef.current);
      setResult(data.session);
      setPhase("result");
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          "Evaluation failed — please check history",
      );
      navigate("/hr-prep/interview-history");
    }
  }, [phase, transcript, stopListening, navigate, clearSilenceTimer]);

  /* ── Retry ── */
  const handleRetry = () => {
    synthRef.current?.cancel();
    clearSilenceTimer();
    setPhase("setup");
    setTranscript("");
    setQuestion("");
    setAvatarState("idle");
    setResult(null);
    setSessionId(null);
    answerFromSpeechRef.current = false;
    finalTranscriptRef.current = "";
  };

  /* ─────── RENDER ─────── */
  if (phase === "setup") return <SetupForm onStart={handleStart} />;
  if (phase === "result")
    return <ResultScreen session={result} onRetry={handleRetry} />;

  if (phase === "evaluating")
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-6">
          <AIAvatar state="thinking" />
          <div className="text-center space-y-2">
            <h2 className="text-xl font-bold text-gray-900">
              Evaluating your interview…
            </h2>
            <p className="text-gray-500 text-sm">
              Gemini AI is analyzing your responses. This takes a few seconds.
            </p>
          </div>
          <svg
            className="animate-spin w-8 h-8 text-[#0c5273]"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="3"
              strokeDasharray="30"
              strokeDashoffset="10"
            />
          </svg>
        </div>
      </DashboardLayout>
    );

  /* ─────── INTERVIEW SCREEN ─────── */
  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto px-4 py-4 space-y-4">
        {/* ── Top bar ── */}
        <div className="flex items-center justify-between flex-wrap gap-3 bg-white rounded-xl border border-gray-200 px-4 py-3">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs font-semibold text-gray-500">Role:</span>
            <span className="text-xs font-bold text-[#0c5273] bg-[#0c5273]/10 px-2.5 py-1 rounded-full">
              {jobRole}
            </span>
            <span className="text-xs text-gray-400">Q{questionNo}</span>
            <div className="flex items-center gap-2 ml-2 pl-3 border-l border-gray-200">
              <label className="flex items-center gap-1.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={autoListen}
                  onChange={(e) => setAutoListen(e.target.checked)}
                  className="w-3.5 h-3.5 accent-[#0c5273] cursor-pointer"
                />
                <span
                  className={`text-[11px] font-semibold ${
                    autoListen ? "text-[#0c5273]" : "text-gray-500"
                  }`}
                >
                  🎧 Auto-Listen
                </span>
              </label>
              {autoListen && (
                <select
                  value={silenceThreshold}
                  onChange={(e) => setSilenceThreshold(Number(e.target.value))}
                  className="text-[10px] border border-gray-200 rounded-md px-1.5 py-0.5 bg-gray-50 text-gray-600 focus:outline-none focus:ring-1 focus:ring-[#0c5273]"
                  title="Silence detection threshold"
                >
                  <option value={1500}>1.5s</option>
                  <option value={2500}>2.5s</option>
                  <option value={4000}>4s</option>
                  <option value={6000}>6s</option>
                </select>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <CountdownTimer
              key={timerKey}
              totalSec={duration * 60}
              onExpire={handleInterviewEnd}
            />
            <button
              onClick={handleInterviewEnd}
              className="text-xs font-semibold text-red-500 border border-red-200 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors"
            >
              End Interview
            </button>
          </div>
        </div>

        {/* ── Main area ── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* Avatar + question */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-6 flex flex-col items-center gap-5">
            <AIAvatar state={avatarState} />
            {/* Question bubble */}
            <div className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4">
              <p className="text-xs font-bold text-gray-400 mb-1.5">
                Question {questionNo}
              </p>
              {submitting || avatarState === "thinking" ? (
                <div className="flex gap-1.5 items-center py-2">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="w-2 h-2 bg-[#0c5273] rounded-full animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                  <span className="text-xs text-gray-400 ml-1">
                    Generating question…
                  </span>
                </div>
              ) : (
                <p className="text-sm text-gray-800 leading-relaxed font-medium">
                  {question}
                </p>
              )}
            </div>
            {/* Re-speak button */}
            <button
              onClick={() => question && speak(question)}
              disabled={avatarState === "speaking" || !question}
              className="flex items-center gap-2 text-xs text-[#0c5273] font-semibold hover:underline disabled:opacity-40"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                <polygon
                  points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
              Hear question again
            </button>
          </div>

          {/* Answer panel */}
          <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-200 p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-gray-700">Your Answer</h3>
                {autoListen && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-purple-600 border border-purple-200">
                    ⚡ Auto-mode active
                  </span>
                )}
              </div>
              <span
                className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                  isListening
                    ? "bg-red-100 text-red-600 animate-pulse"
                    : autoListen
                      ? "bg-purple-50 text-purple-600"
                      : "bg-gray-100 text-gray-500"
                }`}
              >
                {isListening
                  ? "🔴 Recording…"
                  : autoListen
                    ? "🎧 Waiting for AI…"
                    : "Microphone off"}
              </span>
            </div>

            {/* Transcript area */}
            <div className="flex-1 min-h-[140px] bg-gray-50 border border-gray-200 rounded-xl p-4 relative">
              {transcript ? (
                <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                  {transcript}
                </p>
              ) : (
                <p className="text-sm text-gray-400 italic">
                  {isListening
                    ? "Listening… speak clearly into your microphone"
                    : autoListen
                      ? "After AI speaks, mic turns on automatically. Pause to auto-submit."
                      : 'Click "Start Speaking" or type your answer below'}
                </p>
              )}
            </div>

            {/* Type answer fallback */}
            <textarea
              rows={3}
              value={transcript}
              onChange={(e) => {
                answerFromSpeechRef.current = false;
                setTranscript(e.target.value);
              }}
              placeholder="Or type your answer here…"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#0c5273]/20 focus:border-[#0c5273]"
            />

            {/* Mic + Submit buttons */}
            <div className="flex gap-3">
              <button
                onClick={isListening ? stopListening : startListening}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${
                  isListening
                    ? "border-red-400 bg-red-50 text-red-600 hover:bg-red-100"
                    : "border-[#0c5273] text-[#0c5273] hover:bg-[#0c5273]/5"
                }`}
              >
                {isListening ? (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <rect
                        x="9"
                        y="2"
                        width="6"
                        height="12"
                        rx="3"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                      <path
                        d="M5 10a7 7 0 0 0 14 0M12 19v4M8 23h8"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>{" "}
                    Stop Recording
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <rect
                        x="9"
                        y="2"
                        width="6"
                        height="12"
                        rx="3"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                      <path
                        d="M5 10a7 7 0 0 0 14 0M12 19v4M8 23h8"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>{" "}
                    🎤 Start Speaking
                  </>
                )}
              </button>

              <button
                onClick={handleSubmitAnswer}
                disabled={submitting || !transcript.trim()}
                className="flex-1 flex items-center justify-center gap-2 bg-[#0c5273] hover:bg-[#0a4561] text-white py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <svg
                      className="animate-spin w-4 h-4"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeDasharray="30"
                        strokeDashoffset="10"
                      />
                    </svg>{" "}
                    Sending…
                  </>
                ) : (
                  "Submit Answer →"
                )}
              </button>
            </div>

            {/* Clear */}
            {transcript && (
              <button
                onClick={() => {
                  setTranscript("");
                  answerFromSpeechRef.current = false;
                  finalTranscriptRef.current = "";
                }}
                className="self-start text-xs text-gray-400 hover:text-red-500 transition-colors"
              >
                ✕ Clear answer
              </button>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="bg-white rounded-xl border border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
            <span>Interview Progress</span>
            <span>Q{questionNo} answered</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
            <div
              className="h-2 bg-[#0c5273] rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, (questionNo / 10) * 100)}%` }}
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
