"use client";

import { useState, useEffect } from 'react';
import { subscribeToCollection, addDocument, updateDocument, deleteDocument } from '@/lib/db';
import { inputStyle, rowStyle } from './shared';

export default function ObservationsManager() {
  const [observations, setObservations] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingObservation, setEditingObservation] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const unsub = subscribeToCollection('observations', (data) => setObservations(data));
    return () => unsub();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const container = document.getElementById('observation-form');
      if (!container) return;
      const inputs = container.querySelectorAll('input, select, textarea');
      const data: any = {};
      inputs.forEach((i: any) => {
        if (i.type === 'checkbox') data[i.name] = i.checked;
        else if (i.name) data[i.name] = i.value;
      });

      if (!data.title || !data.observerName || !data.target) {
        alert("Please fill out Title, Observer Name, and Target.");
        setIsSaving(false);
        return;
      }

      if (editingObservation?.id) {
        await updateDocument('observations', editingObservation.id, data);
        alert("Updated successfully!");
      } else {
        await addDocument('observations', data);
        alert("Created successfully!");
      }
      setShowForm(false);
      setEditingObservation(null);
    } catch (err) {
      console.error(err);
      alert("Operation failed. Check console.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this observation?")) {
      await deleteDocument('observations', id);
    }
  };

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem' }}>Manage Observations</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Review community observation logs and astrophotography submissions.</p>
        </div>
        <button className="btn-primary" style={{ fontFamily: 'inherit', cursor: 'pointer', fontSize: '0.8rem' }} onClick={() => { setShowForm(!showForm); setEditingObservation(null); }}>
          {showForm ? 'Cancel' : '+ Add Record'}
        </button>
      </div>

      {showForm && (
        <div style={{ padding: '1.5rem', background: 'rgba(15, 22, 40, 0.4)', borderRadius: '8px', border: '1px solid var(--border-subtle)', marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--gold)' }}>
            {editingObservation ? 'Edit Observation' : 'New Observation'}
          </h3>
          <div id="observation-form" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', marginBottom: '1rem' }}>
            <input name="title" placeholder="Observation Title" defaultValue={editingObservation?.title || ''} style={inputStyle} />
            <input name="observerName" placeholder="Observer Name" defaultValue={editingObservation?.observerName || ''} style={inputStyle} />
            <input name="target" placeholder="Celestial Target (e.g., M42)" defaultValue={editingObservation?.target || ''} style={inputStyle} />
            <select name="category" defaultValue={editingObservation?.category || 'deep_sky'} style={{ ...inputStyle, cursor: 'pointer', appearance: 'none' }}>
              <option value="deep_sky">Deep Sky Object</option>
              <option value="planetary">Planetary</option>
              <option value="lunar">Lunar</option>
              <option value="solar">Solar</option>
              <option value="wide_field">Wide Field / Milkway</option>
              <option value="other">Other</option>
            </select>
            <input name="date" placeholder="ISO Date (e.g. 2026-03-20...)" defaultValue={editingObservation?.date || ''} style={inputStyle} />
            <input name="equipment" placeholder="Equipment Used" defaultValue={editingObservation?.equipment || ''} style={inputStyle} />
            <input name="location" placeholder="Location" defaultValue={editingObservation?.location || ''} style={inputStyle} />
            <input name="imageUrl" placeholder="Image URL (Astrophotography)" defaultValue={editingObservation?.imageUrl || ''} style={{ ...inputStyle, gridColumn: '1 / -1' }} />
            <textarea name="notes" placeholder="Observation Notes / Seeing Conditions" defaultValue={editingObservation?.notes || ''} rows={3} style={{ ...inputStyle, gridColumn: '1 / -1', resize: 'vertical' }} />
          </div>
          
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer', color: editingObservation?.isApproved ? '#22c55e' : '#fb923c' }}>
              <input name="isApproved" type="checkbox" defaultChecked={editingObservation ? editingObservation.isApproved : true} /> 
              {editingObservation?.isApproved ? 'Approved & Public' : 'PENDING APPROVAL'}
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer', marginLeft: "1rem" }}>
              <input name="isFeatured" type="checkbox" defaultChecked={editingObservation ? editingObservation.isFeatured : false} /> 
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
              {isSaving ? 'Saving...' : (editingObservation ? 'Update Record' : 'Create Record')}
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
        {observations.map((obs) => {
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
                  onClick={() => handleDelete(obs.id)}
                  style={{ background: 'none', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', padding: '0.3rem 0.6rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontFamily: 'inherit', minWidth: '80px' }}
                >
                  Delete
                </button>
              </div>
            </div>
          );
        })}
        {observations.length === 0 && (
          <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No observations found.</p>
        )}
      </div>
    </>
  );
}
