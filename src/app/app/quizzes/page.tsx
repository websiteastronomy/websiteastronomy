"use client";
import DeprecationBanner from "@/components/DeprecationBanner";
import QuizzesManager from "@/app/admin/components/QuizzesManager";

export default function AppQuizzesPage() {
  return (
    <>
      <DeprecationBanner currentPath="/app/quizzes" newPath="/admin?tab=quizzes" />
      <QuizzesManager />
    </>
  );
}
