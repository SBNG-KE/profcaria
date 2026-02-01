import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { put, del } from '@vercel/blob';
import { supabaseAdmin } from '@/lib/supabase';
import { encryptData, decryptData } from '@/lib/security';

export const runtime = 'nodejs';

// --- GET: List Uploaded Documents ---
export async function GET() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('profcaria_session')?.value;
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(token, secret);
        const userId = payload.uid as string;

        const { data, error } = await supabaseAdmin
            .schema('professional')
            .from('uploaded_documents')
            .select('id, enc_name, enc_blob_url, file_type, file_size, created_at, updated_at')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Fetch Uploaded Docs Error:', error);
            return NextResponse.json({ error: `DB Error: ${error.message || error.code}` }, { status: 500 });
        }

        // Decrypt data for client
        const documents = data.map((doc: any) => ({
            id: doc.id,
            name: decryptData(doc.enc_name),
            blobUrl: decryptData(doc.enc_blob_url),
            fileType: doc.file_type,
            fileSize: doc.file_size,
            createdAt: doc.created_at,
            updatedAt: doc.updated_at
        }));

        return NextResponse.json({ documents });

    } catch (err: any) {
        console.error('Uploaded Docs Load Error:', err);
        return NextResponse.json({ error: `Server Error: ${err?.message || 'Unknown'}` }, { status: 500 });
    }
}

// --- POST: Upload New Document ---
export async function POST(req: NextRequest) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('profcaria_session')?.value;
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(token, secret);
        const userId = payload.uid as string;

        const formData = await req.formData();
        const file = formData.get('file') as File;
        const name = formData.get('name') as string;

        if (!file || !name) {
            return NextResponse.json({ error: 'File and name required' }, { status: 400 });
        }

        // Validate file type
        const allowedTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'image/jpeg',
            'image/png',
            'image/webp'
        ];

        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json({
                error: 'Invalid file type. Allowed: PDF, DOC, DOCX, JPG, PNG, WEBP'
            }, { status: 400 });
        }

        // Max file size: 10MB
        if (file.size > 10 * 1024 * 1024) {
            return NextResponse.json({ error: 'File size must be under 10MB' }, { status: 400 });
        }

        // Upload to Vercel Blob
        const blob = await put(`documents/${userId}/${file.name}`, file, {
            access: 'public',
            addRandomSuffix: true
        });

        // Save metadata to DB (encrypted)
        const encName = encryptData(name);
        const encBlobUrl = encryptData(blob.url);

        const { data, error } = await supabaseAdmin
            .schema('professional')
            .from('uploaded_documents')
            .insert({
                user_id: userId,
                enc_name: encName,
                enc_blob_url: encBlobUrl,
                file_type: file.type,
                file_size: file.size
            })
            .select('id')
            .single();

        if (error) {
            console.error('Insert Upload Doc Error:', error);
            return NextResponse.json({ error: `DB Error: ${error.message || error.code}` }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            document: {
                id: data.id,
                name,
                blobUrl: blob.url,
                fileType: file.type,
                fileSize: file.size
            }
        });

    } catch (err: any) {
        console.error('Upload Doc Error:', err);
        return NextResponse.json({ error: `Server Error: ${err?.message || 'Unknown'}` }, { status: 500 });
    }
}

// --- PUT: Rename or Replace Document ---
export async function PUT(req: NextRequest) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('profcaria_session')?.value;
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(token, secret);
        const userId = payload.uid as string;

        const formData = await req.formData();
        const docId = formData.get('id') as string;
        const newName = formData.get('name') as string | null;
        const newFile = formData.get('file') as File | null;

        if (!docId) {
            return NextResponse.json({ error: 'Document ID required' }, { status: 400 });
        }

        // Fetch existing document
        const { data: existing, error: fetchError } = await supabaseAdmin
            .schema('professional')
            .from('uploaded_documents')
            .select('id, enc_blob_url')
            .eq('id', docId)
            .eq('user_id', userId)
            .single();

        if (fetchError || !existing) {
            return NextResponse.json({ error: 'Document not found' }, { status: 404 });
        }

        const updates: any = { updated_at: new Date().toISOString() };

        // Handle rename
        if (newName) {
            updates.enc_name = encryptData(newName);
        }

        // Handle file replacement
        if (newFile) {
            // Validate file type
            const allowedTypes = [
                'application/pdf',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'image/jpeg',
                'image/png',
                'image/webp'
            ];

            if (!allowedTypes.includes(newFile.type)) {
                return NextResponse.json({
                    error: 'Invalid file type. Allowed: PDF, DOC, DOCX, JPG, PNG, WEBP'
                }, { status: 400 });
            }

            if (newFile.size > 10 * 1024 * 1024) {
                return NextResponse.json({ error: 'File size must be under 10MB' }, { status: 400 });
            }

            // Delete old blob
            const oldUrl = decryptData(existing.enc_blob_url);
            if (oldUrl) {
                try {
                    await del(oldUrl);
                } catch (e) {
                    console.warn('Failed to delete old blob:', e);
                }
            }

            // Upload new blob
            const blob = await put(`documents/${userId}/${newFile.name}`, newFile, {
                access: 'public',
                addRandomSuffix: true
            });

            updates.enc_blob_url = encryptData(blob.url);
            updates.file_type = newFile.type;
            updates.file_size = newFile.size;
        }

        const { error: updateError } = await supabaseAdmin
            .schema('professional')
            .from('uploaded_documents')
            .update(updates)
            .eq('id', docId);

        if (updateError) {
            console.error('Update Upload Doc Error:', updateError);
            return NextResponse.json({ error: 'DB Error' }, { status: 500 });
        }

        return NextResponse.json({ success: true });

    } catch (err) {
        console.error('Update Doc Error:', err);
        return NextResponse.json({ error: 'Server Error' }, { status: 500 });
    }
}

// --- DELETE: Delete Document ---
export async function DELETE(req: NextRequest) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('profcaria_session')?.value;
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(token, secret);
        const userId = payload.uid as string;

        const { searchParams } = new URL(req.url);
        const docId = searchParams.get('id');

        if (!docId) {
            return NextResponse.json({ error: 'Document ID required' }, { status: 400 });
        }

        // Fetch document to get blob URL
        const { data: doc, error: fetchError } = await supabaseAdmin
            .schema('professional')
            .from('uploaded_documents')
            .select('enc_blob_url')
            .eq('id', docId)
            .eq('user_id', userId)
            .single();

        if (fetchError || !doc) {
            return NextResponse.json({ error: 'Document not found' }, { status: 404 });
        }

        // Delete blob
        const blobUrl = decryptData(doc.enc_blob_url);
        if (blobUrl) {
            try {
                await del(blobUrl);
            } catch (e) {
                console.warn('Failed to delete blob:', e);
            }
        }

        // Delete from DB
        const { error: deleteError } = await supabaseAdmin
            .schema('professional')
            .from('uploaded_documents')
            .delete()
            .eq('id', docId);

        if (deleteError) {
            console.error('Delete Upload Doc Error:', deleteError);
            return NextResponse.json({ error: 'DB Error' }, { status: 500 });
        }

        return NextResponse.json({ success: true });

    } catch (err) {
        console.error('Delete Doc Error:', err);
        return NextResponse.json({ error: 'Server Error' }, { status: 500 });
    }
}
