"use server";

import { db } from "@/db";
import { quiz_attempts, quizzes } from "@/db/schema";
import { and, desc, eq, ne } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { v4 as uuidv4 } from "uuid";
import { revalidatePath } from "next/cache";
import { hasPermission } from "@/lib/permissions";
import {
  isQuizCurrentlyAvailable,
  normalizeQuizRecord,
  normalizeQuizType,
  QuizQuestionRecord,
  QuizType,
  scoreQuizAnswer,
  validateQuizQuestions,
} from "@/lib/quizzes";

type SaveQuizInput = {
  id?: string;
  title: string;
  description: string;
  difficulty: string;
  quizType: QuizType;
  startDate?: string | null;
  endDate?: string | null;
  isActive: boolean;
  estimatedMinutes: number;
  points: number;
  questions: QuizQuestionRecord[];
};

async function getCurrentUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user ?? null;
}

async function getQuizAccess(userId: string) {
  const canManage = (await hasPermission(userId, "approve_actions")) || (await hasPermission(userId, "assign_roles")) || (await hasPermission(userId, "delete_files"));
  const isAdmin = (await hasPermission(userId, "assign_roles")) || (await hasPermission(userId, "delete_files"));
  return { canManage, isAdmin };
}

function serializeQuiz(row: any) {
  return normalizeQuizRecord({
    ...row,
    startDate: row.startDate,
    endDate: row.endDate,
  });
}

function serializeAttempt(row: any) {
  return {
    ...row,
    quizType: normalizeQuizType(row.quizType),
    answers: Array.isArray(row.answers) ? row.answers : [],
    createdAt: row.createdAt?.toISOString?.() || null,
    updatedAt: row.updatedAt?.toISOString?.() || null,
  };
}

function overlapExists(aStart: string | null, aEnd: string | null, bStart: string | null, bEnd: string | null) {
  const startA = aStart ? new Date(aStart).getTime() : Number.NEGATIVE_INFINITY;
  const endA = aEnd ? new Date(aEnd).getTime() : Number.POSITIVE_INFINITY;
  const startB = bStart ? new Date(bStart).getTime() : Number.NEGATIVE_INFINITY;
  const endB = bEnd ? new Date(bEnd).getTime() : Number.POSITIVE_INFINITY;
  return startA <= endB && startB <= endA;
}

async function assertExclusiveScheduledQuiz(input: SaveQuizInput) {
  if (!input.isActive || input.quizType === "custom") {
    return;
  }

  const conditions = [eq(quizzes.quizType, input.quizType), eq(quizzes.isActive, true)];
  if (input.id) {
    conditions.push(ne(quizzes.id, input.id));
  }

  const existing = await db.select().from(quizzes).where(and(...conditions));

  const conflicting = existing
    .map(serializeQuiz)
    .find((quiz) => overlapExists(input.startDate || null, input.endDate || null, quiz.startDate, quiz.endDate));

  if (conflicting) {
    throw new Error(`Only one active ${input.quizType} quiz can exist in the same time window.`);
  }
}

export async function getQuizManagerSnapshotAction() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  const access = await getQuizAccess(user.id);
  if (!access.canManage) throw new Error("Forbidden");

  const [quizRows, attemptRows] = await Promise.all([
    db.select().from(quizzes).orderBy(desc(quizzes.updatedAt)),
    db.select().from(quiz_attempts).orderBy(desc(quiz_attempts.createdAt)),
  ]);

  return {
    access,
    quizzes: quizRows.map(serializeQuiz),
    attempts: attemptRows.map(serializeAttempt),
  };
}

export async function saveQuizAction(input: SaveQuizInput) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  const access = await getQuizAccess(user.id);
  if (!access.canManage) throw new Error("Forbidden");

  if (!input.title.trim()) {
    throw new Error("Quiz title is required.");
  }

  if (input.startDate && input.endDate && new Date(input.startDate).getTime() > new Date(input.endDate).getTime()) {
    throw new Error("End date must be after the start date.");
  }

  const normalizedQuestions = input.questions.map((question, index) => ({
    ...question,
    id: question.id || `question-${index + 1}`,
  }));

  validateQuizQuestions(normalizedQuestions);
  await assertExclusiveScheduledQuiz({ ...input, questions: normalizedQuestions });

  const now = new Date();
  const payload = {
    title: input.title.trim(),
    description: input.description.trim(),
    difficulty: input.difficulty,
    quizType: normalizeQuizType(input.quizType),
    startDate: input.startDate ? new Date(input.startDate) : null,
    endDate: input.endDate ? new Date(input.endDate) : null,
    isActive: Boolean(input.isActive),
    estimatedMinutes: Number(input.estimatedMinutes || 10),
    points: Number(input.points || 100),
    questions: normalizedQuestions,
    updatedAt: now,
  };

  if (input.id) {
    await db.update(quizzes).set(payload).where(eq(quizzes.id, input.id));
  } else {
    await db.insert(quizzes).values({
      id: uuidv4(),
      ...payload,
      createdAt: now,
    });
  }

  revalidatePath("/admin");
  revalidatePath("/admin/quizzes");
  revalidatePath("/education/quizzes");
  return { success: true };
}

