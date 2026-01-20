-- VCM Database Initialization Script
-- Cria tabelas necessárias para logs e cache local

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Tabela de logs de execução
CREATE TABLE IF NOT EXISTS execution_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    script_name VARCHAR(255) NOT NULL,
    company_id VARCHAR(100),
    execution_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) NOT NULL, -- 'running', 'completed', 'failed'
    output_file_path TEXT,
    error_message TEXT,
    duration_seconds INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de cache de processamento
CREATE TABLE IF NOT EXISTS processing_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cache_key VARCHAR(255) UNIQUE NOT NULL,
    cache_data JSONB,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de status de sistemas
CREATE TABLE IF NOT EXISTS system_status (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_name VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL, -- 'healthy', 'unhealthy', 'degraded'
    last_check TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de filas de processamento
CREATE TABLE IF NOT EXISTS processing_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    queue_name VARCHAR(100) NOT NULL,
    task_type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
    priority INTEGER DEFAULT 0,
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    scheduled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_execution_logs_company_script ON execution_logs(company_id, script_name);
CREATE INDEX IF NOT EXISTS idx_execution_logs_status ON execution_logs(status);
CREATE INDEX IF NOT EXISTS idx_execution_logs_created_at ON execution_logs(created_at);

CREATE INDEX IF NOT EXISTS idx_processing_cache_key ON processing_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_processing_cache_expires ON processing_cache(expires_at);

CREATE INDEX IF NOT EXISTS idx_system_status_service ON system_status(service_name);
CREATE INDEX IF NOT EXISTS idx_system_status_check ON system_status(last_check);

CREATE INDEX IF NOT EXISTS idx_queue_status ON processing_queue(status);
CREATE INDEX IF NOT EXISTS idx_queue_scheduled ON processing_queue(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_queue_priority ON processing_queue(priority);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_processing_cache_updated_at 
    BEFORE UPDATE ON processing_cache 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Função para limpar cache expirado
CREATE OR REPLACE FUNCTION clean_expired_cache()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM processing_cache WHERE expires_at < CURRENT_TIMESTAMP;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Função para limpar logs antigos (mais de 30 dias)
CREATE OR REPLACE FUNCTION clean_old_logs()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM execution_logs WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '30 days';
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Inserir dados iniciais de status
INSERT INTO system_status (service_name, status, metadata) VALUES
('vcm-backend', 'healthy', '{"version": "1.0.0"}'),
('vcm-dashboard', 'healthy', '{"version": "1.0.0"}')
ON CONFLICT DO NOTHING;

-- Comentários das tabelas
COMMENT ON TABLE execution_logs IS 'Logs de execução dos scripts de automação VCM';
COMMENT ON TABLE processing_cache IS 'Cache para dados de processamento temporários';
COMMENT ON TABLE system_status IS 'Status de saúde dos serviços do sistema';
COMMENT ON TABLE processing_queue IS 'Fila de tarefas para processamento assíncrono';

COMMIT;