import { redirect } from "next/navigation";

export default function AdminOverviewRedirectPage() {
  redirect("/admin?tab=overview");
}
