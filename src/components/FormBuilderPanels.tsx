"use client";

import type { CSSProperties } from "react";
import { useState } from "react";
import { formatDateStable } from "@/lib/format-date";
import type {
  FormAnalytics,
  FormContent,
  FormQuestionType,
  FormResponseView,
  FormStatus,
} from "@/app/actions/files";

type FormQuestion = FormContent["fields"][number];

type QuestionsEditorProps = {
  formName: string;
  formDraft: Record<string, unknown>;
  canEdit: boolean;
  onChange: (updater: (current: Record<string, unknown>) => Record<string, unknown>) => void;
};

type SettingsPanelProps = {
  formId: string;
  formDraft: Record<string, unknown>;
  canEdit: boolean;
  onChange: (updater: (current: Record<string, unknown>) => Record<string, unknown>) => void;
};

type ResponsesPanelProps = {
  responses: FormResponseView[];
};

type AnalyticsPanelProps = {
  analytics: FormAnalytics | null;
};

const baseCardStyle: CSSProperties = {
  border: "1px solid var(--border-subtle)",
  borderRadius: "12px",
  padding: "1rem",
  background: "rgba(0,0,0,0.18)",
};

function getQuestions(formDraft: Record<string, unknown>) {
  return (((formDraft.questions as FormQuestion[] | undefined) || (formDraft.fields as FormQuestion[] | undefined) || []) as FormQuestion[]).map((question) => ({
    ...question,
    options: Array.isArray(question.options) ? question.options : [],
  }));
}

function getSettings(formDraft: Record<string, unknown>) {
  const settings = ((formDraft.settings as FormContent["settings"] | undefined) || {}) as Partial<FormContent["settings"]>;
  return {
    allowMultiple: settings.allowMultiple === true,
    requireLogin: settings.requireLogin === true,
    collectEmail: settings.collectEmail !== false,
    paymentEnabled: settings.paymentEnabled === true,
    amount: Number(settings.amount || 0),
    deadline: typeof settings.deadline === "string" ? settings.deadline : "",
    notifyOnSubmit: settings.notifyOnSubmit !== false,
    announcementEnabled: settings.announcementEnabled === true,
    emailEnabled: settings.emailEnabled === true,
  } satisfies FormContent["settings"];
}

function getStatus(formDraft: Record<string, unknown>): FormStatus {
  return formDraft.status === "published" ? "published" : "draft";
}

function toDateTimeInput(value: string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60000);
  return localDate.toISOString().slice(0, 16);
}

