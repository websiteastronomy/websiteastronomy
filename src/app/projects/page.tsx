"use client";

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedSection from '@/components/AnimatedSection';
import { getPublicCollection } from '@/lib/db';

export default function ProjectsList() {
  const [projects, setProjects] = useState<any[]>([]);

  useEffect(() => {
    getPublicCollection('projects')
      .then((data) => setProjects(data))
      .catch((error) => console.error("[ProjectsList] Failed to load projects:", error));
  }, []);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [tagFilter, setTagFilter] = useState("All");

  // Extract unique tags for the filter dropdown
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    projects.forEach(p => p.tags.forEach((t: string) => tags.add(t)));
    return ["All", ...Array.from(tags).sort()];
  }, [projects]);

  // Filter logic
  const filteredProjects = useMemo(() => {
    return projects.filter((proj) => {
      if (!proj.isPublished) return false;
      
      const matchesSearch = proj.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            proj.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === "All" || proj.status === statusFilter;
      const matchesTag = tagFilter === "All" || proj.tags.includes(tagFilter);

      return matchesSearch && matchesStatus && matchesTag;
    });
  }, [projects, searchQuery, statusFilter, tagFilter]);

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Ongoing': return '#22c55e'; // Green
      case 'Completed': return '#3b82f6'; // Blue
      case 'Planned': return '#a855f7'; // Purple
      default: return 'var(--gold)';
    }
  };

  const getStatusBg = (status: string) => {
    switch(status) {
      case 'Ongoing': return 'rgba(34, 197, 94, 0.15)'; 
      case 'Completed': return 'rgba(59, 130, 246, 0.15)'; 
      case 'Planned': return 'rgba(168, 85, 247, 0.15)'; 
      default: return 'rgba(201, 168, 76, 0.15)';
    }
  };

  const inputStyle = {
    padding: '0.8rem 1.2rem',
    background: 'rgba(15, 22, 40, 0.6)',
    border: '1px solid var(--border-subtle)',
    borderRadius: '8px',
    color: 'var(--text-primary)',
    fontSize: '0.9rem',
    fontFamily: "'Space Grotesk', sans-serif",
    outline: 'none',
    transition: 'border-color 0.2s',
  };

  return (
    <div style={{ padding: "4rem 1rem", maxWidth: "1200px", margin: "0 auto", minHeight: "80vh" }}>
      <AnimatedSection>
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <p className="section-title">What We Build</p>
          <h1 className="page-title"><span className="gradient-text">Projects</span></h1>
          <p className="page-subtitle" style={{ maxWidth: "600px", margin: "0 auto" }}>
            Hands-on experiments, research initiatives, and engineering challenges taken on by our members.
          </p>
        </div>
      </AnimatedSection>

      {/* FILTER & SEARCH BAR */}
      <AnimatedSection delay={0.1}>
        <div style={{ 
          display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '3rem', 
          background: 'rgba(15, 22, 40, 0.3)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-subtle)'
        }}>
          {/* Search */}
          <div style={{ flex: '1 1 300px', position: 'relative' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }}>
              <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input 
              type="text" 
              placeholder="Search by title..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ ...inputStyle, width: '100%', paddingLeft: '2.8rem' }}
              onFocus={(e) => (e.target.style.borderColor = "var(--gold)") }
              onBlur={(e) => (e.target.style.borderColor = "var(--border-subtle)") }
            />
          </div>

          {/* Status Filter */}
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ ...inputStyle, flex: '1 1 150px', cursor: 'pointer', appearance: 'none' }}
          >
            <option value="All">All Statuses</option>
            <option value="Ongoing">Ongoing</option>
            <option value="Completed">Completed</option>
            <option value="Planned">Planned</option>
          </select>

          {/* Tag Filter */}
          <select 
            value={tagFilter} 
            onChange={(e) => setTagFilter(e.target.value)}
            style={{ ...inputStyle, flex: '1 1 150px', cursor: 'pointer', appearance: 'none' }}
          >
            {allTags.map(tag => (
              <option key={tag} value={tag}>{tag === "All" ? "All Domains" : tag}</option>
            ))}
          </select>
        </div>
      </AnimatedSection>

      {/* PROJECT GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '2rem' }}>
        <AnimatePresence mode="popLayout">
          {filteredProjects.map((proj, i) => (
            <motion.div
              layout
              key={proj.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              style={{
                background: 'rgba(15, 22, 40, 0.4)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '16px',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              {/* Cover Image */}
              <div style={{ width: '100%', height: '180px', position: 'relative', overflow: 'hidden' }}>
                <img 
                  src={proj.coverImage} 
                  alt={proj.title} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
                {proj.isFeatured && (
                  <div style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'var(--gold)', color: '#000', padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Featured
                  </div>
                )}
              </div>

              {/* Content */}
              <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem', gap: '1rem' }}>
                  <h3 style={{ fontSize: '1.25rem', lineHeight: 1.3 }}>{proj.title}</h3>
                  <span style={{ 
                    color: getStatusColor(proj.status), 
                    background: getStatusBg(proj.status),
                    padding: '0.3rem 0.6rem', 
                    borderRadius: '20px', 
                    fontSize: '0.65rem', 
                    fontWeight: 700, 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.05em',
                    whiteSpace: 'nowrap'
                  }}>
                    {proj.status}
                  </span>
                </div>

                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1.5rem', flex: 1 }}>
                  {proj.description}
                </p>

                {/* Tags */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1.5rem' }}>
                  {proj.tags.map((tag: string) => (
                    <span key={tag} style={{ color: 'var(--text-muted)', fontSize: '0.75rem', background: 'rgba(255,255,255,0.03)', padding: '0.2rem 0.6rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Footer Action */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '1.2rem', borderTop: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {/* Team avatars mock */}
                    <div style={{ display: 'flex' }}>
                       {proj.team.slice(0,3).map((member: any, idx: number) => (
                         <div key={idx} style={{ 
                           width: '24px', height: '24px', borderRadius: '50%', background: 'var(--gold-dark)', 
                           display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.5rem', color: '#000', fontWeight: 'bold', border: '1px solid #141e3c', marginLeft: idx > 0 ? '-8px' : '0' 
                         }}>
                           {member.name.charAt(0)}
                         </div>
                       ))}
                    </div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{proj.team.length} members</span>
                  </div>
                  
                  <Link href={`/projects/${proj.id}`} className="btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}>
                    View Details →
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Empty State */}
        {filteredProjects.length === 0 && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem 2rem', background: 'rgba(15, 22, 40, 0.3)', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}
          >
            <div style={{ fontSize: '3rem', opacity: 0.5, marginBottom: '1rem' }}>🔭</div>
            <h3 style={{ fontSize: '1.3rem', marginBottom: '0.5rem' }}>No projects found</h3>
            <p style={{ color: 'var(--text-muted)' }}>We couldn&apos;t find any projects matching your current filters.</p>
            <button 
              onClick={() => { setSearchQuery(""); setStatusFilter("All"); setTagFilter("All"); }}
              style={{ marginTop: '1.5rem', background: 'transparent', color: 'var(--gold)', border: '1px solid var(--gold)', padding: '0.6rem 1.2rem', borderRadius: '6px', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.85rem' }}
            >
              Clear all filters
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
