import { eq } from 'drizzle-orm';
import { z } from 'zod';
import type { Database } from '../db/reactor.js';
import { user } from '../db/schema/index.js';
import { api } from '../lib/api.js';
import { NotFoundError } from '../lib/errors.js';
import type { Logger } from '../lib/logger.js';

const GitHubuserchema = z.object({
  login: z.string(),
  id: z.number(),
  avatar_url: z.url()
});

export type GitHubUser = z.infer<typeof GitHubuserchema>;

// --- Database Operations ---

export async function getAlluser(db: Database) {
  return await db.select().from(user);
}

// --- External API Operations ---

export async function getGitHubProfile(username: string, logger: Logger) {
  return await api(`https://api.github.com/user/${username}`, {
    schema: GitHubuserchema, // Automated validation
    logger
  });
}
