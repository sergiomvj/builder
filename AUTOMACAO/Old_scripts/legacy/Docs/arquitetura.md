# Arquitetura do Virtual Company Manager

## 🏗️ Arquitetura Geral

```
VCM Central (Supabase)
├── Empresas registradas
├── Personas centralizadas
├── Configurações de sync
└── Logs de operações

     ↕️ Sincronização ↕️

Empresas Individuais (RAG Databases)
├── LifewayUSA (neaoblaycbdunfxgunjo.supabase.co)
├── CarnTrack (futuro)
└── NovaEmpresa (futuro)
```

## 📁 Estrutura de Pastas

```
VIRTUAL_COMPANY_GENERATOR/
├── 02_SCRIPTS_AUTOMACAO/
│   ├── 01_SETUP_E_CRIACAO/
│   ├── 02_PROCESSAMENTO_PERSONAS/
│   ├── 03_ORGANIZACAO_E_MANUTENCAO/
│   └── 04_EXECUTAVEIS_BAT/
├── core/
├── output/
├── .env (configurações centrais)
└── VIRTUAL_COMPANY_TEMPLATE_CLEAN/
```

## 🔄 Fluxo de Dados

1. **Criação:** Empresa → Demografias → Biografias
2. **Processamento:** Scripts 1-5 em cascata
3. **Armazenamento:** RAG Database específica
4. **Sincronização:** RAG → VCM Central
5. **Gestão:** Dashboard centralizado