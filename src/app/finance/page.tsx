import dynamic from "next/dynamic";

const FinanceWorkspaceClient = dynamic(
  () => import("@/components/FinanceWorkspaceClient"),
  {
    loading: () => <div style={{ color: "var(--text-muted)" }}>Loading finance workspace...</div>,
  },
);

export default function FinancePage() {
  return <FinanceWorkspaceClient />;
}
