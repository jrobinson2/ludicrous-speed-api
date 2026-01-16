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
