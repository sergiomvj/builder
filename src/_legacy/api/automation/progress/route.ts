import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const progressFile = path.join(process.cwd(), 'AUTOMACAO', 'script-progress.json');
    
    if (!fs.existsSync(progressFile)) {
      return NextResponse.json({
        status: 'idle',
        current: 0,
        total: 0,
        currentPersona: '',
        errors: []
      });
    }
    
    const content = fs.readFileSync(progressFile, 'utf-8');
    const progress = JSON.parse(content);
    
    return NextResponse.json(progress);
  } catch (error) {
    console.error('Erro ao ler progresso:', error);
    return NextResponse.json({
      status: 'error',
      current: 0,
      total: 0,
      currentPersona: '',
      errors: ['Erro ao ler arquivo de progresso']
    });
  }
}
