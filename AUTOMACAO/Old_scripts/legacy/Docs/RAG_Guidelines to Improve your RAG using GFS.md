## Guidelines to Improve your RAG using GFS (Google File Search)

**Para:** Equipe de Desenvolvimento (Backend/Engenharia de Dados)
**Data:** 15 de Novembro de 2025
**Versão:** 1.0

---

## 1. Introdução

Este documento detalha o procedimento padrão para a integração do **Google File Search (GFS)**, um recurso do Gemini API, nos fluxos de Geração Aumentada por Recuperação (RAG) de nossos assistentes virtuais. O GFS oferece um sistema de RAG totalmente gerenciado, eliminando a necessidade de infraestrutura de banco de dados vetorial separada e garantindo respostas com citações automáticas, diretamente baseadas em nossa base de conhecimento proprietária.

**Objetivo:** Padronizar a implementação do GFS como a principal fonte de conhecimento para o RAG, cobrindo tanto fluxos de automação (n8n) quanto endpoints de aplicação (Next.js/API Routes).

## 2. Pré-requisitos

Antes de iniciar a implementação, certifique-se de que a equipe tenha acesso aos seguintes recursos:

1.  **Chave da Gemini API:** Acesso à chave de API com permissões adequadas para usar o `fileSearch` e `generateContent`.
2.  **Documentos Fonte:** Os arquivos (PDF, DOCX, TXT, etc.) que compõem a base de conhecimento.
3.  **Ambientes:** Acesso à instância do n8n e ao repositório do projeto Next.js.
4.  **SDK (Next.js):** O pacote `@google/genai` instalado.

---

## 3. Fase 1: Gerenciamento do Conhecimento Base (GFS Store)

As seguintes ações são necessárias para configurar a base de conhecimento e são geralmente executadas uma única vez (ou em um fluxo de manutenção de dados) usando o nó **HTTP Request** no n8n ou um script de gerenciamento na aplicação.

### 3.1. Criação do File Search Store

O Store é o contêiner lógico que armazena os *embeddings* de todos os documentos.

| Ação | Método | Endpoint (Gemini API) |
| :--- | :--- | :--- |
| **Criar Store** | `POST` | `https://generativelanguage.googleapis.com/v1/fileStores` |

**Corpo da Requisição (JSON Exemplo):**

```json
{
  "displayName": "KnowledgeBase_Assistente_Vendas",
  "fileStoreConfig": {
    "fileStoreType": "FILE_STORE_TYPE_TINKER" 
    // Opção padrão para RAG 
  }
}
```

*   **Resultado:** A API retornará o `name` do Store (ex: `fileStores/123456789`). **Este ID é crucial e deve ser armazenado como uma variável de ambiente** (`GFS_STORE_ID`).

### 3.2. Upload e Indexação de Arquivos

Após a criação do Store, os documentos são enviados e importados para indexação.

#### Passo A: Upload do Conteúdo

| Ação | Método | Endpoint (Gemini API) |
| :--- | :--- | :--- |
| **Upload File** | `POST` | `https://generativelanguage.googleapis.com/v1/files:upload` |

**Corpo da Requisição:** Utilize um formulário `multipart/form-data` para enviar o conteúdo do arquivo.

*   **Resultado:** A API retornará o `name` do arquivo (ex: `files/ABCDEF`).

#### Passo B: Importar para o Store

| Ação | Método | Endpoint (Gemini API) |
| :--- | :--- | :--- |
| **Import File** | `POST` | `https://generativelanguage.googleapis.com/v1/fileStores/{GFS_STORE_ID}/files` |

**Corpo da Requisição (JSON Exemplo):**

```json
{
  "name": "files/ABCDEF" 
  // O 'name' retornado do passo A
}
```

*   **Ação do GFS:** O Google File Search processará o arquivo (chunking, embedding) e o indexará automaticamente.

---

## 4. Fase 2: Implementação em Fluxos n8n

Use a n8n para orquestrar o fluxo de RAG do assistente, sendo ideal para automações ou backends de baixo código.

### 4.1. Uso do Nó Google GenAI (Gemini)

