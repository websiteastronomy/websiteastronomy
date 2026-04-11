import { redirect } from "next/navigation";

export default function AdminProjectsRedirectPage() {
  redirect("/admin?tab=projects");
}
