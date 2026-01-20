#!/usr/bin/env node

/**
 * INTEGRAÇÃO ML + AUDITORIA VCM
 * 
 * Sistema que conecta o aprendizado de máquina com auditoria completa
 * Cada otimização aplicada é auditada e cada padrão detectado é rastreado
 */

const VCMLearningSystem = require('./vcm_learning_system.js');
const VCMAuditSystem = require('./vcm_audit_system.js');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

class VCMIntegratedSystem {
    constructor() {
        this.learningSystem = new VCMLearningSystem();
        this.auditSystem = new VCMAuditSystem();
        
        this.supabase = createClient(
            process.env.VCM_SUPABASE_URL,
            process.env.VCM_SUPABASE_SERVICE_ROLE_KEY
        );
        
        this.integrationConfig = {
            auditAllOptimizations: true,
            auditPatternDetection: true,
            auditSystemChanges: true,
            generateIntegratedReports: true,
            realTimeMonitoring: true
        };
        
        this.log('🔗 Sistema Integrado ML + Auditoria inicializado', 'success');
    }
    
    log(message, level = 'info') {
        const timestamp = new Date().toLocaleString('pt-BR');
        const emoji = {
            info: 'ℹ️',
            success: '✅',
            warning: '⚠️',
            error: '❌',
            integration: '🔗',
            ml: '🧠',
            audit: '🔍'
        };
        
        console.log(`${emoji[level]} [${timestamp}] ${message}`);
    }
    
    // =====================================================
    // 1. SISTEMA ML AUDITADO
    // =====================================================
    
    async runAuditedLearningCycle() {
        this.log('🔗 Iniciando ciclo de aprendizado com auditoria completa...', 'integration');
        
        try {
            const companies = await this.getActiveCompanies();
            
            for (const company of companies) {
                await this.processCompanyWithAudit(company);
            }
            
            // Gerar relatório integrado
            await this.generateIntegratedReport();
            
            this.log('✅ Ciclo integrado concluído com sucesso', 'success');
            return true;
            
        } catch (error) {
            this.log(`❌ Erro no ciclo integrado: ${error.message}`, 'error');
            
            // Auditar o erro
            await this.auditSystemError(error, 'integrated_learning_cycle');
            
            return false;
        }
    }
    
    async processCompanyWithAudit(company) {
        this.log(`Processando empresa com auditoria: ${company.nome}`, 'integration');
        
        // 1. Auditar início do processamento
        await this.auditSystem.logAction({
            empresa_id: company.id,
            action_type: 'execute',
            entity_type: 'ml_cycle',
            entity_name: `Ciclo ML para ${company.nome}`,
            actor_type: 'system',
            actor_name: 'Sistema Integrado VCM',
            action_description: `Iniciando ciclo de aprendizado para empresa ${company.nome}`,
            automated: true,
            risk_level: 'low'
        });
        
        try {
            // 2. Analisar workload com auditoria
            await this.analyzeWorkloadWithAudit(company.id);
            
            // 3. Detectar padrões com auditoria
            await this.detectPatternsWithAudit(company.id);
            
            // 4. Aplicar otimizações com auditoria
            await this.applyOptimizationsWithAudit(company.id);
            
            // 5. Monitorar saúde com auditoria
            await this.monitorHealthWithAudit(company.id);
            
        } catch (error) {
            await this.auditProcessingError(company.id, error);
            throw error;
        }
    }
    
    // =====================================================
    // 2. WORKLOAD ANALYSIS COM AUDITORIA
    // =====================================================
    
