# 🎯 ALGORITMO - API Bridge Principal

**Arquivo:** `api_bridge.py`  
**Função:** API FastAPI que conecta Dashboard React aos scripts Python  
**Linhas de Código:** 639  
**Versão:** 1.0.0 (API BRIDGE PRINCIPAL ATIVO)

---

## 📋 **VISÃO GERAL ALGORITMICA**

Este script é a **API PRINCIPAL** que faz a ponte entre o Dashboard React e os scripts Python de automação, permitindo execução remota dos Scripts 1-5, verificação de status e sincronização com Supabase.

### 🎯 **OBJETIVO PRINCIPAL:**
Fornecer interface HTTP/REST para execução dos scripts de automação, permitindo que o frontend React execute a cascata de scripts, verifique status e sincronize dados sem acesso direto aos arquivos Python.

---

## 🏗️ **ARQUITETURA FastAPI**

### **FastAPI Application**
```python
app = FastAPI(title="VCM Dashboard API Bridge", version="1.0.0")
```

**Responsabilidade:** Servidor HTTP que expõe endpoints REST para controle dos scripts Python do sistema VCM.

---

## 🔧 **ENDPOINTS FUNDAMENTAIS**

### 1️⃣ **@app.get("/health")**
**Health check básico:**
```
RETORNA:
{
  "status": "healthy",
  "message": "VCM API is running", 
  "timestamp": datetime.now().isoformat(),
  "version": "1.0.0"
}
```

### 2️⃣ **@app.post("/generate-biografias")**
**Execução do Script de Biografias:**
```
INPUT: BiografiaGenerationRequest {
  empresa_codigo: str,
  empresa_nome: str,
  total_personas: int = 20,
  idiomas: List[str] = ["pt", "en"],
  pais: str = "BR"
}

EXECUTA: 05_auto_biografia_generator.py com argumentos
RETORNA: ScriptResponse com success/error/output
```

### 3️⃣ **@app.post("/run-cascade")**
**Execução da Cascata Scripts 1-5:**
```
INPUT: CascadeScriptRequest {
  empresa_codigo: str,
  force_regenerate: bool = False
}

EXECUTA SEQUENCIALMENTE:
1. 01_generate_competencias.py
2. 02_generate_tech_specs.py
3. 03_generate_rag.py  
4. 04_generate_fluxos_analise.py
5. 05_generate_workflows_n8n.py

RETORNA: Status de cada script + resultado final
```

### 4️⃣ **run_python_script(script_path, args)**
**Função auxiliar crítica:**
```
1. VALIDAÇÃO:
   - Verificar se script_path.exists()

2. EXECUÇÃO:
   - cmd = [sys.executable, str(script_path)] + args
   - subprocess.run(cmd, capture_output=True, timeout=300)

3. RESULTADO:
   return {
     "success": result.returncode == 0,
     "output": result.stdout,
     "error": result.stderr,
     "return_code": result.returncode
   }
```

---

## 📊 **CONFIGURAÇÕES CRÍTICAS**

### **CORS Configuration:**
```python
allowed_origins = [
    "http://localhost:3000",    # React dev
    "http://127.0.0.1:3000",   # React dev alt
    "http://localhost:3001",    # React prod
]

# Em produção: ["*"] ou específicos
```

### **Script Paths:**
```python
SCRIPT_PATHS = {
    "biografia": "01_SETUP_E_CRIACAO/05_auto_biografia_generator.py",
    "competencias": "02_PROCESSAMENTO_PERSONAS/01_generate_competencias.py", 
    "tech_specs": "02_PROCESSAMENTO_PERSONAS/02_generate_tech_specs.py",
    "rag": "02_PROCESSAMENTO_PERSONAS/03_generate_rag.py",
    "fluxos": "02_PROCESSAMENTO_PERSONAS/04_generate_fluxos_analise.py",
    "workflows": "02_PROCESSAMENTO_PERSONAS/05_generate_workflows_n8n.py"
}
```

### **RAG Service Integration:**
```python
try:
    from rag_ingestion_service import ingest_empresa_rag, get_rag_status
    RAG_AVAILABLE = True
except ImportError:
    RAG_AVAILABLE = False
```

---

## ⚡ **FUNCIONALIDADES CRÍTICAS**

### 🎯 **Execução de Scripts:**
- **Subprocess com timeout** (5 minutos)
- **Captura de output** (stdout/stderr)
- **Tratamento de erros** completo
- **Working directory** configurado

### 🌍 **Integração com Frontend:**
- **CORS habilitado** para React
- **Modelos Pydantic** para validação
- **Responses padronizadas** (ScriptResponse)
- **Logs estruturados** para debug

### 📝 **Sincronização RAG:**
- **Ingestão automática** no Supabase
- **Status tracking** de ingestão
- **Fallback gracioso** se RAG indisponível
- **Background tasks** para operações longas

### 🔧 **Monitoramento:**
- **Health checks** para uptime
- **Logging detalhado** de execuções
- **Timeout handling** para scripts longos
- **Error tracking** com stack traces

---

## 🎯 **STATUS NO SISTEMA**

### **Integração Ativa:**
✅ API principal do sistema VCM  
✅ Conecta React frontend aos scripts Python  
✅ Executa Scripts 1-5 remotamente  
✅ Sincroniza com Supabase RAG  

### **Funcionalidade em Produção:**
✅ Execução remota de biografias  
✅ Cascata automatizada de scripts  
✅ Health checks para monitoramento  
✅ CORS configurado para frontend  

---

## 🎉 **RESULTADO FINAL**

A API produz **PONTE COMPLETA** que:

✅ **Conecta Dashboard React** aos scripts Python  
✅ **Executa cascata Scripts 1-5** remotamente  
✅ **Sincroniza dados** com Supabase RAG  
✅ **Monitora status** de todas as execuções  
✅ **Trata erros** graciosamente  
✅ **Provides logging** detalhado para debug  

**Sistema pronto para:** execução completa via interface web.

---

*📅 Algoritmo documentado em: 2024-12-19*  
*🔄 Versão do Sistema: API Bridge v1.0.0 (ATIVA)*  
*📊 Complexidade: 639 linhas, FastAPI, integração completa*