const { GoogleGenerativeAI } = require("@google/generative-ai");
const InterviewSession = require("../models/InterviewSession");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");

/* ── Auto-Listen default configuration ── */
const AUTO_LISTEN_DEFAULTS = {
  enabled: true,
  silenceThresholdMs: 2500,
  silenceThresholdOptions: [1500, 2500, 4000, 6000],
  minTranscriptWords: 2,
  maxTranscriptChars: 5000,
  fillerWords: [
    "um",
    "uh",
    "er",
    "ah",
    "like",
    "you know",
    "sort of",
    "kind of",
    "i mean",
    "basically",
    "actually",
    "literally",
    "so yeah",
    "mm hmm",
    "hmm",
    "uh huh",
    "right",
    "okay so",
    "well",
    "you see",
  ],
};

/* ── Auto-Listen helper: clean speech transcript ──
   Strips filler words, trims extra whitespace, normalizes punctuation.
── */
const cleanTranscript = (text) => {
  if (!text) return "";
  let cleaned = String(text).trim().toLowerCase();

  for (const filler of AUTO_LISTEN_DEFAULTS.fillerWords) {
    const re = new RegExp(`\\b${filler.replace(/ /g, "\\s+")}\\b`, "gi");
    cleaned = cleaned.replace(re, " ");
  }

  cleaned = cleaned
    .replace(/\s+/g, " ")
    .replace(/\s+([.,!?])/g, "$1")
    .replace(/([.,!?])(?=[a-z])/g, "$1 ")
    .trim();

  if (cleaned) {
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    if (!/[.!?]$/.test(cleaned)) cleaned += ".";
  }

  return cleaned;
};

/* ── Auto-Listen helper: validate transcript quality ──
   Returns { valid, reason, wordCount } so caller can decide to submit.
── */
const validateTranscriptQuality = (text) => {
  const clean = (text || "").trim();
  if (!clean) return { valid: false, reason: "empty", wordCount: 0 };

  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length < AUTO_LISTEN_DEFAULTS.minTranscriptWords) {
    return { valid: false, reason: "too_short", wordCount: words.length };
  }
  if (clean.length > AUTO_LISTEN_DEFAULTS.maxTranscriptChars) {
    return { valid: false, reason: "too_long", wordCount: words.length };
  }
  return { valid: true, reason: "ok", wordCount: words.length };
};

/* ── Auto-Listen helper: process speech answer end-to-end ──
   Combines cleaning + validation. Returns cleaned answer or throws ApiError.
── */
const processSpeechAnswer = (rawText) => {
  const cleaned = cleanTranscript(rawText);
  const quality = validateTranscriptQuality(cleaned);
  if (!quality.valid) {
    throw new ApiError(
      `Answer ${
        quality.reason === "empty"
          ? "is empty"
          : quality.reason === "too_short"
            ? "is too short (min " +
              AUTO_LISTEN_DEFAULTS.minTranscriptWords +
              " words)"
            : "exceeds maximum length"
      }. Please try again.`,
      400,
    );
  }
  return { cleaned, wordCount: quality.wordCount };
};

/* ── Gemini client (lazy init) ── */
let genAI = null;

// Models tried in order — first available wins
const FALLBACK_MODELS = [
  "gemini-3.7-flash",
  "gemini-3.8-flash",
  "gemini-3.6-flash",
  "gemini-3.5-flash",
  "gemini-3.1-flash-lite",
];

const getGenAI = () => {
  if (!process.env.GEMINI_API_KEY)
    throw new ApiError("Gemini API key not configured", 500);
  if (!genAI) genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  return genAI;
};

/**
 * Try each model in FALLBACK_MODELS until one succeeds.
 * @param {function} fn  — async (model) => result
 */
const withFallback = async (fn) => {
  const preferred = process.env.GEMINI_MODEL;
  const models = preferred
    ? [preferred, ...FALLBACK_MODELS.filter((m) => m !== preferred)]
    : FALLBACK_MODELS;

  let lastErr;
  for (const name of models) {
    try {
      const model = getGenAI().getGenerativeModel({ model: name });
      return await fn(model, name);
    } catch (err) {
      const msg = err.message || "";
      // Only retry on 503 (overloaded) or 404 (model gone)
      if (
        msg.includes("503") ||
        msg.includes("503 Service") ||
        msg.includes("404") ||
        msg.includes("not found") ||
        msg.includes("no longer available")
      ) {
        console.warn(
          `[GEMINI] ${name} unavailable (${msg.substring(0, 60)}…), trying next…`,
        );
        lastErr = err;
        continue;
      }
      throw err; // other errors (400, auth) — don't retry
    }
  }
  throw new ApiError(
    `All Gemini models unavailable: ${lastErr?.message?.substring(0, 120)}`,
    503,
  );
};

