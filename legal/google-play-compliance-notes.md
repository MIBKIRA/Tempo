# Google Play Compliance Notes (Internal Reference)

**Not a public-facing policy.** This is a working checklist for preparing Tempo for Google Play submission, based on a direct review of the repository as of this document's creation. Update it as items are completed.

## Current Status (as verified against the codebase)

- No Android packaging exists yet (no Capacitor config, no `android/` folder, no TWA setup, no `manifest.json`).
- No account/data-deletion capability exists yet, in-app or otherwise.
- No published Privacy Policy or Terms of Service exist yet (see the other files in this folder — link them from the app and the Play Store listing once hosted).

## Mandatory Requirements Before Submission

**1. Account deletion (blocking requirement).**
Google Play requires that any app allowing account creation let users delete their account **and** their data — not just deactivate it — both from within the app and via a public web page that works without the app installed. This currently does not exist. Because deleting a Supabase Auth user requires elevated (secret-key) privileges, this needs a small server-side component (e.g., a Supabase Edge Function called from an authenticated request), not just a client-side button. Treat this as the top engineering priority tied to this legal work — it also satisfies the GDPR/CCPA/PDPL erasure right described in the Account & Data Deletion Policy.

**2. Data Safety section.**
Based on the current codebase, a draft answer set:
- Data collected: personal info (email, name, username, date of birth), photos (avatar), app activity (task/habit/event data).
- Data shared with third parties: none currently (Supabase and Vercel are service providers/processors, not "sharing" in Play's Data Safety sense, since they don't use the data for their own purposes).
- Data encrypted in transit: yes (Supabase/Vercel serve over HTTPS).
- Data deletion: pending — cannot be marked "yes" until item 1 above is built.
- Independent security review: no (mark accurately; do not claim one you have not had).
If advertising is introduced later, this section must be revisited — ad SDKs typically add "Device or other IDs" and change the "data shared with third parties" answer.

**3. Privacy Policy link.**
The Play Console requires a live, publicly accessible Privacy Policy URL in the store listing. Host `privacy-policy.md` (rendered as a webpage) at a stable URL before submitting.

**4. Families Policy.**
Not applicable as a "primarily child-directed" app given the 13+ sign-up gate — but do not mark the app as directed at children, and keep the age gate in place (ideally enforced server-side, not just client-side, before submission).

**5. Target API level.**
Google Play requires new and updated apps to target a recent Android API level (this requirement is updated roughly annually). Confirm the current requirement on the Play Console Help site at submission time, since it changes independently of this document.

## Recommended Path to Play Store

Given Tempo is a web app (React/Vite), the two realistic paths are:

- **Trusted Web Activity (TWA):** wraps the existing PWA with minimal native code; requires a proper `manifest.json` (currently missing) and Digital Asset Links verification between the app and the domain.
- **Capacitor:** gives a native Android project and access to native APIs if needed later, at the cost of more setup.

TWA is the faster path if no native device APIs are needed beyond what the web app already does.

## Pre-Submission Checklist

- [ ] In-app + web account/data deletion built and tested
- [ ] Privacy Policy and Terms of Service hosted at stable public URLs
- [ ] Data Safety form completed and cross-checked against the actual codebase (not copied from a template)
- [ ] `manifest.json` created (if using TWA) with correct icons, name, and theme color
- [ ] Age gate confirmed enforced (ideally server-side)
- [ ] Target API level confirmed against current Play Console requirements
