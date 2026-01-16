# 🛸 Ludicrous Speed

> "Light speed is too slow. We have to go straight to... **Ludicrous Speed.**"

**Ludicrous Speed** is a high-performance, **runtime-agnostic** API boilerplate built for the modern edge. While optimized for **Bun**, this architecture is designed to be a "Universal Vessel"—leveraging **Hono** for lightweight routing, **Drizzle ORM** for type-safe database interactions, and **Neon** for scalable, serverless PostgreSQL.

---

### 🏗️ Architectural Overview

Ludicrous Speed is built on the principle of **"Separation of Concerns at Warp Velocity."** Every layer is decoupled to ensure the fastest possible execution and maximum developer ergonomics.


* **The Engine (Runtime):** **Bun**. Built for speed. This boilerplate leverages the ultra-fast Bun HTTP server and native SQLite/File-system APIs for maximum performance.
* **The Navigator (Framework):** **Hono**. A web-standard framework that maintains sub-millisecond routing overhead across any environment.
* **The Fuel Tank (Database):** **Neon**. Serverless PostgreSQL utilizing the HTTP driver to eliminate TCP handshake latency in serverless/edge environments.
* **The Hull (ORM):** **Drizzle**. A "TypeScript-first" SQL wrapper that provides full type safety with zero runtime bloat.
* **The Shields (Validation):** **Zod**. End-to-end validation for Environment Variables, API Request payloads, and External API responses.

---

### 🌍 Runtime Agnostic by Design

The "Schwartz" of Ludicrous Speed is its reliance on **Web Standard APIs** (`fetch`, `Request`, `Response`) rather than runtime-specific globals.

* **Zero Lock-in:** Move from a Bun-based Docker container to Cloudflare Workers or a standard Node.js VPS in minutes.
* **Universal Entry:** The entry point detects if `Bun` is present; if not, it gracefully engages the Hono Node.js adapter.
* **Edge-Ready:** Every dependency in this stack is compatible with "The Edge," avoiding heavy Node-specific APIs that break in restricted environments.
* **Future-Proof:** Use the Schwartz to stay portable. By coding to Web Standards, your business logic remains intact even as the JavaScript runtime landscape evolves.

---

### 📊 Performance Benchmarks (Bun Edition)

| Velocity Level | Latency | Status |
| --- | --- | --- |
| Light Speed | > 150ms | **Too slow!** |
| Ridiculous Speed | 100ms - 150ms | **Stop Being a Chicken!** |
| Ludicrous Speed | 20ms - 100ms | **GO!!!** |
| **Plaid** | **< 20ms** | **They've Gone to Plaid!** |

---

## 📂 Recommended Folder Structure

```text
src/
├── db/
│   ├── client.ts        <-- Drizzle client factory
│   └── schema.ts        <-- Database table definitions
├── lib/
│   ├── api.ts           <-- High-performance Native Fetch Wrapper
│   ├── env.ts           <-- Zod Env Schema & Type Definitions
│   ├── errors.ts        <-- Domain Error definitions
│   ├── grace.ts         <-- Graceful shutdown utility
│   └── logger.ts        <-- Centralized pino logging factory
├── middleware/
│   ├── config.ts        <-- Global Env Validation Middleware
│   ├── exception.ts     <-- Global Hono Error Handler
│   └── auth.ts          <-- Custom logic (API Keys, JWT, etc.)
├── services/
│   └── user.service.ts  <-- Business Logic (Drizzle Queries)
├── routes/
│   └── user.route.ts    <-- Controllers (HTTP Request/Response)
├── app.ts               <-- App setup & Error Handling
└── server.ts            <-- Server entry (Bun specific)


```

---

## 1. Environment & Types (`src/lib/env.ts`)

```typescript
import { z } from 'zod';
import type { Database } from '../db/index.js';
import type { getLogger } from './logger.js';

export const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  API_KEY: z.string().min(1),
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z.coerce.number().default(3000)
});

export type Bindings = z.infer<typeof envSchema>;

export type Variables = {
  logger: ReturnType<typeof getLogger>;
  db: Database;
};


```

---

## 2. Smart Logger Factory (`src/lib/logger.ts`)

```typescript
import pino from 'pino';

/**
 * Factory for creating configured pino instances.
 * @param env - The current NODE_ENV
 * @param isInternal - If true, uses sync mode to ensure logs appear during crashes/shutdowns
 */

// Cache the logger instance
let logger: pino.Logger | null = null;

export const getLogger = (env: string = 'development', isInternal = false) => {
  // Return the existing logger if it exists
  if (logger && !isInternal) return logger;

  const instance = pino({
    level: env === 'development' ? 'debug' : 'info',
    transport:
      env === 'development'
        ? {
            target: 'pino-pretty',
            options: {
              sync: isInternal,
              colorize: true,
              levelFirst: true,
              translateTime: 'SYS:standard',
              ignore: 'pid,hostname',
              customColors:
                'info:cyan,warn:magenta,error:red,fatal:bgRed,debug:white',
              useOnlyCustomProps: false
            }
          }
        : undefined
  });

  // Only cache the "standard" logger, not the "internal/sync" one
  if (!isInternal) {
    logger = instance;
  }

  return instance;
};

export type Logger = ReturnType<typeof getLogger>;


```

---

## 3. Core Middleware

### Config & Logger (`src/middleware/config.ts`)

