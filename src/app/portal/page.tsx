"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import AnimatedSection from '@/components/AnimatedSection';
import AnimatedCard from '@/components/AnimatedCard';
import { useAuth } from '@/context/AuthContext';

type LeaderboardRow = { name: string; score: number; userId: string };

export default function Portal() {
  const { user, loading, authError, signInWithGoogle, signInWithEmail, signUpWithEmail, logout } = useAuth();

  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const inputStyle = {
    padding: '0.7rem 1rem', background: 'rgba(15, 22, 40, 0.5)', border: '1px solid var(--border-subtle)',
    borderRadius: '6px', color: 'var(--text-primary)', fontSize: '0.9rem', fontFamily: 'inherit', width: '100%'
  };

  const announcements = [
    { date: "Mar 20, 2026", title: "Next observation night: March 25th at 9 PM", type: "Event" },
    { date: "Mar 18, 2026", title: "New equipment arrived — Celestron NexStar 8SE available for reservation", type: "Equipment" },
    { date: "Mar 15, 2026", title: "Weekly quiz scores updated — check the leaderboard!", type: "Quiz" },
  ];

  const myProjects = [
    { name: "Weather Balloon Launch #4", role: "Data Analyst", progress: 75 },
    { name: "CubeSat Feasibility Study", role: "Research Member", progress: 30 },
  ];

  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([]);

  useEffect(() => {
    let unsubLeaderboard = () => {};
    if (user) {
      import('@/lib/db').then(({ subscribeToCollection }) => {
        unsubLeaderboard = subscribeToCollection('quiz_attempts', (data) => {
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
    return () => unsubLeaderboard();
  }, [user]);

  return (
    <div className="page-container">
      <AnimatedSection>
        <p className="section-title" style={{ textAlign: "center" }}>Welcome Back</p>
        <h1 className="page-title"><span className="gradient-text">Member Portal</span></h1>
      </AnimatedSection>

      {loading ? (
        <div style={{ textAlign: "center", padding: "4rem", color: "var(--gold)" }}>
           <p>Initializing uplink...</p>
        </div>
      ) : !user ? (
        /* ==== LOGIN STATE ==== */
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '3rem' }}>
          <AnimatedSection direction="up" delay={0.1}>
            <div className="feature-card" style={{ padding: '3rem', textAlign: 'center', maxWidth: '400px', width: '100%' }}>
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, type: "spring", stiffness: 200 }}
                style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--gold-dark), var(--gold))', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}
              >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#0c1222" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              </motion.div>
              <h3 style={{ fontSize: '1.4rem', marginBottom: '0.5rem' }}>Astronomy Database</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '2rem' }}>Sign in to access announcements, project tracking, and internal logs.</p>
              
              {authError && (
                <div style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.3)", padding: "0.8rem", borderRadius: "8px", color: "#ef4444", fontSize: "0.85rem", marginBottom: "1.5rem" }}>
                  ⚠️ {authError}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginBottom: '1.5rem' }}>
                {authMode === 'signup' && (
                  <input type="text" placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} />
                )}
                <input type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} />
                <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle} />
              </div>

              <button 
                onClick={() => authMode === 'login' ? signInWithEmail(email, password) : signUpWithEmail(email, password, name)} 
                className="btn-primary" 
                style={{ width: "100%", padding: "0.8rem", fontSize: "1rem", cursor: "pointer", fontFamily: 'inherit', marginBottom: '1rem' }}
              >
                {authMode === 'login' ? 'Login with Email' : 'Create Member Account'}
              </button>

              <button 
                onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
                style={{ background: 'none', border: 'none', color: 'var(--gold)', fontSize: '0.85rem', cursor: 'pointer', textDecoration: 'underline', marginBottom: '1.5rem', display: 'block', margin: '0 auto' }}
              >
                {authMode === 'login' ? "Don't have an account? Sign Up" : "Already have an account? Login"}
              </button>

              <div style={{ position: 'relative', margin: '1.5rem 0', textAlign: 'center' }}>
                <hr style={{ border: '0', borderTop: '1px solid var(--border-subtle)' }} />
                <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'var(--bg-card)', padding: '0 1rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>OR</span>
              </div>

              <button onClick={signInWithGoogle} className="btn-secondary" style={{ fontFamily: 'inherit', cursor: 'pointer', width: '100%', fontSize: '0.9rem', padding: '0.8rem', background: 'transparent' }}>
                Continue with Google
              </button>
            </div>
          </AnimatedSection>
        </div>
      ) : (
        /* ==== MEMBER DASHBOARD STATE ==== */
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '2rem', width: '100%', alignItems: 'start' }}>
        {/* Main Content */}
        <div>
          {/* Announcements */}
          <AnimatedSection>
            <h2 style={{ fontSize: '1.3rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.63 3.18 2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 6 6l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.574 2.81.7A2 2 0 0 1 21.32 16a2 2 0 0 1 .6.92z"></path></svg>
              Announcements
            </h2>
          </AnimatedSection>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginBottom: '3rem' }}>
            {announcements.map((ann, i) => (
              <AnimatedSection key={i} direction="left" delay={i * 0.1}>
                <div style={{ padding: '1.2rem 1.5rem', borderLeft: '2px solid var(--gold-dark)', background: 'rgba(15, 22, 40, 0.3)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                    <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--gold)', fontWeight: 600 }}>{ann.type}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{ann.date}</span>
                  </div>
                  <p style={{ fontSize: '0.95rem' }}>{ann.title}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>

          {/* My Projects with animated progress bars */}
          <AnimatedSection>
            <h2 style={{ fontSize: '1.3rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"></path><path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"></path><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"></path><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"></path></svg>
              My Projects
            </h2>
          </AnimatedSection>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {myProjects.map((proj, i) => (
              <AnimatedCard key={i} index={i} enableTilt={false} style={{ textAlign: 'left', padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
                  <h4 style={{ fontSize: '1rem' }}>{proj.name}</h4>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{proj.role}</span>
                </div>
                <div style={{ width: '100%', height: '6px', background: 'var(--border-subtle)', borderRadius: '3px', overflow: 'hidden' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${proj.progress}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.2, delay: 0.3 + i * 0.2, ease: [0.25, 0.4, 0.25, 1] }}
                    style={{ height: '100%', background: 'linear-gradient(90deg, var(--gold-dark), var(--gold-light))', borderRadius: '3px' }}
                  />
                </div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.5rem', display: 'block' }}>{proj.progress}% complete</span>
              </AnimatedCard>
            ))}
          </div>

          {/* Internal Leaderboard */}
          <AnimatedSection>
            <h2 style={{ fontSize: '1.3rem', marginTop: '3rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span style={{ fontSize: '1.4rem' }}>🏆</span> Quiz Leaderboard
            </h2>
          </AnimatedSection>
          <div style={{ background: 'rgba(15,22,40,0.4)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '50px 1fr 100px', padding: '0.5rem 1rem', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em', borderBottom: '1px solid var(--border-subtle)', marginBottom: '0.5rem' }}>
              <span>Rank</span>
              <span>Member</span>
              <span style={{ textAlign: 'right' }}>Total Score</span>
            </div>
            {leaderboard.length === 0 ? (
              <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>No entries yet. Hit the quizzes to get on the board!</div>
            ) : (
              leaderboard.map((entry, idx: number) => (
                <div key={entry.userId} style={{ display: 'grid', gridTemplateColumns: '50px 1fr 100px', padding: '1rem', background: idx === 0 ? 'rgba(201,168,76,0.1)' : entry.userId === user.id ? 'rgba(255,255,255,0.03)' : 'transparent', border: idx === 0 ? '1px solid var(--gold-dark)' : '1px solid transparent', borderRadius: '8px', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, color: idx === 0 ? 'var(--gold)' : 'var(--text-secondary)' }}>#{idx + 1}</span>
                  <span style={{ fontWeight: 500, color: entry.userId === user.id ? '#fff' : 'inherit' }}>{entry.name} {entry.userId === user.id && '(You)'}</span>
                  <span style={{ textAlign: 'right', fontFamily: 'monospace', fontSize: '1.1rem', color: 'var(--gold-light)' }}>{entry.score}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div>
          {/* Profile Card */}
          <AnimatedSection direction="right" delay={0.1}>
            <div className="feature-card" style={{ padding: '2rem', textAlign: 'center', marginBottom: '1.5rem' }}>
              {user.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.image} alt="Avatar" style={{ width: '70px', height: '70px', borderRadius: '50%', margin: '0 auto 1rem', border: "2px solid var(--gold)" }} />
              ) : (
                <div style={{ width: '70px', height: '70px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--gold-dark), var(--gold))', margin: '0 auto 1rem' }} />
              )}
              <h3 style={{ fontSize: '1.1rem', marginBottom: '0.3rem' }}>{user.name || "Club Member"}</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', wordWrap: "break-word" }}>{user.email}</p>
              <button onClick={logout} className="btn-secondary" style={{ marginTop: '1.5rem', fontFamily: 'inherit', cursor: 'pointer', width: '100%', background: "transparent", border: "1px solid rgba(239, 68, 68, 0.4)", color: "#ef4444" }}>
                Sign Out
              </button>
            </div>
          </AnimatedSection>

          {/* Contact Admin Form */}
          <AnimatedSection direction="right" delay={0.2}>
            <div className="feature-card" style={{ padding: '1.5rem', textAlign: 'left', marginBottom: '1.5rem' }}>
              <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--gold)', marginBottom: '1.2rem' }}>Contact Admin</h4>
              <form onSubmit={async (e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const message = (form.elements.namedItem('message') as HTMLTextAreaElement).value;
                if (!message) return;

                const btn = form.querySelector('button');
                if (btn) btn.disabled = true;

                try {
                  await fetch("/api/send-email", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      to: "admin",
                      subject: `Message from Member: ${user.name || user.email}`,
                      replyTo: user.email,
                      html: `
                        <div style="font-family: sans-serif; padding: 20px; background: #0f1628; color: #fff; border: 1px solid #c9a84c; border-radius: 12px;">
                          <h2 style="color: #c9a84c;">New Member Message</h2>
                          <p><strong>From:</strong> ${user.name} (${user.email})</p>
                          <p><strong>Message:</strong></p>
                          <p style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 8px; line-height: 1.6;">${message}</p>
                        </div>
                      `,
                    }),
                  });
                  alert("Message sent to admin!");
                  form.reset();
                } catch (err) {
                  console.error(err);
                  alert("Failed to send message.");
                } finally {
                  if (btn) btn.disabled = false;
                }
              }}>
                <textarea
                  name="message"
                  required
                  placeholder="Ask a question or report an issue..."
                  style={{
                    width: '100%',
                    background: 'rgba(15, 22, 40, 0.6)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    padding: '0.8rem',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem',
                    minHeight: '100px',
                    marginBottom: '1rem',
                    resize: 'none',
                    outline: 'none'
                  }}
                />
                <button type="submit" className="btn-primary" style={{ width: '100%', fontSize: '0.8rem', padding: '0.7rem' }}>
                  Send Message
                </button>
              </form>
            </div>
          </AnimatedSection>

          {/* Quick Links */}
          <AnimatedSection direction="right" delay={0.3}>
            <div className="feature-card" style={{ padding: '1.5rem', textAlign: 'left' }}>
              <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--gold)', marginBottom: '1rem' }}>Quick Links</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <Link href="/education/quizzes" style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 300, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg>
                  Quizzes & Leaderboard
                </Link>
                <Link href="/media" style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 300, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>
                  Browse Media
                </Link>
                <Link href="/observations" style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 300, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                  Log Observation
                </Link>
                <Link href="/events" style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 300, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                  Upcoming Events
                </Link>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </div>
      )}
    </div>
  );
}
