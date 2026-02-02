import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { sendPromoWelcomeEmail } from '@/lib/email';
import { decryptData } from '@/lib/security';

export const runtime = 'nodejs';

// One-time API to send welcome emails to existing promo users who haven't received it
// Protected by secret key OR admin email to prevent abuse
export async function POST(req: NextRequest) {
    try {
        const { secretKey, adminEmail } = await req.json();

        // Security check - allow with secret key OR verified admin email
        const validSecretKey = secretKey === process.env.ADMIN_SECRET_KEY;
        const validAdminEmail = adminEmail === process.env.ADMIN_EMAIL;

        if (!validSecretKey && !validAdminEmail) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const results = {
            employers: { sent: 0, failed: 0, skipped: 0 },
            professionals: { sent: 0, failed: 0, skipped: 0 }
        };

        // 1. Get all employer promo claims that haven't been emailed
        const { data: employerClaims } = await supabaseAdmin
            .from('promotion_claims')
            .select('company_id, expires_at, promo_code, email_sent')
            .not('company_id', 'is', null)
            .or('email_sent.is.null,email_sent.eq.false');

        for (const claim of employerClaims || []) {
            if (!claim.company_id) continue;

            try {
                const { data: company } = await supabaseAdmin
                    .schema('employer')
                    .from('companies')
                    .select('admin_email, enc_name')
                    .eq('id', claim.company_id)
                    .single();

                if (!company?.admin_email || !company.enc_name) {
                    results.employers.skipped++;
                    continue;
                }

                const companyName = decryptData(company.enc_name);
                if (!companyName) {
                    results.employers.skipped++;
                    continue;
                }

                await sendPromoWelcomeEmail(
                    company.admin_email,
                    companyName,
                    'Pro',
                    claim.expires_at,
                    'employer'
                );

                // Mark as sent
                await supabaseAdmin
                    .from('promotion_claims')
                    .update({ email_sent: true })
                    .eq('company_id', claim.company_id)
                    .eq('promo_code', claim.promo_code);

                results.employers.sent++;
            } catch (err) {
                console.error('Employer email error:', err);
                results.employers.failed++;
            }
        }

        // 2. Get all professional promo claims that haven't been emailed
        const { data: professionalClaims } = await supabaseAdmin
            .from('promotion_claims')
            .select('user_id, expires_at, promo_code, email_sent')
            .not('user_id', 'is', null)
            .or('email_sent.is.null,email_sent.eq.false');

        for (const claim of professionalClaims || []) {
            if (!claim.user_id) continue;

            try {
                const { data: user } = await supabaseAdmin
                    .schema('professional')
                    .from('users')
                    .select('enc_email, enc_first_name')
                    .eq('id', claim.user_id)
                    .single();

                if (!user?.enc_email || !user.enc_first_name) {
                    results.professionals.skipped++;
                    continue;
                }

                const email = decryptData(user.enc_email);
                const firstName = decryptData(user.enc_first_name);

                if (!email || !firstName) {
                    results.professionals.skipped++;
                    continue;
                }

                await sendPromoWelcomeEmail(
                    email,
                    firstName,
                    'Premium',
                    claim.expires_at,
                    'professional'
                );

                // Mark as sent
                await supabaseAdmin
                    .from('promotion_claims')
                    .update({ email_sent: true })
                    .eq('user_id', claim.user_id)
                    .eq('promo_code', claim.promo_code);

                results.professionals.sent++;
            } catch (err) {
                console.error('Professional email error:', err);
                results.professionals.failed++;
            }
        }

        return NextResponse.json({
            success: true,
            results,
            message: `Sent ${results.employers.sent + results.professionals.sent} emails`
        });

    } catch (error: any) {
        console.error('Batch email error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
