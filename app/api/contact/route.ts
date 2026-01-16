import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { email, message } = body;

        if (!message || !email) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
        }

        const subject = `[CONTACT] New Contact Form Submission`;

        const htmlContent = `
            <h2>New Contact Form Submission</h2>
            <p><strong>From:</strong> ${email}</p>
            <hr />
            <h3>Message:</h3>
            <p>${message.replace(/\n/g, '<br>')}</p>
        `;

        // Send to Support Team
        await sendEmail({
            to: 'support@profcaria.com',
            subject: subject,
            html: htmlContent
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Contact API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