Assumindo que a versão atualizada do nó `Google GenAI` suporta a configuração de ferramentas.

| Configuração | Valor | Notas |
| :--- | :--- | :--- |
| **Model** | `gemini-2.5-flash` (Recomendado) | Modelo mais rápido e otimizado para tarefas de RAG. |
| **Prompt** | `{{$json.user_query}}` | A pergunta recebida do usuário. |
| **Tools** | Ativar **File Search** | Habilita a funcionalidade de pesquisa em seus dados. |
| **File Store IDs** | `{{$env.GFS_STORE_ID}}` | Aponta para o Store criado na Fase 1. |

**Fluxo Lógico no n8n:**

1.  **Trigger** (Ex: Webhook de Assistente/Chatbot) recebe a pergunta.
2.  **Google GenAI Node:** Configurado conforme a tabela acima, realiza a pesquisa e a geração da resposta.
3.  **Response Node:** Retorna a resposta (que incluirá o texto gerado e os metadados de citação).

### 4.2. Uso do Nó HTTP Request (Alternativa/Fallback)

Se o nó nativo não suportar as configurações de `tools`, utilize o nó `HTTP Request` para chamar o endpoint `generateContent` diretamente.

| Ação | Método | Endpoint (Gemini API) |
| :--- | :--- | :--- |
| **RAG Query** | `POST` | `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent` |

**Corpo da Requisição (JSON com Configuração de RAG):**

```json
{
  "contents": [
    {
      "role": "user",
      "parts": [
        {"text": "Qual o procedimento de devolução para produtos com defeito?"} 
        // Variável da pergunta do usuário
      ]
    }
  ],
  "config": {
    "tools": [
      {
        "fileSearch": {
          "fileStoreConfig": {
            "fileStoreIds": [
              "fileStores/123456789" // Use a variável GFS_STORE_ID
            ]
          }
        }
      }
    ]
  }
}
```

---

## 5. Fase 3: Implementação em Next.js (API Routes)

Esta é a abordagem recomendada para aplicações robustas, utilizando o SDK oficial do Google GenAI.

### 5.1. Estrutura do Arquivo (`pages/api/rag-query.js` ou similar)

```javascript
// Exemplo usando o SDK oficial
import { GoogleGenAI } from '@google/genai';

// Inicialização com a chave de API (idealmente via variáveis de ambiente)
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// ID do Store da Fase 1, via variável de ambiente
const GFS_STORE_ID = process.env.GFS_STORE_ID; 

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { query } = req.body; // A pergunta do usuário

  if (!query) {
    return res.status(400).json({ message: 'Missing query parameter' });
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: query }] }],
      config: {
        tools: [
          {
            // Ativa a ferramenta File Search e configura com o Store ID
            fileSearch: {
              fileStoreConfig: {
                fileStoreIds: [GFS_STORE_ID], 
              },
            },
          },
        ],
      },
    });

    // Acessa a resposta gerada e as citações (se houver)
    const generatedText = response.text;
    const citations = response.candidates?.[0]?.citations?.[0]; // Metadados das fontes

    res.status(200).json({ 
      answer: generatedText, 
      sources: citations 
    });

  } catch (error) {
    console.error('Gemini API Error:', error);
    res.status(500).json({ message: 'Error processing RAG query' });
  }
}
```

---

## 6. Boas Práticas e Manutenção

*   **Segurança (Next.js):** Sempre faça a chamada à API do Gemini em uma **API Route no lado do servidor**. Nunca exponha a chave da API no código do lado do cliente (browser).
*   **Gestão de Documentos:** Crie um fluxo de n8n separado para automatizar a importação de novos documentos. Isso garante que a base de conhecimento seja atualizada com o mínimo de intervenção manual.
*   **Monitoramento:** Monitore a latência da chamada `generateContent`. Embora o GFS seja rápido, a inclusão do RAG adiciona tempo de processamento.
*   **Citações:** Sempre utilize o metadado `citations` retornado pela API para mostrar ao usuário de qual documento a resposta foi obtida. Isso aumenta a confiança e a transparência do assistente.