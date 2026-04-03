"use client";
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import AnimatedSection from '@/components/AnimatedSection';
import AnimatedCard from '@/components/AnimatedCard';
import AvatarCropperModal from '@/components/AvatarCropperModal';
import { useAuth } from '@/context/AuthContext';
import { canAccessAdminPage as canAccessAdminDashboard } from '@/lib/admin-access';
import { getDisabledFeatureKeys, getFeatureDisplayName, isMaintenanceActive, type SystemControlSettings } from '@/lib/system-control';

type Notification = { id: string; type: string; title: string; message: string; isRead: boolean; link: string | null; createdAt: string };
type Announcement = { id: string; title: string; message: string; targetRoles: string[]; createdAt: string | null };
type ActivityEntry = { id: string; action: string; entityType: string; entityId: string | null; timestamp: string | null };
type MyProject = { id: string; name: string; status: string; role: string; progress: number };

type LeaderboardRow = { name: string; score: number; userId: string };
type QuizLeaderboardGroups = { daily: LeaderboardRow[]; weekly: LeaderboardRow[]; monthly: LeaderboardRow[] };

export default function Portal() {
  const { user, loading, authError, signInWithGoogle, signInWithEmail, signUpWithEmail, logout, hasPermission, isAdmin } = useAuth();
  const canAccessAdminPage = canAccessAdminDashboard({ isAdmin, hasPermission });

  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [quoteFeedback, setQuoteFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [contactFeedback, setContactFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Live data states
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [portalAnnouncements, setPortalAnnouncements] = useState<Announcement[]>([]);
  const [recentActivity, setRecentActivity] = useState<ActivityEntry[]>([]);
  const [systemControl, setSystemControl] = useState<SystemControlSettings | null>(null);
  const [myProjects, setMyProjects] = useState<MyProject[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [portalMetaLoading, setPortalMetaLoading] = useState(false);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [leaderboards, setLeaderboards] = useState<QuizLeaderboardGroups>({ daily: [], weekly: [], monthly: [] });

  const inputStyle = {
    padding: '0.7rem 1rem', background: 'rgba(15, 22, 40, 0.5)', border: '1px solid var(--border-subtle)',
    borderRadius: '6px', color: 'var(--text-primary)', fontSize: '0.9rem', fontFamily: 'inherit', width: '100%'
  };

  const quickLinkStyle = {
    color: 'var(--text-secondary)',
    fontSize: '0.85rem',
    fontWeight: 300,
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  } as const;

  const fetchPortalData = useCallback(async () => {
    if (!user) return;
    setNotificationsLoading(true);
    setPortalMetaLoading(true);
    setProjectsLoading(true);
    try {
      const [
        { getMyNotificationsAction, getMyProjectsAction },
        { getSystemControlPublicSnapshotAction },
        { getMyAnnouncementsAction },
        { getMyRecentActivityAction },
      ] = await Promise.all([
        import('@/app/actions/notifications'),
        import('@/app/actions/system-control'),
        import('@/app/actions/announcements'),
        import('@/app/actions/activity-logs'),
      ]);
      const [notifs, projects] = await Promise.all([
        getMyNotificationsAction(),
        getMyProjectsAction(),
      ]);
      const [control, announcementRows, activityRows] = await Promise.all([
        getSystemControlPublicSnapshotAction(),
        getMyAnnouncementsAction(),
        getMyRecentActivityAction(),
      ]);
      setNotifications(notifs.slice(0, 5));
      setMyProjects(projects);
      setSystemControl(control);
      setPortalAnnouncements(announcementRows.slice(0, 5));
      setRecentActivity(activityRows.slice(0, 5));
    } catch (err) {
      console.error('[Portal] fetchPortalData error:', err);
    } finally {
      setNotificationsLoading(false);
      setPortalMetaLoading(false);
      setProjectsLoading(false);
    }
  }, [user]);

  const loadLeaderboards = useCallback(async () => {
    if (!user) return;
    try {
      const { getQuizLeaderboardAction } = await import('@/app/actions/quizzes');
      const [daily, weekly, monthly] = await Promise.all([
        getQuizLeaderboardAction('daily'),
        getQuizLeaderboardAction('weekly'),
        getQuizLeaderboardAction('monthly'),
      ]);
      setLeaderboards({ daily, weekly, monthly });
    } catch (err) {
      console.error('[Portal] loadLeaderboards error:', err);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchPortalData();
      loadLeaderboards();
    }
  }, [user, fetchPortalData, loadLeaderboards]);

  useEffect(() => {
    if (!user) {
      setProfileImageUrl(null);
      setImgError(false);
      setSystemControl(null);
      return;
    }

    const nextProfileSrc =
      user.image ||
      ((user as any).profileImageKey
        ? `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL || ""}/${(user as any).profileImageKey}`
        : null);

    setProfileImageUrl(nextProfileSrc);
    setImgError(false);
  }, [user]);

  const disabledFeatures = systemControl ? getDisabledFeatureKeys(systemControl) : [];
  const maintenanceActive = systemControl ? isMaintenanceActive(systemControl) : false;
  const formatTimestamp = (value: string | null) =>
    value
      ? new Date(value).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' })
      : 'Unknown';
  const formatRelativeTime = (value: string) => {
    const diff = Date.now() - new Date(value).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  };

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
          {maintenanceActive && (
            <AnimatedSection>
              <div style={{ marginBottom: '1.2rem', padding: '1rem 1.2rem', borderRadius: '10px', border: '1px solid rgba(201,168,76,0.35)', background: 'rgba(201,168,76,0.08)' }}>
                <strong style={{ display: 'block', marginBottom: '0.35rem', color: 'var(--gold)' }}>System Status</strong>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                  Maintenance mode is currently active. {systemControl?.maintenanceReason || 'Some public areas may be unavailable.'}
                </p>
                {systemControl?.maintenanceUntil && (
                  <p style={{ margin: '0.45rem 0 0', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                    Until {formatTimestamp(systemControl.maintenanceUntil)}
                  </p>
                )}
              </div>
            </AnimatedSection>
          )}
          <AnimatedSection>
            <h2 style={{ fontSize: '1.3rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
              Notifications
            </h2>
          </AnimatedSection>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginBottom: '3rem' }}>
            {notificationsLoading ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Loading...</div>
            ) : notifications.length === 0 ? (
              <div style={{ padding: '1.5rem', background: 'rgba(15, 22, 40, 0.3)', borderRadius: '8px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                🔕 No notifications yet.
              </div>
            ) : (
              notifications.map((ann, i) => {
                const typeLabel = ann.type === 'approval_request' ? 'Approval' : ann.type === 'task_assigned' ? 'Task' : ann.type === 'mention' ? 'Mention' : 'System';
                const timeAgo = formatRelativeTime(ann.createdAt);
                return (
                  <AnimatedSection key={ann.id} direction="left" delay={i * 0.08}>
                    <div
                      onClick={async () => { if (!ann.isRead) { const { markNotificationReadAction } = await import('@/app/actions/notifications'); await markNotificationReadAction(ann.id); setNotifications(prev => prev.map(n => n.id === ann.id ? {...n, isRead: true} : n)); } if (ann.link) window.location.href = ann.link; }}
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

          <AnimatedSection>
            <h2 style={{ fontSize: '1.3rem', marginTop: '3rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span style={{ fontSize: '1.2rem' }}>📣</span> Club Announcements
            </h2>
          </AnimatedSection>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginBottom: '3rem' }}>
            {portalMetaLoading ? (
              <div style={{ padding: '1.2rem', background: 'rgba(15, 22, 40, 0.3)', borderRadius: '8px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Loading announcements...
              </div>
            ) : portalAnnouncements.length === 0 ? (
              <div style={{ padding: '1.2rem', background: 'rgba(15, 22, 40, 0.3)', borderRadius: '8px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No targeted announcements right now.
              </div>
            ) : (
              portalAnnouncements.map((item, index) => (
                <AnimatedSection key={item.id} direction="left" delay={index * 0.05}>
                  <div style={{ padding: '1rem 1.2rem', background: 'rgba(15,22,40,0.35)', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', marginBottom: '0.4rem' }}>
                      <strong>{item.title}</strong>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>{formatTimestamp(item.createdAt)}</span>
                    </div>
                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.6 }}>{item.message}</p>
                  </div>
                </AnimatedSection>
              ))
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            {(['daily', 'weekly', 'monthly'] as const).map((type) => (
              <div key={type} style={{ background: 'rgba(15,22,40,0.4)', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ fontSize: '0.95rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--gold)', margin: 0 }}>{type}</h3>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>Top 5</span>
                </div>
                {(leaderboards[type] || []).length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '1.5rem 0.5rem', color: 'var(--text-muted)', fontSize: '0.82rem' }}>No entries yet.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    {(leaderboards[type] || []).slice(0, 5).map((entry, idx: number) => (
                      <div key={`${type}-${entry.userId}`} style={{ display: 'grid', gridTemplateColumns: '40px 1fr 70px', padding: '0.75rem', background: idx === 0 ? 'rgba(201,168,76,0.1)' : entry.userId === user.id ? 'rgba(255,255,255,0.03)' : 'transparent', border: idx === 0 ? '1px solid var(--gold-dark)' : '1px solid transparent', borderRadius: '8px', alignItems: 'center' }}>
                        <span style={{ fontWeight: 700, color: idx === 0 ? 'var(--gold)' : 'var(--text-secondary)' }}>#{idx + 1}</span>
                        <span style={{ fontWeight: 500, color: entry.userId === user.id ? '#fff' : 'inherit', fontSize: '0.85rem' }}>{entry.name} {entry.userId === user.id && '(You)'}</span>
                        <span style={{ textAlign: 'right', fontFamily: 'monospace', fontSize: '0.95rem', color: 'var(--gold-light)' }}>{entry.score}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <AnimatedSection>
            <h2 style={{ fontSize: '1.3rem', marginTop: '3rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span style={{ fontSize: '1.2rem' }}>🕒</span> Personal Activity
            </h2>
          </AnimatedSection>
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {portalMetaLoading ? (
              <div style={{ padding: '1.1rem', background: 'rgba(15,22,40,0.3)', borderRadius: '8px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Loading your activity...
              </div>
            ) : recentActivity.length === 0 ? (
              <div style={{ padding: '1.1rem', background: 'rgba(15,22,40,0.3)', borderRadius: '8px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No recent personal activity logged yet.
              </div>
            ) : (
              recentActivity.map((entry) => (
                <div key={entry.id} style={{ padding: '0.9rem 1rem', background: 'rgba(15,22,40,0.35)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                    <strong style={{ fontSize: '0.88rem' }}>{entry.action}</strong>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.76rem' }}>{formatTimestamp(entry.timestamp)}</span>
                  </div>
                  <p style={{ margin: '0.35rem 0 0', color: 'var(--text-muted)', fontSize: '0.8rem' }}>{entry.entityType}{entry.entityId ? ` · ${entry.entityId}` : ''}</p>
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
                const profileSrc = profileImageUrl;
                return profileSrc && !imgError ? (
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
                {quoteFeedback && (
                  <div
                    style={{
                      marginBottom: '0.6rem',
                      padding: '0.55rem 0.7rem',
                      borderRadius: '6px',
                      border: quoteFeedback.type === 'success' ? '1px solid rgba(34,197,94,0.35)' : '1px solid rgba(239,68,68,0.35)',
                      background: quoteFeedback.type === 'success' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                      color: quoteFeedback.type === 'success' ? '#86efac' : '#fca5a5',
                      fontSize: '0.75rem',
                    }}
                  >
                    {quoteFeedback.message}
                  </div>
                )}
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
                      setQuoteFeedback(null);
                      try {
                        const { updateUserProfileAction } = await import('@/app/actions/members');
                        await updateUserProfileAction({ quote: input.value });
                        setQuoteFeedback({ type: 'success', message: 'Quote saved!' });
                      } catch (err: any) {
                        setQuoteFeedback({ type: 'error', message: 'Failed: ' + err.message });
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
              {contactFeedback && (
                <div
                  style={{
                    marginBottom: '1rem',
                    padding: '0.7rem 0.85rem',
                    borderRadius: '8px',
                    border: contactFeedback.type === 'success' ? '1px solid rgba(34,197,94,0.35)' : '1px solid rgba(239,68,68,0.35)',
                    background: contactFeedback.type === 'success' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                    color: contactFeedback.type === 'success' ? '#86efac' : '#fca5a5',
                    fontSize: '0.8rem',
                  }}
                >
                  {contactFeedback.message}
                </div>
              )}
              <form onSubmit={async (e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const message = (form.elements.namedItem('message') as HTMLTextAreaElement).value;
                if (!message) return;
                setContactFeedback(null);

                const btn = form.querySelector('button');
                if (btn) btn.disabled = true;

                try {
                  const response = await fetch("/api/send-email", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      flow: "member_contact",
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
                  if (!response.ok) {
                    throw new Error("Email request rejected");
                  }
                  setContactFeedback({ type: 'success', message: 'Message sent to admin!' });
                  form.reset();
                } catch (err) {
                  console.error(err);
                  setContactFeedback({ type: 'error', message: 'Failed to send message.' });
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
              {systemControl && (
                <div style={{ marginBottom: '1rem', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', background: 'rgba(8,12,22,0.35)' }}>
                  <p style={{ margin: 0, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>Feature Availability</p>
                  <div style={{ marginTop: '0.5rem', display: 'grid', gap: '0.35rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    {disabledFeatures.map((feature) => (
                      <span key={feature}>{getFeatureDisplayName(feature)} is currently disabled.</span>
                    ))}
                    {disabledFeatures.length === 0 ? <span>All member modules are available.</span> : null}
                  </div>
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {systemControl?.features?.quizzesEnabled !== false && <Link href="/education/quizzes" style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 300, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg>
                  Quizzes & Leaderboard
                </Link>}
                {systemControl?.features?.observationsEnabled !== false && <Link href="/portal/observations" style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 300, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>
                  Observation Feed
                </Link>}
                {systemControl?.features?.observationsEnabled !== false && <Link href="/observations" style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 300, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                  Log Observation
                </Link>}
                {systemControl?.features?.eventsEnabled !== false && <Link href="/events" style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 300, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                  Upcoming Events
                </Link>}
                {hasPermission('manage_projects') && (
                  <Link href="/core/observations" style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 300, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12l2 2 4-4"></path><path d="M21 12c0 1.66-4.03 6-9 6s-9-4.34-9-6 4.03-6 9-6 9 4.34 9 6z"></path></svg>
                    Review Queue
                  </Link>
                )}
                {canAccessAdminPage && (
                  <Link href="/admin" style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 300, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.01a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.01a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.01a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                    Admin Dashboard
                  </Link>
                )}
              </div>
            </div>
          </AnimatedSection>
        </div>
        </div>
      )}
      <AvatarCropperModal 
        isOpen={isCropperOpen} 
        onClose={() => setIsCropperOpen(false)} 
        onSuccess={(imageUrl) => {
          setProfileImageUrl(imageUrl);
          setImgError(false);
          setIsCropperOpen(false);
        }} 
      />
    </div>
  );
}
