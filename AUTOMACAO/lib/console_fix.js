/**
 * FIX CONSOLE ENCODING - Windows PowerShell UTF-8
 * ================================================
 * 
 * Problema: PowerShell no Windows usa codepage 850 por padrão
 * Resultado: Emojis e acentos aparecem como "­ƒÜÇ" ao invés de "📊"
 * 
 * Solução: Forçar UTF-8 no stdout/stderr do Node.js
 */

// Forçar UTF-8 no Windows
if (process.platform === 'win32') {
  try {
    // Tentar executar chcp 65001 (UTF-8) no cmd
    const { execSync } = await import('child_process');
    execSync('chcp 65001', { stdio: 'ignore' });
  } catch (err) {
    // Ignorar erros (pode não ter permissão)
  }
}

/**
 * Console seguro para Windows - substitui emojis por símbolos ASCII
 */
export const safeLog = {
  /**
   * Substitui emojis por equivalentes ASCII seguros
   */
  clean(text) {
    if (process.platform !== 'win32') return text;
    
    const emojiMap = {
      '📊': '[INFO]',
      '✅': '[OK]',
      '❌': '[ERRO]',
      '⚠️': '[AVISO]',
      '🎯': '[ALVO]',
      '🚀': '[INICIO]',
      '🔄': '[PROC]',
      '💾': '[SALVO]',
      '🌍': '[GLOBAL]',
      '📝': '[NOTA]',
      '🎉': '[SUCESSO]',
      '📈': '[STATS]',
      '🔍': '[BUSCA]',
      '⏱️': '[TEMPO]',
      '💡': '[DICA]',
      '🤖': '[IA]',
      '📋': '[LISTA]',
      '🏢': '[EMPRESA]',
      '👤': '[PERSONA]',
      '📧': '[EMAIL]',
      '🔧': '[CONFIG]',
      '⚙️': '[SETUP]',
      '🎨': '[DESIGN]',
      '🌐': '[WEB]',
      '📦': '[PACOTE]',
      '🔑': '[CHAVE]',
      '🛠️': '[TOOLS]',
      '📂': '[PASTA]',
      '📄': '[ARQUIVO]',
      '🗂️': '[DOC]',
      '💬': '[MSG]',
      '🎭': '[PERFIL]',
      '🏆': '[META]',
      '🔔': '[NOTIF]',
      '⏳': '[ESPERA]',
      '🔐': '[SEGURO]',
      '🌟': '[DESTAQUE]',
      '🎬': '[ACAO]',
      '📍': '[LOCAL]',
      '🗺️': '[MAPA]',
      '🎓': '[EDUCACAO]',
      '💼': '[TRABALHO]',
      '🏅': '[PREMIO]',
      '🎪': '[EVENTO]',
      '🔮': '[PREVISTO]',
      '🧩': '[COMPONENTE]',
      '🎛️': '[CONTROLE]'
    };

    let result = text;
    for (const [emoji, ascii] of Object.entries(emojiMap)) {
      result = result.replace(new RegExp(emoji, 'g'), ascii);
    }
    return result;
  },

  log(...args) {
    console.log(...args.map(arg => 
      typeof arg === 'string' ? this.clean(arg) : arg
    ));
  },

  error(...args) {
    console.error(...args.map(arg => 
      typeof arg === 'string' ? this.clean(arg) : arg
    ));
  },

  info(...args) {
    console.info(...args.map(arg => 
      typeof arg === 'string' ? this.clean(arg) : arg
    ));
  },

  warn(...args) {
    console.warn(...args.map(arg => 
      typeof arg === 'string' ? this.clean(arg) : arg
    ));
  }
};

/**
 * Wrapper automático para console global
 * Chame setupConsoleEncoding() no início do script
 */
export function setupConsoleEncoding() {
  if (process.platform !== 'win32') return;

  const originalLog = console.log;
  const originalError = console.error;
  const originalWarn = console.warn;
  const originalInfo = console.info;

  console.log = (...args) => originalLog(...args.map(arg => 
    typeof arg === 'string' ? safeLog.clean(arg) : arg
  ));

  console.error = (...args) => originalError(...args.map(arg => 
    typeof arg === 'string' ? safeLog.clean(arg) : arg
  ));

  console.warn = (...args) => originalWarn(...args.map(arg => 
    typeof arg === 'string' ? safeLog.clean(arg) : arg
  ));

  console.info = (...args) => originalInfo(...args.map(arg => 
    typeof arg === 'string' ? safeLog.clean(arg) : arg
  ));
}

/**
 * Alternativa: Logger com timestamps e cores seguras
 */
export const logger = {
  timestamp() {
    return new Date().toLocaleTimeString('pt-BR');
  },

  info(message) {
    safeLog.log(`[${this.timestamp()}] [INFO] ${message}`);
  },

  success(message) {
    safeLog.log(`[${this.timestamp()}] [OK] ${message}`);
  },

  error(message) {
    safeLog.error(`[${this.timestamp()}] [ERRO] ${message}`);
  },

  warn(message) {
    safeLog.warn(`[${this.timestamp()}] [AVISO] ${message}`);
  },

  debug(message) {
    if (process.env.DEBUG) {
      safeLog.log(`[${this.timestamp()}] [DEBUG] ${message}`);
    }
  }
};

// Export default
export default {
  safeLog,
  setupConsoleEncoding,
  logger
};
