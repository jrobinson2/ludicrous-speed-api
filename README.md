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
│   ├── index.ts      <-- Drizzle client factory
│   └── schema.ts     <-- Database table definitions
├── lib/
│   ├── api.ts        <-- High-performance Native Fetch Wrapper
│   ├── env.ts        <-- Zod Env Schema & Type Definitions
│   ├── errors.ts     <-- Domain Error definitions
│   ├── grace.ts      <-- Graceful shutdown utility
│   └── logger.ts     <-- Centralized pino logging factory
├── middleware/
│   ├── config.ts     <-- Global Env Validation Middleware
│   ├── exception.ts  <-- Global Hono Error Handler
│   └── auth.ts       <-- Custom logic (API Keys, JWT, etc.)
├── services/
│   └── user.ts       <-- Business Logic (Drizzle Queries)
├── routes/
│   └── user.ts       <-- Controllers (HTTP Request/Response)
├── app.ts            <-- App setup & Error Handling
└── index.ts          <-- Server entry (Bun specific)


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

export const getLogger = (env: string, isInternal = false) => pino({
  level: env === 'development' ? 'debug' : 'info',
  transport:
    env === 'development'
      ? {
          target: 'pino-pretty',
          options: {
            sync: isInternal, // Forced sync for lifecycle logs to prevent lost output
            colorize: true,
            levelFirst: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
            customColors: 'info:cyan,warn:magenta,error:red,fatal:bgRed,debug:white',
            useOnlyCustomProps: false
          }
        }
      : undefined
});


```

---

## 3. Core Middleware

### Config & Logger (`src/middleware/config.ts`)

```typescript
import { createMiddleware } from 'hono/factory';
import { HTTPException } from 'hono/http-exception';
import { getDb } from '../db/index.js';
import { type Bindings, envSchema, type Variables } from '../lib/env.js';
import { getLogger } from '../lib/logger.js';

export const configMiddleware = createMiddleware<{
  Bindings: Bindings;
  Variables: Variables;
}>(async (c, next) => {
  const result = envSchema.safeParse(c.env);

  if (!result.success) {
    console.error('❌ Invalid Environment Variables:', result.error.format());
    throw new HTTPException(500, { message: 'Server Configuration Error' });
  }

  // Inject logger into request context
  c.set('logger', getLogger(result.data.NODE_ENV));
  c.set('db', getDb(result.data.DATABASE_URL)); // Injected once per request

  await next();
});


```

---

## 4. The Database Layer (`src/db/index.ts`)

```typescript
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

let db: ReturnType<typeof drizzle<typeof schema>> | null = null;

export const getDb = (url: string) => {
  if (db) return db;

  const client = neon(url);
  db = drizzle(client, { schema });
  return db;
};

export type Database = ReturnType<typeof getDb>;


```

---

## 5. Service Layer (`src/services/user.ts`)

```typescript
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';
import type { Bindings, Variables } from '../lib/env.js';
import { reply } from '../lib/response.js'; // Our new Ludicrous Speed helper
import * as UserService from '../services/user.js';

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

  // Service throws NotFoundError if missing -> Global Handler catches it
  const user = await UserService.getUserById(db, id);

  return reply.ok(c, user);
});

userRoutes.post('/', zValidator('json', userSchema), async (c) => {
  const logger = c.get('logger');
  const validated = c.req.valid('json');
  const db = c.get('db');

  const newUser = await UserService.createUser(db, validated);

  logger.info({ msg: '👤 New user created', userId: newUser.id });

  // Using 201 Created for a successful POST
  return reply.ok(c, newUser, 201);
});

userRoutes.get('/github/:username', async (c) => {
  const username = c.req.param('username');
  const profile = await UserService.getGitHubProfile(username);

  return reply.ok(c, profile);
});

export default userRoutes;


```

---

## 6. Route Layer (`src/routes/user.ts`)

```typescript
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';
import type { Bindings, Variables } from '../lib/env.js';
import * as UserService from '../services/user.js';

// 1. Pass types to Hono to enable autocomplete for c.get('logger') and c.env
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

  return c.json({ success: true, data });
});

userRoutes.get('/:id', async (c) => {
  const id = Number(c.req.param('id'));
  const db = c.get('db');

  // Note: If user is not found, UserService throws NotFoundError
  // which is caught by our global exception handler!
  const user = await UserService.getUserById(db, id);

  return c.json({ success: true, data: user });
});

userRoutes.post('/', zValidator('json', userSchema), async (c) => {
  const logger = c.get('logger');
  const validated = c.req.valid('json');
  const db = c.get('db');

  const newUser = await UserService.createUser(db, validated);

  logger.info({ msg: '👤 New user created', userId: newUser.id });

  return c.json({ success: true, data: newUser }, 201);
});

// Example route for the GitHub API service we added
userRoutes.get('/github/:username', async (c) => {
  const username = c.req.param('username');
  const profile = await UserService.getGitHubProfile(username);

  return c.json({ success: true, data: profile });
});

export default userRoutes;


```

---

## 7. The App Core (`src/app.ts`)

```typescript
import { Hono } from 'hono';
import { logger as honoLogger } from 'hono/logger';
import { secureHeaders } from 'hono/secure-headers';
import { Bindings, Variables } from './lib/env';
import { configMiddleware } from './middleware/config';
import { globalErrorHandler } from './middleware/exception';
import userRoutes from './routes/user';

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

app.use('*', honoLogger());
app.use('*', secureHeaders());
app.use('*', configMiddleware);

app.onError(globalErrorHandler);

app.route('/api/users', userRoutes);

export default app;

```

---

## 8. The Bun Host (`src/index.ts`)

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