function fromDateTimeInput(value: string) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function SimpleBarChart({ values }: { values: Array<{ label: string; count: number }> }) {
  const max = Math.max(1, ...values.map((item) => item.count));
  return (
    <div style={{ display: "grid", gap: "0.65rem" }}>
      {values.map((item) => (
        <div key={item.label} style={{ display: "grid", gridTemplateColumns: "160px 1fr auto", gap: "0.75rem", alignItems: "center" }}>
          <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>{item.label}</div>
          <div style={{ height: "12px", borderRadius: "999px", background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
            <div style={{ width: `${(item.count / max) * 100}%`, height: "100%", background: "linear-gradient(90deg, var(--gold), #60a5fa)" }} />
          </div>
          <div style={{ fontSize: "0.8rem", color: "var(--text-primary)" }}>{item.count}</div>
        </div>
      ))}
    </div>
  );
}

export function FormQuestionsEditor({ formName, formDraft, canEdit, onChange }: QuestionsEditorProps) {
  const questions = getQuestions(formDraft);

  const updateQuestion = (questionId: string, patch: Partial<FormQuestion>) => {
    const next = questions.map((question) => (question.id === questionId ? { ...question, ...patch } : question));
    onChange((current) => ({ ...current, questions: next, fields: next }));
  };

  const removeQuestion = (questionId: string) => {
    const next = questions.filter((question) => question.id !== questionId);
    onChange((current) => ({ ...current, questions: next, fields: next }));
  };

  const addQuestion = () => {
    const id = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}`;
    const next = [...questions, { id, label: "Untitled question", type: "short_answer" as FormQuestionType, required: false, options: [] }];
    onChange((current) => ({ ...current, questions: next, fields: next }));
  };

  return (
    <div style={{ display: "grid", gap: "0.9rem" }}>
      <input
        value={String(formDraft.title || formName)}
        onChange={(event) => onChange((current) => ({ ...current, title: event.target.value }))}
        disabled={!canEdit}
        placeholder="Form title"
        style={{ padding: "0.7rem 0.9rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", borderRadius: "8px", color: "var(--text-primary)", fontFamily: "inherit" }}
      />
      <textarea
        value={String(formDraft.description || "")}
        onChange={(event) => onChange((current) => ({ ...current, description: event.target.value }))}
        disabled={!canEdit}
        placeholder="Form description"
        style={{ minHeight: "90px", padding: "0.7rem 0.9rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", borderRadius: "8px", color: "var(--text-primary)", fontFamily: "inherit", resize: "vertical" }}
      />
      {questions.map((question, index) => (
        <div key={question.id} style={baseCardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem", marginBottom: "0.75rem", alignItems: "center" }}>
            <strong style={{ fontSize: "0.82rem" }}>Question {index + 1}</strong>
            {canEdit ? <button onClick={() => removeQuestion(question.id)} style={{ background: "transparent", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444", borderRadius: "6px", padding: "0.25rem 0.55rem", fontSize: "0.72rem", cursor: "pointer" }}>Delete</button> : null}
          </div>
          <div style={{ display: "grid", gap: "0.6rem" }}>
            <input
              value={question.label}
              onChange={(event) => updateQuestion(question.id, { label: event.target.value })}
              disabled={!canEdit}
              placeholder="Question label"
              style={{ padding: "0.7rem 0.9rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", borderRadius: "8px", color: "var(--text-primary)", fontFamily: "inherit" }}
            />
            {canEdit ? (
              <div style={{ display: "grid", gridTemplateColumns: "170px 1fr", gap: "0.6rem" }}>
                <select
                  value={question.type}
                  onChange={(event) => updateQuestion(question.id, { type: event.target.value as FormQuestionType })}
                  style={{ padding: "0.65rem 0.8rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", borderRadius: "8px", color: "var(--text-primary)", fontFamily: "inherit" }}
                >
                  <option value="short_answer">Short answer</option>
                  <option value="paragraph">Paragraph</option>
                  <option value="multiple_choice">Multiple choice</option>
                  <option value="checkbox">Checkbox</option>
                </select>
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                  <input type="checkbox" checked={Boolean(question.required)} onChange={(event) => updateQuestion(question.id, { required: event.target.checked })} />
                  Required
                </label>
              </div>
            ) : null}
            {question.type === "multiple_choice" ? (
              <textarea
                value={(question.options || []).join("\n")}
                onChange={(event) => updateQuestion(question.id, { options: event.target.value.split("\n").map((option) => option.trim()).filter(Boolean) })}
                disabled={!canEdit}
                placeholder="One option per line"
                style={{ minHeight: "80px", padding: "0.7rem 0.9rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", borderRadius: "8px", color: "var(--text-primary)", fontFamily: "inherit" }}
              />
            ) : null}
          </div>
        </div>
      ))}
      {canEdit ? <button onClick={addQuestion} style={{ justifySelf: "start", background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.3)", color: "var(--gold)", borderRadius: "6px", padding: "0.45rem 0.85rem", fontSize: "0.78rem", cursor: "pointer", fontFamily: "inherit" }}>Add Question</button> : null}
    </div>
  );
}

export function FormSettingsPanel({ formId, formDraft, canEdit, onChange }: SettingsPanelProps) {
  const settings = getSettings(formDraft);
  const status = getStatus(formDraft);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");
  const formLink = `/forms/${formId}`;

  const patchSettings = (patch: Partial<FormContent["settings"]>) =>
    onChange((current) => ({ ...current, settings: { ...getSettings(current), ...patch } }));

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${formLink}`);
      setCopyState("copied");
      window.setTimeout(() => setCopyState("idle"), 1800);
    } catch {
      setCopyState("error");
    }
  };

  return (
    <div style={{ display: "grid", gap: "0.85rem", alignContent: "start" }}>
      <div style={baseCardStyle}>
        <h4 style={{ margin: "0 0 0.75rem", fontSize: "0.9rem", color: "var(--gold-light)" }}>Settings</h4>
        <div style={{ display: "grid", gap: "0.75rem" }}>
          <label style={{ display: "grid", gap: "0.35rem", fontSize: "0.78rem", color: "var(--text-secondary)" }}>
            Mode
            <select value={String(formDraft.mode || "internal")} disabled={!canEdit} onChange={(event) => onChange((current) => ({ ...current, mode: event.target.value }))} style={{ padding: "0.7rem 0.8rem", background: "rgba(0,0,0,0.28)", border: "1px solid var(--border-subtle)", borderRadius: "8px", color: "white" }}>
              <option value="internal">Internal</option>
              <option value="external">External</option>
              <option value="hybrid">Hybrid</option>
            </select>
          </label>
          <label style={{ display: "grid", gap: "0.35rem", fontSize: "0.78rem", color: "var(--text-secondary)" }}>
            Deadline
            <input type="datetime-local" disabled={!canEdit} value={toDateTimeInput(settings.deadline)} onChange={(event) => patchSettings({ deadline: fromDateTimeInput(event.target.value) })} style={{ padding: "0.7rem 0.8rem", background: "rgba(0,0,0,0.28)", border: "1px solid var(--border-subtle)", borderRadius: "8px", color: "white" }} />
          </label>
          {[
            ["allowMultiple", "Allow multiple responses"],
            ["requireLogin", "Require login"],
            ["collectEmail", "Collect email"],
            ["paymentEnabled", "Enable payment"],
            ["notifyOnSubmit", "Enable notifications"],
            ["announcementEnabled", "Send as announcement"],
            ["emailEnabled", "Send email notification"],
          ].map(([key, label]) => (
            <label key={key} style={{ display: "flex", alignItems: "center", gap: "0.55rem", fontSize: "0.78rem", color: "var(--text-secondary)" }}>
              <input type="checkbox" disabled={!canEdit} checked={Boolean(settings[key as keyof FormContent["settings"]])} onChange={(event) => patchSettings({ [key]: event.target.checked } as Partial<FormContent["settings"]>)} />
              {label}
            </label>
          ))}
          <label style={{ display: "grid", gap: "0.35rem", fontSize: "0.78rem", color: "var(--text-secondary)" }}>
            Amount
            <input type="number" min="0" disabled={!canEdit} value={settings.amount} onChange={(event) => patchSettings({ amount: Number(event.target.value || 0) })} style={{ padding: "0.7rem 0.8rem", background: "rgba(0,0,0,0.28)", border: "1px solid var(--border-subtle)", borderRadius: "8px", color: "white" }} />
          </label>
        </div>
      </div>

      <div style={baseCardStyle}>
        <h4 style={{ margin: "0 0 0.75rem", fontSize: "0.9rem", color: "var(--gold-light)" }}>Publishing</h4>
        <div style={{ display: "grid", gap: "0.7rem" }}>
          <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
            Status: <strong style={{ color: status === "published" ? "#86efac" : "#fbbf24", textTransform: "capitalize" }}>{status}</strong>
          </div>
          {canEdit ? (
            <button
              onClick={() => onChange((current) => ({ ...current, status: getStatus(current) === "published" ? "draft" : "published" }))}
              style={{ background: status === "published" ? "rgba(239,68,68,0.12)" : "rgba(34,197,94,0.12)", border: `1px solid ${status === "published" ? "rgba(239,68,68,0.3)" : "rgba(34,197,94,0.3)"}`, color: status === "published" ? "#fca5a5" : "#86efac", borderRadius: "8px", padding: "0.65rem 0.8rem", cursor: "pointer", fontFamily: "inherit" }}
            >
              {status === "published" ? "Unpublish" : "Publish"}
            </button>
          ) : null}
          {status === "published" ? (
            <div style={{ display: "grid", gap: "0.55rem" }}>
              <button onClick={() => void handleCopy()} style={{ background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.3)", color: "#93c5fd", borderRadius: "8px", padding: "0.65rem 0.8rem", cursor: "pointer", fontFamily: "inherit" }}>
                {copyState === "copied" ? "Link Copied" : copyState === "error" ? "Copy Failed" : "Copy Link"}
              </button>
              <a href={formLink} target="_blank" rel="noreferrer" style={{ textAlign: "center", background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.3)", color: "var(--gold)", borderRadius: "8px", padding: "0.65rem 0.8rem", textDecoration: "none", fontSize: "0.9rem" }}>
                Open Form
              </a>
            </div>
          ) : (
            <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>Publish the form to enable the shareable link.</div>
          )}
        </div>
      </div>
    </div>
  );
}

export function FormResponsesPanel({ responses }: ResponsesPanelProps) {
  const [selectedResponseId, setSelectedResponseId] = useState<string | null>(responses[0]?.id || null);
  const selectedResponse = responses.find((response) => response.id === selectedResponseId) || responses[0] || null;

  return (
    <div style={{ display: "grid", gap: "1rem" }}>
      <div style={{ overflowX: "auto", ...baseCardStyle }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
          <thead>
            <tr style={{ textAlign: "left", color: "var(--text-muted)" }}>
              <th style={{ padding: "0.65rem 0.4rem" }}>Name</th>
              <th style={{ padding: "0.65rem 0.4rem" }}>Email</th>
              <th style={{ padding: "0.65rem 0.4rem" }}>Date</th>
              <th style={{ padding: "0.65rem 0.4rem" }}>Payment Status</th>
            </tr>
          </thead>
          <tbody>
            {responses.map((response) => (
              <tr key={response.id} onClick={() => setSelectedResponseId(response.id)} style={{ borderTop: "1px solid var(--border-subtle)", cursor: "pointer", background: selectedResponse?.id === response.id ? "rgba(201,168,76,0.06)" : "transparent" }}>
                <td style={{ padding: "0.65rem 0.4rem" }}>{response.submitterName}</td>
                <td style={{ padding: "0.65rem 0.4rem" }}>{response.submitterEmail || "Not collected"}</td>
                <td style={{ padding: "0.65rem 0.4rem" }}>{formatDateStable(response.createdAt)}</td>
                <td style={{ padding: "0.65rem 0.4rem", textTransform: "capitalize" }}>{response.paymentStatus}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {responses.length === 0 ? <div style={{ paddingTop: "1rem", color: "var(--text-muted)", fontSize: "0.82rem" }}>No submissions yet.</div> : null}
      </div>

      <div style={baseCardStyle}>
        <h4 style={{ margin: "0 0 0.75rem", fontSize: "0.95rem", color: "var(--gold-light)" }}>Detailed Response</h4>
        {!selectedResponse ? (
          <div style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>Select a response to view details.</div>
        ) : (
          <div style={{ display: "grid", gap: "0.8rem" }}>
            <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>
              {selectedResponse.submitterName}
              {selectedResponse.submitterEmail ? ` • ${selectedResponse.submitterEmail}` : ""}
              {` • ${formatDateStable(selectedResponse.createdAt)}`}
            </div>
            {selectedResponse.answerViews.map((item) => (
              <div key={item.questionId} style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "0.8rem" }}>
                <div style={{ color: "var(--gold-light)", fontSize: "0.84rem", marginBottom: "0.35rem" }}>Q: {item.question}</div>
                <div style={{ color: "var(--text-primary)", fontSize: "0.88rem" }}>A: {item.answer}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function FormAnalyticsPanel({ analytics }: AnalyticsPanelProps) {
  if (!analytics) {
    return <div style={{ color: "var(--text-muted)" }}>Loading analytics...</div>;
  }

  return (
    <div style={{ display: "grid", gap: "1rem" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.85rem" }}>
        {[
          { label: "Total Responses", value: analytics.totalResponses },
          { label: "Completed Payments", value: analytics.completedPayments },
          { label: "Pending Payments", value: analytics.pendingPayments },
          { label: "Internal vs External", value: `${analytics.internalResponses} / ${analytics.externalResponses}` },
        ].map((card) => (
          <div key={card.label} style={baseCardStyle}>
            <div style={{ color: "var(--text-muted)", fontSize: "0.75rem", marginBottom: "0.4rem" }}>{card.label}</div>
            <div style={{ color: "var(--text-primary)", fontSize: "1.5rem", fontWeight: 700 }}>{card.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gap: "1rem" }}>
        {analytics.questions.map((question) => (
          <div key={question.questionId} style={baseCardStyle}>
            <div style={{ color: "var(--gold-light)", fontSize: "0.95rem", marginBottom: "0.25rem" }}>{question.question}</div>
            <div style={{ color: "var(--text-muted)", fontSize: "0.78rem", marginBottom: "0.85rem", textTransform: "capitalize" }}>{question.type.replaceAll("_", " ")} • {question.totalResponses} responses</div>
            {question.options ? (
              <SimpleBarChart values={question.options} />
            ) : (
              <div style={{ display: "grid", gap: "0.5rem" }}>
                {(question.answers || []).length === 0 ? (
                  <div style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>No answers yet.</div>
                ) : (
                  (question.answers || []).map((answer, index) => (
                    <div key={`${question.questionId}-${index}`} style={{ padding: "0.7rem 0.85rem", borderRadius: "10px", background: "rgba(255,255,255,0.04)", color: "var(--text-primary)", fontSize: "0.84rem" }}>
                      {answer}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
