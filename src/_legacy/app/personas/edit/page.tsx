'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

function EditPersonaForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    id: searchParams.get('id') || '',
    full_name: searchParams.get('nome') || '',
    role: searchParams.get('cargo') || '',
    department: searchParams.get('departamento') || '',
    specialty: searchParams.get('especialidade') || '',
    email: searchParams.get('email') || '',
    whatsapp: searchParams.get('whatsapp') || '',
    status: searchParams.get('status') || 'active',
    biografia_completa: '',
    system_prompt: '',
    temperatura_ia: 0.7,
    max_tokens: 2000
  });

  useEffect(() => {
    if (formData.id) {
      loadPersonaData();
    }
  }, [formData.id]);

  const loadPersonaData = async () => {
    try {
      setLoading(true);
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      const { data, error } = await supabase
        .from('personas')
        .select('*')
        .eq('id', formData.id)
        .single();

      if (error) throw error;

      if (data) {
        setFormData(prev => ({
          ...prev,
          ...data
        }));
      }
    } catch (error) {
      console.error('Erro ao carregar persona:', error);
      alert('Erro ao carregar dados da persona');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      const { error } = await supabase
        .from('personas')
        .update({
          full_name: formData.full_name,
          role: formData.role,
          department: formData.department,
          specialty: formData.specialty,
          email: formData.email,
          whatsapp: formData.whatsapp,
          status: formData.status,
          biografia_completa: formData.biografia_completa,
          system_prompt: formData.system_prompt,
          temperatura_ia: formData.temperatura_ia,
          max_tokens: formData.max_tokens,
          updated_at: new Date().toISOString()
        })
        .eq('id', formData.id);

      if (error) throw error;

      alert('✅ Persona atualizada com sucesso!');
      router.back();
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert('❌ Erro ao salvar persona');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Editar Persona</h1>
            <p className="text-gray-600">Atualize as informações da persona</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Informações Básicas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="full_name">Nome Completo *</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="Ex: Sarah Johnson"
                />
              </div>

              <div>
                <Label htmlFor="role">Cargo *</Label>
                <Input
                  id="role"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  placeholder="Ex: CEO"
                />
              </div>

              <div>
                <Label htmlFor="department">Departamento</Label>
                <Input
                  id="department"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  placeholder="Ex: Executivo"
                />
              </div>

              <div>
                <Label htmlFor="specialty">Especialidade</Label>
                <Input
                  id="specialty"
                  value={formData.specialty}
                  onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                  placeholder="Ex: Liderança"
                />
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Ex: sarah.johnson@empresa.com"
                />
              </div>

              <div>
                <Label htmlFor="whatsapp">WhatsApp</Label>
                <Input
                  id="whatsapp"
                  value={formData.whatsapp}
                  onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                  placeholder="Ex: +55 11 99999-9999"
                />
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full border rounded-md p-2"
                >
                  <option value="active">Ativa</option>
                  <option value="inactive">Inativa</option>
                </select>
              </div>
            </div>

            <div>
              <Label htmlFor="biografia_completa">Biografia Completa</Label>
              <Textarea
                id="biografia_completa"
                value={formData.biografia_completa}
                onChange={(e) => setFormData({ ...formData, biografia_completa: e.target.value })}
                placeholder="Digite a biografia da persona..."
                rows={6}
              />
            </div>

            <div>
              <Label htmlFor="system_prompt">System Prompt (IA)</Label>
              <Textarea
                id="system_prompt"
                value={formData.system_prompt || ''}
                onChange={(e) => setFormData({ ...formData, system_prompt: e.target.value })}
                placeholder="Prompt de sistema para configuração da IA..."
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="temperatura_ia">Temperatura IA</Label>
                <Input
                  id="temperatura_ia"
                  type="number"
                  step="0.1"
                  min="0"
                  max="2"
                  value={formData.temperatura_ia}
                  onChange={(e) => setFormData({ ...formData, temperatura_ia: parseFloat(e.target.value) })}
                />
              </div>

              <div>
                <Label htmlFor="max_tokens">Max Tokens</Label>
                <Input
                  id="max_tokens"
                  type="number"
                  value={formData.max_tokens}
                  onChange={(e) => setFormData({ ...formData, max_tokens: parseInt(e.target.value) })}
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button onClick={handleSave} disabled={saving} className="flex-1">
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Salvar Alterações
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={() => router.back()}>
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function EditPersonaPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
      <EditPersonaForm />
    </Suspense>
  );
}
