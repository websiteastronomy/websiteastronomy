import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// ==============================================================================
// SUBDOMAIN RULE: verify subdomain is restricted to /v/* and /api/attendance/*
// ==============================================================================

const VERIFY_SUBDOMAIN = "verify";

// Patterns that are ALLOWED on the verify subdomain
const VERIFY_ALLOWED_PATHS = [
  /^\/v\//,
  /^\/api\/attendance\//,
];

const BLOCKED_HTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Temporarily Unavailable</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #080d1a;
      font-family: 'Segoe UI', system-ui, sans-serif;
      color: #e0e0f0;
      padding: 2rem;
    }
    .card {
      background: rgba(12,18,36,0.95);
      border: 1px solid rgba(201,168,76,0.2);
      border-radius: 20px;
      padding: 3rem 2rem;
      text-align: center;
      max-width: 400px;
    }
    h1 { color: #c9a84c; font-size: 1.3rem; margin-bottom: 1rem; }
    p { color: #667788; font-size: 0.9rem; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="card">
    <div style="font-size: 3rem; margin-bottom: 1rem;">🔭</div>
    <h1>Temporarily Unavailable</h1>
    <p>This page is not available on this domain. Please use the link provided in your invitation email to verify your attendance.</p>
  </div>
</body>
</html>`;

export function proxy(request: NextRequest) {
  const hostname = request.headers.get("host") || "";
  const pathname = request.nextUrl.pathname;

  // ---- VERIFY SUBDOMAIN GATE ----
  const isVerifySubdomain =
    hostname.startsWith(`${VERIFY_SUBDOMAIN}.`) ||
    hostname.startsWith(`${VERIFY_SUBDOMAIN}-`);

  if (isVerifySubdomain) {
    const isAllowed = VERIFY_ALLOWED_PATHS.some((p) => p.test(pathname));
    if (!isAllowed) {
      return new NextResponse(BLOCKED_HTML, {
        status: 403,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }
    // Allow: no further redirect/header logic needed for verify subdomain
    return NextResponse.next();
  }

  // ---- MAIN DOMAIN LOGIC (unchanged) ----
  if (request.nextUrl.pathname.startsWith("/dashboard")) {
    const targetUrl = request.nextUrl.clone();
    targetUrl.pathname = "/app/overview";
    targetUrl.search = "";
    return NextResponse.redirect(targetUrl);
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", request.nextUrl.pathname);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*$).*)"],
};
