# TypeORM Migrations Setup Guide

This guide explains how to manage database migrations in EngBee without auto-synchronization.

## Overview

- **Database synchronization is disabled** (`TYPEORM_SYNCHRONIZE=false`)
- **Migrations are manual** - must be generated and run explicitly
- **Data-source is separate** - `src/data-source.ts` is used for both CLI and runtime
- **Version control friendly** - all schema changes are tracked as migrations

## File Structure

```
backend/
├── src/
│   ├── data-source.ts           # Main DataSource config (for CLI & runtime)
│   ├── config/
│   │   └── database.ts          # Database initialization (imports data-source)
│   ├── entities/                # Entity definitions
│   └── migrations/              # Generated migrations
│       ├── README.md
│       └── [timestamp]-*.ts     # Migration files
├── package.json                 # NPM scripts for migrations
└── MIGRATIONS_GUIDE.md          # This file
```

## Setup Complete ✅

Your database setup now includes:

1. ✅ **Separate data-source.ts** - Used by TypeORM CLI
2. ✅ **Database config separated** - Imports data-source for app runtime
3. ✅ **No auto-sync** - Changes via migrations only
4. ✅ **Migration scripts** - Added to package.json
5. ✅ **Migrations directory** - Ready for migration files

## Quick Start

### 1. Start PostgreSQL (if using Docker)

```bash
docker-compose up -d
```

### 2. Generate Initial Migration

After your entities are defined, generate the first migration:

```bash
npm run migration:generate src/migrations/1700000000000-InitialSchema
```

This will:
- Analyze entity definitions
- Compare with current database
- Generate migration file with SQL changes

### 3. Review Generated Migration

Check the generated file in `src/migrations/`:

```typescript
// Example migration file
export class InitialSchema1700000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // SQL to apply changes
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // SQL to revert changes
  }
}
```

### 4. Run Migration

```bash
npm run migration:run
```

## Available Commands

### Generate Migrations

```bash
npm run migration:generate src/migrations/<Name>
```

Examples:
```bash
npm run migration:generate src/migrations/AddUserEmailIndex
npm run migration:generate src/migrations/CreatePromptTable
```

### Run Migrations

```bash
npm run migration:run
```

Runs all pending migrations in order.

### Revert Last Migration

```bash
npm run migration:revert
```

Reverts the most recent migration.

### Show Migration Status

```bash
npm run migration:show
```

Shows which migrations have been executed.

## Workflow

### Making Schema Changes

1. **Modify entity** in `src/entities/`
   ```typescript
   @Column({ type: "varchar", length: 255 })
   newField!: string;
   ```

2. **Generate migration**
   ```bash
   npm run migration:generate src/migrations/AddNewFieldToUser
   ```

3. **Review migration file**
   - Check if the SQL looks correct
   - Add any additional logic if needed

4. **Run migration**
   ```bash
   npm run migration:run
   ```

5. **Test your changes**
   ```bash
   npm run dev
   ```

6. **Commit migration file**
   ```bash
   git add src/migrations/AddNewFieldToUser.ts
   git commit -m "feat: add newField to User entity"
   ```

## Migration File Structure

### Up Migration
The `up` method contains the SQL to apply the changes:
```typescript
public async up(queryRunner: QueryRunner): Promise<void> {
  await queryRunner.query(`ALTER TABLE users ADD COLUMN new_field VARCHAR(255)`);
}
```

### Down Migration
The `down` method contains the SQL to revert the changes:
```typescript
public async down(queryRunner: QueryRunner): Promise<void> {
  await queryRunner.query(`ALTER TABLE users DROP COLUMN new_field`);
}
```

## Important Notes

### ⚠️ DO NOT

- ❌ Enable `TYPEORM_SYNCHRONIZE=true` in production
- ❌ Manually edit migration files after running them
- ❌ Delete migration files after they've been executed
- ❌ Revert migrations that have been deployed to production without testing

### ✅ DO

- ✅ Test migrations in development before production
- ✅ Review generated migrations for correctness
- ✅ Commit migration files to version control
- ✅ Use descriptive migration names
- ✅ Keep migrations small and focused

## Development vs Production

### Development
```env
TYPEORM_SYNCHRONIZE=false  # Use migrations
TYPEORM_LOGGING=true        # See SQL queries
```

### Production
```env
TYPEORM_SYNCHRONIZE=false  # MUST be false
TYPEORM_LOGGING=false       # Disable query logging
```

## Troubleshooting

### "Migration not found"
- Ensure migrations are in `src/migrations/` directory
- Check migration filename syntax (timestamp required)

### "Cannot find module 'data-source'"
- Verify `src/data-source.ts` exists
- Check imports in migration files

### "Migration already run"
- Check migration status: `npm run migration:show`
- Don't run the same migration twice

### Database connection failed
- Verify PostgreSQL is running
- Check `.env` file DB_HOST, DB_PORT, DB_USER, DB_PASSWORD
- Ensure database exists: `engbee_db`

## References

- [TypeORM Migrations Documentation](https://typeorm.io/migrations)
- [TypeORM CLI Documentation](https://typeorm.io/using-cli)
- Project Entities: `src/entities/`
- Migration Examples: `src/migrations/`
