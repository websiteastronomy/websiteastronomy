"use client";
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import AnimatedSection from '@/components/AnimatedSection';
import AnimatedCard from '@/components/AnimatedCard';
import AvatarCropperModal from '@/components/AvatarCropperModal';
import { useAuth } from '@/context/AuthContext';

type Notification = { id: string; type: string; title: string; message: string; isRead: boolean; link: string | null; createdAt: string };
type MyProject = { id: string; name: string; status: string; role: string; progress: number };

type LeaderboardRow = { name: string; score: number; userId: string };

export default function Portal() {
  const { user, loading, authError, signInWithGoogle, signInWithEmail, signUpWithEmail, logout } = useAuth();

  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [imgError, setImgError] = useState(false);

  // Live data states
  const [announcements, setAnnouncements] = useState<Notification[]>([]);
  const [myProjects, setMyProjects] = useState<MyProject[]>([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState(false);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([]);

  const inputStyle = {
    padding: '0.7rem 1rem', background: 'rgba(15, 22, 40, 0.5)', border: '1px solid var(--border-subtle)',
    borderRadius: '6px', color: 'var(--text-primary)', fontSize: '0.9rem', fontFamily: 'inherit', width: '100%'
  };

  const fetchPortalData = useCallback(async () => {
    if (!user) return;
    setAnnouncementsLoading(true);
    setProjectsLoading(true);
    try {
      const { getMyNotificationsAction, getMyProjectsAction } = await import('@/app/actions/notifications');
      const [notifs, projects] = await Promise.all([
        getMyNotificationsAction(),
        getMyProjectsAction(),
      ]);
      setAnnouncements(notifs.slice(0, 5));
      setMyProjects(projects);
    } catch (err) {
      console.error('[Portal] fetchPortalData error:', err);
    } finally {
      setAnnouncementsLoading(false);
      setProjectsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    let unsubLeaderboard = () => {};
    if (user) {
      fetchPortalData();
      import('@/lib/db').then(({ subscribeToCollection }) => {
        unsubLeaderboard = subscribeToCollection('quiz_attempts', (data) => {
          const scores: Record<string, {name: string, score: number, userId: string}> = {};
          data.forEach((a: any) => {
            if (!scores[a.userId]) scores[a.userId] = { name: a.userName || 'Member', score: 0, userId: a.userId };
            scores[a.userId].score += a.score;
          });
          const sorted = Object.values(scores).sort((a,b) => b.score - a.score);
          setLeaderboard(sorted);
        });
      });
    }
    return () => unsubLeaderboard();
  }, [user, fetchPortalData]);

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
          {/* Announcements / Notifications */}
          <AnimatedSection>
            <h2 style={{ fontSize: '1.3rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
              Notifications
            </h2>
          </AnimatedSection>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginBottom: '3rem' }}>
            {announcementsLoading ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Loading...</div>
            ) : announcements.length === 0 ? (
              <div style={{ padding: '1.5rem', background: 'rgba(15, 22, 40, 0.3)', borderRadius: '8px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                🔕 No notifications yet.
              </div>
            ) : (
              announcements.map((ann, i) => {
                const typeLabel = ann.type === 'approval_request' ? 'Approval' : ann.type === 'task_assigned' ? 'Task' : ann.type === 'mention' ? 'Mention' : 'System';
                const timeAgo = (() => { const diff = Date.now() - new Date(ann.createdAt).getTime(); const m = Math.floor(diff/60000); if (m < 1) return 'just now'; if (m < 60) return `${m}m ago`; const h = Math.floor(m/60); if (h < 24) return `${h}h ago`; return `${Math.floor(h/24)}d ago`; })();
                return (
                  <AnimatedSection key={ann.id} direction="left" delay={i * 0.08}>
                    <div
                      onClick={async () => { if (!ann.isRead) { const { markNotificationReadAction } = await import('@/app/actions/notifications'); await markNotificationReadAction(ann.id); setAnnouncements(prev => prev.map(n => n.id === ann.id ? {...n, isRead: true} : n)); } if (ann.link) window.location.href = ann.link; }}
                      style={{ padding: '1.1rem 1.5rem', borderLeft: ann.isRead ? '2px solid var(--border-subtle)' : '2px solid var(--gold)', background: ann.isRead ? 'rgba(15, 22, 40, 0.2)' : 'rgba(201,168,76,0.04)', cursor: ann.link ? 'pointer' : 'default', transition: 'background 0.2s', borderRadius: '0 6px 6px 0' }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: ann.isRead ? 'var(--text-muted)' : 'var(--gold)', fontWeight: 600 }}>{typeLabel}</span>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>{timeAgo}</span>
                      </div>
                      <p style={{ fontSize: '0.9rem', fontWeight: ann.isRead ? 300 : 500, marginBottom: '0.2rem' }}>{ann.title}</p>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 300 }}>{ann.message}</p>
                    </div>
                  </AnimatedSection>
                );
              })
            )}
          </div>

          {/* My Projects with animated progress bars */}
          <AnimatedSection>
            <h2 style={{ fontSize: '1.3rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"></path><path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"></path><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"></path><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"></path></svg>
              My Projects
            </h2>
          </AnimatedSection>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {projectsLoading ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Loading...</div>
            ) : myProjects.length === 0 ? (
              <div style={{ padding: '1.5rem', background: 'rgba(15, 22, 40, 0.3)', borderRadius: '8px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                🚀 You&apos;re not assigned to any projects yet.
                <br /><Link href="/projects" style={{ color: 'var(--gold)', fontSize: '0.8rem', marginTop: '0.5rem', display: 'inline-block' }}>Browse projects →</Link>
              </div>
            ) : (
              myProjects.map((proj, i) => (
                <AnimatedCard key={proj.id} index={i} enableTilt={false} style={{ textAlign: 'left', padding: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', alignItems: 'center' }}>
                    <h4 style={{ fontSize: '1rem' }}>{proj.name}</h4>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      {proj.role === 'Lead' && (
                        <span style={{ fontSize: '0.65rem', background: 'rgba(201,168,76,0.15)', color: 'var(--gold)', padding: '0.15rem 0.5rem', borderRadius: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Lead</span>
                      )}
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{proj.status}</span>
                    </div>
                  </div>
                  <div style={{ width: '100%', height: '6px', background: 'var(--border-subtle)', borderRadius: '3px', overflow: 'hidden', marginBottom: '0.4rem' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${proj.progress}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.2, delay: 0.3 + i * 0.2, ease: [0.25, 0.4, 0.25, 1] }}
                      style={{ height: '100%', background: 'linear-gradient(90deg, var(--gold-dark), var(--gold-light))', borderRadius: '3px' }}
                    />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{proj.progress}% complete</span>
                    <Link href={`/projects/${proj.id}`} style={{ color: 'var(--gold)', fontSize: '0.75rem' }}>View →</Link>
                  </div>
                </AnimatedCard>
              ))
            )}
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
              {(() => {
                const profileSrc = user.image || ((user as any).profileImageKey ? `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL || ""}/${(user as any).profileImageKey}` : null);
                return profileSrc && !imgError ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={profileSrc} alt="Avatar" onError={() => setImgError(true)} style={{ width: '70px', height: '70px', borderRadius: '50%', margin: '0 auto 1rem', border: "2px solid var(--gold)", objectFit: "cover" }} />
                ) : (
                  <div style={{ width: '70px', height: '70px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--gold-dark), var(--gold))', margin: '0 auto 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', color: '#000', fontWeight: 700 }}>
                    {(user.name || "?").charAt(0).toUpperCase()}
                  </div>
                );
              })()}
              <h3 style={{ fontSize: '1.1rem', marginBottom: '0.3rem' }}>{user.name || "Club Member"}</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', wordWrap: "break-word" }}>{user.email}</p>

              {/* Profile Image Upload */}
              <div style={{ marginTop: '1rem' }}>
                <button
                  onClick={() => setIsCropperOpen(true)}
                  style={{ display: 'inline-block', background: 'transparent', fontSize: '0.78rem', color: 'var(--gold)', cursor: 'pointer', padding: '0.4rem 0.8rem', border: '1px solid rgba(201,168,76,0.4)', borderRadius: '6px', transition: 'all 0.2s' }}
                >
                  📷 Upload Photo
                </button>

                <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>JPG, PNG, WebP • Max 2MB</p>
              </div>

              {/* Quote Edit */}
              <div style={{ marginTop: '1rem', textAlign: 'left' }}>
                <label style={{ display: 'block', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Your Quote</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    id="user-quote"
                    type="text"
                    placeholder="e.g. Per aspera ad astra"
                    defaultValue={(user as any).quote || ''}
                    style={{ flex: 1, padding: '0.5rem 0.7rem', background: 'rgba(15, 22, 40, 0.6)', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '0.8rem', fontFamily: 'inherit' }}
                  />
                  <button
                    onClick={async () => {
                      const input = document.getElementById('user-quote') as HTMLInputElement;
                      if (!input) return;
                      try {
                        const { updateUserProfileAction } = await import('@/app/actions/members');
                        await updateUserProfileAction({ quote: input.value });
                        alert('Quote saved!');
                      } catch (err: any) {
                        alert('Failed: ' + err.message);
                      }
                    }}
                    style={{ padding: '0.5rem 0.7rem', background: 'var(--gold-dark)', color: '#000', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700, fontFamily: 'inherit' }}
                  >
                    Save
                  </button>
                </div>
              </div>

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
      <AvatarCropperModal 
        isOpen={isCropperOpen} 
        onClose={() => setIsCropperOpen(false)} 
        onSuccess={() => window.location.reload()} 
      />
    </div>
  );
}
