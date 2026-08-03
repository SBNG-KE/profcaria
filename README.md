# Profcaria

Applying for jobs, made simple.

Profcaria is a Kenya-only jobs platform. The public home page is the job board; a job seeker can open a current vacancy and apply without creating an account. Companies must sign in to publish and manage jobs. Accounts become necessary for job seekers only when they want to track applications or reply to a company in the platform.

## Product rules

- Public jobs are limited to Kenya, including Kenya-restricted remote roles.
- Currency and billing are shown in Kenyan shillings (KES).
- Jobs disappear automatically at their closing time or application limit.
- No advertising, social feed, photo messaging, emoji reactions or stale vacancy inventory.
- Chat accepts text, HTTPS links and inspected PDF/DOCX/TXT documents.
- Basic hiring works without AI. AI ranking and advanced security analysis are optional usage charges.
- Public jobs are available through `/api/jobs`, per-job pages, Schema.org JobPosting JSON-LD, `llms.txt`, `robots.txt` and the sitemap.

See [the product blueprint](docs/PROFCARIA_PRODUCT_BLUEPRINT.md) for the complete scope, roles, lifecycle, identifiers, pricing and security rules.

## Local development

```bash
npm install
npm run dev
```

Copy the required server and publishable values into `.env.local`. Never expose the Supabase secret key in a browser variable.

## Database release order

The new migration renames the active application schema from the former product name to `profcaria`. Release it in the same maintenance window as the matching application build; applying the schema rename before deploying the code would interrupt the old production build.

## Paystack wallet

The payment bridge is prepared for KES-only company wallet top-ups. Initialization is server-side, callbacks require an authenticated company, webhooks require HMAC-SHA512 verification, and the wallet is credited atomically only after reference, amount, currency and provider status match. No live key is stored in the repository.

See [the Paystack and email cutover guide](docs/PAYSTACK_AND_EMAIL_CUTOVER.md) and copy `.env.example` when connecting test credentials.
