import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { decryptData } from '@/lib/security';

export const runtime = 'nodejs';

export async function GET(req: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('profcaria_session')?.value;

        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(token, secret);
        const userId = payload.uid as string;

        const { data: logs, error } = await supabaseAdmin
            .schema('employer')
            .from('activity_logs')
            .select('enc_action, enc_ip_address, enc_location_details, created_at')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) {
            console.error('Fetch Logs Error:', error);
            return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 });
        }

        const processedLogs = logs.map((log: any) => {
            let location = 'N/A';
            if (log.enc_location_details) {
                try {
                    const decryptedStr = decryptData(log.enc_location_details as string);
                    if (decryptedStr) {
                        const dec = JSON.parse(decryptedStr);
                        const parts = [];
                        if (dec.city) parts.push(dec.city);
                        if (dec.country) parts.push(dec.country);
                        location = parts.join(', ') || 'Updated';
                    }
                } catch (e) {
                    location = 'Encrypted Data';
                }
            }
            return {
                ...log,
                action: decryptData(log.enc_action) || 'Encrypted Action',
                ip_address: decryptData(log.enc_ip_address) || 'Encrypted IP',
                location_details: location
            };
        });

        return NextResponse.json({ logs: processedLogs });

    } catch (error) {
        console.error('Activity API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
