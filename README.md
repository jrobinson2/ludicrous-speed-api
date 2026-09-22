# 🛸 Ludicrous Speed

> "Light speed is too slow. We have to go straight to... **Ludicrous Speed.**"

**Ludicrous Speed** is a high-performance, **runtime-agnostic** API boilerplate built for the modern edge.

It is designed to run anywhere—**Bun, Node, or edge runtimes**—and adapts automatically to each environment’s capabilities.

This architecture is a “Universal Vessel,” powered by **Hono**, **Drizzle ORM**, and **Neon**.

---

## 🧠 Design Philosophy

Ludicrous Speed is built around a strict principle:

> **Correctness is request-safe.
> Performance is process-scoped.**

### Request-Safe Correctness (Edge-Safe by Default)

No request ever assumes warm state. If a single request executes in total isolation (cold start), the system behaves perfectly.

* Env variables are validated on first contact.
* No business logic depends on global state.
* Initialization is **idempotent**.

### Opportunistic Process Reuse (Lazy Singletons)

The system **detects and benefits from reuse when available**, without paying for it on every request. Expensive factories (DB clients, loggers, validated env) are **lazy singletons**—built on first use, then memoized at module scope for the rest of the process (or isolate) lifetime.

* Nothing is initialized until the first request needs it.
* Once built, the same instance is reused for every call after — the input (env vars, DB URL) is **not** re-checked or re-validated on later calls. Config doesn't rotate mid-process, so re-validating on every request would just be wasted work.
* Tests that need a clean slate reset the module explicitly (`resetConfigCache`, `closeDb`) rather than relying on the factory to detect a change.

Within that, the DB layer also adapts its **strategy** to the runtime on that first call:

| Runtime | DB Strategy | Connection Model | Notes |
| --- | --- | --- | --- |
| Cloudflare Workers | Neon HTTP | No TCP | Edge-safe, short-lived |
| Bun / Node.js | Neon TCP | Connection pool | Fast server-grade throughput |

---

## 🏗️ Architectural Overview

Ludicrous Speed is built on **“Separation of Concerns at Warp Velocity.”**

* **The Engine (Runtime):** **Bun / Node / Edge** adapts plumbing automatically.
* **The Navigator (Framework):** **Hono** provides a lightweight, web-standard router.
* **The Reactor (Database):** **Neon** switches between HTTP and TCP pooling dynamically.
* **The Hull (ORM):** **Drizzle** ensures type-safe SQL with zero runtime bloat.
* **The Shields (Validation):** **Zod** handles end-to-end safety for Envs and APIs.

---

## 📂 Recommended Folder Structure

```text
src/
├── db/          <-- Drizzle engine & schema definitions
├── lib/         <-- Shared logic (Env, Logger, Errors, Graceful Shutdown)
├── middleware/  <-- Config validation & Global error handling
├── services/    <-- Business logic (Drizzle Queries)
├── routes/      <-- Controllers (Hono Request/Response)
├── app.ts       <-- App composition
└── server.ts    <-- Bun-specific entry point

```

---

## 📊 Performance Benchmarks (Honest, Not Hype)

| Velocity Level | Latency | Status |
| --- | --- | --- |
| Light Speed | > 150ms | **Too slow!** |
| Ridiculous Speed | 100ms - 150ms | **Stop Being a Chicken!** |
| Ludicrous Speed | 20ms - 100ms | **GO!!!** |
| **Plaid** | **< 20ms** | **They've Gone to Plaid!** |

---

## ⚡ Implementation Highlights

### 1. The Adaptive Engine (The Magic)

The system detects if the runtime supports TCP (Bun/Node) or requires HTTP (Edge) and initializes the optimal Drizzle driver automatically — once, on the first call, then reuses it for the life of the process/isolate.

<details>
<summary><b>View src/db/reactor.ts</b></summary>

