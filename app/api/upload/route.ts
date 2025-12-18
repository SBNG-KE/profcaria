import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get('profcaria_session')?.value;
  
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const filename = searchParams.get('filename') || 'image.png';

  // Securely upload to Vercel Blob
  // access: 'public' means the URL is readable, but only people with the URL can see it.
  // Since we encrypt the URL in the HTML content stored in DB, it effectively remains private.
  const blob = await put(filename, request.body!, {
    access: 'public',
  });

  return NextResponse.json(blob);
}