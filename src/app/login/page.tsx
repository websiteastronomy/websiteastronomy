"use client";

import { useSearchParams } from "next/navigation";
import LoginGate from "@/components/LoginGate";

export default function LoginPage() {
  const searchParams = useSearchParams();
  return <LoginGate redirectTarget={searchParams.get("redirect")} />;
}
