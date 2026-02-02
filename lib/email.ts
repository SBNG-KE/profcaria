
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
        body { margin: 0; padding: 0; background-color: #000000; color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
        ${getBaseStyles()}
    </style>
</head>
<body style="margin: 0; padding: 0; background-color: #000000;">
    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #000000;">
        <tr>
            <td align="center" style="padding: 40px 0;">
                <div class="container" style="max-width: 600px; width: 100%; margin: 0 auto;">
                    <!-- Logo -->
                    <div style="text-align: center; margin-bottom: 32px;">
                        <span style="font-size: 24px; font-weight: 900; color: #ffffff; letter-spacing: -1px; text-transform: uppercase;">profcaria</span>
                    </div>
                    
                    <!-- Content Card (Black with Subtle Border) -->
                    <div class="content" style="background-color: #000000; border: 1px solid #333333; border-radius: 24px; overflow: hidden;">
                        <div class="card" style="padding: 48px;">
                            ${content}
                        </div>
                    </div>

                    <!-- Footer -->
                <div style="text-align: center; margin-top: 32px; color: #525252; font-size: 12px; font-weight: 500;">
                    <p style="margin: 0 0 8px 0; letter-spacing: 1px; text-transform: uppercase;">&copy; ${new Date().getFullYear()} Profcaria</p>
                    <p style="margin: 0;">All rights reserved</p>
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
        <h1 class="title" style="margin: 0 0 24px 0; font-size: 24px; font-weight: 700; color: #ffffff; text-align: center; letter-spacing: -0.5px;">Verification Code</h1>
        <p style="margin: 0 0 32px 0; color: #a3a3a3; font-size: 15px; line-height: 1.6; text-align: center;">
            Please use the code below to verify your account. It will expire in 10 minutes.
        </p>
        <div style="background-color: #0a0a0a; border: 1px solid #262626; border-radius: 12px; padding: 24px; margin-bottom: 32px; text-align: center;">
            <span class="code" style="font-family: monospace; font-size: 42px; font-weight: 700; color: #ffffff; letter-spacing: 12px; display: block;">${code}</span>
        </div>
        <p style="margin: 0; color: #525252; font-size: 13px; text-align: center;">If you didn't request this, you can safely ignore this email.</p>
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
        <h1 class="title" style="margin: 0 0 16px 0; font-size: 24px; font-weight: 700; color: #ffffff; text-align: center; letter-spacing: -0.5px;">You're Invited</h1>
        <p style="margin: 0 0 24px 0; color: #d4d4d4; font-size: 16px; line-height: 1.6; text-align: center;">
            <strong>${companyName}</strong> has invited you to apply for their open role:
        </p>
        <div style="background-color: #0a0a0a; border: 1px solid #262626; border-radius: 12px; padding: 24px; margin-bottom: 32px; text-align: center;">
            <p style="margin: 0; font-size: 18px; font-weight: 700; color: #ffffff;">${jobTitle}</p>
        </div>
        <div style="text-align: center; margin-bottom: 32px;">
            <a href="${link}" style="display: inline-block; background-color: #ffffff; color: #000000; font-weight: 800; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; transition: all 0.2s;">View Job & Apply</a>
        </div>
        <p style="margin: 0; color: #525252; font-size: 13px; text-align: center; line-height: 1.5;">
            Click the button above to view the full job details. <br>To ensure security, this link is unique to you.
        </p>
    `;

    if (!resend) {
        throw new Error('Email service unavailable');
    }

    try {
        await resend.emails.send({
            from: 'Profcaria Talent <talent@profcaria.com>',
            to,
            subject: `Invited: ${jobTitle} at ${companyName}`,
            html: EmailWrapper(content)
        });
        return { success: true };
    } catch (e: any) {
        console.error('Email Error Details:', JSON.stringify(e, null, 2));
        throw e;
    }
}

export async function sendUnreadMessageNotification(to: string, senderName: string, jobTitle: string) {
    if (!resend) {
        console.log(`[MOCK EMAIL] Unread Message to ${to} from ${senderName}`);
        return { success: true };
    }

    const content = `
        <h1 class="title" style="margin: 0 0 16px 0; font-size: 24px; font-weight: 700; color: #ffffff; text-align: center; letter-spacing: -0.5px;">New Message</h1>
        <p style="margin: 0 0 24px 0; color: #d4d4d4; font-size: 16px; line-height: 1.6; text-align: center;">
            You have a new message from <strong>${senderName}</strong> regarding <strong>${jobTitle}</strong>.
        </p>
        <div style="background-color: #0a0a0a; border: 1px solid #262626; border-radius: 12px; padding: 20px; margin-bottom: 32px; text-align: center;">
            <p style="margin: 0; color: #a3a3a3; font-size: 14px; font-style: italic;">
                "They are waiting for your reply..."
            </p>
        </div>
        <div style="text-align: center; margin-bottom: 32px;">
            <a href="https://www.profcaria.com/auth" style="display: inline-block; background-color: #ffffff; color: #000000; font-weight: 800; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Go to Messages</a>
        </div>
        <p style="margin: 0; color: #525252; font-size: 13px; text-align: center; line-height: 1.5;">
            We sent this because you haven't been active recently.
        </p>
    `;

    try {
        await resend.emails.send({
            from: 'Profcaria Notifications <notifications@profcaria.com>',
            to,
            subject: `New Message from ${senderName}`,
            html: EmailWrapper(content)
        });
        return { success: true };
    } catch (e: any) {
        console.error('Email Error:', e);
        return { success: false, error: e.message };
    }
}

export async function sendEmail({ to, subject, html }: { to: string, subject: string, html: string }) {
    if (!resend) {
        console.log(`[MOCK EMAIL] Generic to ${to} | ${subject}`);
        return { success: true };
    }

    try {
        await resend.emails.send({
            from: 'Profcaria Support <support@profcaria.com>',
            to,
            subject,
            html: EmailWrapper(html)
        });
        return { success: true };
    } catch (e: any) {
        console.error('Email Error:', e);
        throw e;
    }
}

// NEW: Pre-Qualified Notification
export async function sendPreQualifiedNotification(to: string, jobTitle: string, companyName: string) {
    if (!resend) {
        console.log(`[MOCK EMAIL] Pre-Qualified to ${to} for ${jobTitle}`);
        return { success: true };
    }

    const content = `
        <h1 class="title" style="margin: 0 0 16px 0; font-size: 24px; font-weight: 700; color: #ffffff; text-align: center; letter-spacing: -0.5px;">Great News! 🎯</h1>
        <p style="margin: 0 0 24px 0; color: #d4d4d4; font-size: 16px; line-height: 1.6; text-align: center;">
            You've been <strong>pre-qualified</strong> for a position at <strong>${companyName}</strong>!
        </p>
        <div style="background-color: #0a0a0a; border: 1px solid #262626; border-radius: 12px; padding: 20px; margin-bottom: 24px; text-align: center;">
            <p style="margin: 0; font-size: 18px; font-weight: 700; color: #ffffff;">${jobTitle}</p>
        </div>
        <div style="background-color: #ffffff; border: 1px solid #e5e5e5; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
            <p style="margin: 0; color: #000000; font-size: 14px; text-align: center;">
                <strong>🔔 Stay Alert!</strong><br>
                The employer may reach out with messages soon. Please check your inbox and notifications regularly.
            </p>
        </div>
        <div style="text-align: center; margin-bottom: 32px;">
            <a href="https://www.profcaria.com/auth" style="display: inline-block; background-color: #ffffff; color: #000000; font-weight: 800; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; border: 1px solid #e5e5e5;">Check Your Dashboard</a>
        </div>
        <p style="margin: 0; color: #525252; font-size: 13px; text-align: center; line-height: 1.5;">
            This is an important step forward. Keep your profile updated and be ready to respond promptly!
        </p>
    `;

    try {
        await resend.emails.send({
            from: 'Profcaria Talent <talent@profcaria.com>',
            to,
            subject: `🎯 Pre-Qualified: ${jobTitle} at ${companyName}`,
            html: EmailWrapper(content)
        });
        return { success: true };
    } catch (e: any) {
        console.error('Email Error:', e);
        return { success: false, error: e.message };
    }
}

// NEW: Employed Notification - CRITICAL EMAIL
export async function sendEmployedNotification(to: string, jobTitle: string, companyName: string) {
    if (!resend) {
        console.log(`[MOCK EMAIL] EMPLOYED to ${to} for ${jobTitle}`);
        return { success: true };
    }

    const content = `
        <div style="text-align: center; margin-bottom: 24px;">
            <span style="font-size: 48px;">🎉</span>
        </div>
        <h1 class="title" style="margin: 0 0 16px 0; font-size: 28px; font-weight: 900; color: #ffffff; text-align: center; letter-spacing: -1px;">Congratulations!</h1>
        <p style="margin: 0 0 8px 0; color: #10b981; font-size: 18px; font-weight: 700; text-align: center; text-transform: uppercase; letter-spacing: 2px;">
            You're Officially Employed!
        </p>
        <p style="margin: 0 0 32px 0; color: #d4d4d4; font-size: 16px; line-height: 1.6; text-align: center;">
            <strong>${companyName}</strong> has hired you for the position of:
        </p>
        
        <!-- Semantic Green preserved for critical success state -->
        <div style="background-color: #064e3b; border: 1px solid #10b981; border-radius: 16px; padding: 24px; margin-bottom: 32px; text-align: center; box-shadow: 0 0 40px -10px rgba(16, 185, 129, 0.2);">
            <p style="margin: 0; font-size: 22px; font-weight: 800; color: #ffffff; text-transform: uppercase; letter-spacing: 1px;">${jobTitle}</p>
        </div>
        
        <div style="background-color: #0a0a0a; border: 1px solid #262626; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
            <p style="margin: 0; color: #a3a3a3; font-size: 14px; text-align: center; font-weight: 500;">
                <strong>⚠️ IMPORTANT</strong><br><br>
                Please check your emails and Profcaria notifications regularly!<br>
                The employer will be sending important onboarding information, contracts, and next steps.
            </p>
        </div>
        
        <div style="text-align: center; margin-bottom: 32px;">
            <a href="https://www.profcaria.com/auth" style="display: inline-block; background-color: #ffffff; color: #000000; font-weight: 800; padding: 18px 40px; border-radius: 14px; text-decoration: none; font-size: 15px; text-transform: uppercase; letter-spacing: 1px;">Go to Your Dashboard</a>
        </div>
        
        <p style="margin: 0; color: #525252; font-size: 13px; text-align: center; line-height: 1.6;">
            Your journey with <strong>${companyName}</strong> begins now.<br>
            We wish you all the best in your new role! 🚀
        </p>
    `;

    try {
        await resend.emails.send({
            from: 'Profcaria Careers <careers@profcaria.com>',
            to,
            subject: `🎉 Congratulations! You've been hired at ${companyName}!`,
            html: EmailWrapper(content)
        });
        return { success: true };
    } catch (e: any) {
        console.error('Email Error:', e);
        throw e;
    }
}

