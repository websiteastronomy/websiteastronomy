import { redirect } from "next/navigation";

export default async function PortalRedirectPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const redirectTarget = resolvedSearchParams?.redirect;
  const safeRedirect =
    typeof redirectTarget === "string" && redirectTarget.startsWith("/")
      ? `?redirect=${encodeURIComponent(redirectTarget)}`
      : "";

  redirect(`/login${safeRedirect}`);
}
