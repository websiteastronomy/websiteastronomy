"use client";

import { useState, useEffect } from 'react';
import { subscribeToCollection, addDocument, updateDocument, deleteDocument } from '@/lib/db';
import { inputStyle, rowStyle } from './shared';

export default function AchievementsManager() {
  const [achievements, setAchievements] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingAchievement, setEditingAchievement] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const unsub = subscribeToCollection('achievements', (data) => setAchievements(data));
    return () => unsub();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const container = document.getElementById('achievement-form');
      if (!container) return;
      
      const inputs = container.querySelectorAll('input, textarea');
      const data: any = {};
      
      inputs.forEach((i: any) => {
        if (i.name) data[i.name] = i.value;
      });

      if (!data.title || !data.year) {
        alert("Title and Year are required.");
        setIsSaving(false);
        return;
      }

      if (editingAchievement?.id) {
        await updateDocument('achievements', editingAchievement.id, data);
        alert("Updated successfully!");
      } else {
        await addDocument('achievements', data);
        alert("Created successfully!");
      }
      setShowForm(false);
      setEditingAchievement(null);
    } catch (err) {
      console.error(err);
      alert("Operation failed. Check console.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this achievement?")) {
      await deleteDocument('achievements', id);
    }
  };

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem' }}>Achievements</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Showcase club milestones and awards.</p>
        </div>
        <button 
          className="btn-primary" 
          style={{ fontFamily: 'inherit', cursor: 'pointer', fontSize: '0.8rem' }} 
          onClick={() => { setShowForm(!showForm); setEditingAchievement(null); }}
        >
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
            disabled={isSaving}
            style={{ fontFamily: 'inherit', cursor: 'pointer', fontSize: '0.8rem', opacity: isSaving ? 0.7 : 1 }} 
            onClick={handleSave}
          >
            {isSaving ? 'Saving...' : (editingAchievement ? 'Update' : 'Add Achievement')}
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
            <div style={{ display: 'flex', gap: '0.8rem' }}>
              <button 
                onClick={() => { setEditingAchievement(a); setShowForm(true); window.scrollTo(0,0); }} 
                style={{ background: 'none', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '0.8rem', fontFamily: 'inherit', padding: '0.3rem 0.6rem', borderRadius: '4px' }}
              >
                Edit
              </button>
              <button 
                onClick={() => handleDelete(a.id)} 
                style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.8rem', fontFamily: 'inherit' }}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
        {achievements.length === 0 && (
          <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No achievements found.</p>
        )}
      </div>
    </>
  );
}
