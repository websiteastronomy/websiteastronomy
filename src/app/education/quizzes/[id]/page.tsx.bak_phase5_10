"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import AnimatedSection from '@/components/AnimatedSection';
import { useAuth } from '@/context/AuthContext';
import { MOCK_QUIZZES, MOCK_ATTEMPTS, MOCK_LEADERBOARD, QuizAttempt } from '@/data/mockQuizzes';

export default function QuizAttemptPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  
  const [quiz, setQuiz] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // State
  const [hasStarted, setHasStarted] = useState(false);
  const [publicName, setPublicName] = useState("");
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [isFinished, setIsFinished] = useState(false);
  
  // Blocking state
  const [isBlocked, setIsBlocked] = useState(false);
  const [previousAttempt, setPreviousAttempt] = useState<QuizAttempt | null>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  useEffect(() => {
    if (!id) return;
    const fetchQuiz = async () => {
      try {
        const data = await import('@/lib/db').then(m => m.getDocument<any>('quizzes', typeof id === 'string' ? id : id[0]));
        setQuiz(data);
        setLoading(false);
      } catch (err) {
        setLoading(false);
      }
    };
    fetchQuiz();
  }, [id]);

  useEffect(() => {
    let unsubAttempts = () => {};
    let unsubLeaderboard = () => {};
    if (user && quiz) {
      import('@/lib/db').then(({ subscribeToCollection }) => {
        unsubAttempts = subscribeToCollection('quiz_attempts', (data) => {
          const attempt = data.find((a: any) => a.userId === user.id && a.quizId === quiz.id);
          if (attempt) {
            setIsBlocked(true);
            setPreviousAttempt(attempt);
          }
        });
        unsubLeaderboard = subscribeToCollection('quiz_attempts', (data) => {
          // Compute leaderboard locally based on attempts
          const scores: Record<string, {name: string, score: number, userId: string}> = {};
          data.forEach(a => {
            if (!scores[a.userId]) scores[a.userId] = { name: a.userName || 'Member', score: 0, userId: a.userId };
            scores[a.userId].score += a.score;
          });
          const sorted = Object.values(scores).sort((a,b) => b.score - a.score);
          setLeaderboard(sorted);
        });
      });
    }
    return () => { unsubAttempts(); unsubLeaderboard(); };
  }, [user, quiz]);

  if (loading) {
     return <div style={{ minHeight: "80vh", display: "flex", justifyContent: "center", alignItems: "center" }}><p style={{ color: "var(--gold)" }}>Loading quiz...</p></div>;
  }

  if (!quiz) {
    return (
      <div className="page-container" style={{ textAlign: 'center', padding: '6rem 0' }}>
        <h1 className="page-title">Quiz Not Found</h1>
        <Link href="/education/quizzes" style={{ color: 'var(--gold)' }}>← Back to Quizzes</Link>
      </div>
    );
  }

  // Handle Answer Selection
  const handleAnswer = (optionIndex: number) => {
    const newAnswers = [...answers, optionIndex];
    setAnswers(newAnswers);
    
    if (currentQuestionIdx < quiz.questions.length - 1) {
      setCurrentQuestionIdx(currentQuestionIdx + 1);
    } else {
      finishQuiz(newAnswers);
    }
  };

  const finishQuiz = (finalAnswers: number[]) => {
    setIsFinished(true);
    let correctCount = 0;
    finalAnswers.forEach((ans, i) => {
      if (ans === quiz.questions[i].correctOptionIndex) {
        correctCount++;
      }
    });
    
    // Store if member
    if (user) {
      const newAttempt = {
        userId: user.id,
        userName: user.name || user.email || 'Member',
        quizId: quiz.id,
        score: correctCount,
        totalQuestions: quiz.questions.length,
        date: new Date().toISOString()
      };
      import('@/lib/db').then(m => m.addDocument('quiz_attempts', newAttempt));
    }
  };

  const currentQuestion = quiz.questions[currentQuestionIdx];
  const currentScore = answers.reduce((score, ans, i) => {
    return score + (ans === quiz.questions[i].correctOptionIndex ? 1 : 0);
  }, 0);

  // --- RENDER BLOCK: ALREADY ATTEMPTED ---
  if (isBlocked && previousAttempt) {
    return (
      <div className="page-container" style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
        <AnimatedSection>
          <div style={{ background: 'rgba(15,22,40,0.4)', padding: '3rem', borderRadius: '16px', border: '1px solid rgba(239, 68, 68, 0.4)' }}>
            <h2 style={{ fontSize: '2rem', marginBottom: '1rem', color: '#ef4444' }}>Already Attempted</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
              You have already taken the <strong>{quiz.title}</strong> quiz. Members get 1 attempt per quiz.
            </p>
            <div className="gradient-text" style={{ fontSize: '3rem', fontWeight: 700, marginBottom: '2rem' }}>
              Score: {previousAttempt.score}/{previousAttempt.totalQuestions}
            </div>
            <Link href="/education/quizzes" className="btn-secondary" style={{ textDecoration: 'none' }}>
              Return to Quizzes
            </Link>
          </div>
        </AnimatedSection>
      </div>
    );
  }

  // --- RENDER BLOCK: PRE-QUIZ ---
  if (!hasStarted && !isFinished) {
    return (
      <div className="page-container" style={{ maxWidth: '600px', margin: '0 auto' }}>
        <AnimatedSection>
          <Link href="/education/quizzes" style={{ color: "var(--text-muted)", fontSize: "0.85rem", textDecoration: "none", marginBottom: "2rem", display: "inline-block" }}>
            ← Back to Quizzes
          </Link>
          <div style={{ background: 'rgba(15,22,40,0.4)', padding: '3rem', borderRadius: '16px', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
            <span style={{ fontSize: '0.8rem', padding: '0.3rem 0.8rem', borderRadius: '20px', background: 'rgba(201,168,76,0.1)', color: 'var(--gold)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              {quiz.questions.length} Questions
            </span>
            <h1 style={{ fontSize: '2.2rem', margin: '1rem 0' }} className="gradient-text">{quiz.title}</h1>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: 1.6 }}>{quiz.description}</p>
            
            {!user && (
              <div style={{ marginBottom: '2rem', textAlign: 'left' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Enter your name to begin (Public Flow):</label>
                <input 
                  type="text" 
                  value={publicName}
                  onChange={e => setPublicName(e.target.value)}
                  placeholder="Your Name (optional)" 
                  style={{ width: '100%', padding: '0.8rem', background: 'rgba(0,0,0,0.5)', border: '1px solid var(--border-subtle)', borderRadius: '8px', color: '#fff', outline: 'none' }}
                />
              </div>
            )}

            {user && (
              <div style={{ marginBottom: '2rem', padding: '1rem', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '8px', color: '#22c55e', fontSize: '0.9rem' }}>
                Signed in as {user.name || user.email}.<br/>
                <strong>Note:</strong> Your score will be logged to the internal leaderboard. You have 1 attempt.
              </div>
            )}

            <button onClick={() => setHasStarted(true)} className="btn-primary" style={{ width: '100%', padding: '1rem', fontSize: '1rem', cursor: 'pointer', fontFamily: 'inherit' }}>
              Start Quiz
            </button>
          </div>
        </AnimatedSection>
      </div>
    );
  }

  // --- RENDER BLOCK: FINISHED (RESULTS) ---
  if (isFinished) {
    return (
      <div className="page-container" style={{ maxWidth: '800px', margin: '0 auto' }}>
        <AnimatedSection>
           <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
             <h2 style={{ fontSize: '1.2rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Quiz Complete</h2>
             <h1 style={{ fontSize: '4rem', margin: '1rem 0', fontFamily: "'Cinzel', serif" }} className="gradient-text">
               {currentScore} / {quiz.questions.length}
             </h1>
             <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem' }}>
               {user ? `Great job, ${user.name?.split(' ')[0] || 'Member'}! Your score has been logged.` : `Nice work, ${publicName || 'Guest'}!`}
             </p>
           </div>
        </AnimatedSection>

        {/* Public CTA */}
        {!user && (
          <AnimatedSection delay={0.1}>
            <div style={{ background: 'linear-gradient(90deg, rgba(201,168,76,0.1), transparent)', border: '1px solid var(--gold)', borderRadius: '12px', padding: '2rem', textAlign: 'center', marginBottom: '3rem' }}>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Want to compete?</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Join the Astronomy Club to track your stats on the internal leaderboard, join observation nights, and more.</p>
              <Link href="/join" className="btn-primary" style={{ textDecoration: 'none' }}>Join the Club</Link>
            </div>
          </AnimatedSection>
        )}

        {/* Member Leaderboard */}
        {user && (
          <AnimatedSection delay={0.1}>
            <div style={{ background: 'rgba(15,22,40,0.4)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '2rem', marginBottom: '3rem' }}>
              <h3 style={{ fontSize: '1.3rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.5rem' }}>🏆</span> Internal Leaderboard
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '50px 1fr 100px', padding: '0.5rem 1rem', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  <span>Rank</span>
                  <span>Member</span>
                  <span style={{ textAlign: 'right' }}>Total Score</span>
                </div>
                {leaderboard.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>No entries yet.</div>
                ) : (
                  leaderboard.slice(0, 5).map((entry, idx) => (
                    <div key={entry.userId} style={{ display: 'grid', gridTemplateColumns: '50px 1fr 100px', padding: '1rem', background: idx === 0 ? 'rgba(201,168,76,0.1)' : 'rgba(0,0,0,0.3)', border: idx === 0 ? '1px solid var(--gold-dark)' : '1px solid transparent', borderRadius: '8px', alignItems: 'center' }}>
                      <span style={{ fontWeight: 700, color: idx === 0 ? 'var(--gold)' : 'var(--text-secondary)' }}>#{idx + 1}</span>
                      <span style={{ fontWeight: 500 }}>{entry.name} {entry.userId === user.id && '(You)'}</span>
                      <span style={{ textAlign: 'right', fontFamily: 'monospace', fontSize: '1.1rem', color: 'var(--gold-light)' }}>{entry.score}</span>
                    </div>
                  ))
                )}
              </div>
              <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                 <Link href="/portal" style={{ color: 'var(--gold)', fontSize: '0.9rem', textDecoration: 'none' }}>View Full Leaderboard in Portal →</Link>
              </div>
            </div>
          </AnimatedSection>
        )}

        {/* Answer Review */}
        <AnimatedSection delay={0.2}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', paddingLeft: '1rem', borderLeft: '3px solid var(--gold)' }}>Review Answers</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {quiz.questions.map((q: any, idx: number) => {
              const userAnswerIndex = answers[idx];
              const isCorrect = userAnswerIndex === q.correctOptionIndex;
              return (
                <div key={q.id} style={{ background: 'rgba(8, 12, 22, 0.6)', border: `1px solid ${isCorrect ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`, borderRadius: '12px', padding: '1.5rem' }}>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: isCorrect ? 'var(--gold)' : 'rgba(239,68,68,0.2)', color: isCorrect ? '#000' : '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8rem', flexShrink: 0 }}>
                      {idx + 1}
                    </span>
                    <div>
                      <h4 style={{ fontSize: '1rem', marginBottom: '1rem', lineHeight: 1.4 }}>{q.text}</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {q.options.map((opt: string, optIdx: number) => {
                          let bgColor = 'rgba(0,0,0,0.3)';
                          let borderColor = 'var(--border-subtle)';
                          let color = 'var(--text-secondary)';
                          
                          if (optIdx === q.correctOptionIndex) {
                            bgColor = 'rgba(34,197,94,0.15)';
                            borderColor = '#22c55e';
                            color = '#fff';
                          } else if (optIdx === userAnswerIndex && !isCorrect) {
                            bgColor = 'rgba(239,68,68,0.15)';
                            borderColor = '#ef4444';
                            color = '#fff';
                          }

                          return (
                            <div key={optIdx} style={{ padding: '0.8rem 1rem', background: bgColor, border: `1px solid ${borderColor}`, borderRadius: '6px', color: color, fontSize: '0.9rem' }}>
                              {opt}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ textAlign: 'center', marginTop: '3rem' }}>
            <Link href="/education/quizzes" className="btn-secondary" style={{ textDecoration: 'none' }}>Return to Quizzes</Link>
          </div>
        </AnimatedSection>
      </div>
    );
  }

  // --- RENDER BLOCK: ACTIVE QUIZ ---
  return (
    <div className="page-container" style={{ maxWidth: '700px', margin: '0 auto' }}>
      {/* Progress Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
        <span>Question {currentQuestionIdx + 1} of {quiz.questions.length}</span>
        <span>{Math.round(((currentQuestionIdx) / quiz.questions.length) * 100)}% Complete</span>
      </div>
      <div style={{ width: '100%', height: '6px', background: 'var(--border-subtle)', borderRadius: '3px', marginBottom: '3rem', overflow: 'hidden' }}>
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${((currentQuestionIdx) / quiz.questions.length) * 100}%` }}
          style={{ height: '100%', background: 'var(--gold)', borderRadius: '3px' }}
        />
      </div>

      <motion.div
        key={currentQuestion.id}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3 }}
      >
        <h2 style={{ fontSize: '1.8rem', lineHeight: 1.5, marginBottom: '2rem' }}>
          {currentQuestion.text}
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {currentQuestion.options.map((option: string, idx: number) => (
            <button
              key={idx}
              onClick={() => handleAnswer(idx)}
              className="option-btn"
              style={{
                width: '100%', textAlign: 'left', padding: '1.2rem 1.5rem', background: 'rgba(15, 22, 40, 0.4)',
                border: '1px solid var(--border-subtle)', borderRadius: '12px', color: 'var(--text-primary)',
                fontSize: '1.05rem', cursor: 'pointer', transition: 'all 0.2s ease', fontFamily: 'inherit'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(201, 168, 76, 0.1)'; e.currentTarget.style.borderColor = 'var(--gold-dark)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(15, 22, 40, 0.4)'; e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}
            >
              {option}
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
