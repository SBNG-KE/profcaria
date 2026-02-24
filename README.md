# Profcaria

Profcaria is a modern, AI-powered dual-sided platform connecting Professionals with Employers. It is built to offer advanced networking, intelligent skill-matching, and seamless interaction for both individuals seeking jobs/networking and companies hiring talent.

## 🚀 Tech Stack

- **Framework:** [Next.js 16 (App Router)](https://nextjs.org/)
- **Language:** TypeScript
- **Styling:** Tailwind CSS (v4) & Framer Motion for animations
- **Database & Authentication:** [Supabase](https://supabase.com/) (PostgreSQL)
- **AI & Machine Learning:** HuggingFace Inference (`@huggingface/inference`) & Xenova Transformers for local vectorization and similarity searching
- **Payments:** Paystack & Stripe (for subscriptions/billing)
- **Emails:** Resend & Nodemailer
- **Caching & Rate Limiting:** Redis via Upstash
- **Security:** WebAuthn (Passkeys) via `@simplewebauthn`, embedded VPN/bot detection
- **Analytics:** Vercel Analytics

## 📁 Project Structure

The project follows a standard Next.js App Router structure with customized subdirectories for platform roles:

- **`app/employer/`**: Routes and dashboards specifically for verified employers.
- **`app/professional/`**: Routes and profiles for individual professionals.
- **`app/admin/` & `app/company/`**: Administrative and company-level management pages.
- **`app/api/`**: Next.js API Routes (over 100+ endpoints) handling authentication, webhook processing (Stripe/Paystack), and AI indexing.
- **`lib/`**: Core utilities and wrappers:
  - `ai-moderation.ts`, `vector-search.ts`, `skills-matching.ts`: AI-based search and moderation.
  - `billing-config.ts`, `paystack.ts`: Payment logic.
  - `email.ts`: Mailing system.
  - `security.ts`, `vpn.ts`, `rate-limit.ts`: Security and abuse prevention tools.
- **`components/`**: Reusable React components prioritizing modern UI with Tailwind and Framer Motion.
- **`supabase/`**: Database migrations and configuration schemas.
- **`public/`**: Static assets.

## ⚙️ Core Features

- **Dual-sided Profiles:** Distinct workflows, dashboards, and features for Employers and Professionals.
- **AI-Powered Recommendations:** Utilizes pgvector via Supabase and local embeddings to match skills, roles, and job postings intelligently.
- **Verification System:** Badges, verified employment history, and secure identity checking.
- **Social Graph & Analytics:** Features follower systems, posts, dwell-time tracking, and analytics dashboards for users to track their reach.
- **Robust Security:** Integration with Passkeys (WebAuthn), strict Rate Limiting via Redis, and VPN/Proxy detection to ensure authentic traffic.

## 🛠️ Getting Started

### Prerequisites

Ensure you have the following installed:
- Node.js (v20+)
- npm / yarn / pnpm / bun

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd profcaria
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Copy `.env.local.example` or set up a new `.env.local` containing your credentials for:
   - Next.js (URLs, API keys)
   - Supabase (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`)
   - Payments (`STRIPE_SECRET_KEY`, `PAYSTACK_SECRET_KEY`)
   - Upstash Redis
   - Resend

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🧑‍💻 Scripts

- `npm run dev`: Starts the Next.js development server.
- `npm run build`: Builds the application for production.
- `npm run start`: Starts the production server.
- `npm run lint`: Runs ESLint for code quality checks.

## 🛡️ Linting & Formatting

The project uses ESLint with strict rules to maintain high code quality. Address any `eslint` warnings iteratively to uphold the standard.

## 📚 Read More
For company-level overview, pricing models, and mission, refer to the included `Profcaria_Company_Profile.docx`.
