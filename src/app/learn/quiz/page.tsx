"use client";

import { useState } from 'react';

export default function Quiz() {
  const [currentQ, setCurrentQ] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);

  const questions = [
    { question: "What is the closest star to Earth?", options: ["Proxima Centauri", "Sirius", "The Sun", "Alpha Centauri"], answer: 2 },
    { question: "Which planet has the most moons?", options: ["Jupiter", "Saturn", "Neptune", "Uranus"], answer: 1 },
    { question: "What causes a solar eclipse?", options: ["Earth blocks sunlight", "Moon blocks sunlight", "Sun rotates", "Planets align"], answer: 1 },
    { question: "How old is the universe approximately?", options: ["4.5 billion years", "10 billion years", "13.8 billion years", "20 billion years"], answer: 2 },
    { question: "What is the largest structure in the observable universe?", options: ["Milky Way Galaxy", "Hercules–Corona Borealis Great Wall", "Andromeda Galaxy", "Boötes void"], answer: 1 },
  ];

  const leaderboard = [
    { name: "Alex Nova", score: 847, streak: 12 },
    { name: "Jordan Orion", score: 723, streak: 8 },
    { name: "Taylor Vega", score: 691, streak: 15 },
    { name: "Sam Eclipse", score: 634, streak: 6 },
    { name: "Morgan Star", score: 589, streak: 4 },
  ];

  const handleAnswer = (idx: number) => {
    if (selected !== null) return;
    setSelected(idx);
    if (idx === questions[currentQ].answer) {
      setScore(score + 1);
    }
    setTimeout(() => {
      if (currentQ < questions.length - 1) {
        setCurrentQ(currentQ + 1);
        setSelected(null);
      } else {
        setShowResult(true);
      }
    }, 1000);
  };

  return (
    <div className="page-container">
      <p className="section-title">Challenge Yourself</p>
      <h1 className="page-title"><span className="gradient-text">Astronomy Quiz</span></h1>
      <p className="page-subtitle">
        Daily quizzes to test your cosmic knowledge. Climb the leaderboard!
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '2rem', width: '100%', alignItems: 'start' }}>
        {/* Quiz Area */}
        <div className="feature-card" style={{ padding: '2.5rem', textAlign: 'left' }}>
          {!showResult ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <span style={{ color: 'var(--gold)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  Question {currentQ + 1} of {questions.length}
                </span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Score: {score}</span>
              </div>
              <h3 style={{ fontSize: '1.3rem', marginBottom: '2rem', lineHeight: 1.5 }}>{questions[currentQ].question}</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                {questions[currentQ].options.map((opt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleAnswer(idx)}
                    style={{
                      padding: '1rem 1.2rem',
                      background: selected === idx
                        ? idx === questions[currentQ].answer ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)'
                        : 'rgba(15, 22, 40, 0.4)',
                      border: `1px solid ${selected === idx
                        ? idx === questions[currentQ].answer ? '#22c55e' : '#ef4444'
                        : 'var(--border-subtle)'}`,
                      borderRadius: '8px',
                      color: 'var(--text-primary)',
                      fontSize: '0.95rem',
                      cursor: selected !== null ? 'default' : 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.2s ease',
                      fontFamily: 'inherit'
                    }}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>🎉</span>
              <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Quiz Complete!</h2>
              <p style={{ color: 'var(--gold-light)', fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem' }}>
                {score} / {questions.length}
              </p>
              <p style={{ color: 'var(--text-secondary)', fontWeight: 300, marginBottom: '2rem' }}>
                {score === questions.length ? "Perfect score! 🌟" : score >= 3 ? "Great job! Keep exploring!" : "Keep learning, the cosmos awaits!"}
              </p>
              <button
                onClick={() => { setCurrentQ(0); setScore(0); setSelected(null); setShowResult(false); }}
                className="btn-primary"
                style={{ fontFamily: 'inherit' }}
              >
                Try Again
              </button>
            </div>
          )}
        </div>

        {/* Leaderboard */}
        <div className="feature-card" style={{ padding: '1.5rem', textAlign: 'left' }}>
          <h3 style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--gold)', marginBottom: '1.2rem' }}>🏆 Leaderboard</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {leaderboard.map((entry, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.7rem 0', borderBottom: i < leaderboard.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                  <span style={{ fontSize: '0.85rem', color: i < 3 ? 'var(--gold-light)' : 'var(--text-muted)', fontWeight: 600, width: '1.5rem' }}>
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}
                  </span>
                  <span style={{ fontSize: '0.9rem' }}>{entry.name}</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--gold-light)' }}>{entry.score}</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>🔥 {entry.streak} day streak</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
