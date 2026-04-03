import { redirect } from "next/navigation";

export default function AdminQuizzesPage() {
  redirect("/admin?tab=quizzes");
}
