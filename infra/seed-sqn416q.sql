DO $$
DECLARE
  v_tenant_id UUID;
  v_unit_id UUID;
BEGIN
  -- =============================================
  -- 1. CRIAR CONDOMINIO (TENANT)
  -- =============================================
  INSERT INTO tenants (id, name, slug, active, created_at, updated_at)
  VALUES (gen_random_uuid(), 'Condomínio Bloco Q SQN 416', 'condominio-bloco-q-sqn-416', true, now(), now())
  RETURNING id INTO v_tenant_id;

  RAISE NOTICE 'Tenant criado: %', v_tenant_id;

  -- =============================================
  -- 2. UNIDADE 100 (TERREO)
  -- =============================================
  INSERT INTO units (id, tenant_id, block, number, identifier, status, created_at, updated_at)
  VALUES (gen_random_uuid(), v_tenant_id, 'Q', '100', 'Q-100', 'ACTIVE', now(), now())
  RETURNING id INTO v_unit_id;

  INSERT INTO residents (id, tenant_id, unit_id, type, full_name, email, phone, cpf, status, data_consent, created_at, updated_at)
  VALUES (gen_random_uuid(), v_tenant_id, v_unit_id, 'TENANT', 'Cleyton Feitosa Pereira', 'cleyton_feitosa@hotmail.com', '61981032046', '069.302.954-42', 'ACTIVE', true, now(), now());

  -- =============================================
  -- 3. UNIDADE 101
  -- =============================================
  INSERT INTO units (id, tenant_id, block, number, identifier, status, created_at, updated_at)
  VALUES (gen_random_uuid(), v_tenant_id, 'Q', '101', 'Q-101', 'ACTIVE', now(), now())
  RETURNING id INTO v_unit_id;

  INSERT INTO residents (id, tenant_id, unit_id, type, full_name, email, phone, cpf, status, data_consent, created_at, updated_at)
  VALUES (gen_random_uuid(), v_tenant_id, v_unit_id, 'TENANT', 'Tikre Brasil', 'condominio.moniimoveis@gmail.com', '61981787576', NULL, 'ACTIVE', true, now(), now());

  INSERT INTO residents (id, tenant_id, unit_id, type, full_name, email, phone, cpf, status, data_consent, created_at, updated_at)
  VALUES (gen_random_uuid(), v_tenant_id, v_unit_id, 'OWNER', 'Carmen Rezende do Vale', 'dovalecarmen@hotmail.com', '92981133064', '214.554.651-00', 'ACTIVE', true, now(), now());

  -- =============================================
  -- 4. UNIDADE 102
  -- =============================================
  INSERT INTO units (id, tenant_id, block, number, identifier, status, created_at, updated_at)
  VALUES (gen_random_uuid(), v_tenant_id, 'Q', '102', 'Q-102', 'ACTIVE', now(), now())
  RETURNING id INTO v_unit_id;

  INSERT INTO residents (id, tenant_id, unit_id, type, full_name, email, phone, cpf, status, data_consent, created_at, updated_at)
  VALUES (gen_random_uuid(), v_tenant_id, v_unit_id, 'OWNER', 'Juliana dos Santos Boechar', 'julianasboechat@gmail.com', NULL, '015.575.151-40', 'ACTIVE', true, now(), now());

  -- =============================================
  -- 5. UNIDADE 103
  -- =============================================
  INSERT INTO units (id, tenant_id, block, number, identifier, status, created_at, updated_at)
  VALUES (gen_random_uuid(), v_tenant_id, 'Q', '103', 'Q-103', 'ACTIVE', now(), now())
  RETURNING id INTO v_unit_id;

  INSERT INTO residents (id, tenant_id, unit_id, type, full_name, email, phone, cpf, status, data_consent, created_at, updated_at)
  VALUES (gen_random_uuid(), v_tenant_id, v_unit_id, 'OWNER', 'Liana Mattos de Mello Tavares', 'lianammello@gmail.com', NULL, '309.832.821-53', 'ACTIVE', true, now(), now());

  -- =============================================
  -- 6. UNIDADE 104
  -- =============================================
  INSERT INTO units (id, tenant_id, block, number, identifier, status, created_at, updated_at)
  VALUES (gen_random_uuid(), v_tenant_id, 'Q', '104', 'Q-104', 'ACTIVE', now(), now())
  RETURNING id INTO v_unit_id;

  INSERT INTO residents (id, tenant_id, unit_id, type, full_name, email, phone, cpf, status, data_consent, created_at, updated_at)
  VALUES (gen_random_uuid(), v_tenant_id, v_unit_id, 'OWNER', 'Valeriana Grossi', 'valerianagrossi5@gmail.com', '61993332753', '505.966.241-15', 'ACTIVE', true, now(), now());

  INSERT INTO residents (id, tenant_id, unit_id, type, full_name, email, phone, cpf, status, data_consent, created_at, updated_at)
  VALUES (gen_random_uuid(), v_tenant_id, v_unit_id, 'TENANT', 'Camilla Gurgel Ibiapina Tupinambá', 'camilla.ibiapina@gmail.com', NULL, '839.338.083-91', 'ACTIVE', true, now(), now());

  -- =============================================
  -- 7. UNIDADE 105
  -- =============================================
  INSERT INTO units (id, tenant_id, block, number, identifier, status, created_at, updated_at)
  VALUES (gen_random_uuid(), v_tenant_id, 'Q', '105', 'Q-105', 'ACTIVE', now(), now())
  RETURNING id INTO v_unit_id;

  INSERT INTO residents (id, tenant_id, unit_id, type, full_name, email, phone, cpf, status, data_consent, created_at, updated_at)
  VALUES (gen_random_uuid(), v_tenant_id, v_unit_id, 'TENANT', 'Maria Amélia de Souza E. Ferreira', 'mamelias13@gmail.com', '61983133000', '612.680.895-91', 'ACTIVE', true, now(), now());

  INSERT INTO residents (id, tenant_id, unit_id, type, full_name, email, phone, cpf, status, data_consent, created_at, updated_at)
  VALUES (gen_random_uuid(), v_tenant_id, v_unit_id, 'OWNER', 'Marcelo F. Zuqui Lisboa', 'marcelogl220@gmail.com', '6184487558', '512.948.771-00', 'ACTIVE', true, now(), now());

  -- =============================================
  -- 8. UNIDADE 106
  -- =============================================
  INSERT INTO units (id, tenant_id, block, number, identifier, status, created_at, updated_at)
  VALUES (gen_random_uuid(), v_tenant_id, 'Q', '106', 'Q-106', 'ACTIVE', now(), now())
  RETURNING id INTO v_unit_id;

  INSERT INTO residents (id, tenant_id, unit_id, type, full_name, email, phone, cpf, status, data_consent, created_at, updated_at)
  VALUES (gen_random_uuid(), v_tenant_id, v_unit_id, 'OWNER', 'Maria Clara', 'claritcha.c@gmail.com', '61999010926', '375.018.104-78', 'ACTIVE', true, now(), now());

  -- =============================================
  -- 9. UNIDADE 107
  -- =============================================
  INSERT INTO units (id, tenant_id, block, number, identifier, status, created_at, updated_at)
  VALUES (gen_random_uuid(), v_tenant_id, 'Q', '107', 'Q-107', 'ACTIVE', now(), now())
  RETURNING id INTO v_unit_id;

  INSERT INTO residents (id, tenant_id, unit_id, type, full_name, email, phone, cpf, status, data_consent, created_at, updated_at)
  VALUES (gen_random_uuid(), v_tenant_id, v_unit_id, 'OWNER', 'Enzo Chaves Medeiros de Souza', 'enzocmsouza@gmail.com', NULL, '049.815.091-70', 'ACTIVE', true, now(), now());

  -- =============================================
  -- 10. UNIDADE 108
  -- =============================================
  INSERT INTO units (id, tenant_id, block, number, identifier, status, created_at, updated_at)
  VALUES (gen_random_uuid(), v_tenant_id, 'Q', '108', 'Q-108', 'ACTIVE', now(), now())
  RETURNING id INTO v_unit_id;

  INSERT INTO residents (id, tenant_id, unit_id, type, full_name, email, phone, cpf, status, data_consent, created_at, updated_at)
  VALUES (gen_random_uuid(), v_tenant_id, v_unit_id, 'OWNER', 'Nilda Almada Cruz', NULL, '61992737272', '004.371.901-53', 'ACTIVE', true, now(), now());

  -- =============================================
  -- 11. UNIDADE 201
  -- =============================================
  INSERT INTO units (id, tenant_id, block, number, identifier, status, created_at, updated_at)
  VALUES (gen_random_uuid(), v_tenant_id, 'Q', '201', 'Q-201', 'ACTIVE', now(), now())
  RETURNING id INTO v_unit_id;

  INSERT INTO residents (id, tenant_id, unit_id, type, full_name, email, phone, cpf, rg, status, data_consent, created_at, updated_at)
  VALUES (gen_random_uuid(), v_tenant_id, v_unit_id, 'OWNER', 'Thaís Cavalcanti de Assis', 'thais_cavalcanti@yahoo.com.br', '61981349179', '287.724.071-15', '583809', 'ACTIVE', true, now(), now());

  INSERT INTO residents (id, tenant_id, unit_id, type, full_name, email, phone, cpf, status, data_consent, created_at, updated_at)
  VALUES (gen_random_uuid(), v_tenant_id, v_unit_id, 'TENANT', 'Hugo Guimarães Carneiro', NULL, NULL, '720.316.381-49', 'ACTIVE', true, now(), now());

  -- =============================================
  -- 12. UNIDADE 202
  -- =============================================
  INSERT INTO units (id, tenant_id, block, number, identifier, status, created_at, updated_at)
  VALUES (gen_random_uuid(), v_tenant_id, 'Q', '202', 'Q-202', 'ACTIVE', now(), now())
  RETURNING id INTO v_unit_id;

  INSERT INTO residents (id, tenant_id, unit_id, type, full_name, email, phone, cpf, status, data_consent, created_at, updated_at)
  VALUES (gen_random_uuid(), v_tenant_id, v_unit_id, 'OWNER', 'Davi Almeida Santos', 'dalvis@ig.com.br', '61999212144', '269.891.825-04', 'ACTIVE', true, now(), now());

  -- =============================================
  -- 13. UNIDADE 203
  -- =============================================
  INSERT INTO units (id, tenant_id, block, number, identifier, status, created_at, updated_at)
  VALUES (gen_random_uuid(), v_tenant_id, 'Q', '203', 'Q-203', 'ACTIVE', now(), now())
  RETURNING id INTO v_unit_id;

  INSERT INTO residents (id, tenant_id, unit_id, type, full_name, email, phone, cpf, status, data_consent, created_at, updated_at)
  VALUES (gen_random_uuid(), v_tenant_id, v_unit_id, 'OWNER', 'Maria Vilma Pereira Gomes', 'maria.vilma@gmail.com', '6196813596', '101.611.201-72', 'ACTIVE', true, now(), now());

  -- =============================================
  -- 14. UNIDADE 204
  -- =============================================
  INSERT INTO units (id, tenant_id, block, number, identifier, status, created_at, updated_at)
  VALUES (gen_random_uuid(), v_tenant_id, 'Q', '204', 'Q-204', 'ACTIVE', now(), now())
  RETURNING id INTO v_unit_id;

  INSERT INTO residents (id, tenant_id, unit_id, type, full_name, email, phone, cpf, status, data_consent, created_at, updated_at)
  VALUES (gen_random_uuid(), v_tenant_id, v_unit_id, 'OWNER', 'Cristiane Lopes Costa', 'crisska@gmail.com', '61981500837', '000.181.811-20', 'ACTIVE', true, now(), now());

  INSERT INTO residents (id, tenant_id, unit_id, type, full_name, email, phone, cpf, rg, status, data_consent, created_at, updated_at)
  VALUES (gen_random_uuid(), v_tenant_id, v_unit_id, 'OWNER', 'Peter Wimmer', 'peterwimmer1983@gmail.com', '61983285465', '091.777.057-93', '0116952557', 'ACTIVE', true, now(), now());

  -- =============================================
  -- 15. UNIDADE 205
  -- =============================================
  INSERT INTO units (id, tenant_id, block, number, identifier, status, created_at, updated_at)
  VALUES (gen_random_uuid(), v_tenant_id, 'Q', '205', 'Q-205', 'ACTIVE', now(), now())
  RETURNING id INTO v_unit_id;

  INSERT INTO residents (id, tenant_id, unit_id, type, full_name, email, phone, cpf, rg, status, data_consent, created_at, updated_at)
  VALUES (gen_random_uuid(), v_tenant_id, v_unit_id, 'OWNER', 'Bruno de Oliveira Pinheiro', 'brunodop@gmail.com', '61999947292', '052.768.577-17', '109833616', 'ACTIVE', true, now(), now());

  -- =============================================
  -- 16. UNIDADE 206
  -- =============================================
  INSERT INTO units (id, tenant_id, block, number, identifier, status, created_at, updated_at)
  VALUES (gen_random_uuid(), v_tenant_id, 'Q', '206', 'Q-206', 'ACTIVE', now(), now())
  RETURNING id INTO v_unit_id;

  INSERT INTO residents (id, tenant_id, unit_id, type, full_name, email, phone, cpf, status, data_consent, created_at, updated_at)
  VALUES (gen_random_uuid(), v_tenant_id, v_unit_id, 'TENANT', 'Fabio Henrique de Medeiros', NULL, '61981043228', NULL, 'ACTIVE', true, now(), now());

  INSERT INTO residents (id, tenant_id, unit_id, type, full_name, email, phone, cpf, status, data_consent, created_at, updated_at)
  VALUES (gen_random_uuid(), v_tenant_id, v_unit_id, 'OWNER', 'Marcelo Batista da Silva', 'marcelobasilva2005@hotmail.com', '6192279000', '334.302.251-91', 'ACTIVE', true, now(), now());

  -- =============================================
  -- 17. UNIDADE 207
  -- =============================================
  INSERT INTO units (id, tenant_id, block, number, identifier, status, created_at, updated_at)
  VALUES (gen_random_uuid(), v_tenant_id, 'Q', '207', 'Q-207', 'ACTIVE', now(), now())
  RETURNING id INTO v_unit_id;

  INSERT INTO residents (id, tenant_id, unit_id, type, full_name, email, phone, cpf, rg, status, data_consent, created_at, updated_at)
  VALUES (gen_random_uuid(), v_tenant_id, v_unit_id, 'OWNER', 'Carolina Ferreira Soares', 'carolfsoares17@gmail.com', '61984646162', '671.644.475-00', '0720083427', 'ACTIVE', true, now(), now());

  INSERT INTO residents (id, tenant_id, unit_id, type, full_name, email, phone, cpf, status, data_consent, created_at, updated_at)
  VALUES (gen_random_uuid(), v_tenant_id, v_unit_id, 'OWNER', 'Leda', NULL, '6181237881', NULL, 'ACTIVE', true, now(), now());

  -- =============================================
  -- 18. UNIDADE 208
  -- =============================================
  INSERT INTO units (id, tenant_id, block, number, identifier, status, created_at, updated_at)
  VALUES (gen_random_uuid(), v_tenant_id, 'Q', '208', 'Q-208', 'ACTIVE', now(), now())
  RETURNING id INTO v_unit_id;

  INSERT INTO residents (id, tenant_id, unit_id, type, full_name, email, phone, cpf, status, data_consent, created_at, updated_at)
  VALUES (gen_random_uuid(), v_tenant_id, v_unit_id, 'TENANT', 'Sarah Ferreira Lacerda', 'zambellinho@gmail.com', NULL, '022.413.131-14', 'ACTIVE', true, now(), now());

  INSERT INTO residents (id, tenant_id, unit_id, type, full_name, email, phone, cpf, status, data_consent, created_at, updated_at)
  VALUES (gen_random_uuid(), v_tenant_id, v_unit_id, 'OWNER', 'Ana Leyla Ferreira Lacerda', 'golmilestone@gmail.com', '6198123-7881', '122.301.036-87', 'ACTIVE', true, now(), now());

  -- =============================================
  -- 19. UNIDADE 301
  -- =============================================
  INSERT INTO units (id, tenant_id, block, number, identifier, status, created_at, updated_at)
  VALUES (gen_random_uuid(), v_tenant_id, 'Q', '301', 'Q-301', 'ACTIVE', now(), now())
  RETURNING id INTO v_unit_id;

  INSERT INTO residents (id, tenant_id, unit_id, type, full_name, email, phone, cpf, rg, status, data_consent, created_at, updated_at)
  VALUES (gen_random_uuid(), v_tenant_id, v_unit_id, 'OWNER', 'Ana Maria Oliveira de Souza', 'amos9392@gmail.com', '61992213804', '386.237.906-00', '2906639', 'ACTIVE', true, now(), now());

  INSERT INTO residents (id, tenant_id, unit_id, type, full_name, email, phone, cpf, rg, status, data_consent, created_at, updated_at)
  VALUES (gen_random_uuid(), v_tenant_id, v_unit_id, 'OWNER', 'Pedro de Souza Almeida', 'pedrosouza79@hotmail.com', '11945419116', '051.987.931-75', '2909030', 'ACTIVE', true, now(), now());

  -- =============================================
  -- 20. UNIDADE 302
  -- =============================================
  INSERT INTO units (id, tenant_id, block, number, identifier, status, created_at, updated_at)
  VALUES (gen_random_uuid(), v_tenant_id, 'Q', '302', 'Q-302', 'ACTIVE', now(), now())
  RETURNING id INTO v_unit_id;

  INSERT INTO residents (id, tenant_id, unit_id, type, full_name, email, phone, cpf, rg, status, data_consent, created_at, updated_at)
  VALUES (gen_random_uuid(), v_tenant_id, v_unit_id, 'OWNER', 'Enos Rodrigues Barbosa de Souza', 'enos.souza@gmail.com', '61981038676', '002.027.391-63', '2099334', 'ACTIVE', true, now(), now());

  -- =============================================
  -- 21. UNIDADE 303
  -- =============================================
  INSERT INTO units (id, tenant_id, block, number, identifier, status, created_at, updated_at)
  VALUES (gen_random_uuid(), v_tenant_id, 'Q', '303', 'Q-303', 'ACTIVE', now(), now())
  RETURNING id INTO v_unit_id;

  INSERT INTO residents (id, tenant_id, unit_id, type, full_name, email, phone, cpf, status, data_consent, created_at, updated_at)
  VALUES (gen_random_uuid(), v_tenant_id, v_unit_id, 'OWNER', 'Roberto Ribeiro', NULL, '6130371097', '167.620.101-72', 'ACTIVE', true, now(), now());

  INSERT INTO residents (id, tenant_id, unit_id, type, full_name, email, phone, cpf, status, data_consent, created_at, updated_at)
  VALUES (gen_random_uuid(), v_tenant_id, v_unit_id, 'TENANT', 'Alexandre Luis de Mattos', 'alexandremattos.rdc@gmail.com', '61984718236', '386.034.971-68', 'ACTIVE', true, now(), now());

  -- =============================================
  -- 22. UNIDADE 304
  -- =============================================
  INSERT INTO units (id, tenant_id, block, number, identifier, status, created_at, updated_at)
  VALUES (gen_random_uuid(), v_tenant_id, 'Q', '304', 'Q-304', 'ACTIVE', now(), now())
  RETURNING id INTO v_unit_id;

  INSERT INTO residents (id, tenant_id, unit_id, type, full_name, email, phone, cpf, rg, status, data_consent, created_at, updated_at)
  VALUES (gen_random_uuid(), v_tenant_id, v_unit_id, 'OWNER', 'Karina Cobucci Salles', 'kobucci@yahoo.com.br', '61981149776', '710.958.531-04', '1924474', 'ACTIVE', true, now(), now());

  -- =============================================
  -- 23. UNIDADE 305
  -- =============================================
  INSERT INTO units (id, tenant_id, block, number, identifier, status, created_at, updated_at)
  VALUES (gen_random_uuid(), v_tenant_id, 'Q', '305', 'Q-305', 'ACTIVE', now(), now())
  RETURNING id INTO v_unit_id;

  INSERT INTO residents (id, tenant_id, unit_id, type, full_name, email, phone, cpf, status, data_consent, created_at, updated_at)
  VALUES (gen_random_uuid(), v_tenant_id, v_unit_id, 'OWNER', 'Teresinha Alves Pereira', 'teresinha.pereira@cultura.gov.br', '61999342526', '287.325.701-63', 'ACTIVE', true, now(), now());

  -- =============================================
  -- 24. UNIDADE 306
  -- =============================================
  INSERT INTO units (id, tenant_id, block, number, identifier, status, created_at, updated_at)
  VALUES (gen_random_uuid(), v_tenant_id, 'Q', '306', 'Q-306', 'ACTIVE', now(), now())
  RETURNING id INTO v_unit_id;

  INSERT INTO residents (id, tenant_id, unit_id, type, full_name, email, phone, cpf, status, data_consent, created_at, updated_at)
  VALUES (gen_random_uuid(), v_tenant_id, v_unit_id, 'OWNER', 'Caio Martins Franco', 'caiofranco123@gmail.com', '61983028668', '033.833.811-02', 'ACTIVE', true, now(), now());

  -- =============================================
  -- 25. UNIDADE 307
  -- =============================================
  INSERT INTO units (id, tenant_id, block, number, identifier, status, created_at, updated_at)
  VALUES (gen_random_uuid(), v_tenant_id, 'Q', '307', 'Q-307', 'ACTIVE', now(), now())
  RETURNING id INTO v_unit_id;

  INSERT INTO residents (id, tenant_id, unit_id, type, full_name, email, phone, cpf, status, data_consent, created_at, updated_at)
  VALUES (gen_random_uuid(), v_tenant_id, v_unit_id, 'TENANT', 'Flávio Rodrigues de Queiroz Macedo', 'flaviobsb100@gmail.com', NULL, '023.004.041-17', 'ACTIVE', true, now(), now());

  INSERT INTO residents (id, tenant_id, unit_id, type, full_name, email, phone, cpf, status, data_consent, created_at, updated_at)
  VALUES (gen_random_uuid(), v_tenant_id, v_unit_id, 'OWNER', 'Alba Valéria Nogueira Costa', 'albavaleria.nogueira@gmail.com', '61981046202', '457.876.891-00', 'ACTIVE', true, now(), now());

  -- =============================================
  -- 26. UNIDADE 308
  -- =============================================
  INSERT INTO units (id, tenant_id, block, number, identifier, status, created_at, updated_at)
  VALUES (gen_random_uuid(), v_tenant_id, 'Q', '308', 'Q-308', 'ACTIVE', now(), now())
  RETURNING id INTO v_unit_id;

  INSERT INTO residents (id, tenant_id, unit_id, type, full_name, email, phone, cpf, status, data_consent, created_at, updated_at)
  VALUES (gen_random_uuid(), v_tenant_id, v_unit_id, 'OWNER', 'Dorival Fernandes Rodrigues', 'dorival.magno@ig.com.br', '61999728453', '003.224.311-15', 'ACTIVE', true, now(), now());

  RAISE NOTICE 'Seed concluido! Tenant ID: %', v_tenant_id;
END $$;
