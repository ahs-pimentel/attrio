# Attrio

Plataforma SaaS de gerenciamento de condominios.

## Visao Geral

O Attrio e uma plataforma completa para gestao de condominios, oferecendo:

- Cadastro de unidades e moradores
- Assembleias digitais com votacao
- Transcricao e geracao de atas automaticas
- Controle de presenca

## Stack Tecnologica

- **Monorepo**: pnpm workspaces + Turborepo
- **Frontend**: Next.js 14 (React) + TypeScript
- **Backend**: NestJS + TypeScript
- **Banco de dados**: PostgreSQL 16
- **ORM**: TypeORM (migrations versionadas)
- **Autenticacao**: Supabase Auth (apenas identidade)
- **Documentacao API**: Swagger (OpenAPI) + Scalar UI

## Pre-requisitos

- Node.js 20+
- pnpm 9+
- Docker e Docker Compose

## Instalacao

### 1. Clone o repositorio

```bash
git clone https://github.com/seu-usuario/attrio.git
cd attrio
```

### 2. Instale as dependencias

```bash
pnpm install
```

### 3. Configure as variaveis de ambiente

```bash
# Backend
cp apps/api/.env.example apps/api/.env.local

# Frontend
cp apps/web/.env.example apps/web/.env.local
```

Edite os arquivos `.env.local` com suas configuracoes.

### 4. Suba o banco de dados

```bash
pnpm db:up
```

Isso ira iniciar o PostgreSQL e o Redis via Docker.

### 5. Execute as migrations

```bash
cd apps/api
pnpm migration:run
```

### 6. Inicie o desenvolvimento

```bash
# Na raiz do projeto
pnpm dev
```

Isso ira iniciar:
- Frontend: http://localhost:3000
- API: http://localhost:3001
- Swagger UI: http://localhost:3001/api/docs
- Scalar UI: http://localhost:3001/api/reference

## Estrutura do Projeto

```
attrio/
├── apps/
│   ├── api/          # Backend NestJS
│   ├── web/          # Frontend Next.js
│   └── workers/      # Jobs em background
├── packages/
│   ├── api-client/   # Cliente TypeScript da API
│   ├── contracts/    # Tipos e DTOs compartilhados
│   └── config/       # Configuracoes (eslint, tsconfig)
├── infra/
│   └── docker-compose.yml
└── docs/
    └── adr/          # Architecture Decision Records
```

## Scripts Disponiveis

### Raiz do projeto

```bash
pnpm dev          # Inicia todos os apps em modo dev
pnpm build        # Build de todos os apps
pnpm lint         # Lint de todos os apps
pnpm clean        # Limpa builds e node_modules
pnpm db:up        # Sobe containers Docker
pnpm db:down      # Para containers Docker
pnpm db:logs      # Mostra logs do Docker
```

### API (apps/api)

```bash
pnpm dev                  # Inicia em modo watch
pnpm build                # Build de producao
pnpm migration:generate   # Gera migration baseada em alteracoes
pnpm migration:run        # Executa migrations pendentes
pnpm migration:revert     # Reverte ultima migration
```

## Documentacao da API

A documentacao da API esta disponivel em dois formatos:

1. **Swagger UI** (classico): http://localhost:3001/api/docs
2. **Scalar** (moderno): http://localhost:3001/api/reference

## Autenticacao

O Attrio usa Supabase Auth apenas para autenticacao. O fluxo e:

1. Usuario faz login no frontend via Supabase
2. Frontend recebe JWT do Supabase
3. Frontend envia JWT no header `Authorization: Bearer <token>`
4. Backend valida JWT usando JWKS do Supabase
5. Backend cria/sincroniza usuario interno
6. Roles e permissoes vem do banco do Attrio

## Papeis de Usuario

- `SAAS_ADMIN`: Administrador da plataforma
- `SYNDIC`: Sindico do condominio
- `DOORMAN`: Porteiro
- `RESIDENT`: Morador

## Multi-tenancy

Todas as operacoes sao isoladas por tenant (condominio). O `tenantId` e obrigatorio em todas as entidades de negocio.

## Contribuicao

1. Crie uma branch: `git checkout -b feature/minha-feature`
2. Faca suas alteracoes
3. Execute os testes: `pnpm test`
4. Commit: `git commit -m "feat: minha feature"`
5. Push: `git push origin feature/minha-feature`
6. Abra um Pull Request

## Licenca

Proprietario - Todos os direitos reservados.