// NEW: Follower Notification
export async function sendNewFollowerNotification(to: string, followerName: string, followerType: string, link: string) {
    if (!resend) {
        console.log(`[MOCK EMAIL] New Follower to ${to}: ${followerName}`);
        return { success: true };
    }

    const title = followerType === 'company' ? 'New Subscriber' : 'New Follower';
    const actionText = followerType === 'company' ? 'subscribed to' : 'started following';

    const content = `
        <h1 class="title" style="margin: 0 0 16px 0; font-size: 24px; font-weight: 700; color: #ffffff; text-align: center; letter-spacing: -0.5px;">${title} 🚀</h1>
        <p style="margin: 0 0 24px 0; color: #d4d4d4; font-size: 16px; line-height: 1.6; text-align: center;">
            <strong>${followerName}</strong> has ${actionText} your profile!
        </p>
        <div style="background-color: #0a0a0a; border: 1px solid #262626; border-radius: 12px; padding: 24px; margin-bottom: 32px; text-align: center;">
            <div style="width: 64px; height: 64px; background-color: #262626; border-radius: 50%; margin: 0 auto 16px auto; display: flex; align-items: center; justify-content: center; overflow: hidden;">
                <span style="font-size: 24px;">👤</span> 
            </div>
            <p style="margin: 0; font-size: 18px; font-weight: 700; color: #ffffff;">${followerName}</p>
        </div>
        <div style="text-align: center; margin-bottom: 32px;">
            <a href="${link}" style="display: inline-block; background-color: #ffffff; color: #000000; font-weight: 800; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; transition: all 0.2s;">View Profile</a>
        </div>
        <p style="margin: 0; color: #525252; font-size: 13px; text-align: center; line-height: 1.5;">
            Expand your network by checking out their profile.
        </p>
    `;

    try {
        await resend.emails.send({
            from: 'Profcaria Notifications <notifications@profcaria.com>',
            to,
            subject: `New ${title}: ${followerName}`,
            html: EmailWrapper(content)
        });
        return { success: true };
    } catch (e: any) {
        console.error('Email Error:', e);
        return { success: false, error: e.message };
    }
}

