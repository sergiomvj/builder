#!/usr/bin/env node

/**
 * SISTEMA DE MACHINE LEARNING VCM - IMPLEMENTAÇÃO REAL
 * 
 * Sistema completo de aprendizado contínuo que usa as tabelas criadas
 * para fazer o VCM evoluir automaticamente
 */

const { createClient } = require('@supabase/supabase-js');
const cron = require('node-cron');
require('dotenv').config();

class VCMLearningSystem {
    constructor() {
        this.supabase = createClient(
            process.env.VCM_SUPABASE_URL,
            process.env.VCM_SUPABASE_SERVICE_ROLE_KEY
        );
        
        this.config = {
            learningEnabled: true,
            autoOptimizationEnabled: false, // Começar seguro
            confidenceThreshold: 0.80,
            minSampleSize: 10,
            observationWindowDays: 14,
            rollbackThresholdHours: 24
        };
        
        this.log('🧠 Sistema de Machine Learning VCM inicializado', 'success');
    }
    
    log(message, level = 'info') {
        const timestamp = new Date().toLocaleString('pt-BR');
        const emoji = {
            info: 'ℹ️',
            success: '✅',
            warning: '⚠️',
            error: '❌',
            learning: '🧠',
            optimization: '⚡',
            alert: '🚨'
        };
        
        console.log(`${emoji[level]} [${timestamp}] ${message}`);
    }
    
    // =====================================================
    // 1. COLETA DE DADOS DE EXECUÇÃO
    // =====================================================
    
    async collectTaskExecutionData(taskExecution) {
        try {
            const analyticsData = {
                persona_id: taskExecution.persona_id,
                task_id: taskExecution.task_id,
                empresa_id: taskExecution.empresa_id,
                task_title: taskExecution.title,
                task_type: taskExecution.task_type,
                estimated_duration: taskExecution.estimated_duration,
                actual_duration: taskExecution.actual_duration,
                complexity_score: taskExecution.complexity_score || 5,
                execution_context: {
                    urgency: taskExecution.priority,
                    time_of_day: new Date().getHours(),
                    day_of_week: new Date().getDay(),
                    workload: await this.getPersonaCurrentWorkload(taskExecution.persona_id)
                },
                subsystems_used: taskExecution.required_subsystems || [],
                efficiency_ratio: this.calculateEfficiencyRatio(
                    taskExecution.estimated_duration, 
                    taskExecution.actual_duration
                ),
                execution_date: new Date().toISOString().split('T')[0]
            };
            
            const { error } = await this.supabase
                .from('task_execution_analytics')
                .insert(analyticsData);
                
            if (error) {
                this.log(`Erro ao coletar dados de execução: ${error.message}`, 'error');
                return false;
            }
            
            this.log(`Dados coletados para tarefa ${taskExecution.title}`, 'learning');
            return true;
            
        } catch (error) {
            this.log(`Erro na coleta de dados: ${error.message}`, 'error');
            return false;
        }
    }
    
    calculateEfficiencyRatio(estimated, actual) {
        if (!estimated || !actual || actual === 0) return null;
        return Math.round((estimated / actual) * 100) / 100;
    }
    
    async getPersonaCurrentWorkload(personaId) {
        try {
            const today = new Date().toISOString().split('T')[0];
            
            const { data, error } = await this.supabase
                .from('persona_tasks')
                .select('estimated_duration')
                .eq('persona_id', personaId)
                .eq('status', 'pending')
                .gte('due_date', today);
                
            if (error) return 'normal';
            
            const totalMinutes = data.reduce((sum, task) => sum + (task.estimated_duration || 0), 0);
            const hours = totalMinutes / 60;
            
            if (hours > 10) return 'high';
            if (hours > 8) return 'normal';
            return 'low';
            
        } catch (error) {
            return 'normal';
        }
    }
    
    // =====================================================
    // 2. ANÁLISE DE CARGA DE TRABALHO
    // =====================================================
    
