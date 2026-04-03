export const QUIZ_TYPES = ["daily", "weekly", "monthly", "custom"] as const;
export const QUIZ_QUESTION_TYPES = ["mcq", "short", "long", "checkbox"] as const;

export type QuizType = (typeof QUIZ_TYPES)[number];
export type QuizQuestionType = (typeof QUIZ_QUESTION_TYPES)[number];

export type QuizQuestionRecord = {
  id: string;
  question: string;
  type: QuizQuestionType;
  options?: string[];
  correctAnswer?: string | string[];
  explanation?: string;
  imageUrl?: string | null;
};

export type QuizRecord = {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  quizType: QuizType;
  startDate: string | null;
  endDate: string | null;
  isActive: boolean;
  estimatedMinutes: number;
  points: number;
  questions: QuizQuestionRecord[];
};

export function normalizeQuizType(value: unknown): QuizType {
  return QUIZ_TYPES.includes(value as QuizType) ? (value as QuizType) : "custom";
}

export function normalizeQuestionType(value: unknown): QuizQuestionType {
  return QUIZ_QUESTION_TYPES.includes(value as QuizQuestionType)
    ? (value as QuizQuestionType)
    : "mcq";
}

export function toIsoOrNull(value: unknown) {
  if (!value) return null;
  const parsed = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function normalizeOptions(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item).trim()).filter(Boolean);
}

export function normalizeQuizQuestion(raw: any, index: number): QuizQuestionRecord {
  const type = normalizeQuestionType(raw?.type);
  const options = normalizeOptions(raw?.options);
  const base = {
    id: String(raw?.id || `question-${index + 1}`),
    question: String(raw?.question || raw?.text || "").trim(),
    type,
    explanation: raw?.explanation ? String(raw.explanation) : "",
    imageUrl: raw?.imageUrl || raw?.image_url || null,
  };

  if (type === "mcq") {
    let correctAnswer = raw?.correctAnswer;
    if (correctAnswer == null && typeof raw?.correctOptionIndex === "number") {
      correctAnswer = options[raw.correctOptionIndex] || "";
    }
    return {
      ...base,
      options,
      correctAnswer: correctAnswer ? String(correctAnswer) : "",
    };
  }

  if (type === "checkbox") {
    let correctAnswer = raw?.correctAnswer;
    if (!Array.isArray(correctAnswer) && Array.isArray(raw?.correctAnswers)) {
      correctAnswer = raw.correctAnswers;
    }
    return {
      ...base,
      options,
      correctAnswer: Array.isArray(correctAnswer)
        ? correctAnswer.map((item) => String(item).trim()).filter(Boolean)
        : [],
    };
  }

  return {
    ...base,
    correctAnswer: raw?.correctAnswer ? String(raw.correctAnswer).trim() : "",
  };
}

export function normalizeQuizRecord(raw: any): QuizRecord {
  return {
    id: String(raw?.id || ""),
    title: String(raw?.title || "").trim(),
    description: String(raw?.description || "").trim(),
    difficulty: String(raw?.difficulty || "Medium"),
    quizType: normalizeQuizType(raw?.quizType || raw?.quiz_type),
    startDate: toIsoOrNull(raw?.startDate || raw?.start_date),
    endDate: toIsoOrNull(raw?.endDate || raw?.end_date),
    isActive: Boolean(raw?.isActive ?? raw?.is_active ?? true),
    estimatedMinutes: Number(raw?.estimatedMinutes || 10),
    points: Number(raw?.points || 100),
    questions: Array.isArray(raw?.questions)
      ? raw.questions.map((question: any, index: number) => normalizeQuizQuestion(question, index))
      : [],
  };
}

export function validateQuizQuestions(questions: QuizQuestionRecord[]) {
  if (!questions.length) {
    throw new Error("Add at least one question.");
  }

  questions.forEach((question, index) => {
    const label = `Question ${index + 1}`;
    if (!question.question.trim()) {
      throw new Error(`${label} cannot be empty.`);
    }

    if (question.type === "mcq") {
      if (!question.options || question.options.length < 2) {
        throw new Error(`${label} needs at least 2 options.`);
      }
      if (!question.correctAnswer || typeof question.correctAnswer !== "string") {
        throw new Error(`${label} needs a correct answer.`);
      }
    }

    if (question.type === "checkbox") {
      if (!question.options || question.options.length < 2) {
        throw new Error(`${label} needs at least 2 options.`);
      }
      if (!Array.isArray(question.correctAnswer) || question.correctAnswer.length === 0) {
        throw new Error(`${label} needs at least one correct answer.`);
      }
    }

    if ((question.type === "short" || question.type === "long") && !String(question.correctAnswer || "").trim()) {
      throw new Error(`${label} needs a correct answer.`);
    }
  });
}

export function isQuizCurrentlyAvailable(quiz: Pick<QuizRecord, "isActive" | "startDate" | "endDate">, now = new Date()) {
  if (!quiz.isActive) return false;
  const nowTime = now.getTime();
  const startTime = quiz.startDate ? new Date(quiz.startDate).getTime() : null;
  const endTime = quiz.endDate ? new Date(quiz.endDate).getTime() : null;
  if (startTime && startTime > nowTime) return false;
  if (endTime && endTime < nowTime) return false;
  return true;
}

export function scoreQuizAnswer(question: QuizQuestionRecord, answer: unknown) {
  if (question.type === "mcq") {
    return String(answer || "").trim() === String(question.correctAnswer || "").trim();
  }

  if (question.type === "checkbox") {
    const userAnswers = Array.isArray(answer) ? answer.map((item) => String(item).trim()).sort() : [];
    const correctAnswers = Array.isArray(question.correctAnswer)
      ? question.correctAnswer.map((item) => String(item).trim()).sort()
      : [];
    return JSON.stringify(userAnswers) === JSON.stringify(correctAnswers);
  }

  return String(answer || "").trim().toLowerCase() === String(question.correctAnswer || "").trim().toLowerCase();
}
