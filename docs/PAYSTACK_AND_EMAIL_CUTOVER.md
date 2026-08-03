# Profcaria payment and email cutover

## Paystack connection

The code is prepared for KES wallet top-ups. Do not add live credentials until a test-mode payment completes end to end.

1. Create or open the Profcaria Paystack business account.
2. Add `PAYSTACK_SECRET_KEY=sk_test_...` to the server environment. Never expose it as a `NEXT_PUBLIC_` variable.
3. Set `NEXT_PUBLIC_APP_URL` to the deployed HTTPS origin.
4. Configure the webhook as `https://YOUR_DOMAIN/api/payments/paystack/webhook`.
5. Set `PAYSTACK_WALLET_ENABLED=true` only in the environment where you are intentionally testing.
6. Run a KES 100 test top-up from `/employer/billing`.
7. Confirm one successful payment row, one wallet-top-up ledger row and one balance increase.
8. Replay the callback and webhook. The balance must not increase again.
9. Only then use `sk_live_...`, restrict key access and consider Paystack IP restrictions.

Profcaria credits value only after server verification of status, stored reference, amount and KES currency. The signed webhook and authenticated callback use the same idempotent database finalizer.

## Google Workspace later

Use the product domain as the primary Workspace domain and create role addresses rather than personal shared passwords:

- `jobs@` for application and hiring questions
- `support@` for account help
- `security@` for abuse and document-security reports
- `billing@` for receipts and payment support
- `no-reply@` as a sending identity only

Before production sending, configure SPF, DKIM and DMARC. Keep transactional and human-support identities separate, use least-privilege OAuth or a dedicated transactional mail provider instead of a staff mailbox password, and add bounce, complaint and unsubscribe processing before non-transactional mail.
