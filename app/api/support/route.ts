import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { sendEmail } from '@/lib/email';
import { jwtVerify } from 'jose';

export async function POST(req: NextRequest) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('profcaria_session')?.value;

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        let user: any;
        try {
            const { payload } = await jwtVerify(token, secret);
            user = payload;
        } catch (e) {
            return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
        }

        const body = await req.json();
        const { type, message } = body;

        if (!message || !type) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const subject = `[${type.toUpperCase()}] Support Request from ${user.email}`;

        const htmlContent = `
            <h2>New Support Request</h2>
            <p><strong>Type:</strong> ${type}</p>
            <p><strong>User Email:</strong> ${user.email}</p>
            <p><strong>User ID:</strong> ${user.uid}</p>
            <p><strong>Role:</strong> ${user.schema}</p>
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
        console.error('Support API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
