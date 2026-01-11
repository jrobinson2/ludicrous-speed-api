# 🛸 Ludicrous Speed

> "Light speed is too slow. We have to go straight to... **Ludicrous Speed.**"

**Ludicrous Speed** is a high-performance API boilerplate built for the modern edge. By combining **Hono’s** ultrafast routing, **Drizzle’s** type-safe ORM, and **Neon’s** serverless Postgres, we achieve latencies that shouldn't even be legal.

---

### 📊 Performance Benchmarks (Node.js 25 Edition)

*Optimized for reliability and industry-standard deployments.*

| Velocity Level | Latency | Status |
| --- | --- | --- |
| Light Speed | > 200ms | **Too slow!** |
| Ridiculous Speed | 100ms - 200ms | **Stop Being a Chicken!** |
| **Ludicrous Speed** | **< 80ms** | **GO!!!** |

---

## 📂 Recommended Folder Structure

```text
src/
├── db/
│   ├── index.ts      <-- Drizzle client & Neon HTTP Connection
│   └── schema.ts     <-- Database table definitions
├── lib/
│   └── errors.ts     <-- Domain Error definitions
├── middleware/
│   └── auth.ts       <-- Custom logic (API Keys, JWT, etc.)
├── services/
│   └── user.ts       <-- Business Logic (Drizzle Queries)
├── routes/
│   └── user.ts       <-- Controllers (HTTP Request/Response)
├── app.ts            <-- App setup & Error Handling
└── index.ts          <-- Server entry & Graceful shutdown

```

---

## 1. The Database Layer (`src/db/index.ts`)

```typescript
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle({ client: sql, schema });

```

---

## 2. Domain Errors (`src/lib/errors.ts`)

```typescript
export class NotFoundError extends Error {
  constructor(public message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends Error {
  constructor(public message: string) {
    super(message);
    this.name = 'ConflictError';
  }
}

```

---

## 3. Custom Middleware (`src/middleware/auth.ts`)

```typescript
import { createMiddleware } from 'hono/factory';
import { HTTPException } from 'hono/http-exception';

export const authMiddleware = createMiddleware(async (c, next) => {
  const apiKey = c.req.header('X-API-KEY');

  if (!apiKey || apiKey !== process.env.API_KEY) {
    throw new HTTPException(401, { message: 'Unauthorized' });
  }

  await next();
});

```

---

## 4. The Service Layer (`src/services/user.ts`)

```typescript
import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';
import { NotFoundError } from '../lib/errors';

export const UserService = {
  async getAll() {
    return await db.select().from(users);
  },
  
  async getById(id: number) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    if (!user) {
      throw new NotFoundError(`User with ID ${id} not found`);
    }
    return user;
  },

  async create(data: { name: string; email: string }) {
    const [newUser] = await db.insert(users).values(data).returning();
    return newUser;
  }
};

```

---

## 5. The Route Layer (`src/routes/user.ts`)

```typescript
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { UserService } from '../services/user';

const userRoutes = new Hono();

const userSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
});

userRoutes.get('/', async (c) => {
  const data = await UserService.getAll();
  return c.json(data);
});

userRoutes.get('/:id', async (c) => {
  const id = Number(c.req.param('id'));
  const user = await UserService.getById(id); 
  return c.json(user);
});

userRoutes.post('/', zValidator('json', userSchema), async (c) => {
  const validated = c.req.valid('json');
  const newUser = await UserService.create(validated);
  return c.json(newUser, 201);
});

export default userRoutes;

```

---

## 6. The App Logic (`src/app.ts`)

```typescript
import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { secureHeaders } from 'hono/secure-headers';
import { HTTPException } from 'hono/http-exception';
import { NotFoundError, ConflictError } from './lib/errors';
import { authMiddleware } from './middleware/auth';
import userRoutes from './routes/user';

const app = new Hono();

app.use('*', logger());
app.use('*', secureHeaders());

// Global Error Handler
app.onError((err, c) => {
  if (err instanceof HTTPException) return err.getResponse();
  if (err instanceof NotFoundError) return c.json({ error: err.message }, 404);
  if (err instanceof ConflictError) return c.json({ error: err.message }, 409);

  console.error(`[Unhandled Error]: ${err.stack}`);
  return c.json({ error: 'Internal Server Error' }, 500);
});

app.use('/api/*', authMiddleware);
app.route('/api/users', userRoutes);

export default app;

```

---

## 7. The Server Runner (`src/index.ts`)

```typescript
import { serve } from '@hono/node-server';
import closeWithGrace from 'close-with-grace';
import app from './app';

const server = serve({
  fetch: app.fetch,
  port: 3000
}, (info) => {
  console.log(`🚀 Ludicrous Speed active at http://localhost:${info.port}`);
});

closeWithGrace({ delay: 5000 }, async ({ signal, err }) => {
  if (err) console.error(err);
  server.close();
  process.exit(err ? 1 : 0);
});

```

---
