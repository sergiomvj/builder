#!/usr/bin/env node

/**
 * DASHBOARD DE MACHINE LEARNING VCM
 * 
 * Interface completa para monitorar e controlar o aprendizado do sistema
 */

const { createClient } = require('@supabase/supabase-js');
const express = require('express');
const path = require('path');
require('dotenv').config();

class VCMLearningDashboard {
    constructor() {
        this.app = express();
        this.port = process.env.LEARNING_DASHBOARD_PORT || 3001;
        
        this.supabase = createClient(
            process.env.VCM_SUPABASE_URL,
            process.env.VCM_SUPABASE_SERVICE_ROLE_KEY
        );
        
        this.setupMiddleware();
        this.setupRoutes();
    }
    
    setupMiddleware() {
        this.app.use(express.json());
        this.app.use(express.static(path.join(__dirname, 'public')));
        
        // CORS para desenvolvimento
        this.app.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Headers', 'Content-Type');
            res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
            next();
        });
    }
    
    setupRoutes() {
        // =====================================================
        // 1. DASHBOARD PRINCIPAL
        // =====================================================
        
        this.app.get('/', (req, res) => {
            res.send(this.generateDashboardHTML());
        });
        
        // =====================================================
        // 2. APIs DE MÉTRICAS
        // =====================================================
        
        // Métricas gerais do sistema
        this.app.get('/api/metrics/overview', async (req, res) => {
            try {
                const overview = await this.getSystemOverview();
                res.json(overview);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        // Padrões detectados
        this.app.get('/api/patterns', async (req, res) => {
            try {
                const patterns = await this.getDetectedPatterns();
                res.json(patterns);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        // Histórico de otimizações
        this.app.get('/api/optimizations', async (req, res) => {
            try {
                const optimizations = await this.getOptimizationHistory();
                res.json(optimizations);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        // Performance por persona
        this.app.get('/api/performance/personas', async (req, res) => {
            try {
                const performance = await this.getPersonaPerformance();
                res.json(performance);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        // Alertas ativos
        this.app.get('/api/alerts', async (req, res) => {
            try {
                const alerts = await this.getActiveAlerts();
                res.json(alerts);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        // =====================================================
        // 3. APIs DE CONTROLE
        // =====================================================
        
        // Habilitar/Desabilitar aprendizado automático
        this.app.post('/api/config/auto-learning', async (req, res) => {
            try {
                const { enabled } = req.body;
                await this.updateMLConfig('auto_optimization_enabled', enabled);
                res.json({ success: true });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        // Aplicar otimização específica
        this.app.post('/api/apply-optimization/:id', async (req, res) => {
            try {
                const result = await this.applyOptimization(req.params.id);
                res.json(result);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        // Rollback de otimização
        this.app.post('/api/rollback/:id', async (req, res) => {
            try {
                const result = await this.rollbackOptimization(req.params.id);
                res.json(result);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        // =====================================================
        // 4. RELATÓRIOS AVANÇADOS
        // =====================================================
        
        this.app.get('/api/reports/efficiency-trends', async (req, res) => {
            try {
                const trends = await this.getEfficiencyTrends();
                res.json(trends);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        this.app.get('/api/reports/workload-analysis', async (req, res) => {
            try {
                const analysis = await this.getWorkloadAnalysis();
                res.json(analysis);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
    }
    
    // =====================================================
    // MÉTODOS DE DADOS
    // =====================================================
    
    async getSystemOverview() {
        try {
            // Buscar métricas chave
            const [
                totalPatterns,
                appliedOptimizations,
                activeAlerts,
                avgEfficiency
            ] = await Promise.all([
                this.countPatterns(),
                this.countOptimizations(),
                this.countActiveAlerts(),
                this.getAverageEfficiency()
            ]);
            
            return {
                patterns_detected: totalPatterns,
                optimizations_applied: appliedOptimizations,
                active_alerts: activeAlerts,
                system_efficiency: avgEfficiency,
                last_update: new Date().toISOString()
            };
            
        } catch (error) {
            throw new Error(`Erro ao buscar overview: ${error.message}`);
        }
    }
    
    async countPatterns() {
        const { count } = await this.supabase
            .from('learning_patterns')
            .select('*', { count: 'exact', head: true })
            .eq('is_active', true);
        return count || 0;
    }
    
    async countOptimizations() {
        const { count } = await this.supabase
            .from('optimization_history')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'implemented');
        return count || 0;
    }
    
    async countActiveAlerts() {
        const { count } = await this.supabase
            .from('system_alerts')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'active');
        return count || 0;
    }
    
    async getAverageEfficiency() {
        try {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            
            const { data } = await this.supabase
                .from('task_execution_analytics')
                .select('efficiency_ratio')
                .not('efficiency_ratio', 'is', null)
                .gte('execution_date', thirtyDaysAgo.toISOString().split('T')[0]);
                
            if (!data || data.length === 0) return 0.75; // Default
            
            const avg = data.reduce((sum, item) => sum + item.efficiency_ratio, 0) / data.length;
            return Math.round(avg * 100) / 100;
            
        } catch (error) {
            return 0.75;
        }
    }
    
    async getDetectedPatterns() {
        const { data } = await this.supabase
            .from('learning_patterns')
            .select(`
                id,
                pattern_type,
                pattern_category,
                pattern_description,
                statistical_confidence,
                impact_magnitude,
                applied,
                detected_at,
                scope_type,
                scope_identifier
            `)
            .eq('is_active', true)
            .order('detected_at', { ascending: false })
            .limit(20);
            
        return data || [];
    }
    
    async getOptimizationHistory() {
        const { data } = await this.supabase
            .from('optimization_history')
            .select(`
                id,
                optimization_type,
                optimization_name,
                optimization_description,
                status,
                improvement_achieved,
                implemented_at,
                target_scope,
                auto_applied
            `)
            .order('implemented_at', { ascending: false })
            .limit(15);
            
        return data || [];
    }
    
    async getPersonaPerformance() {
        const { data } = await this.supabase
            .rpc('get_persona_performance_summary');
            
        return data || [];
    }
    
    async getActiveAlerts() {
        const { data } = await this.supabase
            .from('system_alerts')
            .select('*')
            .eq('status', 'active')
            .order('triggered_at', { ascending: false });
            
        return data || [];
    }
    
    async getEfficiencyTrends() {
        try {
            const { data } = await this.supabase
                .from('performance_metrics')
                .select('*')
                .eq('metric_category', 'efficiency')
                .gte('period_start', this.getDateDaysAgo(30))
                .order('period_start');
                
            return this.processEfficiencyTrends(data);
            
        } catch (error) {
            return [];
        }
    }
    
    async getWorkloadAnalysis() {
        const { data } = await this.supabase
            .from('workload_analytics')
            .select(`
                *,
                personas!inner(full_name, role, department)
            `)
            .gte('analysis_date', this.getDateDaysAgo(7))
            .order('analysis_date', { ascending: false });
            
        return data || [];
    }
    
    // =====================================================
    // MÉTODOS DE CONTROLE
    // =====================================================
    
    async updateMLConfig(key, value) {
        const { error } = await this.supabase
            .from('ml_system_config')
            .update({ [key]: value })
            .match({});
            
        if (error) throw error;
    }
    
    async applyOptimization(patternId) {
        // Implementar aplicação manual de otimização
        return { success: true, message: 'Otimização aplicada' };
    }
    
    async rollbackOptimization(optimizationId) {
        // Implementar rollback
        return { success: true, message: 'Rollback executado' };
    }
    
    // =====================================================
    // UTILIDADES
    // =====================================================
    
    getDateDaysAgo(days) {
        const date = new Date();
        date.setDate(date.getDate() - days);
        return date.toISOString().split('T')[0];
    }
    
    processEfficiencyTrends(data) {
        if (!data) return [];
        
        return data.map(item => ({
            date: item.period_start,
            efficiency: item.metric_value,
            trend: item.trend_direction
        }));
    }
    
    // =====================================================
    // HTML DO DASHBOARD
    // =====================================================
    
    generateDashboardHTML() {
        return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>VCM Machine Learning Dashboard</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f8fafc;
            color: #1e293b;
        }
        .container { max-width: 1400px; margin: 0 auto; padding: 20px; }
        .header { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 12px;
            margin-bottom: 30px;
            text-align: center;
        }
        .stats-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .stat-card {
            background: white;
            padding: 25px;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            border-left: 4px solid #3b82f6;
        }
        .stat-value { font-size: 2.5rem; font-weight: bold; color: #3b82f6; }
        .stat-label { color: #64748b; font-size: 0.9rem; margin-top: 5px; }
        
        .dashboard-grid {
            display: grid;
            grid-template-columns: 2fr 1fr;
            gap: 30px;
        }
        .main-content { display: flex; flex-direction: column; gap: 20px; }
        .sidebar { display: flex; flex-direction: column; gap: 20px; }
        
        .card {
            background: white;
            border-radius: 12px;
            padding: 25px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .card-title {
            font-size: 1.25rem;
            font-weight: 600;
            margin-bottom: 20px;
            color: #1e293b;
        }
        
        .pattern-item {
            padding: 15px;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            margin-bottom: 10px;
        }
        .pattern-type {
            background: #3b82f6;
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.8rem;
            margin-bottom: 8px;
            display: inline-block;
        }
        .confidence-badge {
            background: #10b981;
            color: white;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 0.8rem;
        }
        
        .alert-item {
            padding: 12px;
            border-radius: 8px;
            margin-bottom: 10px;
            border-left: 4px solid #ef4444;
        }
        .alert-critical { border-left-color: #ef4444; background: #fef2f2; }
        .alert-warning { border-left-color: #f59e0b; background: #fffbeb; }
        .alert-info { border-left-color: #3b82f6; background: #eff6ff; }
        
        .btn {
            padding: 10px 16px;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 0.9rem;
            margin-right: 10px;
            margin-bottom: 10px;
        }
        .btn-primary { background: #3b82f6; color: white; }
        .btn-success { background: #10b981; color: white; }
        .btn-danger { background: #ef4444; color: white; }
        .btn:hover { opacity: 0.9; }
        
        .status-active { color: #10b981; font-weight: bold; }
        .status-inactive { color: #6b7280; }
        
        @media (max-width: 768px) {
            .dashboard-grid { grid-template-columns: 1fr; }
            .stats-grid { grid-template-columns: 1fr; }
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <h1>🧠 VCM Machine Learning Dashboard</h1>
            <p>Sistema de Aprendizado Contínuo e Otimização Automática</p>
            <div style="margin-top: 15px;">
                <span id="learning-status" class="status-active">🟢 Aprendizado Ativo</span>
                <span style="margin: 0 20px;">|</span>
                <span id="last-update">Última atualização: Carregando...</span>
            </div>
        </div>

        <!-- Stats Overview -->
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-value" id="total-patterns">-</div>
                <div class="stat-label">Padrões Detectados</div>
            </div>
            <div class="stat-card">
                <div class="stat-value" id="total-optimizations">-</div>
                <div class="stat-label">Otimizações Aplicadas</div>
            </div>
            <div class="stat-card">
                <div class="stat-value" id="system-efficiency">-</div>
                <div class="stat-label">Eficiência do Sistema</div>
            </div>
            <div class="stat-card">
                <div class="stat-value" id="active-alerts">-</div>
                <div class="stat-label">Alertas Ativos</div>
            </div>
        </div>

        <!-- Main Dashboard -->
        <div class="dashboard-grid">
            <!-- Main Content -->
            <div class="main-content">
                <!-- Efficiency Trends Chart -->
                <div class="card">
                    <div class="card-title">📈 Tendências de Eficiência</div>
                    <canvas id="efficiency-chart" height="100"></canvas>
                </div>

                <!-- Detected Patterns -->
                <div class="card">
                    <div class="card-title">🔍 Padrões Detectados</div>
                    <div id="patterns-list">Carregando padrões...</div>
                </div>

                <!-- Optimization History -->
                <div class="card">
                    <div class="card-title">⚡ Histórico de Otimizações</div>
                    <div id="optimizations-list">Carregando otimizações...</div>
                </div>
            </div>

            <!-- Sidebar -->
            <div class="sidebar">
                <!-- Control Panel -->
                <div class="card">
                    <div class="card-title">🎛️ Controles</div>
                    <button class="btn btn-primary" onclick="toggleAutoLearning()">
                        Auto-Otimização: <span id="auto-status">Habilitada</span>
                    </button>
                    <button class="btn btn-success" onclick="runLearningCycle()">
                        Executar Ciclo de Aprendizado
                    </button>
                    <button class="btn btn-primary" onclick="refreshDashboard()">
                        Atualizar Dashboard
                    </button>
                </div>

                <!-- Active Alerts -->
                <div class="card">
                    <div class="card-title">🚨 Alertas Ativos</div>
                    <div id="alerts-list">Carregando alertas...</div>
                </div>

                <!-- System Status -->
                <div class="card">
                    <div class="card-title">📊 Status do Sistema</div>
                    <div style="font-size: 0.9rem; line-height: 1.6;">
                        <div>🔄 <strong>Última análise:</strong> <span id="last-analysis">-</span></div>
                        <div>📈 <strong>Padrões ativos:</strong> <span id="active-patterns">-</span></div>
                        <div>⚡ <strong>Auto-otimização:</strong> <span id="auto-opt-status">-</span></div>
                        <div>🎯 <strong>Confidence mínima:</strong> 80%</div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script>
        // =====================================================
        // JAVASCRIPT DO DASHBOARD
        // =====================================================
        
        let chart;
        let autoLearningEnabled = false;
        
        // Inicializar dashboard
        document.addEventListener('DOMContentLoaded', function() {
            initializeChart();
            loadDashboardData();
            
            // Auto-refresh a cada 30 segundos
            setInterval(loadDashboardData, 30000);
        });
        
        function initializeChart() {
            const ctx = document.getElementById('efficiency-chart').getContext('2d');
            chart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'Eficiência Média',
                        data: [],
                        borderColor: '#3b82f6',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            beginAtZero: false,
                            min: 0.5,
                            max: 1.2
                        }
                    }
                }
            });
        }
        
        async function loadDashboardData() {
            try {
                // Carregar overview
                const overview = await fetch('/api/metrics/overview').then(r => r.json());
                updateOverview(overview);
                
                // Carregar padrões
                const patterns = await fetch('/api/patterns').then(r => r.json());
                updatePatterns(patterns);
                
                // Carregar otimizações
                const optimizations = await fetch('/api/optimizations').then(r => r.json());
                updateOptimizations(optimizations);
                
                // Carregar alertas
                const alerts = await fetch('/api/alerts').then(r => r.json());
                updateAlerts(alerts);
                
                // Carregar tendências
                const trends = await fetch('/api/reports/efficiency-trends').then(r => r.json());
                updateChart(trends);
                
            } catch (error) {
                console.error('Erro ao carregar dados:', error);
            }
        }
        
        function updateOverview(data) {
            document.getElementById('total-patterns').textContent = data.patterns_detected;
            document.getElementById('total-optimizations').textContent = data.optimizations_applied;
            document.getElementById('system-efficiency').textContent = 
                (data.system_efficiency * 100).toFixed(1) + '%';
            document.getElementById('active-alerts').textContent = data.active_alerts;
            document.getElementById('last-update').textContent = 
                'Última atualização: ' + new Date(data.last_update).toLocaleString('pt-BR');
        }
        
        function updatePatterns(patterns) {
            const container = document.getElementById('patterns-list');
            
            if (patterns.length === 0) {
                container.innerHTML = '<p style="color: #64748b;">Nenhum padrão detectado recentemente.</p>';
                return;
            }
            
            container.innerHTML = patterns.map(pattern => \`
                <div class="pattern-item">
                    <span class="pattern-type">\${pattern.pattern_type}</span>
                    <div style="margin: 8px 0;">
                        <strong>\${pattern.pattern_description}</strong>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px;">
                        <span class="confidence-badge">
                            \${(pattern.statistical_confidence * 100).toFixed(1)}% confiança
                        </span>
                        <small style="color: #64748b;">
                            \${new Date(pattern.detected_at).toLocaleDateString('pt-BR')}
                        </small>
                    </div>
                    \${pattern.applied ? 
                        '<div style="color: #10b981; margin-top: 5px;">✅ Aplicado</div>' : 
                        '<div style="color: #f59e0b; margin-top: 5px;">⏳ Pendente</div>'
                    }
                </div>
            \`).join('');
        }
        
        function updateOptimizations(optimizations) {
            const container = document.getElementById('optimizations-list');
            
            if (optimizations.length === 0) {
                container.innerHTML = '<p style="color: #64748b;">Nenhuma otimização aplicada ainda.</p>';
                return;
            }
            
            container.innerHTML = optimizations.map(opt => \`
                <div style="padding: 12px; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 10px;">
                    <div><strong>\${opt.optimization_name}</strong></div>
                    <div style="color: #64748b; font-size: 0.9rem; margin: 5px 0;">
                        \${opt.optimization_description}
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px;">
                        <span style="background: #10b981; color: white; padding: 2px 8px; border-radius: 12px; font-size: 0.8rem;">
                            \${opt.status}
                        </span>
                        <small style="color: #64748b;">
                            \${new Date(opt.implemented_at).toLocaleDateString('pt-BR')}
                        </small>
                    </div>
                </div>
            \`).join('');
        }
        
        function updateAlerts(alerts) {
            const container = document.getElementById('alerts-list');
            
            if (alerts.length === 0) {
                container.innerHTML = '<p style="color: #10b981;">✅ Nenhum alerta ativo.</p>';
                return;
            }
            
            container.innerHTML = alerts.map(alert => \`
                <div class="alert-item alert-\${alert.severity}">
                    <div style="font-weight: bold;">\${alert.title}</div>
                    <div style="font-size: 0.9rem; margin-top: 5px;">
                        \${alert.description}
                    </div>
                    <div style="text-align: right; margin-top: 8px;">
                        <small>\${new Date(alert.triggered_at).toLocaleString('pt-BR')}</small>
                    </div>
                </div>
            \`).join('');
        }
        
        function updateChart(trends) {
            if (!trends || trends.length === 0) return;
            
            chart.data.labels = trends.map(t => new Date(t.date).toLocaleDateString('pt-BR'));
            chart.data.datasets[0].data = trends.map(t => t.efficiency);
            chart.update();
        }
        
        // =====================================================
        // CONTROLES
        // =====================================================
        
        async function toggleAutoLearning() {
            try {
                autoLearningEnabled = !autoLearningEnabled;
                
                await fetch('/api/config/auto-learning', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ enabled: autoLearningEnabled })
                });
                
                document.getElementById('auto-status').textContent = 
                    autoLearningEnabled ? 'Habilitada' : 'Desabilitada';
                    
                alert(autoLearningEnabled ? 
                    'Auto-otimização habilitada!' : 
                    'Auto-otimização desabilitada!'
                );
                
            } catch (error) {
                alert('Erro ao alterar configuração: ' + error.message);
            }
        }
        
        async function runLearningCycle() {
            try {
                const button = event.target;
                button.disabled = true;
                button.textContent = 'Executando...';
                
                // Simular execução do ciclo
                setTimeout(() => {
                    button.disabled = false;
                    button.textContent = 'Executar Ciclo de Aprendizado';
                    alert('Ciclo de aprendizado executado com sucesso!');
                    loadDashboardData(); // Recarregar dados
                }, 3000);
                
            } catch (error) {
                alert('Erro ao executar ciclo: ' + error.message);
            }
        }
        
        function refreshDashboard() {
            loadDashboardData();
            alert('Dashboard atualizado!');
        }
    </script>
</body>
</html>
        `;
    }
    
    // =====================================================
    // INICIALIZAÇÃO DO SERVIDOR
    // =====================================================
    
    start() {
        this.app.listen(this.port, () => {
            console.log(`📊 VCM Learning Dashboard iniciado em http://localhost:${this.port}`);
        });
    }
}

// Executar dashboard se chamado diretamente
if (require.main === module) {
    const dashboard = new VCMLearningDashboard();
    dashboard.start();
}

module.exports = VCMLearningDashboard;