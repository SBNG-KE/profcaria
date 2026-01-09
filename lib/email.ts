
import { Resend } from 'resend';

// Initialize Resend
const resend = process.env.RESEND_API_KEY
    ? new Resend(process.env.RESEND_API_KEY)
    : null;

// --- RESPONSIVE EMAIL TEMPLATE BUILDER ---

const getBaseStyles = () => `
    @media only screen and (max-width: 600px) {
        .container { padding: 0 !important; }
        .content { width: 100% !important; max-width: 100% !important; border-radius: 0 !important; border: none !important; }
        .card { padding: 32px 20px !important; }
        .title { font-size: 20px !important; }
        .code { font-size: 32px !important; letter-spacing: 8px !important; }
    }
`;

const EmailWrapper = (content: string) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { margin: 0; padding: 0; background-color: #020617; color: #e2e8f0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
        ${getBaseStyles()}
    </style>
</head>
<body style="margin: 0; padding: 0; background-color: #020617;">
    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #020617;">
        <tr>
            <td align="center" style="padding: 40px 0;">
                <div class="container" style="max-width: 600px; width: 100%; margin: 0 auto;">
                    <!-- Logo -->
                    <div style="text-align: center; margin-bottom: 32px;">
                        <span style="font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: -1px; text-transform: uppercase;">profcaria</span>
                    </div>
                    
                    <!-- Content Card -->
                    <div class="content" style="background-color: #0f172a; border: 1px solid #1e293b; border-radius: 24px; overflow: hidden;">
                        <div class="card" style="padding: 48px;">
                            ${content}
                        </div>
                    </div>

                    <!-- Footer -->
                    <div style="text-align: center; margin-top: 32px; color: #475569; font-size: 13px;">
                        <p style="margin: 0;">&copy; ${new Date().getFullYear()} Profcaria. All rights reserved.</p>
                        <p style="margin: 8px 0 0 0;">You received this because you are part of our network.</p>
                    </div>
                </div>
            </td>
        </tr>
    </table>
</body>
</html>
`;

export async function sendEmailOTP(to: string, code: string) {
    if (!resend) {
        console.log(`[MOCK EMAIL] OTP to ${to}: ${code}`);
        return { success: true };
    }

    const content = `
        <h1 class="title" style="margin: 0 0 24px 0; font-size: 24px; font-weight: 600; color: #ffffff; text-align: center;">Verification Code</h1>
        <p style="margin: 0 0 32px 0; color: #94a3b8; font-size: 15px; line-height: 1.6; text-align: center;">
            Please use the code below to verify your account. It will expire in 10 minutes.
        </p>
        <div style="background-color: #020617; border: 1px solid #1e293b; border-radius: 12px; padding: 24px; margin-bottom: 32px; text-align: center;">
            <span class="code" style="font-family: monospace; font-size: 42px; font-weight: 700; color: #3b82f6; letter-spacing: 12px; display: block;">${code}</span>
        </div>
        <p style="margin: 0; color: #64748b; font-size: 13px; text-align: center;">If you didn't request this, you can safely ignore this email.</p>
    `;

    try {
        await resend.emails.send({
            from: 'Profcaria Security <security@profcaria.com>',
            to,
            subject: 'Your Verification Code',
            html: EmailWrapper(content)
        });
        return { success: true };
    } catch (e: any) {
        console.error('Email Error:', e);
        throw e;
    }
}

export async function sendJobInvite(to: string, jobTitle: string, companyName: string, link: string) {
    if (!resend) {
        console.log(`[MOCK EMAIL] Invite to ${to} for ${jobTitle}. Link: ${link}`);
        return { success: true };
    }

    const content = `
        <div style="text-align: center;">
            <div style="display: inline-block; background-color: #3b82f6; color: #ffffff; width: 48px; height: 48px; border-radius: 50%; line-height: 48px; font-size: 24px; margin-bottom: 24px;">🚀</div>
        </div>
        <h1 class="title" style="margin: 0 0 16px 0; font-size: 24px; font-weight: 600; color: #ffffff; text-align: center;">You're Invited!</h1>
        <p style="margin: 0 0 24px 0; color: #e2e8f0; font-size: 16px; line-height: 1.6; text-align: center;">
            <strong>${companyName}</strong> thinks you'd be a great fit for their open role:
        </p>
        <div style="background-color: #1e293b; border-radius: 12px; padding: 20px; margin-bottom: 32px; text-align: center;">
            <p style="margin: 0; font-size: 18px; font-weight: 700; color: #ffffff;">${jobTitle}</p>
        </div>
        <div style="text-align: center; margin-bottom: 32px;">
            <a href="${link}" style="display: inline-block; background-color: #10b981; color: #ffffff; font-weight: 700; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.2);">View Job & Apply</a>
        </div>
        <p style="margin: 0; color: #64748b; font-size: 13px; text-align: center; line-height: 1.5;">
            Click the button above to view the full job details. <br>To ensure security, this link is unique to you.
        </p>
    `;

    try {
        await resend.emails.send({
            from: 'Profcaria Talent <talent@profcaria.com>',
            to,
            subject: `Invited: ${jobTitle} at ${companyName}`,
            html: EmailWrapper(content)
        });
        return { success: true };
    } catch (e: any) {
        console.error('Email Error:', e);
        throw e;
    }
}
