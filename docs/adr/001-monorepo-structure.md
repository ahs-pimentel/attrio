# ADR 001: Estrutura de Monorepo

## Status

Aceito

## Contexto

Precisamos definir como organizar o codigo do Attrio. As opcoes sao:
1. Repositorios separados para frontend e backend
2. Monorepo com todos os projetos

## Decisao

Optamos por **monorepo** usando pnpm workspaces + Turborepo.

## Justificativa

- **Compartilhamento de tipos**: Contratos e DTOs sao compartilhados entre frontend e backend
- **Refatoracao atomica**: Mudancas que afetam multiplos projetos sao feitas em um commit
- **Developer experience**: Um unico `pnpm dev` inicia tudo
- **Consistencia**: Mesmas versoes de dependencias
- **CI/CD simplificado**: Um pipeline para todo o projeto

## Consequencias

### Positivas
- Codigo mais organizado
- Menos duplicacao
- Deploys coordenados

### Negativas
- Build mais complexo
- Curva de aprendizado do Turborepo
- Repositorio maior

## Estrutura Definida

```
attrio/
├── apps/
│   ├── api/
│   ├── web/
│   └── workers/
├── packages/
│   ├── api-client/
│   ├── contracts/
│   └── config/
├── infra/
└── docs/
```
