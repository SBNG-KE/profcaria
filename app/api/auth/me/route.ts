//app/api/auth/me/route.ts
/* eslint-disable @typescript-eslint/no-explicit-any */

import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { supabaseAdmin } from '@/lib/supabase';
import { decryptData } from '@/lib/security';
import { getFollowerCount } from '@/lib/followers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('profcaria_session')?.value;

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const secretKey = new TextEncoder().encode(process.env.JWT_SECRET);

        let payload;
        try {
            const { payload: verifiedPayload } = await jwtVerify(token, secretKey);
            payload = verifiedPayload as { [key: string]: any };
        } catch {
            return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
        }

        const { uid, schema } = payload;

        // Fetch Security Flags and Profile Data
        const isProfessional = schema === 'professional';
        const userTable = isProfessional ? 'users' : 'companies';
        const emailField = isProfessional ? 'email_index' : 'work_email_index';

        let selectFields = `has_passkey, has_totp, has_email_otp, requires_2fa, default_2fa_method, created_at, ${emailField}`;

        if (isProfessional) {
            selectFields += `, enc_first_name, enc_last_name, enc_current_role, enc_profile_image_url, enc_email, enc_phone_number, enc_about, follower_count, short_url, intent_mode, is_available_for_hire`;
        } else {
            selectFields += `, enc_company_name, enc_logo_url, enc_website, enc_work_email, enc_about, enc_founded_year, follower_count, industry, short_url`; // Add employer fields
        }

        const { data: user, error } = await supabaseAdmin
            .schema(schema as string)
            .from(userTable)
            .select(selectFields)
            .eq('id', uid)
            .single() as any;

        if (error || !user) {
            console.error('Fetch User Error:', error);
            // Check if it's a 401/Auth issue implicitly
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        let profile: any = {};
        if (isProfessional) {
            profile = {
                firstName: decryptData(user.enc_first_name),
                lastName: decryptData(user.enc_last_name),
                role: decryptData(user.enc_current_role),
                profileImageUrl: decryptData(user.enc_profile_image_url),
                email: decryptData(user.enc_email) || payload.email || '',
                phone: decryptData(user.enc_phone_number) || '',
                about: decryptData(user.enc_about) || '',
                followerCount: await getFollowerCount(uid, 'professional'),
                shortUrl: user.short_url || '',
                intentMode: user.intent_mode || 'open_to_offers',
                isAvailableForHire: user.is_available_for_hire !== false
            };

            // Fetch Latest Location from Activity Logs
            const { data: latestLog } = await supabaseAdmin
                .schema('professional')
                .from('activity_logs')
                .select('enc_location_details')
                .eq('user_id', uid)
                .neq('enc_location_details', null) // Only logs with location
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (latestLog?.enc_location_details) {
                const decryptedLoc = decryptData(latestLog.enc_location_details);
                if (decryptedLoc) {
                    try {
                        if (decryptedLoc.trim().startsWith('{')) {
                            const locationData = JSON.parse(decryptedLoc);
                            profile.country = locationData.country || '';
                            profile.city = locationData.city || '';
                            profile.address = locationData.address || '';
                            // Legacy/Plain string case (JSON block ends, but inner legacy check was redundant/wrong)
                        } else {
                            // Legacy/Plain string case (Not JSON)
                            if (decryptedLoc.includes(',')) {
                                const parts = decryptedLoc.split(',').map(s => s.trim());
                                const country = parts.pop();
                                const city = parts.join(', ');
                                profile.country = country || '';
                                profile.city = city || '';
                                profile.address = '';
                            } else {
                                profile.address = decryptedLoc;
                            }
                        }
                    } catch {
                        // Same fallback logic for error
                        if (decryptedLoc.includes(',')) {
                            const parts = decryptedLoc.split(',').map(s => s.trim());
                            const country = parts.pop();
                            const city = parts.join(', ');
                            profile.country = country || '';
                            profile.city = city || '';
                        } else {
                            profile.address = decryptedLoc;
                        }
                    }
                }
            }
        } else {
            profile = {
                companyName: decryptData(user.enc_company_name),
                logoUrl: decryptData(user.enc_logo_url),
                website: decryptData(user.enc_website), // Assuming website might be needed
                email: decryptData(user.enc_work_email) || payload.email || '',
                about: decryptData(user.enc_about) || '',
                foundedYear: decryptData(user.enc_founded_year) || '',
                followerCount: await getFollowerCount(uid, 'employer'),
                industry: user.industry || '',
                shortUrl: user.short_url || ''
            };

            // Fetch Latest Location from Employer Activity Logs
            const { data: latestLog } = await supabaseAdmin
                .schema('employer')
                .from('activity_logs')
                .select('enc_location_details')
                .eq('user_id', uid)
                .neq('enc_location_details', null)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (latestLog?.enc_location_details) {
                const decryptedLoc = decryptData(latestLog.enc_location_details);
                if (decryptedLoc) {
                    try {
                        // Check if it looks like JSON
                        if (decryptedLoc.trim().startsWith('{')) {
                            const locationData = JSON.parse(decryptedLoc);
                            profile.country = locationData.country || '';
                            profile.city = locationData.city || '';
                            profile.address = locationData.address || '';
                            // Legacy/Plain string case
                            if (decryptedLoc.includes(',')) {
                                const parts = decryptedLoc.split(',').map(s => s.trim());
                                const country = parts.pop();
                                const city = parts.join(', ');
                                profile.country = country || '';
                                profile.city = city || '';
                                profile.address = '';
                            } else {
                                profile.address = decryptedLoc;
                            }
                        } else {
                            // Legacy/Plain string case (Not JSON)
                            if (decryptedLoc.includes(',')) {
                                const parts = decryptedLoc.split(',').map(s => s.trim());
                                const country = parts.pop();
                                const city = parts.join(', ');
                                profile.country = country || '';
                                profile.city = city || '';
                                profile.address = '';
                            } else {
                                profile.address = decryptedLoc;
                            }
                        }
                    } catch {
                        // Same fallback logic for error
                        if (decryptedLoc.includes(',')) {
                            const parts = decryptedLoc.split(',').map(s => s.trim());
                            const country = parts.pop();
                            const city = parts.join(', ');
                            profile.country = country || '';
                            profile.city = city || '';
                        } else {
                            profile.address = decryptedLoc;
                        }
                    }
                }
            }
        }

        // Canonical Ondwira identity is shared by Social and Work. Legacy
        // profile fields remain migration sources, not separate account names.
        const { data: ondwiraAccount } = await supabaseAdmin.schema('ondwira').from('accounts')
            .select('username, enc_phone_number, phone_verified_at')
            .eq('id', uid)
            .maybeSingle();
        if (ondwiraAccount) {
            profile.username = ondwiraAccount.username;
            profile.phone = decryptData(ondwiraAccount.enc_phone_number) || profile.phone || '';
            profile.phoneVerified = Boolean(ondwiraAccount.phone_verified_at);
        }

        const res = NextResponse.json({
            id: uid,
            schema: schema,
            profile,
            security: {
                hasPasskey: user.has_passkey,
                hasTotp: user.has_totp,
                hasEmail: user.has_email_otp,
                is2faEnabled: user.requires_2fa || user.has_passkey || user.has_totp || user.has_email_otp,
                defaultMethod: user.default_2fa_method
            }
        });

        // Add caching headers
        res.headers.set('Cache-Control', 'private, max-age=60, stale-while-revalidate=300');

        return res;

    } catch (error) {
        console.error('Auth Me Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