/* ── build conversation history for Gemini ──
   Gemini requires history to alternate user/model and MUST start with 'user'.
   We prepend a synthetic user turn ("Begin") before the first model question.
── */
const buildHistory = (qa) => {
  if (!qa || qa.length === 0) return [];

  const history = [];
  qa.forEach((item, i) => {
    if (i === 0) {
      // Synthetic user opener so history starts with 'user'
      history.push({
        role: "user",
        parts: [{ text: "Please begin the interview." }],
      });
    } else {
      // Candidate's answer to the previous question
      history.push({
        role: "user",
        parts: [{ text: item.answer || "(no answer given)" }],
      });
    }
    // AI's question
    history.push({ role: "model", parts: [{ text: item.question }] });
  });

  return history;
};

/* ── system instruction object (Gemini v1beta format) ── */
const systemInstruction = (role, jd) => ({
  parts: [
    {
      text: `You are a professional HR interviewer conducting a live job interview.
Job Role: ${role}
Job Description: ${jd}

Rules:
- Ask ONE clear, concise HR interview question per turn.
- Questions must be role-specific and directly relevant to the JD.
- Build naturally on the candidate's previous answer when relevant.
- Mix behavioral (STAR), situational, and role-knowledge questions.
- Be professional, natural, and conversational.
- Do NOT add explanations or commentary — output ONLY the question.
- Do NOT number the question.
- Keep the question under 3 sentences.`.trim(),
    },
  ],
});

/* ─────────────────────────────────────────
   POST /api/interview/start
   Body: { jobRole, jobDescription, durationMinutes }
───────────────────────────────────────── */
exports.startInterview = asyncHandler(async (req, res) => {
  const { jobRole, jobDescription, durationMinutes } = req.body;

  if (!jobRole?.trim()) throw new ApiError("Job role is required", 400);
  if (!jobDescription?.trim())
    throw new ApiError("Job description is required", 400);
  const dur = parseInt(durationMinutes);
  if (![5, 10, 15, 20, 30].includes(dur))
    throw new ApiError("Invalid duration", 400);

  // Generate first question with automatic model fallback
  const firstQ = await withFallback(async (model) => {
    const chat = model.startChat({
      systemInstruction: systemInstruction(jobRole, jobDescription),
    });
    const result = await chat.sendMessage(
      "Start the interview. Ask your first question.",
    );
    return result.response.text().trim();
  });

  const session = await InterviewSession.create({
    user: req.user.id,
    jobRole: jobRole.trim(),
    jobDescription: jobDescription.trim(),
    durationMinutes: dur,
    qa: [{ questionNumber: 1, question: firstQ, answer: "" }],
    status: "in_progress",
  });

  res.status(201).json({
    success: true,
    sessionId: session._id,
    question: firstQ,
    questionNo: 1,
  });
});

/* ─────────────────────────────────────────
   POST /api/interview/:id/answer
   Body: { answer, timeTaken, isSpeech }
   — saves answer, generates next question
   — when isSpeech=true, answer is cleaned & validated via speech utils
───────────────────────────────────────── */
exports.submitAnswer = asyncHandler(async (req, res) => {
  const { answer, timeTaken, isSpeech } = req.body;
  const session = await InterviewSession.findOne({
    _id: req.params.id,
    user: req.user.id,
    status: "in_progress",
  });
  if (!session) throw new ApiError("Interview session not found", 404);

  let processedAnswer;
  let wordCount = 0;
  if (isSpeech) {
    const processed = processSpeechAnswer(answer);
    processedAnswer = processed.cleaned;
    wordCount = processed.wordCount;
  } else {
    processedAnswer = (answer || "").trim();
  }

  const lastIdx = session.qa.length - 1;
  session.qa[lastIdx].answer = processedAnswer;
  session.qa[lastIdx].timeTaken = parseInt(timeTaken) || 0;
  if (isSpeech) session.qa[lastIdx].wordCount = wordCount;

  const history = buildHistory(session.qa);
  const nextQ = await withFallback(async (model) => {
    const chat = model.startChat({
      systemInstruction: systemInstruction(
        session.jobRole,
        session.jobDescription,
      ),
      history,
    });
    const userMsg =
      session.qa[session.qa.length - 1].answer || "(no answer given)";
    const result = await chat.sendMessage(userMsg);
    return result.response.text().trim();
  });
  const qNo = session.qa.length + 1;

  session.qa.push({ questionNumber: qNo, question: nextQ, answer: "" });
  await session.save();

  res.json({ success: true, question: nextQ, questionNo: qNo, wordCount });
});