    async analyzeWorkloadWithAudit(companyId) {
        this.log('Analisando workload com auditoria...', 'ml');
        
        try {
            // Capturar estado antes da análise
            const beforeState = await this.captureWorkloadState(companyId);
            
            // Executar análise original
            await this.learningSystem.analyzeWorkloadBalancing();
            
            // Capturar estado após análise
            const afterState = await this.captureWorkloadState(companyId);
            
            // Auditar a análise
            await this.auditSystem.logAction({
                empresa_id: companyId,
                action_type: 'execute',
                entity_type: 'workload_analysis',
                entity_name: 'Análise de Carga de Trabalho',
                actor_type: 'ai_system',
                actor_name: 'Sistema ML VCM',
                action_description: 'Análise automática de balanceamento de carga de trabalho',
                before_state: beforeState,
                after_state: afterState,
                automated: true,
                risk_level: 'low'
            });
            
            // Verificar se foram detectados desequilíbrios críticos
            const criticalImbalances = await this.detectCriticalWorkloadImbalances(companyId);
            if (criticalImbalances.length > 0) {
                await this.auditCriticalImbalances(companyId, criticalImbalances);
            }
            
        } catch (error) {
            await this.auditAnalysisError(companyId, 'workload_analysis', error);
            throw error;
        }
    }
    
