import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  const cookies = req.headers.get('cookie');

  return NextResponse.json({
    session,
    cookies,
    timestamp: new Date().toISOString(),
  });
} 