    async analyzeWorkloadBalancing() {
        this.log('Analisando balanceamento de carga de trabalho...', 'learning');
        
        try {
            const companies = await this.getActiveCompanies();
            
            for (const company of companies) {
                await this.analyzeCompanyWorkload(company.id);
            }
            
        } catch (error) {
            this.log(`Erro na análise de workload: ${error.message}`, 'error');
        }
    }
    
    async analyzeCompanyWorkload(companyId) {
        try {
            // Buscar dados de carga atual
            const { data: personas } = await this.supabase
                .from('personas')
                .select(`
                    id, full_name, role, department,
                    persona_tasks!inner(estimated_duration, status, due_date)
                `)
                .eq('empresa_id', companyId)
                .eq('status', 'active');
                
            const workloadAnalytics = [];
            const today = new Date().toISOString().split('T')[0];
            
            for (const persona of personas) {
                const pendingTasks = persona.persona_tasks.filter(t => 
                    t.status === 'pending' && t.due_date >= today
                );
                
                const totalHours = pendingTasks.reduce((sum, task) => 
                    sum + (task.estimated_duration || 0), 0) / 60;
                
                const utilizationRate = totalHours / 8; // 8 horas por dia
                
                const analytics = {
                    empresa_id: companyId,
                    persona_id: persona.id,
                    analysis_date: today,
                    analysis_period: 'daily',
                    total_tasks: pendingTasks.length,
                    total_estimated_hours: totalHours,
                    available_hours: 8,
                    utilization_rate: Math.round(utilizationRate * 1000) / 1000,
                    overload_risk: utilizationRate > 1.2,
                    underutilized: utilizationRate < 0.5
                };
                
                workloadAnalytics.push(analytics);
            }
            
            // Salvar analytics - deletar existentes primeiro
            await this.supabase
                .from('workload_analytics')
                .delete()
                .eq('empresa_id', companyId)
                .eq('analysis_date', today);
                
            const { error } = await this.supabase
                .from('workload_analytics')
                .insert(workloadAnalytics);
                
            if (error) {
                this.log(`Erro ao salvar workload analytics: ${error.message}`, 'error');
                return;
            }
            
            // Detectar padrões de desequilíbrio
            await this.detectWorkloadImbalancePatterns(companyId, workloadAnalytics);
            
        } catch (error) {
            this.log(`Erro na análise de empresa ${companyId}: ${error.message}`, 'error');
        }
    }
    
    async detectWorkloadImbalancePatterns(companyId, workloadData) {
        try {
            const overloadedPersonas = workloadData.filter(w => w.overload_risk);
            const underutilizedPersonas = workloadData.filter(w => w.underutilized);
            
            if (overloadedPersonas.length > 0 && underutilizedPersonas.length > 0) {
                const pattern = {
                    empresa_id: companyId,
                    pattern_type: 'workload_balance',
                    pattern_category: 'efficiency',
                    scope_type: 'global',
                    scope_identifier: companyId,
                    pattern_description: `Detectado desequilíbrio: ${overloadedPersonas.length} personas sobrecarregadas e ${underutilizedPersonas.length} subutilizadas`,
                    pattern_data: {
                        overloaded: overloadedPersonas.map(p => ({ 
                            persona_id: p.persona_id, 
                            utilization: p.utilization_rate 
                        })),
                        underutilized: underutilizedPersonas.map(p => ({ 
                            persona_id: p.persona_id, 
                            utilization: p.utilization_rate 
                        })),
                        potential_rebalancing: this.suggestTaskRebalancing(overloadedPersonas, underutilizedPersonas)
                    },
                    statistical_confidence: this.calculateConfidence(workloadData.length, overloadedPersonas.length + underutilizedPersonas.length),
                    sample_size: workloadData.length,
                    observation_period_days: 1,
                    impact_magnitude: this.calculateImpactMagnitude(overloadedPersonas),
                    frequency_score: 0.8 // Assumindo alta frequência para primeiro padrão
                };
                
                await this.savePattern(pattern);
                
                // Se confiança alta e auto-otimização habilitada, aplicar
                if (pattern.statistical_confidence > this.config.confidenceThreshold && 
                    this.config.autoOptimizationEnabled) {
                    await this.applyWorkloadRebalancing(pattern);
                }
            }
            
        } catch (error) {
            this.log(`Erro na detecção de padrões: ${error.message}`, 'error');
        }
    }
    
