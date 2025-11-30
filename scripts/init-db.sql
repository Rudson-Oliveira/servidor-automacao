-- Script de Inicialização do Banco de Dados
-- Executado automaticamente na primeira inicialização do PostgreSQL

-- Criar extensões úteis
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Configurar timezone
SET timezone = 'UTC';

-- Criar schema de desenvolvimento
CREATE SCHEMA IF NOT EXISTS dev;

-- Log de inicialização
DO $$
BEGIN
    RAISE NOTICE '✅ Banco de dados inicializado com sucesso';
    RAISE NOTICE '   Database: automacao_dev';
    RAISE NOTICE '   User: automacao';
    RAISE NOTICE '   Extensões: uuid-ossp, pg_trgm';
    RAISE NOTICE '   Timezone: UTC';
END $$;
