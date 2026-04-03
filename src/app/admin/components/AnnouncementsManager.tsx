"use client";

import { useEffect, useState, useTransition } from "react";
import { inputStyle } from "./shared";
import { createAnnouncementAction, getAnnouncementRoleOptionsAction, getAnnouncementsAction } from "@/app/actions/announcements";

export default function AnnouncementsManager() {
  const [roleOptions, setRoleOptions] = useState<string[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [form, setForm] = useState({
    title: "",
    message: "",
    targetRoles: [] as string[],
    sendEmail: false,
    sendNotification: true,
  });
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const load = async () => {
    const [roles, announcements] = await Promise.all([getAnnouncementRoleOptionsAction(), getAnnouncementsAction()]);
    setRoleOptions(roles);
    setItems(announcements);
  };

  useEffect(() => {
    load().catch((error) => {
      console.error(error);
      setFeedback({ type: "error", message: "Failed to load announcements." });
    });
  }, []);

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h2 style={{ fontSize: "1.4rem" }}>Announcements</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Send targeted updates via notifications and optional email.</p>
        </div>
      </div>

      {feedback ? (
        <div style={{ marginBottom: "1rem", padding: "0.8rem 1rem", borderRadius: "8px", border: feedback.type === "success" ? "1px solid rgba(34,197,94,0.35)" : "1px solid rgba(239,68,68,0.35)", background: feedback.type === "success" ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)", color: feedback.type === "success" ? "#86efac" : "#fca5a5", fontSize: "0.85rem" }}>
          {feedback.message}
        </div>
      ) : null}

      <div style={{ background: "rgba(15,22,40,0.4)", padding: "1.5rem", borderRadius: "12px", border: "1px solid var(--border-subtle)", marginBottom: "1.5rem" }}>
        <div style={{ display: "grid", gap: "1rem" }}>
          <input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} placeholder="Announcement title" style={inputStyle} />
          <textarea value={form.message} onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))} rows={5} placeholder="Announcement message" style={{ ...inputStyle, resize: "vertical" }} />
          <div>
            <p style={{ marginBottom: "0.6rem", color: "var(--text-secondary)", fontSize: "0.85rem" }}>Target roles</p>
            <div style={{ display: "flex", gap: "0.8rem", flexWrap: "wrap" }}>
              {roleOptions.map((role) => {
                const checked = form.targetRoles.includes(role);
                return (
                  <label key={role} style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          targetRoles: event.target.checked
                            ? [...current.targetRoles, role]
                            : current.targetRoles.filter((item) => item !== role),
                        }))
                      }
                    />
                    <span>{role}</span>
                  </label>
                );
              })}
            </div>
          </div>
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <input type="checkbox" checked={form.sendEmail} onChange={(event) => setForm((current) => ({ ...current, sendEmail: event.target.checked }))} />
              <span>Send email</span>
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <input type="checkbox" checked={form.sendNotification} onChange={(event) => setForm((current) => ({ ...current, sendNotification: event.target.checked }))} />
              <span>Send notification</span>
            </label>
          </div>
          <button
            className="btn-primary"
            disabled={isPending}
            style={{ fontFamily: "inherit", cursor: "pointer", width: "fit-content" }}
            onClick={() =>
              startTransition(async () => {
                try {
                  await createAnnouncementAction(form);
                  setForm({ title: "", message: "", targetRoles: [], sendEmail: false, sendNotification: true });
                  setFeedback({ type: "success", message: "Announcement sent successfully." });
                  await load();
                } catch (error: any) {
                  console.error(error);
                  setFeedback({ type: "error", message: error.message || "Failed to send announcement." });
                }
              })
            }
          >
            {isPending ? "Sending..." : "Send Announcement"}
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gap: "0.9rem" }}>
        {items.map((item) => (
          <div key={item.id} style={{ background: "rgba(15,22,40,0.35)", border: "1px solid var(--border-subtle)", borderRadius: "10px", padding: "1rem 1.2rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
              <strong>{item.title}</strong>
              <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>{item.createdAt ? new Date(item.createdAt).toISOString().replace("T", " ").slice(0, 16) : ""}</span>
            </div>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", margin: "0.6rem 0" }}>{item.message}</p>
            <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", margin: 0 }}>
              Targets: {(item.targetRoles || []).join(", ") || "All"} · Email: {item.sendEmail ? "Yes" : "No"} · Notification: {item.sendNotification ? "Yes" : "No"}
            </p>
          </div>
        ))}
      </div>
    </>
  );
}