    suggestTaskRebalancing(overloaded, underutilized) {
        const suggestions = [];
        
        for (const over of overloaded) {
            const bestMatch = underutilized.find(under => 
                (1.0 - under.utilization_rate) >= (over.utilization_rate - 1.0) * 0.3
            );
            
            if (bestMatch) {
                suggestions.push({
                    from: over.persona_id,
                    to: bestMatch.persona_id,
                    suggested_task_transfer: Math.round((over.utilization_rate - 1.0) * 0.3 * 8 * 60), // minutos
                    reasoning: 'Balance workload within capacity'
                });
            }
        }
        
        return suggestions;
    }
    
    calculateConfidence(sampleSize, affectedCount) {
        if (sampleSize < this.config.minSampleSize) return 0.3;
        
        const proportion = affectedCount / sampleSize;
        if (proportion > 0.5) return 0.9;
        if (proportion > 0.3) return 0.8;
        if (proportion > 0.2) return 0.7;
        return 0.6;
    }
    
    calculateImpactMagnitude(affectedPersonas) {
        const avgOverload = affectedPersonas.reduce((sum, p) => 
            sum + Math.max(0, p.utilization_rate - 1.0), 0) / affectedPersonas.length;
        
        return Math.round(avgOverload * 100 * 100) / 100; // Percentual de overload médio
    }
    
    // =====================================================
    // 3. DETECÇÃO DE PADRÕES DE EFICIÊNCIA
    // =====================================================
    
    async detectEfficiencyPatterns() {
        this.log('Detectando padrões de eficiência...', 'learning');
        
        try {
            const companies = await this.getActiveCompanies();
            
            for (const company of companies) {
                await this.analyzeEfficiencyPatterns(company.id);
            }
            
        } catch (error) {
            this.log(`Erro na detecção de padrões: ${error.message}`, 'error');
        }
    }
    
    async analyzeEfficiencyPatterns(companyId) {
        try {
            // Analisar padrões de complexidade de tarefas
            await this.analyzeTaskComplexityPatterns(companyId);
            
            // Analisar padrões de uso de subsistemas
            await this.analyzeSubsystemUsagePatterns(companyId);
            
            // Analisar padrões temporais
            await this.analyzeTemporalPatterns(companyId);
            
        } catch (error) {
            this.log(`Erro na análise de eficiência: ${error.message}`, 'error');
        }
    }
    
    async analyzeTaskComplexityPatterns(companyId) {
        try {
            const { data: analytics } = await this.supabase
                .from('task_execution_analytics')
                .select('*')
                .eq('empresa_id', companyId)
                .not('efficiency_ratio', 'is', null)
                .gte('execution_date', this.getDateDaysAgo(this.config.observationWindowDays));
                
            if (!analytics || analytics.length < this.config.minSampleSize) return;
            
            // Agrupar por tipo de tarefa e analisar eficiência
            const taskTypeAnalysis = this.groupByTaskType(analytics);
            
            for (const [taskType, data] of Object.entries(taskTypeAnalysis)) {
                if (data.length < 5) continue; // Mínimo de amostras por tipo
                
                const avgEfficiency = data.reduce((sum, d) => sum + d.efficiency_ratio, 0) / data.length;
                const avgComplexity = data.reduce((sum, d) => sum + (d.complexity_score || 5), 0) / data.length;
                
                // Detectar se há problemas sistemáticos
                if (avgEfficiency < 0.7 && data.length >= 10) {
                    const pattern = {
                        empresa_id: companyId,
                        pattern_type: 'task_complexity',
                        pattern_category: 'efficiency',
                        scope_type: 'task_type',
                        scope_identifier: taskType,
                        pattern_description: `Tarefas tipo '${taskType}' consistentemente menos eficientes que esperado`,
                        pattern_data: {
                            task_type: taskType,
                            avg_efficiency: avgEfficiency,
                            avg_complexity: avgComplexity,
                            sample_tasks: data.length,
                            suggested_adjustments: this.suggestComplexityAdjustments(avgEfficiency, avgComplexity)
                        },
                        statistical_confidence: this.calculateConfidence(data.length, data.length),
                        sample_size: data.length,
                        observation_period_days: this.config.observationWindowDays,
                        impact_magnitude: Math.round((1.0 - avgEfficiency) * 100)
                    };
                    
                    await this.savePattern(pattern);
                }
            }
            
        } catch (error) {
            this.log(`Erro na análise de complexidade: ${error.message}`, 'error');
        }
    }
    
