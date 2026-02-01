/**
 * -------------------------------------------------------------------
 * Better Auth Tables
 * -------------------------------------------------------------------
 *
 * This file defines the database tables used by Better Auth for
 * authentication and session management.
 *
 * ⚠️ AUTO-GENERATED NOTICE
 * These tables were generated using:
 *
 *   bun x @better-auth/cli generate --output ./src/db/schema/better-auth.table.ts
 *
 * This command reads your `auth` config (plugins, experimental options)
 * and produces the table definitions compatible with Drizzle ORM.
 *
 * IMPORTANT:
 * - Do NOT manually define relations here. Relations are now handled
 *   centrally in `src/db/schema/index.ts` using `defineRelations()`.
 * - If you regenerate this file with the CLI, make sure the index file
 *   still includes the V2 relation definitions for `user`, `session`,
 *   `account`, and `verification`.
 *
 * Table list:
 * - user
 * - session
 * - account
 * - verification
 *
 * Each table includes primary keys, timestamps, indexes, and
 * foreign key references as needed.
 *
 * This pattern keeps the table definitions isolated from relation logic,
 * which is now fully centralized and type-safe in the index schema.
 */

import { boolean, index, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').default(false).notNull(),
  image: text('image'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull()
});

export const session = pgTable(
  'session',
  {
    id: text('id').primaryKey(),
    expiresAt: timestamp('expires_at').notNull(),
    token: text('token').notNull().unique(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' })
  },
  (table) => [index('session_userId_idx').on(table.userId)]
);

export const account = pgTable(
  'account',
  {
    id: text('id').primaryKey(),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: timestamp('access_token_expires_at'),
    refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
    scope: text('scope'),
    password: text('password'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull()
  },
  (table) => [index('account_userId_idx').on(table.userId)]
);

export const verification = pgTable(
  'verification',
  {
    id: text('id').primaryKey(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull()
  },
  (table) => [index('verification_identifier_idx').on(table.identifier)]
);
