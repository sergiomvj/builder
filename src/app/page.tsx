'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Rocket, Sparkles, ArrowRight, BrainCircuit } from 'lucide-react';
import { toast } from 'sonner';

export default function IdeationPage() {
  const router = useRouter();
  const [idea, setIdea] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const [loadingStep, setLoadingStep] = useState(0);
  const loadingMessages = [
    "Conectando com Consultores Especialistas...",
    "Analisando Viabilidade de Mercado (VCM Score)...",
    "Desenhando Arquitetura de Sistemas...",
    "Definindo Roadmap Estratégico...",
    "Gerando Backlog e Prioridades...",
    "Finalizando Plano de Execução..."
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isAnalyzing) {
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev + 1) % loadingMessages.length);
      }, 3500);
    } else {
      setLoadingStep(0);
    }
    return () => clearInterval(interval);
  }, [isAnalyzing]);

  const handleAnalyze = async () => {
    if (!idea.trim()) {
      toast.error('Please describe your idea first');
      return;
    }

    setIsAnalyzing(true);
    try {
      // Try v3 prompt first
      const systemPrompt = localStorage.getItem('vcm_prompt_idea_v3');
      
      const response = await fetch('/api/analyze-idea', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idea, systemPrompt }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze idea');
      }

      toast.success('Idea captured! Redirecting to project dashboard...');
      
      // If using Mock Mode, persist the analysis to LocalStorage so the next page can read it
      if (data.projectId && data.projectId.startsWith('mock-project-')) {
        console.log('Mock Project detected, saving analysis to LocalStorage:', data.analysis);
        localStorage.setItem(`mock_analysis_${data.projectId}`, JSON.stringify(data.analysis));
      }

      router.push(`/projects/${data.projectId}`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to process idea');
      setIsAnalyzing(false); // Only stop analyzing on error, otherwise keep showing loading until redirect
    }
  };

  return (
    <div className="container mx-auto max-w-4xl py-12 px-4 relative">
      
      {/* Loading Overlay */}
      {isAnalyzing && (
        <div className="fixed inset-0 bg-white/90 backdrop-blur-md z-50 flex flex-col items-center justify-center p-4">
          <div className="max-w-md w-full text-center space-y-8">
            <div className="relative w-24 h-24 mx-auto">
              <div className="absolute inset-0 border-t-4 border-blue-600 border-solid rounded-full animate-spin"></div>
              <div className="absolute inset-4 border-t-4 border-purple-500 border-solid rounded-full animate-spin reverse"></div>
              <BrainCircuit className="absolute inset-0 m-auto h-8 w-8 text-slate-400 animate-pulse" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-slate-800 animate-fade-in">
                {loadingMessages[loadingStep]}
              </h3>
              <p className="text-slate-500">Isso pode levar cerca de 30-60 segundos para uma análise profunda.</p>
            </div>

            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-full transition-all duration-500 ease-out"
                style={{ width: `${Math.min(((loadingStep + 1) / loadingMessages.length) * 100, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <div className="text-center mb-16 space-y-4">
        <div className="inline-flex items-center justify-center p-2 bg-blue-50 rounded-full mb-4">
          <Sparkles className="h-5 w-5 text-blue-600 mr-2" />
          <span className="text-sm font-medium text-blue-700">AI-Powered Enterprise Builder</span>
        </div>
        <h1 className="text-5xl font-extrabold tracking-tight text-slate-900 mb-6">
          From Idea to <span className="text-blue-600">Enterprise</span> in Minutes
        </h1>
        <p className="text-xl text-slate-600 max-w-2xl mx-auto">
          Describe your business concept and let our autonomous agents build the foundation, 
          hire the virtual team, and automate the workflows.
        </p>
      </div>

      {/* Input Section */}
      <Card className="border-2 border-blue-100 shadow-xl bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BrainCircuit className="h-6 w-6 text-blue-600" />
            Start with an Idea
          </CardTitle>
          <CardDescription>
            Be as specific or vague as you want. The AI will ask clarifying questions if needed.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Textarea 
            placeholder="e.g., A subscription service for organic dog food tailored to specific breeds, with a mobile app for tracking health metrics..."
            className="min-h-[200px] text-lg p-6 resize-none focus-visible:ring-blue-500"
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
          />
          
          <div className="flex justify-end items-center gap-4">
            <span className="text-sm text-slate-500 italic">
              {idea.length > 0 ? `${idea.length} characters` : 'Ready to start?'}
            </span>
            <Button 
              size="lg" 
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 h-12 text-lg shadow-lg shadow-blue-200 transition-all hover:scale-105"
              onClick={handleAnalyze}
              disabled={isAnalyzing}
            >
              {isAnalyzing ? (
                <>Analyzing <span className="animate-pulse ml-1">...</span></>
              ) : (
                <>Launch Builder <Rocket className="ml-2 h-5 w-5" /></>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Features Grid (Mock) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20">
        {[
          { title: 'Strategic Foundation', desc: 'Mission, Vision, OKRs generated automatically.' },
          { title: 'Virtual Dream Team', desc: '5 C-Level AI Agents hired to execute the vision.' },
          { title: 'Automated Operations', desc: 'N8N workflows deployed for marketing & sales.' }
        ].map((feature, i) => (
          <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <div className="h-10 w-10 bg-slate-100 rounded-lg mb-4 flex items-center justify-center text-slate-600 font-bold">
              {i + 1}
            </div>
            <h3 className="font-bold text-lg mb-2">{feature.title}</h3>
            <p className="text-slate-600">{feature.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