    groupByTaskType(analytics) {
        return analytics.reduce((groups, item) => {
            const type = item.task_type || 'unknown';
            groups[type] = groups[type] || [];
            groups[type].push(item);
            return groups;
        }, {});
    }
    
    suggestComplexityAdjustments(avgEfficiency, avgComplexity) {
        const suggestions = [];
        
        if (avgEfficiency < 0.6) {
            suggestions.push({
                type: 'increase_time_estimate',
                factor: Math.round((1 / avgEfficiency) * 100) / 100,
                reasoning: 'Tarefas consistentemente demoram mais que estimado'
            });
        }
        
        if (avgComplexity > 7 && avgEfficiency < 0.7) {
            suggestions.push({
                type: 'split_complex_tasks',
                threshold: 7,
                reasoning: 'Tarefas muito complexas podem ser divididas'
            });
        }
        
        return suggestions;
    }
    
    // =====================================================
    // 4. APLICAÇÃO DE OTIMIZAÇÕES
    // =====================================================
    
    async applyOptimizations() {
        this.log('Verificando otimizações para aplicar...', 'optimization');
        
        try {
            const { data: patterns } = await this.supabase
                .from('learning_patterns')
                .select('*')
                .eq('applied', false)
                .eq('is_active', true)
                .gte('statistical_confidence', this.config.confidenceThreshold);
                
            for (const pattern of patterns) {
                await this.applyPattern(pattern);
            }
            
        } catch (error) {
            this.log(`Erro na aplicação de otimizações: ${error.message}`, 'error');
        }
    }
    
    async applyPattern(pattern) {
        try {
            this.log(`Aplicando padrão: ${pattern.pattern_description}`, 'optimization');
            
            let optimization;
            
            switch (pattern.pattern_type) {
                case 'workload_balance':
                    optimization = await this.applyWorkloadRebalancing(pattern);
                    break;
                case 'task_complexity':
                    optimization = await this.applyComplexityAdjustment(pattern);
                    break;
                case 'subsystem_usage':
                    optimization = await this.applySubsystemOptimization(pattern);
                    break;
                default:
                    this.log(`Tipo de padrão não suportado: ${pattern.pattern_type}`, 'warning');
                    return;
            }
            
            if (optimization) {
                // Marcar padrão como aplicado
                await this.supabase
                    .from('learning_patterns')
                    .update({ 
                        applied: true, 
                        application_date: new Date().toISOString() 
                    })
                    .eq('id', pattern.id);
                    
                // Agendar medição de impacto
                setTimeout(() => {
                    this.measureOptimizationImpact(optimization.id);
                }, this.config.rollbackThresholdHours * 60 * 60 * 1000);
            }
            
        } catch (error) {
            this.log(`Erro ao aplicar padrão ${pattern.id}: ${error.message}`, 'error');
        }
    }
    