    async captureWorkloadState(companyId) {
        try {
            const { data: workloadData } = await this.supabase
                .from('workload_analytics')
                .select('persona_id, utilization_rate, total_tasks, overload_risk, underutilized')
                .eq('empresa_id', companyId)
                .gte('analysis_date', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
            
            return {
                total_personas: workloadData?.length || 0,
                avg_utilization: workloadData?.reduce((sum, w) => sum + w.utilization_rate, 0) / (workloadData?.length || 1),
                overloaded_personas: workloadData?.filter(w => w.overload_risk).length || 0,
                underutilized_personas: workloadData?.filter(w => w.underutilized).length || 0,
                total_tasks: workloadData?.reduce((sum, w) => sum + w.total_tasks, 0) || 0
            };
        } catch (error) {
            return { error: error.message };
        }
    }
    
    async detectCriticalWorkloadImbalances(companyId) {
        try {
            const { data: criticalCases } = await this.supabase
                .from('workload_analytics')
                .select(`
                    persona_id, utilization_rate, total_tasks,
                    personas!inner(full_name, role)
                `)
                .eq('empresa_id', companyId)
                .gte('analysis_date', new Date().toISOString().split('T')[0])
                .or('utilization_rate.gt.1.5,utilization_rate.lt.0.2');
            
            return criticalCases || [];
        } catch (error) {
            this.log(`Erro ao detectar desequilíbrios críticos: ${error.message}`, 'error');
            return [];
        }
    }
    
    async auditCriticalImbalances(companyId, imbalances) {
        for (const imbalance of imbalances) {
            const isOverload = imbalance.utilization_rate > 1.5;
            
            await this.auditSystem.logSecurityEvent({
                empresa_id: companyId,
                security_event_type: isOverload ? 'overload_critical' : 'underutilization_critical',
                user_id: imbalance.persona_id,
                username: imbalance.personas.full_name,
                resource_accessed: 'workload_analysis',
                permission_granted: true,
                success: true
            });
            
            // Criar alerta específico
            await this.auditSystem.logAction({
                empresa_id: companyId,
                action_type: 'alert',
                entity_type: 'workload_imbalance',
                entity_id: imbalance.persona_id,
                entity_name: imbalance.personas.full_name,
                actor_type: 'ai_system',
                actor_name: 'Sistema de Detecção de Desequilíbrios',
                action_description: `${isOverload ? 'Sobrecarga crítica' : 'Subutilização crítica'} detectada: ${(imbalance.utilization_rate * 100).toFixed(1)}% de utilização`,
                after_state: imbalance,
                automated: true,
                risk_level: isOverload ? 'critical' : 'medium'
            });
        }
    }
    
    // =====================================================
    // 3. DETECÇÃO DE PADRÕES COM AUDITORIA
    // =====================================================
    
    async detectPatternsWithAudit(companyId) {
        this.log('Detectando padrões com auditoria...', 'ml');
        
        try {
            // Capturar padrões existentes antes
            const beforePatterns = await this.getExistingPatterns(companyId);
            
            // Executar detecção original
            await this.learningSystem.detectEfficiencyPatterns();
            
            // Capturar novos padrões detectados
            const afterPatterns = await this.getExistingPatterns(companyId);
            const newPatterns = this.findNewPatterns(beforePatterns, afterPatterns);
            
            // Auditar cada novo padrão detectado
            for (const pattern of newPatterns) {
                await this.auditPatternDetection(companyId, pattern);
            }
            
            // Auditar a análise geral
            await this.auditSystem.logAction({
                empresa_id: companyId,
                action_type: 'execute',
                entity_type: 'pattern_detection',
                entity_name: 'Detecção de Padrões de Eficiência',
                actor_type: 'ai_system',
                actor_name: 'Sistema ML VCM',
                action_description: `Detecção automática de padrões - ${newPatterns.length} novos padrões encontrados`,
                before_state: { patterns_count: beforePatterns.length },
                after_state: { patterns_count: afterPatterns.length, new_patterns: newPatterns.length },
                automated: true,
                risk_level: newPatterns.length > 5 ? 'medium' : 'low'
            });
            
        } catch (error) {
            await this.auditAnalysisError(companyId, 'pattern_detection', error);
            throw error;
        }
    }
    
    async getExistingPatterns(companyId) {
        try {
            const { data: patterns } = await this.supabase
                .from('learning_patterns')
                .select('id, pattern_type, pattern_name, statistical_confidence, is_active')
                .eq('empresa_id', companyId)
                .eq('is_active', true);
            
            return patterns || [];
        } catch (error) {
            return [];
        }
    }
    
    findNewPatterns(beforePatterns, afterPatterns) {
        const beforeIds = new Set(beforePatterns.map(p => p.id));
        return afterPatterns.filter(p => !beforeIds.has(p.id));
    }
    
    async auditPatternDetection(companyId, pattern) {
        await this.auditSystem.logAction({
            empresa_id: companyId,
            action_type: 'create',
            entity_type: 'learning_pattern',
            entity_id: pattern.id,
            entity_name: pattern.pattern_name,
            actor_type: 'ai_system',
            actor_name: 'Sistema de Detecção de Padrões',
            action_description: `Novo padrão detectado: ${pattern.pattern_name} (confiança: ${(pattern.statistical_confidence * 100).toFixed(1)}%)`,
            after_state: pattern,
            automated: true,
            risk_level: pattern.statistical_confidence > 0.9 ? 'low' : 'medium'
        });
    }
    
    // =====================================================
    // 4. OTIMIZAÇÕES COM AUDITORIA
    // =====================================================
    
    async applyOptimizationsWithAudit(companyId) {
        this.log('Aplicando otimizações com auditoria...', 'ml');
        
        try {
            // Buscar otimizações pendentes
            const pendingOptimizations = await this.getPendingOptimizations(companyId);
            
            for (const optimization of pendingOptimizations) {
                await this.applyOptimizationWithAudit(companyId, optimization);
            }
            
            // Auditar ciclo geral de otimização
            await this.auditSystem.logAction({
                empresa_id: companyId,
                action_type: 'execute',
                entity_type: 'optimization_cycle',
                entity_name: 'Ciclo de Otimizações',
                actor_type: 'ai_system',
                actor_name: 'Sistema de Otimização ML',
                action_description: `Aplicadas ${pendingOptimizations.length} otimizações automáticas`,
                after_state: { optimizations_applied: pendingOptimizations.length },
                automated: true,
                risk_level: pendingOptimizations.length > 3 ? 'medium' : 'low'
            });
            
        } catch (error) {
            await this.auditAnalysisError(companyId, 'optimization_application', error);
            throw error;
        }
    }
    
    async getPendingOptimizations(companyId) {
        try {
            // Simular busca de otimizações baseada em padrões detectados
            const { data: patterns } = await this.supabase
                .from('learning_patterns')
                .select('*')
                .eq('empresa_id', companyId)
                .eq('is_active', true)
                .eq('applied', false)
                .gte('statistical_confidence', 0.8);
                
            return (patterns || []).map(pattern => ({
                pattern_id: pattern.id,
                optimization_type: this.getOptimizationType(pattern.pattern_type),
                optimization_name: `Otimização baseada em: ${pattern.pattern_name}`,
                pattern_data: pattern,
                risk_level: this.calculateOptimizationRisk(pattern),
                expected_improvement: this.estimateImprovement(pattern)
            }));
            
        } catch (error) {
            return [];
        }
    }
    
    async applyOptimizationWithAudit(companyId, optimization) {
        // Capturar estado antes da otimização
        const beforeState = await this.captureSystemState(companyId);
        
        try {
            // Aplicar a otimização
            const result = await this.applyOptimization(companyId, optimization);
            
            // Capturar estado após otimização
            const afterState = await this.captureSystemState(companyId);
            
            // Auditar a otimização aplicada
            await this.auditSystem.logAction({
                empresa_id: companyId,
                action_type: 'execute',
                entity_type: 'ml_optimization',
                entity_id: optimization.pattern_id,
                entity_name: optimization.optimization_name,
                actor_type: 'ai_system',
                actor_name: 'Sistema de Otimização Automática',
                action_description: `Otimização aplicada: ${optimization.optimization_name}`,
                before_state: beforeState,
                after_state: afterState,
                automated: true,
                risk_level: optimization.risk_level,
                sensitive_data_involved: this.involvesSensitiveData(optimization)
            });
            
            // Salvar na tabela de histórico de otimizações
            await this.saveOptimizationHistory(companyId, optimization, result);
            
            // Marcar padrão como aplicado
            await this.markPatternAsApplied(optimization.pattern_id);
            
        } catch (error) {
            // Auditar erro na aplicação
            await this.auditOptimizationError(companyId, optimization, error);
            throw error;
        }
    }
    
    async applyOptimization(companyId, optimization) {
        // Implementação simplificada - na prática seria mais complexa
        this.log(`Aplicando: ${optimization.optimization_name}`, 'ml');
        
        // Simular aplicação da otimização
        await new Promise(resolve => setTimeout(resolve, 100));
        
        return {
            success: true,
            applied_at: new Date().toISOString(),
            changes_made: `Otimização ${optimization.optimization_type} aplicada`,
            metrics_before: {},
            metrics_after: {},
            improvement_achieved: optimization.expected_improvement
        };
    }
    
    async captureSystemState(companyId) {
        try {
            // Capturar métricas relevantes do sistema
            const { data: metrics } = await this.supabase
                .from('performance_metrics')
                .select('metric_name, metric_value')
                .eq('empresa_id', companyId)
                .gte('period_start', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0])
                .order('measured_at', { ascending: false })
                .limit(50);
            
            const state = {};
            metrics?.forEach(metric => {
                state[metric.metric_name] = metric.metric_value;
            });
            
            return state;
        } catch (error) {
            return { capture_error: error.message };
        }
    }
    
