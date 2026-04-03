"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AnimatedSection from "@/components/AnimatedSection";
import AnimatedCard from "@/components/AnimatedCard";
import { getAvailableQuizzesAction } from "@/app/actions/quizzes";

export default function QuizListing() {
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAvailableQuizzesAction()
      .then((data) => setQuizzes(data))
      .catch((error) => {
        console.error(error);
        setQuizzes([]);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div style={{ minHeight: "80vh", display: "flex", justifyContent: "center", alignItems: "center" }}><p style={{ color: "var(--gold)" }}>Loading quizzes...</p></div>;
  }

  return (
    <div className="page-container">
      <AnimatedSection>
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <Link href="/education" style={{ color: "var(--gold)", fontSize: "0.85rem", textDecoration: "none", marginBottom: "1rem", display: "inline-block", letterSpacing: "0.1em", textTransform: "uppercase" }}>
            ← Back to Education
          </Link>
          <h1 className="page-title"><span className="gradient-text">Astronomy Quizzes</span></h1>
          <p style={{ color: "var(--text-secondary)", maxWidth: "640px", margin: "0 auto", fontSize: "1.05rem" }}>
            Daily, weekly, monthly, and custom challenges. Public visitors can play instantly, and members can climb the leaderboard.
          </p>
        </div>
      </AnimatedSection>

      {quizzes.length === 0 ? (
        <div style={{ textAlign: "center", padding: "4rem 2rem", background: "rgba(15,22,40,0.2)", borderRadius: "16px", border: "1px dashed var(--border-subtle)" }}>
          <h3 style={{ fontSize: "1.3rem", color: "var(--text-primary)" }}>No active quizzes right now</h3>
          <p style={{ color: "var(--text-muted)", marginTop: "0.5rem" }}>New challenges appear automatically when their active window opens.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "2rem" }}>
          {quizzes.map((quiz, index) => (
            <AnimatedCard key={quiz.id} index={index}>
              <Link href={`/education/quizzes/${quiz.id}`} style={{ textDecoration: "none", color: "inherit", display: "flex", flexDirection: "column", height: "100%", padding: "2rem", background: "rgba(15, 22, 40, 0.4)", borderRadius: "12px", border: "1px solid var(--border-subtle)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem", gap: "0.75rem" }}>
                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700, padding: "0.2rem 0.6rem", borderRadius: "999px", background: "rgba(201,168,76,0.14)", color: "var(--gold)" }}>
                      {quiz.quizType}
                    </span>
                    <span style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600, padding: "0.2rem 0.6rem", borderRadius: "999px", background: "rgba(255,255,255,0.06)", color: "var(--text-secondary)" }}>
                      {quiz.difficulty}
                    </span>
                  </div>
                  <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>{quiz.questions.length} Questions</span>
                </div>
                <h3 style={{ fontSize: "1.35rem", marginBottom: "0.8rem" }} className="gradient-text">{quiz.title}</h3>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", lineHeight: 1.5, flex: 1, marginBottom: "1.5rem" }}>
                  {quiz.description}
                </p>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border-subtle)", paddingTop: "1rem", color: "var(--text-muted)", fontSize: "0.82rem" }}>
                  <span>{quiz.estimatedMinutes} min</span>
                  <span style={{ color: "var(--gold)", fontWeight: 600 }}>Start Quiz →</span>
                </div>
              </Link>
            </AnimatedCard>
          ))}
        </div>
      )}
    </div>
  );
}
