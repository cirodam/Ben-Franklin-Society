/**
 * Seed the Marketplace app database.
 *
 * No mailbox-equivalent provisioning needed — sellers need no pre-setup.
 * This script just ensures the schema is applied and can be extended as needed.
 *
 * Idempotent — safe to re-run.
 *
 * Usage:
 *   DATABASE_PATH=./marketplace.sqlite \
 *   pnpm seed
 */

import { openDatabase } from '@bfs/db';
import { schema } from '../src/lib/server/schema.js';

const marketplacePath = process.env.DATABASE_PATH ?? './marketplace.sqlite';

const marketplaceDb = openDatabase(marketplacePath);

marketplaceDb.exec(schema);

console.log('Marketplace database initialised.');
