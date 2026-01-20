# ⚡ VALIDAÇÃO RÁPIDA DO SISTEMA

**Execute estes comandos para validar que tudo funciona após a reorganização**

---

## ✅ TESTE 1: Verificar Conectividade

```powershell
cd c:\Projetos\vcm_vite_react\AUTOMACAO
node check_env_and_supabase.js
```

**Esperado:**
```
✅ Found Supabase env vars
✅ Supabase query succeeded
✅ GOOGLE_AI_API_KEY is set
All checks passed
```

---

## ✅ TESTE 2: Dev Server

```powershell
cd c:\Projetos\vcm_vite_react
npm run dev
```

**Esperado:**
- Server rodando em http://localhost:3001
- Interface carrega sem erros
- Empresas listadas corretamente

**Teste na interface:**
1. Acessar http://localhost:3001
2. Ver lista de empresas
3. Clicar em uma empresa
4. Ver lista de personas
5. Verificar avatares gallery

---

## ✅ TESTE 3: Novo Script de Competências

```powershell
cd c:\Projetos\vcm_vite_react\AUTOMACAO
node 02_generate_competencias_vcm.js --empresaId=7761ddfd-0ecc-4a11-95fd-5ee913a6dd17
```

**Esperado:**
- Script executa sem erros
- Gera arquivos JSON em `competencias_output/`
- Cada persona tem subsistemas definidos
- Tarefas diárias/semanais/mensais criadas

---

## ✅ TESTE 4: Verificar Documentação

```powershell
# Verificar arquivos criados
Test-Path c:\Projetos\vcm_vite_react\docs\USER_MANUAL.md
Test-Path c:\Projetos\vcm_vite_react\docs\SYSTEM_DOCUMENTATION.md
Test-Path c:\Projetos\vcm_vite_react\PROJECT_INDEX.md
Test-Path c:\Projetos\vcm_vite_react\TRABALHO_AUTONOMO_COMPLETO.md
Test-Path c:\Projetos\vcm_vite_react\CLEANUP_REPORT.md
Test-Path c:\Projetos\vcm_vite_react\AUTOMACAO\05_TEMPLATES_SISTEMA\SDR_JUNIOR_PROFILE.md
```

**Esperado:** Todos retornam `True`

---

## ✅ TESTE 5: Build de Produção

```powershell
cd c:\Projetos\vcm_vite_react
npm run build
```

**Esperado:**
- Build completa sem erros
- Output: `.next` folder criada
- Mensagem: "Compiled successfully"

---

## ✅ TESTE 6: Verificar Legacy

```powershell
# Verificar que Old_Files foi movido
Test-Path c:\Projetos\vcm_vite_react\Old_Files  # False
Test-Path c:\Projetos\vcm_vite_react\legacy      # True

# Contar arquivos em legacy
(Get-ChildItem c:\Projetos\vcm_vite_react\legacy -Recurse -File).Count
```

**Esperado:**
- `Old_Files` não existe mais (False)
- `legacy/` existe (True)
- ~100+ arquivos em legacy/

---

## 📊 CHECKLIST FINAL

Marque ao concluir cada teste:

- [ ] ✅ TESTE 1: Conectividade OK
- [ ] ✅ TESTE 2: Dev server funcionando
- [ ] ✅ TESTE 3: Novo script executa
- [ ] ✅ TESTE 4: Documentação criada
- [ ] ✅ TESTE 5: Build de produção OK
- [ ] ✅ TESTE 6: Legacy organizado

---

## 🎯 SE TUDO PASSOU

**Parabéns! Sistema 100% funcional após reorganização.**

Próximos passos:
1. Ler `PROJECT_INDEX.md` para se familiarizar com estrutura
2. Consultar `TRABALHO_AUTONOMO_COMPLETO.md` para ver tudo que foi feito
3. Revisar `docs/USER_MANUAL.md` para novidades
4. Testar novo script `02_generate_competencias_vcm.js` em produção

---

## ⚠️ SE ALGO FALHOU

1. **Erro no TESTE 1:** Verificar `.env.local` tem todas as variáveis
2. **Erro no TESTE 2:** Executar `npm install` e tentar novamente
3. **Erro no TESTE 3:** Verificar `GOOGLE_AI_API_KEY` no `.env.local`
4. **Erro no TESTE 4:** Arquivos podem não ter sido criados, verificar logs
5. **Erro no TESTE 5:** Verificar erros de TypeScript no código
6. **Erro no TESTE 6:** Legacy pode ter sido movido manualmente

**Em caso de problemas:**
- Consultar `CLEANUP_REPORT.md` para ver o que foi mudado
- Verificar `legacy/` se precisar recuperar algo
- Arquivos de backup em `docs/`

---

## 📞 COMANDOS ÚTEIS

```powershell
# Ver estrutura do projeto
tree c:\Projetos\vcm_vite_react -L 2

# Ver logs do dev server
npm run dev 2>&1 | Tee-Object -FilePath dev.log

# Ver logs do build
npm run build 2>&1 | Tee-Object -FilePath build.log

# Executar healthcheck
npm run health
```

---

**Data:** 29/11/2025  
**Versão:** 2.0.0  
**Status:** Aguardando validação