```typescript
import { env } from 'hono/adapter';
import { createMiddleware } from 'hono/factory';
import { getDb } from '../db/index.js';
import { type Bindings, envSchema } from '../lib/env.js';
import { getLogger } from '../lib/logger.js';

let cachedConfig: {
  db: ReturnType<typeof getDb>;
  logger: ReturnType<typeof getLogger>;
} | null = null;

export const configMiddleware = createMiddleware(async (c, next) => {
  if (!cachedConfig) {
    const runtimeEnv = env<Bindings>(c);

    const result = envSchema.safeParse(runtimeEnv);

    if (!result.success) {
      console.error('❌ Env Validation Failed:', result.error.format());
      throw new Error('Invalid Environment');
    }

    cachedConfig = {
      db: getDb(result.data.DATABASE_URL),
      logger: getLogger(result.data.NODE_ENV)
    };
  }

  const reqId = (c.req.header('x-request-id') || crypto.randomUUID()) as string;

  // Create the Pino Child Logger (Inherits parent config + adds reqId)
  const requestLogger = cachedConfig.logger.child({ reqId });

  // Inject into Context
  c.set('db', cachedConfig.db);
  c.set('logger', requestLogger);

  // Echo back for the client
  c.res.headers.set('x-request-id', reqId);

  await next();
});


```

---

## 4. The Database Layer (`src/db/client.ts`)

```typescript
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

/**
 * Persists in the Isolate/Process memory.
 * - Serverless: Lives as long as the "Warm Start".
 * - Serverful: Lives until the process restarts (e.g., bun --watch).
 */
let db: ReturnType<typeof drizzle<typeof schema>> | null = null;

export const getDb = (url: string) => {
  // If the instance exists, return it. Simple. Fast.
  if (db) return db;

  // Only happens once per lifecycle
  const client = neon(url);
  db = drizzle(client, { schema });

  return db;
};

export type Database = ReturnType<typeof getDb>;


```

---

## 5. Service Layer (`src/services/user.service.ts`)

```typescript
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import type { Database } from '../db/client.js';
import { users } from '../db/schema.js';
import { api } from '../lib/api.js';
import { NotFoundError } from '../lib/errors.js';
import type { Logger } from '../lib/logger.js';

const GitHubUserSchema = z.object({
  login: z.string(),
  id: z.number(),
  avatar_url: z.string().url()
});

export type GitHubUser = z.infer<typeof GitHubUserSchema>;

// --- Database Operations ---

export async function getAllUsers(db: Database) {
  return await db.select().from(users);
}

export async function getUserById(db: Database, id: number) {
  const user = await db.query.users.findFirst({
    where: eq(users.id, id)
  });

  if (!user) {
    throw new NotFoundError(`User with ID ${id} vanished into deep space`);
  }

  return user;
}

export async function createUser(
  db: Database,
  data: { name: string; email: string }
) {
  const [newUser] = await db.insert(users).values(data).returning();
  return newUser;
}

// --- External API Operations ---

export async function getGitHubProfile(username: string, logger: Logger) {
  return await api(`https://api.github.com/users/${username}`, {
    schema: GitHubUserSchema, // Automated validation
    logger
  });
}


```

---

## 6. Route Layer (`src/routes/user.route.ts`)

```typescript
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';
import type { Bindings, Variables } from '../lib/env.js';
import { reply } from '../lib/response.js';
import * as UserService from '../services/user.service.js';

const userRoutes = new Hono<{ Bindings: Bindings; Variables: Variables }>();

const userSchema = z.object({
  name: z.string().min(2),
  email: z.string().email()
});

// --- Routes ---

userRoutes.get('/', async (c) => {
  const logger = c.get('logger');
  logger.info('🛰️ Fetching all users at Ludicrous Speed');

  const db = c.get('db');
  const data = await UserService.getAllUsers(db);

  return reply.ok(c, data);
});

userRoutes.get('/:id', async (c) => {
  const id = Number(c.req.param('id'));
  const db = c.get('db');

  const user = await UserService.getUserById(db, id);

  return reply.ok(c, user);
});

userRoutes.post('/', zValidator('json', userSchema), async (c) => {
  const logger = c.get('logger');
  const validated = c.req.valid('json');
  const db = c.get('db');

  const newUser = await UserService.createUser(db, validated);

  logger.info({ msg: '👤 New user created', userId: newUser.id });

  return reply.ok(c, newUser, 201);
});

userRoutes.get('/github/:username', async (c) => {
  const username = c.req.param('username');
  const logger = c.get('logger'); // Traceable child logger from configMiddleware

  // Pass logger into the service to maintain the trace through the external fetch
  const profile = await UserService.getGitHubProfile(username, logger);

  return reply.ok(c, profile);
});

export default userRoutes;


```

---

## 7. The App Core (`src/app.ts`)

```typescript
import { Hono } from 'hono';
import type { Bindings, Variables } from './lib/env.js';
import { configMiddleware } from './middleware/config.js';
import { globalErrorHandler } from './middleware/exception.js';

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

app.use('*', configMiddleware);
app.onError(globalErrorHandler);

app.get('/', (c) => {
  return c.json({ message: 'Welcome to the Ludicrous Speed API!' });
});

export default app;


```

---

## 8. The Bun Host (`src/server.ts`)

```typescript
import app from './app.js';
import { closeWithGrace } from './lib/grace.js';
import { getLogger } from './lib/logger.js';

const logger = getLogger(process.env.NODE_ENV || 'development', true);

const server = Bun.serve({
  fetch: app.fetch,
  port: process.env.PORT || 3000
});

logger.info(`
🚀 LUDICROUS SPEED: ACTIVE
--------------------------
Runtime: Bun ${Bun.version}
URL: http://localhost:${server.port}
--------------------------
`);

closeWithGrace(logger, { delay: 5000 }, async () => {
  server.stop(false);
  logger.info('Airlock sealed. Draining remaining connections...');
});


```