export async function deleteQuizAction(quizId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  const access = await getQuizAccess(user.id);
  if (!access.isAdmin) throw new Error("Forbidden");

  await db.delete(quizzes).where(eq(quizzes.id, quizId));
  revalidatePath("/admin");
  revalidatePath("/admin/quizzes");
  revalidatePath("/education/quizzes");
  return { success: true };
}

export async function getAvailableQuizzesAction() {
  const rows = await db.select().from(quizzes).orderBy(desc(quizzes.createdAt));
  return rows.map(serializeQuiz).filter((quiz) => isQuizCurrentlyAvailable(quiz));
}

export async function getQuizByIdAction(quizId: string) {
  const rows = await db.select().from(quizzes).where(eq(quizzes.id, quizId)).limit(1);
  if (!rows.length) return null;

  const quiz = serializeQuiz(rows[0]);
  const user = await getCurrentUser();
  if (user) {
    const access = await getQuizAccess(user.id);
    if (access.canManage) {
      return quiz;
    }
  }

  return isQuizCurrentlyAvailable(quiz) ? quiz : null;
}

export async function getMemberQuizAttemptAction(quizId: string) {
  const user = await getCurrentUser();
  if (!user) return null;

  const attempts = await db
    .select()
    .from(quiz_attempts)
    .where(and(eq(quiz_attempts.quizId, quizId), eq(quiz_attempts.userId, user.id)))
    .orderBy(desc(quiz_attempts.createdAt))
    .limit(1);

  return attempts[0] ? serializeAttempt(attempts[0]) : null;
}

export async function getQuizLeaderboardAction(quizType?: QuizType) {
  const user = await getCurrentUser();
  if (!user) return [];

  const rows = await db.select().from(quiz_attempts).orderBy(desc(quiz_attempts.createdAt));
  const filtered = quizType ? rows.filter((row) => normalizeQuizType(row.quizType) === quizType) : rows;
  const totals = new Map<string, { userId: string; name: string; score: number; quizType: QuizType }>();

  filtered.forEach((row) => {
    const key = row.userId;
    const current = totals.get(key) || {
      userId: row.userId,
      name: row.userName || "Member",
      score: 0,
      quizType: normalizeQuizType(row.quizType),
    };
    current.score += Number(row.score || 0);
    totals.set(key, current);
  });

  return Array.from(totals.values()).sort((a, b) => b.score - a.score);
}

export async function evaluateQuizSubmissionAction(quizId: string, answers: unknown[]) {
  const quiz = await getQuizByIdAction(quizId);
  if (!quiz) throw new Error("Quiz not found or inactive.");

  const review = quiz.questions.map((question, index) => {
    const answer = Array.isArray(answers) ? answers[index] : undefined;
    const isCorrect = scoreQuizAnswer(question, answer);
    return {
      id: question.id,
      question: question.question,
      type: question.type,
      answer,
      correctAnswer: question.correctAnswer,
      explanation: question.explanation || "",
      options: question.options || [],
      imageUrl: question.imageUrl || null,
      isCorrect,
    };
  });

  const score = review.reduce((sum, item) => sum + (item.isCorrect ? 1 : 0), 0);
  return {
    quiz,
    score,
    totalQuestions: quiz.questions.length,
    review,
  };
}

export async function submitMemberQuizAttemptAction(quizId: string, answers: unknown[]) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const existing = await getMemberQuizAttemptAction(quizId);
  if (existing) {
    throw new Error("You have already attempted this quiz.");
  }

  const evaluation = await evaluateQuizSubmissionAction(quizId, answers);
  await db.insert(quiz_attempts).values({
    id: uuidv4(),
    userId: user.id,
    userName: user.name || user.email || "Member",
    quizId,
    quizType: evaluation.quiz.quizType,
    answers: Array.isArray(answers) ? answers : [],
    score: evaluation.score,
    totalQuestions: evaluation.totalQuestions,
    date: new Date().toISOString(),
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  revalidatePath("/portal");
  revalidatePath(`/education/quizzes/${quizId}`);
  return evaluation;
}

export async function getQuizResultsForAdminAction(quizId?: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  const access = await getQuizAccess(user.id);
  if (!access.canManage) throw new Error("Forbidden");

  const rows = await db.select().from(quiz_attempts).orderBy(desc(quiz_attempts.createdAt));
  const filtered = quizId ? rows.filter((row) => row.quizId === quizId) : rows;
  return filtered.map(serializeAttempt);
}
