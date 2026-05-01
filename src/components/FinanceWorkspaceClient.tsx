"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import {
  addExpenseAction,
  getExpensesAction,
  getFinanceAccessSnapshotAction,
  getFinanceDashboardAction,
  updateExpenseStatusAction,
} from "@/app/actions/finance";
import { formatFileSize } from "@/lib/client-upload-images";
import { uploadFileDirect } from "@/lib/direct-upload";
import { inputStyle } from "@/app/admin/components/shared";
import { useAuth } from "@/context/AuthContext";

type FinanceWorkspaceClientProps = {
  embedded?: boolean;
};

type FinanceAccessSnapshot = {
  roleName: string;
  isAdmin: boolean;
  isFinanceHead: boolean;
  canSubmitExpenses: boolean;
  canApproveExpenses: boolean;
  canViewFinance: boolean;
  canExportFinance: boolean;
};

type ExpenseRow = {
  id: string;
  title: string;
  amount: number;
  category: string;
  projectId: string | null;
  paidTo: string;
  receiptUrl: string;
  status: string;
  createdBy: string;
  approvedBy: string | null;
  createdAt: Date | null;
  projectTitle?: string | null;
  createdByName?: string | null;
};

type FinanceDashboard = {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  recentExpenses: ExpenseRow[];
};

type ExpenseFormState = {
  title: string;
  amount: string;
  category: string;
  projectId: string;
  paidTo: string;
};