```ts
import { neon, Pool } from '@neondatabase/serverless';
import { drizzle as http } from 'drizzle-orm/neon-http';
import { drizzle as server } from 'drizzle-orm/neon-serverless';
import { getRuntimeKey } from 'hono/adapter';
import { schema } from './schema/index.js';

let db: Database | null = null;
let pool: Pool | null = null; // only set when the pooled driver is in use

const usesPool = () => {
  const runtime = getRuntimeKey();
  return runtime === 'bun' || runtime === 'node';
};

export const getDb = (url: string): Database => {
  if (db) return db;

  if (usesPool()) {
    const p = new Pool({ connectionString: url });
    db = server({ client: p, schema }); // Server Strategy
    pool = p;
  } else {
    db = http({ client: neon(url), schema }); // Edge Strategy
  }

  return db;
};

```

</details>

### 2. Request-Local Context (The DX)

The `configMiddleware` validates environment variables once and injects the `db` and a child `logger` (with a unique Request ID) into the Hono context.

<details>
<summary><b>View src/middleware/config.ts</b></summary>

```ts
import { env } from 'hono/adapter';
import { createMiddleware } from 'hono/factory';
import { getDb } from '../db/reactor.js';
import { type Bindings, getConfig, type Variables } from '../lib/env.js';
import { getLogger } from '../lib/logger.js';

export const configMiddleware = createMiddleware<{
  Bindings: Bindings;
  Variables: Variables;
}>(async (c, next) => {
  const config = getConfig(env<Bindings>(c));

  const logger = getLogger(config.NODE_ENV).with({
    reqId: c.get('requestId'),
    method: c.req.method,
    path: c.req.path
  });

  c.set('config', config);
  c.set('db', getDb(config.DATABASE_URL));
  c.set('logger', logger);

  await next();
});

```

</details>

### 3. Smart Logging & Plumbing

The system includes a production-ready `PlaidLogger` and graceful shutdown utilities out of the box.

<details>
<summary><b>View Internal Plumbing Details</b></summary>

* **Logger:** Structured JSON logging with `child` context support.
* **Validation:** Centralized Zod schema for the Runtime Environment (abstracted via Hono for Node, Bun, and Edge).
* **Error Shield:** Global Hono error handler that converts domain errors to standard HTTP responses.

</details>

---

## 🧪 Getting Started

### 1. Install `mise-en-place`

This project uses **mise** to manage tool versions (including the project-specific Bun version).

#### macOS (Preferred – Homebrew)

```bash
brew install mise
```

#### Any Platform (Official Installer)

If you prefer the official installer or are not on macOS, follow the instructions here:
👉 [https://mise.jdx.dev/getting-started.html](https://mise.jdx.dev/getting-started.html)

After installation, ensure `mise` is available in your shell:

```bash
mise --version
```

---

### 2. Enable Automatic Tool Activation

To make **mise** automatically activate the correct tool versions whenever you `cd` into the project:

```bash
# macOS / Linux (Zsh)
echo 'eval "$(mise activate zsh)"' >> ~/.zshrc
source ~/.zshrc

# macOS / Linux (Bash)
echo 'eval "$(mise activate bash)"' >> ~/.bashrc
source ~/.bashrc
```

```powershell
# Windows PowerShell
# Add this line to your PowerShell profile (run `$PROFILE` to see its path)
iex "& { $(mise activate powershell) }"
```

> **Notes:**
>
> * On Windows, if you’re using **WSL**, use the Bash/Zsh instructions above.
> * Automatic activation ensures the correct versions of Bun, Node, and other tools are loaded whenever you enter the project directory.

---

### 3. Install Tooling Versions

Clone the repo, then from the **root of the project** (where `mise.toml` is located), run the command below:

```bash
cd ludicrous-speed
mise use
```

> `mise use` reads the `mise.toml` in the current directory, installs any missing tools required by this project (like Bun), and activates them for your current shell session.

---

### 4. Install Dependencies

Once Bun is installed by `mise`, install dependencies:

```bash
bun install
```

---

### 5. Configure Environment Variables

From the root of the project, run the command below:

```bash
cp .env.example .env
```

Then open `.env.example` and follow the inline comments to configure:

* Your Neon database connection string
* Better Auth secrets and application URLs

Finally, update the copied `.env` file with your **real values**.

---

### 6. Run the Dev Server

```bash
bun run dev
```

Your API is now running at **Ludicrous Speed** 🚀

---