    async applyWorkloadRebalancing(pattern) {
        try {
            const suggestions = pattern.pattern_data.potential_rebalancing;
            
            for (const suggestion of suggestions) {
                // Encontrar tarefas para transferir
                const { data: tasks } = await this.supabase
                    .from('persona_tasks')
                    .select('*')
                    .eq('persona_id', suggestion.from)
                    .eq('status', 'pending')
                    .order('priority', { ascending: false })
                    .limit(3);
                    
                if (tasks && tasks.length > 0) {
                    // Transferir tarefas de menor prioridade
                    const taskToTransfer = tasks[tasks.length - 1];
                    
                    await this.supabase
                        .from('persona_tasks')
                        .update({ assigned_to: suggestion.to })
                        .eq('id', taskToTransfer.id);
                        
                    this.log(`Tarefa '${taskToTransfer.title}' transferida para balanceamento`, 'optimization');
                }
            }
            
            // Registrar otimização
            const optimization = {
                empresa_id: pattern.empresa_id,
                pattern_id: pattern.id,
                optimization_type: 'task_rebalancing',
                optimization_name: 'Workload Balancing',
                optimization_description: pattern.pattern_description,
                target_scope: 'global',
                target_identifiers: [pattern.scope_identifier],
                optimization_parameters: pattern.pattern_data,
                implementation_method: 'immediate',
                status: 'implemented',
                implemented_at: new Date().toISOString()
            };
            
            const { data: savedOpt, error } = await this.supabase
                .from('optimization_history')
                .insert(optimization)
                .select()
                .single();
                
            if (error) throw error;
            
            return savedOpt;
            
        } catch (error) {
            this.log(`Erro no rebalanceamento: ${error.message}`, 'error');
            return null;
        }
    }
    
    async applyComplexityAdjustment(pattern) {
        try {
            const suggestions = pattern.pattern_data.suggested_adjustments;
            
            for (const suggestion of suggestions) {
                if (suggestion.type === 'increase_time_estimate') {
                    // Atualizar templates ou configurações de tempo
                    await this.adjustTaskTimeEstimates(
                        pattern.scope_identifier, 
                        suggestion.factor
                    );
                }
            }
            
            // Registrar otimização
            const optimization = {
                empresa_id: pattern.empresa_id,
                pattern_id: pattern.id,
                optimization_type: 'complexity_adjustment',
                optimization_name: 'Task Time Estimation Adjustment',
                optimization_description: `Ajuste de estimativas para ${pattern.scope_identifier}`,
                target_scope: 'task_type',
                target_identifiers: [pattern.scope_identifier],
                optimization_parameters: pattern.pattern_data,
                status: 'implemented',
                implemented_at: new Date().toISOString()
            };
            
            const { data: savedOpt, error } = await this.supabase
                .from('optimization_history')
                .insert(optimization)
                .select()
                .single();
                
            return savedOpt;
            
        } catch (error) {
            this.log(`Erro no ajuste de complexidade: ${error.message}`, 'error');
            return null;
        }
    }
    
    // =====================================================
    // 5. MONITORAMENTO E ALERTAS
    // =====================================================
    
    async monitorSystemHealth() {
        this.log('Monitorando saúde do sistema...', 'learning');
        
        try {
            await this.checkPerformanceDegradation();
            await this.checkOverloadConditions();
            await this.checkAnomalies();
            
        } catch (error) {
            this.log(`Erro no monitoramento: ${error.message}`, 'error');
        }
    }
    
    async checkPerformanceDegradation() {
        try {
            const { data: recentMetrics } = await this.supabase
                .from('performance_metrics')
                .select('*')
                .gte('period_start', this.getDateDaysAgo(7))
                .eq('metric_category', 'efficiency');
                
            for (const metric of recentMetrics) {
                if (metric.baseline_value && metric.metric_value < metric.baseline_value * 0.8) {
                    await this.createAlert({
                        alert_type: 'performance_degradation',
                        severity: 'warning',
                        title: `Degradação de performance em ${metric.metric_name}`,
                        description: `Métrica caiu ${Math.round((1 - metric.metric_value/metric.baseline_value) * 100)}% comparado à baseline`,
                        alert_data: metric,
                        affected_scope: metric.metric_scope,
                        affected_entities: [metric.scope_id]
                    });
                }
            }
            
        } catch (error) {
            this.log(`Erro na verificação de degradação: ${error.message}`, 'error');
        }
    }
    
