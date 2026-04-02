"use client";

import { useState, useEffect } from 'react';
import { subscribeToCollection, addDocument, updateDocument, deleteDocument } from '@/lib/db';
import { inputStyle, rowStyle } from './shared';

export default function ProjectsManager() {
  const [projects, setProjects] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const unsub = subscribeToCollection('projects', (data) => setProjects(data));
    return () => unsub();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const container = document.getElementById('project-form');
      if (!container) return;
      const inputs = container.querySelectorAll('input, select, textarea');
      const data: any = { team: [], updates: [] };
      inputs.forEach((i: any) => {
        if (i.type === 'checkbox') data[i.name] = i.checked;
        else if (i.name === 'tags') data.tags = i.value.split(',').map((s: string) => s.trim()).filter(Boolean);
        else if (i.name) data[i.name] = i.value;
      });

      if (!data.title || !data.description || !data.coverImage) {
        alert("Please fill out Title, Description, and Cover Image.");
        setIsSaving(false);
        return;
      }

      if (editingProject?.id) {
        await updateDocument('projects', editingProject.id, data);
        alert("Updated successfully!");
      } else {
        await addDocument('projects', data);
        alert("Created successfully!");
      }
      setShowForm(false);
      setEditingProject(null);
    } catch (err) {
      console.error(err);
      alert("Operation failed. Check console.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleProjectFeature = async (id: string, current: boolean) => {
    await updateDocument('projects', id, { isFeatured: !current });
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this project?")) {
      await deleteDocument('projects', id);
    }
  };

  return (
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
            <select name="status" defaultValue={editingProject?.status || 'Planned'} style={{ ...inputStyle, cursor: 'pointer', appearance: 'none' }}>
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
              <input name="isPublished" type="checkbox" defaultChecked={editingProject ? editingProject.isPublished : true} /> 
              Publish publicly
            </label>
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button 
              className="btn-primary" 
              disabled={isSaving}
              style={{ fontFamily: 'inherit', cursor: 'pointer', fontSize: '0.8rem', opacity: isSaving ? 0.7 : 1 }} 
              onClick={handleSave}
            >
              {isSaving ? 'Saving...' : (editingProject ? 'Update Project' : 'Create Project')}
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
        {projects.map((p) => (
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
                <span style={{ fontSize: '0.7rem', padding: '0.2rem 0.6rem', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}>{p.team?.length || 0} Team Members</span>
                <span style={{ fontSize: '0.7rem', padding: '0.2rem 0.6rem', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}>{p.updates?.length || 0} Logs</span>
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
                onClick={() => handleDelete(p.id)}
                style={{ background: 'none', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', padding: '0.3rem 0.6rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontFamily: 'inherit', minWidth: '100px' }}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
        {projects.length === 0 && (
          <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No projects found in database.</p>
        )}
      </div>
    </>
  );
}
