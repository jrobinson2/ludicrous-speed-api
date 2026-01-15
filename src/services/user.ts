import { eq } from 'drizzle-orm';
import { z } from 'zod';
import type { Database } from '../db/index.js';
import { users } from '../db/schema.js';
import * as api from '../lib/api.js';
import { NotFoundError } from '../lib/errors.js';

/**
 * 🛡️ Validation Schemas for External APIs
 */
const GitHubUserSchema = z.object({
  login: z.string(),
  id: z.number(),
  avatar_url: z.string().url()
});

export type GitHubUser = z.infer<typeof GitHubUserSchema>;

// --- Database Operations ---

/**
 * We pass 'db' as an argument so this service can stay
 * environment-agnostic and transaction-aware.
 */
export async function getAllUsers(db: Database) {
  return await db.select().from(users);
}

export async function getUserById(db: Database, id: number) {
  // Using .findFirst is cleaner for single record lookups
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

export async function getGitHubProfile(username: string) {
  // Our global exception handler will catch any failures from this fetch
  return await api.get<GitHubUser>(`https://api.github.com/users/${username}`, {
    schema: GitHubUserSchema
  });
}
