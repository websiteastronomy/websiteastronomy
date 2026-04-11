"use client";

import Link from "next/link";

export default function ProjectDiscussion(props: any) {
  const {
    projectId,
    SectionHeading,
    discMessages,
    canPinMessage,
    handleTogglePin,
    renderDiscussionText,
    discLoading,
    canDeleteAnyMsg,
    setReplyingTo,
    formatTimeAgo,
    handleDeleteDiscussion,
    replyingTo,
    setReplyingTo: clearReplyingTo,
    discInput,
    setDiscInput,
    handleSendDiscussion,
    showFullPageLink = false,
  } = props;

  return (
    <div style={{ background: "rgba(15,22,40,0.4)", border: "1px solid var(--border-subtle)", borderRadius: "12px", padding: "1.5rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
        <SectionHeading icon="💬" title="Discussion Panel" />
        {showFullPageLink ? (
          <Link href={`/projects/${projectId}`} style={{ color: "var(--gold)", fontSize: "0.75rem", marginBottom: "1.5rem" }}>
            Open full page →
          </Link>
        ) : null}
      </div>

      {discMessages.filter((m: any) => m.isPinned).length > 0 && (
        <div style={{ marginBottom: "1.5rem", padding: "1rem", background: "rgba(201,168,76,0.05)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: "8px" }}>
          <h4 style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--gold)", marginBottom: "0.8rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span>📌</span> Pinned Messages
          </h4>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
            {discMessages.filter((m: any) => m.isPinned).map((msg: any) => (
              <div key={`pin-${msg.id}`} style={{ display: "flex", gap: "0.75rem", background: "rgba(0,0,0,0.2)", padding: "0.8rem", borderRadius: "8px" }}>
                <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "var(--gold)", display: "flex", alignItems: "center", justifyContent: "center", color: "#000", fontWeight: 700, fontSize: "0.6rem", flexShrink: 0 }}>{msg.authorAvatar}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.2rem" }}>
                    <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--gold-light)" }}>{msg.authorName}</span>
                    {canPinMessage && <button onClick={() => handleTogglePin(msg.id, msg.isPinned)} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "0.7rem", padding: 0 }}>Unpin</button>}
                  </div>
                  <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", lineHeight: 1.5, margin: 0 }}>{renderDiscussionText(msg.text)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "1.2rem", marginBottom: "1.5rem", maxHeight: "400px", overflowY: "auto", paddingRight: "0.5rem", scrollbarWidth: "thin" }}>
        {discLoading ? (
          <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>Loading discussion...</div>
        ) : discMessages.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem 0", opacity: 0.5 }}>
            <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>💭</div>
            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          discMessages.filter((m: any) => !m.replyToId).map((msg: any) => (
            <div key={msg.id} style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <div style={{ display: "flex", gap: "0.75rem" }}>
                <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "var(--gold-dark)", display: "flex", alignItems: "center", justifyContent: "center", color: "#000", fontWeight: 700, fontSize: "0.75rem", flexShrink: 0 }}>{msg.authorAvatar}</div>
                <div style={{ flex: 1, background: "rgba(8,12,22,0.5)", border: "1px solid var(--border-subtle)", borderRadius: "0 10px 10px 10px", padding: "0.8rem", position: "relative" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.4rem" }}>
                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "baseline" }}>
                      <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--gold-light)" }}>{msg.authorName}</span>
                      <span style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>{formatTimeAgo(msg.createdAt)}</span>
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                      <button onClick={() => setReplyingTo({ id: msg.id, name: msg.authorName })} style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: "0.7rem", cursor: "pointer", padding: "0" }}>↩ Reply</button>
                      {canPinMessage && <button onClick={() => handleTogglePin(msg.id, msg.isPinned)} style={{ background: "none", border: "none", color: msg.isPinned ? "var(--gold)" : "var(--text-muted)", fontSize: "0.7rem", cursor: "pointer", padding: "0" }}>📌</button>}
                      {canDeleteAnyMsg && <button onClick={() => handleDeleteDiscussion(msg.id)} style={{ background: "none", border: "none", color: "#ef4444", fontSize: "0.7rem", cursor: "pointer", padding: "0", opacity: 0.7 }}>🗑</button>}
                    </div>
                  </div>
                  <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.5, margin: 0, whiteSpace: "pre-wrap" }}>{renderDiscussionText(msg.text)}</p>
                </div>
              </div>

              {discMessages.filter((r: any) => r.replyToId === msg.id).length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", paddingLeft: "2.5rem", position: "relative" }}>
                  <div style={{ position: "absolute", left: "15px", top: "-10px", bottom: "20px", width: "2px", background: "var(--border-subtle)" }} />
                  {discMessages.filter((r: any) => r.replyToId === msg.id).map((reply: any) => (
                    <div key={reply.id} style={{ display: "flex", gap: "0.5rem", position: "relative" }}>
                      <div style={{ position: "absolute", left: "-1.5rem", top: "12px", width: "1rem", height: "2px", background: "var(--border-subtle)" }} />
                      <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "var(--text-muted)", display: "flex", alignItems: "center", justifyContent: "center", color: "#000", fontWeight: 700, fontSize: "0.6rem", flexShrink: 0 }}>{reply.authorAvatar}</div>
                      <div style={{ flex: 1, background: "rgba(0,0,0,0.2)", border: "1px solid var(--border-subtle)", borderRadius: "0 8px 8px 8px", padding: "0.6rem" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.3rem" }}>
                          <div style={{ display: "flex", gap: "0.5rem", alignItems: "baseline" }}>
                            <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--gold-light)", opacity: 0.9 }}>{reply.authorName}</span>
                            <span style={{ fontSize: "0.6rem", color: "var(--text-muted)" }}>{formatTimeAgo(reply.createdAt)}</span>
                          </div>
                          <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
                            {canPinMessage && <button onClick={() => handleTogglePin(reply.id, reply.isPinned)} style={{ background: "none", border: "none", color: reply.isPinned ? "var(--gold)" : "var(--text-muted)", fontSize: "0.65rem", cursor: "pointer", padding: "0" }}>📌</button>}
                            {canDeleteAnyMsg && <button onClick={() => handleDeleteDiscussion(reply.id)} style={{ background: "none", border: "none", color: "#ef4444", fontSize: "0.65rem", cursor: "pointer", padding: "0", opacity: 0.7 }}>🗑</button>}
                          </div>
                        </div>
                        <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", lineHeight: 1.4, margin: 0, whiteSpace: "pre-wrap" }}>{renderDiscussionText(reply.text)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {replyingTo && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(201,168,76,0.1)", border: "1px solid var(--border-subtle)", borderRadius: "6px", padding: "0.4rem 0.8rem" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Replying to <strong style={{ color: "var(--gold-light)" }}>{replyingTo.name}</strong></span>
            <button onClick={() => clearReplyingTo(null)} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "0.7rem", padding: "0" }}>✕ Cancel</button>
          </div>
        )}
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <input value={discInput} onChange={e => setDiscInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && discInput.trim()) handleSendDiscussion(); }} placeholder={replyingTo ? "Write a reply... (Enter to send)" : "Write a message... Use @user, #topic, /action, $file"} style={{ flex: 1, padding: "0.75rem 1rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", borderRadius: "8px", color: "var(--text-primary)", fontFamily: "inherit", fontSize: "0.85rem", outline: "none" }} />
          <button onClick={handleSendDiscussion} className="btn-primary" style={{ padding: "0.75rem 1.2rem", fontSize: "0.8rem" }}>Send</button>
        </div>
      </div>
    </div>
  );
}