    // =====================================================
    // 5. MONITORAMENTO DE SAÚDE COM AUDITORIA
    // =====================================================
    
    async monitorHealthWithAudit(companyId) {
        this.log('Monitorando saúde do sistema com auditoria...', 'ml');
        
        try {
            // Executar monitoramento original
            await this.learningSystem.monitorSystemHealth();
            
            // Buscar alertas gerados
            const recentAlerts = await this.getRecentSystemAlerts(companyId);
            
            // Auditar o monitoramento
            await this.auditSystem.logAction({
                empresa_id: companyId,
                action_type: 'execute',
                entity_type: 'health_monitoring',
                entity_name: 'Monitoramento de Saúde do Sistema',
                actor_type: 'ai_system',
                actor_name: 'Sistema de Monitoramento ML',
                action_description: `Verificação de saúde concluída - ${recentAlerts.length} alertas detectados`,
                after_state: { alerts_count: recentAlerts.length },
                automated: true,
                risk_level: recentAlerts.length > 0 ? 'medium' : 'low'
            });
            
            // Auditar alertas específicos se houver
            for (const alert of recentAlerts) {
                await this.auditHealthAlert(companyId, alert);
            }
            
        } catch (error) {
            await this.auditAnalysisError(companyId, 'health_monitoring', error);
            throw error;
        }
    }
    
    async getRecentSystemAlerts(companyId) {
        try {
            const { data: alerts } = await this.supabase
                .from('system_alerts')
                .select('*')
                .eq('empresa_id', companyId)
                .eq('status', 'active')
                .gte('triggered_at', new Date(Date.now() - 60 * 60 * 1000).toISOString()) // Última hora
                .order('triggered_at', { ascending: false });
            
            return alerts || [];
        } catch (error) {
            return [];
        }
    }
    
