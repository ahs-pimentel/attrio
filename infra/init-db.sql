-- Script de inicializacao do banco de dados Attrio
-- Este script e executado apenas na primeira criacao do container

-- Criar extensao UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Log de inicializacao
DO $$
BEGIN
  RAISE NOTICE 'Banco de dados Attrio inicializado com sucesso!';
END $$;
