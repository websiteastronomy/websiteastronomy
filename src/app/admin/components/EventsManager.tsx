"use client";

import { useState, useEffect } from 'react';
import { subscribeToCollection, addDocument, updateDocument, deleteDocument } from '@/lib/db';
import { inputStyle, rowStyle } from './shared';
import { uploadFileDirect } from '@/lib/direct-upload';
import { formatDateTimeStable } from '@/lib/format-date';

export default function EventsManager() {
  const [events, setEvents] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  useEffect(() => {
    const unsub = subscribeToCollection('events', (data) => setEvents(data));
    return () => unsub();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setFeedback(null);
    try {
      const container = document.getElementById('event-form');
      if (!container) return;
      const inputs = container.querySelectorAll('input, textarea, select');
      const data: any = {};
      inputs.forEach((i: any) => {
        if (i.name) {
          if (i.type === 'checkbox') data[i.name] = i.checked;
          else if (i.type === 'number') data[i.name] = parseInt(i.value) || 0;
          else data[i.name] = i.value;
        }
      });

      // Nest Speaker Details
      if (data.speakerName || data.speakerDesignation || data.speakerOrg) {
        data.speakerDetails = {
          name: data.speakerName || '',
          designation: data.speakerDesignation || '',
          organization: data.speakerOrg || ''
        };
      }
      delete data.speakerName;
      delete data.speakerDesignation;
      delete data.speakerOrg;

      if (!data.title || !data.date || !data.location) {
        setFeedback({ type: 'error', message: 'Please fill out title, date, and location.' });
        setIsSaving(false);
        return;
      }
      if (data.isHighlighted) {
        const highlightedCount = events.filter((event) => event.isHighlighted).length;
        const isAlreadyHighlighted = Boolean(editingEvent?.isHighlighted);
        if (!isAlreadyHighlighted && highlightedCount >= 10) {
          setFeedback({ type: 'error', message: 'Soft limit reached: keep highlighted events within 10.' });
          setIsSaving(false);
          return;
        }
      }

      const fileInput = document.getElementById('mediaUpload') as HTMLInputElement;
      const file = fileInput?.files?.[0];
      
      let finalImageUrl = editingEvent?.bannerImage || '';
      
      if (file) {
        try {
           const uploadResult = await uploadFileDirect(file, {
             category: "events",
             entityId: editingEvent?.id || "new-event",
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
      data.bannerImage = finalImageUrl;

      if (editingEvent?.id) {
        await updateDocument('events', editingEvent.id, data);
        setFeedback({ type: 'success', message: 'Updated successfully!' });
      } else {
        await addDocument('events', data);
        setFeedback({ type: 'success', message: 'Created successfully!' });
      }
      setShowForm(false);
      setEditingEvent(null);
    } catch (err) {
      console.error(err);
      setFeedback({ type: 'error', message: 'Operation failed. Check console.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDocument('events', id);
      setFeedback({ type: 'success', message: 'Event deleted.' });
      setPendingDeleteId(null);
    } catch (err) {
      console.error(err);
      setFeedback({ type: 'error', message: 'Delete failed. Check console.' });
    }
  };

  const handleToggleHighlight = async (id: string, current: boolean, priority: number) => {
    if (!current && events.filter((event) => event.isHighlighted).length >= 10) {
      setFeedback({ type: 'error', message: 'Soft limit reached: keep highlighted events within 10.' });
      return;
    }
    try {
      await updateDocument('events', id, { isHighlighted: !current, highlightPriority: Number(priority) || 0 });
      setFeedback({ type: 'success', message: current ? 'Removed from highlights.' : 'Added to highlights.' });
    } catch (err) {
      console.error(err);
      setFeedback({ type: 'error', message: 'Failed to update highlight.' });
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

      {feedback && (
        <div
          style={{
            marginBottom: '1rem',
            padding: '0.8rem 1rem',
            borderRadius: '8px',
            border: feedback.type === 'success' ? '1px solid rgba(34,197,94,0.35)' : '1px solid rgba(239,68,68,0.35)',
            background: feedback.type === 'success' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
            color: feedback.type === 'success' ? '#86efac' : '#fca5a5',
            fontSize: '0.85rem',
          }}
        >
          {feedback.message}
        </div>
      )}
      
      {showForm && (
        <div id="event-form" style={{ padding: '1.5rem', background: 'rgba(15, 22, 40, 0.4)', borderRadius: '8px', border: '1px solid var(--border-subtle)', marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--gold)' }}>
            {editingEvent ? 'Edit Event' : 'New Event'}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', marginBottom: '1rem' }}>
            <input name="title" placeholder="Event Title" defaultValue={editingEvent?.title || ''} style={inputStyle} />
            <input type="datetime-local" name="date" placeholder="Date" defaultValue={editingEvent?.date ? new Date(editingEvent.date).toISOString().slice(0, 16) : ''} style={inputStyle} />
            <input name="location" placeholder="Location" defaultValue={editingEvent?.location || ''} style={inputStyle} />
            
            {/* Event Setup Configurations */}
            <select name="status" defaultValue={editingEvent?.status || 'upcoming'} style={inputStyle}>
              <option value="upcoming">Status: Upcoming</option>
              <option value="ongoing">Status: Ongoing</option>
              <option value="completed">Status: Completed</option>
            </select>
            <select name="registrationType" defaultValue={editingEvent?.registrationType || 'internal'} style={inputStyle}>
              <option value="internal">Registration: Internal Form</option>
              <option value="external">Registration: External Link Redirect</option>
            </select>
            <input name="type" placeholder="Category (e.g., Workshop, Stargazing)" defaultValue={editingEvent?.type || ''} style={inputStyle} />
            <input type="number" name="maxParticipants" placeholder="Capacity / Max Participants" defaultValue={editingEvent?.maxParticipants || 50} style={inputStyle} />
            <input name="registrationLink" placeholder="External Register Link (Optional)" defaultValue={editingEvent?.registrationLink || ''} style={inputStyle} />

            {/* Volunteer & Speaker Sections */}
            <fieldset style={{ gridColumn: '1 / -1', border: '1px solid rgba(255,255,255,0.1)', padding: '1rem', borderRadius: '8px', marginBottom: '0.5rem' }}>
              <legend style={{ padding: '0 0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Volunteer Limits</legend>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', marginTop: '0.5rem' }}>
                <input type="number" name="volunteerLimit" placeholder="Volunteer Spot Limit" defaultValue={editingEvent?.volunteerLimit || 0} style={inputStyle} />
                <input type="number" name="backupVolunteerLimit" placeholder="Backup Volunteer Limit" defaultValue={editingEvent?.backupVolunteerLimit || 0} style={inputStyle} />
              </div>
            </fieldset>

            <fieldset style={{ gridColumn: '1 / -1', border: '1px solid rgba(255,255,255,0.1)', padding: '1rem', borderRadius: '8px', marginBottom: '0.5rem' }}>
              <legend style={{ padding: '0 0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Guest Speaker / Lead (Optional)</legend>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.8rem', marginTop: '0.5rem' }}>
                <input name="speakerName" placeholder="Speaker Name" defaultValue={editingEvent?.speakerDetails?.name || ''} style={inputStyle} />
                <input name="speakerDesignation" placeholder="Designation" defaultValue={editingEvent?.speakerDetails?.designation || ''} style={inputStyle} />
                <input name="speakerOrg" placeholder="Organization" defaultValue={editingEvent?.speakerDetails?.organization || ''} style={inputStyle} />
              </div>
            </fieldset>
            
            <div style={{ padding: '1rem', border: '1px dashed var(--border-subtle)', borderRadius: '6px', background: 'rgba(255,255,255,0.02)', gridColumn: '1 / -1' }}>
               {editingEvent?.bannerImage && (
                 <div style={{ marginBottom: "1rem", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                    Current image: <a href={editingEvent.bannerImage} target="_blank" rel="noreferrer" style={{color: "var(--gold)"}}>(View)</a>
                 </div>
               )}
               <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Upload Banner Image (Max configured in System Settings)</label>
               <input id="mediaUpload" type="file" accept="image/png, image/jpeg, image/webp" style={{ color: 'var(--text-primary)', fontSize: '0.9rem', width: '100%' }} />
            </div>

            <input name="description" placeholder="Short Summary" defaultValue={editingEvent?.description || ''} style={{ ...inputStyle, gridColumn: '1 / -1' }} />
            <textarea name="fullDescription" placeholder="Full Detailed Description" defaultValue={editingEvent?.fullDescription || ''} rows={3} style={{ ...inputStyle, gridColumn: '1 / -1', resize: 'vertical' }} />
          </div>
          
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer', background: 'rgba(255,255,255,0.05)', padding: '0.5rem 1rem', borderRadius: '4px' }}>
              <input name="isPublished" type="checkbox" defaultChecked={editingEvent ? editingEvent.isPublished : true} /> 
              Publish publicly
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer', background: 'rgba(255,255,255,0.05)', padding: '0.5rem 1rem', borderRadius: '4px' }}>
              <input name="isPublic" type="checkbox" defaultChecked={editingEvent ? editingEvent.isPublic : true} /> 
              Publicly Visible (Guests + Members)
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer', background: 'rgba(255,255,255,0.05)', padding: '0.5rem 1rem', borderRadius: '4px' }}>
              <input name="enableVolunteer" type="checkbox" defaultChecked={editingEvent ? editingEvent.enableVolunteer : false} /> 
              Enable Volunteer Spots
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer', background: 'rgba(255,255,255,0.05)', padding: '0.5rem 1rem', borderRadius: '4px' }}>
              <input name="isHighlighted" type="checkbox" defaultChecked={editingEvent ? editingEvent.isHighlighted : false} />
              Mark as Highlight
            </label>
            <input type="number" name="highlightPriority" defaultValue={editingEvent?.highlightPriority || 0} min={0} max={999} placeholder="Highlight Priority" style={{ ...inputStyle, maxWidth: '180px' }} />
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
          const isOngoing = evt.status === "ongoing";
          const isUpcoming = evt.status === "upcoming";
          return (
            <div key={evt.id} style={{ ...rowStyle, padding: '1.2rem', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '0.4rem' }}>
                  <h4 style={{ fontSize: '1.05rem' }}>{evt.title}</h4>
                  {!evt.isPublished && <span style={{ fontSize: '0.65rem', background: '#333', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>DRAFT</span>}
                  {evt.isPublic === false && <span style={{ fontSize: '0.65rem', background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.4)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>MEMBERS ONLY</span>}
                  {evt.isHighlighted && <span style={{ fontSize: '0.65rem', background: 'var(--gold)', color: '#000', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 700 }}>HIGHLIGHT P{evt.highlightPriority || 0}</span>}
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.8rem' }}>{formatDateTimeStable(evt.date)} · {evt.location}</p>
                
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span style={{ 
                    fontSize: '0.7rem', padding: '0.2rem 0.6rem', borderRadius: '12px', 
                    background: isUpcoming || isOngoing ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.05)', 
                    color: isUpcoming || isOngoing ? '#22c55e' : 'var(--text-muted)',
                    textTransform: 'uppercase' 
                  }}>
                    {evt.status || "upcoming"}
                  </span>
                  <span style={{ fontSize: '0.7rem', padding: '0.2rem 0.6rem', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}>
                    {evt.type}
                  </span>
                </div>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>
                <button 
                  onClick={() => handleToggleHighlight(evt.id, evt.isHighlighted, evt.highlightPriority || 0)}
                  style={{ background: 'none', border: '1px solid var(--gold)', color: 'var(--gold)', padding: '0.3rem 0.6rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontFamily: 'inherit', minWidth: '80px' }}
                >
                  {evt.isHighlighted ? 'Unhighlight' : 'Highlight'}
                </button>
                <button 
                  onClick={() => { setEditingEvent(evt); setShowForm(true); window.scrollTo(0,0); }}
                  style={{ background: 'none', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '0.3rem 0.6rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontFamily: 'inherit', minWidth: '80px' }}
                >
                  Edit
                </button>
                <button 
                  onClick={() => setPendingDeleteId((current) => current === evt.id ? null : evt.id)}
                  style={{ background: 'none', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', padding: '0.3rem 0.6rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontFamily: 'inherit', minWidth: '80px' }}
                >
                  {pendingDeleteId === evt.id ? 'Cancel' : 'Delete'}
                </button>
                {pendingDeleteId === evt.id && (
                  <button
                    onClick={() => handleDelete(evt.id)}
                    style={{ background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.45)', color: '#fecaca', padding: '0.3rem 0.6rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontFamily: 'inherit', minWidth: '80px' }}
                  >
                    Confirm
                  </button>
                )}
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
