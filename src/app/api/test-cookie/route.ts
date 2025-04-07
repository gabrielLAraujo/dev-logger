import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Criar um cookie de teste
    const response = NextResponse.json({ 
      message: 'Cookie de teste criado',
      timestamp: new Date().toISOString(),
    });
    
    // Definir o cookie
    response.cookies.set({
      name: 'test-cookie',
      value: 'test-value',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });
    
    return response;
  } catch (error) {
    console.error('[Test Cookie] Erro ao criar cookie:', error);
    return NextResponse.json({ 
      error: 'Erro ao criar cookie',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 