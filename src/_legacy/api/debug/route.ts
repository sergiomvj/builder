import { NextResponse } from 'next/server';

export async function GET() {
  const debugInfo = {
    timestamp: new Date().toISOString(),
    status: 'OK',
    message: 'API funcionando corretamente',
    environment: process.env.NODE_ENV || 'unknown',
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  };
  
  console.log('🔍 DEBUG API chamada:', debugInfo);
  
  return NextResponse.json(debugInfo, {
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  });
}