/* ─────────────────────────────────────────
   POST /api/interview/:id/complete
   Body: { actualDuration }  — timer ended
───────────────────────────────────────── */
exports.completeInterview = asyncHandler(async (req, res) => {
  const session = await InterviewSession.findOne({
    _id: req.params.id,
    user: req.user.id,
    status: "in_progress",
  });
  if (!session) throw new ApiError("Interview session not found", 404);

  session.status = "completed";
  session.actualDuration = parseInt(req.body.actualDuration) || 0;
  session.completedAt = new Date();
  await session.save();

  res.json({ success: true, message: "Interview completed. Evaluating…" });
});

/* ─────────────────────────────────────────
   POST /api/interview/:id/evaluate
   — Gemini evaluates all Q&A and returns scores
───────────────────────────────────────── */
exports.evaluateInterview = asyncHandler(async (req, res) => {
  const session = await InterviewSession.findOne({
    _id: req.params.id,
    user: req.user.id,
  }).lean();
  if (!session) throw new ApiError("Session not found", 404);

  const transcript = session.qa
    .map((q, i) => `Q${i + 1}: ${q.question}\nA: ${q.answer || "(no answer)"}`)
    .join("\n\n");

  const evalPrompt = `
You are an expert HR interview evaluator.

Job Role: ${session.jobRole}
Job Description: ${session.jobDescription}

Interview Transcript:
${transcript}

Evaluate the candidate strictly and objectively. Respond ONLY with valid JSON in this exact format:
{
  "scores": {
    "overall":          <0-100>,
    "communication":    <0-100>,
    "fluency":          <0-100>,
    "roleKnowledge":    <0-100>,
    "answerRelevance":  <0-100>,
    "behavioralSkills": <0-100>,
    "professionalism":  <0-100>
  },
  "strengths":       ["...", "..."],
  "improvements":    ["...", "..."],
  "recommendations": ["...", "..."]
}

Scoring guide:
- overall: weighted average of all scores
- communication: clarity, structure, articulation
- fluency: natural flow, confidence, no excessive fillers
- roleKnowledge: understanding of the job-specific skills mentioned in JD
- answerRelevance: how directly answers address questions
- behavioralSkills: teamwork, problem-solving, adaptability shown
- professionalism: tone, attitude, suitability for workplace

Provide 3-5 bullet points for strengths, improvements, and recommendations.
`.trim();

  let raw = await withFallback(async (model) => {
    const result = await model.generateContent(evalPrompt);
    return result.response.text().trim();
  });

  // Strip markdown code fences if Gemini wraps in ```json
  raw = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();

  let evaluation;
  try {
    evaluation = JSON.parse(raw);
  } catch {
    throw new ApiError("Evaluation parsing failed — please try again", 500);
  }

  // Clamp all scores 0-100
  const scores = {};
  for (const [k, v] of Object.entries(evaluation.scores || {})) {
    scores[k] = Math.min(100, Math.max(0, Math.round(Number(v) || 0)));
  }

  await InterviewSession.findByIdAndUpdate(session._id, {
    scores,
    strengths: evaluation.strengths || [],
    improvements: evaluation.improvements || [],
    recommendations: evaluation.recommendations || [],
    status: "evaluated",
  });

  const updated = await InterviewSession.findById(session._id).lean();
  res.json({ success: true, session: updated });
});

/* ─────────────────────────────────────────
   GET /api/interview/history
───────────────────────────────────────── */
exports.getHistory = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  const [sessions, total] = await Promise.all([
    InterviewSession.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select("-qa") // omit Q&A in list view for performance
      .lean(),
    InterviewSession.countDocuments({ user: req.user.id }),
  ]);

  res.json({
    success: true,
    sessions,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
});

/* ─────────────────────────────────────────
   GET /api/interview/:id
───────────────────────────────────────── */
exports.getSession = asyncHandler(async (req, res) => {
  const session = await InterviewSession.findOne({
    _id: req.params.id,
    user: req.user.id,
  }).lean();
  if (!session) throw new ApiError("Session not found", 404);
  res.json({ success: true, session });
});

