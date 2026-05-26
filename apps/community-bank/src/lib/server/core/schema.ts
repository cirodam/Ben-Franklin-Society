export const schema = /* sql */ `

CREATE TABLE IF NOT EXISTS config (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS account (
  uuid             TEXT PRIMARY KEY,
  owner_uuid       TEXT NOT NULL,
  name             TEXT NOT NULL,
  franks_balance   INTEGER NOT NULL DEFAULT 0,
  florens_balance  INTEGER NOT NULL DEFAULT 0,
  is_frozen        INTEGER NOT NULL DEFAULT 0,
  demurrage_exempt INTEGER NOT NULL DEFAULT 0,
  created_at       TEXT NOT NULL,
  UNIQUE (owner_uuid, name)
);

CREATE TABLE IF NOT EXISTS "transaction" (
  uuid            TEXT PRIMARY KEY,
  from_uuid       TEXT NOT NULL REFERENCES account(uuid),
  to_uuid         TEXT NOT NULL REFERENCES account(uuid),
  currency        TEXT NOT NULL CHECK (currency IN ('franks', 'florens')),
  amount          INTEGER NOT NULL,
  type            TEXT NOT NULL,
  source          TEXT NOT NULL,
  slip_serial     TEXT NULL,
  memo            TEXT NULL,
  entered_by_uuid TEXT NULL,
  created_at      TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS admin_action_log (
  uuid        TEXT PRIMARY KEY,
  action      TEXT NOT NULL,
  target_uuid TEXT NOT NULL,
  target_type TEXT NOT NULL,
  actor_uuid  TEXT NOT NULL,
  memo        TEXT NOT NULL,
  created_at  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS demurrage_operation (
  uuid               TEXT PRIMARY KEY,
  collection_date    TEXT NOT NULL,
  accounts_processed INTEGER NOT NULL,
  accounts_charged   INTEGER NOT NULL,
  total_collected    INTEGER NOT NULL,
  destination_uuid   TEXT NOT NULL REFERENCES account(uuid),
  performed_by_uuid  TEXT NOT NULL,
  performed_at       TEXT NOT NULL,
  notes              TEXT
);

CREATE TABLE IF NOT EXISTS monetary_supply (
  id                    INTEGER PRIMARY KEY CHECK (id = 1),
  minted_franks_supply  INTEGER NOT NULL DEFAULT 0,
  minted_florens_supply INTEGER NOT NULL DEFAULT 0,
  updated_at            TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS monetary_operation (
  uuid                  TEXT PRIMARY KEY,
  type                  TEXT NOT NULL,
  currency              TEXT NOT NULL CHECK (currency IN ('franks', 'florens')),
  amount                INTEGER NOT NULL,
  account_uuid          TEXT NOT NULL REFERENCES account(uuid),
  reason                TEXT NOT NULL,
  minted_supply_before  INTEGER NOT NULL,
  minted_supply_after   INTEGER NOT NULL,
  total_supply_before   INTEGER NOT NULL,
  total_supply_after    INTEGER NOT NULL,
  performed_by_uuid     TEXT NOT NULL,
  performed_at          TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS clearinghouse_positions (
  society_handle            TEXT PRIMARY KEY,
  florens_net_position      INTEGER NOT NULL DEFAULT 0,
  florens_initial_endowment INTEGER NOT NULL DEFAULT 0,
  last_calculated_at        TEXT NOT NULL
);

`;
