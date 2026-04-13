# Route Audit

Pre-change scan captured before frontend route cleanup:

## `/login`

- `src/app/core/observations/page.tsx`
- `src/app/projects/[id]/public/page.tsx`

## `/contact`

- `src/app/projects/[id]/public/page.tsx`
- `src/app/projects/[id]/public/page.tsx`
- `src/app/projects/[id]/public/page.tsx`

Notes:
- Public project CTAs pointed to `/contact`, but no `src/app/contact/page.tsx` route existed yet.

## `/dashboard`

Key route-coupling hotspots found during audit:

- `src/lib/module-access.ts`
- `src/components/SystemRestrictionWrapper.tsx`
- `src/components/portal/PortalProfile.tsx`
- `src/app/dashboard/page.tsx`
- `src/app/dashboard/activity/page.tsx`
- `src/app/dashboard/notifications/page.tsx`
- `/src/app/app/*` wrappers importing `/src/app/dashboard/*`

Notes:
- `/dashboard` remained as a full legacy route tree.
- `/app/*` included several wrapper pages still coupled to dashboard-era pages and deprecation banners.
