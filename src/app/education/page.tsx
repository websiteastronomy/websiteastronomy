"use client";

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import AnimatedSection from '@/components/AnimatedSection';
import AnimatedCard from '@/components/AnimatedCard';
import { loadSiteSettingsClient } from '@/data/siteSettingsStatic';
import { subscribeToCollection, addDocument } from '@/lib/db';

export default function EducationHub() {
  const [articles, setArticles] = useState<any[]>([]);
  const [siteSettings, setSiteSettings] = useState(() => loadSiteSettingsClient());
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | 'article' | 'guide' | 'fact'>('all');
  const [showMemberUpload, setShowMemberUpload] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const unsubArticles = subscribeToCollection('articles', (data) => setArticles(data));
    return () => unsubArticles();
  }, []);

  // Filtered List
  const filteredPosts = useMemo(() => {
    return articles.filter(post => {
      // 1. Must be published
      if (!post.isPublished) return false;
      // 2. Search match
      const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            (post.excerpt?.toLowerCase() || "").includes(searchQuery.toLowerCase());
      // 3. Category match
      const matchesCategory = activeCategory === 'all' || post.category === activeCategory;
      
      return matchesSearch && matchesCategory;
    }).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [searchQuery, activeCategory, articles]);

  const latestArticles = filteredPosts.filter(p => p.category === 'article').slice(0, 6);
  const beginnerGuides = filteredPosts.filter(p => p.category === 'guide' || p.tags.includes('Beginner'));

  // If user is actively filtering, just show a flat grid
  const isFiltering = searchQuery.trim() !== '' || activeCategory !== 'all';

  return (
    <div className="page-container">
      {/* HEADER */}
      <AnimatedSection>
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <p className="section-title">Knowledge Base</p>
          <h1 className="page-title"><span className="gradient-text">Education Hub</span></h1>
          <p style={{ color: "var(--text-secondary)", maxWidth: "600px", margin: "0 auto", fontSize: "1.1rem" }}>
            Explore the cosmos through our curated guides, latest astronomical discoveries, and deep-dive physics articles.
          </p>
        </div>
      </AnimatedSection>

      {/* SECTION 1: DAILY FACT */}
      {!isFiltering && (
        <AnimatedSection delay={0.1}>
          <div style={{ background: "linear-gradient(135deg, rgba(201, 168, 76, 0.1), rgba(12, 18, 34, 0.4))", border: "1px solid var(--gold-dark)", borderRadius: "16px", padding: "2rem", marginBottom: "4rem", textAlign: "center", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: -20, left: -20, opacity: 0.05, fontSize: "10rem", pointerEvents: "none" }}>☄️</div>
            <h3 style={{ color: "var(--gold)", fontSize: "0.9rem", textTransform: "uppercase", letterSpacing: "0.2em", marginBottom: "1rem" }}>Daily Fact</h3>
            <p style={{ fontSize: "1.4rem", color: "var(--text-primary)", fontWeight: 300, maxWidth: "800px", margin: "0 auto", lineHeight: 1.6 }}>
              &ldquo;{siteSettings?.dailyFact?.text || "The universe is filled with wonders yet to be discovered."}&rdquo;
            </p>
          </div>
        </AnimatedSection>
      )}

      {/* CONTROLS (Search + Filter + Member Upload) */}
      <AnimatedSection delay={0.2} style={{ marginBottom: '3rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(15, 22, 40, 0.4)', padding: '1rem 1.5rem', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
          {/* Filter Pills */}
          <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
            {['all', 'article', 'guide', 'fact'].map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat as any)}
                style={{
                  background: activeCategory === cat ? 'var(--gold)' : 'transparent',
                  color: activeCategory === cat ? '#000' : 'var(--text-primary)',
                  border: `1px solid ${activeCategory === cat ? 'var(--gold)' : 'var(--border-subtle)'}`,
                  padding: '0.5rem 1.2rem', borderRadius: '20px', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.9rem', transition: 'all 0.3s ease', textTransform: 'capitalize', fontWeight: activeCategory === cat ? 600 : 400
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '1rem', flex: '1 1 300px' }}>
            {/* Search Bar */}
            <div style={{ flex: 1, position: 'relative' }}>
              <input
                type="text"
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: '100%', padding: '0.7rem 1rem 0.7rem 2.5rem', background: 'rgba(8, 12, 22, 0.6)', border: '1px solid var(--border-subtle)', borderRadius: '8px', color: 'var(--text-primary)', fontFamily: 'inherit', outline: 'none' }}
              />
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            </div>
            {/* Write Article CTA */}
            <button onClick={() => setShowMemberUpload(true)} className="btn-primary" style={{ padding: '0.7rem 1.2rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
              Create Post
            </button>
          </div>
        </div>
      </AnimatedSection>

      {/* FILTERED VIEW */}
      {isFiltering ? (
        <AnimatedSection delay={0.3}>
          {filteredPosts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 0' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem' }}>No articles match your criteria.</p>
              <button onClick={() => { setSearchQuery(''); setActiveCategory('all'); }} className="btn-secondary" style={{ marginTop: '1rem', cursor: 'pointer' }}>Clear Filters</button>
            </div>
          ) : (
            <div className="grid">
              {filteredPosts.map((post, i) => (
                <PostCard key={post.id} post={post} index={i} />
              ))}
            </div>
          )}
        </AnimatedSection>
      ) : (
        /* STANDARD VIEW */
        <>
          {/* SECTION 2: LATEST ARTICLES */}
          <AnimatedSection delay={0.3} style={{ marginBottom: "5rem" }}>
            <h2 style={{ fontSize: "1.8rem", marginBottom: "2rem", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "0.5rem" }}>Latest Articles</h2>
            {latestArticles.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>Content coming soon.</p>
            ) : (
              <div className="grid">
                {latestArticles.map((post, i) => (
                  <PostCard key={post.id} post={post} index={i} />
                ))}
              </div>
            )}
          </AnimatedSection>

          {/* SECTION 3: BEGINNER GUIDES */}
          <AnimatedSection delay={0.4} style={{ marginBottom: "5rem" }}>
            <h2 style={{ fontSize: "1.8rem", marginBottom: "2rem", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "0.5rem" }}>Beginner Guides</h2>
            {beginnerGuides.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>Guides coming soon.</p>
            ) : (
              <div className="grid">
                {beginnerGuides.map((post, i) => (
                  <PostCard key={post.id} post={post} index={i} />
                ))}
              </div>
            )}
          </AnimatedSection>
        </>
      )}

      {/* === MEMBER DRAFT UPLOAD MODAL === */}
      <AnimatePresence>
        {showMemberUpload && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(5, 8, 15, 0.9)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
            onClick={() => setShowMemberUpload(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={e => e.stopPropagation()}
              style={{ background: '#0c1222', border: '1px solid var(--gold-dark)', borderRadius: '12px', padding: '2rem', maxWidth: '600px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}
            >
              <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: 'var(--gold)' }}>Create Education Post</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Draft an article or guide. It will be sent to the Admin queue for review before publishing.</p>
              
                <div id="draft-form" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <input name="title" type="text" placeholder="Title" style={inputStyle} />
                  <select name="category" style={inputStyle}>
                    <option value="article">Article</option>
                    <option value="guide">Guide</option>
                    <option value="fact">Fact</option>
                  </select>
                  <input name="author" type="text" placeholder="Author Name" style={inputStyle} />
                  <input name="coverImage" type="text" placeholder="Cover Image URL" style={inputStyle} />
                  <textarea name="excerpt" placeholder="Short Excerpt (1-2 sentences)" rows={2} style={{ ...inputStyle, resize: 'vertical' }} />
                  <textarea name="content" placeholder="Write your content here (Markdown supported)..." rows={6} style={{ ...inputStyle, resize: 'vertical' }} />
                  
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                    <button 
                      disabled={isSubmitting}
                      onClick={async () => {
                        setIsSubmitting(true);
                        const container = document.getElementById('draft-form');
                        if (!container) return;
                        const inputs = container.querySelectorAll('input, select, textarea');
                        const data: any = { isPublished: false, date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }), tags: [] };
                        inputs.forEach((i: any) => { if (i.name) data[i.name] = i.value; });
                        
                        try {
                          await addDocument('articles', data);
                          alert("Draft submitted successfully! An admin will review it soon.");
                          setShowMemberUpload(false);
                        } catch (e) {
                          alert("Failed to submit draft.");
                        } finally {
                          setIsSubmitting(false);
                        }
                      }} 
                      className="btn-primary" style={{ flex: 1, cursor: 'pointer', fontFamily: 'inherit', opacity: isSubmitting ? 0.7 : 1 }}
                    >
                      {isSubmitting ? 'Submitting...' : 'Submit Draft'}
                    </button>
                    <button onClick={() => setShowMemberUpload(false)} className="btn-secondary" style={{ flex: 1, cursor: 'pointer', fontFamily: 'inherit', background: "transparent" }}>Cancel</button>
                  </div>
                </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const inputStyle = {
  padding: '0.8rem 1rem', background: 'rgba(15, 22, 40, 0.5)', border: '1px solid var(--border-subtle)',
  borderRadius: '6px', color: 'var(--text-primary)', fontSize: '0.9rem', fontFamily: 'inherit', width: '100%'
};

// Reusable Post Card
function PostCard({ post, index }: { post: any, index: number }) {
  return (
    <AnimatedCard index={index}>
      <Link href={`/education/${post.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%', overflow: 'hidden', borderRadius: '8px 8px 0 0' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={post.coverImage} 
            alt={post.title}
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease' }}
            className="hover-scale"
          />
          <div style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', padding: '0.3rem 0.8rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {post.category}
          </div>
        </div>
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', flex: 1, background: 'rgba(15, 22, 40, 0.3)', borderTop: 'none', borderRadius: '0 0 8px 8px' }}>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.8rem', lineHeight: 1.4 }} className="gradient-text">{post.title}</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: 1.5, flex: 1 }}>{post.excerpt}</p>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>{post.author}</span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{post.date}</span>
            </div>
            <span style={{ color: 'var(--gold)', fontSize: '0.85rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              Read More
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
            </span>
          </div>
        </div>
      </Link>
    </AnimatedCard>
  );
}