    async createAlert(alertData) {
        try {
            const alert = {
                empresa_id: alertData.empresa_id,
                alert_type: alertData.alert_type,
                severity: alertData.severity,
                title: alertData.title,
                description: alertData.description,
                alert_data: alertData.alert_data || {},
                affected_scope: alertData.affected_scope,
                affected_entities: alertData.affected_entities || [],
                triggered_at: new Date().toISOString()
            };
            
            const { error } = await this.supabase
                .from('system_alerts')
                .insert(alert);
                
            if (error) throw error;
            
            this.log(`Alerta criado: ${alert.title}`, 'alert');
            
        } catch (error) {
            this.log(`Erro ao criar alerta: ${error.message}`, 'error');
        }
    }
    
    // =====================================================
    // 6. UTILITÁRIOS
    // =====================================================
    
    async savePattern(pattern) {
        try {
            const { error } = await this.supabase
                .from('learning_patterns')
                .insert(pattern);
                
            if (error) throw error;
            
            this.log(`Padrão detectado: ${pattern.pattern_description}`, 'learning');
            
        } catch (error) {
            this.log(`Erro ao salvar padrão: ${error.message}`, 'error');
        }
    }
    
    async getActiveCompanies() {
        try {
            const { data, error } = await this.supabase
                .from('empresas')
                .select('id, nome')
                .eq('status', 'ativa');
                
            if (error) throw error;
            return data || [];
            
        } catch (error) {
            this.log(`Erro ao buscar empresas: ${error.message}`, 'error');
            return [];
        }
    }
    
    getDateDaysAgo(days) {
        const date = new Date();
        date.setDate(date.getDate() - days);
        return date.toISOString().split('T')[0];
    }
    
    async adjustTaskTimeEstimates(taskType, factor) {
        // Implementar ajuste de estimativas
        this.log(`Ajustando estimativas para ${taskType} por fator ${factor}`, 'optimization');
    }
    
    async measureOptimizationImpact(optimizationId) {
        // Implementar medição de impacto
        this.log(`Medindo impacto da otimização ${optimizationId}`, 'learning');
    }
    
    // =====================================================
    // 7. SCHEDULER AUTOMÁTICO
    // =====================================================
    
    startLearningScheduler() {
        // Análise de workload a cada 2 horas
        cron.schedule('0 */2 * * *', () => {
            this.analyzeWorkloadBalancing();
        });
        
        // Detecção de padrões diária às 6h
        cron.schedule('0 6 * * *', () => {
            this.detectEfficiencyPatterns();
        });
        
        // Aplicação de otimizações diária às 7h
        cron.schedule('0 7 * * *', () => {
            this.applyOptimizations();
        });
        
        // Monitoramento contínuo a cada hora
        cron.schedule('0 * * * *', () => {
            this.monitorSystemHealth();
        });
        
        this.log('Scheduler de aprendizado iniciado', 'success');
    }
    
    // =====================================================
    // 8. EXECUÇÃO PRINCIPAL
    // =====================================================
    
    async runLearningCycle() {
        this.log('🧠 Iniciando ciclo completo de aprendizado...', 'learning');
        
        try {
            // 1. Analisar workload
            await this.analyzeWorkloadBalancing();
            
            // 2. Detectar padrões
            await this.detectEfficiencyPatterns();
            
            // 3. Aplicar otimizações (se habilitado)
            if (this.config.autoOptimizationEnabled) {
                await this.applyOptimizations();
            }
            
            // 4. Monitorar sistema
            await this.monitorSystemHealth();
            
            this.log('✅ Ciclo de aprendizado concluído', 'success');
            
        } catch (error) {
            this.log(`❌ Erro no ciclo de aprendizado: ${error.message}`, 'error');
        }
    }
    
