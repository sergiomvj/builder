'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Bold, 
  Italic, 
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Save,
  Edit,
  Eye,
  Wand2,
  FileText,
  User
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface BiografiaRichEditorProps {
  persona: any;
  onUpdate?: (biografia: string) => void;
  readOnly?: boolean;
  showAIGenerate?: boolean;
}

export function BiografiaRichEditor({ 
  persona, 
  onUpdate, 
  readOnly = false,
  showAIGenerate = true 
}: BiografiaRichEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [biografiaText, setBiografiaText] = useState(
    persona.biografia_completa || persona.biografia || ''
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewMode, setPreviewMode] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    setBiografiaText(persona.biografia_completa || persona.biografia || '');
  }, [persona]);

  const handleSave = () => {
    if (onUpdate) {
      onUpdate(biografiaText);
    }
    setIsEditing(false);
    setPreviewMode(true);
    
    toast({
      title: 'Biografia salva!',
      description: 'As alterações foram salvas com sucesso.'
    });
  };

  const handleCancel = () => {
    setBiografiaText(persona.biografia_completa || persona.biografia || '');
    setIsEditing(false);
    setPreviewMode(true);
  };

  const handleGenerateAI = async () => {
    setIsGenerating(true);
    try {
      // Simula geração por IA (aqui você conectaria com o backend)
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const generatedBio = generateMockBiografia(persona);
      setBiografiaText(generatedBio);
      setIsEditing(true);
      setPreviewMode(false);
      
      toast({
        title: 'Biografia gerada por IA!',
        description: 'Uma nova biografia foi gerada. Você pode editá-la antes de salvar.'
      });
    } catch (error) {
      toast({
        title: 'Erro ao gerar biografia',
        description: 'Não foi possível gerar a biografia automaticamente.'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const insertFormatting = (prefix: string, suffix: string = '') => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = biografiaText.substring(start, end);
    
    const newText = 
      biografiaText.substring(0, start) + 
      prefix + 
      selectedText + 
      suffix + 
      biografiaText.substring(end);
    
    setBiografiaText(newText);
    
    // Reposiciona o cursor
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + prefix.length, 
        end + prefix.length
      );
    }, 0);
  };

  const formatMarkdownToHTML = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/__(.*?)__/g, '<u>$1</u>')
      .replace(/^### (.*$)/gm, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>')
      .replace(/^## (.*$)/gm, '<h2 class="text-xl font-semibold mt-6 mb-3">$1</h2>')
      .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold mt-8 mb-4">$1</h1>')
      .replace(/^\* (.*$)/gm, '<li class="ml-4">• $1</li>')
      .replace(/^\d+\. (.*$)/gm, '<li class="ml-4">$1</li>')
      .replace(/\n\n/g, '</p><p class="mb-3">')
      .replace(/\n/g, '<br>');
  };

  const getWordCount = (text: string) => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  const getReadingTime = (text: string) => {
    const wordCount = getWordCount(text);
    const wordsPerMinute = 200;
    return Math.ceil(wordCount / wordsPerMinute);
  };

  return (
    <div className="space-y-6">
      {/* Header com estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {getWordCount(biografiaText)}
            </div>
            <div className="text-sm text-gray-600">Palavras</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {biografiaText.length}
            </div>
            <div className="text-sm text-gray-600">Caracteres</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {getReadingTime(biografiaText)}
            </div>
            <div className="text-sm text-gray-600">Min. Leitura</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">
              {biografiaText ? '100%' : '0%'}
            </div>
            <div className="text-sm text-gray-600">Completude</div>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar de ações */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User size={20} className="text-blue-600" />
              <div>
                <h3 className="font-medium">{persona.full_name || persona.nome}</h3>
                <p className="text-sm text-gray-600">{persona.role || persona.cargo}</p>
              </div>
            </div>

            <div className="flex gap-2">
              {showAIGenerate && (
                <Button
                  onClick={handleGenerateAI}
                  disabled={isGenerating}
                  variant="outline"
                  size="sm"
                >
                  {isGenerating ? (
                    <>
                      <Wand2 className="mr-1 h-4 w-4 animate-spin" />
                      Gerando...
                    </>
                  ) : (
                    <>
                      <Wand2 className="mr-1 h-4 w-4" />
                      Gerar com IA
                    </>
                  )}
                </Button>
              )}

              {!readOnly && (
                <>
                  <Button
                    onClick={() => setPreviewMode(!previewMode)}
                    variant="outline"
                    size="sm"
                  >
                    {previewMode ? (
                      <>
                        <Edit className="mr-1 h-4 w-4" />
                        Editar
                      </>
                    ) : (
                      <>
                        <Eye className="mr-1 h-4 w-4" />
                        Preview
                      </>
                    )}
                  </Button>

                  {!previewMode && (
                    <>
                      <Button onClick={handleSave} size="sm">
                        <Save className="mr-1 h-4 w-4" />
                        Salvar
                      </Button>
                      <Button onClick={handleCancel} variant="outline" size="sm">
                        Cancelar
                      </Button>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Editor/Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText size={20} />
            Biografia Completa
            {biografiaText && <Badge variant="secondary">Preenchida</Badge>}
          </CardTitle>
          <CardDescription>
            {previewMode 
              ? 'Visualização da biografia formatada' 
              : 'Editor de texto com formatação Markdown'
            }
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {!previewMode && !readOnly ? (
            <div className="space-y-4">
              {/* Toolbar de formatação */}
              <div className="flex gap-1 p-2 bg-gray-50 rounded-lg flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => insertFormatting('**', '**')}
                  className="h-8 w-8 p-0"
                  title="Negrito"
                >
                  <Bold size={14} />
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => insertFormatting('*', '*')}
                  className="h-8 w-8 p-0"
                  title="Itálico"
                >
                  <Italic size={14} />
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => insertFormatting('__', '__')}
                  className="h-8 w-8 p-0"
                  title="Sublinhado"
                >
                  <Underline size={14} />
                </Button>

                <div className="w-px h-6 bg-gray-300 mx-1 self-center" />

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => insertFormatting('## ')}
                  className="h-8 px-2 text-xs"
                  title="Título"
                >
                  H2
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => insertFormatting('### ')}
                  className="h-8 px-2 text-xs"
                  title="Subtítulo"
                >
                  H3
                </Button>

                <div className="w-px h-6 bg-gray-300 mx-1 self-center" />

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => insertFormatting('\n* ')}
                  className="h-8 w-8 p-0"
                  title="Lista"
                >
                  <List size={14} />
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => insertFormatting('\n1. ')}
                  className="h-8 w-8 p-0"
                  title="Lista Numerada"
                >
                  <ListOrdered size={14} />
                </Button>
              </div>

              {/* Área de texto */}
              <Textarea
                ref={textareaRef}
                value={biografiaText}
                onChange={(e) => setBiografiaText(e.target.value)}
                className="min-h-[400px] font-mono text-sm"
                placeholder="Digite a biografia da persona... 

Você pode usar formatação Markdown:
**texto em negrito**
*texto em itálico*
__texto sublinhado__

## Títulos grandes
### Títulos médios

* Lista com bullets
1. Lista numerada

Pressione Tab para indentação."
              />
              
              {/* Dicas de formatação */}
              <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
                <strong>Dicas de formatação:</strong> Use **negrito**, *itálico*, __sublinhado__. 
                ## para títulos, * para listas. Quebras de linha duplas criam parágrafos.
              </div>
            </div>
          ) : (
            <div className="min-h-[400px]">
              {biografiaText ? (
                <div 
                  className="prose max-w-none text-sm leading-relaxed"
                  dangerouslySetInnerHTML={{ 
                    __html: `<p class="mb-3">${formatMarkdownToHTML(biografiaText)}</p>` 
                  }}
                />
              ) : (
                <div className="flex items-center justify-center h-64 text-gray-500">
                  <div className="text-center">
                    <FileText size={48} className="mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-medium mb-2">Biografia não preenchida</h3>
                    <p className="text-sm max-w-md">
                      {showAIGenerate 
                        ? 'Clique em "Gerar com IA" para criar uma biografia automaticamente ou use "Editar" para escrever manualmente.'
                        : 'Esta persona ainda não possui uma biografia completa.'
                      }
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Templates e sugestões */}
      {!biografiaText && !previewMode && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Templates de Biografia</CardTitle>
            <CardDescription>
              Clique em um template para começar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {getBiografiaTemplates(persona).map((template, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="h-auto p-3 text-left justify-start"
                  onClick={() => setBiografiaText(template.content)}
                >
                  <div>
                    <div className="font-medium text-sm">{template.title}</div>
                    <div className="text-xs text-gray-600 mt-1">{template.description}</div>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Função para gerar templates baseados na persona
function getBiografiaTemplates(persona: any) {
  const nome = persona.full_name || persona.nome;
  const cargo = persona.role || persona.cargo;
  const experiencia = persona.experiencia_anos || 3;

  return [
    {
      title: 'Template Executivo',
      description: 'Para líderes e executivos',
      content: `## ${nome}
### ${cargo}

**Trajetória Profissional**
${nome} é um(a) profissional experiente com mais de ${experiencia} anos de atuação em posições de liderança. Graduado(a) em [ÁREA], possui especialização em [ESPECIALIZAÇÃO].

**Experiência e Competências**
Ao longo de sua carreira, desenvolveu expertise em:
* Gestão estratégica de equipes
* Planejamento e execução de projetos complexos
* Tomada de decisão em ambientes desafiadores

**Visão e Filosofia**
${nome} acredita que o sucesso organizacional vem da combinação entre pessoas, processos e tecnologia, sempre com foco em resultados sustentáveis.`
    },
    {
      title: 'Template Técnico',
      description: 'Para especialistas e técnicos',
      content: `## ${nome}
### ${cargo}

**Formação e Especialização**
${nome} é especialista em ${cargo.toLowerCase()}, com ${experiencia} anos de experiência prática na área. Possui formação técnica sólida e está sempre atualizado com as últimas tendências do mercado.

**Competências Técnicas**
* Domínio avançado de ferramentas e tecnologias específicas
* Experiência em projetos de diferentes portes e complexidades
* Capacidade analítica e resolução de problemas técnicos

**Abordagem de Trabalho**
Focado(a) em soluções práticas e eficientes, ${nome} combina conhecimento técnico com visão estratégica para entregar resultados de qualidade.`
    },
    {
      title: 'Template Assistente',
      description: 'Para posições de suporte',
      content: `## ${nome}
### ${cargo}

**Perfil Profissional**
${nome} é um(a) profissional dedicado(a) e organizado(a), com ${experiencia} anos de experiência em funções de suporte administrativo e operacional.

**Habilidades Principais**
* Excelente capacidade de organização e gestão de tempo
* Comunicação clara e eficiente
* Proatividade na resolução de demandas
* Atenção aos detalhes e precisão nas tarefas

**Características Pessoais**
Conhecido(a) pela confiabilidade e eficiência, ${nome} é uma peça fundamental na manutenção da produtividade e organização da equipe.`
    }
  ];
}

// Função para gerar biografia mock
function generateMockBiografia(persona: any) {
  const nome = persona.full_name || persona.nome;
  const cargo = persona.role || persona.cargo;
  const experiencia = persona.experiencia_anos || 3;
  const email = persona.email;

  return `## ${nome}
### ${cargo} | Especialista em ${cargo}

**Sobre**
${nome} é um(a) profissional altamente qualificado(a) com ${experiencia} anos de experiência sólida em ${cargo.toLowerCase()}. Reconhecido(a) pela excelência técnica e capacidade de liderança, tem um histórico comprovado de entrega de resultados em projetos complexos e desafiadores.

**Trajetória Profissional**
Iniciou sua carreira como [POSIÇÃO INICIAL] e rapidamente demonstrou aptidão excepcional para a área. Ao longo dos anos, desenvolveu competências avançadas em:

* **Gestão e Liderança**: Experiência em liderar equipes multidisciplinares
* **Inovação**: Implementação de soluções criativas e eficientes
* **Comunicação**: Habilidade para traduzir conceitos técnicos complexos
* **Resultados**: Foco consistente em entregar valor mensurável

**Filosofia de Trabalho**
"Acredito que o sucesso vem da combinação entre conhecimento técnico, trabalho em equipe e uma mentalidade de melhoria contínua. Cada projeto é uma oportunidade de aprender algo novo e contribuir para o crescimento da organização."

**Formação e Certificações**
* Graduação em [ÁREA RELACIONADA]
* Pós-graduação em [ESPECIALIZAÇÃO]
* Certificações relevantes na área de atuação
* Participação regular em conferências e eventos do setor

**Contato Profissional**
📧 ${email}
📱 ${persona.whatsapp || '(11) 99999-9999'}

---
*"Transformar desafios em oportunidades é o que me motiva todos os dias."* - ${nome}`;
}