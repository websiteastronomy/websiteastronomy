"use client";

import { useState, useEffect } from 'react';
import { subscribeToCollection } from '@/lib/db';
import ApprovalsPanel from './ApprovalsPanel';
import { useAuth } from '@/context/AuthContext';
import { ADMIN_PAGE_PERMISSIONS } from '@/lib/admin-access';

export default function OverviewManager({ onNavigate }: { onNavigate: (tab: string) => void }) {
  const { user, roleName, isAdmin, hasPermission } = useAuth();
  const access = { isAdmin, hasPermission };
  const canManageProjects = ADMIN_PAGE_PERMISSIONS.projects(access);
  const canApproveActions = ADMIN_PAGE_PERMISSIONS.members(access);
  
  const [membersCount, setMembersCount] = useState(0);
  const [eventsCount, setEventsCount] = useState(0);
  const [obsCount, setObsCount] = useState(0);
  const [outreachCount, setOutreachCount] = useState(0);
  const [quizQuestionsCount, setQuizQuestionsCount] = useState(0);
  const [mediaTotal, setMediaTotal] = useState(0);
  const [mediaFeatured, setMediaFeatured] = useState(0);

  useEffect(() => {
    const unsubEvents = subscribeToCollection('events', (data) => setEventsCount(data.length));
    const unsubMembers = subscribeToCollection('members', (data) => setMembersCount(data.length));
    const unsubObs = subscribeToCollection('observations', (data) => setObsCount(data.length));
    const unsubOutreach = subscribeToCollection('outreach', (data) => setOutreachCount(data.length));
    const unsubQuizzes = subscribeToCollection('quizzes', (data) => {
      const totalQ = data.reduce((acc: number, quiz: any) => acc + (quiz?.questions?.length || 0), 0);
      setQuizQuestionsCount(totalQ);
    });
    const unsubMedia = subscribeToCollection('media', (data) => {
      setMediaTotal(data.length);
      setMediaFeatured(data.filter((m: any) => m.isFeatured).length);
    });

    return () => {
      unsubEvents();
      unsubMembers();
      unsubObs();
      unsubOutreach();
      unsubQuizzes();
      unsubMedia();
    };
  }, []);

  const stats = [
    { label: 'Total Members', value: membersCount.toString(), change: 'Directory' },
    { label: 'Events This Month', value: eventsCount.toString(), change: `${eventsCount} scheduled` },
    { label: 'Observations', value: obsCount.toString(), change: 'Archive' },
    { label: 'Outreach Impacts', value: outreachCount.toString(), change: 'Global logs' },
    { label: 'Quiz Questions', value: quizQuestionsCount.toString(), change: 'Active pool' },
    { label: 'Gallery Pool', value: mediaTotal.toString(), change: `${mediaFeatured}/8 Published` },
  ];

  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      <h2 style={{ fontSize: '1.6rem', marginBottom: '0.3rem' }}>Dashboard Overview</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontWeight: 300, fontSize: '0.9rem' }}>
        Welcome back, {roleName || 'member'}. Here&apos;s what&apos;s happening.
      </p>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2.5rem' }}>
        {stats.map((stat) => (
          <div key={stat.label} className="feature-card" style={{ textAlign: 'left', padding: '1.3rem', background: 'rgba(15, 22, 40, 0.4)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.4rem' }}>{stat.label}</p>
            <h3 style={{ fontSize: '1.8rem', marginBottom: '0.2rem', color: 'var(--gold-light)' }}>{stat.value}</h3>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>{stat.change}</span>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: "2.5rem" }}>
        <ApprovalsPanel userRole={roleName || "Admin"} userId={user?.id || "Unknown"} />
      </div>

      <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Quick Actions</h3>
      <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
        {canManageProjects && (
          <button className="btn-primary" style={{ fontFamily: 'inherit', cursor: 'pointer', fontSize: '0.8rem' }} onClick={() => onNavigate('events')}>
            Manage Events
          </button>
        )}
        {ADMIN_PAGE_PERMISSIONS.articles(access) && (
          <button className="btn-secondary" style={{ fontFamily: 'inherit', cursor: 'pointer', fontSize: '0.8rem' }} onClick={() => onNavigate('articles')}>
            Manage Articles
          </button>
        )}
        {canApproveActions && (
          <button className="btn-secondary" style={{ fontFamily: 'inherit', cursor: 'pointer', fontSize: '0.8rem' }} onClick={() => onNavigate('members')}>
            Manage Members
          </button>
        )}
      </div>
    </div>
  );
}
