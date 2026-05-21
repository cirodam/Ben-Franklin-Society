# Governance App REST API Endpoints

## Health
- `GET /health`

## OAuth / OIDC
- `GET /oauth/authorize`
- `POST /oauth/token`
- `GET /oauth/userinfo`
- `GET /oauth/jwks`

## Session Management
- `GET /api/session/contexts`
- `POST /api/session/switch-context`
- `POST /logout`

## Persons
- `GET /api/persons/by-handle/:handle`
- `GET /api/persons/by-uuid/:uuid`
- `POST /api/persons/sync-data`

## Associations
- `GET /api/associations/by-handle/:handle`
- `GET /api/associations/by-uuid/:uuid`
- `GET /api/associations/by-registration/:registration_no`
- `POST /api/associations/sync-data`

## Principals (Generic)
- `GET /api/principals`
- `GET /api/principals/:uuid`

## Members
- `GET /api/members/by-role/:role_code`

## Children
- `GET /api/children`

## Founding
- `GET /api/founding/status`
- `GET /api/founding/check-handle/:handle`
- `POST /api/founding/found`

## Societies
- `GET /api/societies`
- `POST /api/societies/discover`
- `GET /api/societies/:handle/lineage`
- `POST /api/societies/:handle/refresh-lineage`

## Lineage
- `GET /api/lineage`
- `POST /api/lineage/verify`
- `POST /api/lineage/walk`

## Trust Network
- `GET /api/trust/:handle`
- `POST /api/trust/rank`
- `GET /api/trust/compare/:handleA/:handleB`

## Vouching
- `POST /api/vouching/issue`
- `GET /api/vouching/issued`
- `GET /api/vouching/credentials`
- `POST /api/vouching/verify`
- `POST /api/vouching/invalidate`
- `GET /api/vouching/verifications/:peer`
- `POST /api/vouching/verify/:peer/:voucher`

## Injuries
- `GET /api/injuries`
- `GET /api/injuries/:injury_number`
- `GET /api/injuries/:injury_number/accounts`
- `POST /api/injuries/:injury_number/assessment`

## Organizational Charts
- `GET /api/org-charts/:uuid/export`
- `POST /api/org-charts/:uuid/import`

## Role Templates
- `GET /api/role-templates/:uuid/permissions`

## OIDC Clients
- `POST /api/oidc-clients/test`
