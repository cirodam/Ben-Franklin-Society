# Library Service API

API documentation for inter-service communication with the Library app.

## Authentication

All API endpoints require authentication via JWT token from the OIDC server.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

The JWT token must be obtained from the governance OIDC server and contain:
- `sub`: User UUID
- `acting_as_uuid`: User UUID (for delegation support)

## Base URL

- **Development**: `http://localhost:5177`
- **Production**: `https://library.yourdomain.com`

---

## Buckets

### List User's Accessible Buckets

**Endpoint:** `GET /api/buckets`

Returns all buckets the authenticated user can access (personal + associations).

**Response:**
```json
{
  "buckets": [
    {
      "id": 1,
      "bucket_key": "user-abc-123",
      "owner_type": "user",
      "owner_id": "abc-123",
      "created_at": "2026-01-01T00:00:00.000Z",
      "name": "My Files"
    },
    {
      "id": 2,
      "bucket_key": "association-food-service",
      "owner_type": "association",
      "owner_id": "food-service",
      "created_at": "2026-01-01T00:00:00.000Z",
      "name": "Food Service Association"
    }
  ]
}
```

---

## Files

### Upload File

**Endpoint:** `POST /api/files`

Upload a file to a bucket.

**Request:** `multipart/form-data`
```
file: <binary file data>
bucket_key: "user-abc-123" or "association-handle"
folder_id: <optional folder ID>
```

**Response:** `201 Created`
```json
{
  "id": 123,
  "bucket_id": 1,
  "folder_id": null,
  "filename": "document.pdf",
  "path": "/document.pdf",
  "storage_path": "/app/data/buckets/1/abc123.pdf",
  "mime_type": "application/pdf",
  "size_bytes": 102400,
  "uploaded_at": "2026-05-22T10:00:00.000Z",
  "uploaded_by": "abc-123"
}
```