// NEW: Application Received Notification (for Employers)
export async function sendApplicationReceivedEmail(to: string, applicantName: string, jobTitle: string, jobId: string) {
    if (!resend) {
        console.log(`[MOCK EMAIL] Application Received to ${to}: ${applicantName} applied for ${jobTitle}`);
        return { success: true };
    }

    const link = `https://www.profcaria.com/employer/jobs/${jobId}/applications`;

    const content = `
        <h1 class="title" style="margin: 0 0 16px 0; font-size: 24px; font-weight: 700; color: #ffffff; text-align: center; letter-spacing: -0.5px;">New Application 📩</h1>
        <p style="margin: 0 0 24px 0; color: #d4d4d4; font-size: 16px; line-height: 1.6; text-align: center;">
            Someone has applied to your open position!
        </p>
        <div style="background-color: #0a0a0a; border: 1px solid #262626; border-radius: 12px; padding: 24px; margin-bottom: 24px; text-align: center;">
            <p style="margin: 0 0 8px 0; font-size: 14px; color: #a3a3a3; text-transform: uppercase; letter-spacing: 1px;">Applicant</p>
            <p style="margin: 0; font-size: 20px; font-weight: 700; color: #ffffff;">${applicantName}</p>
        </div>
        <div style="background-color: #0a0a0a; border: 1px solid #262626; border-radius: 12px; padding: 24px; margin-bottom: 32px; text-align: center;">
            <p style="margin: 0 0 8px 0; font-size: 14px; color: #a3a3a3; text-transform: uppercase; letter-spacing: 1px;">Position</p>
            <p style="margin: 0; font-size: 18px; font-weight: 700; color: #ffffff;">${jobTitle}</p>
        </div>
        <div style="text-align: center; margin-bottom: 32px;">
            <a href="${link}" style="display: inline-block; background-color: #ffffff; color: #000000; font-weight: 800; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Review Application</a>
        </div>
        <p style="margin: 0; color: #525252; font-size: 13px; text-align: center; line-height: 1.5;">
            We recommend reviewing applications promptly to find the best candidates.
        </p>
    `;

    try {
        await resend.emails.send({
            from: 'Profcaria Talent <talent@profcaria.com>',
            to,
            subject: `New Application: ${applicantName} for ${jobTitle}`,
            html: EmailWrapper(content)
        });
        return { success: true };
    } catch (e: any) {
        console.error('Email Error:', e);
        return { success: false, error: e.message };
    }
}

