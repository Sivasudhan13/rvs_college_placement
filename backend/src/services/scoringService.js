/**
 * Centralized scoring logic for the Aptitude platform.
 */

const POINTS = { Easy: 5, Medium: 10, Hard: 15 };
const TEST_COMPLETION_BONUS  = 20;
const DAILY_CHALLENGE_BONUS  = 25;

/* ── Calculate score for a test attempt ── */
const calculateTestScore = (questions, answers, marksPerQ = 1, negativeMarks = 0.25) => {
  let score = 0;
  let correct = 0;
  let wrong = 0;
  let skipped = 0;
  const maxScore = questions.length * marksPerQ;

  const graded = answers.map((ans) => {
    const question = questions.find((q) => q._id.toString() === ans.questionId.toString());
    if (!question) return { ...ans, isCorrect: false, marksAwarded: 0 };

    if (ans.selectedAnswer === -1) {
      skipped++;
      return { ...ans, isCorrect: false, marksAwarded: 0 };
    }

    const isCorrect = ans.selectedAnswer === question.correctAnswer;
    if (isCorrect) {
      score += marksPerQ;
      correct++;
    } else {
      score -= negativeMarks;
      wrong++;
    }

    return { ...ans, isCorrect, marksAwarded: isCorrect ? marksPerQ : -negativeMarks };
  });

  const percentage = maxScore > 0 ? Math.max(0, Math.round((score / maxScore) * 100)) : 0;
  const accuracy   = (correct + wrong) > 0 ? Math.round((correct / (correct + wrong)) * 100) : 0;

  return { graded, score: Math.max(0, score), maxScore, correct, wrong, skipped, percentage, accuracy };
};

/* ── Points earned from a single question ── */
const pointsForQuestion = (difficulty) => POINTS[difficulty] || 5;

/* ── Update streak ── */
const updateStreak = (progress) => {
  const today     = new Date();
  today.setHours(0, 0, 0, 0);
  const last      = progress.lastActivityDate ? new Date(progress.lastActivityDate) : null;
  if (last) last.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (!last || last < yesterday) {
    progress.currentStreak = 1;
  } else if (last.getTime() === yesterday.getTime()) {
    progress.currentStreak += 1;
  }
  // same day — no change
  progress.longestStreak  = Math.max(progress.longestStreak, progress.currentStreak);
  progress.lastActivityDate = today;
};

/* ── Build category stats from graded answers ── */
const buildCategoryStats = (questions, gradedAnswers) => {
  const map = {};
  gradedAnswers.forEach((ans) => {
    const q = questions.find((q) => q._id.toString() === ans.questionId.toString());
    if (!q) return;
    if (!map[q.category]) map[q.category] = { category: q.category, correct: 0, wrong: 0, skipped: 0, total: 0 };
    map[q.category].total++;
    if (ans.selectedAnswer === -1) map[q.category].skipped++;
    else if (ans.isCorrect) map[q.category].correct++;
    else map[q.category].wrong++;
  });
  return Object.values(map);
};

module.exports = {
  calculateTestScore, pointsForQuestion, updateStreak,
  buildCategoryStats, TEST_COMPLETION_BONUS, DAILY_CHALLENGE_BONUS,
};
