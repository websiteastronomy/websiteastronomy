"use client";

import { useState, useEffect } from 'react';
import AnimatedSection from '@/components/AnimatedSection';
import AnimatedCard from '@/components/AnimatedCard';
import { motion } from 'framer-motion';
import { MOCK_NIGHT_SKY } from '@/data/mockNightSky';
import { loadSiteSettingsClient } from '@/data/siteSettingsStatic';

export default function NightSky() {
  const [nightSkyData, setNightSkyData] = useState(MOCK_NIGHT_SKY);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const s = loadSiteSettingsClient();
    if (s.nightSky) setNightSkyData(s.nightSky);
    setLoading(false);
  }, []);

  const { moon, planets, upcomingEvents } = nightSkyData || MOCK_NIGHT_SKY;

  const getVisibilityColor = (rating: string) => {
    switch(rating) {
      case 'Excellent': return '#22c55e'; // Green
      case 'Good': return '#3b82f6'; // Blue
      case 'Fair': return '#eab308'; // Yellow
      case 'Poor': return '#ef4444'; // Red
      default: return 'var(--text-muted)';
    }
  };

  return (
    <div className="page-container">
      <AnimatedSection>
        <p className="section-title" style={{ textAlign: "center" }}>Tonight&apos;s Sky</p>
        <h1 className="page-title"><span className="gradient-text">Night Sky Dashboard</span></h1>
        <p className="page-subtitle">
          Real-time celestial coordinate approximations, moon phasing, and planetary observability indices.
        </p>
      </AnimatedSection>

      {/* TOP DASHBOARD METRICS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem', width: '100%', marginBottom: '4rem' }}>
        
        {/* Moon Phase Radar */}
        <AnimatedCard index={0} style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'rgba(15, 22, 40, 0.5)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
          <div style={{ position: 'relative', width: '150px', height: '150px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {/* Radar rings */}
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }} style={{ position: 'absolute', width: '100%', height: '100%', border: '1px dashed rgba(201, 168, 76, 0.3)', borderRadius: '50%' }} />
            <motion.div animate={{ rotate: -360 }} transition={{ duration: 30, repeat: Infinity, ease: "linear" }} style={{ position: 'absolute', width: '70%', height: '70%', border: '1px solid rgba(201, 168, 76, 0.1)', borderRadius: '50%' }} />
            
            <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} style={{ zIndex: 2 }}>
              <img src={moon.imageUrl} alt="Moon" style={{ width: '90px', height: '90px', borderRadius: '50%', objectFit: 'cover', boxShadow: '0 0 20px rgba(255,255,255,0.1)' }} />
            </motion.div>
          </div>
          <h3 style={{ fontSize: '1.4rem', marginBottom: '0.3rem', fontFamily: "'Cinzel', serif" }}>{moon.phase}</h3>
          <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1rem', width: '100%', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.2rem', color: 'var(--gold)', fontWeight: 600 }}>{moon.illumination}%</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Illumination</div>
            </div>
            <div style={{ width: '1px', background: 'var(--border-subtle)' }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.2rem', color: 'var(--gold)', fontWeight: 600 }}>{moon.daysUntilFull}d</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Until Full</div>
            </div>
          </div>
        </AnimatedCard>

        {/* Visible Planets Table */}
        <AnimatedCard index={1} style={{ padding: '2rem', display: 'flex', flexDirection: 'column', background: 'rgba(15, 22, 40, 0.5)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', letterSpacing: '0.05em', color: 'var(--text-primary)' }}>Naked-Eye Planets</h3>
            <span style={{ fontSize: '0.75rem', background: 'rgba(34, 197, 94, 0.15)', color: '#22c55e', padding: '0.2rem 0.6rem', borderRadius: '12px' }}>Live Visibility</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
            {planets.map((planet, i) => (
              <motion.div key={planet.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.1 }}
                style={{ display: 'grid', gridTemplateColumns: 'min-content 1fr min-content', alignItems: 'center', gap: '1rem', paddingBottom: '1rem', borderBottom: i < planets.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
                <img src={planet.imageUrl} alt={planet.name} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                <div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                    <span style={{ fontWeight: 600, fontSize: '1.05rem' }}>{planet.name}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Mag {planet.magnitude}</span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--gold-light)', display: 'flex', gap: '0.5rem' }}>
                    <span>↑ {planet.riseTime}</span>
                    <span style={{ opacity: 0.5 }}>|</span>
                    <span>↓ {planet.setTime}</span>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>Constellation</div>
                  <div style={{ fontSize: '0.9rem' }}>{planet.constellation}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </AnimatedCard>
      </div>

      {/* UPCOMING CELESTIAL EVENTS */}
      <AnimatedSection style={{ width: "100%" }}>
        <h2 style={{ fontSize: '1.8rem', marginBottom: '2rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.8rem' }}>Astronomical Calendar</h2>
      </AnimatedSection>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem', width: '100%' }}>
        {upcomingEvents.map((evt, i) => (
          <AnimatedCard key={evt.id} index={i} style={{ padding: '0', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {evt.imageUrl && (
              <div style={{ width: '100%', height: '140px' }}>
                <img src={evt.imageUrl} alt={evt.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            )}
            <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.8rem' }}>
                <span style={{ color: 'var(--gold)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{evt.dateStr}</span>
                <span style={{ 
                  fontSize: '0.7rem', padding: '0.2rem 0.6rem', borderRadius: '4px', textTransform: 'uppercase', fontWeight: 700,
                  border: `1px solid ${getVisibilityColor(evt.visibilityRating)}`, color: getVisibilityColor(evt.visibilityRating), background: `${getVisibilityColor(evt.visibilityRating)}15`
                }}>
                  {evt.visibilityRating} View
                </span>
              </div>
              <h3 style={{ fontSize: '1.3rem', marginBottom: '0.5rem' }}>{evt.title}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6, flex: 1 }}>{evt.description}</p>
              
              <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Event Type</span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)', background: 'rgba(255,255,255,0.05)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>{evt.type}</span>
              </div>
            </div>
          </AnimatedCard>
        ))}
      </div>
    </div>
  );
}