// NEW: Job Recommendation Email (for Professionals)
interface RecommendedJob {
    id: string;
    title: string;
    companyName: string;
    location?: string;
}

export async function sendJobRecommendationEmail(to: string, recipientName: string, jobs: RecommendedJob[]) {
    if (!resend || jobs.length === 0) {
        console.log(`[MOCK EMAIL] Job Recommendations to ${to}: ${jobs.length} jobs`);
        return { success: true };
    }

    const jobCards = jobs.slice(0, 5).map(job => {
        const link = `https://www.profcaria.com/professional/find?ref=email&job=${job.id}`;
        return `
            <div style="background-color: #0a0a0a; border: 1px solid #262626; border-radius: 12px; padding: 20px; margin-bottom: 16px;">
                <p style="margin: 0 0 8px 0; font-size: 16px; font-weight: 700; color: #ffffff;">${job.title}</p>
                <p style="margin: 0 0 12px 0; font-size: 14px; color: #a3a3a3;">${job.companyName}${job.location ? ` • ${job.location}` : ''}</p>
                <a href="${link}" style="display: inline-block; background-color: #262626; color: #ffffff; font-weight: 700; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">View & Apply</a>
            </div>
        `;
    }).join('');

    const content = `
        <h1 class="title" style="margin: 0 0 16px 0; font-size: 24px; font-weight: 700; color: #ffffff; text-align: center; letter-spacing: -0.5px;">Jobs For You ✨</h1>
        <p style="margin: 0 0 24px 0; color: #d4d4d4; font-size: 16px; line-height: 1.6; text-align: center;">
            Hi ${recipientName}, here are some opportunities tailored just for you:
        </p>
        ${jobCards}
        <div style="text-align: center; margin-top: 32px; margin-bottom: 24px;">
            <a href="https://www.profcaria.com/professional/find" style="display: inline-block; background-color: #ffffff; color: #000000; font-weight: 800; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Browse All Jobs</a>
        </div>
        <p style="margin: 0; color: #525252; font-size: 13px; text-align: center; line-height: 1.5;">
            These recommendations are powered by our AI matching algorithm based on your profile and preferences.
        </p>
    `;

    try {
        await resend.emails.send({
            from: 'Profcaria Jobs <jobs@profcaria.com>',
            to,
            subject: `${jobs.length} New Job${jobs.length > 1 ? 's' : ''} Matched For You`,
            html: EmailWrapper(content)
        });
        return { success: true };
    } catch (e: any) {
        console.error('Email Error:', e);
        return { success: false, error: e.message };
    }
}