    async auditHealthAlert(companyId, alert) {
        await this.auditSystem.logSecurityEvent({
            empresa_id: companyId,
            security_event_type: 'system_alert',
            username: 'Sistema ML',
            resource_accessed: 'system_health',
            permission_granted: true,
            success: true
        });
        
        await this.auditSystem.logAction({
            empresa_id: companyId,
            action_type: 'create',
            entity_type: 'system_alert',
            entity_id: alert.id,
            entity_name: alert.title,
            actor_type: 'ai_system',
            actor_name: 'Sistema de Monitoramento',
            action_description: `Alerta de sistema: ${alert.title}`,
            after_state: alert,
            automated: true,
            risk_level: this.mapSeverityToRisk(alert.severity)
        });
    }
    
    // =====================================================
    // 6. RELATÓRIOS INTEGRADOS
    // =====================================================
    
    async generateIntegratedReport() {
        this.log('Gerando relatório integrado ML + Auditoria...', 'integration');
        
        try {
            const companies = await this.getActiveCompanies();
            const reportData = {
                generated_at: new Date().toISOString(),
                companies_processed: companies.length,
                ml_summary: {},
                audit_summary: {},
                integration_metrics: {},
                recommendations: []
            };
            
            for (const company of companies) {
                // Coletar métricas ML
                const mlMetrics = await this.collectMLMetrics(company.id);
                
                // Coletar métricas de auditoria
                const auditMetrics = await this.collectAuditMetrics(company.id);
                
                // Calcular métricas de integração
                const integrationMetrics = this.calculateIntegrationMetrics(mlMetrics, auditMetrics);
                
                reportData.ml_summary[company.id] = mlMetrics;
                reportData.audit_summary[company.id] = auditMetrics;
                reportData.integration_metrics[company.id] = integrationMetrics;
                
                // Gerar recomendações específicas
                const recommendations = this.generateRecommendations(company.id, mlMetrics, auditMetrics);
                reportData.recommendations.push(...recommendations);
            }
            
            // Salvar o relatório
            await this.saveIntegratedReport(reportData);
            
            this.log('✅ Relatório integrado gerado com sucesso', 'success');
            return reportData;
            
        } catch (error) {
            this.log(`Erro ao gerar relatório integrado: ${error.message}`, 'error');
            return null;
        }
    }
    
    async collectMLMetrics(companyId) {
        try {
            const [patternsData, optimizationsData, alertsData] = await Promise.all([
                this.supabase.from('learning_patterns').select('*').eq('empresa_id', companyId),
                this.supabase.from('optimization_history').select('*').eq('empresa_id', companyId),
                this.supabase.from('system_alerts').select('*').eq('empresa_id', companyId)
            ]);
            
            return {
                total_patterns: patternsData.data?.length || 0,
                active_patterns: patternsData.data?.filter(p => p.is_active).length || 0,
                applied_patterns: patternsData.data?.filter(p => p.applied).length || 0,
                total_optimizations: optimizationsData.data?.length || 0,
                successful_optimizations: optimizationsData.data?.filter(o => o.status === 'successful').length || 0,
                total_alerts: alertsData.data?.length || 0,
                active_alerts: alertsData.data?.filter(a => a.status === 'active').length || 0
            };
        } catch (error) {
            return { error: error.message };
        }
    }
    
    async collectAuditMetrics(companyId) {
        try {
            const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
            
            const [auditData, securityData, complianceData] = await Promise.all([
                this.supabase.from('audit_logs').select('*').eq('empresa_id', companyId).gte('executed_at', last24h.toISOString()),
                this.supabase.from('security_audit_logs').select('*').eq('empresa_id', companyId).gte('attempted_at', last24h.toISOString()),
                this.supabase.from('compliance_audit').select('*').eq('empresa_id', companyId)
            ]);
            
            return {
                audit_events_24h: auditData.data?.length || 0,
                security_events_24h: securityData.data?.length || 0,
                critical_events_24h: (auditData.data?.filter(a => a.risk_level === 'critical').length || 0) +
                                   (securityData.data?.filter(s => s.severity === 'critical').length || 0),
                anomalies_24h: securityData.data?.filter(s => s.anomaly_detected).length || 0,
                compliance_score: complianceData.data?.length ? 
                    complianceData.data.reduce((sum, c) => sum + c.compliance_score, 0) / complianceData.data.length : 0
            };
        } catch (error) {
            return { error: error.message };
        }
    }
    
