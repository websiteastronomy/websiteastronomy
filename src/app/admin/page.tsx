"use client";
/* eslint-disable @typescript-eslint/no-explicit-any -- Admin CRUD uses mixed Firestore document shapes */

import { useState } from 'react';
import { Project } from '@/data/mockProjects';
import { AppEvent } from '@/data/mockEvents';
import { Observation } from '@/data/mockObservations';
import { Outreach } from '@/data/mockOutreach';
import { MediaItem } from '@/data/mockMedia';
import { EDUCATION_SETTINGS, EducationPost } from '@/data/mockEducation';
import { Quiz } from '@/data/mockQuizzes';
import { MOCK_NIGHT_SKY } from '@/data/mockNightSky';
import { useAuth } from '@/context/AuthContext';
import { motion } from 'framer-motion';
import { 
  getSiteSettings, 
  updateSiteSettings, 
  subscribeToCollection,
  addDocument,
  updateDocument,
  deleteDocument,
  SiteSettings,
} from '@/lib/db';
import { useEffect } from 'react';

export default function Admin() {
  const { user, isAdmin, loading, authError, signInWithGoogle, logout } = useAuth();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [showForm, setShowForm] = useState(false);

  // Dummy data state — will be replaced by Firestore in Phase B

  // Education state
  const [adminEducation, setAdminEducation] = useState<EducationPost[]>([]);
  const [editingEducation, setEditingEducation] = useState<EducationPost | null>(null);
  const [dailyFact, setDailyFact] = useState(EDUCATION_SETTINGS.dailyFact);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);

  // Real Site Settings State
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Members state (now from Firestore)
  const [members, setMembers] = useState<any[]>([]);
  const [editingMember, setEditingMember] = useState<any | null>(null);

  // Form state
  const [formData, setFormData] = useState<Record<string, string>>({});
  
  // Projects state
  const [adminProjects, setAdminProjects] = useState<Project[]>([]);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  const [adminEvents, setAdminEvents] = useState<AppEvent[]>([]);
  const [editingEvent, setEditingEvent] = useState<AppEvent | null>(null);

  const [adminObservations, setAdminObservations] = useState<Observation[]>([]);
  const [editingObservation, setEditingObservation] = useState<Observation | null>(null);

  const [adminOutreach, setAdminOutreach] = useState<Outreach[]>([]);
  const [editingOutreach, setEditingOutreach] = useState<Outreach | null>(null);

  const [adminMedia, setAdminMedia] = useState<MediaItem[]>([]);
  const [editingMedia, setEditingMedia] = useState<MediaItem | null>(null);
  
  const [achievements, setAchievements] = useState<any[]>([]);
  const [editingAchievement, setEditingAchievement] = useState<any>(null);

  // 1. Fetch initial settings & subscribe to collections
  useEffect(() => {
    const fetchSettings = async () => {
      const settings = await getSiteSettings();
      setSiteSettings(settings);
    };
    fetchSettings();

    // Subscriptions
    const unsubEvents = subscribeToCollection('events', (data) => setAdminEvents(data as any));
    const unsubProjects = subscribeToCollection('projects', (data) => setAdminProjects(data as any));
    const unsubArticles = subscribeToCollection('articles', (data) => setAdminEducation(data as any));
    const unsubQuizzes = subscribeToCollection('quizzes', (data) => setQuizzes(data as any));
    const unsubMembers = subscribeToCollection('members', (data) => setMembers(data as any));
    const unsubMedia = subscribeToCollection('media', (data) => setAdminMedia(data as any));
    const unsubObservations = subscribeToCollection('observations', (data) => setAdminObservations(data as any));
    const unsubOutreach = subscribeToCollection('outreach', (data) => setAdminOutreach(data as any));
    const unsubAch = subscribeToCollection('achievements', (data) => setAchievements(data as any));

    return () => {
      unsubEvents();
      unsubProjects();
      unsubArticles();
      unsubQuizzes();
      unsubMembers();
      unsubMedia();
      unsubObservations();
      unsubOutreach();
      unsubAch();
    };
  }, []);

  const handleSaveSettings = async () => {
    if (!siteSettings) return;
    setIsSavingSettings(true);
    try {
      if (siteSettings) await updateSiteSettings(siteSettings);
      alert("All settings updated successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to update settings.");
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleSaveDocument = async (collectionName: string, editingItem: any, getFormData: () => any) => {
    setIsSavingSettings(true);
    try {
      const data = getFormData();
      if (!data) return;

      if (editingItem?.id) {
        await updateDocument(collectionName, editingItem.id, data);
        alert("Updated successfully!");
      } else {
        await addDocument(collectionName, data);
        alert("Created successfully!");
      }
      setShowForm(false);
      setEditingEvent(null);
      setEditingProject(null);
      setEditingEducation(null);
      setEditingObservation(null);
      setEditingOutreach(null);
      setEditingAchievement(null);
    } catch (err) {
      console.error(err);
      alert("Operation failed. Check console.");
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleDeleteMedia = async (id: string) => {
    if (confirm("Delete this media item?")) await deleteDocument('media', id);
  };

  const handleDeleteOutreach = async (id: string) => {
    if (confirm("Delete this outreach record?")) await deleteDocument('outreach', id);
  };

  const handleDeleteObservation = async (id: string) => {
    if (confirm("Delete this observation?")) await deleteDocument('observations', id);
  };

  const handleDeleteEvent = async (id: string) => {
    if (confirm("Delete this event?")) await deleteDocument('events', id);
  };

  const handleToggleProjectFeature = async (id: string, current: boolean) => {
    await updateDocument('projects', id, { isFeatured: !current });
  };

  const handleDeleteProject = async (id: string) => {
    if (confirm("Delete this project?")) await deleteDocument('projects', id);
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'events', label: 'Events', icon: '📅' },
    { id: 'articles', label: 'Articles & Facts', icon: '📝' },
    { id: 'projects', label: 'Projects', icon: '🚀' },
    { id: 'observations', label: 'Observations', icon: '🔭' },
    { id: 'outreach', label: 'Outreach', icon: '🤝' },
    { id: 'achievements', label: 'Achievements', icon: '🏆' },
    { id: 'members', label: 'Members', icon: '👥' },
    { id: 'night-sky', label: 'Night Sky', icon: '🌙' },
    { id: 'gallery', label: 'Media Gallery', icon: '🖼️' },
    { id: 'settings', label: 'Site Settings', icon: '⚙️' },
  ];

  const stats = [
    { label: 'Total Members', value: members.length.toString(), change: '+3 this month' },
    { label: 'Events This Month', value: adminEvents?.length.toString() || '0', change: `${adminEvents?.length || 0} scheduled` },
    { label: 'Observations', value: adminObservations?.length.toString() || '0', change: 'Archive' },
    { label: 'Outreach Impacts', value: adminOutreach?.length.toString() || '0', change: 'Global logs' },
    { label: 'Quiz Questions', value: quizzes.reduce((acc, quiz) => acc + (quiz?.questions?.length ?? 0), 0).toString(), change: 'Active pool' },
    { label: 'Gallery Pool', value: adminMedia.length.toString(), change: `${adminMedia.filter(m => m.isFeatured).length}/8 Published` },
  ];

  const deleteArticle = async (id: string) => {
    if (confirm("Delete this article?")) await deleteDocument('articles', id);
  };
  const deleteQuiz = async (id: string) => {
    if (confirm("Delete this quiz?")) await deleteDocument('quizzes', id);
  };
  const deleteMember = async (id: string) => {
    if (confirm("Remove this member?")) await deleteDocument('members', id);
  };

  const inputStyle = {
    padding: '0.7rem 1rem', background: 'rgba(15, 22, 40, 0.5)', border: '1px solid var(--border-subtle)',
    borderRadius: '6px', color: 'var(--text-primary)', fontSize: '0.9rem', fontFamily: 'inherit', width: '100%'
  };

  const rowStyle = {
    padding: '1rem 1.5rem', background: 'rgba(15, 22, 40, 0.3)', borderRadius: '8px',
    display: 'flex' as const, justifyContent: 'space-between' as const, alignItems: 'center' as const, flexWrap: 'wrap' as const, gap: '0.5rem'
  };

  // Auth Gate
  if (loading) {
    return <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}><p style={{ color: "var(--gold)" }}>Verifying credentials...</p></div>;
  }

  if (!user) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh", flexDirection: "column" }}>
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} style={{ background: "rgba(12, 18, 34, 0.6)", padding: "3rem", borderRadius: "16px", border: "1px solid rgba(239, 68, 68, 0.3)", textAlign: "center", maxWidth: "400px" }}>
          <div style={{ color: "#ef4444", fontSize: "3rem", marginBottom: "1rem" }}>🔒</div>
          <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem", color: "var(--text-primary)" }}>Restricted Area</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "2rem", lineHeight: 1.6 }}>You must be authenticated to access the administrative control panel.</p>
          
          {authError && (
            <div style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.3)", padding: "0.8rem", borderRadius: "8px", color: "#ef4444", fontSize: "0.85rem", marginBottom: "1.5rem" }}>
              ⚠️ {authError}
            </div>
          )}

          <button onClick={signInWithGoogle} className="btn-primary" style={{ width: "100%", padding: "0.8rem", fontSize: "1rem", cursor: "pointer", fontFamily: 'inherit' }}>Sign in with Google</button>
        </motion.div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh", flexDirection: "column" }}>
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} style={{ background: "rgba(12, 18, 34, 0.6)", padding: "3rem", borderRadius: "16px", border: "1px solid rgba(239, 68, 68, 0.3)", textAlign: "center", maxWidth: "400px" }}>
          <div style={{ color: "#ef4444", fontSize: "3rem", marginBottom: "1rem" }}>⛔</div>
          <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem", color: "var(--text-primary)" }}>Permission Denied</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "1rem", lineHeight: 1.6 }}>Your account (<strong>{user.email}</strong>) does not have administrative privileges.</p>
          <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginBottom: "2rem" }}>Please contact the club president if you believe this is an error.</p>
          <button onClick={logout} className="btn-secondary" style={{ width: "100%", padding: "0.8rem", fontSize: "1rem", cursor: "pointer", fontFamily: 'inherit' }}>Sign Out & Try Another Account</button>
        </motion.div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 60px)' }}>
      {/* Sidebar */}
      <aside style={{ width: '220px', background: 'rgba(8, 12, 22, 0.6)', borderRight: '1px solid var(--border-subtle)', padding: '2rem 0', flexShrink: 0 }}>
        <div style={{ padding: '0 1.5rem', marginBottom: '2rem' }}>
          <h3 className="gradient-text" style={{ fontFamily: "'Cinzel', serif", fontSize: '1rem', letterSpacing: '0.08em' }}>Admin Panel</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginTop: '0.3rem' }}>Manage everything</p>
        </div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setShowForm(false); }}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '0.7rem 1.5rem',
                background: activeTab === tab.id ? 'rgba(201, 168, 76, 0.08)' : 'transparent',
                border: 'none', borderLeft: activeTab === tab.id ? '2px solid var(--gold)' : '2px solid transparent',
                color: activeTab === tab.id ? 'var(--gold-light)' : 'var(--text-secondary)',
                cursor: 'pointer', fontSize: '0.85rem', fontFamily: 'inherit', textAlign: 'left' as const, transition: 'all 0.2s ease', width: '100%'
              }}
            >
              <span>{tab.icon}</span> {tab.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <div style={{ flex: 1, padding: '2rem 3rem', maxWidth: '900px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.6rem', color: "var(--text-primary)" }}>Admin Dashboard</h2>
          <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
            <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: "bold" }}>{user.email}</span>
            <button onClick={logout} className="btn-secondary" style={{ padding: "0.4rem 1rem", fontSize: "0.8rem", background: "transparent", color: "#ef4444", border: "1px solid rgba(239, 68, 68, 0.4)", cursor: "pointer", fontFamily: "inherit" }}>Sign Out</button>
          </div>
        </div>

        {/* ===== OVERVIEW ===== */}
        {activeTab === 'overview' && (
          <>
            <h2 style={{ fontSize: '1.6rem', marginBottom: '0.3rem' }}>Dashboard Overview</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontWeight: 300, fontSize: '0.9rem' }}>Welcome back, Admin. Here&apos;s what&apos;s happening.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2.5rem' }}>
              {stats.map((stat) => (
                <div key={stat.label} className="feature-card" style={{ textAlign: 'left', padding: '1.3rem' }}>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.4rem' }}>{stat.label}</p>
                  <h3 style={{ fontSize: '1.8rem', marginBottom: '0.2rem', color: 'var(--gold-light)' }}>{stat.value}</h3>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>{stat.change}</span>
                </div>
              ))}
            </div>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Quick Actions</h3>
            <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
              <button className="btn-primary" style={{ fontFamily: 'inherit', cursor: 'pointer', fontSize: '0.8rem' }} onClick={() => { setActiveTab('events'); setShowForm(true); }}>+ New Event</button>
              <button className="btn-secondary" style={{ fontFamily: 'inherit', cursor: 'pointer', fontSize: '0.8rem' }} onClick={() => { setActiveTab('articles'); setShowForm(true); }}>+ New Article</button>
              <button className="btn-secondary" style={{ fontFamily: 'inherit', cursor: 'pointer', fontSize: '0.8rem' }} onClick={() => { setActiveTab('quizzes'); setShowForm(true); }}>+ New Quiz</button>
              <button className="btn-secondary" style={{ fontFamily: 'inherit', cursor: 'pointer', fontSize: '0.8rem' }} onClick={() => { setActiveTab('members'); setShowForm(true); }}>+ Add Member</button>
            </div>
          </>
        )}

        {/* ===== EVENTS MANAGER ===== */}
        {activeTab === 'events' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.4rem' }}>Manage Events</h2>
              <button className="btn-primary" style={{ fontFamily: 'inherit', cursor: 'pointer', fontSize: '0.8rem' }} onClick={() => { setShowForm(!showForm); setEditingEvent(null); }}>
                {showForm ? 'Cancel' : '+ Create Event'}
              </button>
            </div>
            {showForm && (
              <div style={{ padding: '1.5rem', background: 'rgba(15, 22, 40, 0.4)', borderRadius: '8px', border: '1px solid var(--border-subtle)', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--gold)' }}>
                  {editingEvent ? 'Edit Event' : 'New Event'}
                </h3>
                <div id="event-form" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', marginBottom: '1rem' }}>
                  <input name="title" placeholder="Event Title" defaultValue={editingEvent?.title || ''} style={inputStyle} />
                  <input name="description" placeholder="Short Description" defaultValue={editingEvent?.description || ''} style={inputStyle} />
                  <input name="date" placeholder="ISO Date (e.g. 2026-04-15T22:00:00+05:30)" defaultValue={editingEvent?.date || ''} style={inputStyle} />
                  <input name="location" placeholder="Location" defaultValue={editingEvent?.location || ''} style={inputStyle} />
                  <input name="type" placeholder="Type (e.g., Workshop, Stargazing)" defaultValue={editingEvent?.type || ''} style={inputStyle} />
                  <input name="registrationLink" placeholder="Registration Link (optional)" defaultValue={editingEvent?.registrationLink || ''} style={inputStyle} />
                  <input name="bannerImage" placeholder="Banner Image URL" defaultValue={editingEvent?.bannerImage || ''} style={{ ...inputStyle, gridColumn: '1 / -1' }} />
                  <textarea name="fullDescription" placeholder="Full Description" defaultValue={editingEvent?.fullDescription || ''} rows={3} style={{ ...inputStyle, gridColumn: '1 / -1', resize: 'vertical' }} />
                </div>
                
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                    <input name="isPublished" type="checkbox" defaultChecked={editingEvent ? editingEvent.isPublished : true} /> 
                    Publish publicly
                  </label>
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button 
                    className="btn-primary" 
                    disabled={isSavingSettings}
                    style={{ fontFamily: 'inherit', cursor: 'pointer', fontSize: '0.8rem', opacity: isSavingSettings ? 0.7 : 1 }} 
                    onClick={() => handleSaveDocument('events', editingEvent, () => {
                      const container = document.getElementById('event-form');
                      if (!container) return null;
                      const inputs = container.querySelectorAll('input, textarea, select');
                      const data: any = {};
                      inputs.forEach((i: any) => {
                        if (i.type === 'checkbox') data[i.name] = i.checked;
                        else if (i.name) data[i.name] = i.value;
                      });
                      return data;
                    })}
                  >
                    {isSavingSettings ? 'Saving...' : (editingEvent ? 'Update Event' : 'Create Event')}
                  </button>
                  {editingEvent && (
                    <button className="btn-secondary" style={{ fontFamily: 'inherit', cursor: 'pointer', fontSize: '0.8rem', background: 'transparent' }} onClick={() => { setEditingEvent(null); setShowForm(false); }}>
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            )}
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {adminEvents.map((evt) => {
                const isUpcoming = new Date(evt.date) >= new Date();
                return (
                  <div key={evt.id} style={{ ...rowStyle, padding: '1.2rem', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '0.4rem' }}>
                        <h4 style={{ fontSize: '1.05rem' }}>{evt.title}</h4>
                        {!evt.isPublished && <span style={{ fontSize: '0.65rem', background: '#333', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>DRAFT</span>}
                      </div>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.8rem' }}>{evt.date} · {evt.location}</p>
                      
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span style={{ 
                          fontSize: '0.7rem', padding: '0.2rem 0.6rem', borderRadius: '12px', 
                          background: isUpcoming ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.05)', 
                          color: isUpcoming ? '#22c55e' : 'var(--text-muted)' 
                        }}>
                          {isUpcoming ? "UPCOMING" : "PAST / COMPLETED"}
                        </span>
                        <span style={{ fontSize: '0.7rem', padding: '0.2rem 0.6rem', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}>
                          {evt.type}
                        </span>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>
                      <button 
                        onClick={() => { setEditingEvent(evt); setShowForm(true); window.scrollTo(0,0); }}
                        style={{ background: 'none', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '0.3rem 0.6rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontFamily: 'inherit', minWidth: '80px' }}
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDeleteEvent(evt.id)}
                        style={{ background: 'none', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', padding: '0.3rem 0.6rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontFamily: 'inherit', minWidth: '80px' }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
              {adminEvents.length === 0 && (
                <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No events found in database.</p>
              )}
            </div>
          </>
        )}

        {/* ===== OBSERVATIONS MANAGER ===== */}
        {activeTab === 'observations' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h2 style={{ fontSize: '1.4rem' }}>Moderation & Observations</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Review member submissions before they appear publicly.</p>
              </div>
              <button className="btn-primary" style={{ fontFamily: 'inherit', cursor: 'pointer', fontSize: '0.8rem' }} onClick={() => { setShowForm(!showForm); setEditingObservation(null); }}>
                {showForm ? 'Cancel' : '+ New Observation'}
              </button>
            </div>
            {showForm && (
              <div style={{ padding: '1.5rem', background: 'rgba(15, 22, 40, 0.4)', borderRadius: '8px', border: '1px solid var(--border-subtle)', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--gold)' }}>
                  {editingObservation ? 'Edit Observation' : 'New Observation'}
                </h3>
                <div id="observation-form" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', marginBottom: '1rem' }}>
                  <input name="title" placeholder="Title" defaultValue={editingObservation?.title || ''} style={inputStyle} />
                  <select name="category" defaultValue={editingObservation?.category || 'deep_sky'} style={{ ...inputStyle, cursor: 'pointer', appearance: 'none' }}>
                    <option value="moon">Moon</option>
                    <option value="planet">Planet</option>
                    <option value="deep_sky">Deep Sky</option>
                  </select>
                  <input name="date" placeholder="ISO Date (e.g. 2026-03-20T...)" defaultValue={editingObservation?.date || ''} style={inputStyle} />
                  <input name="location" placeholder="Location" defaultValue={editingObservation?.location || ''} style={inputStyle} />
                  <input name="observerName" placeholder="Observer Name" defaultValue={editingObservation?.observerName || ''} style={inputStyle} />
                  <input name="equipment" placeholder="Equipment" defaultValue={editingObservation?.equipment || ''} style={inputStyle} />
                  <input name="imageUrl" placeholder="Image URL (Required)" defaultValue={editingObservation?.images?.[0] || ''} style={{ ...inputStyle, gridColumn: '1 / -1' }} />
                  <textarea name="notes" placeholder="Notes / Description" defaultValue={editingObservation?.notes || ''} rows={3} style={{ ...inputStyle, gridColumn: '1 / -1', resize: 'vertical' }} />
                </div>
                
                <h4 style={{ fontSize: '1rem', marginBottom: '1rem', marginTop: "1.5rem" }}>Technical Settings</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.8rem', marginBottom: '1rem' }}>
                   <input name="exposure" placeholder="Exposure" defaultValue={editingObservation?.settings?.exposure || ''} style={inputStyle} />
                   <input name="iso" placeholder="ISO/Gain" defaultValue={editingObservation?.settings?.iso || ''} style={inputStyle} />
                   <input name="focalLength" placeholder="Focal Length" defaultValue={editingObservation?.settings?.focalLength || ''} style={inputStyle} />
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer', color: editingObservation?.isApproved ? '#22c55e' : '#fb923c' }}>
                    <input name="isApproved" type="checkbox" defaultChecked={editingObservation ? editingObservation.isApproved : true} /> 
                    {editingObservation?.isApproved ? 'Approved & Published' : 'PENDING APPROVAL'}
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer', marginLeft: "1rem" }}>
                    <input name="isFeatured" type="checkbox" defaultChecked={editingObservation ? editingObservation.isFeatured : false} /> 
                    Set as &quot;Observation of the Week&quot;
                  </label>
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button 
                    className="btn-primary" 
                    disabled={isSavingSettings}
                    style={{ fontFamily: 'inherit', cursor: 'pointer', fontSize: '0.8rem', opacity: isSavingSettings ? 0.7 : 1 }} 
                    onClick={() => handleSaveDocument('observations', editingObservation, () => {
                      const container = document.getElementById('observation-form');
                      if (!container) return null;
                      const inputs = container.querySelectorAll('input, textarea, select');
                      const data: any = { settings: {}, images: [] };
                      inputs.forEach((i: any) => {
                        if (i.type === 'checkbox') data[i.name] = i.checked;
                        else if (['exposure', 'iso', 'focalLength'].includes(i.name)) data.settings[i.name] = i.value;
                        else if (i.name === 'imageUrl') data.images = [i.value];
                        else if (i.name) data[i.name] = i.value;
                      });
                      return data;
                    })}
                  >
                    {isSavingSettings ? 'Saving...' : (editingObservation ? 'Update Observation' : 'Create Observation')}
                  </button>
                  {editingObservation && (
                    <button className="btn-secondary" style={{ fontFamily: 'inherit', cursor: 'pointer', fontSize: '0.8rem', background: 'transparent' }} onClick={() => { setEditingObservation(null); setShowForm(false); }}>
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            )}
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {adminObservations.map((obs) => {
                return (
                  <div key={obs.id} style={{ ...rowStyle, padding: '1.2rem', alignItems: 'flex-start', borderLeft: obs.isApproved ? "none" : "3px solid #fb923c" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '0.4rem' }}>
                        <h4 style={{ fontSize: '1.05rem' }}>{obs.title}</h4>
                        {!obs.isApproved && <span style={{ fontSize: '0.65rem', background: '#fb923c20', color: '#fb923c', padding: '0.2rem 0.5rem', borderRadius: '4px', border: "1px solid #fb923c40", fontWeight: "bold" }}>REQUIRES APPROVAL</span>}
                        {obs.isFeatured && <span style={{ fontSize: '0.65rem', background: 'var(--gold)', color: '#000', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 'bold' }}>FEATURED</span>}
                      </div>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.8rem' }}>by {obs.observerName} · {new Date(obs.date).toLocaleDateString()}</p>
                      
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.7rem', padding: '0.2rem 0.6rem', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', textTransform: "capitalize" }}>
                          {obs.category.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>
                      {!obs.isApproved && (
                        <button 
                         onClick={async () => { await updateDocument('observations', obs.id, { isApproved: true }); }}
                         style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid #22c55e', color: '#22c55e', padding: '0.3rem 0.6rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontFamily: 'inherit', minWidth: '80px', fontWeight: "bold" }}
                        >
                          ✓ Approve
                        </button>
                      )}
                      <button 
                        onClick={() => { setEditingObservation(obs); setShowForm(true); window.scrollTo(0,0); }}
                        style={{ background: 'none', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '0.3rem 0.6rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontFamily: 'inherit', minWidth: '80px' }}
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDeleteObservation(obs.id)}
                        style={{ background: 'none', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', padding: '0.3rem 0.6rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontFamily: 'inherit', minWidth: '80px' }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
              {adminObservations.length === 0 && (
                <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No observations found.</p>
              )}
            </div>
          </>
        )}

        {/* ===== OUTREACH MANAGER ===== */}
        {activeTab === 'outreach' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h2 style={{ fontSize: '1.4rem' }}>Outreach & Impact Logs</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Review community impact logs drafted by members.</p>
              </div>
              <button className="btn-primary" style={{ fontFamily: 'inherit', cursor: 'pointer', fontSize: '0.8rem' }} onClick={() => { setShowForm(!showForm); setEditingOutreach(null); }}>
                {showForm ? 'Cancel' : '+ New Outreach Log'}
              </button>
            </div>
            {showForm && (
              <div style={{ padding: '1.5rem', background: 'rgba(15, 22, 40, 0.4)', borderRadius: '8px', border: '1px solid var(--border-subtle)', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--gold)' }}>
                  {editingOutreach ? 'Edit Outreach Log' : 'New Outreach Log'}
                </h3>
                <div id="outreach-form" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', marginBottom: '1rem' }}>
                  <input name="title" placeholder="Initiative Title" defaultValue={editingOutreach?.title || ''} style={inputStyle} />
                  <select name="type" defaultValue={editingOutreach?.type || 'school'} style={{ ...inputStyle, cursor: 'pointer', appearance: 'none' }}>
                    <option value="school">School Visit</option>
                    <option value="public">Public Telescope Event</option>
                    <option value="workshop">Workshop</option>
                    <option value="ngo">NGO / Orphanage</option>
                  </select>
                  <input name="date" placeholder="ISO Date (e.g. 2026-03-20T...)" defaultValue={editingOutreach?.date || ''} style={inputStyle} />
                  <input name="location" placeholder="Location" defaultValue={editingOutreach?.location || ''} style={inputStyle} />
                  <input name="imageUrl" placeholder="Image URL (Required Proof)" defaultValue={editingOutreach?.images?.[0] || ''} style={{ ...inputStyle, gridColumn: '1 / -1' }} />
                  <textarea name="description" placeholder="Event Description / Outcome" defaultValue={editingOutreach?.description || ''} rows={3} style={{ ...inputStyle, gridColumn: '1 / -1', resize: 'vertical' }} />
                </div>
                
                <h4 style={{ fontSize: '1rem', marginBottom: '1rem', marginTop: "1.5rem" }}>Impact Statistics</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.8rem', marginBottom: '1rem' }}>
                   <div>
                     <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>People Reached</label>
                     <input name="peopleReached" type="number" placeholder="150" defaultValue={editingOutreach?.stats?.peopleReached || ''} style={inputStyle} />
                   </div>
                   <div>
                     <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Duration</label>
                     <input name="duration" type="text" placeholder="e.g. 3 hours" defaultValue={editingOutreach?.stats?.duration || ''} style={inputStyle} />
                   </div>
                   <div>
                     <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Team Size</label>
                     <input name="teamSize" type="number" placeholder="5" defaultValue={editingOutreach?.stats?.teamSize || ''} style={inputStyle} />
                   </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer', color: editingOutreach?.isApproved ? '#22c55e' : '#fb923c' }}>
                    <input name="isApproved" type="checkbox" defaultChecked={editingOutreach ? editingOutreach.isApproved : true} /> 
                    {editingOutreach?.isApproved ? 'Approved & Public' : 'PENDING APPROVAL'}
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer', marginLeft: "1rem" }}>
                    <input name="isFeatured" type="checkbox" defaultChecked={editingOutreach ? editingOutreach.isFeatured : false} /> 
                    Highlight on System (Featured)
                  </label>
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button 
                    className="btn-primary" 
                    disabled={isSavingSettings}
                    style={{ fontFamily: 'inherit', cursor: 'pointer', fontSize: '0.8rem', opacity: isSavingSettings ? 0.7 : 1 }} 
                    onClick={() => handleSaveDocument('outreach', editingOutreach, () => {
                      const container = document.getElementById('outreach-form');
                      if (!container) return null;
                      const inputs = container.querySelectorAll('input, textarea, select');
                      const data: any = { stats: {}, images: [] };
                      inputs.forEach((i: any) => {
                        if (i.type === 'checkbox') data[i.name] = i.checked;
                        else if (['peopleReached', 'duration', 'teamSize'].includes(i.name)) data.stats[i.name] = i.value;
                        else if (i.name === 'imageUrl') data.images = [i.value];
                        else if (i.name) data[i.name] = i.value;
                      });
                      return data;
                    })}
                  >
                    {isSavingSettings ? 'Saving...' : (editingOutreach ? 'Update Log' : 'Create Log')}
                  </button>
                  {editingOutreach && (
                    <button className="btn-secondary" style={{ fontFamily: 'inherit', cursor: 'pointer', fontSize: '0.8rem', background: 'transparent' }} onClick={() => { setEditingOutreach(null); setShowForm(false); }}>
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            )}
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {adminOutreach.map((out) => {
                return (
                  <div key={out.id} style={{ ...rowStyle, padding: '1.2rem', alignItems: 'flex-start', borderLeft: out.isApproved ? "none" : "3px solid #fb923c" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '0.4rem' }}>
                        <h4 style={{ fontSize: '1.05rem' }}>{out.title}</h4>
                        {!out.isApproved && <span style={{ fontSize: '0.65rem', background: '#fb923c20', color: '#fb923c', padding: '0.2rem 0.5rem', borderRadius: '4px', border: "1px solid #fb923c40", fontWeight: "bold" }}>REQUIRES APPROVAL</span>}
                        {out.isFeatured && <span style={{ fontSize: '0.65rem', background: 'var(--gold)', color: '#000', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 'bold' }}>FEATURED</span>}
                      </div>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.8rem' }}>{new Date(out.date).toLocaleDateString()} · {out.location}</p>
                      
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.7rem', padding: '0.2rem 0.6rem', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', textTransform: "capitalize" }}>
                          {out.type.replace('_', ' ')}
                        </span>
                        <span style={{ fontSize: '0.7rem', padding: '0.2rem 0.6rem', borderRadius: '12px', background: 'rgba(201,168,76,0.1)', color: 'var(--gold-light)' }}>
                          {out.stats.peopleReached} Reached
                        </span>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>
                      {!out.isApproved && (
                        <button 
                         onClick={async () => { await updateDocument('outreach', out.id, { isApproved: true }); }}
                         style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid #22c55e', color: '#22c55e', padding: '0.3rem 0.6rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontFamily: 'inherit', minWidth: '80px', fontWeight: "bold" }}
                        >
                          ✓ Approve
                        </button>
                      )}
                      <button 
                        onClick={() => { setEditingOutreach(out); setShowForm(true); window.scrollTo(0,0); }}
                        style={{ background: 'none', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '0.3rem 0.6rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontFamily: 'inherit', minWidth: '80px' }}
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDeleteOutreach(out.id)}
                        style={{ background: 'none', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', padding: '0.3rem 0.6rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontFamily: 'inherit', minWidth: '80px' }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
              {adminOutreach.length === 0 && (
                <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No outreach logs found.</p>
              )}
            </div>
          </>
        )}

        {/* ===== ARTICLES MANAGER ===== */}
        {activeTab === 'articles' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h2 style={{ fontSize: '1.4rem' }}>Articles & Knowledge Base</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Manage educational posts and the Daily Fact.</p>
              </div>
              <button className="btn-primary" style={{ fontFamily: 'inherit', cursor: 'pointer', fontSize: '0.8rem' }} onClick={() => { setShowForm(!showForm); setEditingEducation(null); }}>
                {showForm ? 'Cancel' : '+ New Article'}
              </button>
            </div>
            
            {/* Daily Fact Manager */}
            {!showForm && (
              <div style={{ background: "linear-gradient(135deg, rgba(201, 168, 76, 0.1), rgba(12, 18, 34, 0.4))", border: "1px solid var(--gold-dark)", borderRadius: "8px", padding: "1.5rem", marginBottom: "2rem" }}>
                <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem', color: "var(--gold)" }}>Daily Astronomy Fact</h3>
                <div style={{ display: "flex", gap: "1rem" }}>
                   <input value={dailyFact} onChange={(e) => setDailyFact(e.target.value)} style={{ ...inputStyle, flex: 1, background: "rgba(0,0,0,0.4)" }} />
                   <button 
                     className="btn-secondary" 
                     style={{ padding: "0 1.5rem", fontSize: "0.8rem" }}
                     onClick={async () => {
                       if (siteSettings) {
                         await updateSiteSettings({...siteSettings, dailyFact: { ...siteSettings.dailyFact, text: dailyFact }});
                         alert("Daily fact updated!");
                       }
                     }}
                   >
                     Update
                   </button>
                </div>
              </div>
            )}

            {showForm && (
              <div style={{ padding: '1.5rem', background: 'rgba(15, 22, 40, 0.4)', borderRadius: '8px', border: '1px solid var(--border-subtle)', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--gold)' }}>
                  {editingEducation ? 'Edit Article' : 'New Article'}
                </h3>
                <div id="article-form" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', marginBottom: '1rem' }}>
                  <input name="title" placeholder="Article title" defaultValue={editingEducation?.title || ''} style={inputStyle} />
                  <select name="category" defaultValue={editingEducation?.category || 'article'} style={{ ...inputStyle, cursor: 'pointer', appearance: 'none' }}>
                    <option value="article">Article</option>
                    <option value="guide">Guide</option>
                    <option value="news">News</option>
                  </select>
                  <input name="author" placeholder="Author Name" defaultValue={editingEducation?.author || ''} style={inputStyle} />
                  <input name="coverImage" placeholder="Cover Image URL" defaultValue={editingEducation?.coverImage || ''} style={inputStyle} />
                  <textarea name="excerpt" placeholder="Short Excerpt..." defaultValue={editingEducation?.excerpt || ''} rows={2} style={{ ...inputStyle, gridColumn: '1 / -1', resize: 'vertical' }} />
                  <textarea name="content" placeholder="Markdown Content..." defaultValue={editingEducation?.content || ''} rows={5} style={{ ...inputStyle, gridColumn: '1 / -1', resize: 'vertical' }} />
                </div>
                
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                    <input name="isPublished" type="checkbox" defaultChecked={editingEducation ? editingEducation.isPublished : true} /> Publish publicly
                  </label>
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button 
                    className="btn-primary" 
                    disabled={isSavingSettings}
                    style={{ fontFamily: 'inherit', cursor: 'pointer', fontSize: '0.8rem', opacity: isSavingSettings ? 0.7 : 1 }} 
                    onClick={() => handleSaveDocument('articles', editingEducation, () => {
                      const container = document.getElementById('article-form');
                      if (!container) return null;
                      const inputs = container.querySelectorAll('input, textarea, select');
                      const data: any = { date: new Date().toISOString() };
                      inputs.forEach((i: any) => {
                        if (i.type === 'checkbox') data[i.name] = i.checked;
                        else if (i.name) data[i.name] = i.value;
                      });
                      return data;
                    })}
                  >
                    {isSavingSettings ? 'Saving...' : (editingEducation ? 'Update Article' : 'Create Article')}
                  </button>
                  {editingEducation && (
                    <button className="btn-secondary" style={{ fontFamily: 'inherit', cursor: 'pointer', fontSize: '0.8rem', background: 'transparent' }} onClick={() => { setEditingEducation(null); setShowForm(false); }}>Cancel</button>
                  )}
                </div>
              </div>
            )}
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {adminEducation.map((art) => (
                <div key={art.id} style={{ ...rowStyle, padding: '1.2rem', alignItems: 'center' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", gap: "0.8rem", alignItems: "center" }}>
                      <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--gold)', fontWeight: 600 }}>{art.category}</span>
                    </div>
                    <h4 style={{ fontSize: '1.05rem', marginTop: '0.3rem', marginBottom: '0.3rem' }}>{art.title}</h4>
                    <p style={{ fontSize: '0.8rem', color: "var(--text-secondary)" }}>{art.date} · By {art.author}</p>
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.7rem', padding: '0.2rem 0.6rem', borderRadius: '12px', background: art.isPublished ? 'rgba(34,197,94,0.15)' : 'rgba(245,158,11,0.15)', color: art.isPublished ? '#22c55e' : '#f59e0b', fontWeight: "bold" }}>
                      {art.isPublished ? 'PUBLISHED' : 'DRAFT'}
                    </span>
                    <button 
                      onClick={() => { setEditingEducation(art); setShowForm(true); window.scrollTo(0,0); }}
                      style={{ background: 'none', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '0.3rem 0.6rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontFamily: 'inherit', minWidth: '80px' }}
                    >
                      Edit
                    </button>
                    <button onClick={() => deleteArticle(art.id)} style={{ background: 'none', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', padding: '0.3rem 0.6rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontFamily: 'inherit', minWidth: '80px' }}>Delete</button>
                  </div>
                </div>
              ))}
              {adminEducation.length === 0 && (
                <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No articles found.</p>
              )}
            </div>
          </>
        )}

        {/* ===== PROJECTS MANAGER ===== */}
        {activeTab === 'projects' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.4rem' }}>Manage Projects</h2>
              <button 
                className="btn-primary" 
                style={{ fontFamily: 'inherit', cursor: 'pointer', fontSize: '0.8rem' }} 
                onClick={() => { setShowForm(!showForm); setEditingProject(null); }}
              >
                {showForm ? 'Cancel' : '+ Create Project'}
              </button>
            </div>

            {showForm && (
              <div style={{ padding: '1.5rem', background: 'rgba(15, 22, 40, 0.4)', borderRadius: '8px', border: '1px solid var(--border-subtle)', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--gold)' }}>
                  {editingProject ? 'Edit Project' : 'New Project'}
                </h3>
                <div id="project-form" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', marginBottom: '1rem' }}>
                  <input name="title" placeholder="Project Title" defaultValue={editingProject?.title || ''} style={inputStyle} />
                  <select name="status" defaultValue={editingProject?.status || 'Planning'} style={{ ...inputStyle, cursor: 'pointer', appearance: 'none' }}>
                    <option value="Planned">Planned</option>
                    <option value="Ongoing">Ongoing</option>
                    <option value="Completed">Completed</option>
                  </select>
                  <input name="description" placeholder="Short Description" defaultValue={editingProject?.description || ''} style={{ ...inputStyle, gridColumn: '1 / -1' }} />
                  <textarea name="fullDescription" placeholder="Full Description / Objective" defaultValue={editingProject?.fullDescription || ''} rows={3} style={{ ...inputStyle, gridColumn: '1 / -1', resize: 'vertical' }} />
                  <input name="tags" placeholder="Comma-separated Tags (e.g. Rocketry, Optics)" defaultValue={editingProject?.tags?.join(', ') || ''} style={inputStyle} />
                  <input name="coverImage" placeholder="Cover Image URL" defaultValue={editingProject?.coverImage || ''} style={inputStyle} />
                </div>
                
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                    <input name="isPublished" type="checkbox" defaultChecked={editingProject ? editingProject.isPublished : true} /> Publish publicly
                  </label>
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button 
                    className="btn-primary" 
                    disabled={isSavingSettings}
                    style={{ fontFamily: 'inherit', cursor: 'pointer', fontSize: '0.8rem', opacity: isSavingSettings ? 0.7 : 1 }} 
                    onClick={() => handleSaveDocument('projects', editingProject, () => {
                      const container = document.getElementById('project-form');
                      if (!container) return null;
                      const inputs = container.querySelectorAll('input, textarea, select');
                      const data: any = { team: [], updates: [] };
                      inputs.forEach((i: any) => {
                        if (i.type === 'checkbox') data[i.name] = i.checked;
                        else if (i.name === 'tags') data.tags = i.value.split(',').map((s: string) => s.trim()).filter(Boolean);
                        else if (i.name) data[i.name] = i.value;
                      });
                      return data;
                    })}
                  >
                    {isSavingSettings ? 'Saving...' : (editingProject ? 'Update Project' : 'Create Project')}
                  </button>
                  {editingProject && (
                    <button className="btn-secondary" style={{ fontFamily: 'inherit', cursor: 'pointer', fontSize: '0.8rem', background: 'transparent' }} onClick={() => { setEditingProject(null); setShowForm(false); }}>
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {adminProjects.map((p) => (
                <div key={p.id} style={{ ...rowStyle, padding: '1.2rem', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '0.4rem' }}>
                      <h4 style={{ fontSize: '1.05rem' }}>{p.title}</h4>
                      {!p.isPublished && <span style={{ fontSize: '0.65rem', background: '#333', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>DRAFT</span>}
                      {p.isFeatured && <span style={{ fontSize: '0.65rem', background: 'var(--gold)', color: '#000', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 'bold' }}>FEATURED</span>}
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.8rem', maxWidth: '600px' }}>{p.description}</p>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.7rem', padding: '0.2rem 0.6rem', borderRadius: '12px', background: 'rgba(34,197,94,0.15)', color: '#22c55e' }}>{p.status}</span>
                      <span style={{ fontSize: '0.7rem', padding: '0.2rem 0.6rem', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}>{p.team.length} Team Members</span>
                      <span style={{ fontSize: '0.7rem', padding: '0.2rem 0.6rem', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}>{p.updates.length} Logs</span>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>
                    <button 
                      onClick={() => handleToggleProjectFeature(p.id, p.isFeatured)}
                      style={{ background: 'none', border: '1px solid var(--gold)', color: 'var(--gold)', padding: '0.3rem 0.6rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontFamily: 'inherit', minWidth: '100px' }}
                    >
                      {p.isFeatured ? '★ Unfeature' : '☆ Make Featured'}
                    </button>
                    <button 
                      onClick={() => { setEditingProject(p); setShowForm(true); window.scrollTo(0,0); }}
                      style={{ background: 'none', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '0.3rem 0.6rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontFamily: 'inherit', minWidth: '100px' }}
                    >
                      Edit Content
                    </button>
                    <button 
                      onClick={() => handleDeleteProject(p.id)}
                      style={{ background: 'none', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', padding: '0.3rem 0.6rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontFamily: 'inherit', minWidth: '100px' }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
              {adminProjects.length === 0 && (
                <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No projects found in database.</p>
              )}
            </div>
          </>
        )}

        {/* ===== QUIZZES MANAGER ===== */}
        {activeTab === 'quizzes' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h2 style={{ fontSize: '1.4rem' }}>Quizzes Manager</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Manage quizzes for public and members.</p>
              </div>
              <button className="btn-primary" style={{ fontFamily: 'inherit', cursor: 'pointer', fontSize: '0.8rem' }} onClick={() => { setShowForm(!showForm); setEditingQuiz(null); }}>
                {showForm ? 'Cancel' : '+ New Quiz'}
              </button>
            </div>
            {showForm && (
              <div style={{ padding: '1.5rem', background: 'rgba(15, 22, 40, 0.4)', borderRadius: '8px', border: '1px solid var(--border-subtle)', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--gold)' }}>
                  {editingQuiz ? 'Edit Quiz' : 'New Quiz'}
                </h3>
                <div id="quiz-form" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', marginBottom: '1rem' }}>
                  <input name="title" placeholder="Quiz Title" defaultValue={editingQuiz?.title || ''} style={inputStyle} />
                  <select name="difficulty" defaultValue={editingQuiz?.difficulty || 'Medium'} style={{ ...inputStyle, cursor: 'pointer', appearance: 'none' }}>
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                  <input name="description" placeholder="Description" defaultValue={editingQuiz?.description || ''} style={{ ...inputStyle, gridColumn: '1 / -1' }} />
                </div>
                
                <div style={{ marginBottom: '1.5rem', background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px', border: '1px dashed var(--border-subtle)' }}>
                  <h4 style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.9rem' }}>Questions Data (JSON Format)</h4>
                  <textarea 
                    id="quiz-questions-json"
                    placeholder='[{"id": 1, "text": "Question?", "options": ["A", "B"], "correct": 0}]' 
                    defaultValue={JSON.stringify(editingQuiz?.questions || [], null, 2)} 
                    rows={8} 
                    style={{ ...inputStyle, fontFamily: 'monospace', fontSize: '0.8rem' }} 
                  />
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Edit the raw JSON above to manage questions and options.</p>
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button className="btn-primary" style={{ fontFamily: 'inherit', cursor: 'pointer', fontSize: '0.8rem' }} onClick={async () => {
                    const titleInput = document.querySelector('input[name="title"]') as HTMLInputElement;
                    const descInput = document.querySelector('input[name="description"]') as HTMLInputElement;
                    const diffSelect = document.querySelector('select[name="difficulty"]') as HTMLSelectElement;
                    const jsonInput = document.querySelector('#quiz-questions-json') as HTMLTextAreaElement;
                    
                    if (!titleInput.value) {
                      alert("Title is required.");
                      return;
                    }

                    let questions = [];
                    try {
                      questions = JSON.parse(jsonInput.value);
                    } catch {
                      alert("Invalid JSON in questions data.");
                      return;
                    }

                    const data = {
                      title: titleInput.value,
                      description: descInput.value,
                      difficulty: diffSelect.value,
                      questions
                    };

                    try {
                      if (editingQuiz) {
                        await updateDocument('quizzes', editingQuiz.id, data);
                      } else {
                        await addDocument('quizzes', data);
                      }
                      setShowForm(false);
                      setEditingQuiz(null);
                    } catch(err) {
                      console.error(err);
                      alert("Failed to save quiz");
                    }
                  }}>{editingQuiz ? 'Save Changes' : 'Create Quiz'}</button>
                </div>
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {quizzes.map((quiz) => (
                <div key={quiz.id} style={{...rowStyle, padding: '1.2rem', alignItems: 'center'}}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", gap: "0.8rem", alignItems: "center" }}>
                      <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: quiz.difficulty === 'Easy' ? '#22c55e' : quiz.difficulty === 'Medium' ? '#f59e0b' : '#ef4444', fontWeight: 600 }}>{quiz.difficulty}</span>
                    </div>
                    <h4 style={{ fontSize: '1.05rem', marginTop: '0.3rem', marginBottom: '0.3rem' }}>{quiz.title}</h4>
                    <p style={{ fontSize: '0.8rem', color: "var(--text-secondary)", marginBottom: '0.4rem' }}>{quiz.description}</p>
                    <span style={{ fontSize: '0.7rem', color: "var(--text-muted)" }}>{quiz?.questions?.length ?? 0} Questions</span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
                    <button onClick={() => { setEditingQuiz(quiz); setShowForm(true); }} style={{ background: 'none', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '0.3rem 0.6rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontFamily: 'inherit' }}>Edit</button>
                    <button onClick={() => deleteQuiz(quiz.id)} style={{ background: 'none', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', padding: '0.3rem 0.6rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontFamily: 'inherit' }}>Delete</button>
                  </div>
                </div>
              ))}
              {quizzes.length === 0 && (
                <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No quizzes found.</p>
              )}
            </div>
          </>
        )}

        {/* ===== GALLERY / MEDIA MANAGER ===== */}
        {activeTab === 'gallery' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h2 style={{ fontSize: '1.4rem' }}>Media Gallery Manager</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Strictly curated visual proof. Only 8 high-quality images map to the frontend.</p>
              </div>
              <button 
                className="btn-primary" 
                style={{ fontFamily: 'inherit', cursor: 'pointer', fontSize: '0.8rem' }} 
                onClick={() => { setShowForm(!showForm); setEditingMedia(null); }}
              >
                {showForm ? 'Cancel' : '+ Upload Media'}
              </button>
            </div>

            {showForm && (
              <div style={{ padding: '1.5rem', background: 'rgba(15, 22, 40, 0.4)', borderRadius: '8px', border: '1px solid var(--border-subtle)', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--gold)' }}>
                  {editingMedia ? 'Edit Media Entry' : 'New Media Entry'}
                </h3>
                <div id="media-form" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.8rem', marginBottom: '1rem' }}>
                  <input name="imageUrl" placeholder="High-Resolution Image URL" defaultValue={editingMedia?.imageUrl || ''} style={inputStyle} />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                    <select name="category" defaultValue={editingMedia?.category || 'event'} style={{ ...inputStyle, cursor: 'pointer', appearance: 'none' }}>
                      <option value="project">Project / Milestone</option>
                      <option value="event">Public Event</option>
                      <option value="observation">Observation Capture</option>
                    </select>
                    <input name="author" type="text" placeholder="Photographer / Contributor Name" defaultValue={editingMedia?.author || ''} style={inputStyle} />
                  </div>
                  <textarea name="caption" placeholder="Optional context caption..." defaultValue={editingMedia?.caption || ''} rows={2} style={{ ...inputStyle, resize: 'vertical' }} />
                </div>
                
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer', color: editingMedia?.isFeatured ? '#22c55e' : '#a3a3a3' }}>
                    <input name="isFeatured" type="checkbox" defaultChecked={editingMedia ? editingMedia.isFeatured : false} /> 
                    {editingMedia?.isFeatured ? '✓ Active on Light-Grid' : 'Send to Light-Grid (Featured Limit: 8)'}
                  </label>
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button 
                    className="btn-primary" 
                    disabled={isSavingSettings}
                    style={{ fontFamily: 'inherit', cursor: 'pointer', fontSize: '0.8rem', opacity: isSavingSettings ? 0.7 : 1 }} 
                    onClick={() => handleSaveDocument('media', editingMedia, () => {
                      const container = document.getElementById('media-form');
                      if (!container) return null;
                      const inputs = container.querySelectorAll('input, textarea, select');
                      const data: any = { createdAt: new Date().toISOString() };
                      inputs.forEach((i: any) => {
                        if (i.type === 'checkbox') data[i.name] = i.checked;
                        else if (i.name) data[i.name] = i.value;
                      });
                      return data;
                    })}
                  >
                    {isSavingSettings ? 'Saving...' : (editingMedia ? 'Update Media' : 'Upload Media')}
                  </button>
                  {editingMedia && (
                    <button className="btn-secondary" style={{ fontFamily: 'inherit', cursor: 'pointer', fontSize: '0.8rem', background: 'transparent' }} onClick={() => { setEditingMedia(null); setShowForm(false); }}>
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            )}
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {adminMedia.map((med) => {
                return (
                  <div key={med.id} style={{ ...rowStyle, padding: '1.2rem', alignItems: 'flex-start', borderLeft: med.isFeatured ? "3px solid #34d399" : "3px solid transparent" }}>
                    <div style={{ width: "100px", height: "70px", borderRadius: "6px", overflow: "hidden", border: "1px solid var(--border-subtle)", marginRight: "1rem" }}>
                       {/* eslint-disable-next-line @next/next/no-img-element */}
                       <img src={med.imageUrl} alt="thumbnail" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '0.4rem' }}>
                        <h4 style={{ fontSize: '0.95rem', color: "var(--text-secondary)", fontStyle: med.caption ? "normal" : "italic" }}>
                          {med.caption ? `"${med.caption.slice(0, 60)}${med.caption.length > 60 ? '...' : ''}"` : "No caption provided"}
                        </h4>
                        {med.isFeatured && <span style={{ fontSize: '0.65rem', background: 'rgba(52,211,153,0.1)', color: '#34d399', padding: '0.2rem 0.5rem', borderRadius: '4px', border: "1px solid rgba(52,211,153,0.4)", fontWeight: "bold" }}>ON GRID</span>}
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: "0.5rem" }}>
                        <span style={{ fontSize: '0.65rem', padding: '0.2rem 0.6rem', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', textTransform: "uppercase", fontWeight: "bold" }}>
                          {med.category}
                        </span>
                        <span style={{ fontSize: '0.65rem', padding: '0.2rem 0.6rem', color: 'var(--text-muted)' }}>
                          by {med.author} · {new Date(med.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end', marginLeft: "1rem" }}>
                      <button 
                        onClick={async () => { await updateDocument('media', med.id, { isFeatured: !med.isFeatured }); }}
                        style={{ background: 'none', border: `1px solid ${med.isFeatured ? "#a3a3a3" : "#34d399"}`, color: med.isFeatured ? "#a3a3a3" : "#34d399", padding: '0.3rem 0.6rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontFamily: 'inherit', minWidth: '80px' }}
                      >
                        {med.isFeatured ? 'Remove' : 'Pin to Grid'}
                      </button>
                      <button 
                        onClick={() => { setEditingMedia(med); setShowForm(true); window.scrollTo(0,0); }}
                        style={{ background: 'none', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '0.3rem 0.6rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontFamily: 'inherit', minWidth: '80px' }}
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDeleteMedia(med.id)}
                        style={{ background: 'none', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', padding: '0.3rem 0.6rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontFamily: 'inherit', minWidth: '80px' }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
              {adminMedia.length === 0 && (
                <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No media files uploaded yet.</p>
              )}
            </div>
          </>
        )}

        {/* ===== ACHIEVEMENTS MANAGER ===== */}
        {activeTab === 'achievements' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h2 style={{ fontSize: '1.4rem' }}>Achievements</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Showcase club milestones and awards.</p>
              </div>
              <button className="btn-primary" style={{ fontFamily: 'inherit', cursor: 'pointer', fontSize: '0.8rem' }} onClick={() => { setShowForm(!showForm); setEditingAchievement(null); }}>
                {showForm ? 'Cancel' : '+ Add Achievement'}
              </button>
            </div>
            {showForm && (
              <div style={{ padding: '1.5rem', background: 'rgba(15, 22, 40, 0.4)', borderRadius: '8px', border: '1px solid var(--border-subtle)', marginBottom: '1.5rem' }}>
                <div id="achievement-form" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', marginBottom: '1rem' }}>
                  <input name="title" placeholder="Title" defaultValue={editingAchievement?.title || ''} style={inputStyle} />
                  <input name="year" placeholder="Year" defaultValue={editingAchievement?.year || ''} style={inputStyle} />
                  <input name="imageUrl" placeholder="Image URL" defaultValue={editingAchievement?.imageUrl || ''} style={{ ...inputStyle, gridColumn: '1 / -1' }} />
                  <textarea name="description" placeholder="Description" defaultValue={editingAchievement?.description || ''} rows={3} style={{ ...inputStyle, gridColumn: '1 / -1', resize: 'vertical' }} />
                </div>
                <button 
                  className="btn-primary" 
                  style={{ fontFamily: 'inherit', cursor: 'pointer', fontSize: '0.8rem' }} 
                  onClick={() => handleSaveDocument('achievements', editingAchievement, () => {
                    const container = document.getElementById('achievement-form');
                    if (!container) return null;
                    const inputs = container.querySelectorAll('input, textarea');
                    const data: any = {};
                    inputs.forEach((i: any) => { if (i.name) data[i.name] = i.value; });
                    return data;
                  })}
                >
                  {editingAchievement ? 'Update' : 'Add Achievement'}
                </button>
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {achievements.map((a: any) => (
                <div key={a.id} style={rowStyle}>
                  <div>
                    <h4 style={{ fontSize: '0.95rem' }}>{a.title} ({a.year})</h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{a.description}</p>
                  </div>
                  <button onClick={() => deleteDocument('achievements', a.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.8rem', fontFamily: 'inherit' }}>Delete</button>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ===== SITE SETTINGS ===== */}
        {activeTab === 'settings' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <div>
                <h2 style={{ fontSize: '1.4rem' }}>Global Site Settings</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Control recruitment, home page stats, and daily facts.</p>
              </div>
              <button 
                className="btn-primary" 
                disabled={isSavingSettings}
                style={{ fontFamily: 'inherit', cursor: 'pointer', fontSize: '0.8rem', opacity: isSavingSettings ? 0.7 : 1 }} 
                onClick={handleSaveSettings}
              >
                {isSavingSettings ? 'Saving...' : 'Save All Settings'}
              </button>
            </div>

            <div style={{ display: 'grid', gap: '2rem' }}>
              {/* Recruitment Toggle */}
              <div style={{ background: 'rgba(15, 22, 40, 0.4)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '0.3rem' }}>Recruitment Status</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Toggle the &ldquo;Join Club&rdquo; functionality on/off.</p>
                  </div>
                  <button 
                    onClick={() => setSiteSettings(s => s ? {...s, isRecruiting: !s.isRecruiting} : null)}
                    style={{ 
                      padding: '0.6rem 1.5rem', borderRadius: '20px', fontSize: '0.85rem', cursor: 'pointer',
                      background: siteSettings?.isRecruiting ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                      border: `1px solid ${siteSettings?.isRecruiting ? '#22c55e' : '#ef4444'}`,
                      color: siteSettings?.isRecruiting ? '#4ade80' : '#f87171',
                      fontWeight: 600, transition: 'all 0.2s'
                    }}
                  >
                    {siteSettings?.isRecruiting ? 'OPEN' : 'CLOSED'}
                  </button>
                </div>
              </div>

              {/* Home Page Stats */}
              <div style={{ background: 'rgba(15, 22, 40, 0.4)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '1.2rem' }}>Home Page Stats (Counters)</h3>
                {siteSettings && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0.8rem' }}>
                    <div>
                      <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Members</label>
                      <input type="number" value={siteSettings.heroStats.members} onChange={(e) => setSiteSettings({...siteSettings, heroStats: {...siteSettings.heroStats, members: parseInt(e.target.value)}})} style={inputStyle} />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Projects</label>
                      <input type="number" value={siteSettings.heroStats.projects} onChange={(e) => setSiteSettings({...siteSettings, heroStats: {...siteSettings.heroStats, projects: parseInt(e.target.value)}})} style={inputStyle} />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Events</label>
                      <input type="number" value={siteSettings.heroStats.events} onChange={(e) => setSiteSettings({...siteSettings, heroStats: {...siteSettings.heroStats, events: parseInt(e.target.value)}})} style={inputStyle} />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Impact</label>
                      <input type="number" value={siteSettings.heroStats.impact} onChange={(e) => setSiteSettings({...siteSettings, heroStats: {...siteSettings.heroStats, impact: parseInt(e.target.value)}})} style={inputStyle} />
                    </div>
                  </div>
                )}
              </div>

              {/* Daily Fact */}
              <div style={{ background: 'rgba(15, 22, 40, 0.4)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '1.2rem' }}>Astronomy Fact of the Day</h3>
                <textarea 
                  rows={3} 
                  value={siteSettings?.dailyFact.text || ''} 
                  onChange={e => setSiteSettings(s => s ? {...s, dailyFact: {...s.dailyFact, text: e.target.value}} : null)}
                  placeholder="The universe is expanding..." 
                  style={{ ...inputStyle, resize: 'vertical', marginBottom: '1rem' }} 
                />
                <input 
                  placeholder="Source (e.g. NASA Science)" 
                  value={siteSettings?.dailyFact.source || ''} 
                  onChange={e => setSiteSettings(s => s ? {...s, dailyFact: {...s.dailyFact, source: e.target.value}} : null)}
                  style={inputStyle} 
                />
              </div>

              {/* Feature Highlights */}
              <div style={{ background: 'rgba(15, 22, 40, 0.4)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '1.2rem' }}>Featured ID Overrides</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>Enter specific IDs to force highlight items on the home page (Leave empty for auto-latest).</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <input 
                    placeholder="Featured Project ID" 
                    value={siteSettings?.featuredProjectId || ''} 
                    onChange={e => setSiteSettings(s => s ? {...s, featuredProjectId: e.target.value} : null)}
                    style={inputStyle} 
                  />
                  <input 
                    placeholder="Featured Event ID" 
                    value={siteSettings?.featuredEventId || ''} 
                    onChange={e => setSiteSettings(s => s ? {...s, featuredEventId: e.target.value} : null)}
                    style={inputStyle} 
                  />
                </div>
              </div>
            </div>
          </>
        )}

        {/* ===== MEMBERS MANAGER ===== */}
        {activeTab === 'members' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.4rem' }}>{editingMember ? 'Edit Member' : 'Manage Members'}</h2>
              <button className="btn-primary" style={{ fontFamily: 'inherit', cursor: 'pointer', fontSize: '0.8rem' }} onClick={() => { setShowForm(!showForm); setFormData({}); setEditingMember(null); }}>
                {showForm ? 'Cancel' : '+ Add Member'}
              </button>
            </div>
            {showForm && (
              <div style={{ padding: '1.5rem', background: 'rgba(15, 22, 40, 0.4)', borderRadius: '8px', border: '1px solid var(--border-subtle)', marginBottom: '1.5rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.8rem', marginBottom: '1rem' }}>
                  <input placeholder="Name" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} style={inputStyle} />
                  <input placeholder="Role" value={formData.role || ''} onChange={e => setFormData({...formData, role: e.target.value})} style={inputStyle} />
                  <input placeholder="Department" value={formData.dept || ''} onChange={e => setFormData({...formData, dept: e.target.value})} style={inputStyle} />
                  <input placeholder="Image URL (Unsplash or similar)" value={formData.imageUrl || ''} onChange={e => setFormData({...formData, imageUrl: e.target.value})} style={{ ...inputStyle, gridColumn: '1 / -1' }} />
                  <textarea placeholder="Short Bio" value={formData.bio || ''} onChange={e => setFormData({...formData, bio: e.target.value})} style={{ ...inputStyle, gridColumn: '1 / -1', resize: 'vertical' }} />
                </div>
                <button className="btn-primary" style={{ fontFamily: 'inherit', cursor: 'pointer', fontSize: '0.8rem' }} onClick={async () => {
                  if (!formData.name) return;
                  if (editingMember) {
                    await updateDocument('members', editingMember.id, {
                      name: formData.name, 
                      role: formData.role || "Member", 
                      dept: formData.dept || "",
                      imageUrl: formData.imageUrl || "https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?w=200&q=80",
                      bio: formData.bio || "Stargazer and dreamer."
                    });
                  } else {
                    await addDocument('members', { 
                      name: formData.name, 
                      role: formData.role || "Member", 
                      dept: formData.dept || "",
                      imageUrl: formData.imageUrl || "https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?w=200&q=80",
                      bio: formData.bio || "Stargazer and dreamer."
                    });
                  }
                  setFormData({}); setShowForm(false); setEditingMember(null);
                }}>{editingMember ? 'Save Changes' : 'Add Member'}</button>
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {members.map((m: any) => (
                <div key={m.id} style={rowStyle}>
                  <div>
                    <h4 style={{ fontSize: '0.95rem' }}>{m.name}</h4>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{m.role} · {m.dept}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => {
                       setEditingMember(m);
                       setFormData({ name: m.name, role: m.role, dept: m.dept, imageUrl: m.imageUrl, bio: m.bio });
                       setShowForm(true);
                    }} style={{ background: 'none', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '0.3rem 0.6rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontFamily: 'inherit' }}>Edit</button>
                    <button onClick={() => deleteMember(m.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.8rem', fontFamily: 'inherit' }}>Remove</button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
        {/* ===== NIGHT SKY MANAGER ===== */}
        {activeTab === 'night-sky' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h2 style={{ fontSize: '1.4rem' }}>Night Sky Data Manager</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Manage the current moon phase, visible planets, and celestial events via JSON configuration.</p>
              </div>
            </div>
            
            <div style={{ padding: '1.5rem', background: 'rgba(15, 22, 40, 0.4)', borderRadius: '8px', border: '1px solid var(--border-subtle)', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--gold)' }}>Current Configuration</h3>
              <textarea 
                key={siteSettings ? "night-sky-loaded" : "night-sky-pending"}
                id="night-sky-json"
                defaultValue={JSON.stringify(siteSettings?.nightSky ?? MOCK_NIGHT_SKY, null, 2)}
                rows={20}
                style={{ ...inputStyle, fontFamily: 'monospace', fontSize: '0.8rem', resize: 'vertical' }}
              />
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.8rem', marginBottom: '1.5rem' }}>
                Paste the updated Night Sky JSON configuration here. Make sure it matches the required schema.
              </p>
              
              <button 
                className="btn-primary" 
                style={{ fontFamily: 'inherit', cursor: 'pointer', fontSize: '0.8rem' }}
                onClick={async () => {
                   const jsonInput = document.querySelector('#night-sky-json') as HTMLTextAreaElement;
                   let data;
                   try {
                     data = JSON.parse(jsonInput.value);
                   } catch {
                     alert("Invalid JSON format");
                     return;
                   }
                   try {
                     await updateSiteSettings({ nightSky: data });
                     setSiteSettings((s) => (s ? { ...s, nightSky: data } : s));
                     alert("Night sky updated successfully!");
                   } catch {
                     alert("Failed to update night sky data.");
                   }
                }}
              >
                Save Night Sky Configuration
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
