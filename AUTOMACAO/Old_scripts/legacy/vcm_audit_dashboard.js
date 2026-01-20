#!/usr/bin/env node

/**
 * DASHBOARD DE AUDITORIA VCM
 * 
 * Interface web completa para visualização de logs, relatórios,
 * timeline de mudanças e alertas de segurança
 */

const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config();

class VCMAuditDashboard {
    constructor() {
        this.app = express();
        this.port = process.env.AUDIT_DASHBOARD_PORT || 3002;
        
        this.supabase = createClient(
            process.env.VCM_SUPABASE_URL,
            process.env.VCM_SUPABASE_SERVICE_ROLE_KEY
        );
        
        this.setupMiddleware();
        this.setupRoutes();
        
        console.log('🔍 Dashboard de Auditoria VCM inicializado');
    }
    
    setupMiddleware() {
        this.app.use(express.json());
        this.app.use(express.static(path.join(__dirname, 'public')));
        
        // CORS
        this.app.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
            next();
        });
    }
    
    setupRoutes() {
        // Página principal
        this.app.get('/', (req, res) => {
            res.send(this.generateMainPage());
        });
        
        // API Routes
        this.app.get('/api/audit/summary', this.getAuditSummary.bind(this));
        this.app.get('/api/audit/logs', this.getAuditLogs.bind(this));
        this.app.get('/api/security/logs', this.getSecurityLogs.bind(this));
        this.app.get('/api/security/alerts', this.getSecurityAlerts.bind(this));
        this.app.get('/api/compliance/status', this.getComplianceStatus.bind(this));
        this.app.get('/api/reports', this.getReports.bind(this));
        this.app.get('/api/timeline', this.getTimeline.bind(this));
        this.app.get('/api/stats', this.getStats.bind(this));
        
        // Relatórios específicos
        this.app.get('/api/reports/generate/:type', this.generateReport.bind(this));
        this.app.get('/api/reports/download/:id', this.downloadReport.bind(this));
        
        // Filtros e busca
        this.app.post('/api/audit/search', this.searchAuditLogs.bind(this));
        this.app.get('/api/companies', this.getCompanies.bind(this));
        
        console.log('📝 Rotas do dashboard configuradas');
    }
    
    // =====================================================
    // API ENDPOINTS
    // =====================================================
    
    async getAuditSummary(req, res) {
        try {
            const { empresa_id, days = 7 } = req.query;
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - parseInt(days));
            
            // Buscar estatísticas gerais
            const auditQuery = this.supabase
                .from('audit_logs')
                .select('action_type, risk_level, success, automated, executed_at')
                .gte('executed_at', startDate.toISOString());
                
            if (empresa_id) {
                auditQuery.eq('empresa_id', empresa_id);
            }
            
            const { data: auditLogs } = await auditQuery;
            
            const securityQuery = this.supabase
                .from('security_audit_logs')
                .select('security_event_type, severity, success, anomaly_detected, attempted_at')
                .gte('attempted_at', startDate.toISOString());
                
            if (empresa_id) {
                securityQuery.eq('empresa_id', empresa_id);
            }
            
            const { data: securityLogs } = await securityQuery;
            
            // Calcular métricas
            const summary = {
                total_events: (auditLogs?.length || 0) + (securityLogs?.length || 0),
                audit_events: auditLogs?.length || 0,
                security_events: securityLogs?.length || 0,
                critical_events: (auditLogs?.filter(a => a.risk_level === 'critical').length || 0) +
                               (securityLogs?.filter(s => s.severity === 'critical').length || 0),
                failed_events: (auditLogs?.filter(a => !a.success).length || 0) +
                             (securityLogs?.filter(s => !s.success).length || 0),
                anomalies: securityLogs?.filter(s => s.anomaly_detected).length || 0,
                automated_events: auditLogs?.filter(a => a.automated).length || 0,
                
                // Distribuição por tipo de ação
                action_distribution: this.calculateDistribution(auditLogs, 'action_type'),
                risk_distribution: this.calculateDistribution(auditLogs, 'risk_level'),
                security_distribution: this.calculateDistribution(securityLogs, 'security_event_type'),
                
                // Timeline das últimas 24h
                timeline_24h: this.generateTimeline(auditLogs, securityLogs, 24)
            };
            
            res.json(summary);
            
        } catch (error) {
            console.error('Erro ao buscar resumo de auditoria:', error);
            res.status(500).json({ error: error.message });
        }
    }
    
    async getAuditLogs(req, res) {
        try {
            const { 
                empresa_id, 
                action_type, 
                risk_level, 
                page = 1, 
                limit = 50,
                start_date,
                end_date 
            } = req.query;
            
            let query = this.supabase
                .from('audit_logs')
                .select(`
                    id, executed_at, action_type, entity_type, entity_name,
                    actor_name, action_description, risk_level, success,
                    automated, sensitive_data_involved
                `)
                .order('executed_at', { ascending: false });
            
            // Aplicar filtros
            if (empresa_id) query = query.eq('empresa_id', empresa_id);
            if (action_type) query = query.eq('action_type', action_type);
            if (risk_level) query = query.eq('risk_level', risk_level);
            if (start_date) query = query.gte('executed_at', start_date);
            if (end_date) query = query.lte('executed_at', end_date);
            
            // Paginação
            const offset = (parseInt(page) - 1) * parseInt(limit);
            query = query.range(offset, offset + parseInt(limit) - 1);
            
            const { data: logs, error } = await query;
            
            if (error) {
                throw error;
            }
            
            res.json({
                logs,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    has_more: logs?.length === parseInt(limit)
                }
            });
            
        } catch (error) {
            console.error('Erro ao buscar logs de auditoria:', error);
            res.status(500).json({ error: error.message });
        }
    }
    
    async getSecurityLogs(req, res) {
        try {
            const { 
                empresa_id, 
                severity, 
                anomaly_only = false,
                page = 1, 
                limit = 50 
            } = req.query;
            
            let query = this.supabase
                .from('security_audit_logs')
                .select(`
                    id, attempted_at, security_event_type, severity, username,
                    ip_address, resource_accessed, success, anomaly_detected,
                    risk_score, failure_reason
                `)
                .order('attempted_at', { ascending: false });
            
            if (empresa_id) query = query.eq('empresa_id', empresa_id);
            if (severity) query = query.eq('severity', severity);
            if (anomaly_only === 'true') query = query.eq('anomaly_detected', true);
            
            const offset = (parseInt(page) - 1) * parseInt(limit);
            query = query.range(offset, offset + parseInt(limit) - 1);
            
            const { data: logs, error } = await query;
            
            if (error) throw error;
            
            res.json({
                logs,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    has_more: logs?.length === parseInt(limit)
                }
            });
            
        } catch (error) {
            console.error('Erro ao buscar logs de segurança:', error);
            res.status(500).json({ error: error.message });
        }
    }
    
    async getSecurityAlerts(req, res) {
        try {
            const { empresa_id } = req.query;
            
            // Buscar alertas ativos (últimas 24h)
            const alerts = await this.generateSecurityAlerts(empresa_id);
            
            res.json({ alerts });
            
        } catch (error) {
            console.error('Erro ao buscar alertas de segurança:', error);
            res.status(500).json({ error: error.message });
        }
    }
    
    async getComplianceStatus(req, res) {
        try {
            const { empresa_id } = req.query;
            
            let query = this.supabase
                .from('compliance_audit')
                .select(`
                    compliance_framework, assessment_status, compliance_score,
                    assessed_at, risk_level, next_assessment_due
                `)
                .order('assessed_at', { ascending: false });
                
            if (empresa_id) query = query.eq('empresa_id', empresa_id);
            
            const { data: compliance, error } = await query.limit(100);
            
            if (error) throw error;
            
            // Agrupar por framework
            const status = {};
            compliance?.forEach(record => {
                const framework = record.compliance_framework;
                if (!status[framework]) {
                    status[framework] = {
                        framework,
                        latest_score: 0,
                        latest_assessment: null,
                        status: 'pending',
                        assessments_count: 0,
                        high_risk_count: 0
                    };
                }
                
                status[framework].assessments_count++;
                if (record.assessed_at > (status[framework].latest_assessment || '1970-01-01')) {
                    status[framework].latest_score = record.compliance_score;
                    status[framework].latest_assessment = record.assessed_at;
                    status[framework].status = record.assessment_status;
                }
                if (record.risk_level in ['high', 'critical']) {
                    status[framework].high_risk_count++;
                }
            });
            
            res.json({ 
                compliance_status: Object.values(status),
                total_frameworks: Object.keys(status).length,
                overall_score: Object.values(status).reduce((sum, f) => sum + f.latest_score, 0) / Object.keys(status).length || 0
            });
            
        } catch (error) {
            console.error('Erro ao buscar status de compliance:', error);
            res.status(500).json({ error: error.message });
        }
    }
    
    async getReports(req, res) {
        try {
            const { empresa_id, type } = req.query;
            
            let query = this.supabase
                .from('audit_reports')
                .select(`
                    id, report_type, generated_at, report_period_start,
                    report_period_end, total_events, critical_events,
                    generation_status, file_size_bytes
                `)
                .order('generated_at', { ascending: false });
                
            if (empresa_id) query = query.eq('empresa_id', empresa_id);
            if (type) query = query.eq('report_type', type);
            
            const { data: reports, error } = await query.limit(50);
            
            if (error) throw error;
            
            res.json({ reports });
            
        } catch (error) {
            console.error('Erro ao buscar relatórios:', error);
            res.status(500).json({ error: error.message });
        }
    }
    
    async getTimeline(req, res) {
        try {
            const { empresa_id, hours = 24 } = req.query;
            const startTime = new Date();
            startTime.setHours(startTime.getHours() - parseInt(hours));
            
            // Buscar eventos para timeline
            const auditQuery = this.supabase
                .from('audit_logs')
                .select('executed_at, action_type, entity_name, risk_level, success')
                .gte('executed_at', startTime.toISOString())
                .order('executed_at', { ascending: true });
                
            const securityQuery = this.supabase
                .from('security_audit_logs')
                .select('attempted_at, security_event_type, username, severity, success')
                .gte('attempted_at', startTime.toISOString())
                .order('attempted_at', { ascending: true });
            
            if (empresa_id) {
                auditQuery.eq('empresa_id', empresa_id);
                securityQuery.eq('empresa_id', empresa_id);
            }
            
            const [{ data: auditEvents }, { data: securityEvents }] = await Promise.all([
                auditQuery,
                securityQuery
            ]);
            
            // Combinar e ordenar eventos
            const timeline = [];
            
            auditEvents?.forEach(event => {
                timeline.push({
                    timestamp: event.executed_at,
                    type: 'audit',
                    subtype: event.action_type,
                    description: `${event.action_type}: ${event.entity_name}`,
                    severity: event.risk_level,
                    success: event.success,
                    icon: this.getEventIcon(event.action_type)
                });
            });
            
            securityEvents?.forEach(event => {
                timeline.push({
                    timestamp: event.attempted_at,
                    type: 'security',
                    subtype: event.security_event_type,
                    description: `${event.security_event_type} por ${event.username}`,
                    severity: event.severity,
                    success: event.success,
                    icon: this.getEventIcon(event.security_event_type)
                });
            });
            
            // Ordenar por timestamp
            timeline.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            
            res.json({ timeline });
            
        } catch (error) {
            console.error('Erro ao buscar timeline:', error);
            res.status(500).json({ error: error.message });
        }
    }
    
    async getStats(req, res) {
        try {
            const { empresa_id } = req.query;
            
            // Estatísticas dos últimos 30 dias
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            
            const stats = await this.calculateDetailedStats(empresa_id, thirtyDaysAgo);
            
            res.json(stats);
            
        } catch (error) {
            console.error('Erro ao buscar estatísticas:', error);
            res.status(500).json({ error: error.message });
        }
    }
    
    async generateReport(req, res) {
        try {
            const { type } = req.params;
            const { empresa_id } = req.query;
            
            // Simular geração de relatório
            const reportData = {
                id: `rpt_${Date.now()}`,
                type,
                empresa_id,
                generated_at: new Date().toISOString(),
                status: 'completed',
                summary: `Relatório ${type} gerado com sucesso`
            };
            
            res.json({ report: reportData });
            
        } catch (error) {
            console.error('Erro ao gerar relatório:', error);
            res.status(500).json({ error: error.message });
        }
    }
    
    async searchAuditLogs(req, res) {
        try {
            const { query: searchQuery, filters, page = 1, limit = 50 } = req.body;
            
            let dbQuery = this.supabase
                .from('audit_logs')
                .select(`
                    id, executed_at, action_type, entity_type, entity_name,
                    actor_name, action_description, risk_level, success
                `)
                .order('executed_at', { ascending: false });
            
            // Busca por texto
            if (searchQuery) {
                dbQuery = dbQuery.or(`entity_name.ilike.%${searchQuery}%,action_description.ilike.%${searchQuery}%,actor_name.ilike.%${searchQuery}%`);
            }
            
            // Aplicar filtros
            if (filters) {
                Object.entries(filters).forEach(([key, value]) => {
                    if (value) {
                        dbQuery = dbQuery.eq(key, value);
                    }
                });
            }
            
            const offset = (parseInt(page) - 1) * parseInt(limit);
            dbQuery = dbQuery.range(offset, offset + parseInt(limit) - 1);
            
            const { data: results, error } = await dbQuery;
            
            if (error) throw error;
            
            res.json({
                results,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    has_more: results?.length === parseInt(limit)
                }
            });
            
        } catch (error) {
            console.error('Erro na busca:', error);
            res.status(500).json({ error: error.message });
        }
    }
    
    async getCompanies(req, res) {
        try {
            const { data: companies, error } = await this.supabase
                .from('empresas')
                .select('id, nome, status')
                .eq('status', 'active')
                .order('nome');
                
            if (error) throw error;
            
            res.json({ companies });
            
        } catch (error) {
            console.error('Erro ao buscar empresas:', error);
            res.status(500).json({ error: error.message });
        }
    }
    
    // =====================================================
    // UTILITÁRIOS
    // =====================================================
    
    calculateDistribution(data, field) {
        const distribution = {};
        data?.forEach(item => {
            const value = item[field] || 'unknown';
            distribution[value] = (distribution[value] || 0) + 1;
        });
        return distribution;
    }
    
    generateTimeline(auditLogs, securityLogs, hours) {
        const timeline = {};
        const startTime = Date.now() - (hours * 60 * 60 * 1000);
        
        // Inicializar buckets de hora
        for (let i = 0; i < hours; i++) {
            const hour = new Date(startTime + (i * 60 * 60 * 1000));
            const hourKey = hour.getHours().toString().padStart(2, '0') + 'h';
            timeline[hourKey] = { audit: 0, security: 0, total: 0 };
        }
        
        // Contar eventos por hora
        auditLogs?.forEach(log => {
            const logTime = new Date(log.executed_at);
            if (logTime.getTime() >= startTime) {
                const hourKey = logTime.getHours().toString().padStart(2, '0') + 'h';
                if (timeline[hourKey]) {
                    timeline[hourKey].audit++;
                    timeline[hourKey].total++;
                }
            }
        });
        
        securityLogs?.forEach(log => {
            const logTime = new Date(log.attempted_at);
            if (logTime.getTime() >= startTime) {
                const hourKey = logTime.getHours().toString().padStart(2, '0') + 'h';
                if (timeline[hourKey]) {
                    timeline[hourKey].security++;
                    timeline[hourKey].total++;
                }
            }
        });
        
        return timeline;
    }
    
    async generateSecurityAlerts(empresaId) {
        const alerts = [];
        const last24h = new Date();
        last24h.setHours(last24h.getHours() - 24);
        
        try {
            // Buscar eventos suspeitos nas últimas 24h
            let securityQuery = this.supabase
                .from('security_audit_logs')
                .select('*')
                .gte('attempted_at', last24h.toISOString())
                .or('anomaly_detected.eq.true,severity.eq.critical,severity.eq.error');
                
            if (empresaId) {
                securityQuery = securityQuery.eq('empresa_id', empresaId);
            }
            
            const { data: suspiciousEvents } = await securityQuery;
            
            // Gerar alertas baseados nos eventos
            suspiciousEvents?.forEach(event => {
                if (event.anomaly_detected) {
                    alerts.push({
                        id: `alert_${event.id}`,
                        type: 'anomaly',
                        severity: 'warning',
                        title: 'Anomalia de Segurança Detectada',
                        description: `Comportamento anômalo detectado: ${event.security_event_type}`,
                        timestamp: event.attempted_at,
                        details: event
                    });
                }
                
                if (event.severity === 'critical' && !event.success) {
                    alerts.push({
                        id: `alert_crit_${event.id}`,
                        type: 'critical_failure',
                        severity: 'critical',
                        title: 'Falha Crítica de Segurança',
                        description: `Falha crítica: ${event.security_event_type} - ${event.failure_reason}`,
                        timestamp: event.attempted_at,
                        details: event
                    });
                }
            });
            
        } catch (error) {
            console.error('Erro ao gerar alertas de segurança:', error);
        }
        
        return alerts;
    }
    
    async calculateDetailedStats(empresaId, startDate) {
        try {
            // Buscar dados para estatísticas detalhadas
            const promises = [];
            
            // Logs de auditoria
            let auditQuery = this.supabase
                .from('audit_logs')
                .select('*')
                .gte('executed_at', startDate.toISOString());
            if (empresaId) auditQuery = auditQuery.eq('empresa_id', empresaId);
            promises.push(auditQuery);
            
            // Logs de segurança
            let securityQuery = this.supabase
                .from('security_audit_logs')
                .select('*')
                .gte('attempted_at', startDate.toISOString());
            if (empresaId) securityQuery = securityQuery.eq('empresa_id', empresaId);
            promises.push(securityQuery);
            
            // Compliance
            let complianceQuery = this.supabase
                .from('compliance_audit')
                .select('*')
                .gte('assessed_at', startDate.toISOString());
            if (empresaId) complianceQuery = complianceQuery.eq('empresa_id', empresaId);
            promises.push(complianceQuery);
            
            const [
                { data: auditLogs },
                { data: securityLogs },
                { data: compliance }
            ] = await Promise.all(promises);
            
            return {
                overview: {
                    total_events: (auditLogs?.length || 0) + (securityLogs?.length || 0),
                    audit_events: auditLogs?.length || 0,
                    security_events: securityLogs?.length || 0,
                    compliance_checks: compliance?.length || 0
                },
                risk_analysis: {
                    high_risk_events: auditLogs?.filter(a => a.risk_level === 'high').length || 0,
                    critical_events: auditLogs?.filter(a => a.risk_level === 'critical').length || 0,
                    failed_events: (auditLogs?.filter(a => !a.success).length || 0) + 
                                 (securityLogs?.filter(s => !s.success).length || 0)
                },
                security_analysis: {
                    anomalies: securityLogs?.filter(s => s.anomaly_detected).length || 0,
                    access_denials: securityLogs?.filter(s => s.security_event_type === 'access_denied').length || 0,
                    high_risk_access: securityLogs?.filter(s => s.risk_score >= 70).length || 0
                },
                compliance_analysis: {
                    total_assessments: compliance?.length || 0,
                    compliant: compliance?.filter(c => c.assessment_status === 'compliant').length || 0,
                    non_compliant: compliance?.filter(c => c.assessment_status === 'non_compliant').length || 0,
                    avg_score: compliance?.length ? 
                        compliance.reduce((sum, c) => sum + c.compliance_score, 0) / compliance.length : 0
                },
                trends: {
                    daily_volumes: this.calculateDailyVolumes(auditLogs, securityLogs, 30),
                    risk_trends: this.calculateRiskTrends(auditLogs, 30),
                    security_trends: this.calculateSecurityTrends(securityLogs, 30)
                }
            };
            
        } catch (error) {
            console.error('Erro ao calcular estatísticas detalhadas:', error);
            return { error: error.message };
        }
    }
    
    calculateDailyVolumes(auditLogs, securityLogs, days) {
        const volumes = {};
        const startTime = Date.now() - (days * 24 * 60 * 60 * 1000);
        
        for (let i = 0; i < days; i++) {
            const date = new Date(startTime + (i * 24 * 60 * 60 * 1000));
            const dateKey = date.toISOString().split('T')[0];
            volumes[dateKey] = { audit: 0, security: 0, total: 0 };
        }
        
        auditLogs?.forEach(log => {
            const dateKey = log.executed_at.split('T')[0];
            if (volumes[dateKey]) {
                volumes[dateKey].audit++;
                volumes[dateKey].total++;
            }
        });
        
        securityLogs?.forEach(log => {
            const dateKey = log.attempted_at.split('T')[0];
            if (volumes[dateKey]) {
                volumes[dateKey].security++;
                volumes[dateKey].total++;
            }
        });
        
        return volumes;
    }
    
    calculateRiskTrends(auditLogs, days) {
        // Implementação simplificada
        return { trend: 'stable', change_percent: 0 };
    }
    
    calculateSecurityTrends(securityLogs, days) {
        // Implementação simplificada
        return { trend: 'improving', anomaly_rate: 0.05 };
    }
    
    getEventIcon(eventType) {
        const icons = {
            'create': '➕',
            'update': '✏️',
            'delete': '🗑️',
            'access': '🔍',
            'login': '🔑',
            'logout': '🚪',
            'access_denied': '⛔',
            'data_export': '📤',
            'config_change': '⚙️'
        };
        
        return icons[eventType] || '📋';
    }
    
    // =====================================================
    // PÁGINA HTML PRINCIPAL
    // =====================================================
    
    generateMainPage() {
        return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard de Auditoria VCM</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            color: #333;
        }
        
        .header {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            padding: 1rem 2rem;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        
        .header h1 {
            color: #2c3e50;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        
        .container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 2rem;
            display: grid;
            gap: 2rem;
            grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
        }
        
        .card {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border-radius: 12px;
            padding: 1.5rem;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .card h2 {
            color: #2c3e50;
            margin-bottom: 1rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 1rem;
            margin-bottom: 1rem;
        }
        
        .stat-item {
            text-align: center;
            padding: 1rem;
            background: rgba(0, 0, 0, 0.05);
            border-radius: 8px;
        }
        
        .stat-value {
            font-size: 2rem;
            font-weight: bold;
            color: #3498db;
        }
        
        .stat-label {
            font-size: 0.9rem;
            color: #666;
            margin-top: 0.5rem;
        }
        
        .filters {
            display: flex;
            gap: 1rem;
            margin-bottom: 1rem;
            flex-wrap: wrap;
        }
        
        select, input {
            padding: 0.5rem;
            border: 1px solid #ddd;
            border-radius: 6px;
            font-size: 0.9rem;
        }
        
        .btn {
            background: #3498db;
            color: white;
            border: none;
            padding: 0.5rem 1rem;
            border-radius: 6px;
            cursor: pointer;
            font-size: 0.9rem;
            transition: background 0.3s;
        }
        
        .btn:hover {
            background: #2980b9;
        }
        
        .log-item {
            padding: 0.75rem;
            border-left: 4px solid #3498db;
            background: rgba(0, 0, 0, 0.02);
            margin-bottom: 0.5rem;
            border-radius: 4px;
        }
        
        .log-item.critical {
            border-left-color: #e74c3c;
        }
        
        .log-item.warning {
            border-left-color: #f39c12;
        }
        
        .log-meta {
            font-size: 0.8rem;
            color: #666;
            margin-top: 0.25rem;
        }
        
        .timeline {
            position: relative;
            max-height: 400px;
            overflow-y: auto;
        }
        
        .timeline-item {
            display: flex;
            gap: 1rem;
            margin-bottom: 1rem;
            padding-bottom: 1rem;
            border-bottom: 1px solid #eee;
        }
        
        .timeline-time {
            font-size: 0.8rem;
            color: #666;
            min-width: 80px;
        }
        
        .timeline-content {
            flex: 1;
        }
        
        .timeline-title {
            font-weight: 500;
            margin-bottom: 0.25rem;
        }
        
        .timeline-desc {
            font-size: 0.9rem;
            color: #666;
        }
        
        .alert {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 6px;
            padding: 1rem;
            margin-bottom: 1rem;
        }
        
        .alert.critical {
            background: #f8d7da;
            border-color: #f5c6cb;
        }
        
        .loading {
            text-align: center;
            padding: 2rem;
            color: #666;
        }
        
        .error {
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
            border-radius: 6px;
            padding: 1rem;
            margin-bottom: 1rem;
        }
        
        @media (max-width: 768px) {
            .container {
                grid-template-columns: 1fr;
                padding: 1rem;
            }
            
            .filters {
                flex-direction: column;
            }
            
            .stats-grid {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🔍 Dashboard de Auditoria VCM</h1>
    </div>
    
    <div class="container">
        <!-- Resumo Executivo -->
        <div class="card">
            <h2>📊 Resumo Executivo</h2>
            <div class="filters">
                <select id="companyFilter">
                    <option value="">Todas as Empresas</option>
                </select>
                <select id="periodFilter">
                    <option value="1">Último Dia</option>
                    <option value="7" selected>Últimos 7 Dias</option>
                    <option value="30">Últimos 30 Dias</option>
                </select>
                <button class="btn" onclick="refreshDashboard()">🔄 Atualizar</button>
            </div>
            <div class="stats-grid" id="summaryStats">
                <div class="loading">Carregando estatísticas...</div>
            </div>
        </div>
        
        <!-- Alertas de Segurança -->
        <div class="card">
            <h2>🚨 Alertas de Segurança</h2>
            <div id="securityAlerts">
                <div class="loading">Carregando alertas...</div>
            </div>
        </div>
        
        <!-- Timeline de Eventos -->
        <div class="card">
            <h2>⏰ Timeline de Eventos</h2>
            <div class="timeline" id="eventsTimeline">
                <div class="loading">Carregando timeline...</div>
            </div>
        </div>
        
        <!-- Logs de Auditoria Recentes -->
        <div class="card">
            <h2>📋 Logs de Auditoria Recentes</h2>
            <div class="filters">
                <select id="actionTypeFilter">
                    <option value="">Todos os Tipos</option>
                    <option value="create">Create</option>
                    <option value="update">Update</option>
                    <option value="delete">Delete</option>
                    <option value="access">Access</option>
                </select>
                <select id="riskLevelFilter">
                    <option value="">Todos os Níveis</option>
                    <option value="low">Baixo</option>
                    <option value="medium">Médio</option>
                    <option value="high">Alto</option>
                    <option value="critical">Crítico</option>
                </select>
            </div>
            <div id="auditLogs">
                <div class="loading">Carregando logs...</div>
            </div>
        </div>
        
        <!-- Compliance Status -->
        <div class="card">
            <h2>📋 Status de Compliance</h2>
            <div id="complianceStatus">
                <div class="loading">Carregando status de compliance...</div>
            </div>
        </div>
        
        <!-- Relatórios Disponíveis -->
        <div class="card">
            <h2>📄 Relatórios Disponíveis</h2>
            <div id="reportsSection">
                <div class="loading">Carregando relatórios...</div>
            </div>
        </div>
    </div>
    
    <script>
        // Estado global da aplicação
        let currentCompany = '';
        let currentPeriod = 7;
        
        // Função principal de inicialização
        async function initDashboard() {
            await loadCompanies();
            await refreshDashboard();
            
            // Configurar listeners
            document.getElementById('companyFilter').addEventListener('change', (e) => {
                currentCompany = e.target.value;
                refreshDashboard();
            });
            
            document.getElementById('periodFilter').addEventListener('change', (e) => {
                currentPeriod = parseInt(e.target.value);
                refreshDashboard();
            });
            
            document.getElementById('actionTypeFilter').addEventListener('change', loadAuditLogs);
            document.getElementById('riskLevelFilter').addEventListener('change', loadAuditLogs);
            
            // Auto-refresh a cada 30 segundos
            setInterval(refreshDashboard, 30000);
        }
        
        // Carregar lista de empresas
        async function loadCompanies() {
            try {
                const response = await fetch('/api/companies');
                const data = await response.json();
                
                const select = document.getElementById('companyFilter');
                select.innerHTML = '<option value="">Todas as Empresas</option>';
                
                data.companies?.forEach(company => {
                    const option = document.createElement('option');
                    option.value = company.id;
                    option.textContent = company.nome;
                    select.appendChild(option);
                });
            } catch (error) {
                console.error('Erro ao carregar empresas:', error);
            }
        }
        
        // Atualizar todo o dashboard
        async function refreshDashboard() {
            await Promise.all([
                loadSummaryStats(),
                loadSecurityAlerts(),
                loadTimeline(),
                loadAuditLogs(),
                loadComplianceStatus(),
                loadReports()
            ]);
        }
        
        // Carregar estatísticas de resumo
        async function loadSummaryStats() {
            try {
                const params = new URLSearchParams({
                    days: currentPeriod
                });
                
                if (currentCompany) params.append('empresa_id', currentCompany);
                
                const response = await fetch(\`/api/audit/summary?\${params}\`);
                const data = await response.json();
                
                const container = document.getElementById('summaryStats');
                container.innerHTML = \`
                    <div class="stat-item">
                        <div class="stat-value">\${data.total_events || 0}</div>
                        <div class="stat-label">Total de Eventos</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">\${data.critical_events || 0}</div>
                        <div class="stat-label">Eventos Críticos</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">\${data.failed_events || 0}</div>
                        <div class="stat-label">Falhas</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">\${data.anomalies || 0}</div>
                        <div class="stat-label">Anomalias</div>
                    </div>
                \`;
            } catch (error) {
                console.error('Erro ao carregar estatísticas:', error);
                document.getElementById('summaryStats').innerHTML = '<div class="error">Erro ao carregar estatísticas</div>';
            }
        }
        
        // Carregar alertas de segurança
        async function loadSecurityAlerts() {
            try {
                const params = new URLSearchParams();
                if (currentCompany) params.append('empresa_id', currentCompany);
                
                const response = await fetch(\`/api/security/alerts?\${params}\`);
                const data = await response.json();
                
                const container = document.getElementById('securityAlerts');
                
                if (!data.alerts || data.alerts.length === 0) {
                    container.innerHTML = '<div class="alert">✅ Nenhum alerta de segurança no momento</div>';
                    return;
                }
                
                container.innerHTML = data.alerts.map(alert => \`
                    <div class="alert \${alert.severity}">
                        <div><strong>\${alert.title}</strong></div>
                        <div>\${alert.description}</div>
                        <div class="log-meta">\${new Date(alert.timestamp).toLocaleString('pt-BR')}</div>
                    </div>
                \`).join('');
                
            } catch (error) {
                console.error('Erro ao carregar alertas:', error);
                document.getElementById('securityAlerts').innerHTML = '<div class="error">Erro ao carregar alertas</div>';
            }
        }
        
        // Carregar timeline
        async function loadTimeline() {
            try {
                const params = new URLSearchParams({
                    hours: 24
                });
                
                if (currentCompany) params.append('empresa_id', currentCompany);
                
                const response = await fetch(\`/api/timeline?\${params}\`);
                const data = await response.json();
                
                const container = document.getElementById('eventsTimeline');
                
                if (!data.timeline || data.timeline.length === 0) {
                    container.innerHTML = '<div>Nenhum evento recente</div>';
                    return;
                }
                
                container.innerHTML = data.timeline.slice(0, 10).map(event => \`
                    <div class="timeline-item">
                        <div class="timeline-time">
                            \${new Date(event.timestamp).toLocaleTimeString('pt-BR')}
                        </div>
                        <div class="timeline-content">
                            <div class="timeline-title">
                                \${event.icon} \${event.description}
                            </div>
                            <div class="timeline-desc">
                                Tipo: \${event.type} | Severidade: \${event.severity}
                            </div>
                        </div>
                    </div>
                \`).join('');
                
            } catch (error) {
                console.error('Erro ao carregar timeline:', error);
                document.getElementById('eventsTimeline').innerHTML = '<div class="error">Erro ao carregar timeline</div>';
            }
        }
        
        // Carregar logs de auditoria
        async function loadAuditLogs() {
            try {
                const params = new URLSearchParams({
                    limit: 10
                });
                
                if (currentCompany) params.append('empresa_id', currentCompany);
                
                const actionType = document.getElementById('actionTypeFilter').value;
                if (actionType) params.append('action_type', actionType);
                
                const riskLevel = document.getElementById('riskLevelFilter').value;
                if (riskLevel) params.append('risk_level', riskLevel);
                
                const response = await fetch(\`/api/audit/logs?\${params}\`);
                const data = await response.json();
                
                const container = document.getElementById('auditLogs');
                
                if (!data.logs || data.logs.length === 0) {
                    container.innerHTML = '<div>Nenhum log encontrado</div>';
                    return;
                }
                
                container.innerHTML = data.logs.map(log => \`
                    <div class="log-item \${log.risk_level}">
                        <div><strong>\${log.action_description}</strong></div>
                        <div class="log-meta">
                            \${log.actor_name} | \${log.action_type} | \${log.entity_type} |
                            \${new Date(log.executed_at).toLocaleString('pt-BR')}
                        </div>
                    </div>
                \`).join('');
                
            } catch (error) {
                console.error('Erro ao carregar logs:', error);
                document.getElementById('auditLogs').innerHTML = '<div class="error">Erro ao carregar logs</div>';
            }
        }
        
        // Carregar status de compliance
        async function loadComplianceStatus() {
            try {
                const params = new URLSearchParams();
                if (currentCompany) params.append('empresa_id', currentCompany);
                
                const response = await fetch(\`/api/compliance/status?\${params}\`);
                const data = await response.json();
                
                const container = document.getElementById('complianceStatus');
                
                if (!data.compliance_status || data.compliance_status.length === 0) {
                    container.innerHTML = '<div>Nenhuma verificação de compliance encontrada</div>';
                    return;
                }
                
                const overall = data.overall_score || 0;
                const overallClass = overall >= 80 ? 'success' : overall >= 60 ? 'warning' : 'critical';
                
                container.innerHTML = \`
                    <div class="stat-item">
                        <div class="stat-value \${overallClass}">\${overall.toFixed(0)}%</div>
                        <div class="stat-label">Score Geral de Compliance</div>
                    </div>
                    \${data.compliance_status.map(framework => \`
                        <div class="log-item">
                            <div><strong>\${framework.framework}</strong></div>
                            <div>Score: \${framework.latest_score}% | Status: \${framework.status}</div>
                            <div class="log-meta">
                                \${framework.assessments_count} avaliações | 
                                \${framework.high_risk_count} riscos altos
                            </div>
                        </div>
                    \`).join('')}
                \`;
                
            } catch (error) {
                console.error('Erro ao carregar compliance:', error);
                document.getElementById('complianceStatus').innerHTML = '<div class="error">Erro ao carregar status de compliance</div>';
            }
        }
        
        // Carregar relatórios
        async function loadReports() {
            try {
                const params = new URLSearchParams();
                if (currentCompany) params.append('empresa_id', currentCompany);
                
                const response = await fetch(\`/api/reports?\${params}\`);
                const data = await response.json();
                
                const container = document.getElementById('reportsSection');
                
                const reportButtons = [
                    { type: 'daily_summary', name: 'Resumo Diário' },
                    { type: 'security_report', name: 'Relatório de Segurança' },
                    { type: 'compliance_report', name: 'Relatório de Compliance' }
                ].map(report => \`
                    <button class="btn" onclick="generateReport('\${report.type}')">
                        📄 Gerar \${report.name}
                    </button>
                \`).join(' ');
                
                let reportsHtml = \`<div style="margin-bottom: 1rem;">\${reportButtons}</div>\`;
                
                if (data.reports && data.reports.length > 0) {
                    reportsHtml += '<h4>Relatórios Recentes:</h4>';
                    reportsHtml += data.reports.slice(0, 5).map(report => \`
                        <div class="log-item">
                            <div><strong>\${report.report_type}</strong></div>
                            <div>\${report.total_events} eventos | \${report.critical_events} críticos</div>
                            <div class="log-meta">
                                \${new Date(report.generated_at).toLocaleString('pt-BR')} |
                                \${Math.round(report.file_size_bytes / 1024)}KB
                            </div>
                        </div>
                    \`).join('');
                }
                
                container.innerHTML = reportsHtml;
                
            } catch (error) {
                console.error('Erro ao carregar relatórios:', error);
                document.getElementById('reportsSection').innerHTML = '<div class="error">Erro ao carregar relatórios</div>';
            }
        }
        
        // Gerar relatório
        async function generateReport(type) {
            try {
                const params = new URLSearchParams();
                if (currentCompany) params.append('empresa_id', currentCompany);
                
                const response = await fetch(\`/api/reports/generate/\${type}?\${params}\`);
                const data = await response.json();
                
                if (data.report) {
                    alert('Relatório gerado com sucesso!');
                    loadReports(); // Recarregar lista de relatórios
                } else {
                    alert('Erro ao gerar relatório');
                }
            } catch (error) {
                console.error('Erro ao gerar relatório:', error);
                alert('Erro ao gerar relatório');
            }
        }
        
        // Inicializar quando a página carregar
        document.addEventListener('DOMContentLoaded', initDashboard);
    </script>
</body>
</html>
        `;
    }
    
    start() {
        this.app.listen(this.port, () => {
            console.log(`🔍 Dashboard de Auditoria rodando em http://localhost:${this.port}`);
            console.log('📊 Acesse o dashboard para visualizar logs, relatórios e alertas de segurança');
        });
    }
}

// =====================================================
// EXECUÇÃO
// =====================================================

if (require.main === module) {
    const dashboard = new VCMAuditDashboard();
    dashboard.start();
}

module.exports = VCMAuditDashboard;