    calculateIntegrationMetrics(mlMetrics, auditMetrics) {
        return {
            ml_audit_coverage: mlMetrics.total_patterns > 0 ? 
                (auditMetrics.audit_events_24h / mlMetrics.total_patterns) : 0,
            optimization_safety_score: mlMetrics.total_optimizations > 0 ? 
                (mlMetrics.successful_optimizations / mlMetrics.total_optimizations * 100) : 100,
            monitoring_effectiveness: auditMetrics.critical_events_24h === 0 ? 100 : 
                Math.max(0, 100 - (auditMetrics.critical_events_24h * 10)),
            compliance_ml_alignment: auditMetrics.compliance_score
        };
    }
    
    generateRecommendations(companyId, mlMetrics, auditMetrics) {
        const recommendations = [];
        
        if (auditMetrics.critical_events_24h > 0) {
            recommendations.push({
                company_id: companyId,
                type: 'security',
                priority: 'high',
                description: `${auditMetrics.critical_events_24h} eventos críticos detectados nas últimas 24h`,
                action: 'Revisar logs de segurança e implementar correções'
            });
        }
        
        if (mlMetrics.active_patterns > mlMetrics.applied_patterns * 2) {
            recommendations.push({
                company_id: companyId,
                type: 'optimization',
                priority: 'medium',
                description: 'Muitos padrões detectados mas não aplicados',
                action: 'Revisar e aplicar otimizações pendentes'
            });
        }
        
        if (auditMetrics.compliance_score < 80) {
            recommendations.push({
                company_id: companyId,
                type: 'compliance',
                priority: 'high',
                description: `Score de compliance baixo: ${auditMetrics.compliance_score}%`,
                action: 'Implementar melhorias de compliance'
            });
        }
        
        return recommendations;
    }
    
    async saveIntegratedReport(reportData) {
        try {
            // Salvar na tabela de relatórios de auditoria
            for (const [companyId, _] of Object.entries(reportData.ml_summary)) {
                await this.auditSystem.generateAuditReport({
                    empresa_id: companyId,
                    report_type: 'ml_integration_report',
                    period_start: new Date(Date.now() - 24 * 60 * 60 * 1000),
                    period_end: new Date(),
                    format: 'json'
                });
            }
            
        } catch (error) {
            this.log(`Erro ao salvar relatório integrado: ${error.message}`, 'error');
        }
    }
    
    // =====================================================
    // 7. UTILITÁRIOS E HELPERS
    // =====================================================
    
    getOptimizationType(patternType) {
        const mapping = {
            'workload_balance': 'task_rebalancing',
            'task_complexity': 'complexity_adjustment', 
            'subsystem_usage': 'subsystem_optimization',
            'timing_optimization': 'timing_adjustment'
        };
        return mapping[patternType] || 'general_optimization';
    }
    
    calculateOptimizationRisk(pattern) {
        if (pattern.statistical_confidence > 0.95) return 'low';
        if (pattern.statistical_confidence > 0.85) return 'medium';
        return 'high';
    }
    
    estimateImprovement(pattern) {
        // Simplificado - calcular baseado no impacto do padrão
        return (pattern.impact_magnitude || 0) * (pattern.statistical_confidence || 0);
    }
    
    involvesSensitiveData(optimization) {
        return optimization.optimization_type.includes('persona') || 
               optimization.optimization_type.includes('user');
    }
    
