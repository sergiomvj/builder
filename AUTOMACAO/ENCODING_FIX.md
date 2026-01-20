# 🔧 Correção de Encoding UTF-8 no Windows PowerShell

## 🎯 Problema

Ao executar scripts Node.js no PowerShell do Windows, caracteres UTF-8 (emojis e acentos) aparecem corrompidos:

```
❌ Aparece como: ­ƒÜÇ
✅ Aparece como: Ô£à
📊 Aparece como: ­ƒôº
"atribuições" aparece como: "atribui├º├Áes"
```

**Causa:** PowerShell usa **codepage 850** (CP850) por padrão ao invés de **UTF-8** (CP65001).

---

## ✅ Solução 1: Configurar UTF-8 Temporariamente (Por Sessão)

Execute **ANTES** de rodar qualquer script:

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
```

Depois execute normalmente:

```powershell
cd AUTOMACAO
node 02_generate_biografias_COMPLETO.js --empresaId=UUID
```

---

## ✅ Solução 2: Usar Helper Script (Recomendado)

Use o script `run-script-utf8.ps1` que configura UTF-8 automaticamente:

```powershell
.\run-script-utf8.ps1 02_generate_biografias_COMPLETO.js --empresaId=UUID
.\run-script-utf8.ps1 03_generate_atribuicoes_contextualizadas.js --empresaId=UUID
```

---

## ✅ Solução 3: Configurar UTF-8 Permanentemente

### Opção A: PowerShell Profile

Adicione ao seu perfil do PowerShell (`$PROFILE`):

```powershell
# Abrir perfil
notepad $PROFILE

# Adicionar estas linhas:
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
chcp 65001 > $null
```

### Opção B: Configurar Codepage do Windows

Execute no CMD como Administrador:

```cmd
reg add HKCU\Console /v CodePage /t REG_DWORD /d 65001 /f
```

---

## ✅ Solução 4: Usar Windows Terminal (Melhor Opção)

**Windows Terminal** tem suporte nativo a UTF-8. Instale via Microsoft Store:

```powershell
winget install Microsoft.WindowsTerminal
```

---

## 📝 Comandos de Teste

### Teste rápido (uma linha):
```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8; cd AUTOMACAO; node 03_generate_atribuicoes_contextualizadas.js --empresaId=b356b561-cd43-4760-8377-98a0cc1463ad
```

### Teste com verificação de encoding:
```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Write-Host "Teste: ✅ 📊 🎯 Acentuação: çãõáéí"
```

---

## 🛠️ Sistema Implementado no Projeto

O arquivo `lib/console_fix.js` contém:

1. **`setupConsoleEncoding()`** - Substitui emojis por símbolos ASCII em Windows
2. **`safeLog`** - Console seguro com mapeamento de emojis
3. **`logger`** - Logger com timestamps e níveis

### Uso nos Scripts:

```javascript
import { setupConsoleEncoding } from './lib/console_fix.js';

// No início do script
setupConsoleEncoding();

// Agora console.log funciona corretamente
console.log('✅ Teste'); // Exibe: [OK] Teste (em Windows)
```

---

## 📋 Checklist de Execução

Para executar scripts sem problemas de encoding:

- [ ] **Opção 1:** Execute `[Console]::OutputEncoding = [System.Text.Encoding]::UTF8` antes
- [ ] **Opção 2:** Use `.\run-script-utf8.ps1 SCRIPT.js --args`
- [ ] **Opção 3:** Configure $PROFILE permanentemente
- [ ] **Opção 4:** Use Windows Terminal ao invés de PowerShell padrão

---

## 🎯 Exemplo Completo

```powershell
# Método 1: Manual
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
cd C:\Projetos\vcm_vite_react\AUTOMACAO
node 02_generate_biografias_COMPLETO.js --empresaId=b356b561-cd43-4760-8377-98a0cc1463ad

# Método 2: Helper Script
cd C:\Projetos\vcm_vite_react
.\run-script-utf8.ps1 02_generate_biografias_COMPLETO.js --empresaId=b356b561-cd43-4760-8377-98a0cc1463ad
```

---

## 🔍 Debugging

Se ainda tiver problemas:

```powershell
# Verificar codepage atual
chcp

# Deve retornar: 65001 (UTF-8)
# Se retornar 850, não está configurado corretamente

# Forçar mudança temporária
chcp 65001

# Verificar encoding do PowerShell
[Console]::OutputEncoding
$OutputEncoding
```

---

## 📚 Referências

- [PowerShell UTF-8 Issues](https://github.com/PowerShell/PowerShell/issues/7233)
- [Windows Terminal](https://aka.ms/terminal)
- [Node.js Console Encoding](https://nodejs.org/api/process.html#process_process_stdout)
