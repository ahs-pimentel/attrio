-- Script para inserir/atualizar usuarios da aplicacao Attrio
-- Executar dentro do container PostgreSQL

-- Limpiar usuarios existentes (opcional, descomente se necessario)
-- DELETE FROM users;

-- Inserir usuários (usando INSERT ... ON CONFLICT para atualizar se já existirem)
INSERT INTO users (id, supabase_user_id, email, name, role, created_at, updated_at)
VALUES
  (gen_random_uuid(), 'e1ecb822-a410-4acb-a101-6d52e02c2288', 'admin@attrio.dev', 'Admin', 'SAAS_ADMIN', NOW(), NOW()),
  (gen_random_uuid(), '9c2bf58e-0d48-4149-82af-3b1eaefdf31a', 'ahspimentel@gmail.com', 'Angelo Pimentel', 'RESIDENT', NOW(), NOW()),
  (gen_random_uuid(), 'c0ad6452-142f-4279-b938-bfa229877e9a', 'angelo@attrio.dev', 'Angelo Pimentel', 'SAAS_ADMIN', NOW(), NOW()),
  (gen_random_uuid(), '471895b8-c547-4179-b615-3e4a4cf50540a', 'carolfsoares17@gmail.com', 'Carolina Ferreira Soares', 'RESIDENT', NOW(), NOW()),
  (gen_random_uuid(), '16016764-e4e8-4124-b751-a85dee98a776', 'crisska@gmail.com', 'Cristiane Lopes Costa', 'RESIDENT', NOW(), NOW()),
  (gen_random_uuid(), 'baca4348-52fb-42d9-9122-f6f442986d01', 'enzocmsouza@gmail.com', 'Enzo Chaves Medeiros de Souza', 'RESIDENT', NOW(), NOW()),
  (gen_random_uuid(), '8e6208c4-b153-4930-9485-e898bb0afefa', 'gabriela@attrio.dev', 'Gabriela', 'RESIDENT', NOW(), NOW()),
  (gen_random_uuid(), '000de5d3-fc82-4618-86f4-cfcfb1dd7cd5', 'julianasboechat@gmail.com', 'Juliana dos Santos Boechar', 'RESIDENT', NOW(), NOW()),
  (gen_random_uuid(), 'b104e072-b99c-40f2-bcdc-b1c374d510a3', 'lianammello@gmail.com', 'Liana Mattos de Mello Tavares', 'RESIDENT', NOW(), NOW()),
  (gen_random_uuid(), '3a4d65f8-3203-49a0-a971-3f234444cca2', 'luisguilherme.corretor@gmail.com', 'Luis Guilherme', 'RESIDENT', NOW(), NOW()),
  (gen_random_uuid(), '7f36627d-39b2-44f6-b938-7ed9d91b484c', 'maria.vilma@gmail.com', 'Maria Vilma Pereira Gomes', 'RESIDENT', NOW(), NOW()),
  (gen_random_uuid(), '0d7135c5-3f2c-4aa2-8f6c-e44dea448a5b', 'thais_cavalcanti@yahoo.com.br', 'Thaís Cavalcanti de Assis', 'RESIDENT', NOW(), NOW())
ON CONFLICT (supabase_user_id) DO UPDATE SET
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  updated_at = NOW();

-- Verificar usuarios inseridos
SELECT id, supabase_user_id, email, name, role FROM users ORDER BY created_at DESC;
