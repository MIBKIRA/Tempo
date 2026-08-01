export interface LegalDoc {
  id: string;
  title: string;
  lastUpdated: string;
  path: string;
  content: string;
}

export const LEGAL_DOCS: Record<string, LegalDoc> = {
  'terms': {
    id: 'terms',
    title: 'Terms of Service',
    lastUpdated: 'August 1, 2026',
    path: '/terms',
    content: `
# Terms of Service
**Effective Date:** August 1, 2026 | **Last Updated:** August 1, 2026

## 1. Introduction and Acceptance
Welcome to Tempo ("Tempo," "we," "us," or "our"), a productivity and calendar application operated by Tempo Technologies Inc. ("the Operator"). These Terms of Service ("Terms") govern your access to and use of the Tempo website, application, and related services (collectively, the "Service").

By creating an account, accessing, or using the Service, you agree to be bound by these Terms and by our Privacy Policy, which is incorporated into these Terms by reference. If you do not agree to these Terms, you must not access or use the Service.

If you are using the Service on behalf of an organization, you represent that you have the authority to bind that organization to these Terms.

## 2. Description of the Service
Tempo is a personal productivity and time-management application. Its features currently include, without limitation: daily, weekly, and monthly calendar and task views; a habits tracker; an energy/workload planner; a focus timer ("Focus Mode"); productivity statistics ("Velocity Dashboard"); an evening review flow; and a command-based navigation interface. We may add, modify, or discontinue features at any time.

## 3. Eligibility
3.1 You must be at least 13 years old to create an account or use the Service. By creating an account, you represent and warrant that you meet this minimum age requirement.
3.2 If the minimum age for consent to data processing without parental or guardian authorization is higher than 13 under the law of your country of residence, you represent that you have obtained any required consent.
3.3 The Service is not directed at children under 13, and we do not knowingly collect personal data from children under 13.

## 4. Accounts and Registration
4.1 To use most features of the Service, you must register for an account with an email address and password (or such other authentication method as we may offer).
4.2 You agree to provide accurate, current, and complete information during registration and profile completion, and to keep it up to date.
4.3 You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account. Notify us promptly at support@tempo.so if you become aware of any unauthorized use of your account.
4.4 We reserve the right to suspend or terminate accounts that contain materially inaccurate information, that violate these Terms, or that remain inactive for an extended period, subject to our Account & Data Deletion Policy.

## 5. Your Content
5.1 "User Content" means the tasks, scheduled tasks, calendar events, habits, habit logs, and profile information that you submit to the Service.
5.2 You retain all ownership rights in your User Content. By submitting User Content, you grant us a worldwide, non-exclusive, royalty-free license to host, store, reproduce, and process it solely to operate, maintain, and improve the Service.
5.3 You are solely responsible for your User Content and represent that you hold all rights necessary to submit it.

## 6. Acceptable Use
You agree not to:
(a) use the Service for any unlawful purpose or in violation of applicable law;
(b) reverse engineer, decompile, disassemble, or attempt to derive the source code of the Service;
(c) scrape, crawl, or use automated means to access the Service;
(d) resell, sublicense, or commercially exploit the Service without authorization;
(e) interfere with or disrupt the integrity or performance of the Service.

See our Acceptable Use Policy for further detail.

## 7. Fees, Advertising, and Future Monetization
7.1 The Service is currently offered free of charge.
7.2 We reserve the right to introduce paid plans, subscriptions, or advertisements at any time with reasonable advance notice.

## 8. Intellectual Property
8.1 The Service — including its software, design, visual elements, logos, and the "Tempo" name — is owned by the Operator and its licensors and is protected by intellectual property law.

## 9. Third-Party Services
The Service relies on third-party infrastructure providers, currently including Supabase (authentication, database, and file storage) and Vercel (application hosting).

## 10. Termination
10.1 You may stop using the Service and request deletion of your account at any time in accordance with our Account & Data Deletion Policy.
10.2 We may suspend or terminate your access to the Service if we reasonably believe you have violated these Terms.

## 11. Disclaimer of Warranties
TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE," WITHOUT WARRANTIES OF ANY KIND.

## 12. Limitation of Liability
TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, THE OPERATOR WILL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, OR CONSEQUENTIAL DAMAGES ARISING OUT OF YOUR USE OF THE SERVICE.

## 13. Changes to These Terms
We may update these Terms from time to time. Material changes will be communicated by an in-app notice, email, or re-consent prompt.

## 14. Contact Us
Questions about these Terms may be directed to support@tempo.so.
`
  },
  'privacy': {
    id: 'privacy',
    title: 'Privacy Policy',
    lastUpdated: 'August 1, 2026',
    path: '/privacy',
    content: `
# Privacy Policy
**Effective Date:** August 1, 2026 | **Last Updated:** August 1, 2026

## 1. Introduction
This Privacy Policy explains how Tempo ("Tempo," "we," "us," or "our") collects, uses, discloses, and protects your personal data when you use our productivity and calendar application (the "Service").

## 2. Data We Collect
**2.1 Account and profile data.** When you register, we collect your email address and password, processed and stored by our authentication provider, Supabase. During sign-up, we also collect your username, full name, date of birth (to enforce age requirements), and optional bio and avatar.
**2.2 Productivity data.** We store tasks, scheduled tasks, calendar events, habits, and habit completion logs.
**2.3 Local preference data.** Interface preferences (theme, font scale, focus timer durations) are stored locally in your browser storage.
**2.4 What we do not collect.** We do not sell your data, use tracking cookies, or use your productivity data to train AI models.

## 3. How We Use Your Data
We use your data to: (a) provide, maintain, and synchronize the Service; (b) authenticate you; (c) respond to support requests; and (d) comply with legal obligations.

## 4. Legal Basis for Processing (GDPR / UK GDPR)
We rely on: contract performance (providing the Service); legitimate interests (securing the Service); and user consent where required.

## 5. Sub-Processors and Third-Party Services
- **Supabase** — authentication, database, and storage.
- **Vercel** — application hosting.

## 6. Data Retention & Deletion
We retain your data for as long as your account is active. You may request account deletion at any time via Settings or our public deletion page.

## 7. Your Privacy Rights
- **GDPR / UK GDPR:** Access, rectification, erasure, restriction, portability, and objection rights.
- **CCPA / CPRA:** Right to know, delete, correct, and non-discrimination.
- **Egypt PDPL (Law No. 151/2020):** Right to be informed, access, request correction/erasure, and object.

## 8. Children's Privacy
The Service requires users to be at least 13 years old. We do not knowingly collect data from anyone under 13.

## 9. Contact Us
Questions or privacy requests can be directed to support@tempo.so.
`
  },
  'cookie-policy': {
    id: 'cookie-policy',
    title: 'Cookie Policy',
    lastUpdated: 'August 1, 2026',
    path: '/cookie-policy',
    content: `
# Cookie Policy
**Effective Date:** August 1, 2026 | **Last Updated:** August 1, 2026

## 1. Scope of This Policy
This Cookie Policy explains how Tempo uses cookies and browser storage technologies. As of the effective date, Tempo does not use third-party tracking or advertising cookies.

## 2. What We Use
- **Browser Local Storage:** Used to store interface preferences (theme, font scale, focus durations) directly on your device.
- **Authentication Session Tokens:** Managed by Supabase to maintain your logged-in session securely.

## 3. Managing Local Storage
You can clear your browser's local storage at any time through your browser settings.

## 4. Contact Us
Questions can be sent to support@tempo.so.
`
  },
  'acceptable-use': {
    id: 'acceptable-use',
    title: 'Acceptable Use Policy',
    lastUpdated: 'August 1, 2026',
    path: '/acceptable-use',
    content: `
# Acceptable Use Policy
**Effective Date:** August 1, 2026 | **Last Updated:** August 1, 2026

## 1. Prohibited Conduct
You may not use the Service to:
- Attempt security violations or unauthorized access.
- Perform automated scraping or rate limit bypasses.
- Reverse engineer or decompile the application.
- Engage in illegal, harmful, or harassing activities.
- Impersonate any person or entity.

## 2. Enforcement
Violations may result in warnings, content removal, or account suspension/termination.

## 3. Contact Us
Report violations to support@tempo.so.
`
  },
  'account-deletion-policy': {
    id: 'account-deletion-policy',
    title: 'Account & Data Deletion Policy',
    lastUpdated: 'August 1, 2026',
    path: '/account-deletion-policy',
    content: `
# Account & Data Deletion Policy
**Effective Date:** August 1, 2026 | **Last Updated:** August 1, 2026

## 1. Your Right to Delete
You may delete your Tempo account and associated personal data at any time.

## 2. How to Request Deletion
- **In-App:** Settings → Profile → Danger Zone → Delete Account.
- **Web:** Via our public Web Deletion Page at /delete-account or by emailing support@tempo.so.

## 3. What Gets Permanently Deleted
- Authentication and profile records (email, username, full name, date of birth, bio, avatar).
- Tasks, scheduled tasks, calendar events, habits, habit logs, and consents.

## 4. Timeline
Requests are processed within 30 days of verification.

## 5. Contact Us
Inquiries can be directed to support@tempo.so.
`
  }
};
