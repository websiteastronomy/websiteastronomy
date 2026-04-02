"use client";

import { useState, useEffect } from 'react';
import { subscribeToCollection, addDocument, updateDocument, deleteDocument } from '@/lib/db';
import { inputStyle, rowStyle } from './shared';
import { loadSiteSettingsClient } from '@/data/siteSettingsStatic';
import { writeSiteSettingsLocal } from '@/lib/settingsLocal';

export default function ArticlesManager() {
  const [articles, setArticles] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingArticle, setEditingArticle] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Local state for Daily Fact
  const [dailyFact, setDailyFact] = useState('');
  const [siteSettings, setSiteSettings] = useState<any>(null);

  useEffect(() => {
    const unsub = subscribeToCollection('articles', (data) => setArticles(data));
    const settings = loadSiteSettingsClient();
    if (settings) {
      setSiteSettings(settings);
      setDailyFact(settings.dailyFact?.text || '');
    }
    return () => unsub();
  }, []);

  const handleUpdateFact = () => {
    if (siteSettings) {
      const next = { ...siteSettings, dailyFact: { ...siteSettings.dailyFact, text: dailyFact } };
      setSiteSettings(next);
      writeSiteSettingsLocal(next);
      alert("Daily fact updated (saved in this browser).");
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const container = document.getElementById('article-form');
      if (!container) return;
      const inputs = container.querySelectorAll('input, select, textarea');
      const data: any = {};
      inputs.forEach((i: any) => {
        if (i.type === 'checkbox') data[i.name] = i.checked;
        else if (i.name) data[i.name] = i.value;
      });

      if (!data.title || !data.author || !data.content) {
        alert("Please fill out Title, Author, and Content.");
        setIsSaving(false);
        return;
      }

      // Automatically set the date if not explicitly set
      if (!data.date) {
        data.date = new Date().toISOString();
      }

      if (editingArticle?.id) {
        await updateDocument('articles', editingArticle.id, data);
        alert("Updated successfully!");
      } else {
        await addDocument('articles', data);
        alert("Created successfully!");
      }
      setShowForm(false);
      setEditingArticle(null);
    } catch (err) {
      console.error(err);
      alert("Operation failed. Check console.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this article?")) {
      await deleteDocument('articles', id);
    }
  };

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem' }}>Articles & Knowledge Base</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Manage educational posts and the Daily Fact.</p>
        </div>
        <button className="btn-primary" style={{ fontFamily: 'inherit', cursor: 'pointer', fontSize: '0.8rem' }} onClick={() => { setShowForm(!showForm); setEditingArticle(null); }}>
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
               onClick={handleUpdateFact}
             >
               Update Fact
             </button>
          </div>
        </div>
      )}

      {showForm && (
        <div style={{ padding: '1.5rem', background: 'rgba(15, 22, 40, 0.4)', borderRadius: '8px', border: '1px solid var(--border-subtle)', marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--gold)' }}>
            {editingArticle ? 'Edit Article' : 'New Article'}
          </h3>
          <div id="article-form" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', marginBottom: '1rem' }}>
            <input name="title" placeholder="Article Title" defaultValue={editingArticle?.title || ''} style={inputStyle} />
            <input name="author" placeholder="Author Name" defaultValue={editingArticle?.author || ''} style={inputStyle} />
            <input name="date" placeholder="ISO Date (optional)" defaultValue={editingArticle?.date || ''} style={inputStyle} />
            <select name="category" defaultValue={editingArticle?.category || 'mission'} style={{ ...inputStyle, cursor: 'pointer', appearance: 'none' }}>
              <option value="physics">Physics</option>
              <option value="mission">Mission</option>
              <option value="theory">Theory</option>
              <option value="history">History</option>
              <option value="hardware">Hardware</option>
            </select>
            <input name="imageUrl" placeholder="Cover Image URL" defaultValue={editingArticle?.imageUrl || ''} style={{ ...inputStyle, gridColumn: '1 / -1' }} />
            <textarea name="content" placeholder="Full Article Content (Markdown/HTML supported)" defaultValue={editingArticle?.content || ''} rows={6} style={{ ...inputStyle, gridColumn: '1 / -1', resize: 'vertical' }} />
          </div>
          
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>
              <input name="isPublished" type="checkbox" defaultChecked={editingArticle ? editingArticle.isPublished : true} /> 
              Publish publicly
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer', marginLeft: "1rem" }}>
              <input name="isFeatured" type="checkbox" defaultChecked={editingArticle ? editingArticle.isFeatured : false} /> 
              Featured
            </label>
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button 
              className="btn-primary" 
              disabled={isSaving}
              style={{ fontFamily: 'inherit', cursor: 'pointer', fontSize: '0.8rem', opacity: isSaving ? 0.7 : 1 }} 
              onClick={handleSave}
            >
              {isSaving ? 'Saving...' : (editingArticle ? 'Update Article' : 'Create Article')}
            </button>
            {editingArticle && (
              <button className="btn-secondary" style={{ fontFamily: 'inherit', cursor: 'pointer', fontSize: '0.8rem', background: 'transparent' }} onClick={() => { setEditingArticle(null); setShowForm(false); }}>
                Cancel
              </button>
            )}
          </div>
        </div>
      )}
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        {articles.map((art) => (
          <div key={art.id} style={{ ...rowStyle, padding: '1.2rem', alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", gap: "0.8rem", alignItems: "center" }}>
                <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--gold)', fontWeight: 600 }}>{art.category}</span>
                {art.isFeatured && <span style={{ fontSize: '0.65rem', background: 'var(--gold)', color: '#000', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 'bold' }}>FEATURED</span>}
              </div>
              <h4 style={{ fontSize: '1.05rem', marginTop: '0.3rem', marginBottom: '0.3rem' }}>{art.title}</h4>
              <p style={{ fontSize: '0.8rem', color: "var(--text-secondary)" }}>{art.date} · By {art.author}</p>
            </div>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <span style={{ fontSize: '0.7rem', padding: '0.2rem 0.6rem', borderRadius: '12px', background: art.isPublished ? 'rgba(34,197,94,0.15)' : 'rgba(245,158,11,0.15)', color: art.isPublished ? '#22c55e' : '#f59e0b', fontWeight: "bold" }}>
                {art.isPublished ? 'PUBLISHED' : 'DRAFT'}
              </span>
              <button 
                onClick={() => { setEditingArticle(art); setShowForm(true); window.scrollTo(0,0); }}
                style={{ background: 'none', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '0.3rem 0.6rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontFamily: 'inherit', minWidth: '80px' }}
              >
                Edit
              </button>
              <button onClick={() => handleDelete(art.id)} style={{ background: 'none', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', padding: '0.3rem 0.6rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontFamily: 'inherit', minWidth: '80px' }}>Delete</button>
            </div>
          </div>
        ))}
        {articles.length === 0 && (
          <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No articles found.</p>
        )}
      </div>
    </>
  );
}
