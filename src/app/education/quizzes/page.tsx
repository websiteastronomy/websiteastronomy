"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AnimatedSection from '@/components/AnimatedSection';
import AnimatedCard from '@/components/AnimatedCard';
import { subscribeToCollection } from '@/lib/db';

export default function QuizListing() {
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeToCollection('quizzes', (data) => {
      setQuizzes(data);
      setLoading(false);
    });
    return () => unsub();
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
          <p style={{ color: "var(--text-secondary)", maxWidth: "600px", margin: "0 auto", fontSize: "1.1rem" }}>
            Test your knowledge of the cosmos. Club members can compete on the internal leaderboard!
          </p>
        </div>
      </AnimatedSection>

      {quizzes.length === 0 ? (
        <div style={{ textAlign: "center", padding: "4rem 2rem", background: "rgba(15,22,40,0.2)", borderRadius: "16px", border: "1px dashed var(--border-subtle)" }}>
          <p style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>🧠</p>
          <h3 style={{ fontSize: "1.3rem", color: "var(--text-primary)" }}>No Quizzes Yet</h3>
          <p style={{ color: "var(--text-muted)", marginTop: "0.5rem" }}>Check back soon — the admin is crafting new challenges!</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '2rem' }}>
          {quizzes.map((quiz, i) => (
            <AnimatedCard key={quiz.id} index={i}>
              <Link href={`/education/quizzes/${quiz.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', height: '100%', padding: '2rem', background: 'rgba(15, 22, 40, 0.4)', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <span style={{ 
                    fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600, padding: '0.2rem 0.6rem', borderRadius: '12px',
                    background: quiz.difficulty === 'Easy' ? 'rgba(34,197,94,0.15)' : quiz.difficulty === 'Medium' ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)',
                    color: quiz.difficulty === 'Easy' ? '#22c55e' : quiz.difficulty === 'Medium' ? '#f59e0b' : '#ef4444'
                  }}>
                    {quiz.difficulty}
                  </span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{(quiz.questions || []).length} Questions</span>
                </div>
                <h3 style={{ fontSize: '1.4rem', marginBottom: '0.8rem' }} className="gradient-text">{quiz.title}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.5, flex: 1, marginBottom: '2rem' }}>
                  {quiz.description}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
                  <span style={{ color: 'var(--gold)', fontSize: '0.9rem', fontWeight: 500 }}>Start Quiz →</span>
                </div>
              </Link>
            </AnimatedCard>
          ))}
        </div>
      )}
    </div>
  );
}
