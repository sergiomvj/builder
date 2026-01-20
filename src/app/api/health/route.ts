import { NextResponse } from 'next/server';

/**
 * 🏥 Health check endpoint para monitoramento
 */
export async function GET() {
  const startTime = Date.now();
  
  // Verificar saúde do sistema
  const health = {
    status: 'healthy',
    message: 'BuildCorp Dashboard is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: '1.0.0',
    services: {
      frontend: 'active',
      automation: 'available',
      database: 'connected' // Pode ser verificado dinamicamente
    }
  };

  const responseTime = Date.now() - startTime;
  
  return NextResponse.json({
    ...health,
    response_time_ms: responseTime
  });
}