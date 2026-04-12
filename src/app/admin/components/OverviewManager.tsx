"use client";

import { useState, useEffect } from 'react';
import { subscribeToCollection } from '@/lib/db';
import ApprovalsPanel from './ApprovalsPanel';
import { useAuth } from '@/context/AuthContext';
import { ADMIN_PAGE_PERMISSIONS } from '@/lib/admin-access';
import { StatsCard, StatsGrid, SectionHeader } from '@/components/ui';

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
  const [articleHighlights, setArticleHighlights] = useState(0);
  const [observationHighlights, setObservationHighlights] = useState(0);
  const [eventHighlights, setEventHighlights] = useState(0);
  const [projectHighlights, setProjectHighlights] = useState(0);

  useEffect(() => {
    const unsubEvents = subscribeToCollection('events', (data) => setEventsCount(data.length));
    const unsubMembers = subscribeToCollection('members', (data) => setMembersCount(data.length));
    const unsubObs = subscribeToCollection('observations', (data) => setObsCount(data.length));
    const unsubOutreach = subscribeToCollection('outreach', (data) => setOutreachCount(data.length));
    const unsubQuizzes = subscribeToCollection('quizzes', (data) => {
      const totalQ = data.reduce((acc: number, quiz: any) => acc + (quiz?.questions?.length || 0), 0);
      setQuizQuestionsCount(totalQ);
    });
    const unsubArticles = subscribeToCollection('articles', (data) => setArticleHighlights(data.filter((item: any) => item.isHighlighted).length));
    const unsubObservations = subscribeToCollection('observations', (data) => setObservationHighlights(data.filter((item: any) => item.isHighlighted).length));
    const unsubEventsHighlights = subscribeToCollection('events', (data) => setEventHighlights(data.filter((item: any) => item.isHighlighted).length));
    const unsubProjectsHighlights = subscribeToCollection('projects', (data) => setProjectHighlights(data.filter((item: any) => item.isHighlighted).length));

    return () => {
      unsubEvents();
      unsubMembers();
      unsubObs();
      unsubOutreach();
      unsubQuizzes();
      unsubArticles();
      unsubObservations();
      unsubEventsHighlights();
      unsubProjectsHighlights();
    };
  }, []);

  const highlightTotal = articleHighlights + observationHighlights + eventHighlights + projectHighlights;

  const stats = [
    { label: 'Total Members', value: membersCount.toString(), change: 'Directory' },
    { label: 'Events This Month', value: eventsCount.toString(), change: `${eventsCount} scheduled` },
    { label: 'Observations', value: obsCount.toString(), change: 'Archive' },
    { label: 'Outreach Impacts', value: outreachCount.toString(), change: 'Global logs' },
    { label: 'Quiz Questions', value: quizQuestionsCount.toString(), change: 'Active pool' },
    { label: 'Highlights', value: highlightTotal.toString(), change: 'Cross-content picks' },
  ];

  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      <SectionHeader
        title="Dashboard Overview"
        subtitle={`Welcome back, ${roleName || 'member'}. Here\u2019s what\u2019s happening.`}
      />
      
      <StatsGrid>
        {stats.map((stat) => (
          <StatsCard key={stat.label} label={stat.label} value={stat.value} detail={stat.change} />
        ))}
      </StatsGrid>

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
