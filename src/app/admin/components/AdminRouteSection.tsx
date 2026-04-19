import type { ReactNode } from "react";

export default function AdminRouteSection({ children }: { children: ReactNode }) {
  return <div style={{ animation: "fadeIn 0.3s ease" }}>{children}</div>;
}
