import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { validateFile, sanitizeFilename, ALLOWED_IMAGE_TYPES } from '@/lib/file-validation';

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get('profcaria_session')?.value;

  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const rawFilename = searchParams.get('filename') || 'image.png';
  const contentType = request.headers.get('content-type')?.split(';')[0] || 'image/png';
  const contentLength = parseInt(request.headers.get('content-length') || '0', 10);

  // Determine validation type based on MIME
  const isVideo = contentType.startsWith('video/');
  const validationType = isVideo ? 'video' : 'profileImage';

  // Validate file before upload
  const validation = validateFile({
    name: rawFilename,
    type: contentType,
    size: contentLength,
  }, validationType);

  if (!validation.valid) {
    return NextResponse.json({
      error: validation.error || 'Invalid file',
      allowedTypes: isVideo ? 'MP4, WebM, OGG, MOV' : 'JPEG, PNG, WebP, GIF, BMP, TIFF, HEIC, AVIF, SVG',
      maxSize: isVideo ? '50MB' : '10MB'
    }, { status: 400 });
  }

  // Use sanitized filename
  const filename = validation.sanitizedFilename || sanitizeFilename(rawFilename);

  // Securely upload to Vercel Blob
  // access: 'public' means the URL is readable, but only people with the URL can see it.
  // Since we encrypt the URL in the HTML content stored in DB, it effectively remains private.
  const blob = await put(filename, request.body!, {
    access: 'public',
    addRandomSuffix: true, // Always generate unique filename - never overwrite
  });

  return NextResponse.json(blob);
}