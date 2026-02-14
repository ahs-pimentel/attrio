# Setup Atual - Attrio

## 📋 Visão Geral

Este projeto utiliza uma **configuração híbrida** onde os containers de infraestrutura (PostgreSQL e Redis) são compartilhados entre desenvolvimento e produção, mas os bancos de dados são separados.

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────┐
│                 CONTAINERS ATIVOS                    │
├─────────────────────────────────────────────────────┤
│                                                       │
│  ┌──────────────────┐  ┌──────────────────┐         │
│  │ attrio-postgres  │  │  attrio-redis    │         │
│  │      -dev        │  │      -dev        │         │
│  └────────┬─────────┘  └────────┬─────────┘         │
│           │                     │                    │
│           ├─────────────────────┼──────────┐         │
│           │                     │          │         │
│  ┌────────▼─────────┐  ┌────────▼──────┐  │         │
│  │   Banco: attrio  │  │  pnpm dev     │  │         │
│  │   (PRODUÇÃO)     │  │  (DEV LOCAL)  │  │         │
│  │                  │  │               │  │         │
│  │  • 15 tabelas    │  │  Porta: 5432  │  │         │
│  │  • users         │  │  Porta: 6379  │  │         │
│  │  • tenants       │  └───────────────┘  │         │
│  │  • assemblies    │                     │         │
│  │  • residents     │                     │         │
│  │  • etc...        │                     │         │
│  └──────────────────┘                     │         │
│           │                                │         │
│  ┌────────▼─────────┐                     │         │
│  │ Banco: attrio_db │                     │         │
│  │  (DESENVOLVIMENTO)                     │         │
│  │                  │                     │         │
│  │  • 15 tabelas    │                     │         │
│  │  (mesmo schema)  │                     │         │
│  └──────────────────┘                     │         │
│                                            │         │
│  ┌────────────────────────────────────────┘         │
│  │                                                   │
│  ▼                                                   │
│  ┌──────────────────┐  ┌──────────────────┐         │
│  │   attrio-api     │  │   attrio-web     │         │
│  │   (PRODUÇÃO)     │  │   (PRODUÇÃO)     │         │
│  │                  │  │                  │         │
│  │  Conecta: attrio │  │  Porta: 3000     │         │
│  │  Porta: 3001     │  │                  │         │
│  └──────────────────┘  └──────────────────┘         │
│                                                      │
└──────────────────────────────────────────────────────┘
```

## 🔌 Portas e Acesso

### Desenvolvimento
- **API**: `http://localhost:3001`
- **PostgreSQL**: `localhost:5432` (banco: `attrio_db`)
- **Redis**: `localhost:6379`

### Produção (containers)
- **API**: `http://localhost:3001` (interno ao container)
- **Web**: `http://localhost:3000` (interno ao container)
- **PostgreSQL**: `postgres:5432` (via rede Docker, banco: `attrio`)
- **Redis**: `redis:6379` (via rede Docker)

## 🗄️ Bancos de Dados

### `attrio_db` (Desenvolvimento)
- **Usado por**: `pnpm dev` (desenvolvimento local)
- **Configuração**: `apps/api/.env.local`
- **Tabelas**: 15 tabelas completas
- **Dados**: Dados de teste/desenvolvimento

### `attrio` (Produção)
- **Usado por**: containers `attrio-api` e `attrio-web`
- **Configuração**: `.env` (via docker-compose.prod.yml)
- **Tabelas**: 15 tabelas completas (mesmo schema)
- **Dados**: Dados de produção

## 🚀 Como Usar

### Iniciar Desenvolvimento
```bash
# Os containers já estão rodando, apenas inicie o dev
pnpm dev
```

### Verificar Status
```bash
# Listar containers
docker ps | grep attrio

# Testar APIs
curl http://localhost:3001/api/health  # Desenvolvimento
docker exec attrio-api wget -q -O- http://localhost:3001/api/health  # Produção
```

### Acessar Bancos de Dados
```bash
# Desenvolvimento
docker exec -it attrio-postgres-dev psql -U attrio -d attrio_db

# Produção
docker exec -it attrio-postgres-dev psql -U attrio -d attrio
```

## 🔧 Gerenciamento de Containers

### Parar tudo
```bash
# Parar containers de infraestrutura (afeta dev e prod)
docker-compose -f docker-compose.yml down

# Parar apenas containers de aplicação
docker stop attrio-api attrio-web
```

### Reiniciar
```bash
# Reiniciar infraestrutura
docker-compose -f docker-compose.yml up -d postgres redis

# Reiniciar aplicação de produção
docker-compose -f docker-compose.prod.yml up -d api web
```

### Logs
```bash
# Desenvolvimento
tail -f /tmp/dev-final.log

# Produção
docker logs -f attrio-api
docker logs -f attrio-web
```

## ⚙️ Configuração

### Variáveis de Ambiente

**Desenvolvimento** (`apps/api/.env.local`):
```env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=attrio
DATABASE_PASSWORD=attrio123
DATABASE_NAME=attrio_db
```

**Produção** (`.env` + `docker-compose.prod.yml`):
```env
DATABASE_HOST=postgres
DATABASE_PORT=5432
DATABASE_USER=attrio
DATABASE_PASSWORD=attrio123
DATABASE_NAME=attrio
```

## 📝 Notas Importantes

1. **Containers Compartilhados**: PostgreSQL e Redis são compartilhados, mas com bancos de dados separados
2. **Portas Expostas**: Apenas containers `-dev` expõem portas para o host
3. **Aliases de Rede**: `attrio-postgres-dev` é acessível como `postgres` na rede Docker
4. **Sincronização**: Mudanças no schema devem ser aplicadas em AMBOS os bancos

## 🐛 Troubleshooting

### API não conecta ao banco
```bash
# Verificar se PostgreSQL está rodando
docker ps | grep postgres

# Verificar logs
docker logs attrio-postgres-dev
```

### Porta 3001 em uso
```bash
# Matar processos na porta 3001
lsof -ti:3001 | xargs kill -9
```

### Tabelas faltando
```bash
# Exportar schema do desenvolvimento
docker exec attrio-postgres-dev pg_dump -U attrio -d attrio_db --schema-only > schema.sql

# Importar para produção
docker exec -i attrio-postgres-dev psql -U attrio -d attrio < schema.sql
```

## ✅ Status Atual

- ✅ PostgreSQL: Saudável, 2 bancos configurados
- ✅ Redis: Saudável e acessível
- ✅ API Desenvolvimento: Rodando em localhost:3001
- ✅ API Produção: Rodando no container
- ✅ Web Produção: Rodando no container
- ⚠️ Traefik: Não configurado (acesso externo indisponível)

---

**Última atualização**: 2026-02-14
**Configurado por**: Claude Sonnet 4.5
