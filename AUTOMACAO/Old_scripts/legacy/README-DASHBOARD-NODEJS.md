# 🚀 Dashboard Node.js - Scripts de Automação VCM

Este dashboard integra todos os scripts Node.js convertidos do sistema Python VCM, fornecendo uma interface web completa para execução e monitoramento.

## ✅ Scripts Node.js Disponíveis

### 🔄 Cascata Principal (Execução Sequencial)
1. **01_generate_competencias.js** - Análise e extração de competências
2. **02_generate_tech_specs.js** - Geração de especificações técnicas  
3. **03_generate_rag.js** - População da base de conhecimento RAG
4. **04_generate_fluxos_analise.js** - Análise de fluxos de trabalho
5. **05_generate_workflows_n8n.js** - Geração de workflows N8N

### 🛠️ Utilitários
- **05_auto_biografia_generator.js** - Gerador automático de biografias
- **api_bridge.js** - Ponte de API para integrações externas

## 🖥️ Recursos do Dashboard

### 📊 Aba "Scripts Node.js" 
Nova aba dedicada aos scripts Node.js com as seguintes funcionalidades:

#### 🎯 Execução Rápida - Cascata Completa
- **Execução automática** de todos os 5 scripts em sequência
- **Progresso visual** com barra de progresso e indicadores de status
- **Monitoramento em tempo real** do script atual
- **Recuperação automática** em caso de erros

#### ⚡ Painel de Execução Individual  
- Execução de scripts individuais com parâmetros personalizados
- Logs de execução em tempo real
- Controles de start/stop para cada script
- Histórico de execuções

#### 📈 Monitor de Status
- **Status em tempo real** de todos os scripts
- Indicadores visuais: Parado, Executando, Concluído, Erro
- **Atualização automática** a cada 5 segundos
- Estatísticas consolidadas por status

#### 📁 Visualizador de Outputs
- Listagem de todos os arquivos gerados
- **Preview** de conteúdos JSON, TXT, MD
- **Download** de arquivos resultantes
- Organização por tipo e data de criação

## 🚀 Como Usar

### 1. Inicialização Rápida
```powershell
# Execute o script de inicialização
.\start-dashboard-nodejs.ps1
```

### 2. Acesso ao Dashboard
- **URL:** http://localhost:3000
- **Aba:** "Scripts Node.js" (nova aba azul com ícone de código)

### 3. Execução da Cascata Completa
1. Na aba "Scripts Node.js", use o painel **"Execução Rápida - Cascata Completa"**
2. Clique em **"Executar Cascata"**
3. Acompanhe o progresso visual em tempo real
4. Aguarde a conclusão de todos os 5 scripts

### 4. Execução Individual
1. Use as abas **"Executar Scripts"** para controle individual
2. Selecione o script desejado
3. Configure parâmetros se necessário
4. Execute e monitore os logs

### 5. Monitoramento
1. Acesse a aba **"Monitor"** para visão consolidada
2. Veja status de todos os scripts simultaneamente
3. Use **"Atualizar"** para refresh manual do status

## 📂 Estrutura de Arquivos

```
AUTOMACAO/
├── 01_SETUP_E_CRIACAO/
│   └── 05_auto_biografia_generator.js    # Gerador de biografias
├── 02_PROCESSAMENTO_PERSONAS/
│   ├── 01_generate_competencias.js       # Script 1: Competências
│   ├── 02_generate_tech_specs.js         # Script 2: Tech Specs  
│   ├── 03_generate_rag.js               # Script 3: RAG Database
│   ├── 04_generate_fluxos_analise.js    # Script 4: Análise Fluxos
│   └── 05_generate_workflows_n8n.js     # Script 5: Workflows N8N
└── api_bridge.js                         # API Bridge
```

## 🔧 APIs do Dashboard

### Execução de Scripts Individuais
```javascript
POST /api/nodejs-scripts
{
  "script": "01_generate_competencias.js",
  "parameters": {...}
}
```

### Execução da Cascata Completa
```javascript
POST /api/cascade-nodejs
{
  "mode": "full"
}
```

### Status dos Scripts
```javascript
GET /api/nodejs-scripts/status
```

## 📋 Requisitos

- **Node.js** 18+ 
- **npm** ou **yarn**
- **Windows PowerShell** (para scripts de inicialização)
- **VS Code** (recomendado para desenvolvimento)

## 🔍 Troubleshooting

### Scripts Não Encontrados
Se alguns scripts Node.js não forem encontrados:
1. Verifique se a conversão do Python foi concluída
2. Confirme os caminhos no diretório `AUTOMACAO/`
3. Execute `.\start-dashboard-nodejs.ps1` para verificação automática

### API Offline  
Se as APIs não estiverem respondendo:
1. Verifique se o servidor Next.js está rodando
2. Confirme a porta 3000 está disponível
3. Recarregue a página para reconexão automática

### Execução com Erro
Se scripts falharem durante execução:
1. Verifique logs no painel "Monitor" 
2. Confirme variáveis de ambiente (arquivo `.env`)
3. Teste execução individual antes da cascata

## 🎯 Próximos Passos

- **WebSocket integration** para updates em tempo real
- **Logs streaming** durante execução  
- **Agendamento** de execuções
- **Notificações** de conclusão
- **Backup automático** de outputs

## 📞 Suporte

Para problemas ou dúvidas:
1. Verifique os logs no dashboard
2. Consulte a documentação em `Docs/`
3. Execute verificações com `start-dashboard-nodejs.ps1`

---

🎉 **Dashboard Node.js VCM** - Interface web completa para automação de empresas virtuais!