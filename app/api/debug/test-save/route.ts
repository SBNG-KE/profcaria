
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedUser } from '@/lib/auth-helper';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const user = await getAuthenticatedUser();
        // 1. SELECT CHECK
        const { data: selectData, error: selectError } = await supabaseAdmin
            .schema('public')
            .from('saved_posts')
            .select('count')
            .limit(1);

        if (selectError) {
            return NextResponse.json({ step: '1_SELECT', status: 'FAILED', error: selectError }, { status: 500 });
        }

        // 2. INSERT CHECK (WRITE PERMISSION)
        // Must use a valid UUIDs. Using fake UUIDs might violate FKs if we don't have a post.
        // So we will try to INSERT with a randomized ID but it will likely fail FK.
        // Better: We check if the table allows inserts generally.
        // Actually, let's try to insert a row that violates FK. The error should be "foreign key constraint violation" (23503).
        // If the error is "permission denied" (42501), we know it's permissions.

        const dummyId = '00000000-0000-0000-0000-000000000000';
        const { error: insertError } = await supabaseAdmin
            .schema('public')
            .from('saved_posts')
            .insert({
                user_id: user?.id || dummyId, // Use real user ID if avail
                professional_post_id: dummyId
            });

        let writeStatus = 'UNKNOWN';
        let writeMessage = '';

        if (insertError) {
            // Analyze Error Code
            if (insertError.code === '23503') {
                writeStatus = 'SUCCESS'; // FK violation means we HAD permission to try inserting!
                writeMessage = 'Write permission confirmed (received expected FK violation).';
            } else if (insertError.code === '42501') {
                writeStatus = 'FAILED';
                writeMessage = 'Permission Denied for INSERT.';
            } else {
                writeStatus = 'FAILED';
                writeMessage = `Unexpected Error: ${insertError.message} (Code: ${insertError.code})`;
            }
        } else {
            // If it miraculously succeeded (unlikely with dummy IDs), we treat as success
            writeStatus = 'SUCCESS';
            writeMessage = 'Insert succeeded (This should not happen with dummy IDs unless FKs are disabled).';
            // Cleanup
            await supabaseAdmin.schema('public').from('saved_posts').delete().eq('professional_post_id', dummyId);
        }

        return NextResponse.json({
            step: '2_WRITE_CHECK',
            status: writeStatus,
            message: writeMessage,
            selectTest: 'PASSED',
            user: user ? 'Authenticated' : 'Anonymous'
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 });
    }
}
