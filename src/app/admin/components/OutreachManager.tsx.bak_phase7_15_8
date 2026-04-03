"use client";

import { useState, useEffect } from 'react';
import { subscribeToCollection, addDocument, updateDocument, deleteDocument } from '@/lib/db';
import { inputStyle, rowStyle } from './shared';

export default function OutreachManager() {
  const [outreach, setOutreach] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingOutreach, setEditingOutreach] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const unsub = subscribeToCollection('outreach', (data) => setOutreach(data));
    return () => unsub();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const container = document.getElementById('outreach-form');
      if (!container) return;
      const inputs = container.querySelectorAll('input, select, textarea');
      const data: any = { stats: {}, images: [] };
      inputs.forEach((i: any) => {
        if (i.type === 'checkbox') data[i.name] = i.checked;
        else if (['peopleReached', 'duration', 'teamSize'].includes(i.name)) data.stats[i.name] = i.value;
        else if (i.name === 'imageUrl') data.images = [i.value];
        else if (i.name) data[i.name] = i.value;
      });

      if (!data.title || !data.date) {
        alert("Please fill out Title and Date.");
        setIsSaving(false);
        return;
      }

      if (editingOutreach?.id) {
        await updateDocument('outreach', editingOutreach.id, data);
        alert("Updated successfully!");
      } else {
        await addDocument('outreach', data);
        alert("Created successfully!");
      }
      setShowForm(false);
      setEditingOutreach(null);
    } catch (err) {
      console.error(err);
      alert("Operation failed. Check console.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this outreach record?")) {
      await deleteDocument('outreach', id);
    }
  };

  return (
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
            <input name="date" placeholder="ISO Date (e.g. 2026-03-20...)" defaultValue={editingOutreach?.date || ''} style={inputStyle} />
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
              disabled={isSaving}
              style={{ fontFamily: 'inherit', cursor: 'pointer', fontSize: '0.8rem', opacity: isSaving ? 0.7 : 1 }} 
              onClick={handleSave}
            >
              {isSaving ? 'Saving...' : (editingOutreach ? 'Update Log' : 'Create Log')}
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
        {outreach.map((out) => {
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
                    {out.stats?.peopleReached} Reached
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
                  onClick={() => handleDelete(out.id)}
                  style={{ background: 'none', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', padding: '0.3rem 0.6rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontFamily: 'inherit', minWidth: '80px' }}
                >
                  Delete
                </button>
              </div>
            </div>
          );
        })}
        {outreach.length === 0 && (
          <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No outreach logs found.</p>
        )}
      </div>
    </>
  );
}
