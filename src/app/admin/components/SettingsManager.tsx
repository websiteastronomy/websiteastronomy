"use client";

import { useState, useEffect } from 'react';
import { inputStyle } from './shared';
import { loadSiteSettingsClient } from '@/data/siteSettingsStatic';
import { writeSiteSettingsLocal } from '@/lib/settingsLocal';

export default function SettingsManager() {
  const [siteSettings, setSiteSettings] = useState<any>(null);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    const s = loadSiteSettingsClient();
    setSiteSettings(s);
  }, []);

  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    setFeedback(null);
    try {
      if (siteSettings) {
        writeSiteSettingsLocal(siteSettings);
        setFeedback({ type: 'success', message: 'Settings saved successfully!' });
      }
    } catch (error) {
      console.error(error);
      setFeedback({ type: 'error', message: 'Failed to save settings.' });
    } finally {
      setIsSavingSettings(false);
    }
  };

  if (!siteSettings) return null;

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem' }}>Global Site Settings</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Control recruitment, home page stats, and daily facts.</p>
        </div>
        <button 
          className="btn-primary" 
          disabled={isSavingSettings}
          style={{ fontFamily: 'inherit', cursor: 'pointer', fontSize: '0.8rem', opacity: isSavingSettings ? 0.7 : 1 }} 
          onClick={handleSaveSettings}
        >
          {isSavingSettings ? 'Saving...' : 'Save All Settings'}
        </button>
      </div>

      {feedback ? (
        <div style={{ marginBottom: '1rem', padding: '0.8rem 1rem', borderRadius: '8px', border: feedback.type === 'success' ? '1px solid rgba(34,197,94,0.35)' : '1px solid rgba(239,68,68,0.35)', background: feedback.type === 'success' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', color: feedback.type === 'success' ? '#86efac' : '#fca5a5', fontSize: '0.85rem' }}>
          {feedback.message}
        </div>
      ) : null}

      <div style={{ display: 'grid', gap: '2rem' }}>
        {/* Recruitment Toggle */}
        <div style={{ background: 'rgba(15, 22, 40, 0.4)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '0.3rem' }}>Recruitment Status</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Toggle the &ldquo;Join Club&rdquo; functionality on/off.</p>
            </div>
            <button 
              onClick={() => setSiteSettings((s: any) => ({ ...s, isRecruiting: !s.isRecruiting }))}
              style={{ 
                padding: '0.6rem 1.5rem', borderRadius: '20px', fontSize: '0.85rem', cursor: 'pointer',
                background: siteSettings.isRecruiting ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                border: `1px solid ${siteSettings.isRecruiting ? '#22c55e' : '#ef4444'}`,
                color: siteSettings.isRecruiting ? '#4ade80' : '#f87171',
                fontWeight: 600, transition: 'all 0.2s'
              }}
            >
              {siteSettings.isRecruiting ? 'OPEN' : 'CLOSED'}
            </button>
          </div>
        </div>

        {/* Home Page Stats */}
        <div style={{ background: 'rgba(15, 22, 40, 0.4)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1.2rem' }}>Home Page Stats (Counters)</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0.8rem' }}>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Members</label>
              <input type="number" value={siteSettings.heroStats?.members || 0} onChange={(e) => setSiteSettings({...siteSettings, heroStats: {...siteSettings.heroStats, members: parseInt(e.target.value)}})} style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Projects</label>
              <input type="number" value={siteSettings.heroStats?.projects || 0} onChange={(e) => setSiteSettings({...siteSettings, heroStats: {...siteSettings.heroStats, projects: parseInt(e.target.value)}})} style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Events</label>
              <input type="number" value={siteSettings.heroStats?.events || 0} onChange={(e) => setSiteSettings({...siteSettings, heroStats: {...siteSettings.heroStats, events: parseInt(e.target.value)}})} style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Impact</label>
              <input type="number" value={siteSettings.heroStats?.impact || 0} onChange={(e) => setSiteSettings({...siteSettings, heroStats: {...siteSettings.heroStats, impact: parseInt(e.target.value)}})} style={inputStyle} />
            </div>
          </div>
        </div>

        {/* Daily Fact */}
        <div style={{ background: 'rgba(15, 22, 40, 0.4)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1.2rem' }}>Astronomy Fact of the Day</h3>
          <textarea 
            rows={3} 
            value={siteSettings.dailyFact?.text || ''} 
            onChange={(e) => setSiteSettings((s: any) => ({ ...s, dailyFact: { ...s.dailyFact, text: e.target.value } }))}
            placeholder="The universe is expanding..." 
            style={{ ...inputStyle, resize: 'vertical', marginBottom: '1rem' }} 
          />
          <input 
            placeholder="Source (e.g. NASA Science)" 
            value={siteSettings.dailyFact?.source || ''} 
            onChange={(e) => setSiteSettings((s: any) => ({ ...s, dailyFact: { ...s.dailyFact, source: e.target.value } }))}
            style={inputStyle} 
          />
        </div>

        {/* Feature Highlights */}
        <div style={{ background: 'rgba(15, 22, 40, 0.4)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1.2rem' }}>Featured ID Overrides</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>Enter specific IDs to force highlight items on the home page (Leave empty for auto-latest).</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <input 
              placeholder="Featured Project ID" 
              value={siteSettings.featuredProjectId || ''} 
              onChange={(e) => setSiteSettings((s: any) => ({ ...s, featuredProjectId: e.target.value }))}
              style={inputStyle} 
            />
            <input 
              placeholder="Featured Event ID" 
              value={siteSettings.featuredEventId || ''} 
              onChange={(e) => setSiteSettings((s: any) => ({ ...s, featuredEventId: e.target.value }))}
              style={inputStyle} 
            />
          </div>
        </div>
      </div>
    </>
  );
}
