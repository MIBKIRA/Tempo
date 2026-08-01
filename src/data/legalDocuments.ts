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
    lastUpdated: '[Insert Effective Date]',
    path: '/terms',
    content: `# Terms of Service

**Effective Date:** [Insert Effective Date]
**Last Updated:** [Insert Effective Date]

## 1. Introduction and Acceptance

Welcome to Tempo ("Tempo," "we," "us," or "our"), a productivity and calendar application operated by **[Company Name / Legal Entity — to be confirmed]** ("the Operator"). These Terms of Service ("Terms") govern your access to and use of the Tempo website, application, and related services (collectively, the "Service").

By creating an account, accessing, or using the Service, you agree to be bound by these Terms and by our [Privacy Policy](./privacy-policy.md), which is incorporated into these Terms by reference. If you do not agree to these Terms, you must not access or use the Service.

If you are using the Service on behalf of an organization, you represent that you have the authority to bind that organization to these Terms.

## 2. Description of the Service

Tempo is a personal productivity and time-management application. Its features currently include, without limitation: daily, weekly, and monthly calendar and task views; a habits tracker; an energy/workload planner; a focus timer ("Focus Mode"); productivity statistics ("Velocity Dashboard"); an evening review flow; and a command-based navigation interface. We may add, modify, or discontinue features at any time. Material changes will be communicated as described in Section 13.

## 3. Eligibility

3.1 You must be at least 13 years old to create an account or use the Service. By creating an account, you represent and warrant that you meet this minimum age requirement.

3.2 If the minimum age for consent to data processing without parental or guardian authorization is higher than 13 under the law of your country of residence, you represent that you have obtained any required consent, or that you otherwise meet your local minimum age.

3.3 The Service is not directed at children under 13, and we do not knowingly collect personal data from children under 13. If we become aware that we have done so, we will take steps to delete that data promptly.

## 4. Accounts and Registration

4.1 To use most features of the Service, you must register for an account with an email address and password (or such other authentication method as we may offer).

4.2 You agree to provide accurate, current, and complete information during registration and profile completion, and to keep it up to date.

4.3 You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account. Notify us promptly at **contact@tempoit.me** if you become aware of any unauthorized use of your account.

4.4 We reserve the right to suspend or terminate accounts that contain materially inaccurate information, that violate these Terms, or that remain inactive for an extended period, subject to our [Account & Data Deletion Policy](./account-deletion-policy.md).

## 5. Your Content

5.1 "User Content" means the tasks, scheduled tasks, calendar events, habits, habit logs, and profile information (including your username, full name, bio, and avatar image) that you submit to the Service.

5.2 You retain all ownership rights in your User Content. By submitting User Content, you grant us a worldwide, non-exclusive, royalty-free license to host, store, reproduce, and process it solely to operate, maintain, and improve the Service, and as described in our Privacy Policy. This license ends when you delete the relevant content or your account, except where retention is required by law or by our Account & Data Deletion Policy.

5.3 You are solely responsible for your User Content and represent that you hold all rights necessary to submit it, and that it does not infringe any third party's rights or violate applicable law.

## 6. Acceptable Use

You agree not to:

(a) use the Service for any unlawful purpose or in violation of applicable law;
(b) reverse engineer, decompile, disassemble, or otherwise attempt to derive the source code of the Service, except where such a restriction is prohibited by applicable law;
(c) scrape, crawl, or use automated means to access the Service, or circumvent rate limits or access controls, without our prior written consent;
(d) resell, sublicense, or otherwise commercially exploit the Service without our prior written consent;
(e) interfere with or disrupt the integrity or performance of the Service;
(f) attempt to gain unauthorized access to the Service, to other users' accounts, or to related systems;
(g) upload or transmit content that is unlawful, infringing, or harmful to others.

See our [Acceptable Use Policy](./acceptable-use-policy.md) for further detail. We may investigate and take action — including suspending or terminating accounts and reporting conduct to relevant authorities — against anyone who violates this section.

## 7. Fees, Advertising, and Future Monetization

7.1 The Service is currently offered free of charge.

7.2 We reserve the right to introduce paid plans, subscriptions, one-time purchases, or other monetization models — including, without limitation, displaying third-party advertisements, which may include personalized advertisements served by providers such as Google — at any time. Before any such change takes effect for existing users, we will provide reasonable advance notice, and any related data practices will be described in an updated Privacy Policy and Cookie Policy before the relevant feature goes live. Continued use of the Service after a change takes effect constitutes acceptance of the updated terms.

7.3 This right to introduce or change monetization models survives any assignment or transfer of the Service under Section 15 — meaning a future owner of the Service may introduce a different pricing or monetization model, subject to the same notice obligations.

## 8. Intellectual Property

8.1 The Service — including its software, design, visual elements, logos, and the "Tempo" name and associated marks — is owned by the Operator and its licensors and is protected by intellectual property law. Except for the limited right to use the Service as permitted by these Terms, these Terms grant you no rights in the Service's intellectual property.

8.2 You may not copy, modify, distribute, sell, or lease any part of the Service, or reverse engineer or attempt to extract its source code, except as permitted by applicable law notwithstanding this restriction.

## 9. Third-Party Services

The Service relies on third-party infrastructure providers, currently including Supabase (authentication, database, and file storage) and Vercel (application hosting), and may in the future integrate additional third-party services, including advertising providers. Your use of the Service is also subject to the applicable terms of these providers where you interact with them directly. Except as described in our Privacy Policy regarding sub-processors, we are not responsible for the acts or omissions of independent third-party providers.

## 10. Termination

10.1 You may stop using the Service and request deletion of your account at any time in accordance with our [Account & Data Deletion Policy](./account-deletion-policy.md).

10.2 We may suspend or terminate your access to the Service, with or without notice, if we reasonably believe you have violated these Terms or if required by law.

10.3 Upon termination, your right to use the Service ceases immediately. Sections that by their nature should survive termination — including Sections 8, 11, 12, 13, and 15 — will survive.

## 11. Disclaimer of Warranties

TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE," WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS, IMPLIED, OR STATUTORY, INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT, OR THAT THE SERVICE WILL BE UNINTERRUPTED, SECURE, OR ERROR-FREE. WE DO NOT WARRANT THE ACCURACY OR COMPLETENESS OF ANY DATA GENERATED OR STORED THROUGH THE SERVICE. NOTHING IN THIS SECTION LIMITS ANY WARRANTY THAT CANNOT BE EXCLUDED UNDER APPLICABLE LAW.

## 12. Limitation of Liability

12.1 TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, THE OPERATOR AND ITS PERSONNEL WILL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF DATA, PROFITS, OR REVENUE, ARISING OUT OF OR RELATED TO YOUR USE OF THE SERVICE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.

12.2 TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, THE OPERATOR'S TOTAL AGGREGATE LIABILITY ARISING OUT OF OR RELATED TO THESE TERMS OR THE SERVICE WILL NOT EXCEED THE GREATER OF (A) THE AMOUNT YOU PAID US FOR THE SERVICE IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM, OR (B) **[Insert nominal cap, e.g., USD 100]**.

12.3 Nothing in these Terms excludes or limits liability that cannot lawfully be excluded or limited, including liability for death or personal injury caused by negligence, fraud or fraudulent misrepresentation, gross negligence or willful misconduct, or any liability that cannot be excluded under the mandatory consumer-protection law of your country of residence.

## 13. Changes to These Terms

We may update these Terms from time to time. Material changes will be communicated by an in-app notice, an email to your registered address, or a re-acceptance prompt, consistent with the version-tracking approach described in our consent system. Your continued use of the Service after updated Terms take effect constitutes acceptance, except where applicable law requires your affirmative re-acceptance, in which case we will request it before you can continue.

## 14. Indemnification

You agree to indemnify and hold harmless the Operator and its personnel from claims, damages, liabilities, and expenses (including reasonable legal fees) arising from your violation of these Terms or your misuse of the Service, except to the extent caused by our own breach of these Terms or applicable law.

## 15. Assignment and Transfer; Future Ownership Changes

15.1 We may assign or transfer these Terms and our related rights and obligations, in whole or in part, without your consent, in connection with a merger, acquisition, sale of assets, or similar transaction. If such a transfer involves your personal data, we (or the successor operator) will notify you in accordance with our Privacy Policy and applicable law.

15.2 You may not assign or transfer your rights or obligations under these Terms without our prior written consent.

## 16. Governing Law and Dispute Resolution

16.1 These Terms are governed by the laws of the Arab Republic of Egypt **[DEFAULT ASSUMPTION — replace with your preferred jurisdiction if different]**, without regard to conflict-of-laws principles. Subject to Section 16.2, any dispute arising out of or relating to these Terms or the Service is subject to the exclusive jurisdiction of the competent courts of **[City, Egypt — e.g., Cairo]**.

16.2 Nothing in this Section limits any non-waivable right you may have to bring a claim in the courts of your own country of residence under applicable consumer-protection law, including EU, UK, or California law where it applies to you.

## 17. General Provisions

17.1 **Severability.** If any provision of these Terms is found unenforceable, the remaining provisions remain in full force and effect.

17.2 **Entire Agreement.** These Terms, together with our Privacy Policy, Cookie Policy, and Acceptable Use Policy, constitute the entire agreement between you and us regarding the Service.

17.3 **No Waiver.** Our failure to enforce any right or provision of these Terms is not a waiver of that right or provision.

17.4 **Contact.** Questions about these Terms may be directed to **contact@tempoit.me**.
`
  },
  'privacy': {
    id: 'privacy',
    title: 'Privacy Policy',
    lastUpdated: '[Insert Effective Date]',
    path: '/privacy',
    content: `# Privacy Policy

**Effective Date:** [Insert Effective Date]
**Last Updated:** [Insert Effective Date]

## 1. Introduction

This Privacy Policy explains how Tempo ("Tempo," "we," "us," or "our"), operated by **[Company Name / Legal Entity — to be confirmed]**, collects, uses, discloses, and protects your personal data when you use our productivity and calendar application (the "Service"). This Policy is incorporated into and forms part of our [Terms of Service](./terms-of-service.md).

This Policy describes what the Service actually does as of the effective date above, based on a direct review of its code and configuration — not a generic template.

## 2. Data We Collect

**2.1 Account and profile data.** When you register, we collect your email address and password, which are processed and stored by our authentication provider, Supabase; we do not see your plaintext password. During sign-up and profile completion, we also collect your username, full name, date of birth, and a short bio, and you may optionally upload a profile avatar image.

**2.2 Productivity data.** We store the content you create in the Service: tasks, scheduled tasks, calendar events, habits, and habit-completion logs, including titles, categories, dates, times, durations, completion status, and any descriptions you add.

**2.3 Local preference data.** Interface preferences — such as your selected theme, accent color, font scale, and focus-timer durations — are stored only in your browser's local storage on your own device. We do not transmit or store these preferences on our servers.

**2.4 Technical and log data.** Our hosting provider (Vercel) and our backend provider (Supabase) automatically process standard technical data as part of delivering the Service, such as IP address, browser type, and request timestamps, consistent with their roles as our sub-processors (Section 5).

**2.5 What we do not currently collect.** As of the effective date of this Policy, we do not use analytics or advertising-tracking technologies, do not process payments, and do not use any AI feature that sends your data to a third-party AI provider. If any of this changes, we will update this Policy in advance, as described in Section 12.

## 3. How We Use Your Data

We use your data to: (a) provide, maintain, and synchronize the Service across your devices; (b) authenticate you and secure your account; (c) respond to your support requests; and (d) comply with our legal obligations. We do not use your productivity data — your tasks, habits, or any journal-style content — to train any third-party AI model.

## 4. Legal Basis for Processing (EU / UK / EEA Users)

Where the GDPR or UK GDPR applies to you, we rely on: performance of our contract with you (to provide the Service you signed up for); our legitimate interests (to secure and improve the Service, balanced against your rights); and, where applicable, your consent — for example, if an optional feature requiring consent is introduced in the future.

## 5. Sub-Processors and Third-Party Services

We share data with the following providers, who process it on our behalf under contractual data-protection obligations:

- **Supabase** — authentication, database, and file storage for your account and productivity data. Supabase publishes its own Data Processing Addendum and sub-processor list at supabase.com/legal/dpa. **[Insert the hosting region configured for your Supabase project, e.g., "Data is hosted in the EU (Frankfurt) region."]**
- **Vercel** — application hosting and content delivery.

We do not sell your personal data, and we do not currently share it with any advertising provider.

**Future advertising (not currently active).** We may introduce advertising in the future — including advertising served by Google — as a way to support the Service at no direct cost to users. If we do, before it goes live we will update this section and our Cookie Policy to name the specific providers involved, describe the data they access, and put in place any consent mechanism required by applicable law, including the GDPR/ePrivacy rules that apply to EU, UK, and EEA users.

## 6. International Data Transfers

Depending on the hosting region configured for our Supabase project, your data may be processed in a country other than your own, including outside the EU/EEA, UK, or Egypt. Where we transfer personal data internationally, we rely on appropriate safeguards recognized under applicable law, such as Standard Contractual Clauses.

## 7. Data Retention

We retain your account and productivity data for as long as your account remains active. If you delete your account, we delete your personal data in accordance with our [Account & Data Deletion Policy](./account-deletion-policy.md), except where we must retain certain data for legal, security, or fraud-prevention purposes.

## 8. Your Privacy Rights

**8.1 All users.** You may access, correct, export, or request deletion of your data by contacting us at **contact@tempoit.me**, or by using the in-app data controls described in our Account & Data Deletion Policy once available.

**8.2 EU, UK, and EEA residents (GDPR / UK GDPR).** You have the right to access, rectify, erase, or restrict processing of your data; to data portability; to object to processing based on legitimate interests; to withdraw consent where processing relies on consent; and to lodge a complaint with your local data protection supervisory authority.

**8.3 California residents (CCPA/CPRA).** You have the right to know what personal information we collect, to request deletion, to correct inaccurate information, and to be free from discrimination for exercising these rights. We do not sell or share personal information for cross-context behavioral advertising, so there is currently no "opt-out of sale or sharing" to exercise; if this changes, we will provide that mechanism. You may designate an authorized agent to submit requests on your behalf.

**8.4 Egypt residents (Personal Data Protection Law No. 151/2020).** You have the right to be informed about the processing of your data, to access and obtain a copy of it, to request correction or erasure, to object to processing, and to file a complaint with the Personal Data Protection Center (PDPC).

## 9. Children's Privacy

The Service requires users to be at least 13 years old, and we check this at sign-up. The Service is not directed at children under 13, and we do not knowingly collect data from anyone under 13. We do not knowingly sell or share the personal information of users we know to be under 18. If you are a parent or guardian and believe your child under 13 has provided us with personal data, contact us at **contact@tempoit.me** so we can delete it.

## 10. Data Security

We rely on Supabase's Row Level Security and access-control mechanisms, together with our own application-level safeguards, to protect your data. No method of transmission or storage is completely secure, and we cannot guarantee absolute security.

## 11. Data Breach Notification

If a personal data breach affects your data, we will notify affected users and, where legally required, the relevant supervisory authority — including the applicable EU/UK data protection authority or Egypt's PDPC — without undue delay and, where feasible, within the timeframe required by applicable law (for example, 72 hours under the GDPR and under Egypt's PDPL).

## 12. Changes to This Policy

We may update this Policy from time to time. We will notify you of material changes through an in-app notice or an email to your registered address, and, where applicable law requires it, we will request your re-acceptance before continuing to process your data under the updated Policy.

## 13. Cookies and Local Storage

See our separate [Cookie Policy](./cookie-policy.md) for details on the local storage — and, if introduced in the future, cookies — used by the Service.

## 14. Contact Us

If you have questions about this Policy or want to exercise your privacy rights, contact us at **contact@tempoit.me**.
`
  },
  'cookie-policy': {
    id: 'cookie-policy',
    title: 'Cookie Policy',
    lastUpdated: '[Insert Effective Date]',
    path: '/cookie-policy',
    content: `# Cookie Policy

**Effective Date:** [Insert Effective Date]
**Last Updated:** [Insert Effective Date]

## 1. Scope of This Policy

This Cookie Policy explains how Tempo uses cookies and similar storage technologies (such as browser local storage). It is incorporated into our [Privacy Policy](./privacy-policy.md).

**As of the effective date above, Tempo does not use tracking or advertising cookies.** We reviewed the application's code directly to confirm this before publishing this Policy, rather than assuming a generic set of trackers. The sections below describe what we actually use today, and how this Policy will expand if that changes.

## 2. What We Currently Use

**2.1 Browser local storage (not a cookie, but disclosed here for transparency).** We store your interface preferences — theme, accent color, font scale, and focus-timer durations — in your browser's local storage. This data stays on your device; it is not transmitted to our servers or to any third party.

**2.2 Authentication session storage.** Our authentication provider, Supabase, stores a session token in your browser's local storage to keep you signed in. This is strictly necessary to provide the Service you requested (staying logged in) and is not used for tracking, profiling, or advertising.

Neither of the above requires cookie consent under applicable law (such as the EU ePrivacy Directive), because both are strictly necessary to provide the Service you asked for. We disclose them here for transparency rather than because consent is legally required for them.

## 3. What We Do Not Currently Use

We do not currently use: analytics cookies (e.g., Google Analytics), advertising or retargeting cookies, cross-site tracking pixels, or any third-party marketing tags.

## 4. If We Introduce Advertising

We may introduce advertising in the future, including advertising served by Google, as described in our Terms of Service and Privacy Policy. If we do, before any advertising cookie or similar technology goes live we will:

(a) update this Policy to name the specific provider(s) and describe the cookies or identifiers they set, their purpose, and their duration;
(b) implement a consent mechanism for users in the EU, UK, and EEA (and any other jurisdiction where consent is legally required) before any non-essential cookie is set, consistent with applicable guidance for advertising partners; and
(c) provide a way for you to manage or withdraw your cookie preferences.

## 5. Managing Local Storage

You can clear your browser's local storage at any time through your browser's settings. Doing so will reset your interface preferences and sign you out of the Service, since it will remove your session token along with your preferences.

## 6. Changes to This Policy

We will update this Policy if our use of cookies or similar technologies changes, particularly before introducing any advertising-related cookie, as described in Section 4.

## 7. Contact Us

Questions about this Policy can be directed to **contact@tempoit.me**.
`
  },
  'acceptable-use': {
    id: 'acceptable-use',
    title: 'Acceptable Use Policy',
    lastUpdated: '[Insert Effective Date]',
    path: '/acceptable-use',
    content: `# Acceptable Use Policy

**Effective Date:** [Insert Effective Date]
**Last Updated:** [Insert Effective Date]

## 1. Purpose

This Acceptable Use Policy ("AUP") sets out the rules for using Tempo (the "Service") and expands on Section 6 of our [Terms of Service](./terms-of-service.md). By using the Service, you agree to this AUP.

## 2. Prohibited Conduct

You may not use the Service to:

**2.1 Security violations.** Probe, scan, or test the vulnerability of the Service or any related system; attempt to bypass authentication or access controls; access another user's account without authorization; or introduce malware, viruses, or other harmful code.

**2.2 Automated access and scraping.** Use bots, scrapers, or other automated means to access, extract data from, or interact with the Service, or circumvent rate limits, except through any API we may officially publish and authorize.

**2.3 Reverse engineering.** Decompile, disassemble, or otherwise attempt to derive the source code, algorithms, or underlying structure of the Service, except where applicable law prohibits this restriction.

**2.4 Unauthorized commercial use.** Resell, sublicense, white-label, or otherwise commercially exploit the Service, or use it to build a competing product, without our prior written consent.

**2.5 Illegal or harmful activity.** Use the Service for any unlawful purpose, or to store or transmit content that is defamatory, harassing, hateful, or that infringes another person's intellectual property or privacy rights.

**2.6 Impersonation and misrepresentation.** Impersonate any person or entity, or misrepresent your affiliation with any person or entity, including through your profile username, full name, or avatar.

**2.7 Interference.** Interfere with or disrupt the Service, its infrastructure, or other users' use of it, including through excessive load, denial-of-service attempts, or exploiting bugs in bad faith rather than reporting them to us.

## 3. Content Standards

Any content you add to your profile (username, full name, bio, avatar image) or to your productivity data must not violate Section 2 above. We reserve the right to remove or restrict content that violates this AUP, and to suspend or terminate accounts responsible for it.

## 4. Enforcement

We may investigate suspected violations of this AUP and take action we consider appropriate, including warning the user, removing content, suspending or terminating accounts (subject to our [Account & Data Deletion Policy](./account-deletion-policy.md)), and, where required by law or where we believe there is a risk of harm, reporting conduct to relevant authorities.

## 5. Reporting Violations

If you become aware of a violation of this AUP, please report it to **contact@tempoit.me**.

## 6. Relationship to Other Policies

This AUP is incorporated into our Terms of Service. In the event of a conflict between this AUP and the Terms of Service, the Terms of Service govern.
`
  },
  'account-deletion-policy': {
    id: 'account-deletion-policy',
    title: 'Account & Data Deletion Policy',
    lastUpdated: '[Insert Effective Date]',
    path: '/account-deletion-policy',
    content: `# Account & Data Deletion Policy

**Effective Date:** [Insert Effective Date]
**Last Updated:** [Insert Effective Date]

## 1. Your Right to Delete

You may delete your Tempo account and the personal data associated with it at any time. This right exists independently of, and in addition to, any rights you have under the GDPR, CCPA/CPRA, or Egypt's Personal Data Protection Law, as described in our [Privacy Policy](./privacy-policy.md).

## 2. How to Request Deletion

You can request deletion of your account and data through either of the following methods, without needing to keep the app installed:

- **In-app:** Account Settings → [Danger Zone / Delete Account] (where available in your version of the app).
- **Web:** By emailing **contact@tempoit.me** with the subject line "Account Deletion Request" from the email address associated with your account, or via **[Insert public web deletion-request page URL]**.

We will verify that the request comes from the account owner before processing it.

## 3. What Gets Deleted

Deleting your account permanently removes:

- Your account and authentication record (email, username, full name, date of birth, bio);
- Your profile avatar image;
- Your productivity data — tasks, scheduled tasks, calendar events, habits, and habit logs;
- Any preference data associated with your account.

## 4. What We May Retain, and Why

We may retain limited data after deletion where necessary to:

- comply with a legal obligation (for example, financial or tax records, if applicable in the future);
- detect, prevent, or investigate fraud, abuse, or security incidents;
- resolve disputes or enforce our agreements.

Any data retained for these purposes is kept only as long as necessary for that purpose and is not used to provide you the Service going forward.

## 5. Timeline

We aim to process deletion requests, and remove data from active systems, within **[Insert target: e.g., 30 days]** of verifying your request. Residual copies in backups are purged on our standard backup-rotation schedule, described in **[Insert backup retention period, if applicable]**.

## 6. Effect of Deletion

Account deletion is permanent and cannot be undone. If you want to use Tempo again afterward, you will need to create a new account, and your previous data will not be restored.

## 7. Contact Us

Questions about this Policy, or about the status of a deletion request, can be directed to **contact@tempoit.me**.
`
  }
};