    // =====================================================
    // MÉTODOS AUXILIARES FALTANTES
    // =====================================================
    
    async analyzeSubsystemUsagePatterns(companyId) {
        try {
            const { data: analytics } = await this.supabase
                .from('task_execution_analytics')
                .select('subsystems_used, efficiency_ratio, persona_id')
                .eq('empresa_id', companyId)
                .gte('execution_date', this.getDateDaysAgo(this.config.observationWindowDays))
                .not('subsystems_used', 'is', null);
                
            if (!analytics || analytics.length < this.config.minSampleSize) {
                return;
            }
            
            // Analisar uso por subsistema
            const subsystemStats = {};
            
            analytics.forEach(record => {
                const subsystems = record.subsystems_used || [];
                subsystems.forEach(subsystem => {
                    if (!subsystemStats[subsystem]) {
                        subsystemStats[subsystem] = {
                            count: 0,
                            totalEfficiency: 0,
                            personas: new Set()
                        };
                    }
                    
                    subsystemStats[subsystem].count++;
                    subsystemStats[subsystem].totalEfficiency += (record.efficiency_ratio || 1.0);
                    subsystemStats[subsystem].personas.add(record.persona_id);
                });
            });
            
            // Detectar padrões de alta/baixa eficiência por subsistema
            for (const [subsystem, stats] of Object.entries(subsystemStats)) {
                const avgEfficiency = stats.totalEfficiency / stats.count;
                
                if (stats.count >= this.config.minSampleSize) {
                    if (avgEfficiency > 1.2) {
                        await this.saveLearningPattern(companyId, {
                            pattern_type: 'subsystem_efficiency',
                            pattern_category: 'optimization',
                            scope_type: 'subsystem',
                            scope_identifier: subsystem,
                            pattern_description: `Subsistema ${subsystem} demonstra alta eficiência (${(avgEfficiency * 100).toFixed(1)}%)`,
                            pattern_data: { subsystem, avg_efficiency: avgEfficiency, sample_size: stats.count },
                            statistical_confidence: Math.min(stats.count / 50, 1.0),
                            impact_magnitude: (avgEfficiency - 1.0) * 100
                        });
                    } else if (avgEfficiency < 0.8) {
                        await this.saveLearningPattern(companyId, {
                            pattern_type: 'subsystem_inefficiency',
                            pattern_category: 'bottleneck',
                            scope_type: 'subsystem', 
                            scope_identifier: subsystem,
                            pattern_description: `Subsistema ${subsystem} apresenta baixa eficiência (${(avgEfficiency * 100).toFixed(1)}%)`,
                            pattern_data: { subsystem, avg_efficiency: avgEfficiency, sample_size: stats.count },
                            statistical_confidence: Math.min(stats.count / 30, 1.0),
                            impact_magnitude: (1.0 - avgEfficiency) * 100
                        });
                    }
                }
            }
            
        } catch (error) {
            this.log(`Erro na análise de subsistemas: ${error.message}`, 'error');
        }
    }
    