/* ─────────────────────────────────────────
   GET /api/interview/admin/stats   (admin)
───────────────────────────────────────── */
exports.getAdminStats = asyncHandler(async (req, res) => {
  const [total, avgScores, topRoles, recentSessions] = await Promise.all([
    InterviewSession.countDocuments({ status: "evaluated" }),

    InterviewSession.aggregate([
      { $match: { status: "evaluated" } },
      {
        $group: {
          _id: null,
          avgOverall: { $avg: "$scores.overall" },
          avgCommunication: { $avg: "$scores.communication" },
          avgRoleKnowledge: { $avg: "$scores.roleKnowledge" },
          avgFluency: { $avg: "$scores.fluency" },
        },
      },
    ]),

    InterviewSession.aggregate([
      { $match: { status: "evaluated" } },
      {
        $group: {
          _id: "$jobRole",
          count: { $sum: 1 },
          avgScore: { $avg: "$scores.overall" },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]),

    InterviewSession.find({ status: "evaluated" })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate("user", "name studentId department")
      .select("jobRole scores.overall completedAt user")
      .lean(),
  ]);

  res.json({
    success: true,
    stats: {
      total,
      averages: avgScores[0] || {},
      topRoles,
      recentSessions,
    },
  });
});

/* ─────────────────────────────────────────
   GET /api/interview/auto-listen/config
   — returns default auto-listen settings
───────────────────────────────────────── */
exports.getAutoListenConfig = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    config: { ...AUTO_LISTEN_DEFAULTS },
  });
});

/* ─────────────────────────────────────────
   POST /api/interview/auto-listen/process
   Body: { transcript }
   — cleans & validates a speech transcript w/o submitting
   — returns { cleaned, wordCount, valid, reason }
───────────────────────────────────────── */
exports.processTranscript = asyncHandler(async (req, res) => {
  const { transcript } = req.body;
  const cleaned = cleanTranscript(transcript);
  const quality = validateTranscriptQuality(cleaned);

  res.json({
    success: true,
    original: (transcript || "").trim(),
    cleaned,
    wordCount: quality.wordCount,
    valid: quality.valid,
    reason: quality.reason,
    minWords: AUTO_LISTEN_DEFAULTS.minTranscriptWords,
  });
});

/* ─────────────────────────────────────────
   GET /api/interview/auto-listen/functions
   — lists all auto-listen utility functions available
───────────────────────────────────────── */
exports.getAutoListenFunctions = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    functions: [
      {
        name: "cleanTranscript",
        description:
          "Strips filler words (um, uh, like, etc.), normalizes whitespace & punctuation, capitalizes first letter, adds trailing period.",
        input: "rawText: string",
        output: "cleaned: string",
      },
      {
        name: "validateTranscriptQuality",
        description:
          "Checks transcript is not empty, meets min word count (2), and stays under max char limit (5000).",
        input: "text: string",
        output:
          "{ valid: boolean, reason: 'empty'|'too_short'|'too_long'|'ok', wordCount: number }",
      },
      {
        name: "processSpeechAnswer",
        description:
          "Combines cleanTranscript + validateTranscriptQuality. Throws ApiError with 400 if invalid.",
        input: "rawText: string",
        output: "{ cleaned: string, wordCount: number }",
      },
      {
        name: "startListening (frontend)",
        description:
          "Starts browser SpeechRecognition with silence detection. Resets silence timer on every speech result.",
        trigger:
          "Auto-starts after AI question finishes speaking (if autoListen=ON)",
      },
      {
        name: "resetSilenceTimer (frontend)",
        description:
          "Schedules silence-detected callback after N ms of no new speech input. Timer resets on each interim/final result.",
        threshold: "1500 / 2500 (default) / 4000 / 6000 ms — user adjustable",
      },
      {
        name: "handleSilenceDetected (frontend)",
        description:
          "Called when silence timer expires with non-empty transcript. Stops recognition → onend auto-submits.",
        flow: "stop() → onend → clean brackets → handleSubmitAnswer()",
      },
      {
        name: "handleSubmitAnswer (frontend)",
        description:
          "Sends transcript + timeTaken (optionally with isSpeech=true) to /:id/answer. On success, speaks the next question, which → onend → startListening again.",
        sends: "{ answer, timeTaken, isSpeech: boolean }",
      },
    ],
    fillerWords: AUTO_LISTEN_DEFAULTS.fillerWords,
  });
});
