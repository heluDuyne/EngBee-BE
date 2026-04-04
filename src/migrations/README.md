# TypeORM Migrations

This directory contains all database migration files for EngBee.

## Migration Commands

### Generate a new migration
```bash
npx typeorm migration:generate src/migrations/<MigrationName> -d src/data-source.ts
```

Example:
```bash
npx typeorm migration:generate src/migrations/1700000000000-InitialSchema -d src/data-source.ts
```

### Run pending migrations
```bash
npx typeorm migration:run -d src/data-source.ts
```

### Revert last migration
```bash
npx typeorm migration:revert -d src/data-source.ts
```

### Show migration status
```bash
npx typeorm migration:show -d src/data-source.ts
```

## Migration Workflow

1. **Make entity changes** in `src/entities/`
2. **Generate migration** to capture the changes
3. **Review migration file** for correctness
4. **Run migration** to apply changes to database
5. **Commit migration file** to version control

## Best Practices

- ✅ Always generate migrations for schema changes
- ✅ Review generated migrations before running
- ✅ Never edit migration timestamps
- ✅ Keep migrations small and focused
- ✅ Add descriptive names (e.g., `AddUserEmailIndex`, `CreatePromptTable`)
- ✅ Test migrations in development before production

## Important Notes

- Migrations are NOT run automatically on application startup
- Always manually run `typeorm migration:run` after deploying new migrations
- For development, you can use `TYPEORM_SYNCHRONIZE=true` but migrations are preferred
- Never commit auto-synced schema changes; use generated migrations instead