// NEW: Promo Welcome Email (for Early Adopters)
export async function sendPromoWelcomeEmail(
    to: string,
    recipientName: string,
    planName: string,
    expiresAt: string,
    entityType: 'professional' | 'employer'
) {
    if (!resend) {
        console.log(`[MOCK EMAIL] Promo Welcome to ${to}: ${planName} until ${expiresAt}`);
        return { success: true };
    }

    const expiryDate = new Date(expiresAt);
    const formattedExpiry = expiryDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const dashboardUrl = entityType === 'employer'
        ? 'https://www.profcaria.com/employer/dashboard'
        : 'https://www.profcaria.com/professional/feed';

    const content = `
        <div style="text-align: center; margin-bottom: 24px;">
            <span style="font-size: 48px;">🎁</span>
        </div>
        <h1 class="title" style="margin: 0 0 16px 0; font-size: 28px; font-weight: 900; color: #ffffff; text-align: center; letter-spacing: -1px;">Welcome, Early Adopter!</h1>
        <p style="margin: 0 0 8px 0; color: #a855f7; font-size: 16px; font-weight: 700; text-align: center; text-transform: uppercase; letter-spacing: 2px;">
            You're One of Our First Users
        </p>
        <p style="margin: 0 0 32px 0; color: #d4d4d4; font-size: 16px; line-height: 1.6; text-align: center;">
            Hi ${recipientName}, thank you for being an early adopter of Profcaria!
        </p>
        
        <div style="background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); border-radius: 16px; padding: 24px; margin-bottom: 32px; text-align: center;">
            <p style="margin: 0 0 8px 0; font-size: 14px; color: rgba(255,255,255,0.8); text-transform: uppercase; letter-spacing: 1px;">Your Free Premium Access</p>
            <p style="margin: 0 0 12px 0; font-size: 24px; font-weight: 800; color: #ffffff; text-transform: uppercase;">${planName} Plan</p>
            <p style="margin: 0; font-size: 14px; color: rgba(255,255,255,0.9);">Valid until <strong>${formattedExpiry}</strong></p>
        </div>
        
        <div style="background-color: #0a0a0a; border: 1px solid #262626; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
            <p style="margin: 0; color: #a3a3a3; font-size: 14px; text-align: center; line-height: 1.6;">
                <strong style="color: #ffffff;">What's Included:</strong><br/>
                ✓ All premium features unlocked<br/>
                ✓ Cancel anytime
            </p>
        </div>
        
        <div style="text-align: center; margin-bottom: 32px;">
            <a href="${dashboardUrl}" style="display: inline-block; background-color: #ffffff; color: #000000; font-weight: 800; padding: 18px 40px; border-radius: 14px; text-decoration: none; font-size: 15px; text-transform: uppercase; letter-spacing: 1px;">Start Using Premium</a>
        </div>
        
        <p style="margin: 0; color: #525252; font-size: 13px; text-align: center; line-height: 1.6;">
            We're thrilled to have you as part of our founding community.<br/>
            Your feedback helps shape the future of Profcaria! 🚀
        </p>
    `;

    try {
        await resend.emails.send({
            from: 'Profcaria Premium <premium@profcaria.com>',
            to,
            subject: `🎁 Welcome! Your Free ${planName} Premium Access is Active`,
            html: EmailWrapper(content)
        });
        return { success: true };
    } catch (e: any) {
        console.error('Email Error:', e);
        return { success: false, error: e.message };
    }
}

