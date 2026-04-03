"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import AnimatedSection from "@/components/AnimatedSection";
import { getMyObservationsAction } from "@/app/actions/observations-engine";
import { formatDateStable } from "@/lib/format-date";

export default function MyObservationsDashboard() {
  const { user } = useAuth();
  const [obsList, setObsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    getMyObservationsAction().then((data) => {
      setObsList(data);
      setLoading(false);
    }).catch(console.error);
  }, [user]);

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Published': return '#22c55e'; // Green
      case 'Core_Approved': 
      case 'Admin_Approved': return '#3b82f6'; // Blue
      case 'Under_Review': 
      case 'Submitted': return '#f59e0b'; // Amber
      case 'Rejected': return '#ef4444'; // Red
      case 'Draft': return '#a855f7'; // Purple
      default: return 'var(--text-muted)';
    }
  };

  if (!user) return null;

  return (
    <div style={{ padding: "4rem 2rem", maxWidth: "1200px", margin: "0 auto", minHeight: "80vh" }}>
      <AnimatedSection>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "3rem" }}>
          <div>
            <h1 className="page-title" style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>My <span className="gradient-text">Observations</span></h1>
            <p className="page-subtitle" style={{ margin: 0, fontSize: "1.1rem" }}>
              Track your telemetry and astrophotography submissions.
            </p>
          </div>
          <Link href="/portal/observations/new" className="btn-primary" style={{ padding: "0.8rem 1.5rem" }}>
            + Submit New Observation
          </Link>
        </div>
      </AnimatedSection>

      {loading ? (
        <div style={{ textAlign: "center", padding: "4rem", color: "var(--text-muted)" }}>Loading your archive...</div>
      ) : obsList.length === 0 ? (
        <div style={{ textAlign: "center", padding: "6rem 2rem", background: "rgba(15, 22, 40, 0.4)", borderRadius: "16px", border: "1px dashed var(--border-subtle)" }}>
          <div style={{ fontSize: "3rem", opacity: 0.5, marginBottom: "1rem" }}>🔭</div>
          <h3 style={{ fontSize: "1.3rem", marginBottom: "0.5rem" }}>Your Logbook is Empty</h3>
          <p style={{ color: "var(--text-muted)", marginBottom: "2rem" }}>You haven&apos;t submitted any observations yet. Share your captures with the club.</p>
          <Link href="/portal/observations/new" className="btn-secondary">Submit First Observation</Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {obsList.map((obs) => (
            <div key={obs.id} style={{ 
              background: "rgba(15, 22, 40, 0.6)", 
              borderRadius: "16px", 
              border: "1px solid var(--border-subtle)", 
              padding: "1.5rem",
              display: "flex", gap: "2rem", alignItems: "center"
            }}>
              {/* Thumbnail */}
              <div style={{ width: "120px", height: "120px", borderRadius: "12px", background: "#000", overflow: "hidden", flexShrink: 0 }}>
                {obs.imageThumbnailUrl ? (
                  <img src={obs.imageThumbnailUrl} alt={obs.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}>No Image</div>
                )}
              </div>
              
              {/* Info */}
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "0.5rem" }}>
                  <h3 style={{ fontSize: "1.3rem", margin: 0 }}>{obs.title}</h3>
                  <span style={{ 
                    background: `${getStatusColor(obs.status)}20`, 
                    color: getStatusColor(obs.status), 
                    padding: "0.2rem 0.8rem", 
                    borderRadius: "20px", 
                    fontSize: "0.75rem", 
                    fontWeight: 700, 
                    border: `1px solid ${getStatusColor(obs.status)}50` 
                  }}>
                    {obs.status.replace("_", " ")}
                  </span>
                </div>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", marginBottom: "0.5rem" }}>
                  <strong>Target:</strong> {obs.celestialTarget} &nbsp;|&nbsp; <strong>Category:</strong> {obs.category}
                </p>
                <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", margin: 0 }}>
                  Captured: {formatDateStable(obs.capturedAt)} at {obs.location}
                </p>
                
                {obs.status === 'Rejected' && obs.rejectionReason && (
                 <div style={{ marginTop: "1rem", padding: "0.8rem", background: "rgba(239, 68, 68, 0.1)", borderLeft: "3px solid #ef4444", borderRadius: "4px", fontSize: "0.85rem", color: "#fca5a5" }}>
                   <strong>Moderation Note:</strong> {obs.rejectionReason}
                 </div>
                )}
              </div>

              {/* Actions */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
                {(obs.status === 'Draft' || obs.status === 'Rejected') && (
                  <Link href={`/portal/observations/${obs.id}/edit`} className="btn-secondary" style={{ padding: "0.6rem 1rem", fontSize: "0.8rem", textAlign: "center" }}>
                    Edit & Resubmit
                  </Link>
                )}
                <Link href={`/observations/${obs.id}`} className="nav-link" style={{ fontSize: "0.85rem", color: "var(--gold)" }}>
                  Preview Layout →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
