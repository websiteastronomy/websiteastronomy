"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export default function ProjectTimeline(props: any) {
  const {
    projectId,
    SectionHeading,
    canAddTimeline,
    addingTimelineEvent,
    setAddingTimelineEvent,
    newTimelineForm,
    setNewTimelineForm,
    handleAddTimelineEvent,
    timelineFilter,
    setTimelineFilter,
    timelineLoading,
    timelineEvents,
    canDeleteTimeline,
    timelineEventToDelete,
    setTimelineEventToDelete,
    handleDeleteTimelineEvent,
    showFullPageLink = false,
  } = props;

  return (
    <div style={{ background: "rgba(15,22,40,0.4)", border: "1px solid var(--border-subtle)", borderRadius: "12px", padding: "1.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <SectionHeading icon="📍" title="Timeline & Milestones" />
          {showFullPageLink ? (
            <Link href={`/projects/${projectId}`} style={{ color: "var(--gold)", fontSize: "0.75rem", marginBottom: "1.5rem" }}>
              Open full page →
            </Link>
          ) : null}
        </div>
        {canAddTimeline && (
          <button onClick={() => setAddingTimelineEvent(!addingTimelineEvent)} style={{ background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.3)", color: "var(--gold)", borderRadius: "6px", padding: "0.4rem 0.8rem", fontSize: "0.75rem", cursor: "pointer", fontFamily: "inherit" }}>
            {addingTimelineEvent ? "Cancel" : "+ Add Event"}
          </button>
        )}
      </div>

      {addingTimelineEvent && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} style={{ background: "rgba(0,0,0,0.2)", border: "1px solid var(--border-subtle)", borderRadius: "8px", padding: "1rem", marginBottom: "1.5rem", display: "flex", flexDirection: "column", gap: "0.8rem" }}>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <input type="date" value={newTimelineForm.date} onChange={e => setNewTimelineForm({ ...newTimelineForm, date: e.target.value })} style={{ background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", borderRadius: "6px", padding: "0.4rem 0.6rem", color: "white", fontSize: "0.8rem", outline: "none" }} />
            <select value={newTimelineForm.typeTag} onChange={e => setNewTimelineForm({ ...newTimelineForm, typeTag: e.target.value })} style={{ background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", borderRadius: "6px", padding: "0.4rem 0.6rem", color: "white", fontSize: "0.8rem", outline: "none" }}>
              <option value="Update">Update</option>
              <option value="Milestone">Milestone</option>
              <option value="Issue">Issue</option>
              <option value="Success">Success</option>
            </select>
            <input placeholder="Event Title..." value={newTimelineForm.title} onChange={e => setNewTimelineForm({ ...newTimelineForm, title: e.target.value })} style={{ flex: 1, background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", borderRadius: "6px", padding: "0.4rem 0.6rem", color: "white", fontSize: "0.8rem", outline: "none" }} />
          </div>
          <textarea placeholder="Event Description..." value={newTimelineForm.description} onChange={e => setNewTimelineForm({ ...newTimelineForm, description: e.target.value })} rows={2} style={{ width: "100%", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", borderRadius: "6px", padding: "0.4rem 0.6rem", color: "white", fontSize: "0.8rem", outline: "none", resize: "vertical" }} />
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button onClick={handleAddTimelineEvent} className="btn-primary" style={{ padding: "0.4rem 1rem", fontSize: "0.8rem" }}>Save Event</button>
          </div>
        </motion.div>
      )}

      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "2rem" }}>
        {["All", "Milestone", "Update", "Issue", "Success"].map(f => (
          <button key={f} onClick={() => setTimelineFilter(f)} style={{ padding: "0.3rem 0.8rem", borderRadius: "20px", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer", border: timelineFilter === f ? "1px solid transparent" : "1px solid var(--border-subtle)", background: timelineFilter === f ? (f === "Milestone" ? "var(--gold)" : f === "Issue" ? "#ef4444" : f === "Success" ? "#22c55e" : f === "Update" ? "#3b82f6" : "rgba(255,255,255,0.2)") : "transparent", color: timelineFilter === f ? (f === "All" ? "white" : "#000") : "var(--text-secondary)" }}>{f}</button>
        ))}
      </div>

      {timelineLoading ? (
        <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>Loading timeline...</div>
      ) : timelineEvents.filter((e: any) => timelineFilter === "All" || e.typeTag === timelineFilter).length === 0 ? (
        <div style={{ textAlign: "center", padding: "3rem 0", opacity: 0.5 }}>
          <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>📅</div>
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>No timeline entries found.</p>
        </div>
      ) : (
        <div style={{ position: "relative" }}>
          <div style={{ position: "absolute", top: 0, bottom: 0, left: "14px", width: "2px", background: "var(--border-subtle)" }} />
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {timelineEvents.filter((e: any) => timelineFilter === "All" || e.typeTag === timelineFilter).map((update: any, idx: any) => {
              const isMilestone = update.typeTag === "Milestone";
              const tagColor = isMilestone ? "var(--gold)" : update.typeTag === "Issue" ? "#ef4444" : update.typeTag === "Success" ? "#22c55e" : "#3b82f6";

              return (
                <motion.div key={update.id} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.05 }} style={{ position: "relative", paddingLeft: "3rem" }}>
                  <div style={{ position: "absolute", left: isMilestone ? "4px" : "8px", top: isMilestone ? "4px" : "6px", width: isMilestone ? "22px" : "14px", height: isMilestone ? "22px" : "14px", borderRadius: "50%", background: tagColor, border: "4px solid rgba(8,12,22,1)", zIndex: 1, boxShadow: isMilestone ? `0 0 10px ${tagColor}` : "none" }} />

                  <div style={{ background: "rgba(8,12,22,0.5)", border: `1px solid ${isMilestone ? 'var(--gold)' : 'var(--border-subtle)'}`, borderRadius: "10px", padding: "1.2rem", position: "relative" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.4rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span style={{ color: tagColor, fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>{update.date}</span>
                        <span style={{ fontSize: "0.6rem", padding: "0.1rem 0.4rem", borderRadius: "4px", background: `${tagColor}22`, color: tagColor, fontWeight: 600 }}>{update.typeTag}</span>
                      </div>

                      {timelineEventToDelete === update.id ? (
                        <div style={{ display: "flex", gap: "0.3rem", alignItems: "center" }}>
                          <span style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>Sure?</span>
                          <button onClick={() => handleDeleteTimelineEvent(update.id)} style={{ background: "#ef4444", border: "none", color: "white", borderRadius: "4px", padding: "0.2rem 0.5rem", fontSize: "0.65rem", cursor: "pointer" }}>Yes</button>
                          <button onClick={() => setTimelineEventToDelete(null)} style={{ background: "transparent", border: "1px solid var(--border-subtle)", color: "var(--text-muted)", borderRadius: "4px", padding: "0.2rem 0.5rem", fontSize: "0.65rem", cursor: "pointer" }}>No</button>
                        </div>
                      ) : canDeleteTimeline ? (
                        <button onClick={() => setTimelineEventToDelete(update.id)} style={{ background: "transparent", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444", borderRadius: "4px", padding: "0.1rem 0.3rem", fontSize: "0.65rem", cursor: "pointer" }}>🗑</button>
                      ) : null}
                    </div>
                    <h4 style={{ fontSize: "1rem", marginBottom: "0.5rem", color: isMilestone ? "var(--gold-light)" : "white" }}>{update.title}</h4>
                    <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", lineHeight: 1.6 }}>{update.description}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
