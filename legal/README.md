# Legal Documentation

This folder contains Tempo's legal documents. It was generated from a direct review of the application's code and current regulatory requirements (GDPR, CCPA/CPRA, Egypt's PDPL, and Google Play policy) — not from a generic template set.

## Files

| File | Purpose | Public-facing? |
|---|---|---|
| `terms-of-service.md` | The core agreement between Tempo and its users: what the Service is, acceptable use, fees/monetization, IP ownership, liability limits, and dispute resolution. | Yes — link from sign-up and footer. |
| `privacy-policy.md` | What personal data Tempo collects, why, who it's shared with, and your rights under GDPR, CCPA/CPRA, and Egypt's PDPL. | Yes — link from sign-up and footer. |
| `cookie-policy.md` | What local storage and (in the future, if introduced) cookies the app uses. Currently scoped to reflect that no tracking cookies exist yet. | Yes — link from footer / Privacy Policy. |
| `acceptable-use-policy.md` | Detailed conduct rules (security, scraping, reverse engineering, content standards) referenced from the Terms of Service. | Yes — link from Terms of Service. |
| `account-deletion-policy.md` | How users request deletion of their account and data, what gets deleted, what's retained and why, and the expected timeline. | Yes — link from Settings and footer. |
| `eula.md` | License terms for an installable version of the app (relevant once a Google Play / Android build exists). Does not add obligations while the app is web-only. | Yes, once an installable build exists. |
| `google-play-compliance-notes.md` | Internal engineering/compliance checklist for Play Store submission, including the account-deletion requirement, Data Safety form answers, and packaging path (TWA vs. Capacitor). | **No** — internal reference only, do not link publicly. |

## Before You Publish

Every file above contains bracketed placeholders — `[Company Name / Legal Entity]`, `[Insert Effective Date]`, `[Contact Email]`, and a few document-specific ones (governing-law city, liability cap, Supabase hosting region). Fill these in before treating any document as final.

## Known Gaps to Close in the App (Not Just the Documents)

These were found during the code review and are referenced by the policies above, but the underlying features don't exist yet:

1. **Account/data deletion** — no in-app or backend capability currently exists. Required by the Account & Data Deletion Policy, by GDPR/CCPA/PDPL, and by Google Play (mandatory since April 2024).
2. **Server-side age enforcement** — the 13+ check currently runs client-side only.

## Not a Substitute for Legal Advice

These documents are informed by a real review of the codebase and by current regulatory requirements, but they were not prepared by a licensed attorney. Have them reviewed by one — ideally one familiar with Egyptian law, given the PDPL compliance deadline — before treating them as final.
