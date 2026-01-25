# ADR 002: TypeORM com Migrations

## Status

Aceito

## Contexto

Precisamos definir como gerenciar o schema do banco de dados.

## Decisao

Usaremos **TypeORM** com **migrations versionadas**. NUNCA usar `synchronize: true`.

## Justificativa

- **Controle**: Migrations permitem controle total sobre alteracoes
- **Auditoria**: Historico de todas as alteracoes no schema
- **Reproducibilidade**: Mesmo schema em dev, staging e producao
- **Rollback**: Possibilidade de reverter alteracoes
- **Code review**: Migrations sao codigo, passam por review

## Regras

1. Toda alteracao de schema deve ser via migration
2. Migrations devem ser idempotentes quando possivel
3. Migrations destrutivas devem ser evitadas
4. Dados de seed vao em migrations separadas

## Comandos

```bash
# Gerar migration baseada em alteracoes nas entities
pnpm migration:generate -n NomeDaMigration

# Executar migrations pendentes
pnpm migration:run

# Reverter ultima migration
pnpm migration:revert
```

## Consequencias

### Positivas
- Schema sempre consistente
- Deploys mais seguros
- Historico de alteracoes

### Negativas
- Mais trabalho manual
- Possivel conflito de migrations em branches
