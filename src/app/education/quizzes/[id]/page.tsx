"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import AnimatedSection from "@/components/AnimatedSection";
import { useAuth } from "@/context/AuthContext";
import {
  evaluateQuizSubmissionAction,
  getMemberQuizAttemptAction,
  getQuizByIdAction,
  getQuizLeaderboardAction,
  submitMemberQuizAttemptAction,
} from "@/app/actions/quizzes";

type AnswerValue = string | string[];

export default function QuizAttemptPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [quiz, setQuiz] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [previousAttempt, setPreviousAttempt] = useState<any>(null);
  const [publicName, setPublicName] = useState("");
  const [hasStarted, setHasStarted] = useState(false);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [result, setResult] = useState<any>(null);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isSubmitting, startSubmitTransition] = useTransition();

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      getQuizByIdAction(typeof id === "string" ? id : id[0]),
      user ? getMemberQuizAttemptAction(typeof id === "string" ? id : id[0]) : Promise.resolve(null),
    ])
      .then(([quizData, attemptData]) => {
        setQuiz(quizData);
        setPreviousAttempt(attemptData);
      })
      .catch((error) => {
        console.error(error);
      })
      .finally(() => setLoading(false));
  }, [id, user]);

  useEffect(() => {
    if (!quiz) return;
    getQuizLeaderboardAction(quiz.quizType)
      .then((data) => setLeaderboard(data))
      .catch((error) => console.error(error));
  }, [quiz]);

  useEffect(() => {
    if (!startedAt) return;
    const timer = window.setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [startedAt]);

  const questionCount = quiz?.questions?.length || 0;
  const progressPercent = questionCount ? Math.round((currentQuestionIdx / questionCount) * 100) : 0;
  const currentQuestion = quiz?.questions?.[currentQuestionIdx] || null;

  const answerReview = useMemo(() => result?.review || [], [result]);

  const setAnswerValue = (questionId: string, value: AnswerValue) => {
    setAnswers((current) => ({ ...current, [questionId]: value }));
  };

  const canAdvance = useMemo(() => {
    if (!currentQuestion) return false;
    const currentAnswer = answers[currentQuestion.id];
    if (currentQuestion.type === "checkbox") {
      return Array.isArray(currentAnswer) && currentAnswer.length > 0;
    }
    return typeof currentAnswer === "string" && currentAnswer.trim().length > 0;
  }, [answers, currentQuestion]);

  const beginQuiz = () => {
    setHasStarted(true);
    setStartedAt(Date.now());
    setElapsedSeconds(0);
  };

  const submitQuiz = () => {
    if (!quiz) return;
    const orderedAnswers = quiz.questions.map((question: any) => answers[question.id] ?? (question.type === "checkbox" ? [] : ""));
    setFeedback(null);
    startSubmitTransition(async () => {
      try {
        const evaluation = user
          ? await submitMemberQuizAttemptAction(quiz.id, orderedAnswers)
          : await evaluateQuizSubmissionAction(quiz.id, orderedAnswers);
        setResult(evaluation);
        if (user) {
          const updatedAttempt = await getMemberQuizAttemptAction(quiz.id);
          setPreviousAttempt(updatedAttempt);
          const nextLeaderboard = await getQuizLeaderboardAction(quiz.quizType);
          setLeaderboard(nextLeaderboard);
        }
      } catch (error) {
        console.error(error);
        setFeedback(error instanceof Error ? error.message : "Quiz submission failed.");
      }
    });
  };

  const nextQuestion = () => {
    if (!quiz) return;
    if (currentQuestionIdx >= quiz.questions.length - 1) {
      submitQuiz();
      return;
    }
    setCurrentQuestionIdx((current) => current + 1);
  };

  if (loading) {
    return <div style={{ minHeight: "80vh", display: "flex", justifyContent: "center", alignItems: "center" }}><p style={{ color: "var(--gold)" }}>Loading quiz...</p></div>;
  }

  if (!quiz) {
    return (
      <div className="page-container" style={{ textAlign: "center", padding: "6rem 0" }}>
        <h1 className="page-title">Quiz Not Found</h1>
        <Link href="/education/quizzes" style={{ color: "var(--gold)" }}>← Back to Quizzes</Link>
      </div>
    );
  }

  if (user && previousAttempt && !result) {
    return (
      <div className="page-container" style={{ maxWidth: "600px", margin: "0 auto", textAlign: "center" }}>
        <AnimatedSection>
          <div style={{ background: "rgba(15,22,40,0.4)", padding: "3rem", borderRadius: "16px", border: "1px solid rgba(239, 68, 68, 0.4)" }}>
            <h2 style={{ fontSize: "2rem", marginBottom: "1rem", color: "#ef4444" }}>Already Attempted</h2>
            <p style={{ color: "var(--text-secondary)", marginBottom: "2rem" }}>
              You have already taken <strong>{quiz.title}</strong>. Member attempts are still limited to one per quiz.
            </p>
            <div className="gradient-text" style={{ fontSize: "3rem", fontWeight: 700, marginBottom: "2rem" }}>
              Score: {previousAttempt.score}/{previousAttempt.totalQuestions}
            </div>
            <Link href="/education/quizzes" className="btn-secondary" style={{ textDecoration: "none" }}>
              Return to Quizzes
            </Link>
          </div>
        </AnimatedSection>
      </div>
    );
  }

  if (!hasStarted && !result) {
    return (
      <div className="page-container" style={{ maxWidth: "680px", margin: "0 auto" }}>
        <AnimatedSection>
          <Link href="/education/quizzes" style={{ color: "var(--text-muted)", fontSize: "0.85rem", textDecoration: "none", marginBottom: "2rem", display: "inline-block" }}>
            ← Back to Quizzes
          </Link>
          <div style={{ background: "rgba(15,22,40,0.4)", padding: "3rem", borderRadius: "16px", border: "1px solid var(--border-subtle)", textAlign: "center" }}>
            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center", flexWrap: "wrap", marginBottom: "1rem" }}>
              <span style={{ fontSize: "0.76rem", padding: "0.3rem 0.8rem", borderRadius: "20px", background: "rgba(201,168,76,0.1)", color: "var(--gold)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                {quiz.quizType}
              </span>
              <span style={{ fontSize: "0.76rem", padding: "0.3rem 0.8rem", borderRadius: "20px", background: "rgba(255,255,255,0.05)", color: "var(--text-secondary)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                {quiz.questions.length} Questions
              </span>
            </div>
            <h1 style={{ fontSize: "2.2rem", margin: "1rem 0" }} className="gradient-text">{quiz.title}</h1>
            <p style={{ color: "var(--text-secondary)", marginBottom: "2rem", lineHeight: 1.6 }}>{quiz.description}</p>

            {!user ? (
              <div style={{ marginBottom: "2rem", textAlign: "left" }}>
                <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem", color: "var(--text-muted)" }}>Enter your name to begin (optional)</label>
                <input
                  type="text"
                  value={publicName}
                  onChange={(event) => setPublicName(event.target.value)}
                  placeholder="Your Name"
                  style={{ width: "100%", padding: "0.8rem", background: "rgba(0,0,0,0.5)", border: "1px solid var(--border-subtle)", borderRadius: "8px", color: "#fff", outline: "none" }}
                />
                <p style={{ color: "var(--text-muted)", fontSize: "0.78rem", marginTop: "0.6rem" }}>Public attempts are not stored.</p>
              </div>
            ) : (
              <div style={{ marginBottom: "2rem", padding: "1rem", background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: "8px", color: "#22c55e", fontSize: "0.9rem" }}>
                Signed in as {user.name || user.email}. Your score will be stored for the {quiz.quizType} leaderboard.
              </div>
            )}

            <button onClick={beginQuiz} className="btn-primary" style={{ width: "100%", padding: "1rem", fontSize: "1rem", cursor: "pointer", fontFamily: "inherit" }}>
              Start Quiz
            </button>
          </div>
        </AnimatedSection>
      </div>
    );
  }

  if (result) {
    return (
      <div className="page-container" style={{ maxWidth: "900px", margin: "0 auto" }}>
        <AnimatedSection>
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            <h2 style={{ fontSize: "1.1rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Quiz Complete</h2>
            <h1 style={{ fontSize: "4rem", margin: "1rem 0", fontFamily: "'Cinzel', serif" }} className="gradient-text">
              {result.score} / {result.totalQuestions}
            </h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "1.1rem" }}>
              {user ? `Your ${quiz.quizType} score has been recorded.` : `Nice work, ${publicName || "Guest"}.`}
            </p>
          </div>
        </AnimatedSection>

        {user ? (
          <AnimatedSection delay={0.1}>
            <div style={{ background: "rgba(15,22,40,0.4)", border: "1px solid var(--border-subtle)", borderRadius: "12px", padding: "2rem", marginBottom: "3rem" }}>
              <h3 style={{ fontSize: "1.3rem", marginBottom: "1.5rem", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "0.8rem" }}>
                {quiz.quizType.charAt(0).toUpperCase() + quiz.quizType.slice(1)} Leaderboard
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
                {(leaderboard || []).slice(0, 5).map((entry, index) => (
                  <div key={entry.userId} style={{ display: "grid", gridTemplateColumns: "50px 1fr 100px", padding: "1rem", background: index === 0 ? "rgba(201,168,76,0.1)" : "rgba(0,0,0,0.3)", border: index === 0 ? "1px solid var(--gold-dark)" : "1px solid transparent", borderRadius: "8px", alignItems: "center" }}>
                    <span style={{ fontWeight: 700, color: index === 0 ? "var(--gold)" : "var(--text-secondary)" }}>#{index + 1}</span>
                    <span style={{ fontWeight: 500 }}>{entry.name} {entry.userId === user.id ? "(You)" : ""}</span>
                    <span style={{ textAlign: "right", fontFamily: "monospace", fontSize: "1.1rem", color: "var(--gold-light)" }}>{entry.score}</span>
                  </div>
                ))}
                {leaderboard.length === 0 ? <p style={{ color: "var(--text-muted)" }}>No leaderboard entries yet.</p> : null}
              </div>
            </div>
          </AnimatedSection>
        ) : (
          <AnimatedSection delay={0.1}>
            <div style={{ background: "linear-gradient(90deg, rgba(201,168,76,0.1), transparent)", border: "1px solid var(--gold)", borderRadius: "12px", padding: "2rem", textAlign: "center", marginBottom: "3rem" }}>
              <h3 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>Want your score on the board?</h3>
              <p style={{ color: "var(--text-secondary)", marginBottom: "1.5rem" }}>Join the club to track quiz history, climb the leaderboard, and access member tools.</p>
              <Link href="/join" className="btn-primary" style={{ textDecoration: "none" }}>Join the Club</Link>
            </div>
          </AnimatedSection>
        )}

        <AnimatedSection delay={0.2}>
          <h3 style={{ fontSize: "1.2rem", marginBottom: "1.5rem", paddingLeft: "1rem", borderLeft: "3px solid var(--gold)" }}>Review Answers</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
            {answerReview.map((entry: any, index: number) => (
              <div key={entry.id} style={{ background: "rgba(8, 12, 22, 0.6)", border: `1px solid ${entry.isCorrect ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`, borderRadius: "12px", padding: "1.5rem" }}>
                <div style={{ display: "flex", gap: "1rem" }}>
                  <span style={{ width: "24px", height: "24px", borderRadius: "50%", background: entry.isCorrect ? "var(--gold)" : "rgba(239,68,68,0.2)", color: entry.isCorrect ? "#000" : "#ef4444", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "0.8rem", flexShrink: 0 }}>
                    {index + 1}
                  </span>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ fontSize: "1rem", marginBottom: "0.8rem", lineHeight: 1.4 }}>{entry.question}</h4>
                    {entry.imageUrl ? <img src={entry.imageUrl} alt={entry.question} style={{ width: "100%", maxWidth: "340px", borderRadius: "10px", marginBottom: "1rem", objectFit: "cover" }} /> : null}
                    <p style={{ fontSize: "0.86rem", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>
                      <strong>Your answer:</strong> {Array.isArray(entry.answer) ? entry.answer.join(", ") || "No answer" : entry.answer || "No answer"}
                    </p>
                    <p style={{ fontSize: "0.86rem", color: "var(--text-secondary)", marginBottom: "0.6rem" }}>
                      <strong>Correct answer:</strong> {Array.isArray(entry.correctAnswer) ? entry.correctAnswer.join(", ") : entry.correctAnswer}
                    </p>
                    {entry.explanation ? (
                      <div style={{ padding: "0.85rem 1rem", borderRadius: "8px", background: "rgba(255,255,255,0.04)", color: "var(--text-muted)", fontSize: "0.84rem", lineHeight: 1.6 }}>
                        {entry.explanation}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ textAlign: "center", marginTop: "3rem" }}>
            <Link href="/education/quizzes" className="btn-secondary" style={{ textDecoration: "none" }}>Return to Quizzes</Link>
          </div>
        </AnimatedSection>
      </div>
    );
  }

  return (
    <div className="page-container" style={{ maxWidth: "760px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem", fontSize: "0.85rem", color: "var(--text-muted)", flexWrap: "wrap", gap: "0.75rem" }}>
        <span>Question {currentQuestionIdx + 1} of {quiz.questions.length}</span>
        <span>{progressPercent}% Complete</span>
        <span>{Math.floor(elapsedSeconds / 60)}:{String(elapsedSeconds % 60).padStart(2, "0")}</span>
      </div>
      <div style={{ width: "100%", height: "6px", background: "var(--border-subtle)", borderRadius: "3px", marginBottom: "2rem", overflow: "hidden" }}>
        <motion.div initial={{ width: 0 }} animate={{ width: `${progressPercent}%` }} style={{ height: "100%", background: "var(--gold)", borderRadius: "3px" }} />
      </div>

      {feedback ? <p style={{ color: "#fca5a5", marginBottom: "1rem" }}>{feedback}</p> : null}

      <motion.div key={currentQuestion?.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.25 }}>
        <h2 style={{ fontSize: "1.7rem", lineHeight: 1.45, marginBottom: "1.2rem" }}>{currentQuestion?.question}</h2>
        {currentQuestion?.imageUrl ? <img src={currentQuestion.imageUrl} alt={currentQuestion.question} style={{ width: "100%", maxWidth: "420px", borderRadius: "12px", marginBottom: "1.5rem", objectFit: "cover" }} /> : null}

        {currentQuestion?.type === "mcq" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {currentQuestion.options.map((option: string, index: number) => {
              const active = answers[currentQuestion.id] === option;
              return (
                <button key={index} onClick={() => setAnswerValue(currentQuestion.id, option)} style={{ width: "100%", textAlign: "left", padding: "1.1rem 1.4rem", background: active ? "rgba(201,168,76,0.12)" : "rgba(15, 22, 40, 0.4)", border: active ? "1px solid var(--gold)" : "1px solid var(--border-subtle)", borderRadius: "12px", color: "var(--text-primary)", fontSize: "1rem", cursor: "pointer", transition: "all 0.2s ease", fontFamily: "inherit" }}>
                  {option}
                </button>
              );
            })}
          </div>
        ) : null}

        {currentQuestion?.type === "checkbox" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
            {currentQuestion.options.map((option: string, index: number) => {
              const selected = Array.isArray(answers[currentQuestion.id]) && (answers[currentQuestion.id] as string[]).includes(option);
              return (
                <label key={index} style={{ display: "flex", gap: "0.75rem", alignItems: "center", padding: "1rem 1.2rem", border: selected ? "1px solid var(--gold)" : "1px solid var(--border-subtle)", borderRadius: "12px", background: selected ? "rgba(201,168,76,0.12)" : "rgba(15,22,40,0.4)", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => {
                      const current = Array.isArray(answers[currentQuestion.id]) ? [...(answers[currentQuestion.id] as string[])] : [];
                      setAnswerValue(
                        currentQuestion.id,
                        current.includes(option) ? current.filter((item) => item !== option) : [...current, option]
                      );
                    }}
                  />
                  <span>{option}</span>
                </label>
              );
            })}
          </div>
        ) : null}

        {currentQuestion?.type === "short" || currentQuestion?.type === "long" ? (
          <textarea
            value={typeof answers[currentQuestion.id] === "string" ? (answers[currentQuestion.id] as string) : ""}
            onChange={(event) => setAnswerValue(currentQuestion.id, event.target.value)}
            placeholder={currentQuestion.type === "long" ? "Write your detailed answer..." : "Write your answer..."}
            rows={currentQuestion.type === "long" ? 6 : 3}
            style={{ width: "100%", padding: "1rem 1.1rem", background: "rgba(15,22,40,0.4)", border: "1px solid var(--border-subtle)", borderRadius: "12px", color: "var(--text-primary)", fontSize: "1rem", fontFamily: "inherit", resize: "vertical" }}
          />
        ) : null}

        <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", marginTop: "2rem", flexWrap: "wrap" }}>
          <button onClick={() => setCurrentQuestionIdx((current) => Math.max(0, current - 1))} className="btn-secondary" style={{ background: "transparent", opacity: currentQuestionIdx === 0 ? 0.5 : 1 }} disabled={currentQuestionIdx === 0 || isSubmitting}>
            Previous
          </button>
          <button onClick={nextQuestion} className="btn-primary" disabled={!canAdvance || isSubmitting}>
            {isSubmitting ? "Submitting..." : currentQuestionIdx === quiz.questions.length - 1 ? "Submit Quiz" : "Next Question"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
