## Guidelines to Use Gemini AI as Virtual Assistant (LLM Principal)

**Para:** Equipe de Desenvolvimento (Backend/Engenharia de Dados)
**Data:** 15 de Novembro de 2025
**Versão:** 1.0

---

## 1. Introdução

Este documento consolida as informações essenciais para a utilização do **Gemini AI** como o **LLM (Large Language Model) principal** de nossos assistentes virtuais. Ele cobre a configuração do ambiente de teste (gratuidade) e a transição para a produção (custos).

**Objetivo:** Fornecer um guia completo para implementação e planejamento de custos para o uso do Gemini, com foco em estabilidade e escalabilidade.

## 2. Fase de Testes e Avaliação (Free Tier)

A fase inicial deve ser executada utilizando o plano gratuito (*free tier*) da Gemini API, que permite a experimentação sem custos.

### 2.1. Configuração de Acesso

1.  **Obter API Key:** Gerar a chave de API através do [Google AI Studio] (ou portal de desenvolvedores). **Esta chave é a única credencial necessária** para a maioria dos serviços.
2.  **Variável de Ambiente:** Armazenar a chave em uma variável de ambiente **segura** (`GEMINI_API_KEY`) no n8n e no servidor Next.js (API Routes).

### 2.2. Escolha do Modelo e Limites do Free Tier

O **`gemini-2.5-flash`** é o modelo recomendado para assistentes devido à sua velocidade e aos limites mais generosos no *free tier*.

| Limite (Gemini 2.5 Flash) | Quantidade | Implicação para Testes |
| :--- | :--- | :--- |
| **Requisições por Minuto (RPM)** | **10** | Suficiente para testes manuais e simulação de baixo tráfego. |
| **Requisições por Dia (RPD)** | **250** | Limita o volume de testes diários. Ao exceder, a API retorna erro `429`. |

### 2.3. Implementação da Chamada Base (n8n & Next.js)

**A Chamada Base é a mesma em todas as plataformas. Ela deve usar o modelo `gemini-2.5-flash`:**

#### A. Next.js (via SDK `@google/genai`)

```javascript
// Exemplo em uma API Route (lado do servidor)
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const response = await ai.models.generateContent({
  model: 'gemini-2.5-flash',
  contents: [{ role: 'user', parts: [{ text: userQuery }] }],
  // Para RAG, adicione 'tools' de File Search aqui (ver documentação GFS)
});
```

#### B. n8n (via Nó Google GenAI ou HTTP Request)

*   Utilize o nó **Google GenAI** se ele permitir a configuração do modelo e das `tools` (File Search).
*   Se não, use o **Nó HTTP Request** (conforme documentação GFS) para postar no endpoint `.../gemini-2.5-flash:generateContent`.

---

## 3. Fase de Produção e Escalabilidade (Pay-As-You-Go)

Para migrar para produção, é **obrigatório** habilitar o faturamento no Google Cloud para o projeto associado à sua API Key. Isso remove os limites do *free tier* e inicia o modelo de cobrança por uso (**Pay-As-You-Go**).

### 3.1. Visão Geral dos Custos (Modelos Principais)

A precificação do Gemini é baseada em **Tokens** (pedaços de texto), separada entre *Input* (o que você envia, como a pergunta e o contexto do RAG) e *Output* (a resposta gerada pelo modelo).

| Modelo | Preço por 1.000 Tokens de **Input** | Preço por 1.000 Tokens de **Output** |
| :--- | :--- | :--- |
| **Gemini 2.5 Flash** | $$0.00035 | $$0.0007 |
| **Gemini 2.5 Pro** | $$0.0035 | $$0.007 |

> *Nota: Os valores são exemplos baseados na precificação de Novembro de 2025 e estão sujeitos a alterações. Sempre consulte a página oficial de preços da Gemini API.*

### 3.2. Custo da Implementação de RAG (Google File Search - GFS)

O uso do RAG com o GFS adiciona um custo em duas partes:

1.  **Custo de Indexação (Embeddings):**
    *   **O que é:** O custo de processar seus documentos e criar os vetores (embeddings) de busca.
    *   **Cobrança:** Geralmente um custo por 1.000 caracteres ou por 1.000 tokens processados **uma única vez** (no upload).
2.  **Custo de Inferência (Tempo Real):**
    *   **O que é:** O custo dos tokens de *Input* na requisição (`generateContent`). O GFS injeta o contexto do documento na chamada.
    *   **Cobrança:** O contexto recuperado do RAG (que é texto dos seus documentos) é adicionado ao `Input` e cobrado à taxa do modelo (`Flash` ou `Pro`). **Este é o maior componente de custo do RAG**.

### 3.3. Planejamento de Custos e Escalabilidade

1.  **Estime o Uso:** Calcule o número médio de interações diárias esperadas e o número médio de tokens por interação (Input + Output).
    *   *Exemplo:* 10.000 interações/dia, 500 tokens/interação: 5 milhões de tokens/dia.
2.  **Use Flash por Padrão:** O `gemini-2.5-flash` é **10 vezes mais barato** que o `gemini-2.5-pro`. Use o `Pro` apenas para tarefas complexas que exijam raciocínio avançado.
3.  **Monitore a Latência:** Use ferramentas de monitoramento para garantir que as respostas (incluindo o RAG) permaneçam rápidas, o que é crucial para a experiência do usuário.
4.  **Cotas de Produção:** Ao migrar para o plano pago, os limites de RPM e RPD aumentam drasticamente (ex: para 60 RPM ou mais), garantindo a estabilidade em alto tráfego.

## 4. Geração de Imagens e Vídeo (Apenas Pagos)

Para estas funcionalidades (que consomem muitos recursos), o uso de qualquer *free tier* é insignificante ou inexistente.

| Funcionalidade | Modelo | Cobrança Esperada |
| :--- | :--- | :--- |
| **Geração de Imagens** | `imagen-3.0` (ou similar) | Cobrança por **Imagem Gerada** (geralmente por resolução ou por lote). |
| **Geração de Vídeo** | (Modelos avançados) | Cobrança por **Tempo de Vídeo Gerado** (ex: por segundo de vídeo). |

**Ação:** Consulte a documentação de precificação do **Vertex AI** ou do **Google AI Studio** para os custos exatos desses modelos de mídia antes de planejar a implementação.