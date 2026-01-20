'use client';

import { useState } from 'react';
import { X, Save, User, Brain, Code, Database, GitBranch, Workflow, Loader2, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { usePersonaCompleta } from '@/hooks/usePersonaCompleta';

interface PersonaEditModalProps {
  persona: any;
  isOpen: boolean;
  onClose: () => void;
  onSave?: (personaData: any) => void;
  initialTab?: string;
}

export function PersonaEditModal({ persona, isOpen, onClose, onSave, initialTab = 'biografia' }: PersonaEditModalProps) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [hasChanges, setHasChanges] = useState(false);
  
  // Buscar dados completos da persona do Supabase
  const { data: personaCompleta, isLoading, error } = usePersonaCompleta(persona?.id);

  const handleSave = () => {
    onSave?.(personaCompleta);
    setHasChanges(false);
    onClose();
  };

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden bg-white">
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Carregando dados da persona...</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (error) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden bg-white">
          <div className="flex items-center justify-center p-8">
            <span className="text-red-600">Erro ao carregar dados da persona</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!persona) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden bg-white">
        <DialogHeader className="bg-white border-b pb-4">
          <DialogTitle className="flex items-center gap-2 text-gray-900">
            <User className="h-5 w-5" />
            Editar Persona: {persona?.nome || 'Persona'}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden bg-white">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col bg-white">
            <TabsList className="grid w-full grid-cols-7 bg-gray-50 mb-4">
              <TabsTrigger value="biografia" className="flex items-center gap-1 text-xs">
                <User size={14} />
                Bio
              </TabsTrigger>
              <TabsTrigger value="competencias" className="flex items-center gap-1 text-xs">
                <Brain size={14} />
                Skills
              </TabsTrigger>
              <TabsTrigger value="educacao" className="flex items-center gap-1 text-xs">
                <GraduationCap size={14} />
                Educação
              </TabsTrigger>
              <TabsTrigger value="tech" className="flex items-center gap-1 text-xs">
                <Code size={14} />
                Tech
              </TabsTrigger>
              <TabsTrigger value="rag" className="flex items-center gap-1 text-xs">
                <Database size={14} />
                RAG
              </TabsTrigger>
              <TabsTrigger value="fluxos" className="flex items-center gap-1 text-xs">
                <GitBranch size={14} />
                Fluxos
              </TabsTrigger>
              <TabsTrigger value="workflows" className="flex items-center gap-1 text-xs">
                <Workflow size={14} />
                Workflows
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto bg-white" style={{ maxHeight: 'calc(90vh - 200px)' }}>
              <TabsContent value="biografia" className="space-y-4 mt-0 bg-white text-gray-900">
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                  <div>
                    <Label htmlFor="biografia-completa">Biografia Completa</Label>
                    <Textarea
                      id="biografia-completa"
                      value={personaCompleta?.biografia?.biografia_completa || 'Biografia ainda não gerada'}
                      readOnly
                      className="mt-1 min-h-[120px] max-h-[200px]"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="historia-profissional">História Profissional</Label>
                    <Textarea
                      id="historia-profissional"
                      value={personaCompleta?.biografia?.historia_profissional || 'História profissional ainda não gerada'}
                      readOnly
                      className="mt-1 min-h-[100px]"
                    />
                  </div>
                  
                  {/* Motivações */}
                  {personaCompleta?.biografia?.motivacoes && (
                    <div>
                      <Label>Motivações</Label>
                      <div className="mt-2 space-y-2">
                        {personaCompleta.biografia.motivacoes.intrinsecas && (
                          <div>
                            <span className="text-sm font-medium text-blue-600">Intrínsecas:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {personaCompleta.biografia.motivacoes.intrinsecas.map((motivacao: string, idx: number) => (
                                <Badge key={idx} variant="secondary">{motivacao}</Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {personaCompleta.biografia.motivacoes.valores_pessoais && (
                          <div>
                            <span className="text-sm font-medium text-green-600">Valores:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {personaCompleta.biografia.motivacoes.valores_pessoais.map((valor: string, idx: number) => (
                                <Badge key={idx} variant="outline">{valor}</Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Objetivos Pessoais */}
                  {personaCompleta?.biografia?.objetivos_pessoais && (
                    <div>
                      <Label>Objetivos Pessoais</Label>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {personaCompleta.biografia.objetivos_pessoais.map((objetivo: string, idx: number) => (
                          <Badge key={idx} variant="default">{objetivo}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="competencias" className="space-y-6 mt-0 bg-white text-gray-900">
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                  {/* Hard Skills */}
                  <div>
                    <Label>Hard Skills</Label>
                    <div className="mt-2 space-y-3 max-h-[200px] overflow-y-auto pr-1">
                      {personaCompleta?.competencias?.filter(c => c.tipo === 'hard_skill' || c.tipo === 'tecnica' || c.tipo === 'principal')?.map((skill: any, idx: number) => (
                        <div key={skill.id || idx} className="p-3 border rounded-lg bg-blue-50">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <Badge variant="default" className="mb-2">{skill.categoria || 'Técnica'}</Badge>
                              <h4 className="font-medium text-gray-900">{skill.nome}</h4>
                              <p className="text-sm text-gray-700">{skill.descricao || ''}</p>
                            </div>
                            <Badge variant="outline" className="ml-2">
                              {skill.nivel || 'N/A'}
                            </Badge>
                          </div>
                        </div>
                      )) || <p className="text-sm text-gray-500">Hard skills ainda não geradas</p>}
                    </div>
                  </div>
                  
                  {/* Soft Skills */}
                  <div>
                    <Label>Soft Skills</Label>
                    <div className="mt-2 space-y-3 max-h-[200px] overflow-y-auto pr-1">
                      {personaCompleta?.competencias?.filter(c => c.tipo === 'soft_skill')?.map((skill: any, idx: number) => (
                        <div key={skill.id || idx} className="p-3 border rounded-lg bg-green-50">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <Badge variant="secondary" className="mb-2">{skill.categoria || 'Comportamental'}</Badge>
                              <h4 className="font-medium text-gray-900">{skill.nome}</h4>
                              <p className="text-sm text-gray-700">{skill.descricao || ''}</p>
                            </div>
                            <Badge variant="outline" className="ml-2">
                              {skill.nivel || 'N/A'}
                            </Badge>
                          </div>
                        </div>
                      )) || <p className="text-sm text-gray-500">Soft skills ainda não geradas</p>}
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="tech" className="space-y-4 mt-0 bg-white text-gray-900">
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                  
                  {/* Tech Specifications */}
                  {personaCompleta?.tech_specs && (
                    <div>
                      <Label>Especificações Técnicas</Label>
                      <div className="mt-2 space-y-3">
                        {/* Tools */}
                        <div className="p-3 border rounded-lg bg-blue-50">
                          <h4 className="font-medium text-gray-900 mb-2">Ferramentas</h4>
                          <div className="flex flex-wrap gap-1">
                            {personaCompleta.tech_specs.tools?.map((tool, idx) => (
                              <Badge key={idx} variant="default">{tool}</Badge>
                            )) || <span className="text-sm text-gray-500">Nenhuma ferramenta definida</span>}
                          </div>
                        </div>
                        
                        {/* Technologies */}
                        <div className="p-3 border rounded-lg bg-green-50">
                          <h4 className="font-medium text-gray-900 mb-2">Tecnologias</h4>
                          <div className="flex flex-wrap gap-1">
                            {personaCompleta.tech_specs.technologies?.map((tech, idx) => (
                              <Badge key={idx} variant="secondary">{tech}</Badge>
                            )) || <span className="text-sm text-gray-500">Nenhuma tecnologia definida</span>}
                          </div>
                        </div>
                        
                        {/* Methodologies */}
                        <div className="p-3 border rounded-lg bg-yellow-50">
                          <h4 className="font-medium text-gray-900 mb-2">Metodologias</h4>
                          <div className="flex flex-wrap gap-1">
                            {personaCompleta.tech_specs.methodologies?.map((method, idx) => (
                              <Badge key={idx} variant="outline">{method}</Badge>
                            )) || <span className="text-sm text-gray-500">Nenhuma metodologia definida</span>}
                          </div>
                        </div>
                        
                        {/* Sales Enablement */}
                        {personaCompleta.tech_specs.sales_enablement && personaCompleta.tech_specs.sales_enablement.length > 0 && (
                          <div className="p-3 border rounded-lg bg-purple-50">
                            <h4 className="font-medium text-gray-900 mb-2">Sales Enablement</h4>
                            <div className="flex flex-wrap gap-1">
                              {personaCompleta.tech_specs.sales_enablement.map((item, idx) => (
                                <Badge key={idx} variant="default" className="bg-purple-600">{item}</Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {!personaCompleta?.tech_specs && (
                    <div className="text-center p-8 text-gray-500">
                      <p>Tech specs ainda não foram geradas para esta persona</p>
                      <p className="text-sm">Execute o script de tech specifications</p>
                    </div>
                  )}
                  
                  {/* Idiomas */}
                  {personaCompleta?.biografia?.idiomas_fluencia && (
                    <div>
                      <Label>Idiomas e Fluência</Label>
                      <div className="mt-2 space-y-3">
                        {personaCompleta.biografia.idiomas_fluencia.nativo && (
                          <div>
                            <span className="text-sm font-medium text-green-600">Nativo:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {personaCompleta.biografia.idiomas_fluencia.nativo.map((idioma: string, idx: number) => (
                                <Badge key={idx} variant="default">{idioma}</Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {personaCompleta.biografia.idiomas_fluencia.fluente && (
                          <div>
                            <span className="text-sm font-medium text-blue-600">Fluente:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {personaCompleta.biografia.idiomas_fluencia.fluente.map((idioma: string, idx: number) => (
                                <Badge key={idx} variant="secondary">{idioma}</Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {personaCompleta.biografia.idiomas_fluencia.intermediario && (
                          <div>
                            <span className="text-sm font-medium text-yellow-600">Intermediário:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {personaCompleta.biografia.idiomas_fluencia.intermediario.map((idioma: string, idx: number) => (
                                <Badge key={idx} variant="outline">{idioma}</Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Redes Sociais */}
                  {personaCompleta?.biografia?.redes_sociais && (
                    <div>
                      <Label>Redes Sociais</Label>
                      <div className="mt-2 p-3 border rounded-lg bg-gray-50">
                        {personaCompleta.biografia.redes_sociais.linkedin && (
                          <p className="text-sm text-gray-700">
                            <strong>LinkedIn:</strong> {personaCompleta.biografia.redes_sociais.linkedin}
                          </p>
                        )}
                        {personaCompleta.biografia.redes_sociais.github && (
                          <p className="text-sm text-gray-700">
                            <strong>GitHub:</strong> {personaCompleta.biografia.redes_sociais.github}
                          </p>
                        )}
                        {personaCompleta.biografia.redes_sociais.website_pessoal && (
                          <p className="text-sm text-gray-700">
                            <strong>Website:</strong> {personaCompleta.biografia.redes_sociais.website_pessoal}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="educacao" className="space-y-4 mt-0 bg-white text-gray-900">
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                  {/* Educação */}
                  {personaCompleta?.biografia?.educacao && (
                    <div>
                      <Label>Formação Acadêmica</Label>
                      <div className="mt-2 space-y-3">
                        {personaCompleta.biografia.educacao.map((edu: any, idx: number) => (
                          <div key={idx} className="p-3 border rounded-lg bg-yellow-50">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <Badge variant="secondary" className="mb-2">{edu.nivel}</Badge>
                                <h4 className="font-medium text-gray-900">{edu.curso}</h4>
                                <p className="text-sm text-gray-600">{edu.instituicao}</p>
                                <p className="text-xs text-gray-500">{edu.periodo}</p>
                              </div>
                              <div className="ml-2">
                                {edu.status && (
                                  <Badge variant={edu.status === 'Completo' ? 'default' : 'outline'}>
                                    {edu.status}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        )) || <p className="text-sm text-gray-500">Informações educacionais ainda não geradas</p>}
                      </div>
                    </div>
                  )}
                  
                  {/* Certificações */}
                  {personaCompleta?.biografia?.certificacoes && (
                    <div>
                      <Label>Certificações</Label>
                      <div className="mt-2 space-y-2">
                        {personaCompleta.biografia.certificacoes.map((cert: any, idx: number) => (
                          <div key={idx} className="p-2 border rounded bg-blue-50">
                            <div className="flex justify-between items-center">
                              <div>
                                <span className="text-sm font-medium">{cert.nome}</span>
                                <p className="text-xs text-gray-600">{cert.instituicao}</p>
                              </div>
                              <Badge variant="outline">{cert.ano}</Badge>
                            </div>
                          </div>
                        )) || <p className="text-sm text-gray-500">Certificações ainda não geradas</p>}
                      </div>
                    </div>
                  )}
                  
                  {/* Experiência Profissional */}
                  {personaCompleta?.biografia?.historia_profissional && (
                    <div>
                      <Label>Experiência Profissional</Label>
                      <div className="mt-2 p-3 border rounded-lg bg-gray-50">
                        <p className="text-sm text-gray-700">{personaCompleta.biografia.historia_profissional}</p>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="rag" className="space-y-4 mt-0 bg-white text-gray-900">
                <div className="space-y-4">
                  <div className="text-center p-8 text-gray-500">
                    <p>Funcionalidades RAG serão implementadas em breve</p>
                    <p className="text-sm">Base de conhecimento em desenvolvimento</p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="fluxos" className="space-y-4 mt-0 bg-white text-gray-900">
                <div className="space-y-4">
                  <div className="text-center p-8 text-gray-500">
                    <p>Funcionalidades de Workflow serão implementadas em breve</p>
                    <p className="text-sm">Análise de fluxos N8N em desenvolvimento</p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="workflows" className="space-y-4 mt-0 bg-white text-gray-900">
                <div className="space-y-4">
                  <div className="text-center p-8 text-gray-500">
                    <p>Funcionalidades de Workflow N8N serão implementadas em breve</p>
                    <p className="text-sm">Automações e triggers em desenvolvimento</p>
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>

        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-sm text-gray-500">
            {isLoading && (
              <span className="text-blue-600">Carregando dados da persona...</span>
            )}
            {error && (
              <span className="text-red-600">Erro ao carregar dados</span>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}