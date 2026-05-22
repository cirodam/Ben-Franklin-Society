# Governance Scripts

## Active Scripts

### Association Seeding (New Modular System)

#### `seed-all.ts`
Main CLI for flexibly seeding associations, services, colleges, and committees.

**Usage:**
```bash
# Seed everything (all services, colleges, committees)
pnpm seed:all

# Seed all services
pnpm seed:services

# Seed specific services by handle
DATABASE_PATH=./dev.sqlite tsx scripts/seed-all.ts services food-service community-bank

# Seed all colleges
pnpm seed:colleges

# Seed all committees
pnpm seed:committees
```

**Configuration Files:**
- `seed-data/services.ts` - Service association definitions
- `seed-data/colleges.ts` - College association definitions
- `seed-data/committees.ts` - Committee definitions with sortition configs
- `seed-data/core-associations.ts` - Core system associations (society, GA, etc.)

**Seeder Modules:**
- `seeders/seed-associations.ts` - Base association seeding
- `seeders/seed-services.ts` - Service-specific seeding
- `seeders/seed-colleges.ts` - College-specific seeding
- `seeders/seed-committees.ts` - Committee seeding with sortition
- `seeders/seed-roles.ts` - Admin role creation for satellite apps

**Common Workflows:**
```bash
# Full test environment
pnpm reset && pnpm seed:all

# Just services for testing
pnpm reset && pnpm seed:services

# Specific services
pnpm reset && pnpm seed:services food-service agricultural-service
```

### `seed.ts`
Creates a person record in the governance database for testing/development.

**Usage:**
```bash
pnpm seed --handle=alice --given-name=Alice --family-name=Smith --dob=1990-01-01 --password=testpass123
```

**Referenced in:** `package.json` as `pnpm seed`

### `reset.sh`
Deletes the development database file to start fresh.

**Usage:**
```bash
pnpm reset
```

**Referenced in:** `package.json` as `pnpm reset`

### `sync-library.ts`
Utility script to sync all JSON files in `data/library/` to the `library_item` database table. Useful after manual JSON edits or bulk imports.

**Usage:**
```bash
DATABASE_PATH=./dev.sqlite tsx scripts/sync-library.ts
```

## Notes

- One-time migration scripts have been removed after being run
- Test iteration files have been removed (no longer needed)
- For production setup, use the `/setup` page instead of seed.ts
