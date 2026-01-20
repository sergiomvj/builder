# N8N API Integration

API para integração com N8N (workflow automation platform).

## 📁 Estrutura

```
/api/n8n/
├── workflows/
│   ├── route.ts          # GET, POST workflows
│   └── [id]/
│       └── route.ts      # GET, PATCH, DELETE workflow específico
├── executions/
│   └── route.ts          # GET executions
├── test-connection/
│   └── route.ts          # POST test connection
└── sync/
    └── route.ts          # POST sync workflows
```

## 🔐 Configuração

### Variáveis de Ambiente (.env.local)

```env
N8N_INSTANCE_URL=https://seu-n8n.com
N8N_API_KEY=n8n_api_xxxxxxxxxxxxxx
```

### Obter API Key do N8N

1. Acesse seu N8N: Settings → API
2. Crie uma nova API Key
3. Copie e cole no `.env.local`

## 📡 Endpoints

### 1. Testar Conexão

```http
POST /api/n8n/test-connection
Content-Type: application/json

{
  "url": "https://seu-n8n.com",
  "apiKey": "n8n_api_xxxxxx"
}
```

**Resposta Success:**
```json
{
  "success": true,
  "message": "Conexão estabelecida com sucesso!",
  "version": "1.15.0"
}
```

**Resposta Error:**
```json
{
  "success": false,
  "error": "API Key inválida. Verifique suas credenciais."
}
```

---

### 2. Listar Workflows

```http
GET /api/n8n/workflows
GET /api/n8n/workflows?active=true
GET /api/n8n/workflows?tags=finance,automation
```

**Resposta:**
```json
{
  "success": true,
  "data": [
    {
      "id": "1",
      "name": "Richard (Asst Fin) - Relatório Financeiro",
      "active": true,
      "nodes": [...],
      "connections": {...},
      "tags": ["finance", "reports"],
      "createdAt": "2025-11-28T10:00:00Z",
      "updatedAt": "2025-11-28T12:00:00Z"
    }
  ],
  "count": 5
}
```

---

### 3. Criar/Importar Workflow

```http
POST /api/n8n/workflows
Content-Type: application/json

{
  "name": "Meu Workflow",
  "nodes": [
    {
      "id": "1",
      "name": "Trigger",
      "type": "n8n-nodes-base.cron",
      "parameters": { ... }
    }
  ],
  "connections": { ... },
  "active": false,
  "tags": ["test"]
}
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "id": "abc123",
    "name": "Meu Workflow",
    ...
  },
  "message": "Workflow 'Meu Workflow' criado com sucesso!"
}
```

---

### 4. Obter Workflow Específico

```http
GET /api/n8n/workflows/:id
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "id": "abc123",
    "name": "Richard (Asst Fin) - Relatório",
    "active": true,
    "nodes": [...],
    "connections": {...}
  }
}
```

---

### 5. Atualizar Workflow

```http
PATCH /api/n8n/workflows/:id
Content-Type: application/json

{
  "active": true
}
```

ou atualizar nome/nodes:

```json
{
  "name": "Novo Nome",
  "nodes": [...]
}
```

**Resposta:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Workflow ativado com sucesso!"
}
```

---

### 6. Deletar Workflow

```http
DELETE /api/n8n/workflows/:id
```

**Resposta:**
```json
{
  "success": true,
  "message": "Workflow deletado com sucesso!"
}
```

---

### 7. Listar Execuções

```http
GET /api/n8n/executions
GET /api/n8n/executions?workflowId=abc123
GET /api/n8n/executions?status=error&limit=20
```

**Resposta:**
```json
{
  "success": true,
  "data": [
    {
      "id": "exec-123",
      "workflowId": "abc123",
      "mode": "trigger",
      "startedAt": "2025-11-28T12:00:00Z",
      "stoppedAt": "2025-11-28T12:00:15Z",
      "finished": true,
      "status": "success"
    }
  ],
  "count": 10
}
```

---

### 8. Sincronizar Workflows

Busca workflows do N8N e atualiza `personas_workflows` no Supabase.

```http
POST /api/n8n/sync
POST /api/n8n/sync?empresaId=7761ddfd-0ecc-4a11-95fd-5ee913a6dd17
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "total": 5,
    "updated": 3,
    "created": 0,
    "errors": []
  },
  "message": "Sincronização concluída: 3 atualizados, 0 criados"
}
```

---

## 🧪 Testes (PowerShell)

### Testar Conexão
```powershell
$body = @{
  url = "https://seu-n8n.com"
  apiKey = "n8n_api_xxxxx"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3001/api/n8n/test-connection" `
  -Method POST `
  -ContentType "application/json" `
  -Body $body
```

### Listar Workflows
```powershell
Invoke-RestMethod -Uri "http://localhost:3001/api/n8n/workflows"
```

### Ativar Workflow
```powershell
$body = @{ active = $true } | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3001/api/n8n/workflows/abc123" `
  -Method PATCH `
  -ContentType "application/json" `
  -Body $body
```

### Importar Workflow
```powershell
$workflow = Get-Content "06_N8N_WORKFLOWS/ARVATE49_Richard_Garcia_xxx.json" -Raw

Invoke-RestMethod -Uri "http://localhost:3001/api/n8n/workflows" `
  -Method POST `
  -ContentType "application/json" `
  -Body $workflow
```

### Sincronizar
```powershell
Invoke-RestMethod -Uri "http://localhost:3001/api/n8n/sync" `
  -Method POST
```

---

## 🔗 Integração com Frontend

### React Hook Exemplo

```typescript
// hooks/useN8NWorkflows.ts
import { useState, useEffect } from 'react';

export function useN8NWorkflows() {
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/n8n/workflows')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setWorkflows(data.data);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  return { workflows, loading };
}
```

### Componente Exemplo

```tsx
// components/N8NWorkflowCard.tsx
import { Button } from '@/components/ui/button';

export function N8NWorkflowCard({ workflow }) {
  const toggleActive = async () => {
    const res = await fetch(`/api/n8n/workflows/${workflow.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !workflow.active })
    });
    
    if (res.ok) {
      // Atualizar UI
    }
  };

  return (
    <div className="border p-4 rounded">
      <h3>{workflow.name}</h3>
      <Button onClick={toggleActive}>
        {workflow.active ? 'Desativar' : 'Ativar'}
      </Button>
    </div>
  );
}
```

---

## 🚨 Tratamento de Erros

Todos os endpoints retornam erros no formato:

```json
{
  "success": false,
  "error": "Mensagem de erro detalhada"
}
```

**Códigos HTTP:**
- `200` - Sucesso
- `201` - Criado com sucesso
- `400` - Bad Request (parâmetros inválidos)
- `401` - Unauthorized (API Key inválida)
- `404` - Not Found (workflow não existe)
- `500` - Server Error (erro interno)
- `503` - Service Unavailable (N8N não configurado)

---

## 📊 Referências

- **N8N API Docs:** https://docs.n8n.io/api/
- **N8N Workflow Format:** https://docs.n8n.io/workflows/
- **Client Implementation:** `/src/lib/n8n-client.ts`

---

## 🔄 Próximos Passos

1. ✅ Implementar UI em `/integracoes`
2. ✅ Criar página `/workflows` dedicada
3. ⏳ Adicionar webhooks para notificações em tempo real
4. ⏳ Implementar retry automático para execuções falhadas
5. ⏳ Dashboard de métricas (tempo médio, taxa de sucesso, etc)
