# Library Service

File storage service for the BFS network. Provides isolated buckets for users and associations with a simple REST API for inter-service communication.

## Features

- **User Buckets**: Personal file storage for each user
- **Association Buckets**: Shared file storage for associations (all members have access)
- **Folder Organization**: Hierarchical folder structure with breadcrumb navigation
- **File Operations**: Upload, download, delete, move, rename
- **Search & Sort**: Filter files by name, sort by name/size/date
- **Access Control**: Bucket ownership verification, association membership checks
- **REST API**: Service-to-service integration for other BFS apps

## Quick Start

### Development

```bash
# From workspace root
pnpm start

# Library service runs on http://localhost:5177
```

### Reset Database

```bash
cd apps/library
pnpm run reset
```

## Architecture

### Database Schema

**buckets** - Storage containers for files
- `bucket_key`: Format `user-{uuid}` or `association-{handle}`
- `owner_type`: 'user' or 'association'
- `owner_id`: User UUID or association handle

**folders** - Hierarchical folder structure
- `path`: Full path from bucket root (e.g., `/Documents/Reports`)
- `parent_folder_id`: NULL for root folders

**files** - File metadata and storage paths
- `storage_path`: Hash-based path on disk (prevents collisions)
- `path`: Logical path visible to user (e.g., `/folder/file.pdf`)
- Files stored in `data/buckets/{bucket_id}/`

### Access Control

**User Buckets:**
- Only the owner can access their personal bucket
- Created on-demand when user first accesses library

**Association Buckets:**
- All active association members have full access
- Membership queried from governance database
- Created on-demand when any member accesses

**Permission Flow:**
1. User authenticated via JWT (from governance OIDC)
2. Library extracts `acting_as_uuid` from session
3. For user buckets: verify UUID matches owner
4. For association buckets: query governance DB for membership
5. Deny access if not authorized

## API for Other Services

See [API.md](./API.md) for complete API documentation.

See [INTEGRATION_EXAMPLES.md](./INTEGRATION_EXAMPLES.md) for integration patterns.

### Quick Example

```typescript
import { LibraryClient } from '$lib/library-client';

// In your app's server code
const client = new LibraryClient(
  session.jwt_token,
  'http://localhost:5177'
);

// Upload file
const file = await client.uploadFile(
  fileBuffer,
  'document.pdf',
  `user-${userUuid}`
);

// Download file
const { data, contentType, filename } = await client.downloadFile(file.id);
```

## Testing

1. Start dev environment: `pnpm start`
2. Navigate to http://localhost:5177
3. Log in via governance OIDC
4. Upload files, create folders, test features

## File Storage

Files stored on disk at:
```
apps/library/data/buckets/{bucket_id}/{hash}.{ext}
```

Hash generated from bucket ID + random bytes to prevent naming conflicts.

Database stores both:
- `storage_path`: Actual disk location
- `path`: User-facing logical path

## Cross-Service Database Access

Library service reads governance database for association memberships:

**Docker Setup:**
```yaml
library:
  environment:
    GOVERNANCE_DATABASE_PATH: /app/governance-data/governance.db
  volumes:
    - governance-data:/app/governance-data:ro  # Read-only
```

**Query Pattern:**
```typescript
import { governanceDb } from '$lib/server/associations';

const associations = governanceDb
  .prepare(`
    SELECT a.* FROM associations a
    JOIN association_members am ON a.id = am.association_id
    WHERE am.user_uuid = ? AND am.status = 'active'
  `)
  .all(userUuid);
```

## Future Enhancements

- **Phase 7**: Mail integration (attach from library, save to library)
- **Phase 8**: Governance & Marketplace integration
- Presigned URLs for large file uploads/downloads
- File versioning
- Thumbnail generation for images
- Full-text search
- Trash/restore functionality
- Usage quotas per user/association

## Security

- All API endpoints require valid JWT from governance OIDC
- Bucket isolation: users can only access their own or association buckets
- No direct file sharing: files shared via copy model (e.g., mail embeds data)
- Association membership verified on every request
- Files stored with hashed names to prevent enumeration

## Performance

- Files streamed directly from disk (no buffering in memory)
- Database indexes on bucket_id, folder_id, uploaded_at
- Bucket creation on-demand (not pre-created for all users)
- Read-only governance DB connection (no write lock contention)

## Troubleshooting

**"Not authorized to access this bucket"**
- Verify user UUID matches bucket owner
- For association buckets, check user is active member
- Check governance database has association_members records

**"Failed to upload file"**
- Check `data/buckets/{bucket_id}/` directory exists and is writable
- Verify disk space available
- Check file size (no explicit limit, but consider server resources)

**"Folder not found"**
- Verify folder exists in database
- Check folder belongs to correct bucket
- Ensure folder_id is number, not string

## Development

### File Structure

```
apps/library/
├── src/
│   ├── lib/
│   │   ├── server/
│   │   │   ├── schema.ts         # Database schema
│   │   │   ├── db.ts             # Database connection
│   │   │   ├── buckets.ts        # Bucket operations
│   │   │   ├── files.ts          # File operations
│   │   │   ├── folders.ts        # Folder operations
│   │   │   └── associations.ts   # Governance DB queries
│   │   └── client.ts             # API client for other services
│   ├── routes/
│   │   ├── +page.svelte          # Main file browser UI
│   │   ├── +page.server.ts       # Page data loading
│   │   └── api/
│   │       ├── buckets/          # Bucket endpoints
│   │       ├── files/            # File endpoints
│   │       └── folders/          # Folder endpoints
│   └── hooks.server.ts           # OIDC authentication
├── data/                         # File storage (gitignored)
├── API.md                        # API documentation
├── INTEGRATION_EXAMPLES.md       # Integration patterns
└── README.md                     # This file
```

### Key Technologies

- **SvelteKit**: Web framework
- **better-sqlite3**: SQLite database
- **@bfs/oidc-client**: OIDC authentication
- **@bfs/db**: Shared database utilities
- **Node.js fs/promises**: File system operations

## Contributing

When adding features:
1. Update database schema in schema.ts
2. Add operations in appropriate server module
3. Create API endpoints in routes/api/
4. Update UI in +page.svelte
5. Document in API.md
6. Add examples to INTEGRATION_EXAMPLES.md

Keep the copy-based sharing model: files shared via embedding data in messages, not via permissions.
