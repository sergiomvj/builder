import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

/**
 * API Endpoint: Upload de Documentos para Knowledge Base
 * POST /api/knowledge/upload
 * 
 * Recebe arquivos (TXT, MD, PDF, DOCX) e salva temporariamente
 * para processamento pelo Script 10
 * 
 * Body: FormData com campos:
 * - file: arquivo a ser processado
 * - empresaId: UUID da empresa
 * - topic: tópico principal (opcional)
 */

const ALLOWED_EXTENSIONS = ['.txt', '.md', '.pdf', '.docx'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const UPLOAD_DIR = join(process.cwd(), 'AUTOMACAO', 'knowledge_uploads');

export async function POST(request: NextRequest) {
  try {
    // Parse FormData
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const empresaId = formData.get('empresaId') as string;
    const topic = formData.get('topic') as string | null;

    // Validações
    if (!file) {
      return NextResponse.json(
        { error: 'Arquivo não fornecido' },
        { status: 400 }
      );
    }

    if (!empresaId) {
      return NextResponse.json(
        { error: 'empresaId não fornecido' },
        { status: 400 }
      );
    }

    // Valida extensão
    const filename = file.name;
    const extension = filename.substring(filename.lastIndexOf('.')).toLowerCase();
    
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      return NextResponse.json(
        { 
          error: `Extensão ${extension} não suportada. Use: ${ALLOWED_EXTENSIONS.join(', ')}` 
        },
        { status: 400 }
      );
    }

    // Valida tamanho
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { 
          error: `Arquivo muito grande (${(file.size / 1024 / 1024).toFixed(2)}MB). Máximo: ${MAX_FILE_SIZE / 1024 / 1024}MB` 
        },
        { status: 400 }
      );
    }

    // Cria diretório de upload se não existir
    if (!existsSync(UPLOAD_DIR)) {
      await mkdir(UPLOAD_DIR, { recursive: true });
    }

    // Cria subdiretório para a empresa
    const empresaDir = join(UPLOAD_DIR, empresaId);
    if (!existsSync(empresaDir)) {
      await mkdir(empresaDir, { recursive: true });
    }

    // Gera nome único (timestamp + nome original)
    const timestamp = Date.now();
    const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const uniqueFilename = `${timestamp}_${safeFilename}`;
    const filepath = join(empresaDir, uniqueFilename);

    // Salva arquivo
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    // Retorna informações do arquivo salvo
    return NextResponse.json({
      success: true,
      file: {
        name: filename,
        savedAs: uniqueFilename,
        path: filepath,
        size: file.size,
        sizeFormatted: `${(file.size / 1024).toFixed(2)} KB`,
        type: file.type,
        extension,
        empresaId,
        topic: topic || null,
        uploadedAt: new Date().toISOString()
      },
      message: 'Arquivo salvo. Execute o Script 10 para processar.',
      command: `node AUTOMACAO/10_generate_knowledge_base.js --empresaId=${empresaId} --source="${filepath}"`
    });

  } catch (error: any) {
    console.error('❌ Erro no upload:', error);
    return NextResponse.json(
      { 
        error: 'Erro ao fazer upload do arquivo',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/knowledge/upload?empresaId=UUID
 * Lista arquivos já carregados para uma empresa
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const empresaId = searchParams.get('empresaId');

    if (!empresaId) {
      return NextResponse.json(
        { error: 'empresaId não fornecido' },
        { status: 400 }
      );
    }

    const empresaDir = join(UPLOAD_DIR, empresaId);

    if (!existsSync(empresaDir)) {
      return NextResponse.json({
        files: [],
        count: 0,
        message: 'Nenhum arquivo carregado ainda'
      });
    }

    // Lista arquivos do diretório (implementação simplificada)
    // Em produção, use readdir() e construa array de metadados
    
    return NextResponse.json({
      files: [],
      count: 0,
      directory: empresaDir,
      message: 'Implementação de listagem pendente'
    });

  } catch (error: any) {
    console.error('❌ Erro ao listar arquivos:', error);
    return NextResponse.json(
      { 
        error: 'Erro ao listar arquivos',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
