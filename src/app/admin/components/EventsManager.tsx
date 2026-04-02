"use client";

import { useState, useEffect } from 'react';
import { subscribeToCollection, addDocument, updateDocument, deleteDocument } from '@/lib/db';
import { inputStyle, rowStyle } from './shared';

export default function EventsManager() {
  const [events, setEvents] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const unsub = subscribeToCollection('events', (data) => setEvents(data));
    return () => unsub();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const container = document.getElementById('event-form');
      if (!container) return;
      const inputs = container.querySelectorAll('input, textarea, select');
      const data: any = {};
      inputs.forEach((i: any) => {
        if (i.type === 'checkbox') data[i.name] = i.checked;
        else if (i.name) data[i.name] = i.value;
      });

      if (!data.title || !data.date || !data.location) {
        alert("Please fill out title, date, and location.");
        setIsSaving(false);
        return;
      }

      if (editingEvent?.id) {
        await updateDocument('events', editingEvent.id, data);
        alert("Updated successfully!");
      } else {
        await addDocument('events', data);
        alert("Created successfully!");
      }
      setShowForm(false);
      setEditingEvent(null);
    } catch (err) {
      console.error(err);
      alert("Operation failed. Check console.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this event?")) {
      await deleteDocument('events', id);
    }
  };

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.4rem' }}>Manage Events</h2>
        <button className="btn-primary" style={{ fontFamily: 'inherit', cursor: 'pointer', fontSize: '0.8rem' }} onClick={() => { setShowForm(!showForm); setEditingEvent(null); }}>
          {showForm ? 'Cancel' : '+ Create Event'}
        </button>
      </div>
      
      {showForm && (
        <div style={{ padding: '1.5rem', background: 'rgba(15, 22, 40, 0.4)', borderRadius: '8px', border: '1px solid var(--border-subtle)', marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--gold)' }}>
            {editingEvent ? 'Edit Event' : 'New Event'}
          </h3>
          <div id="event-form" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', marginBottom: '1rem' }}>
            <input name="title" placeholder="Event Title" defaultValue={editingEvent?.title || ''} style={inputStyle} />
            <input name="description" placeholder="Short Description" defaultValue={editingEvent?.description || ''} style={inputStyle} />
            <input type="datetime-local" name="date" placeholder="Date" defaultValue={editingEvent?.date ? new Date(editingEvent.date).toISOString().slice(0, 16) : ''} style={inputStyle} />
            <input name="location" placeholder="Location" defaultValue={editingEvent?.location || ''} style={inputStyle} />
            <input name="type" placeholder="Type (e.g., Workshop, Stargazing)" defaultValue={editingEvent?.type || ''} style={inputStyle} />
            <input name="registrationLink" placeholder="Registration Link (optional)" defaultValue={editingEvent?.registrationLink || ''} style={inputStyle} />
            <input name="bannerImage" placeholder="Banner Image URL" defaultValue={editingEvent?.bannerImage || ''} style={{ ...inputStyle, gridColumn: '1 / -1' }} />
            <textarea name="fullDescription" placeholder="Full Description" defaultValue={editingEvent?.fullDescription || ''} rows={3} style={{ ...inputStyle, gridColumn: '1 / -1', resize: 'vertical' }} />
          </div>
          
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>
              <input name="isPublished" type="checkbox" defaultChecked={editingEvent ? editingEvent.isPublished : true} /> 
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
              {isSaving ? 'Saving...' : (editingEvent ? 'Update Event' : 'Create Event')}
            </button>
            {editingEvent && (
              <button className="btn-secondary" style={{ fontFamily: 'inherit', cursor: 'pointer', fontSize: '0.8rem', background: 'transparent' }} onClick={() => { setEditingEvent(null); setShowForm(false); }}>
                Cancel
              </button>
            )}
          </div>
        </div>
      )}
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        {events.map((evt) => {
          const isUpcoming = new Date(evt.date) >= new Date();
          return (
            <div key={evt.id} style={{ ...rowStyle, padding: '1.2rem', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '0.4rem' }}>
                  <h4 style={{ fontSize: '1.05rem' }}>{evt.title}</h4>
                  {!evt.isPublished && <span style={{ fontSize: '0.65rem', background: '#333', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>DRAFT</span>}
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.8rem' }}>{new Date(evt.date).toLocaleString()} · {evt.location}</p>
                
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span style={{ 
                    fontSize: '0.7rem', padding: '0.2rem 0.6rem', borderRadius: '12px', 
                    background: isUpcoming ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.05)', 
                    color: isUpcoming ? '#22c55e' : 'var(--text-muted)' 
                  }}>
                    {isUpcoming ? "UPCOMING" : "PAST / COMPLETED"}
                  </span>
                  <span style={{ fontSize: '0.7rem', padding: '0.2rem 0.6rem', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}>
                    {evt.type}
                  </span>
                </div>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>
                <button 
                  onClick={() => { setEditingEvent(evt); setShowForm(true); window.scrollTo(0,0); }}
                  style={{ background: 'none', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '0.3rem 0.6rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontFamily: 'inherit', minWidth: '80px' }}
                >
                  Edit
                </button>
                <button 
                  onClick={() => handleDelete(evt.id)}
                  style={{ background: 'none', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', padding: '0.3rem 0.6rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontFamily: 'inherit', minWidth: '80px' }}
                >
                  Delete
                </button>
              </div>
            </div>
          );
        })}
        {events.length === 0 && (
          <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No events found in database.</p>
        )}
      </div>
    </>
  );
}
