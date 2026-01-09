
import { Resend } from 'resend';

// Initialize Resend with API Key (Production) or Mock (Development)
const resend = process.env.RESEND_API_KEY
    ? new Resend(process.env.RESEND_API_KEY)
    : null;

interface EmailConfig {
    to: string;
    code: string;
}

/**
 * Sends a Secure OTP via Resend.
 * Uses official Resend SDK for best-in-class delivery and security.
 */
export async function sendEmailOTP(to: string, code: string) {
    // 1. MOCK MODE (Development / No Key)
    if (!resend) {
        console.log('\n📧 [MOCK RESEND EMAIL]');
        console.log(`   To: ${to}`);
        console.log(`   Code: ${code}`);
        console.log('   Status: MOCKED (Set RESEND_API_KEY to enable real sending)\n');
        return { success: true, id: 'mock-id' };
    }

    // 2. PRODUCTION MODE (Real Send)
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verification Code</title>
        <style>
            body { margin: 0; padding: 0; background-color: #020617; color: #e2e8f0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; }
            .container { width: 100%; max-width: 100%; min-height: 100vh; background-color: #020617; display: grid; place-items: center; }
            .content { max-width: 600px; margin: 0 auto; padding: 40px 20px; text-align: center; }
            .logo { font-size: 28px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px; margin-bottom: 40px; text-transform: uppercase; }
            .card { background: #0f172a; border: 1px solid #1e293b; border-radius: 24px; padding: 48px 32px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); }
            .title { font-size: 24px; font-weight: 600; color: #ffffff; margin-bottom: 32px; letter-spacing: -0.5px; }
            .code-container { background: #1e293b; border: 1px solid #334155; border-radius: 16px; padding: 24px; margin: 32px 0; }
            .code { font-family: 'Courier New', monospace; font-size: 42px; font-weight: 700; color: #3b82f6; letter-spacing: 12px; line-height: 1; }
            .text { color: #94a3b8; line-height: 1.6; margin-bottom: 8px; }
            .footer { margin-top: 40px; color: #64748b; font-size: 13px; text-align: center; }
        </style>
    </head>
    <body>
        <div style="background-color: #020617; width: 100%; min-height: 100vh;">
            <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                    <td align="center" style="padding: 40px 20px;">
                        <!-- Logo -->
                        <div style="font-family: sans-serif; font-size: 28px; font-weight: 800; color: #ffffff; margin-bottom: 40px; letter-spacing: -1px;">
                            profcaria
                        </div>

                        <!-- Card -->
                        <div style="background-color: #0f172a; border: 1px solid #1e293b; border-radius: 24px; padding: 48px 40px; max-width: 480px; width: 100%; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);">
                            
                            <!-- Title -->
                            <h2 style="font-family: sans-serif; font-size: 20px; font-weight: 500; color: #e2e8f0; margin: 0 0 32px 0; letter-spacing: -0.5px;">
                                One-Time Verification Code
                            </h2>

                            <!-- Code Box -->
                            <div style="background-color: #020617; border: 1px solid #1e293b; border-radius: 16px; padding: 32px 0; margin-bottom: 32px;">
                                <span style="font-family: monospace; font-size: 42px; font-weight: 700; color: #3b82f6; letter-spacing: 12px; display: block;">${code}</span>
                            </div>

                            <!-- Instructions -->
                            <p style="font-family: sans-serif; color: #94a3b8; font-size: 14px; line-height: 1.6; margin: 0;">
                                This code is valid for <strong>10 minutes</strong>.<br>
                                Do not share this code with anyone.
                            </p>
                        </div>

                        <!-- Footer -->
                        <div style="margin-top: 40px; font-family: sans-serif; color: #475569; font-size: 12px;">
                            &copy; ${new Date().getFullYear()} Profcaria. All rights reserved.
                        </div>
                    </td>
                </tr>
            </table>
        </div>
    </body>
    </html>
    `;

    try {
        const { data, error } = await resend.emails.send({
            from: 'Profcaria Security <security@profcaria.com>', // Requires Domain Setup in Resend Dashboard
            // If domain not setup yet, use: 'onboarding@resend.dev' for testing
            to: [to],
            subject: 'Verification Code',
            html: htmlContent,
        });

        if (error) {
            console.error('❌ RESEND API ERROR:', JSON.stringify(error, null, 2));
            throw new Error(`Resend Error: ${error.message}`);
        }

        console.log('✅ Email sent via Resend:', data?.id);
        return { success: true, id: data?.id };
    } catch (error: any) {
        console.error('❌ EMAIL SEND FAILED:', error.message);
        throw error; // Re-throw to be caught by API route
    }
}