function formatMoney(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

function formatDate(value: Date | string | null | undefined) {
  if (!value) return "Unknown";
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function getStatusStyle(status: string) {
  const normalized = String(status || "").toLowerCase();
  if (normalized === "approved") {
    return { background: "rgba(34,197,94,0.12)", color: "#86efac" };
  }
  if (normalized === "pending") {
    return { background: "rgba(251,191,36,0.12)", color: "#fbbf24" };
  }
  return { background: "rgba(239,68,68,0.12)", color: "#fca5a5" };
}

export default function FinanceWorkspaceClient({ embedded = false }: FinanceWorkspaceClientProps) {
  const { user, loading } = useAuth();
  const userId = user?.id ?? null;
  const [access, setAccess] = useState<FinanceAccessSnapshot | null>(null);
  const [dashboard, setDashboard] = useState<FinanceDashboard | null>(null);
  const [expenses, setExpenses] = useState<ExpenseRow[]>([]);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [expenseForm, setExpenseForm] = useState<ExpenseFormState>({
    title: "",
    amount: "",
    category: "",
    projectId: "",
    paidTo: "",
  });
  const [expenseReceipt, setExpenseReceipt] = useState<File | null>(null);
  const [receiptUploadProgress, setReceiptUploadProgress] = useState(0);

  const load = () =>
    startTransition(async () => {
      try {
        setErrorMessage(null);
        const snapshot = await getFinanceAccessSnapshotAction();
        setAccess(snapshot);

        const [expenseRows, dashboardData] = await Promise.all([
          snapshot.canSubmitExpenses || snapshot.canApproveExpenses ? getExpensesAction() : Promise.resolve([]),
          snapshot.canViewFinance ? getFinanceDashboardAction() : Promise.resolve(null),
        ]);

        setExpenses(expenseRows as ExpenseRow[]);
        setDashboard(dashboardData as FinanceDashboard | null);
      } catch (error: any) {
        console.error(error);
        setErrorMessage(error?.message || "Failed to load finance workspace.");
      }
    });

  useEffect(() => {
    if (userId) {
      load();
    }
  }, [userId]);

  const tabs = useMemo(
    () =>
      [
        { id: "dashboard", label: "Dashboard", visible: Boolean(access?.canViewFinance) },
        { id: "expenses", label: "Expenses", visible: Boolean(access?.canSubmitExpenses || access?.canApproveExpenses) },
        { id: "reports", label: "Reports", visible: Boolean(access?.canExportFinance) },
      ].filter((tab) => tab.visible),
    [access]
  );

  useEffect(() => {
    if (tabs.length && !tabs.some((tab) => tab.id === activeTab)) {
      setActiveTab(tabs[0].id);
    }
  }, [tabs, activeTab]);

  const handleExpenseSubmit = () =>
    startTransition(async () => {
      try {
        setErrorMessage(null);
        setSuccessMessage(null);

        if (!expenseReceipt) {
          throw new Error("Receipt upload is required.");
        }

        const receipt = await uploadFileDirect(
          expenseReceipt,
          {
            category: "finance_receipts",
            fileName: expenseReceipt.name,
            fileType: expenseReceipt.type,
            fileSize: expenseReceipt.size,
            isPublic: false,
          },
          {
            onProgress: setReceiptUploadProgress,
          }
        );

        await addExpenseAction({
          title: expenseForm.title,
          amount: Number(expenseForm.amount || 0),
          category: expenseForm.category,
          projectId: expenseForm.projectId || null,
          paidTo: expenseForm.paidTo,
          receiptUrl: receipt.fileUrl,
        });

        setExpenseForm({ title: "", amount: "", category: "", projectId: "", paidTo: "" });
        setExpenseReceipt(null);
        setSuccessMessage("Expense submitted for finance review.");
        load();
      } catch (error: any) {
        console.error(error);
        setErrorMessage(error?.message || "Failed to submit expense.");
      } finally {
        setReceiptUploadProgress(0);
      }
    });

  const handleExpenseDecision = (expenseId: string, status: "approved" | "rejected") =>
    startTransition(async () => {
      try {
        setErrorMessage(null);
        setSuccessMessage(null);
        await updateExpenseStatusAction(expenseId, status);
        setSuccessMessage(`Expense ${status}.`);
        load();
      } catch (error: any) {
        console.error(error);
        setErrorMessage(error?.message || "Failed to update expense.");
      }
    });

  const approvedExpenses = expenses.filter((expense) => expense.status === "approved").length;
  const pendingExpenses = expenses.filter((expense) => expense.status === "pending").length;

  if (!loading && !userId) {
    return (
      <div style={{ display: "grid", gap: "1rem" }}>
        <div style={{ padding: "1rem 1.1rem", borderRadius: "14px", border: "1px solid rgba(239,68,68,0.25)", background: "rgba(239,68,68,0.08)", color: "#fca5a5" }}>
          You need to sign in before using the finance workspace.
        </div>
        <div style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
          Open the login page to authenticate, then return here.
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: "1.25rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap", alignItems: "flex-start" }}>
        <div>
          <h2 style={{ fontSize: embedded ? "1.4rem" : "1.8rem", marginBottom: "0.35rem" }}>Finance Control</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.88rem", maxWidth: "760px", lineHeight: 1.7 }}>
            Expenses stay pending until a Finance Head or Admin reviews them.
          </p>
        </div>
        {access ? (
          <div style={{ display: "flex", gap: "0.45rem", flexWrap: "wrap" }}>
            <span style={{ padding: "0.35rem 0.7rem", borderRadius: "999px", background: "rgba(59,130,246,0.12)", color: "#93c5fd", fontSize: "0.78rem" }}>
              Role: {access.roleName || "Member"}
            </span>
            {access.isFinanceHead ? (
              <span style={{ padding: "0.35rem 0.7rem", borderRadius: "999px", background: "rgba(34,197,94,0.12)", color: "#86efac", fontSize: "0.78rem" }}>
                Finance Head Access
              </span>
            ) : null}
          </div>
        ) : null}
      </div>

      {errorMessage ? (
        <div style={{ padding: "0.85rem 1rem", borderRadius: "10px", border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.08)", color: "#fca5a5" }}>
          {errorMessage}
        </div>
      ) : null}
      {successMessage ? (
        <div style={{ padding: "0.85rem 1rem", borderRadius: "10px", border: "1px solid rgba(34,197,94,0.3)", background: "rgba(34,197,94,0.08)", color: "#86efac" }}>
          {successMessage}
        </div>
      ) : null}

      <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: "0.6rem 0.9rem",
              borderRadius: "999px",
              border: activeTab === tab.id ? "1px solid rgba(201,168,76,0.45)" : "1px solid var(--border-subtle)",
              background: activeTab === tab.id ? "rgba(201,168,76,0.12)" : "rgba(15,22,40,0.35)",
              color: activeTab === tab.id ? "var(--gold-light)" : "var(--text-secondary)",
              cursor: "pointer",
              fontFamily: "inherit",
              fontSize: "0.82rem",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "dashboard" && access?.canViewFinance ? (
        <div style={{ display: "grid", gap: "1rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: "0.9rem" }}>
            {[
              { label: "Total Income", value: formatMoney(dashboard?.totalIncome || 0) },
              { label: "Total Expenses", value: formatMoney(dashboard?.totalExpenses || 0) },
              { label: "Net Balance", value: formatMoney(dashboard?.balance || 0) },
              { label: "Pending Expenses", value: String(pendingExpenses) },
              { label: "Approved Expenses", value: String(approvedExpenses) },
            ].map((card) => (
              <div key={card.label} style={{ padding: "1rem 1.1rem", borderRadius: "14px", border: "1px solid var(--border-subtle)", background: "rgba(12,18,34,0.55)" }}>
                <div style={{ color: "var(--text-muted)", fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>{card.label}</div>
                <div style={{ marginTop: "0.45rem", fontSize: "1.5rem", fontWeight: 700, color: "var(--text-primary)" }}>{card.value}</div>
              </div>
            ))}
          </div>

          <div style={{ padding: "1rem 1.1rem", borderRadius: "14px", border: "1px solid var(--border-subtle)", background: "rgba(12,18,34,0.55)" }}>
            <h3 style={{ margin: "0 0 0.75rem", fontSize: "1rem" }}>Recent Expenses</h3>
            <div style={{ display: "grid", gap: "0.65rem" }}>
              {(dashboard?.recentExpenses || []).slice(0, 5).map((expense) => (
                <div key={expense.id} style={{ paddingBottom: "0.65rem", borderBottom: "1px solid var(--border-subtle)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem" }}>
                    <strong style={{ fontSize: "0.86rem" }}>{expense.title}</strong>
                    <span style={{ fontSize: "0.8rem", color: "var(--gold-light)" }}>{formatMoney(expense.amount)}</span>
                  </div>
                  <div style={{ color: "var(--text-muted)", fontSize: "0.78rem", marginTop: "0.2rem" }}>
                    {expense.status} - {expense.projectTitle || expense.category}
                  </div>
                </div>
              ))}
              {(dashboard?.recentExpenses || []).length === 0 ? <div style={{ color: "var(--text-muted)" }}>No expenses recorded yet.</div> : null}
            </div>
          </div>
        </div>
      ) : null}

      {activeTab === "expenses" && (access?.canSubmitExpenses || access?.canApproveExpenses) ? (
        <div style={{ display: "grid", gap: "1rem" }}>
          {access.canSubmitExpenses ? (
            <div style={{ padding: "1rem 1.1rem", borderRadius: "14px", border: "1px solid var(--border-subtle)", background: "rgba(12,18,34,0.55)" }}>
              <h3 style={{ margin: "0 0 0.4rem", fontSize: "1rem" }}>Submit Expense</h3>
              <p style={{ color: "var(--text-muted)", fontSize: "0.82rem", marginBottom: "1rem" }}>
                Receipt upload is required. Files are stored in R2, while approval data stays in Neon PostgreSQL.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.8rem" }}>
                <input value={expenseForm.title} onChange={(event) => setExpenseForm((current) => ({ ...current, title: event.target.value }))} placeholder="Expense title" style={inputStyle} />
                <input type="number" min="1" value={expenseForm.amount} onChange={(event) => setExpenseForm((current) => ({ ...current, amount: event.target.value }))} placeholder="Amount in INR" style={inputStyle} />
                <input value={expenseForm.category} onChange={(event) => setExpenseForm((current) => ({ ...current, category: event.target.value }))} placeholder="Category" style={inputStyle} />
                <input value={expenseForm.projectId} onChange={(event) => setExpenseForm((current) => ({ ...current, projectId: event.target.value }))} placeholder="Project ID (optional)" style={inputStyle} />
                <input value={expenseForm.paidTo} onChange={(event) => setExpenseForm((current) => ({ ...current, paidTo: event.target.value }))} placeholder="Paid to" style={inputStyle} />
                <input type="file" accept=".jpg,.jpeg,.png,.pdf,.webp" onChange={(event) => setExpenseReceipt(event.target.files?.[0] || null)} style={inputStyle} />
              </div>
              {expenseReceipt ? (
                <p style={{ marginTop: "0.8rem", marginBottom: 0, fontSize: "0.78rem", color: "var(--text-muted)" }}>
                  Selected receipt: {expenseReceipt.name} ({formatFileSize(expenseReceipt.size)})
                </p>
              ) : null}
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1rem" }}>
                <button className="btn-primary" style={{ cursor: "pointer", fontFamily: "inherit" }} onClick={handleExpenseSubmit} disabled={isPending}>
                  {isPending ? (receiptUploadProgress ? `Uploading ${receiptUploadProgress}%` : "Submitting...") : "Submit Expense"}
                </button>
              </div>
            </div>
          ) : null}

          <div style={{ padding: "1rem 1.1rem", borderRadius: "14px", border: "1px solid var(--border-subtle)", background: "rgba(12,18,34,0.55)" }}>
            <h3 style={{ margin: "0 0 0.8rem", fontSize: "1rem" }}>{access.canApproveExpenses ? "Expense Review Queue" : "My Expense Requests"}</h3>
            <div style={{ display: "grid", gap: "0.7rem" }}>
              {expenses.map((expense) => {
                const statusStyle = getStatusStyle(expense.status);
                return (
                  <div key={expense.id} style={{ padding: "0.95rem 1rem", borderRadius: "12px", border: "1px solid var(--border-subtle)", background: "rgba(15,22,40,0.32)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
                      <div>
                        <strong style={{ display: "block" }}>{expense.title}</strong>
                        <div style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginTop: "0.25rem" }}>
                          {expense.projectTitle || expense.projectId || expense.category} - Paid to {expense.paidTo}
                        </div>
                        <div style={{ color: "var(--text-muted)", fontSize: "0.76rem", marginTop: "0.25rem" }}>
                          Submitted by {expense.createdByName || expense.createdBy} - {formatDate(expense.createdAt)}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", alignItems: "center" }}>
                        <span style={{ color: "var(--gold-light)", fontWeight: 700 }}>{formatMoney(expense.amount)}</span>
                        <span style={{ padding: "0.3rem 0.65rem", borderRadius: "999px", fontSize: "0.74rem", ...statusStyle }}>{expense.status}</span>
                        <a href={expense.receiptUrl} target="_blank" rel="noreferrer" style={{ color: "var(--gold)", fontSize: "0.8rem" }}>Receipt</a>
                      </div>
                    </div>
                    {access.canApproveExpenses && expense.status === "pending" ? (
                      <div style={{ display: "flex", gap: "0.6rem", marginTop: "0.75rem" }}>
                        <button
                          onClick={() => handleExpenseDecision(expense.id, "approved")}
                          style={{ background: "rgba(34,197,94,0.16)", border: "1px solid rgba(34,197,94,0.3)", color: "#86efac", borderRadius: "8px", padding: "0.45rem 0.8rem", cursor: "pointer", fontFamily: "inherit" }}
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleExpenseDecision(expense.id, "rejected")}
                          style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", color: "#fca5a5", borderRadius: "8px", padding: "0.45rem 0.8rem", cursor: "pointer", fontFamily: "inherit" }}
                        >
                          Reject
                        </button>
                      </div>
                    ) : null}
                  </div>
                );
              })}
              {expenses.length === 0 ? <div style={{ color: "var(--text-muted)" }}>No expenses recorded yet.</div> : null}
            </div>
          </div>
        </div>
      ) : null}

      {activeTab === "reports" && access?.canExportFinance ? (
        <div style={{ display: "grid", gap: "1rem", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
          {[
            { title: "Export Expenses", href: "/admin/export/expenses", text: "Download approved and pending expense records as CSV." },
            { title: "Export Finance Activity", href: "/admin/export/finance-activity", text: "Download finance-specific audit logs as CSV." },
            { title: "Finance Backup", href: "/admin/backup/finance", text: "Download finance metadata backup with safe user fields only." },
          ].map((item) => (
            <div key={item.href} style={{ padding: "1rem 1.1rem", borderRadius: "14px", border: "1px solid var(--border-subtle)", background: "rgba(12,18,34,0.55)" }}>
              <strong style={{ display: "block", marginBottom: "0.45rem" }}>{item.title}</strong>
              <p style={{ color: "var(--text-muted)", fontSize: "0.82rem", lineHeight: 1.6 }}>{item.text}</p>
              <a href={item.href} style={{ color: "var(--gold)", fontSize: "0.84rem" }}>Download</a>
            </div>
          ))}
        </div>
      ) : null}

      {!embedded ? (
        <div style={{ padding: "0.95rem 1rem", borderRadius: "12px", border: "1px solid var(--border-subtle)", background: "rgba(15,22,40,0.35)", color: "var(--text-muted)", fontSize: "0.82rem", lineHeight: 1.7 }}>
          Need admin-level controls, exports, or expense approvals?{" "}
          <Link href="/admin/finance" style={{ color: "var(--gold)" }}>Open the finance control panel</Link>.
        </div>
      ) : null}
    </div>
  );
}
