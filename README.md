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
import { getLogger } from './logger';

export const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  API_KEY: z.string().min(1),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
});

export type Bindings = z.infer<typeof envSchema>;

export type Variables = {
  logger: ReturnType<typeof getLogger>;
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
import { envSchema, Bindings, Variables } from '../lib/env';
import { getLogger } from '../lib/logger';
import { HTTPException } from 'hono/http-exception';

export const configMiddleware = createMiddleware<{ Bindings: Bindings; Variables: Variables }>(
  async (c, next) => {
    const result = envSchema.safeParse(c.env);
    
    if (!result.success) {
      console.error('❌ Invalid Environment Variables:', result.error.format());
      throw new HTTPException(500, { message: 'Server Configuration Error' });
    }

    // Inject logger into request context
    c.set('logger', getLogger(result.data.NODE_ENV));
    
    await next();
  }
);


```

---

## 4. The Database Layer (`src/db/index.ts`)

```typescript
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

export const getDb = (databaseUrl: string) => {
  const sql = neon(databaseUrl);
  return drizzle({ client: sql, schema });
};

export type Database = ReturnType<typeof getDb>;


```

---

## 5. Service Layer (`src/services/user.ts`)

```typescript
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import * as api from '../lib/api.js';
import { NotFoundError } from '../lib/errors.js';
import { users } from '../db/schema.js';
import type { Database } from '../db/index.js';

const GitHubUserSchema = z.object({
  login: z.string(),
  id: z.number(),
  avatar_url: z.string().url(),
});

export type GitHubUser = z.infer<typeof GitHubUserSchema>;

export async function getAllUsers(db: Database) {
  return await db.select().from(users);
}

export async function getUserById(db: Database, id: number) {
  const user = await db.query.users.findFirst({
    where: eq(users.id, id),
  });

  if (!user) throw new NotFoundError(`User with ID ${id} not found`);
  return user;
}

export async function createUser(db: Database, data: { name: string; email: string }) {
  const [newUser] = await db.insert(users).values(data).returning();
  return newUser;
}

export async function getGitHubProfile(username: string) {
  return await api.get<GitHubUser>(`https://api.github.com/users/${username}`, {
    schema: GitHubUserSchema
  });
}

```

---

## 6. Route Layer (`src/routes/user.ts`)

```typescript
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import * as UserService from '../services/user.js';
import { getDb } from '../db/index.js';
import type { Bindings, Variables } from '../lib/env.js';

const userRoutes = new Hono<{ Bindings: Bindings; Variables: Variables }>();

const userSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
});

userRoutes.get('/', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const data = await UserService.getAllUsers(db);
  return c.json({ success: true, data });
});

userRoutes.get('/:id', async (c) => {
  const id = Number(c.req.param('id'));
  const db = getDb(c.env.DATABASE_URL);
  const user = await UserService.getUserById(db, id);
  return c.json({ success: true, data: user });
});

userRoutes.post('/', zValidator('json', userSchema), async (c) => {
  const validated = c.req.valid('json');
  const db = getDb(c.env.DATABASE_URL);
  const newUser = await UserService.createUser(db, validated);
  return c.json({ success: true, data: newUser }, 201);
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