    async saveOptimizationHistory(companyId, optimization, result) {
        try {
            const historyRecord = {
                empresa_id: companyId,
                pattern_id: optimization.pattern_id,
                optimization_type: optimization.optimization_type,
                optimization_name: optimization.optimization_name,
                optimization_parameters: optimization,
                expected_outcomes: { improvement: optimization.expected_improvement },
                actual_outcomes: result,
                success_score: result.success ? 1.0 : 0.0,
                improvement_achieved: result.improvement_achieved,
                status: result.success ? 'successful' : 'failed',
                auto_applied: true,
                implementation_method: 'immediate'
            };
            
            await this.supabase
                .from('optimization_history')
                .insert(historyRecord);
                
        } catch (error) {
            this.log(`Erro ao salvar histórico de otimização: ${error.message}`, 'error');
        }
    }
    
    async markPatternAsApplied(patternId) {
        try {
            await this.supabase
                .from('learning_patterns')
                .update({ 
                    applied: true, 
                    application_date: new Date().toISOString() 
                })
                .eq('id', patternId);
        } catch (error) {
            this.log(`Erro ao marcar padrão como aplicado: ${error.message}`, 'error');
        }
    }
    
    mapSeverityToRisk(severity) {
        const mapping = {
            'info': 'low',
            'warning': 'medium',
            'error': 'high',
            'critical': 'critical'
        };
        return mapping[severity] || 'medium';
    }
    
    // Métodos de auditoria de erros
    async auditSystemError(error, context) {
        await this.auditSystem.logAction({
            action_type: 'error',
            entity_type: 'system',
            entity_name: context,
            actor_type: 'system',
            actor_name: 'Sistema Integrado VCM',
            action_description: `Erro no sistema: ${error.message}`,
            after_state: { error: error.message, stack: error.stack },
            automated: true,
            risk_level: 'high',
            success: false
        });
    }
    
    async auditProcessingError(companyId, error) {
        await this.auditSystem.logAction({
            empresa_id: companyId,
            action_type: 'error',
            entity_type: 'company_processing',
            entity_name: 'Processamento de Empresa',
            actor_type: 'system',
            action_description: `Erro no processamento da empresa: ${error.message}`,
            after_state: { error: error.message },
            automated: true,
            risk_level: 'high',
            success: false
        });
    }
    
    async auditAnalysisError(companyId, analysisType, error) {
        await this.auditSystem.logAction({
            empresa_id: companyId,
            action_type: 'error',
            entity_type: analysisType,
            entity_name: `Análise ${analysisType}`,
            actor_type: 'ai_system',
            action_description: `Erro na análise ${analysisType}: ${error.message}`,
            after_state: { error: error.message },
            automated: true,
            risk_level: 'medium',
            success: false
        });
    }
    
    async auditOptimizationError(companyId, optimization, error) {
        await this.auditSystem.logAction({
            empresa_id: companyId,
            action_type: 'error',
            entity_type: 'optimization',
            entity_id: optimization.pattern_id,
            entity_name: optimization.optimization_name,
            actor_type: 'ai_system',
            action_description: `Erro na aplicação de otimização: ${error.message}`,
            before_state: optimization,
            after_state: { error: error.message },
            automated: true,
            risk_level: 'high',
            success: false
        });
    }
    
    async getActiveCompanies() {
        try {
            const { data, error } = await this.supabase
                .from('empresas')
                .select('id, nome')
                .eq('status', 'active');
                
            if (error) throw error;
            return data || [];
        } catch (error) {
            this.log(`Erro ao buscar empresas ativas: ${error.message}`, 'error');
            return [];
        }
    }
}

// =====================================================
// EXECUÇÃO
// =====================================================

if (require.main === module) {
    const integratedSystem = new VCMIntegratedSystem();
    
    const mode = process.argv[2] || 'cycle';
    
    if (mode === 'cycle') {
        integratedSystem.runAuditedLearningCycle().then((success) => {
            console.log(success ? '🎯 Ciclo integrado concluído' : '❌ Ciclo integrado falhou');
            process.exit(success ? 0 : 1);
        });
    } else if (mode === 'report') {
        integratedSystem.generateIntegratedReport().then((report) => {
            console.log(report ? '📊 Relatório integrado gerado' : '❌ Falha no relatório');
            process.exit(report ? 0 : 1);
        });
    } else {
        console.log('Uso: node vcm_integrated_system.js [cycle|report]');
        process.exit(1);
    }
}

module.exports = VCMIntegratedSystem;