# Profcaria product blueprint

## 1. Product boundary

Profcaria is a jobs platform, not a social network, advertising network, content feed or general workplace suite. Its public promise is: **Applying for jobs, made simple.**

The primary journey is intentionally short:

1. See currently open jobs on the home page.
2. Search or filter by role, skill, company, location, setting, level or job type.
3. Open a job and see the work, requirements, compensation, location and remaining application capacity.
4. Enter only the information and documents requested by that company.
5. Submit with or without an account.
6. Receive status email for submitted, shortlisted, interview, offer, hired or not selected.
7. Create or claim an account only to reply in chat, retain history or manage applications.

## 2. Roles and authority

### Visitor / guest applicant

- Read and share public jobs.
- Apply without an account using name and email; phone is optional.
- Attach only requested PDF, DOCX or TXT documents.
- Receive application status emails.
- Cannot enter company chat until the application is claimed by a verified account.

### Job seeker account

- All guest capabilities.
- Claim applications made with a verified email.
- Track status history, interviews, offers and employment outcomes.
- Reply to companies with text, HTTPS links and inspected documents.
- Save reusable identity, employment and document evidence with explicit per-application consent.
- Report jobs, companies, messages or documents.

### Company owner

- Own billing, company verification, team membership and security settings.
- Invite or remove recruiters and hiring managers.
- Create, publish, pause, close, fill, cancel and share jobs.
- See all applicants, insights, audit history and wallet usage.

### Company admin / hiring manager / recruiter / interviewer / viewer

- Permissions are assigned per organization and, where needed, per job.
- Recruiters manage applicants; interviewers see only assigned interviews and evidence; viewers are read-only.
- Sensitive actions such as exports, blocking, offers and billing changes require explicit permission and step-up authentication.

### Safety administrator

- Review reports for accounts, companies, jobs, messages and documents.
- Pause a job, quarantine a document, suspend a company, block an account or dismiss a report.
- Every action requires a reason and writes an immutable audit event.

## 3. Job taxonomy

Employment type: full-time, part-time, contract, temporary, internship, apprenticeship, freelance.

Seniority: entry, junior, mid, senior, lead, executive, not specified.

Work setting: onsite, hybrid, remote within Kenya, flexible. A company must select a Kenyan county/town for onsite and hybrid work. Remote roles remain Kenya-restricted unless an administrator approves a documented exception.

The role catalogue should cover global occupations while job locations remain Kenyan. Companies may add a missing role; new custom roles enter a moderation queue and become reusable after approval.

## 4. Job creation

Required fields:

- Role title and standardized role category.
- Employment type, seniority and number of hires.
- Work setting and Kenyan location.
- Plain-language summary, responsibilities and requirements.
- Compensation or an explicit “not disclosed” choice; displayed in KES.
- Application closing time and maximum application count.
- Required questions and requested documents.

Optional fields:

- Benefits, skills, experience, education, certifications and portfolio link.
- Knockout questions with human-review safeguards.
- Blind review, referral links and internal eligibility.
- ATS mode, AI provider/model, ranked percentage and advanced document security.

## 5. Honest vacancy lifecycle

Statuses: draft, published, paused, closed, filled, cancelled.

A public job is returned only when all are true:

- status is published;
- visibility is public;
- country is Kenya;
- closing time has not passed;
- application count is below the maximum;
- company and job are not suspended.

Every accepted application is counted transactionally. At the cap, a database trigger closes the job and removes it from public queries even if the company does nothing. A scheduled reconciliation job should also close expired jobs and repair counters. Closed links show a clear closed/full state, never an application form.

## 6. Application isolation and ATS

Each application has its own immutable snapshot. Answers, documents, security results, AI evaluation and status events are keyed to that application ID; one candidate's evidence must never be joined into another candidate's evaluation.

ATS modes:

- Off: receive all applications in submission order.
- Rank all: score every complete application.
- Rank percentage: score and surface the selected top percentage while retaining every application.
- Qualified only: apply explicit company criteria, but keep a human-review queue and explain missing evidence.

Protected characteristics are excluded. AI output is advisory, versioned, reproducible and attached to the exact model, provider, policy and source documents used. Companies see a reasoned evidence summary, not a hidden personality score.

## 7. Messaging

Chat exists only around an application or company relationship. It supports:

- Plain text.
- HTTPS links.
- PDF, DOCX and TXT documents after inspection.

It does not support emoji reactions, stickers, images, video, audio, disappearing messages, polls or social posting. Emails may notify the recipient, but replies happen in Profcaria after sign-in so identity and audit history remain intact.

