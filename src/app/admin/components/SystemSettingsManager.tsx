"use client";

import { useState, useEffect } from "react";
import { getSystemMaxFileSize, setSystemMaxFileSize } from "@/app/actions/storage";

export default function SystemSettingsManager() {
  const [maxSize, setMaxSize] = useState<number>(10);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getSystemMaxFileSize().then(size => {
      setMaxSize(size);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    if (maxSize < 1 || maxSize > 100) {
      alert("Please enter a value between 1 and 100.");
      return;
    }
    setSaving(true);
    try {
      await setSystemMaxFileSize(maxSize);
      alert("System settings saved successfully.");
    } catch (err: any) {
      console.error(err);
      alert("Failed to save: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ color: "var(--text-muted)" }}>Loading settings...</div>;
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.4rem' }}>System Settings</h2>
      </div>

      <div style={{ background: 'rgba(15, 22, 40, 0.4)', borderRadius: '8px', border: '1px solid var(--border-subtle)', padding: '2rem' }}>
        <h3 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', color: 'var(--gold)' }}>File Storage Details</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem', maxWidth: '500px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
              Maximum File Upload Size (MB)
            </label>
            <input
              type="number"
              min="1"
              max="100"
              value={maxSize}
              onChange={(e) => setMaxSize(Number(e.target.value) || 10)}
              style={{
                width: '100%',
                padding: '0.8rem 1rem',
                background: 'rgba(15, 22, 40, 0.6)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '6px',
                color: 'var(--text-primary)',
                fontFamily: 'inherit'
              }}
            />
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
              Controls the maximum allowed size per file uploaded to Cloudflare R2 via the Admin Portal or Media galleries. Valid bounds: 1MB – 100MB.
            </p>
          </div>

          <button 
            onClick={handleSave} 
            disabled={saving} 
            className="btn-primary" 
            style={{ fontFamily: 'inherit', padding: '0.8rem', fontSize: '0.9rem', opacity: saving ? 0.7 : 1, cursor: saving ? "not-allowed" : "pointer" }}
          >
            {saving ? "Saving Configuration..." : "Save Storage Settings"}
          </button>
        </div>
      </div>
    </>
  );
}
