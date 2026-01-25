# Arquitetura do Attrio

## Visao Geral

O Attrio e uma plataforma SaaS multi-tenant para gerenciamento de condominios. Este documento descreve as decisoes arquiteturais e a estrutura do sistema.

## Diagrama de Alto Nivel

```
┌─────────────────────────────────────────────────────────────┐
│                         Cliente                              │
│                   (Navegador/Mobile)                         │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                      Next.js (Web)                           │
│                   localhost:3000                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Pages     │  │ Components  │  │   API Client        │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────┬───────────────────────────────────┘
                          │ HTTP/REST
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                     NestJS (API)                             │
│                   localhost:3001                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ Controllers │  │  Services   │  │   Repositories      │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────┬───────────────────────────────────┘
                          │
          ┌───────────────┼───────────────┐
          ▼               ▼               ▼
┌───────────────┐ ┌───────────────┐ ┌───────────────┐
│  PostgreSQL   │ │     Redis     │ │ Supabase Auth │
│   (TypeORM)   │ │   (Filas)     │ │   (JWKS)      │
└───────────────┘ └───────────────┘ └───────────────┘
```

## Componentes Principais

### 1. Frontend (Next.js)

- **Localizacao**: `apps/web`
- **Porta**: 3000
- **Responsabilidades**:
  - Renderizacao de UI
  - Autenticacao via Supabase
  - Comunicacao com API via cliente HTTP

### 2. Backend (NestJS)

- **Localizacao**: `apps/api`
- **Porta**: 3001
- **Responsabilidades**:
  - API REST
  - Validacao de JWT
  - Regras de negocio
  - Acesso ao banco de dados

### 3. Workers

- **Localizacao**: `apps/workers`
- **Responsabilidades**:
  - Transcricao de assembleias
  - Geracao de atas
  - Jobs em background

### 4. Packages Compartilhados

- **contracts**: Tipos e DTOs compartilhados
- **api-client**: Cliente HTTP tipado
- **config**: Configuracoes de lint e TypeScript

## Multi-tenancy

### Estrategia

Utilizamos isolamento por coluna (`tenantId`) em todas as tabelas de negocio.

### Implementacao

```typescript
// Toda entidade de negocio tem tenantId
@Entity()
export class Unit {
  @Column()
  tenantId: string;

  // ...outros campos
}
```

### Filtros Automaticos

O backend aplica filtros automaticos de tenant em todas as queries.

## Autenticacao

### Fluxo

1. Usuario faz login no frontend via Supabase Auth
2. Supabase retorna JWT
3. Frontend armazena JWT e envia em requests
4. Backend valida JWT usando JWKS publico do Supabase
5. Backend extrai `sub` (user ID) do token
6. Backend busca/cria usuario interno
7. Roles vem do banco do Attrio (nao do Supabase)

### Por que nao usar Supabase DB?

- Maior controle sobre modelo de dados
- TypeORM com migrations versionadas
- Independencia de vendor
- Performance otimizada para nosso caso de uso

## Modelo de Dados

### Entidades Principais

```
Tenant (Condominio)
├── User (usuarios do sistema)
├── Unit (unidades)
│   └── Resident (moradores)
└── Assembly (assembleias)
    ├── AssemblyParticipant (presenca)
    ├── AgendaItem (pautas)
    │   └── Vote (votos)
    ├── Transcript (transcricao)
    └── Minutes (ata)
```

### Constraints Importantes

- `users(tenantId, supabaseUserId)` - UNIQUE
- `units(tenantId, identifier)` - UNIQUE
- `votes(agendaItemId, participantId)` - UNIQUE

## RBAC

### Papeis

| Papel       | Descricao                    |
|-------------|------------------------------|
| SAAS_ADMIN  | Administrador da plataforma  |
| SYNDIC      | Sindico do condominio        |
| DOORMAN     | Porteiro                     |
| RESIDENT    | Morador                      |

### Permissoes

As permissoes sao verificadas em cada endpoint via guards do NestJS.

## API Design

### Padrao de Resposta

```typescript
// Sucesso
{
  "data": { ... },
  "meta": { ... }  // opcional, para paginacao
}

// Erro
{
  "code": "UNIT_NOT_FOUND",
  "message": "Unidade nao encontrada",
  "details": { ... },
  "traceId": "abc-123"
}
```

### Versionamento

A API nao usa versionamento por URL no MVP. Futuras versoes podem usar `/api/v2/`.

## Decisoes Tecnicas (ADRs)

Ver pasta `docs/adr/` para decisoes arquiteturais documentadas.
