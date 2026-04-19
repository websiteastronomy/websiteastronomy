"use client";

import { useState, useEffect } from 'react';
import { subscribeToCollection, addDocument, updateDocument, deleteDocument } from '@/lib/db';
import { inputStyle, rowStyle } from './shared';
import { uploadFileDirect } from '@/lib/direct-upload';

export default function ProjectsManager() {
  const [projects, setProjects] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState<any>({
    title: '', status: 'Planned', description: '', fullDescription: '', tags: '', coverImage: '',
    isPublished: true, isFeatured: false, isHighlighted: false, highlightPriority: 0, githubUrl: '', startDate: '', endDate: '', objective: ''
  });
  const [editTeam, setEditTeam] = useState<{name: string, role: string}[]>([]);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  useEffect(() => {
    const unsubProjects = subscribeToCollection('projects', (data) => setProjects(data));
    const unsubMembers = subscribeToCollection('members', (data) => setMembers(data));
    return () => { unsubProjects(); unsubMembers(); };
  }, []);

  const handleEditClick = (p: any) => {
    setEditingProject(p);
    setFormData({
      title: p.title || '',
      status: p.status || 'Planned',
      description: p.description || '',
      fullDescription: p.fullDescription || '',
      tags: p.tags?.join(', ') || '',
      coverImage: p.coverImage || '',
      isPublished: p.isPublished !== false,
      isFeatured: p.isFeatured || false,
      isHighlighted: p.isHighlighted || false,
      highlightPriority: Number(p.highlightPriority || 0),
      githubUrl: p.githubUrl || '',
      startDate: p.startDate || '',
      endDate: p.endDate || '',
      objective: p.objective || ''
    });
    setEditTeam(p.team || []);
    setShowForm(true);
    window.scrollTo(0,0);
  };

  const handleAddNewClick = () => {
    setEditingProject(null);
    setFormData({
      title: '', status: 'Planned', description: '', fullDescription: '', tags: '', coverImage: '',
      isPublished: true, isFeatured: false, isHighlighted: false, highlightPriority: 0, githubUrl: '', startDate: '', endDate: '', objective: ''
    });
    setEditTeam([]);
    setShowForm(!showForm);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setFeedback(null);
    try {
      const fileInput = document.getElementById('coverImageFile') as HTMLInputElement;
      const file = fileInput?.files?.[0];

      let finalImageUrl = formData.coverImage;

      if (file) {
        try {
           const uploadResult = await uploadFileDirect(file, {
             category: "projects",
             entityId: editingProject?.id || "new-project",
             isPublic: true,
             fileName: file.name,
             fileType: file.type || "application/octet-stream",
             fileSize: file.size,
           });
           finalImageUrl = uploadResult.fileUrl;
        } catch(e: any) {
           setFeedback({ type: 'error', message: 'Upload Failed: ' + e.message });
           setIsSaving(false);
           return;
        }
      }

      if (!formData.title || !formData.description || !finalImageUrl) {
        setFeedback({ type: 'error', message: 'Please fill out Title, Description, and Cover Image.' });
        setIsSaving(false);
        return;
      }

      const data = {
        ...formData,
        coverImage: finalImageUrl,
        tags: formData.tags.split(',').map((s: string) => s.trim()).filter(Boolean),
        team: editTeam
      };
      if (data.isHighlighted) {
        const highlightedCount = projects.filter((project) => project.isHighlighted).length;
        const isAlreadyHighlighted = Boolean(editingProject?.isHighlighted);
        if (!isAlreadyHighlighted && highlightedCount >= 10) {
          setFeedback({ type: 'error', message: 'Soft limit reached: keep highlighted projects within 10.' });
          setIsSaving(false);
          return;
        }
      }

      if (editingProject?.id) {
        data.updates = editingProject.updates || []; // preserve updates
        await updateDocument('projects', editingProject.id, data);
        setFeedback({ type: 'success', message: 'Updated successfully!' });
      } else {
        data.updates = [];
        await addDocument('projects', data);
        setFeedback({ type: 'success', message: 'Created successfully!' });
      }
      setShowForm(false);
      setEditingProject(null);
    } catch (err) {
      console.error(err);
      setFeedback({ type: 'error', message: 'Operation failed. Check console.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleProjectHighlight = async (id: string, current: boolean, priority: number) => {
    if (!current && projects.filter((project) => project.isHighlighted).length >= 10) {
      setFeedback({ type: 'error', message: 'Soft limit reached: keep highlighted projects within 10.' });
      return;
    }
    await updateDocument('projects', id, { isHighlighted: !current, highlightPriority: Number(priority) || 0 });
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDocument('projects', id);
      setFeedback({ type: 'success', message: 'Project deleted.' });
      setPendingDeleteId(null);
    } catch (err) {
      console.error(err);
      setFeedback({ type: 'error', message: 'Delete failed. Check console.' });
    }
  };

  const handleAddTeamMember = () => {
    setEditTeam([...editTeam, { name: '', role: 'Member' }]);
  };

  const handleRemoveTeamMember = (index: number) => {
    setEditTeam(editTeam.filter((_, i) => i !== index));
  };

  const handleUpdateTeamMember = (index: number, field: string, value: string) => {
    const updated = [...editTeam];
    updated[index] = { ...updated[index], [field]: value };
    setEditTeam(updated);
  };

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.4rem' }}>Manage Projects</h2>
        <button 
          className="btn-primary" 
          style={{ fontFamily: 'inherit', cursor: 'pointer', fontSize: '0.8rem' }} 
          onClick={handleAddNewClick}
        >
          {showForm ? 'Cancel' : '+ Create Project'}
        </button>
      </div>

      {feedback && (
        <div style={{ marginBottom: '1rem', padding: '0.8rem 1rem', borderRadius: '8px', border: feedback.type === 'success' ? '1px solid rgba(34,197,94,0.35)' : '1px solid rgba(239,68,68,0.35)', background: feedback.type === 'success' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', color: feedback.type === 'success' ? '#86efac' : '#fca5a5', fontSize: '0.85rem' }}>
          {feedback.message}
        </div>
      )}

      {showForm && (
        <div style={{ padding: '1.5rem', background: 'rgba(15, 22, 40, 0.4)', borderRadius: '8px', border: '1px solid var(--border-subtle)', marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--gold)' }}>
            {editingProject ? 'Edit Project' : 'New Project'}
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', marginBottom: '1rem' }}>
            <input placeholder="Project Title" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} style={inputStyle} />
            <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} style={{ ...inputStyle, cursor: 'pointer', appearance: 'none' }}>
              <option value="Planned">Planned</option>
              <option value="Ongoing">Ongoing</option>
              <option value="Completed">Completed</option>
            </select>
            
            <input placeholder="Short Description (Listing)" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} style={{ ...inputStyle, gridColumn: '1 / -1' }} />
            <input placeholder="Objective / Mission (1-2 sentences)" value={formData.objective} onChange={e => setFormData({...formData, objective: e.target.value})} style={{ ...inputStyle, gridColumn: '1 / -1' }} />
            <textarea placeholder="Full Description" value={formData.fullDescription} onChange={e => setFormData({...formData, fullDescription: e.target.value})} rows={3} style={{ ...inputStyle, gridColumn: '1 / -1', resize: 'vertical' }} />
            
            <div style={{ display: 'flex', gap: '0.8rem', gridColumn: '1 / -1' }}>
              <input type="date" placeholder="Start Date" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} style={{ ...inputStyle, flex: 1, colorScheme: 'dark' }} title="Start Date" />
              <input type="date" placeholder="End Date" value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} style={{ ...inputStyle, flex: 1, colorScheme: 'dark' }} title="End Date" />
            </div>

            <input placeholder="Comma-separated Tags (e.g. Rocketry, Optics)" value={formData.tags} onChange={e => setFormData({...formData, tags: e.target.value})} style={inputStyle} />
            <input placeholder="GitHub URL (optional)" value={formData.githubUrl} onChange={e => setFormData({...formData, githubUrl: e.target.value})} style={inputStyle} />
            
            <div style={{ padding: '1rem', border: '1px dashed var(--border-subtle)', borderRadius: '6px', background: 'rgba(255,255,255,0.02)', gridColumn: '1 / -1' }}>
               {formData.coverImage && (
                 <div style={{ marginBottom: "1rem", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                    Current image: <a href={formData.coverImage} target="_blank" rel="noreferrer" style={{color: "var(--gold)"}}>(View)</a>
                 </div>
               )}
               <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Upload Cover Image (Max configured in System Settings)</label>
               <input id="coverImageFile" type="file" accept="image/png, image/jpeg, image/webp" style={{ color: 'var(--text-primary)', fontSize: '0.9rem', width: '100%' }} />
            </div>
          </div>
          
          <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
              <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Team Members</h4>
              <button onClick={handleAddTeamMember} className="btn-secondary" style={{ fontSize: '0.7rem', padding: '0.3rem 0.6rem', borderStyle: 'dashed' }}>
                + Add Member
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {editTeam.map((member, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '0.5rem' }}>
                  <select 
                    value={member.name} 
                    onChange={e => handleUpdateTeamMember(idx, 'name', e.target.value)} 
                    style={{ ...inputStyle, flex: 2, padding: '0.4rem 0.8rem' }}
                  >
                    <option value="" disabled>Select User...</option>
                    {members.map(m => (
                      <option key={m.id} value={m.name}>{m.name}</option>
                    ))}
                  </select>
                  <input 
                    placeholder="Role (e.g. Lead, Core, Member)" 
                    value={member.role} 
                    onChange={e => handleUpdateTeamMember(idx, 'role', e.target.value)} 
                    style={{ ...inputStyle, flex: 1, padding: '0.4rem 0.8rem' }} 
                  />
                  <button onClick={() => handleRemoveTeamMember(idx)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0 0.5rem' }}>✕</button>
                </div>
              ))}
              {editTeam.length === 0 && <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No team members added yet.</p>}
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={formData.isPublished} onChange={e => setFormData({...formData, isPublished: e.target.checked})} /> 
              Publish publicly
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={formData.isHighlighted} onChange={e => setFormData({...formData, isHighlighted: e.target.checked})} />
              Mark as Highlight
            </label>
            <input type="number" min={0} max={999} value={formData.highlightPriority} onChange={e => setFormData({...formData, highlightPriority: Number(e.target.value) || 0})} style={{ ...inputStyle, maxWidth: '120px' }} placeholder="Priority" />
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
                {p.isHighlighted && <span style={{ fontSize: '0.65rem', background: 'var(--gold)', color: '#000', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 'bold' }}>HIGHLIGHT P{p.highlightPriority || 0}</span>}
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
                onClick={() => handleToggleProjectHighlight(p.id, p.isHighlighted, p.highlightPriority || 0)}
                style={{ background: 'none', border: '1px solid var(--gold)', color: 'var(--gold)', padding: '0.3rem 0.6rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontFamily: 'inherit', minWidth: '100px' }}
              >
                {p.isHighlighted ? 'Unhighlight' : 'Highlight'}
              </button>
              <button 
                onClick={() => handleEditClick(p)}
                style={{ background: 'none', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '0.3rem 0.6rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontFamily: 'inherit', minWidth: '100px' }}
              >
                Edit Content
              </button>
              <button 
                onClick={() => setPendingDeleteId((current) => current === p.id ? null : p.id)}
                style={{ background: 'none', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', padding: '0.3rem 0.6rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontFamily: 'inherit', minWidth: '100px' }}
              >
                {pendingDeleteId === p.id ? 'Cancel' : 'Delete'}
              </button>
              {pendingDeleteId === p.id && (
                <button onClick={() => handleDelete(p.id)} style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.45)', color: '#fecaca', padding: '0.3rem 0.6rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontFamily: 'inherit', minWidth: '100px' }}>
                  Confirm
                </button>
              )}
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