## 8. Document and link security

Uploads enter quarantine and are never released directly. The pipeline checks:

1. Size, extension, MIME declaration and real file signature.
2. Active PDF actions, embedded files, scripts, macros and unsafe protocols.
3. Safe text extraction in an isolated worker.
4. Prompt-injection phrases and instructions aimed at manipulating an automated reviewer.
5. Malware scanning and optional AI classification.
6. Manual review when signals conflict.

Only passed documents receive a short-lived signed URL. The database prevents a pending or blocked attachment from being released. Links must use HTTPS, contain no credentials and cannot target local/private network addresses. A production fetcher should use DNS/IP revalidation, redirect limits, timeouts, size caps and an isolated network.

## 9. Pricing recommendation

Use a hybrid prepaid pay-as-you-go wallet, not a mandatory AI subscription:

- First published job with up to 20 application places: free.
- Extra capacity: very small per-head KES charge, calculated from the configured base rate.
- Requested document capacity: per accepted document allowance.
- AI ranking: metered by provider/model input and output usage plus a small platform margin.
- Advanced security: per scanned document.
- Optional monthly auto top-up and volume discounts for frequent employers.

This serves one-off Kenyan employers without locking them into a subscription while giving frequent employers predictable automation. A wallet reservation is made when a job is published; unused reserved capacity is released when it closes.

## 10. Company insights

Per job: views, unique visitors, starts, completions, qualified count, stage conversion, time to first review, time in stage, source/referral performance, application-cap forecast, document/security failures and hiring outcome.

Long-term: role demand, hiring velocity, response SLA, offer acceptance, repeated bottlenecks and spend. Exports are permissioned, watermarked, audited and limited to the company's own applicants.

Job seekers see aggregated, privacy-safe demand such as most requested roles, skills, counties, work settings and internship activity. Small groups are suppressed to prevent identification.

## 11. Notifications

Email events: application received, additional information requested, shortlisted, interview scheduled/changed, offer issued, hired, not selected, job closed and company message waiting.

Status transitions are idempotent and recorded once. Templates use neutral language and never expose private documents or full chat content.

## 12. Session and identity

- Browser session cookie: HTTP-only, secure in production, SameSite=Lax.
- Normal session: 30 days with activity-based renewal.
- Sensitive action: recent authentication or MFA/passkey confirmation.
- Company owners and safety admins: MFA required.
- Server authorization uses trusted database/app metadata, never user-editable profile metadata.
- Session revocation, device list and “sign out everywhere” remain available.

## 13. Identifiers

- Account, organization, job, application, conversation, message, document, report, wallet entry and audit event: UUID.
- Human job code: `PRF-YYYY-XXXXXXXX`.
- Public share code and application claim token: high-entropy random value; only a hash is stored.
- Guest email deduplication: per-job SHA-256 hash; raw contact details remain encrypted.
- Payment reference: provider reference plus internal UUID and idempotency key.
- AI run: UUID plus policy version, provider, model, prompt template hash and evidence hashes.

Public identifiers reveal no email, phone, company sequence or applicant count beyond the deliberately displayed capacity.

## 14. Public AI access

AI systems may query `/api/jobs`, crawl `/jobs/{id}`, read Schema.org JobPosting JSON-LD, consult `/llms.txt` and use the sitemap. The feed contains only public, open, non-full Kenyan jobs. Applicant, company-console, billing, chat and admin endpoints remain blocked from crawling.

## 15. Safety and moderation

Report reasons: fraud, harassment, discrimination, illegal content, impersonation, malware, stale job and other. Repeated credible reports can automatically pause a job pending review. Company verification, rate limits, CAPTCHA, abuse scoring and audit trails reduce bulk spam.

## 16. Release sequence

1. Back up and test the schema rename on a Supabase branch.
2. Run security and performance advisors.
3. Deploy migration and matching app in one maintenance window.
4. Verify public jobs, guest application, cap auto-close, chat inspection, company authorization and email delivery.
5. Re-index the sitemap and validate JobPosting structured data.
6. Monitor blocked uploads, application errors, stale jobs and payment reconciliation.

## 17. Payment implementation status

Paystack is connection-ready for KES wallet top-ups. The company billing page initializes checkout on the server, the callback verifies the transaction while authenticated, and the signed webhook provides reliable delivery. Both paths use the same atomic database finalizer so a reference can credit the wallet only once. Live credentials and production webhook registration remain an explicit deployment step.