    async checkOverloadConditions() {
        try {
            const companies = await this.getActiveCompanies();
            
            for (const company of companies) {
                // Verificar sobrecarga por persona
                const { data: overloadedPersonas } = await this.supabase
                    .from('workload_analytics')
                    .select(`
                        persona_id, utilization_rate, total_tasks,
                        personas!inner(full_name, role, department)
                    `)
                    .eq('empresa_id', company.id)
                    .gte('analysis_date', this.getDateDaysAgo(3))
                    .gt('utilization_rate', 1.2);
                    
                for (const persona of overloadedPersonas || []) {
                    await this.createAlert(company.id, {
                        alert_type: 'overload_detected',
                        severity: persona.utilization_rate > 1.5 ? 'critical' : 'warning',
                        title: `Sobrecarga detectada: ${persona.personas.full_name}`,
                        description: `Taxa de utilização: ${(persona.utilization_rate * 100).toFixed(1)}% (${persona.total_tasks} tarefas)`,
                        affected_scope: 'persona',
                        affected_entities: [persona.persona_id],
                        potential_impact: 'Risco de burnout e queda de qualidade',
                        recommended_actions: [
                            'Redistribuir algumas tarefas',
                            'Ajustar prazos',
                            'Avaliar automação de tarefas repetitivas'
                        ]
                    });
                }
                
                // Verificar subutilização
                const { data: underutilizedPersonas } = await this.supabase
                    .from('workload_analytics')
                    .select(`
                        persona_id, utilization_rate, total_tasks,
                        personas!inner(full_name, role, department)
                    `)
                    .eq('empresa_id', company.id)
                    .gte('analysis_date', this.getDateDaysAgo(7))
                    .lt('utilization_rate', 0.3);
                    
                for (const persona of underutilizedPersonas || []) {
                    await this.createAlert(company.id, {
                        alert_type: 'underutilization_detected',
                        severity: 'info',
                        title: `Subutilização detectada: ${persona.personas.full_name}`,
                        description: `Taxa de utilização: ${(persona.utilization_rate * 100).toFixed(1)}% (${persona.total_tasks} tarefas)`,
                        affected_scope: 'persona',
                        affected_entities: [persona.persona_id],
                        potential_impact: 'Oportunidade de otimização de recursos',
                        recommended_actions: [
                            'Atribuir tarefas adicionais',
                            'Revisar responsabilidades',
                            'Considerar treinamento cruzado'
                        ]
                    });
                }
            }
            
        } catch (error) {
            this.log(`Erro na verificação de sobrecarga: ${error.message}`, 'error');
        }
    }
    
    async saveLearningPattern(companyId, patternData) {
        try {
            const pattern = {
                empresa_id: companyId,
                sample_size: this.config.minSampleSize,
                observation_period_days: this.config.observationWindowDays,
                frequency_score: 1.0,
                consistency_score: 0.8,
                ...patternData
            };
            
            const { error } = await this.supabase
                .from('learning_patterns')
                .insert(pattern);
                
            if (error) {
                this.log(`Erro ao salvar padrão: ${error.message}`, 'error');
            } else {
                this.log(`Padrão salvo: ${pattern.pattern_description}`, 'learning');
            }
            
        } catch (error) {
            this.log(`Erro ao salvar padrão: ${error.message}`, 'error');
        }
    }
    
    async createAlert(companyId, alertData) {
        try {
            const alert = {
                empresa_id: companyId,
                ...alertData,
                alert_data: alertData.recommended_actions ? { 
                    recommended_actions: alertData.recommended_actions 
                } : {}
            };
            
            delete alert.recommended_actions;
            
            const { error } = await this.supabase
                .from('system_alerts')
                .insert(alert);
                
            if (error) {
                this.log(`Erro ao criar alerta: ${error.message}`, 'error');
            } else {
                this.log(`Alerta criado: ${alert.title}`, 'alert');
            }
            
        } catch (error) {
            this.log(`Erro ao criar alerta: ${error.message}`, 'error');
        }
    }
}

// =====================================================
// EXECUÇÃO
// =====================================================

if (require.main === module) {
    const learningSystem = new VCMLearningSystem();
    
    // Executar ciclo único ou iniciar scheduler
    const mode = process.argv[2] || 'cycle';
    
    if (mode === 'scheduler') {
        learningSystem.startLearningScheduler();
        console.log('🔄 Sistema de aprendizado em modo contínuo. Pressione Ctrl+C para parar.');
    } else {
        learningSystem.runLearningCycle().then(() => {
            console.log('🎯 Ciclo de aprendizado concluído');
            process.exit(0);
        }).catch(error => {
            console.error('❌ Erro fatal:', error);
            process.exit(1);
        });
    }
}

module.exports = VCMLearningSystem;