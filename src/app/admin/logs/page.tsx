import { redirect } from "next/navigation";

export default function AdminLogsRedirectPage() {
  redirect("/admin?tab=logs");
}
