# Governance Scripts

## Active Scripts

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
