"use client";

import { useState, useEffect } from 'react';
import { inputStyle } from './shared';
import { loadSiteSettingsClient } from '@/data/siteSettingsStatic';
import { writeSiteSettingsLocal } from '@/lib/settingsLocal';
import { MOCK_NIGHT_SKY } from '@/data/mockNightSky';

export default function NightSkyManager() {
  const [siteSettings, setSiteSettings] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    const s = loadSiteSettingsClient();
    setSiteSettings(s);
  }, []);

  const handleSave = async () => {
    const jsonInput = document.querySelector('#night-sky-json') as HTMLTextAreaElement;
    let data;
    try {
      data = JSON.parse(jsonInput.value);
    } catch {
      setFeedback({ type: 'error', message: 'Invalid JSON format' });
      return;
    }

    setFeedback(null);
    setIsSaving(true);
    try {
      const next = { ...siteSettings, nightSky: data };
      setSiteSettings(next);
      writeSiteSettingsLocal(next);
      setFeedback({ type: 'success', message: 'Night sky configuration saved in this browser.' });
    } catch {
      setFeedback({ type: 'error', message: 'Failed to save night sky data.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem' }}>Night Sky Data Manager</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Manage the current moon phase, visible planets, and celestial events via JSON configuration.</p>
        </div>
      </div>

      {feedback ? (
        <div style={{ marginBottom: '1rem', padding: '0.8rem 1rem', borderRadius: '8px', border: feedback.type === 'success' ? '1px solid rgba(34,197,94,0.35)' : '1px solid rgba(239,68,68,0.35)', background: feedback.type === 'success' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', color: feedback.type === 'success' ? '#86efac' : '#fca5a5', fontSize: '0.85rem' }}>
          {feedback.message}
        </div>
      ) : null}
      
      <div style={{ padding: '1.5rem', background: 'rgba(15, 22, 40, 0.4)', borderRadius: '8px', border: '1px solid var(--border-subtle)', marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--gold)' }}>Current Configuration</h3>
        <textarea 
          key={siteSettings ? "night-sky-loaded" : "night-sky-pending"}
          id="night-sky-json"
          defaultValue={JSON.stringify(siteSettings?.nightSky ?? MOCK_NIGHT_SKY, null, 2)}
          rows={20}
          style={{ ...inputStyle, fontFamily: 'monospace', fontSize: '0.8rem', resize: 'vertical' }}
        />
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.8rem', marginBottom: '1.5rem' }}>
          Paste the updated Night Sky JSON configuration here. Make sure it matches the required schema.
        </p>
        
        <button 
          className="btn-primary" 
          disabled={isSaving}
          style={{ fontFamily: 'inherit', cursor: 'pointer', fontSize: '0.8rem', opacity: isSaving ? 0.7 : 1 }}
          onClick={handleSave}
        >
          {isSaving ? 'Saving...' : 'Save Night Sky Configuration'}
        </button>
      </div>
    </>
  );
}
