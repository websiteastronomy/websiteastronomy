"use client";

import Link from "next/link";
import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import PortalActivity from "@/components/portal/PortalActivity";
import PortalAnnouncements from "@/components/portal/PortalAnnouncements";
import PortalNotifications from "@/components/portal/PortalNotifications";
import PortalOverview from "@/components/portal/PortalOverview";
import PortalProjects from "@/components/portal/PortalProjects";
import type { Notification } from "@/components/portal/types";
import { usePortalData } from "@/components/portal/usePortalData";
import { useAuth } from "@/context/AuthContext";
import type { DashboardRole } from "@/lib/module-access";

type FinanceSummary = {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
};

function formatMoney(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

function QuickLinkCard({
  title,
  description,
  href,
}: {
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="dash-card dash-fade-in"
      style={{
        display: "block",
        padding: "1rem 1.1rem",
        borderRadius: "12px",
        background: "rgba(12,18,34,0.55)",
        textDecoration: "none",
      }}
    >
      <strong style={{ display: "block", color: "var(--text-primary)", marginBottom: "0.35rem" }}>
        {title}
      </strong>
      <span style={{ color: "var(--text-muted)", fontSize: "0.82rem", lineHeight: 1.6 }}>
        {description}
      </span>
    </Link>
  );
}

async function handleNotificationSelect(
  notification: Notification,
  setNotifications: Dispatch<SetStateAction<Notification[]>>,
) {
  if (!notification.isRead) {
    const { markNotificationReadAction } = await import("@/app/actions/notifications");
    await markNotificationReadAction(notification.id);
    setNotifications((previous) =>
      previous.map((entry) =>
        entry.id === notification.id ? { ...entry, isRead: true } : entry,
      ),
    );
  }

  if (notification.link) {
    window.location.href = notification.link;
  }
}

export default function DashboardOverviewClient({
  role,
}: {
  role: DashboardRole;
}) {
  const { user } = useAuth();
  const portalData = usePortalData(
    user
      ? {
          id: user.id,
          image: user.image ?? null,
          name: user.name ?? null,
          email: user.email ?? null,
          profileImageKey: (user as { profileImageKey?: string | null }).profileImageKey ?? null,
          quote: (user as { quote?: string | null }).quote ?? null,
        }
      : null,
  );
  const [financeSummary, setFinanceSummary] = useState<FinanceSummary | null>(null);
  const [financeLoading, setFinanceLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    if (role !== "finance_head" && role !== "admin") {
      setFinanceSummary(null);
      return;
    }

    setFinanceLoading(true);
    import("@/app/actions/finance")
      .then(({ getFinanceSummaryAction }) => getFinanceSummaryAction())
      .then((summary) => {
        if (!cancelled) {
          setFinanceSummary(summary);
        }
      })
      .catch((error) => {
        console.error("[dashboard] finance overview load failed:", error);
        if (!cancelled) {
          setFinanceSummary(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setFinanceLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [role]);

  const approvalNotifications = portalData.notifications.filter(
    (notification) => notification.type === "approval_request" && !notification.isRead,
  ).length;

  return (
    <div style={{ maxWidth: "980px", display: "grid", gap: "1.5rem" }}>
      <PortalOverview
        maintenanceActive={portalData.maintenanceActive}
        systemControl={portalData.systemControl}
        formatTimestamp={portalData.formatTimestamp}
      />

      {role === "member" ? (
        <>
          <div className="dash-stagger" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
            <QuickLinkCard title="Projects" description="Track your assigned work and project progress." href="/dashboard/projects" />
            <QuickLinkCard title="Announcements" description="Read the latest club updates and internal notices." href="/dashboard/announcements" />
            <QuickLinkCard title="Activity" description="Review your recent actions and member activity timeline." href="/dashboard/activity-logs" />
          </div>
          <PortalProjects myProjects={portalData.myProjects} projectsLoading={portalData.projectsLoading} />
          <PortalNotifications
            notifications={portalData.notifications}
            notificationsLoading={portalData.notificationsLoading}
            formatRelativeTime={portalData.formatRelativeTime}
            limit={5}
            onNotificationSelect={(notification) =>
              handleNotificationSelect(notification, portalData.setNotifications)
            }
          />
          <PortalActivity
            recentActivity={portalData.recentActivity}
            loading={portalData.portalMetaLoading}
            formatTimestamp={portalData.formatTimestamp}
            limit={5}
          />
        </>
      ) : null}

      {role === "core" ? (
        <>
          <div className="dash-stagger" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
            <QuickLinkCard title="Projects" description="Open project workspaces and track execution progress." href="/dashboard/projects" />
            <QuickLinkCard title="Approvals" description={`You currently have ${approvalNotifications} approval items waiting in notifications.`} href="/dashboard/members" />
            <QuickLinkCard title="Tasks" description={`You are attached to ${portalData.myProjects.length} active project workspace(s).`} href="/dashboard/projects" />
          </div>
          <PortalProjects myProjects={portalData.myProjects} projectsLoading={portalData.projectsLoading} />
          <PortalNotifications
            notifications={portalData.notifications}
            notificationsLoading={portalData.notificationsLoading}
            formatRelativeTime={portalData.formatRelativeTime}
            limit={6}
            onNotificationSelect={(notification) =>
              handleNotificationSelect(notification, portalData.setNotifications)
            }
          />
          <PortalAnnouncements
            announcements={portalData.portalAnnouncements}
            loading={portalData.portalMetaLoading}
            formatTimestamp={portalData.formatTimestamp}
            limit={4}
          />
        </>
      ) : null}

      {role === "finance_head" ? (
        <>
          <div className="dash-stagger" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
            {[
              { label: "Payments", value: financeLoading ? "Loading..." : formatMoney(financeSummary?.totalIncome || 0) },
              { label: "Expenses", value: financeLoading ? "Loading..." : formatMoney(financeSummary?.totalExpenses || 0) },
              { label: "Balance", value: financeLoading ? "Loading..." : formatMoney(financeSummary?.balance || 0) },
            ].map((card) => (
              <div key={card.label} style={{ padding: "1rem 1.1rem", borderRadius: "12px", border: "1px solid var(--border-subtle)", background: "rgba(12,18,34,0.55)" }}>
                <div style={{ color: "var(--text-muted)", fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  {card.label}
                </div>
                <div style={{ marginTop: "0.45rem", fontSize: "1.45rem", fontWeight: 700, color: "var(--text-primary)" }}>
                  {card.value}
                </div>
              </div>
            ))}
          </div>
          <div className="dash-stagger" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
            <QuickLinkCard title="Finance Workspace" description="Review the payment ledger, expense queue, and exports." href="/dashboard/finance" />
            <QuickLinkCard title="Announcements" description="Keep finance communications in sync with member-facing updates." href="/dashboard/announcements" />
            <QuickLinkCard title="Projects" description="Coordinate with project owners before approving expenses." href="/dashboard/projects" />
          </div>
          <PortalAnnouncements
            announcements={portalData.portalAnnouncements}
            loading={portalData.portalMetaLoading}
            formatTimestamp={portalData.formatTimestamp}
            limit={5}
          />
          <PortalActivity
            recentActivity={portalData.recentActivity}
            loading={portalData.portalMetaLoading}
            formatTimestamp={portalData.formatTimestamp}
            limit={5}
          />
        </>
      ) : null}

      {role === "admin" ? (
        <>
          <div className="dash-stagger" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
            <QuickLinkCard title="Full Overview" description="Open the master admin overview with the full control surface." href="/admin?tab=overview" />
            <QuickLinkCard title="System Control" description="Review maintenance mode, restrictions, and critical system alerts." href="/admin?tab=system-control" />
            <QuickLinkCard title="Activity Logs" description="Inspect audit trails and operational activity from the admin system." href="/admin?tab=logs" />
          </div>
          <PortalAnnouncements
            announcements={portalData.portalAnnouncements}
            loading={portalData.portalMetaLoading}
            formatTimestamp={portalData.formatTimestamp}
            limit={5}
          />
          <PortalNotifications
            notifications={portalData.notifications}
            notificationsLoading={portalData.notificationsLoading}
            formatRelativeTime={portalData.formatRelativeTime}
            limit={6}
            onNotificationSelect={(notification) =>
              handleNotificationSelect(notification, portalData.setNotifications)
            }
          />
          <PortalProjects myProjects={portalData.myProjects} projectsLoading={portalData.projectsLoading} limit={4} />
        </>
      ) : null}
    </div>
  );
}
