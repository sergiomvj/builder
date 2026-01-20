# Como Configurar Inference Endpoints no HuggingFace

## 🚀 Passos para Configurar:

### 1. Acesse o Painel
- Vá para: https://ui.endpoints.huggingface.co/
- Faça login com sua conta PRO

### 2. Crie um Novo Endpoint
- Clique em "New Endpoint"
- **Modelo**: `stabilityai/stable-diffusion-xl-base-1.0`
- **Nome**: `vc-sdxl-endpoint` (ou qualquer nome)
- **Região**: `us-east-1` (mais próximo do Brasil)
- **Tipo de Instância**: `gpu` (recomendado para SDXL)
- **Escala Mínima**: 0 (para economizar quando não usar)
- **Escala Máxima**: 1

### 3. Configure no Projeto
Após criar, você receberá uma URL como:
```
https://vc-sdxl-endpoint-abc123.us-east-1.aws.endpoints.huggingface.cloud
```

Adicione no seu `.env.local`:
```env
# Opção 1: URL específica (mais rápida)
HUGGINGFACE_SDXL_ENDPOINT=https://vc-sdxl-endpoint-abc123.us-east-1.aws.endpoints.huggingface.cloud

# Opção 2: Padrão com wildcards (mais flexível)
HUGGINGFACE_SDXL_PATTERN=vc-sdxl-*
```

## 💡 Padrões de Endpoint (Wildcards)

O script suporta padrões com wildcards para encontrar automaticamente endpoints:

### Exemplos de Padrões:
```env
# Corresponde a qualquer endpoint começando com "vc-sdxl-"
HUGGINGFACE_SDXL_PATTERN=vc-sdxl-*

# Corresponde exatamente a um nome
HUGGINGFACE_SDXL_PATTERN=my-sdxl-endpoint

# Corresponde a qualquer coisa contendo "sdxl"
HUGGINGFACE_SDXL_PATTERN=*sdxl*

# Corresponde a endpoints de produção
HUGGINGFACE_SDXL_PATTERN=*-prod

# Corresponde a qualquer endpoint terminando com "endpoint"
HUGGINGFACE_SDXL_PATTERN=*endpoint
```

### Ordem de Prioridade:
1. **HUGGINGFACE_SDXL_ENDPOINT** (URL específica - mais rápida)
2. **HUGGINGFACE_SDXL_PATTERN** (padrão - mais flexível)
3. **Router genérico** (fallback automático)

## ⚡ Benefícios dos Padrões:
- 🔄 **Auto-detecção**: Encontra endpoints automaticamente
- 🔧 **Manutenção fácil**: Adicione/remova endpoints sem alterar código
- 🚀 **Load balancing**: Pode usar múltiplos endpoints
- 📈 **Escalabilidade**: Fácil expansão

## 💰 Custos Esperados:
- **GPU T4**: ~$0.50/hora quando ativo
- **Por imagem**: ~$0.001 (1/1000 de dólar)
- **Armazenamento**: Grátis para modelos

## ⚡ Comparação:
- **Router Genérico**: Lento, filas, limites diários
- **Endpoint Específico**: Rápido, confiável, custo fixo
- **Padrão de Endpoints**: Mais flexível, auto-gerenciamento

## 🔧 Como Testar:
```bash
cd AUTOMACAO

# Testar configuração atual
node check_inference_endpoints.js

# Testar geração com padrão
node 05b_generate_images_pollinations.js --empresaId=768e7df2-fc61-424e-8618-cbfa1db74331
```

O script irá detectar automaticamente e usar o endpoint dedicado!

## 📝 Exemplo Prático:

### Cenário: Múltiplos Endpoints
Você tem 3 endpoints no HuggingFace:
- `vc-sdxl-prod-001` (running)
- `vc-sdxl-prod-002` (running) 
- `vc-sdxl-dev-001` (stopped)

### Configuração:
```env
# Opção A: Usar qualquer endpoint de produção
HUGGINGFACE_SDXL_PATTERN=vc-sdxl-prod-*

# Opção B: Usar endpoint específico
HUGGINGFACE_SDXL_ENDPOINT=https://vc-sdxl-prod-001.aws.endpoints.huggingface.cloud
```

### Resultado:
- **Padrão**: Script encontra automaticamente `vc-sdxl-prod-001` ou `vc-sdxl-prod-002`
- **Específico**: Script usa sempre `vc-sdxl-prod-001`
- **Fallback**: Se nenhum endpoint disponível, usa router genérico