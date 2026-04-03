import { redirect } from "next/navigation";

export default function AdminAnnouncementsRedirectPage() {
  redirect("/admin?tab=announcements");
}
