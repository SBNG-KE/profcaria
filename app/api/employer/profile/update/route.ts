import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { encryptData, hashForIndex } from '@/lib/security';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

// Force Node.js runtime
export const runtime = 'nodejs';

export async function PUT(req: Request) {
    try {
        // 1. Auth Check
        const cookieStore = await cookies();
        const token = cookieStore.get('profcaria_session')?.value;

        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(token, secret);
        const userId = payload.uid as string;
        const schema = payload.schema as string;

        if (schema !== 'employer') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        // 2. Parse Body
        const body = await req.json();
        const {
            companyName,
            website,
            email,
            country,
            city,
            address,
            about,
            foundedYear
        } = body;

        // 3. Update Companies Table (Name, Website, Email)
        const companyUpdates: any = {};
        if (companyName) {
            companyUpdates.enc_company_name = encryptData(companyName);

            const companyNameIndex = hashForIndex(companyName);
            const { data: existingName } = await supabaseAdmin
                .schema('employer')
                .from('companies')
                .select('id')
                .eq('company_name_index', companyNameIndex)
                .neq('id', userId)
                .single();

            if (existingName) {
                return NextResponse.json({ error: 'Company name already taken' }, { status: 409 });
            }
            companyUpdates.company_name_index = companyNameIndex;
        }
        if (website) companyUpdates.enc_website = encryptData(website);
        if (about) companyUpdates.enc_about = encryptData(about);
        if (foundedYear) companyUpdates.enc_founded_year = encryptData(foundedYear);
        if (email) {
            companyUpdates.enc_work_email = encryptData(email);
            companyUpdates.work_email_index = hashForIndex(email);
        }

        if (Object.keys(companyUpdates).length > 0) {
            const { error: dbError } = await supabaseAdmin
                .schema('employer')
                .from('companies')
                .update(companyUpdates)
                .eq('id', userId);

            if (dbError) throw dbError;
        }

        // 4. Handle Location Update (via Activity Log)
        if (country || city || address) {
            const locationObj = {
                country: country || '',
                city: city || '',
                address: address || '',
                timestamp: new Date().toISOString()
            };

            const ip = req.headers.get('x-forwarded-for') || 'Unknown IP';
            const userAgent = req.headers.get('user-agent') || 'Unknown UA';

            const { error: logError } = await supabaseAdmin
                .schema('employer')
                .from('activity_logs')
                .insert([{
                    user_id: userId,
                    enc_action: encryptData('LOCATION_UPDATE'),
                    enc_ip_address: encryptData(ip),
                    user_agent: userAgent,
                    enc_location_details: encryptData(JSON.stringify(locationObj))
                }]);

            if (logError) throw logError;
        }

        // 5. Log General Profile Update
        if (Object.keys(companyUpdates).length > 0 && !(country || city || address)) {
            const ip = req.headers.get('x-forwarded-for') || 'Unknown IP';
            const userAgent = req.headers.get('user-agent') || 'Unknown UA';
            await supabaseAdmin
                .schema('employer')
                .from('activity_logs')
                .insert([{
                    user_id: userId,
                    enc_action: encryptData('PROFILE_UPDATE'),
                    enc_ip_address: encryptData(ip),
                    user_agent: userAgent,
                    enc_location_details: null
                }]);
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Employer Profile Update API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