**Example (Node.js):**
```javascript
const formData = new FormData();
formData.append('file', fileBuffer, 'document.pdf');
formData.append('bucket_key', 'user-abc-123');

const response = await fetch('http://localhost:5177/api/files', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${jwtToken}`
  },
  body: formData
});
```

### Download File

**Endpoint:** `GET /api/files/:id`

Download a file by ID.

**Response:** Binary file data with headers:
```
Content-Type: application/pdf (or file's mime type)
Content-Disposition: attachment; filename="document.pdf"
Content-Length: 102400
```

**Example:**
```javascript
const response = await fetch(`http://localhost:5177/api/files/123`, {
  headers: {
    'Authorization': `Bearer ${jwtToken}`
  }
});

const buffer = await response.arrayBuffer();
```

### Delete File

**Endpoint:** `DELETE /api/files/:id`

Delete a file.

**Response:** `204 No Content`

### Move File

**Endpoint:** `PATCH /api/files/:id`

Move a file to a different folder.

**Request:**
```json
{
  "folder_id": 5
}
```

**Response:** `200 OK`
```json
{
  "id": 123,
  "folder_id": 5,
  "path": "/projects/document.pdf",
  ...
}
```

### Rename File

**Endpoint:** `PATCH /api/files/:id`

Rename a file.

**Request:**
```json
{
  "filename": "new-name.pdf"
}
```

**Response:** `200 OK`

### List Files in Bucket

**Endpoint:** `GET /api/buckets/:bucket_key/files`

List root-level files in a bucket.

**Response:**
```json
{
  "files": [
    {
      "id": 123,
      "filename": "document.pdf",
      "size_bytes": 102400,
      ...
    }
  ]
}
```

---

## Folders

### Create Folder

**Endpoint:** `POST /api/folders`

Create a new folder in a bucket.

**Request:**
```json
{
  "bucket_key": "user-abc-123",
  "parent_folder_id": null,
  "name": "Projects"
}
```

**Response:** `201 Created`
```json
{
  "id": 5,
  "bucket_id": 1,
  "parent_folder_id": null,
  "name": "Projects",
  "path": "/Projects",
  "created_at": "2026-05-22T10:00:00.000Z",
  "created_by": "abc-123"
}
```

### Delete Folder

**Endpoint:** `DELETE /api/folders/:id`

Delete an empty folder.

**Response:** `204 No Content`

**Error:** `500` if folder contains files or subfolders

### Rename Folder

**Endpoint:** `PATCH /api/folders/:id`

Rename a folder (cascades to all subfolders and files).

**Request:**
```json
{
  "name": "New Folder Name"
}
```

**Response:** `200 OK`

### List Folders in Bucket

**Endpoint:** `GET /api/buckets/:bucket_key/folders`

List root-level folders in a bucket.

**Response:**
```json
{
  "folders": [
    {
      "id": 5,
      "name": "Projects",
      "path": "/Projects",
      ...
    }
  ]
}
```

### Get Folder Contents

**Endpoint:** `GET /api/folders/:id/contents`

Get subfolders and files in a folder.

**Response:**
```json
{
  "folder": {
    "id": 5,
    "name": "Projects",
    ...
  },
  "subfolders": [...],
  "files": [...]
}
```

---

## Common Integration Patterns

### Mail App: Attach File from Library

1. User selects file from their library bucket
2. Mail app calls `GET /api/files/:id` with user's JWT
3. Mail app reads file data and embeds in message

```javascript
// In mail app compose page
async function attachFromLibrary(fileId, userJwt) {
  const response = await fetch(`http://localhost:5177/api/files/${fileId}`, {
    headers: { 'Authorization': `Bearer ${userJwt}` }
  });
  
  const fileData = await response.arrayBuffer();
  const contentType = response.headers.get('content-type');
  const filename = extractFilename(response.headers.get('content-disposition'));
  
  return { fileData, contentType, filename };
}
```

### Mail App: Save Attachment to Library

1. Recipient receives mail with attachment
2. Mail app calls `POST /api/files` with user's JWT
3. File saved to recipient's personal bucket

```javascript
// In mail app message view
async function saveAttachmentToLibrary(attachment, recipientJwt) {
  const formData = new FormData();
  formData.append('file', attachment.data, attachment.filename);
  formData.append('bucket_key', `user-${recipientUuid}`);
  formData.append('folder_id', null); // Save to root
  
  const response = await fetch('http://localhost:5177/api/files', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${recipientJwt}` },
    body: formData
  });
  
  return await response.json();
}
```

### Governance App: Upload Motion Document

1. User uploads document when creating motion
2. Governance app saves to association bucket
3. Document linked to motion record

```javascript
async function uploadMotionDocument(file, associationHandle, userJwt) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('bucket_key', `association-${associationHandle}`);
  
  const response = await fetch('http://localhost:5177/api/files', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${userJwt}` },
    body: formData
  });
  
  const fileMetadata = await response.json();
  
  // Store file.id in motion record
  return fileMetadata;
}
```

### Marketplace App: Upload Product Image

1. Vendor uploads product image
2. Marketplace app saves to user's bucket
3. Image path stored in product record

```javascript
async function uploadProductImage(imageFile, vendorJwt) {
  const formData = new FormData();
  formData.append('file', imageFile);
  formData.append('bucket_key', `user-${vendorUuid}`);
  
  const response = await fetch('http://localhost:5177/api/files', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${vendorJwt}` },
    body: formData
  });
  
  return await response.json();
}
```

---

## Error Responses

All endpoints return standard HTTP status codes:

**401 Unauthorized**
```json
{
  "message": "Not authenticated"
}
```

**403 Forbidden**
```json
{
  "message": "Not authorized to access this bucket"
}
```

**404 Not Found**
```json
{
  "message": "File not found"
}
```

**500 Internal Server Error**
```json
{
  "message": "Failed to upload file"
}
```

---

## Security Considerations

1. **JWT Validation**: All endpoints validate JWT signature and expiry
2. **Bucket Ownership**: Users can only access their own bucket and association buckets they're members of
3. **File Isolation**: Files stored with unique hashed names to prevent conflicts
4. **Folder Permissions**: Inherited from bucket permissions
5. **No Direct Sharing**: Files shared via copy model (mail embeds data)

---

## Performance Notes

1. **File Size Limits**: No explicit limit, but consider chunked uploads for files > 100MB
2. **Concurrent Uploads**: Supported, each file gets unique storage path
3. **Download Streaming**: Files streamed directly from disk
4. **Database Queries**: Indexed on bucket_id, folder_id, uploaded_at

---

## Future Enhancements

- **Presigned URLs**: For direct uploads/downloads without proxying through library service
- **Thumbnail Generation**: For image files
- **File Versioning**: Track file history
- **Bulk Operations**: Upload/download multiple files in one request
- **Search**: Full-text search within file contents
- **Trash/Restore**: Soft delete with recovery period
