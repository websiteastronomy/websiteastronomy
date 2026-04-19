"use client";

import { useState, useEffect } from 'react';
import { subscribeToCollection, addDocument, updateDocument, deleteDocument } from '@/lib/db';
import { cleanupReplacedUploadsAction } from '@/app/actions/storage';
import { formatFileSize, optimizeImageFile } from '@/lib/client-upload-images';
import { uploadFileDirect } from '@/lib/direct-upload';
import { inputStyle, rowStyle } from './shared';

export default function AchievementsManager() {
  const [achievements, setAchievements] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingAchievement, setEditingAchievement] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    const unsub = subscribeToCollection('achievements', (data) => setAchievements(data));
    return () => unsub();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setFeedback(null);
    try {
      const container = document.getElementById('achievement-form');
      if (!container) return;
      
      const inputs = container.querySelectorAll('input, textarea');
      const data: any = {};
      
      inputs.forEach((i: any) => {
        if (i.name) data[i.name] = i.value;
      });

      if (selectedImageFile) {
        const optimizedImage = await optimizeImageFile(selectedImageFile, {
          maxWidth: 1800,
          maxHeight: 1800,
          type: "image/webp",
          quality: 0.84,
          fileName: "achievement-image.webp",
        });
        const uploaded = await uploadFileDirect(
          optimizedImage,
          {
            category: "achievement_images",
            entityId: editingAchievement?.id || "draft",
            fileName: optimizedImage.name,
            fileType: optimizedImage.type,
            fileSize: optimizedImage.size,
            isPublic: true,
          },
          { onProgress: setUploadProgress }
        );
        if (editingAchievement?.imageUrl && editingAchievement.imageUrl !== uploaded.fileUrl) {
          await cleanupReplacedUploadsAction({ urls: [editingAchievement.imageUrl] });
        }
        data.imageUrl = uploaded.fileUrl;
      }

      if (!data.title || !data.year) {
        setFeedback({ type: 'error', message: 'Title and Year are required.' });
        setIsSaving(false);
        return;
      }

      if (editingAchievement?.id) {
        await updateDocument('achievements', editingAchievement.id, data);
        setFeedback({ type: 'success', message: 'Updated successfully!' });
      } else {
        await addDocument('achievements', data);
        setFeedback({ type: 'success', message: 'Created successfully!' });
      }
      setShowForm(false);
      setEditingAchievement(null);
      setSelectedImageFile(null);
      setUploadProgress(0);
    } catch (err) {
      console.error(err);
      setFeedback({ type: 'error', message: 'Operation failed. Check console.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDocument('achievements', id);
      setFeedback({ type: 'success', message: 'Achievement deleted.' });
      setPendingDeleteId(null);
    } catch (err) {
      console.error(err);
      setFeedback({ type: 'error', message: 'Delete failed. Check console.' });
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

      {feedback && (
        <div style={{ marginBottom: '1rem', padding: '0.8rem 1rem', borderRadius: '8px', border: feedback.type === 'success' ? '1px solid rgba(34,197,94,0.35)' : '1px solid rgba(239,68,68,0.35)', background: feedback.type === 'success' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', color: feedback.type === 'success' ? '#86efac' : '#fca5a5', fontSize: '0.85rem' }}>
          {feedback.message}
        </div>
      )}

      {showForm && (
        <div style={{ padding: '1.5rem', background: 'rgba(15, 22, 40, 0.4)', borderRadius: '8px', border: '1px solid var(--border-subtle)', marginBottom: '1.5rem' }}>
          <div id="achievement-form" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', marginBottom: '1rem' }}>
            <input name="title" placeholder="Title" defaultValue={editingAchievement?.title || ''} style={inputStyle} />
            <input name="year" placeholder="Year" defaultValue={editingAchievement?.year || ''} style={inputStyle} />
            <input name="imageUrl" placeholder="Image URL" defaultValue={editingAchievement?.imageUrl || ''} style={{ ...inputStyle, gridColumn: '1 / -1' }} />
            <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => setSelectedImageFile(event.target.files?.[0] || null)} style={{ ...inputStyle, gridColumn: '1 / -1' }} />
            <textarea name="description" placeholder="Description" defaultValue={editingAchievement?.description || ''} rows={3} style={{ ...inputStyle, gridColumn: '1 / -1', resize: 'vertical' }} />
          </div>
          {selectedImageFile && (
            <p style={{ marginTop: "-0.25rem", marginBottom: "1rem", color: "var(--text-muted)", fontSize: "0.78rem" }}>
              Selected image: {selectedImageFile.name} ({formatFileSize(selectedImageFile.size)})
            </p>
          )}
          <button 
            className="btn-primary" 
            disabled={isSaving}
            style={{ fontFamily: 'inherit', cursor: 'pointer', fontSize: '0.8rem', opacity: isSaving ? 0.7 : 1 }} 
            onClick={handleSave}
          >
            {isSaving ? `Saving${uploadProgress ? ` ${uploadProgress}%` : '...'}` : (editingAchievement ? 'Update' : 'Add Achievement')}
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
                onClick={() => setPendingDeleteId((current) => current === a.id ? null : a.id)} 
                style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.8rem', fontFamily: 'inherit' }}
              >
                {pendingDeleteId === a.id ? 'Cancel' : 'Delete'}
              </button>
              {pendingDeleteId === a.id && (
                <button onClick={() => handleDelete(a.id)} style={{ background: 'none', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#fca5a5', cursor: 'pointer', fontSize: '0.8rem', fontFamily: 'inherit', padding: '0.3rem 0.6rem', borderRadius: '4px' }}>
                  Confirm
                </button>
              )}
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
